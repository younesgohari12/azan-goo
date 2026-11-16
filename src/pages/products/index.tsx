import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Filter, PackageOpen, RefreshCw, RotateCcw, SearchX, X } from 'lucide-react'
import { useBulkProducts, useProducts } from '@/api/hooks'
import { formatDateTime, formatNumber, formatRelative, formatToman } from '@/lib/format'
import { matchStatusMeta, syncStatusMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useLocalState } from '@/lib/use-local-state'
import { BulkEditModal } from '@/components/bulk-edit-modal'
import { ColumnsMenu } from '@/components/columns-menu'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { SearchInput, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { ProductThumb } from '@/components/ui/product-thumb'
import { Tooltip } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast'
import type { Product } from '@/api/types'
import { ProductDrawer } from './product-drawer'

const ALL_COLUMN_KEYS = ['product', 'number', 'wc_price', 'snapp_price', 'wc_stock', 'snapp_stock', 'match', 'sync', 'updated']

const COLUMN_OPTIONS = [
  { key: 'product', label: 'محصول / SKU' },
  { key: 'number', label: 'شماره محصول' },
  { key: 'wc_price', label: 'قیمت ووکامرس' },
  { key: 'snapp_price', label: 'قیمت اسنپ‌شاپ' },
  { key: 'wc_stock', label: 'موجودی ووکامرس' },
  { key: 'snapp_stock', label: 'موجودی اسنپ‌شاپ' },
  { key: 'match', label: 'وضعیت تطبیق' },
  { key: 'sync', label: 'وضعیت همگام‌سازی' },
  { key: 'updated', label: 'آخرین آپدیت' },
]

const CATEGORIES = ['موبایل و تبلت', 'صوتی و تصویری', 'کامپیوتر و لپ‌تاپ', 'لوازم جانبی', 'لوازم خانگی', 'دوربین']

export default function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const { toast } = useToast()
  const [selected, setSelected] = useState<Set<string | number>>(new Set())
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [bulkOperation, setBulkOperation] = useState<'price' | 'stock' | null>(null)
  const [visibleColumns, setVisibleColumns, resetColumns] = useLocalState<string[]>('snappshop:product-columns', ALL_COLUMN_KEYS)

  const search = params.get('search') ?? ''
  const syncStatus = params.get('sync_status') ?? ''
  const matchStatus = params.get('match_status') ?? ''
  const category = params.get('category') ?? ''
  const stockState = params.get('stock_state') ?? ''
  const onlyErrors = params.get('only_errors') === '1'
  const page = Number(params.get('page') ?? 1)
  const perPage = Number(params.get('per_page') ?? 20)
  const sortKey = params.get('sort') ?? 'last_updated'
  const order = (params.get('order') as 'asc' | 'desc') ?? 'desc'
  const [term, setTerm] = useState(search)

  const update = (patch: Record<string, string | null>, keepSelection = false) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
    if (!keepSelection) setSelected(new Set())
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== term) update({ search: term || null })
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts({
    search,
    sync_status: syncStatus || undefined,
    match_status: matchStatus || undefined,
    category: category || undefined,
    stock_state: stockState || undefined,
    only_errors: onlyErrors ? 'true' : undefined,
    page,
    per_page: perPage,
    sort: sortKey,
    order,
  })

  const bulkMutation = useBulkProducts()
  const rows = data?.items ?? []
  const selectedProducts = rows.filter((row) => selected.has(row.id))
  const activeFilters = [
    syncStatus ? `همگام‌سازی: ${syncStatusMeta[syncStatus as Product['sync_status']]?.label ?? syncStatus}` : null,
    matchStatus ? `تطبیق: ${matchStatusMeta[matchStatus as Product['match_status']]?.label ?? matchStatus}` : null,
    category ? `دسته: ${category}` : null,
    stockState === 'out' ? 'ناموجود' : stockState === 'low' ? 'موجودی کم' : null,
    onlyErrors ? 'فقط خطاها' : null,
  ].filter(Boolean) as string[]

  const toggleSort = (key: string) => {
    update({ sort: key, order: sortKey === key && order === 'desc' ? 'asc' : 'desc' })
  }

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'محصول',
      sortable: true,
      className: 'max-w-[280px]',
      cell: (product) => (
        <div className="flex items-center gap-2.5">
          <ProductThumb id={product.id} name={product.name} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[12px] font-medium text-foreground">{product.name}</span>
              {product.type === 'variable' && <Badge variant="info">متغیر</Badge>}
              {product.errors.length > 0 && (
                <Tooltip content={product.errors[0]}>
                  <AlertTriangle className="h-3 w-3 shrink-0 text-danger" />
                </Tooltip>
              )}
            </div>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">{product.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'number',
      header: 'شماره محصول',
      cell: (product) => <span className="num text-[11px] text-muted-foreground">{product.product_number ?? '—'}</span>,
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
          <Badge variant="neutral">متصل نشده</Badge>
        ) : (
          <span className={cn('num text-[12px]', product.snapp_price === product.wc_price ? 'text-muted-foreground' : 'text-warning')}>
            {formatNumber(product.snapp_price)}
          </span>
        ),
    },
    {
      key: 'wc_stock',
      header: 'موجودی ووکامرس',
      sortable: true,
      align: 'end',
      cell: (product) => (
        <span
          className={cn(
            'num inline-flex min-w-8 justify-center rounded px-1.5 py-0.5 text-[11.5px] font-medium',
            product.wc_stock === 0 ? 'bg-danger-soft text-danger' : product.wc_stock <= 5 ? 'bg-warning-soft text-warning' : 'text-foreground',
          )}
        >
          {formatNumber(product.wc_stock)}
        </span>
      ),
    },
    {
      key: 'snapp_stock',
      header: 'موجودی اسنپ‌شاپ',
      align: 'end',
      cell: (product) =>
        product.snapp_stock === null ? (
          <span className="text-[11px] text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(
              'num text-[11.5px]',
              product.snapp_stock === product.wc_stock ? 'text-muted-foreground' : 'font-medium text-warning',
            )}
          >
            {formatNumber(product.snapp_stock)}
            {product.snapp_stock !== product.wc_stock && (
              <span className="ms-1 text-[9.5px]">
                ({product.snapp_stock > product.wc_stock ? '+' : ''}
                {formatNumber(product.snapp_stock - product.wc_stock)})
              </span>
            )}
          </span>
        ),
    },
    {
      key: 'match',
      header: 'وضعیت تطبیق',
      cell: (product) => (
        <Badge variant={matchStatusMeta[product.match_status].tone}>{matchStatusMeta[product.match_status].label}</Badge>
      ),
    },
    {
      key: 'sync',
      header: 'همگام‌سازی',
      cell: (product) => (
        <Badge variant={syncStatusMeta[product.sync_status].tone} dot pulse={product.sync_status === 'pending'}>
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

  const visible = columns.filter((column) => visibleColumns.includes(column.key))

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="مدیریت محصولات"
        description="محصولات ووکامرس و همتای اسنپ‌شاپ آن‌ها؛ قیمت، موجودی و وضعیت همگام‌سازی را از یک جدول مدیریت کنید."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              startIcon={<RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />}
              onClick={() => refetch()}
            >
              به‌روزرسانی
            </Button>
            <Button variant="primary" size="sm" startIcon={<Filter className="h-3.5 w-3.5" />} onClick={() => setBulkOperation('price')} disabled={selected.size === 0}>
              ویرایش گروهی
            </Button>
          </>
        }
      />

      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="جست‌وجوی نام محصول، SKU یا شماره محصول…"
            className="min-w-[220px] flex-1 sm:max-w-xs"
          />
          <Select
            aria-label="وضعیت همگام‌سازی"
            value={syncStatus}
            onChange={(event) => update({ sync_status: event.target.value || null })}
            className="w-auto min-w-[140px]"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="synced">همگام‌شده</option>
            <option value="pending">در انتظار</option>
            <option value="error">خطا</option>
            <option value="paused">متوقف</option>
            <option value="not_linked">متصل نشده</option>
          </Select>
          <Select
            aria-label="وضعیت تطبیق"
            value={matchStatus}
            onChange={(event) => update({ match_status: event.target.value || null })}
            className="w-auto min-w-[130px]"
          >
            <option value="">همه تطبیق‌ها</option>
            <option value="matched">منطبق</option>
            <option value="conflict">مغایرت</option>
            <option value="missing">یافت نشد</option>
          </Select>
          <Select
            aria-label="دسته‌بندی"
            value={category}
            onChange={(event) => update({ category: event.target.value || null })}
            className="w-auto min-w-[130px]"
          >
            <option value="">همه دسته‌ها</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            aria-label="وضعیت موجودی"
            value={stockState}
            onChange={(event) => update({ stock_state: event.target.value || null })}
            className="w-auto min-w-[120px]"
          >
            <option value="">همه موجودی‌ها</option>
            <option value="low">موجودی کم</option>
            <option value="out">ناموجود</option>
          </Select>
          <Button
            variant={onlyErrors ? 'primary' : 'outline'}
            size="sm"
            onClick={() => update({ only_errors: onlyErrors ? null : '1' })}
            startIcon={<AlertTriangle className="h-3.5 w-3.5" />}
          >
            فقط خطاها
          </Button>
          {(activeFilters.length > 0 || search) && (
            <Button
              variant="ghost"
              size="sm"
              startIcon={<RotateCcw className="h-3 w-3" />}
              onClick={() => {
                setTerm('')
                setParams(new URLSearchParams(), { replace: true })
              }}
            >
              پاک کردن فیلترها
            </Button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
            {activeFilters.map((filter) => (
              <span key={filter} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {filter}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{formatNumber(data?.total ?? 0)}</span> محصول
            {selected.size > 0 && (
              <Badge variant="primary">{formatNumber(selected.size)} انتخاب‌شده</Badge>
            )}
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            <ColumnsMenu
              columns={COLUMN_OPTIONS}
              visible={visibleColumns}
              onChange={setVisibleColumns}
              onReset={() => resetColumns()}
            />
          </div>
        </div>

        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={visible}
            rows={rows}
            rowKey={(product) => product.id}
            loading={isLoading}
            sort={{ key: sortKey, direction: order }}
            onSortChange={toggleSort}
            selected={selected}
            onSelectedChange={setSelected}
            onRowClick={(product) => setDrawerId(product.id)}
            skeletonRows={10}
            empty={
              <EmptyState
                icon={search || activeFilters.length ? SearchX : PackageOpen}
                title={search || activeFilters.length ? 'محصولی با این فیلترها یافت نشد' : 'هنوز محصولی ثبت نشده است'}
                description={
                  search || activeFilters.length
                    ? 'عبارت جست‌وجو یا فیلترها را تغییر دهید تا نتایج بیشتری نمایش داده شود.'
                    : 'پس از اتصال افزونه، محصولات ووکامرس به‌صورت خودکار در این جدول نمایش داده می‌شوند.'
                }
                action={
                  (search || activeFilters.length) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTerm('')
                        setParams(new URLSearchParams(), { replace: true })
                      }}
                    >
                      حذف فیلترها
                    </Button>
                  )
                }
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

      {selected.size > 0 && (
        <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-xl animate-fade-up items-center justify-between gap-2 rounded-xl border border-border bg-card/95 px-3 py-2.5 shadow-pop backdrop-blur">
          <span className="text-[11.5px] text-muted-foreground">
            <span className="font-semibold text-foreground">{formatNumber(selected.size)}</span> محصول انتخاب شده
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setBulkOperation('price')}>
              قیمت
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkOperation('stock')}>
              موجودی
            </Button>
            <IconButton aria-label="لغو انتخاب" onClick={() => setSelected(new Set())} className="h-8 w-8">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      )}

      <BulkEditModal
        open={bulkOperation !== null}
        onClose={() => setBulkOperation(null)}
        operation={bulkOperation ?? 'price'}
        products={selectedProducts}
        loading={bulkMutation.isPending}
        title={bulkOperation === 'stock' ? 'ویرایش گروهی موجودی' : 'ویرایش گروهی قیمت'}
        onConfirm={({ mode, value }) => {
          if (!bulkOperation) return
          bulkMutation.mutate(
            { ids: Array.from(selected).map(Number), operation: bulkOperation, mode, value },
            {
              onSuccess: (result) => {
                toast({
                  title: 'تغییرات گروهی اعمال شد',
                  description: `${formatNumber(result.updated)} محصول به‌روزرسانی شد${result.failed ? ` و ${formatNumber(result.failed)} مورد ناموفق بود` : ''}.`,
                  variant: result.failed > 0 ? 'warning' : 'success',
                })
                setBulkOperation(null)
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
