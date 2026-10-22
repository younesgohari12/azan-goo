import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  title?: string
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'md',
}: {
  value: T
  options: Array<SegmentedOption<T>>
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
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
            role="tab"
            type="button"
            aria-selected={active}
            title={option.title ?? option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-y-xs font-medium transition-colors duration-y-fast ease-y',
              size === 'sm' ? 'h-6 px-2 text-y-xs' : 'h-7 px-2.5 text-y-sm',
              active
                ? 'bg-y-surface-hover text-y-ink shadow-y-soft'
                : 'text-y-ink-dim hover:text-y-ink-muted',
            )}
          >
            {option.icon}
            <span className={cn(option.icon ? 'hidden sm:inline' : '')}>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
