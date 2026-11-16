import { BadgePercent, Info } from 'lucide-react'
import type { Discount } from '@/api/types'
import { useDiscounts } from '@/api/hooks'
import { formatDate, formatNumber, formatToman } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

function discountState(discount: Discount) {
  const now = Date.now()
  const start = new Date(discount.starts_at).getTime()
  const end = new Date(discount.ends_at).getTime()
  if (now < start) return { label: 'زمان‌بندی‌شده', variant: 'info' as const }
  if (now > end) return { label: 'پایان‌یافته', variant: 'neutral' as const }
  return { label: 'فعال', variant: 'success' as const }
}

export default function DiscountsPage() {
  const { data, isLoading, isError, error, refetch } = useDiscounts()

  const columns: Column<Discount>[] = [
    {
      key: 'title',
      header: 'عنوان تخفیف',
      cell: (discount) => (
        <div>
          <p className="text-[12px] font-medium text-foreground">{discount.title}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {discount.scope === 'all' ? 'همه محصولات' : discount.scope === 'category' ? 'دسته‌بندی' : 'محصولات انتخابی'} •{' '}
            {formatNumber(discount.products_count)} محصول
          </p>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'میزان تخفیف',
      align: 'end',
      cell: (discount) => (
        <span className="num text-[12px] font-medium text-foreground">
          {discount.type === 'percentage' ? `${formatNumber(discount.value)}٪` : formatToman(discount.value)}
        </span>
      ),
    },
    {
      key: 'starts_at',
      header: 'شروع',
      cell: (discount) => <span className="text-[11px] text-muted-foreground">{formatDate(discount.starts_at)}</span>,
    },
    {
      key: 'ends_at',
      header: 'پایان',
      cell: (discount) => <span className="text-[11px] text-muted-foreground">{formatDate(discount.ends_at)}</span>,
    },
    {
      key: 'state',
      header: 'وضعیت',
      cell: (discount) => {
        const state = discountState(discount)
        return <Badge variant={state.variant}>{state.label}</Badge>
      },
    },
    {
      key: 'synced',
      header: 'همگام‌سازی',
      cell: (discount) => (
        <Badge variant={discount.synced ? 'success' : 'warning'} dot>
          {discount.synced ? 'ارسال شده' : 'در انتظار ارسال'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="تخفیف‌ها"
        description="تخفیف‌های تعریف‌شده برای محصولات اسنپ‌شاپ و وضعیت همگام‌سازی آن‌ها."
        badge={<Badge variant="outline">{formatNumber(data?.length ?? 0)} تخفیف</Badge>}
      />

      <div className="mb-3 flex items-start gap-2 rounded-xl border border-info/20 bg-info-soft/50 px-3.5 py-2.5 text-[11px] leading-6 text-foreground/85">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
        <p>
          ایجاد، ویرایش و حذف تخفیف در مستندات فعلی API ارائه نشده است؛ این صفحه فقط تخفیف‌های موجود را نمایش می‌دهد. پس از ارائهٔ
          endpointها، فرم ساخت تخفیف در همین صفحه فعال می‌شود.
        </p>
      </div>

      <Card className="overflow-hidden">
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={data ?? []}
            rowKey={(discount) => discount.id}
            loading={isLoading}
            skeletonRows={5}
            empty={<EmptyState icon={BadgePercent} title="تخفیفی ثبت نشده است" description="تخفیف‌های تعریف‌شده در اسنپ‌شاپ پس از همگام‌سازی اینجا نمایش داده می‌شوند." />}
          />
        )}
      </Card>
    </div>
  )
}
