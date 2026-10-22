import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

import { IconButton } from './button'
import { PortalLayer } from './portal-layer'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogClose = DialogPrimitive.Close

function Overlay({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]',
        'data-[state=open]:animate-y-fade-in',
        className,
      )}
    />
  )
}

/**
 * Centered dialog used for confirmations (delete conversation, publish).
 *
 * Centering is done by a fixed grid wrapper, NOT by `translate(-50%, -50%)` on
 * the content: the entrance animation animates `transform`, and with
 * `fill-mode: both` it used to overwrite the translate and drop the dialog onto
 * an arbitrary spot (on a 390px screen it started at x=195 and ran off the right
 * edge). The content is a normal relative box now, so the animation and the
 * layout cannot fight each other.
 */
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
      <PortalLayer className="fixed inset-0 z-[65] grid place-items-center overflow-y-auto p-3 sm:p-6">
        <DialogPrimitive.Content
          className={cn(
            'relative w-full max-w-[30rem] rounded-y-lg border border-y-line bg-y-bg-elevated shadow-y-pop outline-none',
            // Never taller than the viewport: the body scrolls, the header stays visible.
            'max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:max-h-[calc(100dvh-3rem)]',
            'data-[state=open]:animate-y-rise',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <DialogPrimitive.Title className="text-y-lg font-semibold text-y-ink">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-y-base leading-7 text-y-ink-muted">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton label="بستن" size="md" className="yagent-tap">
                <X className="h-4 w-4" />
              </IconButton>
            </DialogPrimitive.Close>
          </div>
          {children ? <div className="mt-4">{children}</div> : null}
          {footer ? <div className="mt-5 flex flex-wrap items-center justify-end gap-2">{footer}</div> : null}
        </DialogPrimitive.Content>
      </PortalLayer>
    </DialogPrimitive.Portal>
  )
}

/** Side sheet for the mobile drawers, the rail's history overlay and the desktop panel. */
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
        <PortalLayer>
          <DialogPrimitive.Content
            aria-label={title}
            className={cn(
              'fixed inset-y-0 z-[65] flex w-[min(20rem,88vw)] flex-col bg-y-sidebar shadow-y-pop outline-none',
              side === 'right' ? 'right-0 border-l border-y-line' : 'left-0 border-r border-y-line',
              'transition-transform duration-[220ms] ease-y',
              side === 'right'
                ? 'data-[state=closed]:translate-x-full data-[state=open]:translate-x-0'
                : 'data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
              className,
            )}
          >
            {/* A drawer always shows its own title and an explicit close control,
                so it is obvious how to get back. */}
            <header className="flex items-center gap-2 border-b border-y-line px-3 py-2">
              <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-y-base font-medium text-y-ink">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <IconButton label="بستن" size="md" className="yagent-tap">
                  <X className="h-4 w-4" />
                </IconButton>
              </DialogPrimitive.Close>
            </header>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </DialogPrimitive.Content>
        </PortalLayer>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
