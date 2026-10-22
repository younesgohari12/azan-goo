import { ListChecks, MessageSquareWarning, PanelLeftClose } from 'lucide-react'

import { TaskStepItem } from './TaskStepItem'
import { TASK_STATUS_META, toneTextClass } from './status'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/feedback'
import { Segmented } from '@/components/ui/segmented'
import { FeedbackPanel } from '@/components/preview/FeedbackPanel'
import { useNow } from '@/hooks/useNow'
import { cn, fa, formatElapsed } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

/**
 * "مراحل انجام کار" — the plan of the current request.
 * Step order and count come from the adapter; the progress percentage is
 * computed from the real step states (no cosmetic completion).
 */
export function TaskPanel({ onCollapse }: { onCollapse?: () => void }) {
  const { state, actions, derived } = useYAgent()
  const task = derived.currentTask
  const live = task ? task.status === 'running' || task.status === 'queued' : false
  const now = useNow(Boolean(live))

  const draftCount = derived.draftAnnotations.length
  const tab = state.panelTab

  return (
    <div className="flex h-full w-full flex-col bg-y-bg-elevated">
      <header className="flex items-center gap-2 border-b border-y-line px-3 py-3">
        <ListChecks className="h-4 w-4 shrink-0 text-y-accent" />
        <span className="flex-1 text-y-base font-medium text-y-ink">مراحل انجام کار</span>
        {onCollapse ? (
          <IconButton label="جمع‌کردن پنل" onClick={onCollapse}>
            <PanelLeftClose className="h-4 w-4" />
          </IconButton>
        ) : null}
      </header>

      <div className="px-3 pt-3">
        <Segmented
          className="w-full [&>button]:flex-1"
          value={tab}
          onChange={(value) => actions.setPanel({ tab: value })}
          options={[
            { value: 'steps', label: 'مراحل', icon: <ListChecks className="h-3.5 w-3.5" /> },
            {
              value: 'feedback',
              label: draftCount > 0 ? `بازخورد (${fa(draftCount)})` : 'بازخورد',
              icon: <MessageSquareWarning className="h-3.5 w-3.5" />,
            },
          ]}
        />
      </div>

      <div className="yagent-scroll flex-1 px-3 py-3.5">
        {tab === 'feedback' ? (
          <FeedbackPanel />
        ) : task ? (
          <div className="space-y-3.5">
            <div className="rounded-y-md border border-y-line bg-y-surface-soft/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-y-base font-medium text-y-ink">{task.title}</p>
                  <p className="mt-0.5 text-y-xs text-y-ink-dim">شروع: {formatElapsed(Math.max(0, (task.endedAt ?? now) - task.startedAt))} پیش</p>
                </div>
                <Badge
                  variant={
                    task.status === 'done'
                      ? 'success'
                      : task.status === 'error'
                        ? 'danger'
                        : task.status === 'waiting_approval'
                          ? 'warn'
                          : 'accent'
                  }
                >
                  {TASK_STATUS_META[task.status].label}
                </Badge>
              </div>

              <p className={cn('mt-2 text-y-sm leading-7', toneTextClass(TASK_STATUS_META[task.status].tone))}>
                {task.status === 'error' && task.error ? task.error : task.summary}
              </p>

              <div className="mt-3 flex items-center gap-2.5">
                <ProgressBar
                  percent={derived.taskProgress.percent}
                  tone={
                    task.status === 'error' ? 'danger' : task.status === 'done' ? 'success' : 'accent'
                  }
                />
                <span className="yagent-num shrink-0 text-y-xs text-y-ink-dim">
                  {fa(derived.taskProgress.done)} از {fa(derived.taskProgress.total)}
                </span>
              </div>
            </div>

            <ol className="space-y-1.5">
              {task.steps.map((step, index) => (
                <TaskStepItem key={step.id} step={step} index={index + 1} />
              ))}
            </ol>

            {task.status === 'done' ? (
              <p className="rounded-y-md border border-y-success/20 bg-y-success-soft/50 px-3 py-2 text-y-sm text-y-success">
                همهٔ مراحل با موفقیت انجام شد.
              </p>
            ) : null}
            {task.status === 'stopped' ? (
              <p className="rounded-y-md border border-y-line bg-y-surface-soft/60 px-3 py-2 text-y-sm text-y-ink-muted">
                این کار متوقف شد. می‌توانی درخواست تازه‌ای بدهی یا از همین‌جا ادامه بدهی.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-2 py-14 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-y-md bg-y-surface-soft text-y-ink-dim">
              <ListChecks className="h-4 w-4" />
            </span>
            <p className="text-y-base text-y-ink-muted">هنوز کاری در این گفتگو شروع نشده.</p>
            <p className="text-y-xs leading-6 text-y-ink-dim">
              وقتی درخواستی بفرستی، مراحل اجرای آن همین‌جا مرحله‌به‌مرحله نشان داده می‌شود.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
