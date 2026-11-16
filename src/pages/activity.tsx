import { useState } from 'react'
import { History } from 'lucide-react'
import { useActivity } from '@/api/hooks'
import { formatNumber } from '@/lib/format'
import { ActivityList } from '@/components/activity-list'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Segmented } from '@/components/ui/tabs'

const filters = [
  { label: 'همه', value: '' },
  { label: 'سفارش', value: 'order' },
  { label: 'قیمت', value: 'price' },
  { label: 'موجودی', value: 'stock' },
  { label: 'همگام‌سازی', value: 'sync' },
  { label: 'خطا', value: 'error' },
  { label: 'اتوماسیون', value: 'automation' },
]

export default function ActivityPage() {
  const [type, setType] = useState('')
  const { data, isLoading, isError, error, refetch } = useActivity({ limit: 40, type: type || undefined })

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="تاریخچه فعالیت‌ها"
        description="دفتر رویدادهای فروشگاه؛ هر تغییر قیمت، موجودی، سفارش و همگام‌سازی با زمان و منبع ثبت می‌شود."
        badge={<Badge variant="outline">{formatNumber(data?.length ?? 0)} رویداد</Badge>}
      />

      <div className="mb-3 overflow-x-auto">
        <Segmented value={type} onChange={setType} options={filters} />
      </div>

      <Card className="overflow-hidden">
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : (
          <ActivityList items={data} loading={isLoading} columns={2} />
        )}
        {!isLoading && !isError && (data?.length ?? 0) === 0 && (
          <EmptyState icon={History} title="رویدادی در این دسته ثبت نشده" description="دستهٔ دیگری را انتخاب کنید یا پس از فعالیت در فروشگاه دوباره سر بزنید." />
        )}
      </Card>
    </div>
  )
}
