import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeftRight, Boxes, Pencil, PackageCheck, PackageX, ShieldCheck, TrendingDown } from 'lucide-react'
import type { Product } from '@/api/types'
import { useActivity, useBulkProducts, useInventory, useProducts } from '@/api/hooks'
import { usePreferences } from '@/app/preferences'
import { formatDateTime, formatNumber, formatRelative } from '@/lib/format'
import { syncStatusMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { ActivityList } from '@/components/activity-list'
import { BulkEditModal } from '@/components/bulk-edit-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { SearchInput, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { ProductThumb } from '@/components/ui/product-thumb'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { useToast } from '@/components/ui/toast'
import { ProductDrawer } from './products/product-drawer'

export default function InventoryPage() {
  const [params, setParams] = useSearchParams()
  const { preferences } = usePreferences()
  const { toast } = useToast()
  const [selected, setSelected] = useState<Set<string | number>>(new Set())
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [term, setTerm] = useState(params.get('search') ?? '')

  const search = params.get('search') ?? ''
  const stockState = params.get('stock_state') ?? ''
  const mismatchOnly = params.get('mismatch') === '1'
  const page = Number(params.get('page') ?? 1)
  const perPage = Number(params.get('per_page') ?? 20)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
    setSelected(new Set())
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== term) update({ search: term || null })
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  const { data, isLoading, isError, error, refetch } = useProducts({
    search,
    stock_state: stockState || undefined,
    mismatch: mismatchOnly ? 'true' : undefined,
    page,
    per_page: perPage,
    sort: 'wc_stock',
    order: 'asc',
  })
  const { data: summary, isLoading: summaryLoading } = useInventory(preferences.activeStoreId)
  const { data: stockActivity, isLoading: activityLoading } = useActivity({ type: 'stock', limit: 5 })
  const bulkMutation = useBulkProducts()

  const rows = data?.items ?? []
  const selectedProducts = rows.filter((row) => selected.has(row.id))

  const stockTone = (stock: number) =>
    stock === 0 ? 'bg-danger-soft text-danger' : stock <= 5 ? 'bg-warning-soft text-warning' : 'bg-muted text-foreground'

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'محصول',
      className: 'max-w-[280px]',
      cell: (product) => (
        <div className="flex items-center gap-2.5">
          <ProductThumb id={product.id} name={product.name} />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-foreground">{product.name}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{product.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'wc_stock',
      header: 'موجودی ووکامرس',
      align: 'center',
      cell: (product) => (
        <span className={cn('num inline-flex min-w-10 justify-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold', stockTone(product.wc_stock))}>
          {formatNumber(product.wc_stock)}
        </span>
      ),
    },
    {
      key: 'snapp_stock',
      header: 'موجودی اسنپ‌شاپ',
      align: 'center',
      cell: (product) =>
        product.snapp_stock === null ? (
          <span className="text-[11px] text-muted-foreground">—</span>
        ) : (
          <span className={cn('num inline-flex min-w-10 justify-center rounded-md px-2 py-0.5 text-[11.5px]', product.snapp_stock === product.wc_stock ? 'bg-muted text-foreground' : 'bg-warning-soft text-warning')}>
            {formatNumber(product.snapp_stock)}
          </span>
        ),
    },
    {
      key: 'diff',
      header: 'مغایرت',
      align: 'center',
      cell: (product) => {
        if (product.snapp_stock === null) return <Badge variant="neutral">بدون تطبیق</Badge>
        const diff = product.snapp_stock - product.wc_stock
        if (diff === 0) return <span className="text-[10.5px] text-muted-foreground">بدون اختلاف</span>
        return (
          <Badge variant={Math.abs(diff) > 5 ? 'danger' : 'warning'}>
            <ArrowLeftRight className="h-3 w-3" />
            {diff > 0 ? '+' : ''}
            {formatNumber(diff)}
          </Badge>
        )
      },
    },
    {
      key: 'source',
      header: 'منبع موجودی',
      cell: (product) => (
        <Badge variant="outline">
          {product.stock_source === 'woocommerce' ? 'ووکامرس' : product.stock_source === 'snappshop' ? 'اسنپ‌شاپ' : 'دستی'}
        </Badge>
      ),
    },
    {
      key: 'sync',
      header: 'همگام‌سازی',
      cell: (product) => (
        <Badge variant={syncStatusMeta[product.sync_status].tone} dot>
          {syncStatusMeta[product.sync_status].label}
        </Badge>
      ),
    },
    {
      key: 'updated',
      header: 'آخرین تغییر',
      cell: (product) => (
        <span className="text-[11px] text-muted-foreground" title={formatDateTime(product.last_updated)}>
          {formatRelative(product.last_updated)}
        </span>
      ),
    },
  ]

  const activeFilters = [stockState === 'low' ? 'موجودی کم' : stockState === 'out' ? 'ناموجود' : null, mismatchOnly ? 'دارای مغایرت' : null].filter(
    Boolean,
  ) as string[]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="مدیریت موجودی انبار"
        description="مقایسهٔ موجودی ووکامرس و اسنپ‌شاپ، شناسایی مغایرت‌ها و به‌روزرسانی گروهی موجودی."
        actions={
          <Button variant="primary" size="sm" disabled={selected.size === 0} onClick={() => setBulkOpen(true)} startIcon={<Boxes className="h-3.5 w-3.5" />}>
            آپدیت گروهی موجودی ({formatNumber(selected.size)})
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="کل محصولات" value={formatNumber(summary?.total)} icon={Boxes} accent="info" loading={summaryLoading} footer="در انبار ووکامرس" />
        <StatCard label="موجود" value={formatNumber(summary?.in_stock)} icon={PackageCheck} accent="success" loading={summaryLoading} footer="بیش از آستانه موجودی کم" />
        <StatCard label="موجودی کم" value={formatNumber(summary?.low_stock)} icon={TrendingDown} accent="warning" loading={summaryLoading} footer="نیازمند تأمین" />
        <StatCard label="ناموجود" value={formatNumber(summary?.out_of_stock)} icon={PackageX} accent="danger" loading={summaryLoading} footer="قابل فروش نیست" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <Card className="mb-3 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="جست‌وجوی محصول یا SKU…"
                className="min-w-[220px] flex-1 sm:max-w-xs"
              />
              <Select
                aria-label="وضعیت موجودی"
                value={stockState}
                onChange={(event) => update({ stock_state: event.target.value || null })}
                className="w-auto min-w-[130px]"
              >
                <option value="">همه موجودی‌ها</option>
                <option value="low">موجودی کم</option>
                <option value="out">ناموجود</option>
              </Select>
              <Button
                variant={mismatchOnly ? 'primary' : 'outline'}
                size="sm"
                onClick={() => update({ mismatch: mismatchOnly ? null : '1' })}
                startIcon={<AlertTriangle className="h-3.5 w-3.5" />}
              >
                فقط مغایرت‌ها ({formatNumber(summary?.mismatched)})
              </Button>
              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTerm('')
                    setParams(new URLSearchParams(), { replace: true })
                  }}
                >
                  پاک کردن
                </Button>
              )}
              <span className="ms-auto text-[10.5px] text-muted-foreground">
                مقایسهٔ کنار هم — رنگ نارنجی یعنی مغایرت
              </span>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{formatNumber(data?.total ?? 0)}</span> محصول
              </p>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Pencil className="h-3 w-3" />
                برای ویرایش روی محصول کلیک کنید
              </span>
            </div>
            {isError ? (
              <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
            ) : (
              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(product) => product.id}
                loading={isLoading}
                selected={selected}
                onSelectedChange={setSelected}
                onRowClick={(product) => setDrawerId(product.id)}
                skeletonRows={10}
                empty={
                  <EmptyState
                    icon={Boxes}
                    title="محصولی با این فیلترها نیست"
                    description="فیلترها را تغییر دهید یا وضعیت موجودی دیگری انتخاب کنید."
                  />
                }
              />
            )}
            <div className="border-t border-border px-3 py-2.5">
              <Pagination
                page={page}
                perPage={perPage}
                total={data?.total ?? 0}
                onPageChange={(next) => update({ page: String(next) })}
                onPerPageChange={(next) => update({ per_page: String(next) })}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>قوانین موجودی</CardTitle>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">تنظیمات از پیش تعیین‌شدهٔ انبار</p>
              </div>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="space-y-2 p-3">
              {summaryLoading
                ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)
                : summary?.rules.map((rule) => (
                    <div key={rule.id} className="rounded-lg border border-border/70 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11.5px] font-medium text-foreground">{rule.title}</p>
                        <Badge variant={rule.enabled ? 'success' : 'neutral'}>{rule.enabled ? 'فعال' : 'غیرفعال'}</Badge>
                      </div>
                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{rule.description}</p>
                    </div>
                  ))}
            </div>
            <div className="border-t border-border px-3 py-2">
              <Link to="/settings?tab=inventory" className="flex items-center justify-between text-[10.5px] text-muted-foreground hover:text-foreground">
                ویرایش قوانین در تنظیمات
                <ArrowLeftRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تاریخچه تغییرات موجودی</CardTitle>
            </CardHeader>
            <div className="pb-2">
              <ActivityList items={stockActivity} loading={activityLoading} showType={false} />
            </div>
            <div className="border-t border-border px-3 py-2">
              <Link to="/activity" className="flex items-center justify-between text-[10.5px] text-muted-foreground hover:text-foreground">
                مشاهده تاریخچه کامل
                <ArrowLeftRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <BulkEditModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        operation="stock"
        products={selectedProducts}
        loading={bulkMutation.isPending}
        title="آپدیت گروهی موجودی"
        onConfirm={({ mode, value }) => {
          bulkMutation.mutate(
            { ids: Array.from(selected).map(Number), operation: 'stock', mode, value },
            {
              onSuccess: (result) => {
                toast({
                  title: 'موجودی به‌روزرسانی شد',
                  description: `${formatNumber(result.updated)} محصول با موجودی جدید ذخیره شد.`,
                  variant: 'success',
                })
                setBulkOpen(false)
                setSelected(new Set())
              },
              onError: (error) => toast({ title: 'عملیات ناموفق بود', description: (error as Error).message, variant: 'error' }),
            },
          )
        }}
      />

      <ProductDrawer productId={drawerId} onClose={() => setDrawerId(null)} />
    </div>
  )
}
