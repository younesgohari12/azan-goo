import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, XCircle } from 'lucide-react'
import { useMarkNotifications, useNotifications } from '@/api/hooks'
import { formatDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'

const icons = {
  success: { Icon: CheckCircle2, tone: 'bg-success-soft text-success' },
  error: { Icon: XCircle, tone: 'bg-danger-soft text-danger' },
  warning: { Icon: AlertTriangle, tone: 'bg-warning-soft text-warning' },
  info: { Icon: Info, tone: 'bg-info-soft text-info' },
}

export default function NotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useNotifications()
  const markRead = useMarkNotifications()
  const { toast } = useToast()
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const unreadCount = data?.filter((item) => !item.read).length ?? 0
  const items = (data ?? []).filter((item) => (tab === 'unread' ? !item.read : true))

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="مرکز اعلان‌ها"
        description="رویدادهای مهم فروشگاه: نتیجهٔ همگام‌سازی، خطاهای اتصال، هشدار موجودی و اجرای اتوماسیون."
        badge={unreadCount > 0 ? <Badge variant="primary">{unreadCount} خوانده‌نشده</Badge> : undefined}
        actions={
          <Button
            variant="outline"
            size="sm"
            startIcon={<CheckCheck className="h-3.5 w-3.5" />}
            disabled={unreadCount === 0 || markRead.isPending}
            onClick={() =>
              markRead.mutate(
                { all: true },
                {
                  onSuccess: () => toast({ title: 'همهٔ اعلان‌ها خوانده شدند', variant: 'success' }),
                  onError: (mutationError) => toast({ title: 'عملیات ناموفق بود', description: (mutationError as Error).message, variant: 'error' }),
                },
              )
            }
          >
            خواندن همه
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { label: 'همه', value: 'all', count: data?.length ?? 0 },
          { label: 'خوانده‌نشده', value: 'unread', count: unreadCount },
        ]}
        className="mb-3"
      />

      {isError ? (
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="اعلانی وجود ندارد" description="اعلان‌های جدید پس از همگام‌سازی یا بروز خطا در این بخش نمایش داده می‌شوند." />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const { Icon, tone } = icons[item.type]
            return (
              <Card
                key={item.id}
                className={cn('flex items-start gap-3 p-3.5 transition-colors', !item.read && 'border-primary/25 bg-primary-soft/15')}
              >
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12.5px] font-medium text-foreground">{item.title}</p>
                    {!item.read && <Badge variant="primary">جدید</Badge>}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{item.body}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/80">
                    <span title={formatDateTime(item.created_at)}>{formatRelative(item.created_at)}</span>
                    {item.link && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <Link to={item.link} className="text-primary hover:underline">
                          مشاهدهٔ جزئیات
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                {!item.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-[10.5px]"
                    onClick={() =>
                      markRead.mutate({ ids: [item.id] }, { onError: (mutationError) => toast({ title: 'عملیات ناموفق بود', description: (mutationError as Error).message, variant: 'error' }) })
                    }
                  >
                    خوانده شد
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
