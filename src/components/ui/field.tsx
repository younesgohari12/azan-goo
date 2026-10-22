import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-y-sm border border-y-line bg-y-surface-soft px-3 text-y-base text-y-ink',
        'placeholder:text-y-ink-dim transition-colors duration-y-fast ease-y',
        'hover:border-y-line-strong focus:border-y-accent-border',
        className,
      )}
      {...props}
    />
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-y-md border border-y-line bg-y-surface-soft p-3 text-y-base text-y-ink',
          'placeholder:text-y-ink-dim transition-colors duration-y-fast ease-y',
          'hover:border-y-line-strong focus:border-y-accent-border',
          className,
        )}
        {...props}
      />
    )
  },
)
