import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, History, SearchX } from 'lucide-react'
import type { Product } from '@/api/types'
import { useBulkProducts, usePriceHistory, useProducts } from '@/api/hooks'
import { formatDateTime, formatNumber, formatPercent, formatRelative, formatToman } from '@/lib/format'
import { syncStatusMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { BulkEditModal } from '@/components/bulk-edit-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { SearchInput, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { ProductThumb } from '@/components/ui/product-thumb'
import { Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { ProductDrawer } from './products/product-drawer'

export default function PricingPage() {
  const [params, setParams] = useSearchParams()
  const { toast } = useToast()
  const [selected, setSelected] = useState<Set<string | number>>(new Set())
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [term, setTerm] = useState(params.get('search') ?? '')

  const tab = params.get('tab') === 'history' ? 'history' : 'compare'
  const search = params.get('search') ?? ''
  const conflictOnly = params.get('diff') === '1'
  const page = Number(params.get('page') ?? 1)
  const perPage = Number(params.get('per_page') ?? 20)
  const sortKey = params.get('sort') ?? 'wc_price'
  const order = (params.get('order') as 'asc' | 'desc') ?? 'desc'

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
    match_status: conflictOnly ? 'conflict' : undefined,
    page,
    per_page: perPage,
    sort: sortKey,
    order,
  })
  const { data: history, isLoading: historyLoading } = usePriceHistory({ limit: 40 })
  const bulkMutation = useBulkProducts()

  const rows = data?.items ?? []
  const selectedProducts = rows.filter((row) => selected.has(row.id))
  const priceStep = 1000

  const diffConfig = (product: Product) => {
    if (product.snapp_price === null) return null
    const diff = product.snapp_price - product.wc_price
    return {
      diff,
      percent: priceStep ? Math.round((diff / product.wc_price) * 1000) / 10 : 0,
    }
  }

  const conditions: Column<Product>[] = [
    {
      key: 'product',
      header: 'محصول',
      sortable: true,
      className: 'max-w-[300px]',
      cell: (product) => (
        <div className="flex items-center gap-2.5">
          <ProductThumb id={product.id} name={product.name} />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-foreground">{product.name}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {product.sku} • {product.category}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'wc_price',
      header: 'قیمت ووکامرس',
      sortable: true,
      align: 'end',
      cell: (product) => <span className="num text-[12px] font-medium text-foreground">{formatToman(product.wc_price)}</span>,
    },
    {
      key: 'snapp_price',
      header: 'قیمت اسنپ‌شاپ',
      sortable: true,
      align: 'end',
      cell: (product) =>
        product.snapp_price === null ? (
          <Badge variant="neutral">بدون قیمت</Badge>
        ) : (
          <span className="num text-[12px] text-foreground">{formatToman(product.snapp_price)}</span>
        ),
    },
    {
      key: 'diff',
      header: 'اختلاف قیمت',
      align: 'end',
      cell: (product) => {
        const config = diffConfig(product)
        if (!config) return <span className="text-[11px] text-muted-foreground">—</span>
        if (config.diff === 0) return <Badge variant="success">بدون اختلاف</Badge>
        const up = config.diff > 0
        return (
          <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-medium', up ? 'text-warning' : 'text-info')}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
            <span className="num">{formatNumber(Math.abs(config.diff))}</span>
            <span className="text-[10px] text-muted-foreground">({formatPercent(config.percent, true)})</span>
          </span>
        )
      },
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
      header: 'آخرین آپدیت',
      sortable: true,
      cell: (product) => (
        <span className="text-[11px] text-muted-foreground" title={formatDateTime(product.last_updated)}>
          {formatRelative(product.last_updated)}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="مدیریت قیمت‌گذاری"
        description="مقایسهٔ قیمت ووکامرس و اسنپ‌شاپ، اعمال فرمول قیمت و پیگیری تاریخچهٔ تغییرات. همهٔ مبالغ به تومان هستند."
        actions={
          <Button
            variant="primary"
            size="sm"
            startIcon={<CircleDollarSign className="h-3.5 w-3.5" />}
            disabled={selected.size === 0}
            onClick={() => setBulkOpen(true)}
          >
            اعمال فرمول ({formatNumber(selected.size)})
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(value) => update({ tab: value, page: null })}
        tabs={[
          { label: 'مقایسه قیمت‌ها', value: 'compare' },
          { label: 'تاریخچه تغییرات', value: 'history' },
        ]}
        className="mb-3"
      />

      {tab === 'compare' ? (
        <>
          <Card className="mb-3 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="جست‌وجوی محصول…"
                className="min-w-[220px] flex-1 sm:max-w-xs"
              />
              <Button
                variant={conflictOnly ? 'primary' : 'outline'}
                size="sm"
                onClick={() => update({ diff: conflictOnly ? null : '1' })}
                startIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
              >
                فقط دارای اختلاف
              </Button>
              <Select
                aria-label="تعداد در صفحه"
                value={String(perPage)}
                onChange={(event) => update({ per_page: event.target.value })}
                className="w-auto min-w-[110px]"
              >
                <option value="20">۲۰ در صفحه</option>
                <option value="50">۵۰ در صفحه</option>
                <option value="100">۱۰۰ در صفحه</option>
              </Select>
              <span className="ms-auto text-[10.5px] text-muted-foreground">
                رند کردن قیمت‌ها: {formatNumber(priceStep)} تومان
              </span>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {isError ? (
              <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
            ) : (
              <DataTable
                columns={conditions}
                rows={rows}
                rowKey={(product) => product.id}
                loading={isLoading}
                sort={{ key: sortKey, direction: order }}
                onSortChange={(key) => update({ sort: key, order: sortKey === key && order === 'desc' ? 'asc' : 'desc' })}
                selected={selected}
                onSelectedChange={setSelected}
                onRowClick={(product) => setDrawerId(product.id)}
                skeletonRows={10}
                empty={
                  <EmptyState
                    icon={SearchX}
                    title="محصولی یافت نشد"
                    description="فیلتر یا عبارت جست‌وجو را تغییر دهید."
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
                perPageOptions={[20, 50, 100]}
              />
            </div>
          </Card>
        </>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[12px] font-medium text-foreground">آخرین تغییرات قیمت</p>
            <Badge variant="outline" className="ms-auto">
              {formatNumber(history?.length ?? 0)} رکورد
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[12px]">
              <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 text-start font-medium">محصول</th>
                  <th className="px-3 py-2.5 text-end font-medium">قیمت قبلی</th>
                  <th className="px-3 py-2.5 text-end font-medium">قیمت جدید</th>
                  <th className="px-3 py-2.5 text-end font-medium">تغییر</th>
                  <th className="px-3 py-2.5 text-start font-medium">منبع</th>
                  <th className="px-3 py-2.5 text-start font-medium">زمان</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading &&
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index} className="border-b border-border/60">
                      <td className="px-3 py-2.5" colSpan={6}>
                        <div className="skeleton h-3.5 w-full" />
                      </td>
                    </tr>
                  ))}
                {!historyLoading &&
                  history?.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="max-w-[280px] truncate px-3 py-2.5 text-foreground">{entry.product_name}</td>
                      <td className="num px-3 py-2.5 text-end text-muted-foreground">{formatNumber(entry.from_price)}</td>
                      <td className="num px-3 py-2.5 text-end font-medium text-foreground">{formatNumber(entry.to_price)}</td>
                      <td
                        className={cn(
                          'num px-3 py-2.5 text-end',
                          entry.to_price > entry.from_price ? 'text-success' : entry.to_price < entry.from_price ? 'text-danger' : 'text-muted-foreground',
                        )}
                      >
                        {entry.to_price > entry.from_price ? '+' : ''}
                        {formatNumber(entry.to_price - entry.from_price)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline">
                          {entry.source === 'manual'
                            ? 'دستی'
                            : entry.source === 'bulk'
                              ? 'گروهی'
                              : entry.source === 'automation'
                                ? 'اتوماسیون'
                                : 'همگام‌سازی'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground" title={formatDateTime(entry.created_at)}>
                        {formatRelative(entry.created_at)} • {entry.actor}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!historyLoading && (history?.length ?? 0) === 0 && (
              <EmptyState icon={History} title="تاریخچه‌ای ثبت نشده است" description="با اولین تغییر قیمت، رکوردها اینجا نمایش داده می‌شوند." />
            )}
          </div>
        </Card>
      )}

      <BulkEditModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        operation="price"
        products={selectedProducts}
        loading={bulkMutation.isPending}
        title="اعمال فرمول قیمت‌گذاری"
        onConfirm={({ mode, value }) => {
          bulkMutation.mutate(
            { ids: Array.from(selected).map(Number), operation: 'price', mode, value },
            {
              onSuccess: (result) => {
                toast({
                  title: 'قیمت‌ها به‌روزرسانی شد',
                  description: `${formatNumber(result.updated)} محصول با فرمول انتخابی به‌روزرسانی شد.`,
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
