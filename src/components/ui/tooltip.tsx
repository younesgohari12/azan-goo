import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-[90] w-max max-w-[240px] animate-fade-in rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-normal leading-5 text-slate-100 shadow-pop dark:bg-slate-700',
            side === 'top' ? 'bottom-full start-1/2 mb-1.5 -translate-x-1/2' : 'top-full start-1/2 mt-1.5 -translate-x-1/2',
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
