import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

import { IconButton } from './button'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogClose = DialogPrimitive.Close

function Overlay({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]',
        'data-[state=open]:animate-y-fade-in',
        className,
      )}
    />
  )
}

/** Centered dialog used for confirmations (delete conversation, publish). */
export function DialogContent({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[65] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2',
          'rounded-y-lg border border-y-line bg-y-bg-elevated p-5 shadow-y-pop outline-none',
          'data-[state=open]:animate-y-rise',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <DialogPrimitive.Title className="text-y-lg font-semibold text-y-ink">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-y-base leading-7 text-y-ink-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton label="بستن" size="xs">
              <X className="h-4 w-4" />
            </IconButton>
          </DialogPrimitive.Close>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-5 flex items-center justify-end gap-2">{footer}</div> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** Side sheet for mobile drawers and the desktop overlay panel. */
export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  title,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'right' | 'left'
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <Overlay />
        <DialogPrimitive.Content
          aria-label={title}
          className={cn(
            'fixed inset-y-0 z-[65] flex flex-col bg-y-bg shadow-y-pop outline-none',
            side === 'right' ? 'right-0 border-l border-y-line' : 'left-0 border-r border-y-line',
            'transition-transform duration-[220ms] ease-y',
            side === 'right'
              ? 'data-[state=closed]:translate-x-full data-[state=open]:translate-x-0'
              : 'data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
            'w-[min(19rem,86vw)] max-w-[86vw]',
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
