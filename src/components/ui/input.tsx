import { forwardRef } from 'react'
import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-lg border border-input bg-card text-[13px] text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-border focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldBase, 'h-9 px-3', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-[76px] px-3 py-2 leading-6', className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(fieldBase, 'h-9 cursor-pointer pe-8 ps-3', className)} {...props}>
      {children}
    </select>
  )
})

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-xs font-medium text-foreground', className)} {...props} />
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string
  hint?: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {label && (
        <Label>
          {label}
          {required && <span className="ms-1 text-primary">*</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[11px] text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export function SearchInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <svg
        className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <Input className="pe-9" {...props} />
    </div>
  )
}
