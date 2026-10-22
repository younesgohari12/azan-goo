import { cva, type VariantProps } from 'class-variance-authority'
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-y-xs leading-none',
  {
    variants: {
      variant: {
        neutral: 'border-y-line bg-y-surface-soft text-y-ink-muted',
        accent: 'border-y-accent-border bg-y-accent-soft text-y-accent',
        success: 'border-y-success/25 bg-y-success-soft text-y-success',
        warn: 'border-y-warn/25 bg-y-warn-soft text-y-warn',
        danger: 'border-y-danger/25 bg-y-danger-soft text-y-danger',
        plain: 'border-transparent bg-transparent text-y-ink-dim px-0',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode
  className?: string
  icon?: ReactNode
}

export function Badge({ children, className, icon, variant }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {icon}
      {children}
    </span>
  )
}

/** Small coloured dot used for statuses in lists and cards. */
export function StatusDot({ tone = 'neutral', className }: { tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger'; className?: string }) {
  const tones = {
    neutral: 'bg-y-ink-dim',
    accent: 'bg-y-accent',
    success: 'bg-y-success',
    warn: 'bg-y-warn',
    danger: 'bg-y-danger',
  } as const
  return <span className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', tones[tone], className)} />
}
