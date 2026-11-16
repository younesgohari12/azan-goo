import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Cpu, Eye, MoreHorizontal, RotateCcw, Square, Timer } from 'lucide-react'
import type { BackgroundJob, JobStatus } from '@/api/types'
import { useCancelJob, useJob, useJobs, useRetryJob } from '@/api/hooks'
import { formatDateTime, formatDuration, formatNumber, formatRelative } from '@/lib/format'
import { jobStatusMeta, jobTypeMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Drawer } from '@/components/ui/drawer'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { MenuItem, MenuSeparator, Popover } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

function JobDrawer({ jobId, onClose }: { jobId: number | null; onClose: () => void }) {
  const { data: job, isLoading } = useJob(jobId)
  const cancelJob = useCancelJob()
  const retryJob = useRetryJob()
  const { toast } = useToast()
  const [confirm, setConfirm] = useState<'cancel' | 'retry' | null>(null)

  const meta = job ? jobStatusMeta[job.status] : null
  const canCancel = job?.status === 'running' || job?.status === 'pending'
  const canRetry = job?.status === 'failed' || job?.status === 'cancelled' || job?.status === 'partially_completed'

  return (
    <>
      <Drawer
        open={jobId !== null}
        onClose={onClose}
        title={job ? job.title : 'جزئیات عملیات'}
        description={job ? `شناسه ${formatNumber(job.id)} • ${jobTypeMeta[job.type]}` : 'در حال دریافت…'}
        footer={
          job && (
            <>
              <span className="text-[10.5px] text-muted-foreground">
                تلاش مجدد: {formatNumber(job.retry_count)}
              </span>
              <div className="flex items-center gap-2">
                {canCancel && (
                  <Button variant="outline" size="sm" onClick={() => setConfirm('cancel')} startIcon={<Square className="h-3 w-3" />}>
                    لغو عملیات
                  </Button>
                )}
                {canRetry && (
                  <Button variant="primary" size="sm" onClick={() => setConfirm('retry')} startIcon={<RotateCcw className="h-3 w-3" />}>
                    اجرای دوباره
                  </Button>
                )}
              </div>
            </>
          )
        }
      >
        {isLoading || !job || !meta ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <Badge variant={meta.tone} dot pulse={job.status === 'running'}>
                {meta.label}
              </Badge>
              <span className="num text-lg font-semibold text-foreground">{formatNumber(job.progress)}٪</span>
            </div>
            <Progress value={job.progress} tone={job.status === 'failed' ? 'danger' : job.status === 'running' ? 'info' : job.status === 'completed' ? 'success' : 'warning'} />

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'پردازش‌شده', value: `${formatNumber(job.processed)} / ${formatNumber(job.total)}` },
                { label: 'ناموفق', value: formatNumber(job.failed) },
                { label: 'زمان شروع', value: formatDateTime(job.started_at) },
                { label: 'زمان پایان', value: job.finished_at ? formatDateTime(job.finished_at) : 'در حال اجرا' },
                { label: 'مدت اجرا', value: formatDuration(job.duration_seconds) },
                { label: 'نوع', value: jobTypeMeta[job.type] },
                { label: 'دامنه', value: job.scope === 'all' ? 'کامل' : job.scope === 'prices' ? 'قیمت‌ها' : job.scope === 'stock' ? 'موجودی' : job.scope === 'orders' ? 'سفارش‌ها' : 'محصولات' },
                { label: 'شناسه Job', value: `#${formatNumber(job.id)}` },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border/70 bg-muted/25 px-2.5 py-2">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="num mt-0.5 text-[11.5px] font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                خطاها ({formatNumber(job.errors.length)})
              </p>
              {job.errors.length > 0 ? (
                <ul className="space-y-1.5">
                  {job.errors.map((error) => (
                    <li key={error} className="rounded-lg border border-danger/20 bg-danger-soft/40 px-2.5 py-1.5 text-[10.5px] leading-5 text-foreground/85">
                      {error}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[10.5px] text-muted-foreground">
                  خطایی برای این عملیات ثبت نشده است.
                </p>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground">
              این Job با شناسهٔ {formatNumber(job.id)} در فروشگاه فعال اجرا شده است.
            </p>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!job) return
          cancelJob.mutate(job.id, {
            onSuccess: () => {
              toast({ title: 'عملیات لغو شد', variant: 'warning' })
              setConfirm(null)
            },
            onError: (error) => toast({ title: 'لغو ناموفق بود', description: (error as Error).message, variant: 'error' }),
          })
        }}
        loading={cancelJob.isPending}
        title="لغو این عملیات"
        confirmLabel="لغو عملیات"
        description="با لغو این Job، آیتم‌های باقی‌مانده پردازش نمی‌شوند. این کار قابل بازگشت نیست."
      />
      <ConfirmDialog
        open={confirm === 'retry'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!job) return
          retryJob.mutate(job.id, {
            onSuccess: () => {
              toast({ title: 'عملیات دوباره اجرا شد', description: 'Job جدیدی با همان تنظیمات ساخته شد.', variant: 'success' })
              setConfirm(null)
            },
            onError: (error) => toast({ title: 'اجرای دوباره ناموفق بود', description: (error as Error).message, variant: 'error' }),
          })
        }}
        loading={retryJob.isPending}
        tone="primary"
        title="اجرای دوباره عملیات"
        confirmLabel="اجرای دوباره"
        description="یک Job جدید با همان دامنه ساخته می‌شود و آیتم‌های ناموفق دوباره پردازش می‌شوند."
      />
    </>
  )
}

