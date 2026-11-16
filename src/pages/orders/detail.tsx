import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  UserRound,
  XCircle,
} from 'lucide-react'
import type { OrderEvent } from '@/api/types'
import { useOrder } from '@/api/hooks'
import { formatDate, formatDateTime, formatNumber, formatRelative, formatToman } from '@/lib/format'
import { orderStatusMeta, shippingMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'

const eventIcons = {
  created: ShoppingBag,
  status_changed: Truck,
  cancelled: XCircle,
  synced: RefreshCw,
  error: AlertCircle,
  updated: Clock,
}

const eventTones = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  error: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
}

function Timeline({ events }: { events: OrderEvent[] }) {
  return (
    <ol className="relative space-y-4 ps-5">
      <span className="absolute inset-y-1 start-[9px] w-px bg-border" aria-hidden="true" />
      {events.map((event) => {
        const Icon = eventIcons[event.type] ?? Clock
        return (
          <li key={event.id} className="relative">
            <span
              className={cn(
                'absolute -start-5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-4 ring-card',
                eventTones[event.status],
              )}
            >
              <Icon className="h-2.5 w-2.5" strokeWidth={2.4} />
            </span>
            <div className="flex flex-wrap items-start justify-between gap-1">
              <p className="text-[12px] font-medium text-foreground">{event.title}</p>
              <span className="text-[10px] text-muted-foreground">{formatRelative(event.created_at)}</span>
            </div>
            {event.description && <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{event.description}</p>}
            <p className="mt-1 text-[10px] text-muted-foreground/80">
              {formatDateTime(event.created_at)} • {event.actor}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orderId = Number(id)
  const { data: order, isLoading, isError, error, refetch } = useOrder(Number.isFinite(orderId) ? orderId : null)

  if (isError) {
    return (
      <Card>
        <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        <div className="border-t border-border px-4 py-3 text-center">
          <Link to="/orders" className="text-[11.5px] text-primary hover:underline">
            بازگشت به فهرست سفارش‌ها
          </Link>
        </div>
      </Card>
    )
  }

  if (isLoading || !order) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`سفارش ${order.number}`}
        breadcrumb={['سفارش‌ها', order.number]}
        description={`ثبت‌شده در ${formatDate(order.created_at)} • آخرین بروزرسانی ${formatRelative(order.updated_at)}`}
        badge={<Badge variant={orderStatusMeta[order.status].tone} dot>{orderStatusMeta[order.status].label}</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" startIcon={<ArrowRight className="h-3.5 w-3.5" />} onClick={() => navigate('/orders')}>
              بازگشت
            </Button>
            <Button variant="outline" size="sm" startIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => refetch()}>
              به‌روزرسانی
            </Button>
          </>
        }
      />

      <div className="mb-3 flex items-start gap-2 rounded-xl border border-info/20 bg-info-soft/50 px-3.5 py-2.5 text-[11px] leading-6 text-foreground/85">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
        <p>
          تغییر وضعیت سفارش در اسنپ‌شاپ از طریق API فعلی مستند نشده است؛ بنابراین این پنل فقط نمایش و پیگیری سفارش‌ها را ارائه می‌دهد و
          دکمهٔ تغییر وضعیت ندارد.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>خلاصه سفارش</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="space-y-1.5 p-4 pt-2 text-[11.5px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">مبلغ کل</span>
              <span className="num font-semibold text-foreground">{formatToman(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تعداد اقلام</span>
              <span className="num text-foreground">{formatNumber(order.items_count)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">نوع ارسال</span>
              <span className="text-foreground">{shippingMeta[order.shipping_type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">وضعیت لغو</span>
              <span className={order.cancel_status === 'none' ? 'text-muted-foreground' : 'text-warning'}>
                {order.cancel_status === 'none' ? 'بدون لغو' : order.cancel_status === 'full' ? 'لغو کامل' : 'لغو جزئی'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">شناسه داخلی</span>
              <span className="num text-muted-foreground">#{formatNumber(order.id)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مشتری</CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="p-4 pt-2 text-[11.5px]">
            {order.customer_name || order.customer_phone ? (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نام</span>
                  <span className="text-foreground">{order.customer_name ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">شماره تماس</span>
                  <span className="num text-foreground" dir="ltr">
                    {order.customer_phone ?? '—'}
                  </span>
                </div>
                <p className="mt-2 rounded-lg bg-muted/50 px-2 py-1.5 text-[10px] leading-5 text-muted-foreground">
                  اطلاعات مشتری تنها در صورت مجاز بودن توسط API نمایش داده می‌شود.
                </p>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                اطلاعات مشتری برای این سفارش در دسترس نیست.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تطبیق با ووکامرس</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="p-4 pt-2 text-[11.5px]">
            {order.wc_order_id ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-medium">سفارش ووکامرس ایجاد شده است</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">شناسه سفارش ووکامرس</span>
                  <span className="num text-foreground">#{formatNumber(order.wc_order_id)}</span>
                </div>
                <p className="mt-2 rounded-lg bg-muted/50 px-2 py-1.5 text-[10px] leading-5 text-muted-foreground">
                  تطبیق بر اساس شناسهٔ ثبت‌شده در افزونه انجام شده است.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-warning">
                <XCircle className="h-3.5 w-3.5" />
                <span className="font-medium">سفارش ووکامرس پیدا نشد</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle>اقلام سفارش</CardTitle>
            <Badge variant="outline">{formatNumber(order.items.length)} قلم</Badge>
          </CardHeader>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[11.5px]">
              <thead className="bg-muted/40 text-[10.5px] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">محصول</th>
                  <th className="px-3 py-2 text-start font-medium">SKU</th>
                  <th className="px-3 py-2 text-center font-medium">تعداد</th>
                  <th className="px-3 py-2 text-end font-medium">قیمت واحد</th>
                  <th className="px-3 py-2 text-end font-medium">جمع</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="max-w-[260px] truncate px-3 py-2 text-foreground">{item.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.sku}</td>
                    <td className="num px-3 py-2 text-center text-foreground">{formatNumber(item.quantity)}</td>
                    <td className="num px-3 py-2 text-end text-muted-foreground">{formatNumber(item.unit_price)}</td>
                    <td className="num px-3 py-2 text-end font-medium text-foreground">{formatNumber(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={4} className="px-3 py-2 text-end text-[11px] text-muted-foreground">
                    مبلغ کل سفارش (تومان)
                  </td>
                  <td className="num px-3 py-2 text-end text-[12px] font-semibold text-foreground">{formatNumber(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تاریخچه رویدادها</CardTitle>
            <Badge variant="outline">{formatNumber(order.events.length)} رویداد</Badge>
          </CardHeader>
          <div className="p-4 pt-3">
            {order.events.length > 0 ? (
              <Timeline events={order.events} />
            ) : (
              <EmptyState icon={Clock} title="رویدادی ثبت نشده" compact />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
