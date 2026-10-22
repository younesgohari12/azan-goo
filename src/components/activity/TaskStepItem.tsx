import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, Eye } from 'lucide-react'
import { useState } from 'react'

import { STEP_STATUS_META, StepStatusIcon, toneTextClass } from './status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import type { TaskStep } from '@/types/model'

/** One step of the plan: title and status first, technical detail on demand. */
export function TaskStepItem({ step, index }: { step: TaskStep; index: number }) {
  const { state, actions, derived } = useYAgent()
  const [open, setOpen] = useState(false)
  const meta = STEP_STATUS_META[step.status]
  const active = step.status === 'active'
  const hasDetails = Boolean(step.description || step.summary || step.detail)

  const previewPageId = state.preview.pageId ?? derived.activeConversation?.previewPageId

  return (
    <li className="yagent-step-line relative ps-8">
      <span className="absolute start-0 top-1.5">
        <StepStatusIcon status={step.status} index={index} />
      </span>

      <div
        className={cn(
          'rounded-y-sm px-2 py-1.5 transition-colors duration-y ease-y',
          active ? 'bg-y-accent-soft ring-1 ring-inset ring-y-accent-border' : 'hover:bg-y-surface-hover',
        )}
      >
        <button
          type="button"
          onClick={() => hasDetails && setOpen((value) => !value)}
          className="flex w-full items-start gap-2 text-start"
          aria-expanded={hasDetails ? open : undefined}
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'text-y-base',
                  active ? 'font-medium text-y-ink' : step.status === 'pending' ? 'text-y-ink-dim' : 'text-y-ink-muted',
                )}
              >
                {step.title}
              </span>
              {step.status === 'waiting_approval' ? <Badge variant="warn">منتظر تأیید</Badge> : null}
              {step.status === 'error' ? <Badge variant="danger">خطا</Badge> : null}
              {step.status === 'skipped' ? <Badge variant="neutral">اجرا نشد</Badge> : null}
            </span>
            {step.description ? (
              <span className="mt-0.5 block text-y-xs text-y-ink-dim">{step.description}</span>
            ) : null}
          </span>
          {hasDetails ? (
            <ChevronDown
              className={cn(
                'mt-1 h-3.5 w-3.5 shrink-0 text-y-ink-dim transition-transform duration-y ease-y',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          ) : null}
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.17, ease: [0.22, 0.61, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2 rounded-y-sm border border-y-line bg-y-bg/60 p-2.5">
                {step.summary ? <p className="text-y-sm text-y-ink-muted">{step.summary}</p> : null}
                {step.detail?.output ? (
                  <p className="text-y-sm text-y-ink">
                    <span className={cn('text-y-xs', toneTextClass(meta.tone))}>نتیجه · </span>
                    {step.detail.output}
                  </p>
                ) : null}
                {step.detail?.warning ? (
                  <p className="flex items-start gap-1.5 text-y-sm text-y-warn">
                    <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0" />
                    <span>{step.detail.warning}</span>
                  </p>
                ) : null}
                {step.detail?.receipt?.length ? (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-y-line pt-2 text-y-xs">
                    {step.detail.receipt.map((item) => (
                      <div key={item.label} className="col-span-2 flex items-center justify-between gap-3">
                        <dt className="text-y-ink-dim">{item.label}</dt>
                        <dd className="yagent-ltr text-y-ink-muted">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {step.detail?.logs?.length ? (
                  <pre className="yagent-ltr overflow-x-auto rounded-y-xs bg-y-bg p-2 text-[11px] leading-5 text-y-ink-dim">
                    {step.detail.logs.join('\n')}
                  </pre>
                ) : null}
                {previewPageId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="yagent-tap w-full"
                    onClick={() =>
                      void actions.openPreview(previewPageId, step.detail?.previewRevisionId ?? derived.currentRevision?.id)
                    }
                  >
                    <Eye className="h-3.5 w-3.5" />
                    مشاهدهٔ پیش‌نمایش
                  </Button>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </li>
  )
}
