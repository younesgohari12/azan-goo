import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  options: { label: ReactNode; value: T }[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[7px] font-medium transition-all duration-150',
            size === 'md' ? 'h-8 px-3 text-xs' : 'h-7 px-2.5 text-[11px]',
            value === option.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { label: string; value: T; count?: number }[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-border no-scrollbar', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-medium transition-colors',
            value === tab.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn('rounded px-1.5 py-0.5 text-[10px]', value === tab.value ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground')}>
              {tab.count}
            </span>
          )}
          {value === tab.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  )
}