export default function JobsPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as JobStatus | null) ?? ''
  const type = params.get('type') ?? ''
  const page = Number(params.get('page') ?? 1)
  const perPage = Number(params.get('per_page') ?? 10)
  const jobParam = params.get('job')

  const { data, isLoading, isError, error, refetch } = useJobs({
    status: status || undefined,
    type: type || undefined,
    page,
    per_page: perPage,
  })
  const cancelJob = useCancelJob()
  const retryJob = useRetryJob()
  const { toast } = useToast()
  const [confirmAction, setConfirmAction] = useState<{ job: BackgroundJob; action: 'cancel' | 'retry' } | null>(null)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const openJob = (id: number) => {
    const next = new URLSearchParams(params)
    next.set('job', String(id))
    setParams(next, { replace: true })
  }

  const columns: Column<BackgroundJob>[] = [
    {
      key: 'job',
      header: 'عملیات',
      cell: (job) => (
        <div>
          <p className="text-[12px] font-medium text-foreground">{job.title}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            #{formatNumber(job.id)} • {jobTypeMeta[job.type]}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'وضعیت',
      cell: (job) => (
        <Badge variant={jobStatusMeta[job.status].tone} dot pulse={job.status === 'running'}>
          {jobStatusMeta[job.status].label}
        </Badge>
      ),
    },
    {
      key: 'progress',
      header: 'پیشرفت',
      className: 'w-[150px]',
      cell: (job) => (
        <div className="flex items-center gap-2">
          <Progress
            value={job.progress}
            height="sm"
            tone={job.status === 'failed' ? 'danger' : job.status === 'running' ? 'info' : job.status === 'completed' ? 'success' : 'warning'}
            className="w-16"
          />
          <span className="num text-[10.5px] text-muted-foreground">{formatNumber(job.progress)}٪</span>
        </div>
      ),
    },
    {
      key: 'processed',
      header: 'پردازش',
      align: 'end',
      cell: (job) => (
        <span className="num text-[11px] text-muted-foreground">
          {formatNumber(job.processed)} / {formatNumber(job.total)}
        </span>
      ),
    },
    {
      key: 'failed',
      header: 'ناموفق',
      align: 'center',
      cell: (job) => (
        <span className={cn('num text-[11px]', job.failed > 0 ? 'font-medium text-danger' : 'text-muted-foreground')}>
          {formatNumber(job.failed)}
        </span>
      ),
    },
    {
      key: 'started',
      header: 'شروع',
      cell: (job) => (
        <span className="text-[11px] text-muted-foreground" title={formatDateTime(job.started_at)}>
          {formatRelative(job.started_at)}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'مدت',
      align: 'end',
      cell: (job) => (
        <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
          <Timer className="h-3 w-3" />
          {formatDuration(job.duration_seconds)}
        </span>
      ),
    },
    {
      key: 'retry',
      header: 'تلاش',
      align: 'center',
      cell: (job) => <span className="num text-[10.5px] text-muted-foreground">{formatNumber(job.retry_count)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'center',
      cell: (job) => (
        <div onClick={(event) => event.stopPropagation()} className="flex justify-center">
          <Popover
            align="end"
            contentClassName="w-44"
            trigger={({ toggle }) => (
              <IconButton aria-label="عملیات" onClick={toggle} className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
            )}
          >
            <MenuItem icon={<Eye className="h-3.5 w-3.5" />} onClick={() => openJob(job.id)}>
              جزئیات
            </MenuItem>
            {(job.status === 'running' || job.status === 'pending') && (
              <>
                <MenuSeparator />
                <MenuItem danger icon={<Square className="h-3.5 w-3.5" />} onClick={() => setConfirmAction({ job, action: 'cancel' })}>
                  لغو عملیات
                </MenuItem>
              </>
            )}
            {(job.status === 'failed' || job.status === 'cancelled' || job.status === 'partially_completed') && (
              <MenuItem icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => setConfirmAction({ job, action: 'retry' })}>
                اجرای دوباره
              </MenuItem>
            )}
          </Popover>
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="پردازش‌های پس‌زمینه"
        description="پایش Jobهای همگام‌سازی و اتوماسیون با پیشرفت زنده، خطاها و امکان تلاش مجدد."
        actions={
          <Badge variant="outline" className="gap-1">
            <Cpu className="h-3 w-3" />
            به‌روزرسانی خودکار هر ۵ ثانیه
          </Badge>
        }
      />

      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="وضعیت" value={status} onChange={(event) => update({ status: event.target.value || null })} className="w-auto min-w-[140px]">
            <option value="">همه وضعیت‌ها</option>
            {(['pending', 'running', 'completed', 'failed', 'cancelled', 'partially_completed'] as JobStatus[]).map((value) => (
              <option key={value} value={value}>
                {jobStatusMeta[value].label}
              </option>
            ))}
          </Select>
          <Select aria-label="نوع" value={type} onChange={(event) => update({ type: event.target.value || null })} className="w-auto min-w-[150px]">
            <option value="">همه انواع</option>
            {Object.entries(jobTypeMeta).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {(status || type) && (
            <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              حذف فیلترها
            </Button>
          )}
          <span className="ms-auto text-[10.5px] text-muted-foreground">
            {formatNumber(data?.total ?? 0)} عملیات ثبت شده
          </span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(job) => job.id}
            loading={isLoading}
            onRowClick={(job) => openJob(job.id)}
            skeletonRows={8}
            empty={<EmptyState icon={Cpu} title="عملیاتی یافت نشد" description="با تغییر فیلترها یا اجرای یک همگام‌سازی، Jobهای جدید اینجا نمایش داده می‌شوند." />}
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

      <JobDrawer
        jobId={jobParam ? Number(jobParam) : null}
        onClose={() => {
          const next = new URLSearchParams(params)
          next.delete('job')
          setParams(next, { replace: true })
        }}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return
          const { job, action } = confirmAction
          const mutation = action === 'cancel' ? cancelJob : retryJob
          mutation.mutate(job.id, {
            onSuccess: () => {
              toast({
                title: action === 'cancel' ? 'عملیات لغو شد' : 'عملیات دوباره اجرا شد',
                description: `Job #${formatNumber(job.id)}`,
                variant: action === 'cancel' ? 'warning' : 'success',
              })
              setConfirmAction(null)
            },
            onError: (mutationError) =>
              toast({ title: 'عملیات ناموفق بود', description: (mutationError as Error).message, variant: 'error' }),
          })
        }}
        loading={cancelJob.isPending || retryJob.isPending}
        tone={confirmAction?.action === 'retry' ? 'primary' : 'danger'}
        title={confirmAction?.action === 'retry' ? 'اجرای دوباره Job' : 'لغو Job'}
        confirmLabel={confirmAction?.action === 'retry' ? 'اجرای دوباره' : 'لغو عملیات'}
        description={
          confirmAction?.action === 'retry'
            ? 'یک Job جدید با همان دامنه ساخته می‌شود و آیتم‌های ناموفق دوباره پردازش می‌شوند.'
            : 'آیتم‌های باقی‌مانده پردازش نمی‌شوند. این کار قابل بازگشت نیست.'
        }
      />
    </div>
  )
}
