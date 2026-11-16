import { useMemo, useState } from 'react'
import { ArrowLeft, CalendarClock, Filter, MoreHorizontal, PlayCircle, Plus, Workflow, Zap } from 'lucide-react'
import type { Automation } from '@/api/types'
import { useAutomations, useCreateAutomation, useRunAutomation, useToggleAutomation, useUpdateAutomation } from '@/api/hooks'
import { formatRelative } from '@/lib/format'
import {
  automationActionLabels,
  automationTriggerLabels,
  conditionFieldLabels,
  conditionOperatorLabels,
  scheduleLabels,
} from '@/lib/status'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/dialog'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { MenuItem, MenuSeparator, Popover } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Segmented } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { RuleBuilderModal } from './rule-builder'

const resultMeta = {
  success: { label: 'آخرین اجرا موفق', variant: 'success' as const },
  failed: { label: 'آخرین اجرا ناموفق', variant: 'danger' as const },
  never: { label: 'اجرا نشده', variant: 'neutral' as const },
}

function RuleCard({
  automation,
  onEdit,
  onRun,
}: {
  automation: Automation
  onEdit: () => void
  onRun: () => void
}) {
  const toggle = useToggleAutomation()
  const { toast } = useToast()

  return (
    <Card className="flex flex-col transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-2 p-4 pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', automation.enabled ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground')}>
            <Workflow className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-foreground">{automation.name}</p>
            <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-5 text-muted-foreground">{automation.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Switch
            checked={automation.enabled}
            label={`فعال‌سازی ${automation.name}`}
            disabled={toggle.isPending}
            onChange={() =>
              toggle.mutate(automation.id, {
                onSuccess: (updated) =>
                  toast({
                    title: updated.enabled ? 'قانون فعال شد' : 'قانون غیرفعال شد',
                    description: updated.name,
                    variant: updated.enabled ? 'success' : 'info',
                  }),
                onError: (error) => toast({ title: 'تغییر وضعیت ناموفق بود', description: (error as Error).message, variant: 'error' }),
              })
            }
          />
          <Popover
            align="end"
            contentClassName="w-44"
            trigger={({ toggle: openMenu }) => (
              <IconButton aria-label="گزینه‌های قانون" onClick={openMenu} className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
            )}
          >
            <MenuItem icon={<PlayCircle className="h-3.5 w-3.5" />} onClick={onRun}>
              اجرای دستی
            </MenuItem>
            <MenuItem icon={<Workflow className="h-3.5 w-3.5" />} onClick={onEdit}>
              ویرایش قانون
            </MenuItem>
            <MenuSeparator />
            <MenuItem disabled>حذف قانون (پشتیبانی API نامشخص)</MenuItem>
          </Popover>
        </div>
      </div>

      <div className="mx-4 mb-3 rounded-lg border border-border/70 bg-muted/25 p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-card px-1.5 py-1 text-[10px] font-medium text-foreground shadow-sm">
            <Zap className="h-3 w-3 text-primary" />
            {automationTriggerLabels[automation.trigger] ?? automation.trigger}
          </span>
          <ArrowLeft className="h-3 w-3 text-muted-foreground/50" />
          {automation.conditions.length > 0 ? (
            automation.conditions.map((condition, index) => (
              <span key={index} className="inline-flex items-center gap-1 rounded-md bg-card px-1.5 py-1 text-[10px] text-muted-foreground shadow-sm">
                <Filter className="h-2.5 w-2.5" />
                {conditionFieldLabels[condition.field] ?? condition.field} {conditionOperatorLabels[condition.operator] ?? condition.operator}{' '}
                <span className="num text-foreground">{condition.value}</span>
              </span>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground">بدون شرط</span>
          )}
          <ArrowLeft className="h-3 w-3 text-muted-foreground/50" />
          {automation.actions.map((action, index) => (
            <span key={index} className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-1.5 py-1 text-[10px] font-medium text-primary">
              <PlayCircle className="h-2.5 w-2.5" />
              {automationActionLabels[action.type] ?? action.type}
              {action.params.value ? ` (${action.params.value})` : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border/70 px-4 py-2.5 text-[10px]">
        <div>
          <p className="text-muted-foreground">آخرین اجرا</p>
          <p className="mt-0.5 text-foreground">{automation.last_run_at ? formatRelative(automation.last_run_at) : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">اجرای بعدی</p>
          <p className="mt-0.5 text-foreground">{automation.next_run_at ? formatRelative(automation.next_run_at) : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">تعداد اجرا</p>
          <p className="num mt-0.5 text-foreground">{automation.runs_count.toLocaleString('fa-IR')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Badge variant={automation.enabled ? 'success' : 'neutral'} dot>
            {automation.enabled ? 'فعال' : 'غیرفعال'}
          </Badge>
          <Badge variant={resultMeta[automation.last_result].variant}>{resultMeta[automation.last_result].label}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            {scheduleLabels[automation.schedule] ?? automation.schedule}
          </span>
          <Button variant="outline" size="sm" className="h-7 px-2 text-[10.5px]" onClick={onRun}>
            اجرا
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function AutomationPage() {
  const { data, isLoading, isError, error, refetch } = useAutomations()
  const createAutomation = useCreateAutomation()
  const updateAutomation = useUpdateAutomation()
  const runAutomation = useRunAutomation()
  const { toast } = useToast()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<Automation | null>(null)
  const [runTarget, setRunTarget] = useState<Automation | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const rules = useMemo(() => {
    const list = data ?? []
    if (filter === 'active') return list.filter((rule) => rule.enabled)
    if (filter === 'inactive') return list.filter((rule) => !rule.enabled)
    return list
  }, [data, filter])

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="اتوماسیون"
        description="قوانین خودکار برای قیمت، موجودی، سفارش و اعلان‌ها؛ قابل ساخت، ویرایش، فعال‌سازی و اجرای دستی."
        actions={
          <Button
            variant="primary"
            size="sm"
            startIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => {
              setEditing(null)
              setBuilderOpen(true)
            }}
          >
            ساخت قانون
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { label: `همه (${data?.length ?? 0})`, value: 'all' },
            { label: `فعال (${data?.filter((rule) => rule.enabled).length ?? 0})`, value: 'active' },
            { label: `غیرفعال (${data?.filter((rule) => !rule.enabled).length ?? 0})`, value: 'inactive' },
          ]}
        />
        <p className="text-[10.5px] text-muted-foreground">
          فقط Trigger و Actionهای پشتیبانی‌شده توسط افزونه قابل انتخاب هستند.
        </p>
      </div>

      {isError ? (
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      ) : isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[240px] w-full" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <EmptyState
            icon={Workflow}
            title="قانونی وجود ندارد"
            description="اولین قانون اتوماسیون خود را بسازید تا تغییرات قیمت و موجودی خودکار انجام شود."
            action={
              <Button variant="primary" size="sm" onClick={() => setBuilderOpen(true)} startIcon={<Plus className="h-3.5 w-3.5" />}>
                ساخت قانون
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rules.map((automation) => (
            <RuleCard
              key={automation.id}
              automation={automation}
              onEdit={() => {
                setEditing(automation)
                setBuilderOpen(true)
              }}
              onRun={() => setRunTarget(automation)}
            />
          ))}
        </div>
      )}

      <RuleBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        automation={editing}
        loading={createAutomation.isPending || updateAutomation.isPending}
        onSubmit={(payload) => {
          const done = () => {
            toast({ title: editing ? 'قانون ویرایش شد' : 'قانون ایجاد شد', description: payload.name, variant: 'success' })
            setBuilderOpen(false)
          }
          const fail = (mutationError: unknown) =>
            toast({ title: 'ذخیره قانون ناموفق بود', description: (mutationError as Error).message, variant: 'error' })

          if (editing) updateAutomation.mutate({ id: editing.id, body: payload }, { onSuccess: done, onError: fail })
          else createAutomation.mutate(payload, { onSuccess: done, onError: fail })
        }}
      />

      <ConfirmDialog
        open={runTarget !== null}
        onClose={() => setRunTarget(null)}
        onConfirm={() => {
          if (!runTarget) return
          runAutomation.mutate(runTarget.id, {
            onSuccess: (result) => {
              toast({ title: 'قانون اجرا شد', description: result.message, variant: 'success' })
              setRunTarget(null)
            },
            onError: (mutationError) =>
              toast({ title: 'اجرای قانون ناموفق بود', description: (mutationError as Error).message, variant: 'error' }),
          })
        }}
        loading={runAutomation.isPending}
        tone="primary"
        title="اجرای دستی قانون"
        confirmLabel="اجرا کن"
        description={
          runTarget && (
            <div className="space-y-1.5">
              <p>قانون «{runTarget.name}» همین حالا اجرا می‌شود و ممکن است قیمت یا موجودی محصولات را تغییر دهد.</p>
              <p className="text-[11px] text-muted-foreground">
                اقدام‌ها: {runTarget.actions.map((action) => automationActionLabels[action.type] ?? action.type).join('، ')}
              </p>
            </div>
          )
        }
      />
    </div>
  )
}
