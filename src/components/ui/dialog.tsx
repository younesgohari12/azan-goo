import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

import { IconButton } from './button'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogClose = DialogPrimitive.Close

/** Shared portal surface class: Radix portals render into <body>, outside the
 *  shell, so each one re-applies the theme scope and the RTL direction. */
const portalSurface = 'yagent-root'

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
      {/* The wrapper centres the dialog. Centring must not rely on a transform
          on Content: the entrance animation transforms too and would win.
          `pointer-events-none` keeps outside presses on the overlay (close). */}
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]',
        )}
      >
        <DialogPrimitive.Content
          dir="rtl"
          className={cn(
            portalSurface,
            'pointer-events-auto flex max-h-full w-full max-w-[30rem] flex-col overflow-hidden',
            'rounded-y-lg border border-y-line bg-y-bg-elevated shadow-y-pop outline-none',
            'data-[state=open]:animate-y-dialog-in',
            className,
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
            <div className="min-w-0 space-y-1.5">
              <DialogPrimitive.Title className="text-y-lg font-semibold text-y-ink">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-y-base leading-7 text-y-ink-muted">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton
                label="بستن"
                size="sm"
                variant="secondary"
                className="border-y-line bg-y-surface text-y-ink-muted hover:text-y-ink"
              >
                <X className="h-4 w-4" />
              </IconButton>
            </DialogPrimitive.Close>
          </div>

          {children ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 sm:px-5">{children}</div>
          ) : null}

          {footer ? (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-y-line px-4 py-3 sm:px-5">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </div>
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
          dir="rtl"
          className={cn(
            portalSurface,
            'fixed inset-y-0 z-[65] flex w-[min(19rem,86vw)] max-w-[86vw] flex-col overflow-hidden bg-y-bg shadow-y-pop outline-none',
            'pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]',
            side === 'right' ? 'right-0 border-l border-y-line' : 'left-0 border-r border-y-line',
            'transition-transform duration-[220ms] ease-y',
            side === 'right'
              ? 'data-[state=closed]:translate-x-full data-[state=open]:translate-x-0'
              : 'data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
