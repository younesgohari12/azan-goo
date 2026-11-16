import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Popover({
  trigger,
  children,
  align = 'start',
  className,
  contentClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode
  align?: 'start' | 'end'
  className?: string
  contentClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          className={cn(
            'absolute top-[calc(100%+6px)] z-50 min-w-48 animate-scale-in overflow-hidden rounded-xl border border-border bg-card p-1 shadow-pop',
            align === 'start' ? 'start-0' : 'end-0',
            contentClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
  disabled,
  active,
}: {
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-[12.5px] transition-colors disabled:opacity-40',
        danger ? 'text-danger hover:bg-danger-soft' : 'text-foreground hover:bg-muted',
        active && 'bg-muted font-medium',
      )}
    >
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />
}
