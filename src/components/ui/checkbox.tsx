import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
  disabled,
  className,
  ariaLabel,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
}) {
  return (
    <label className={cn('inline-flex cursor-pointer select-none items-center gap-2', disabled && 'cursor-not-allowed opacity-50', className)}>
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <input
          type="checkbox"
          aria-label={ariaLabel ?? label}
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-[5px] border transition-all duration-150',
            checked || indeterminate
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-card hover:border-muted-foreground/50',
          )}
        >
          {indeterminate ? <Minus className="h-3 w-3" strokeWidth={3} /> : checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
      </span>
      {label && <span className="text-[13px] text-foreground">{label}</span>}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
  size = 'md',
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label?: string
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' ? 'h-5 w-9' : 'h-4 w-7',
        checked ? 'justify-end bg-primary' : 'justify-start bg-muted-foreground/25',
      )}
    >
      <span
        className={cn(
          'rounded-full bg-white shadow-sm transition-all duration-200 ease-smooth',
          size === 'md' ? 'h-4 w-4' : 'h-3 w-3',
        )}
      />
    </button>
  )
}
