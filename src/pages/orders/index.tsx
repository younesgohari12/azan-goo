import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RefreshCw, SearchX, ShoppingCart } from 'lucide-react'
import type { Order } from '@/api/types'
import { useOrders } from '@/api/hooks'
import { formatDate, formatDateTime, formatNumber, formatRelative, formatToman } from '@/lib/format'
import { orderStatusMeta, shippingMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { Input, SearchInput, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { Segmented } from '@/components/ui/tabs'

export default function OrdersPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [term, setTerm] = useState(params.get('search') ?? '')

  const search = params.get('search') ?? ''
  const status = params.get('status') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const page = Number(params.get('page') ?? 1)
  const perPage = Number(params.get('per_page') ?? 15)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== term) update({ search: term || null })
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  const { data, isLoading, isFetching, isError, error, refetch } = useOrders({
    search,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    per_page: perPage,
  })

  const rows = data?.items ?? []

  const columns: Column<Order>[] = [
    {
      key: 'number',
      header: 'شماره سفارش',
      cell: (order) => (
        <div>
          <p className="num text-[12px] font-medium text-foreground">{order.number}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{order.customer_name ?? 'اطلاعات مشتری در دسترس نیست'}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'تاریخ ثبت',
      cell: (order) => (
        <span className="text-[11px] text-muted-foreground" title={formatDateTime(order.created_at)}>
          {formatDate(order.created_at)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'وضعیت',
      cell: (order) => (
        <Badge variant={orderStatusMeta[order.status].tone} dot>
          {orderStatusMeta[order.status].label}
        </Badge>
      ),
    },
    {
      key: 'items_count',
      header: 'اقلام',
      align: 'center',
      cell: (order) => <span className="num text-[11.5px] text-foreground">{formatNumber(order.items_count)}</span>,
    },
    {
      key: 'total',
      header: 'مبلغ',
      align: 'end',
      cell: (order) => <span className="num text-[12px] font-medium text-foreground">{formatToman(order.total)}</span>,
    },
    {
      key: 'shipping',
      header: 'نوع ارسال',
      cell: (order) => <span className="text-[11px] text-muted-foreground">{shippingMeta[order.shipping_type]}</span>,
    },
    {
      key: 'cancel',
      header: 'لغو',
      cell: (order) =>
        order.cancel_status === 'none' ? (
          <span className="text-[10.5px] text-muted-foreground">—</span>
        ) : (
          <Badge variant={order.cancel_status === 'full' ? 'danger' : 'warning'}>
            {order.cancel_status === 'full' ? 'لغو کامل' : 'لغو جزئی'}
          </Badge>
        ),
    },
    {
      key: 'updated_at',
      header: 'آخرین بروزرسانی',
      cell: (order) => (
        <span className="text-[11px] text-muted-foreground" title={formatDateTime(order.updated_at)}>
          {formatRelative(order.updated_at)}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="مدیریت سفارش‌ها"
        description="سفارش‌های دریافتی از اسنپ‌شاپ، وضعیت پردازش و تطبیق آن‌ها با سفارش‌های ووکامرس."
        actions={
          <Button
            variant="outline"
            size="sm"
            startIcon={<RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />}
            onClick={() => refetch()}
          >
            به‌روزرسانی
          </Button>
        }
      />

      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-end gap-2">
          <SearchInput
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="جست‌وجوی شماره سفارش یا نام مشتری…"
            className="min-w-[220px] flex-1 sm:max-w-xs"
          />
          <Segmented
            value={status}
            onChange={(value) => update({ status: value || null })}
            options={[
              { label: 'همه', value: '' },
              { label: 'جدید', value: 'new' },
              { label: 'پردازش', value: 'processing' },
              { label: 'ارسال', value: 'shipped' },
              { label: 'تحویل', value: 'delivered' },
              { label: 'لغو', value: 'cancelled' },
            ]}
            className="max-w-full overflow-x-auto"
          />
          <label className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            از تاریخ
            <Input type="date" value={from} onChange={(event) => update({ from: event.target.value })} className="h-8 w-[145px]" />
          </label>
          <label className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            تا تاریخ
            <Input type="date" value={to} onChange={(event) => update({ to: event.target.value })} className="h-8 w-[145px]" />
          </label>
          {(from || to) && (
            <span className="text-[10px] text-muted-foreground">
              {from && `از ${formatDate(from)}`} {to && `تا ${formatDate(to)}`}
            </span>
          )}
          {(search || status || from || to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTerm('')
                setParams(new URLSearchParams(), { replace: true })
              }}
            >
              حذف فیلترها
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{formatNumber(data?.total ?? 0)}</span> سفارش
          </p>
          <Select
            aria-label="تعداد در صفحه"
            value={String(perPage)}
            onChange={(event) => update({ per_page: event.target.value })}
            className="h-8 w-auto min-w-[110px] text-[11px]"
          >
            <option value="15">۱۵ در صفحه</option>
            <option value="30">۳۰ در صفحه</option>
            <option value="50">۵۰ در صفحه</option>
          </Select>
        </div>
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(order) => order.id}
            loading={isLoading}
            onRowClick={(order) => navigate(`/orders/${order.id}`)}
            skeletonRows={8}
            empty={
              <EmptyState
                icon={search || status || from || to ? SearchX : ShoppingCart}
                title={search || status || from || to ? 'سفارشی با این فیلترها نیست' : 'هنوز سفارشی دریافت نشده است'}
                description={
                  search || status || from || to
                    ? 'بازهٔ زمانی یا وضعیت دیگری را انتخاب کنید.'
                    : 'پس از اتصال افزونه و اجرای همگام‌سازی سفارش‌ها، سفارش‌ها اینجا نمایش داده می‌شوند.'
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
            perPageOptions={[15, 30, 50]}
          />
        </div>
      </Card>
    </div>
  )
}
