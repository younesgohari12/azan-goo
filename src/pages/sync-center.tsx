import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Loader2,
  Package,
  Play,
  RefreshCw,
  ShoppingCart,
  Square,
  Timer,
  Wifi,
  XCircle,
} from 'lucide-react'
import type { BackgroundJob } from '@/api/types'
import { useCancelJob, useRunSync, useStores, useSyncOverview } from '@/api/hooks'
import { usePreferences } from '@/app/preferences'
import { formatDateTime, formatDuration, formatNumber, formatRelative } from '@/lib/format'
import { jobStatusMeta, jobTypeMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { Segmented } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'

type Scope = 'all' | 'products' | 'prices' | 'stock' | 'orders'

const scopes: { value: Scope; label: string; icon: typeof Package; hint: string }[] = [
  { value: 'all', label: 'همگام‌سازی کامل', icon: RefreshCw, hint: 'محصول، قیمت، موجودی و سفارش' },
  { value: 'products', label: 'محصولات', icon: Package, hint: 'ایجاد و ویرایش محصولات' },
  { value: 'prices', label: 'قیمت‌ها', icon: CircleDollarSign, hint: 'ارسال قیمت‌های ووکامرس' },
  { value: 'stock', label: 'موجودی', icon: Boxes, hint: 'به‌روزرسانی موجودی انبار' },
  { value: 'orders', label: 'سفارش‌ها', icon: ShoppingCart, hint: 'دریافت سفارش‌های جدید' },
]

function RunningProgress({ job, onCancel, cancelling }: { job: BackgroundJob; onCancel: () => void; cancelling: boolean }) {
  const elapsed = Math.max(0, Math.round((Date.now() - new Date(job.started_at).getTime()) / 1000))
  const remaining = Math.max(0, job.total - job.processed)
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-info-soft text-info">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold text-foreground">{job.title}</p>
            <p className="text-[10px] text-muted-foreground">
              {jobTypeMeta[job.type]} • شروع {formatRelative(job.started_at)}
            </p>
          </div>
        </div>
        <Badge variant="info" dot pulse>
          در حال اجرا
        </Badge>
      </div>

      <div className="p-4">
        <div className="mb-1.5 flex items-end justify-between">
          <span className="num text-2xl font-semibold text-foreground">{formatNumber(job.progress)}٪</span>
          <span className="text-[10.5px] text-muted-foreground">
            {formatNumber(job.processed)} از {formatNumber(job.total)} آیتم
          </span>
        </div>
        <Progress value={job.progress} tone="info" />

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'پردازش‌شده', value: formatNumber(job.processed), tone: 'text-foreground' },
            { label: 'باقی‌مانده', value: formatNumber(remaining), tone: 'text-muted-foreground' },
            { label: 'ناموفق', value: formatNumber(job.failed), tone: job.failed > 0 ? 'text-danger' : 'text-muted-foreground' },
            { label: 'مدت اجرا', value: formatDuration(elapsed), tone: 'text-foreground' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border/70 bg-muted/25 px-2.5 py-2">
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className={cn('num mt-0.5 text-[12px] font-medium', item.tone)}>{item.value}</p>
            </div>
          ))}
        </div>

        {job.errors.length > 0 && (
          <div className="mt-3 rounded-lg border border-danger/20 bg-danger-soft/40 p-2.5">
            <p className="mb-1 text-[10.5px] font-medium text-danger">خطاهای این اجرا</p>
            <ul className="space-y-1">
              {job.errors.slice(0, 3).map((error) => (
                <li key={error} className="text-[10.5px] leading-5 text-foreground/80">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5">
        <span className="text-[10px] text-muted-foreground">وضعیت هر ۲ ثانیه به‌روزرسانی می‌شود.</span>
        <Button variant="outline" size="sm" onClick={onCancel} loading={cancelling} startIcon={<Square className="h-3 w-3" />}>
          توقف عملیات
        </Button>
      </div>
    </Card>
  )
}

export default function SyncCenterPage() {
  const { preferences } = usePreferences()
  const { toast } = useToast()
  const { data, isLoading, isError, error, refetch } = useSyncOverview(preferences.activeStoreId)
  const { data: stores } = useStores()
  const runSync = useRunSync()
  const cancelJob = useCancelJob()
  const [scope, setScope] = useState<Scope>('all')
  const [mode, setMode] = useState<'full' | 'incremental'>('incremental')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  const activeStore = stores?.find((store) => store.id === preferences.activeStoreId)
  const running = data?.running_job

  const start = () => {
    runSync.mutate(
      { store_id: preferences.activeStoreId, scope, mode },
      {
        onSuccess: () => {
          toast({ title: 'همگام‌سازی آغاز شد', description: 'پیشرفت عملیات در همین صفحه نمایش داده می‌شود.', variant: 'success' })
          setConfirmOpen(false)
          refetch()
        },
        onError: (mutationError) => {
          toast({ title: 'اجرای همگام‌سازی ناموفق بود', description: (mutationError as Error).message, variant: 'error' })
          setConfirmOpen(false)
        },
      },
    )
  }

  const stop = () => {
    if (!running) return
    cancelJob.mutate(running.id, {
      onSuccess: () => {
        toast({ title: 'عملیات متوقف شد', description: 'همگام‌سازی جاری لغو شد.', variant: 'warning' })
        setCancelConfirm(false)
        refetch()
      },
      onError: (mutationError) =>
        toast({ title: 'توقف ناموفق بود', description: (mutationError as Error).message, variant: 'error' }),
    })
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="مرکز همگام‌سازی"
        description="کنترل کامل همگام‌سازی بین ووکامرس و اسنپ‌شاپ؛ وضعیت اتصال، اجرای دستی و تاریخچهٔ عملیات."
        actions={
          <>
            <Badge variant={isLoading ? 'neutral' : data?.connected ? 'success' : 'danger'} dot>
              {isLoading ? 'در حال بررسی اتصال' : data?.connected ? 'اتصال فروشگاه برقرار است' : 'اتصال برقرار نیست'}
            </Badge>
            <Button
              variant="primary"
              size="sm"
              disabled={Boolean(running)}
              onClick={() => setConfirmOpen(true)}
              startIcon={<Play className="h-3.5 w-3.5" />}
            >
              اجرای همگام‌سازی
            </Button>
          </>
        }
      />

      {isError ? (
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="وضعیت اتصال"
              value={data?.connected ? 'متصل' : 'قطع'}
              icon={Wifi}
              accent={data?.connected ? 'success' : 'danger'}
              loading={isLoading}
              footer={activeStore?.name}
            />
            <StatCard
              label="آخرین همگام‌سازی"
              value={data?.last_sync_at ? formatRelative(data.last_sync_at) : '—'}
              icon={Clock}
              accent="info"
              loading={isLoading}
              footer={data?.last_sync_at ? formatDateTime(data.last_sync_at) : 'بدون سابقه'}
            />
            <StatCard
              label="همگام‌سازی بعدی"
              value={data?.next_sync_at ? formatRelative(data.next_sync_at) : '—'}
              icon={Timer}
              accent="neutral"
              loading={isLoading}
              footer={activeStore?.settings.auto_sync ? `هر ${formatNumber(activeStore.settings.sync_interval_minutes)} دقیقه` : 'خودکار غیرفعال'}
            />
            <StatCard
              label="آخرین عملیات"
              value={data?.last_result ? `${formatNumber(data.last_result.success)} موفق` : '—'}
              icon={CheckCircle2}
              accent="success"
              loading={isLoading}
              footer={
                data?.last_result
                  ? `${formatNumber(data.last_result.failed)} ناموفق • ${formatDuration(data.last_result.duration_seconds)}`
                  : 'بدون نتیجه'
              }
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <div>
                  <CardTitle>کنترل همگام‌سازی</CardTitle>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">نوع و دامنهٔ عملیات را انتخاب کنید</p>
                </div>
              </CardHeader>
              <div className="space-y-2 p-4 pt-3">
                {scopes.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setScope(item.value)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-start transition-all',
                        scope === item.value
                          ? 'border-primary/40 bg-primary-soft/60'
                          : 'border-border hover:border-primary/25 hover:bg-muted/40',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg',
                          scope === item.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-medium text-foreground">{item.label}</span>
                        <span className="block text-[10px] text-muted-foreground">{item.hint}</span>
                      </span>
                    </button>
                  )
                })}

                <div className="pt-1">
                  <p className="mb-1.5 text-[10.5px] text-muted-foreground">نوع همگام‌سازی</p>
                  <Segmented
                    value={mode}
                    onChange={setMode}
                    options={[
                      { label: 'افزایشی', value: 'incremental' },
                      { label: 'کامل', value: 'full' },
                    ]}
                    className="w-full"
                  />
                  <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
                    همگام‌سازی افزایشی فقط آیتم‌های تغییرکرده را ارسال می‌کند؛ حالت کامل همهٔ آیتم‌ها را بازنویسی می‌کند.
                  </p>
                </div>

                <Button
                  variant="primary"
                  className="mt-1 w-full"
                  disabled={Boolean(running) || !data?.connected}
                  loading={runSync.isPending}
                  onClick={() => setConfirmOpen(true)}
                  startIcon={<Play className="h-3.5 w-3.5" />}
                >
                  {running ? 'عملیات در حال اجراست' : 'شروع همگام‌سازی'}
                </Button>
                {!data?.connected && (
                  <p className="text-center text-[10px] text-danger">برای شروع، ابتدا اتصال فروشگاه را در صفحهٔ فروشگاه‌ها بررسی کنید.</p>
                )}
              </div>
            </Card>

            <div className="space-y-3 lg:col-span-2">
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : running ? (
                <RunningProgress job={running} onCancel={() => setCancelConfirm(true)} cancelling={cancelJob.isPending} />
              ) : (
                <Card className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <p className="text-[13px] font-medium text-foreground">عملیات همگام‌سازی در حال اجرا نیست</p>
                  <p className="mt-1 max-w-sm text-[11px] leading-6 text-muted-foreground">
                    {data?.last_result
                      ? `آخرین اجرا: ${formatNumber(data.last_result.processed)} آیتم پردازش شد؛ ${formatNumber(data.last_result.failed)} مورد ناموفق.`
                      : 'برای دریافت اطلاعات از اسنپ‌شاپ، یک همگام‌سازی دستی اجرا کنید.'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setConfirmOpen(true)} startIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                    اجرای همگام‌سازی
                  </Button>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>تاریخچهٔ اجراها</CardTitle>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">۱۰ عملیات آخر</p>
                  </div>
                  <Link to="/jobs" className="flex items-center gap-1 text-[10.5px] text-primary hover:underline">
                    همهٔ Jobها
                    <ArrowLeft className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <div className="overflow-x-auto p-2">
                  <table className="w-full min-w-[520px] text-[11px]">
                    <thead className="text-[10px] text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5 text-start font-medium">عملیات</th>
                        <th className="px-2 py-1.5 text-center font-medium">وضعیت</th>
                        <th className="px-2 py-1.5 text-end font-medium">پردازش</th>
                        <th className="px-2 py-1.5 text-end font-medium">ناموفق</th>
                        <th className="px-2 py-1.5 text-end font-medium">مدت</th>
                        <th className="px-2 py-1.5 text-start font-medium">زمان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.history.map((job) => (
                        <tr key={job.id} className="border-t border-border/60">
                          <td className="px-2 py-1.5 text-foreground">{job.title}</td>
                          <td className="px-2 py-1.5 text-center">
                            <Badge variant={jobStatusMeta[job.status].tone}>{jobStatusMeta[job.status].label}</Badge>
                          </td>
                          <td className="num px-2 py-1.5 text-end text-muted-foreground">{formatNumber(job.processed)}</td>
                          <td className={cn('num px-2 py-1.5 text-end', job.failed > 0 ? 'text-danger' : 'text-muted-foreground')}>
                            {formatNumber(job.failed)}
                          </td>
                          <td className="px-2 py-1.5 text-end text-muted-foreground">{formatDuration(job.duration_seconds)}</td>
                          <td className="px-2 py-1.5 text-start text-muted-foreground">{formatRelative(job.started_at)}</td>
                        </tr>
                      ))}
                      {(!data?.history || data.history.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-2 py-6 text-center text-[11px] text-muted-foreground">
                            هنوز عملیاتی ثبت نشده است.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={start}
        loading={runSync.isPending}
        tone="primary"
        title="اجرای همگام‌سازی"
        confirmLabel="شروع عملیات"
        description={
          <div className="space-y-2">
            <p>عملیات زیر برای فروشگاه «{activeStore?.name ?? 'فعال'}» اجرا می‌شود:</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>دامنه: {scopes.find((item) => item.value === scope)?.label}</li>
              <li>نوع: {mode === 'full' ? 'همگام‌سازی کامل' : 'همگام‌سازی افزایشی'}</li>
            </ul>
            <p className="rounded-lg bg-warning-soft/60 px-2.5 py-2 text-[11px] text-foreground/80">
              اجرای همگام‌سازی کامل ممکن است چند دقیقه طول بکشد و آیتم‌های زیادی را بازنویسی کند.
            </p>
          </div>
        }
      />

      <ConfirmDialog
        open={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        onConfirm={stop}
        loading={cancelJob.isPending}
        title="توقف همگام‌سازی"
        confirmLabel="توقف عملیات"
        description="عملیات جاری متوقف می‌شود و آیتم‌های باقی‌مانده همگام نمی‌شوند. ادامه می‌دهید؟"
      />

      {runSync.isError && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[11px] text-danger">
          <XCircle className="h-3.5 w-3.5" />
          {(runSync.error as Error).message}
        </div>
      )}
    </div>
  )
}
