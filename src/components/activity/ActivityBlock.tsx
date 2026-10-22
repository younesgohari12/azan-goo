import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { STEP_STATUS_META, StepStatusIcon, TASK_STATUS_META, toneTextClass } from './status'
import { ProgressBar, Spinner } from '@/components/ui/feedback'
import { useNow } from '@/hooks/useNow'
import { cn, fa, formatElapsed, percentOf } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

/**
 * In-thread activity block: a short, live summary of the visible work plan.
 * It renders the plan and its statuses as they arrive from the adapter — there
 * is no fake reasoning, only the steps and summaries the adapter reports.
 */
export function ActivityBlock({ taskId }: { taskId: string }) {
  const { state } = useYAgent()
  const [expanded, setExpanded] = useState(false)
  const task = state.tasks[taskId]
  const live = task?.status === 'running' || task?.status === 'queued'
  const now = useNow(Boolean(live))

  if (!task) return null

  const meta = TASK_STATUS_META[task.status]
  const done = task.steps.filter((step) => step.status === 'done').length
  const total = task.steps.length
  const percent = percentOf(done, total)
  const activeStep =
    task.steps.find((step) => step.status === 'active') ??
    task.steps.find((step) => step.status === 'waiting_approval') ??
    task.steps.find((step) => step.status === 'pending')
  const elapsed = Math.max(0, (task.endedAt ?? now) - task.startedAt)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
      className={cn(
        'my-3 overflow-hidden rounded-y-lg border bg-y-surface-soft/70',
        task.status === 'error' ? 'border-y-danger/25' : 'border-y-line',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-start"
      >
        <span className="relative mt-0.5 flex h-5 w-5 items-center justify-center">
          {live ? (
            <>
              <span className="absolute inset-0 rounded-full bg-y-accent/20 animate-y-ring" />
              <Spinner size={16} />
            </>
          ) : (
            <StepStatusIcon
              status={
                task.status === 'done'
                  ? 'done'
                  : task.status === 'error'
                    ? 'error'
                    : task.status === 'waiting_approval'
                      ? 'waiting_approval'
                      : 'skipped'
              }
              index={0}
            />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={cn('text-y-base font-medium', toneTextClass(meta.tone))}>{meta.label}</span>
            <span className="yagent-num text-y-xs text-y-ink-dim" title="زمان سپری‌شده">
              {formatElapsed(elapsed)}
            </span>
          </span>
          <span className="mt-1 block text-y-base leading-7 text-y-ink-muted">
            {task.status === 'error' && task.error ? task.error : task.summary}
          </span>
          {activeStep && live ? (
            <span className="mt-1.5 flex items-center gap-2 text-y-sm text-y-ink-dim">
              <span className="h-1 w-1 rounded-full bg-y-accent" />
              {activeStep.title}
            </span>
          ) : null}
        </span>

        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-y-ink-dim transition-transform duration-y ease-y',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <div className="px-3.5 pb-3">
        <div className="flex items-center gap-2.5">
          <ProgressBar
            percent={percent}
            tone={task.status === 'error' ? 'danger' : task.status === 'done' ? 'success' : 'accent'}
          />
          <span className="yagent-num shrink-0 text-y-xs text-y-ink-dim">
            {fa(done)} از {fa(total)}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.19, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden border-t border-y-line"
          >
            <ul className="space-y-2.5 p-3.5">
              {task.steps.map((step, index) => (
                <li key={step.id} className="flex items-start gap-2.5">
                  <StepStatusIcon status={step.status} index={index + 1} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'text-y-sm',
                          step.status === 'pending' ? 'text-y-ink-dim' : 'text-y-ink',
                        )}
                      >
                        {step.title}
                      </span>
                      <span className={cn('text-y-xs', toneTextClass(STEP_STATUS_META[step.status].tone))}>
                        {STEP_STATUS_META[step.status].label}
                      </span>
                    </div>
                    {step.summary ? (
                      <p className="mt-0.5 text-y-xs leading-6 text-y-ink-muted">{step.summary}</p>
                    ) : null}
                    {step.detail?.logs?.length ? (
                      <pre className="yagent-ltr mt-1.5 max-w-full overflow-x-auto rounded-y-xs bg-y-bg p-2 text-[11px] leading-5 text-y-ink-dim">
                        {step.detail.logs.join('\n')}
                      </pre>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
