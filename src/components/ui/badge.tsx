import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline'

const variants: Record<Variant, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-muted text-muted-foreground',
  outline: 'border border-border text-muted-foreground',
}

const dotColors: Record<Variant, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-muted-foreground/60',
  outline: 'bg-muted-foreground/60',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
  dot?: boolean
  pulse?: boolean
}

export function Badge({ className, variant = 'neutral', dot, pulse, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium leading-5',
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant], pulse && 'animate-pulse-soft')} />}
      {children}
    </span>
  )
}
