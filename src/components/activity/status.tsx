import { AlertTriangle, Check, Minus, Pause } from 'lucide-react'
import { type ReactNode } from 'react'

import { Spinner } from '@/components/ui/feedback'
import { cn, fa } from '@/lib/utils'
import type { TaskStepStatus, TaskStatus } from '@/types/model'

export interface StatusMeta {
  label: string
  tone: 'neutral' | 'accent' | 'success' | 'warn' | 'danger'
}

export const STEP_STATUS_META: Record<TaskStepStatus, StatusMeta> = {
  pending: { label: 'در انتظار', tone: 'neutral' },
  active: { label: 'در حال انجام', tone: 'accent' },
  done: { label: 'انجام‌شده', tone: 'success' },
  waiting_approval: { label: 'منتظر تأیید', tone: 'warn' },
  error: { label: 'خطا', tone: 'danger' },
  skipped: { label: 'اجرا نشد', tone: 'neutral' },
}

export const TASK_STATUS_META: Record<TaskStatus, StatusMeta> = {
  queued: { label: 'در صف اجرا', tone: 'neutral' },
  running: { label: 'هوش مصنوعی در حال کار است', tone: 'accent' },
  waiting_approval: { label: 'منتظر تأیید تو هستم', tone: 'warn' },
  done: { label: 'کار تمام شد', tone: 'success' },
  error: { label: 'کار با خطا متوقف شد', tone: 'danger' },
  stopped: { label: 'کار متوقف شد', tone: 'neutral' },
}

const toneText: Record<StatusMeta['tone'], string> = {
  neutral: 'text-y-ink-dim',
  accent: 'text-y-accent',
  success: 'text-y-success',
  warn: 'text-y-warn',
  danger: 'text-y-danger',
}

export const toneTextClass = (tone: StatusMeta['tone']) => toneText[tone]

/** Step marker: emerald check, smooth spinner, hollow numbered circle, amber pause… */
export function StepStatusIcon({
  status,
  index,
  className,
}: {
  status: TaskStepStatus
  index: number
  className?: string
}): ReactNode {
  const base = 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full'
  switch (status) {
    case 'done':
      return (
        <span className={cn(base, 'animate-y-pop bg-y-success-soft text-y-success ring-1 ring-inset ring-y-success/35', className)}>
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )
    case 'active':
      return (
        <span className={cn(base, className)}>
          <Spinner size={16} />
        </span>
      )
    case 'waiting_approval':
      return (
        <span className={cn(base, 'bg-y-warn-soft text-y-warn ring-1 ring-inset ring-y-warn/35', className)}>
          <Pause className="h-3 w-3" strokeWidth={2.5} />
        </span>
      )
    case 'error':
      return (
        <span className={cn(base, 'bg-y-danger-soft text-y-danger ring-1 ring-inset ring-y-danger/35', className)}>
          <AlertTriangle className="h-3 w-3" strokeWidth={2.4} />
        </span>
      )
    case 'skipped':
      return (
        <span className={cn(base, 'border border-y-line-strong text-y-ink-dim', className)}>
          <Minus className="h-3 w-3" strokeWidth={2.4} />
        </span>
      )
    default:
      return (
        <span
          className={cn(
            base,
            'yagent-num border border-dashed border-y-line-strong text-[10px] text-y-ink-dim',
            className,
          )}
        >
          {fa(index)}
        </span>
      )
  }
}
