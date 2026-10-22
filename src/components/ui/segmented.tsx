import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  title?: string
}

/**
 * Compact toggle group.
 *
 * These are independent toggles, not tabs — there is no tab/panel relationship —
 * so each option is a real `button` with `aria-pressed`, reachable and operable
 * with the keyboard through normal tab order.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'md',
  label,
}: {
  value: T
  options: Array<SegmentedOption<T>>
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
  label?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-y-sm border border-y-line bg-y-surface-soft p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            title={option.title ?? option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-y-xs font-medium',
              'transition-colors duration-y-fast ease-y',
              size === 'sm' ? 'h-7 px-2 text-y-xs' : 'h-8 px-2.5 text-y-sm',
              active
                ? 'bg-y-surface-hover text-y-ink shadow-y-soft'
                : 'text-y-ink-dim hover:text-y-ink-muted',
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
