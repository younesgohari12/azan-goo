import { cn } from '@/lib/utils'

/** Thin, always-smooth spinner used for active steps. */
export function Spinner({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <span
      role="status"
      aria-label="در حال انجام"
      style={{ width: size, height: size }}
      className={cn('inline-block animate-spin rounded-full border-y-[1.5px] border-y-ink-dim/35 border-t-y-accent', className)}
    />
  )
}

export function ProgressBar({ percent, tone = 'accent', className }: { percent: number; tone?: 'accent' | 'success' | 'danger'; className?: string }) {
  const tones = {
    accent: 'bg-y-accent',
    success: 'bg-y-success',
    danger: 'bg-y-danger',
  } as const
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-y-surface-hover', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-y-slow ease-y', tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  )
}
