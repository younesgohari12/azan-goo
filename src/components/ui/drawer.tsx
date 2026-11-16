import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './button'

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-[1px]" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 start-0 flex w-full flex-col border-e border-border bg-card shadow-pop animate-slide-in-right',
          width === 'md' ? 'sm:max-w-[520px]' : 'sm:max-w-[720px]',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          <IconButton aria-label="بستن" onClick={onClose} className="-me-1.5">
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-5 py-3">{footer}</footer>}
      </aside>
    </div>
  )
}
