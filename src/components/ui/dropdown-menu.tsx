import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import { PortalLayer } from './portal-layer'
import { cn } from '@/lib/utils'

/**
 * Radix renders its menu content with `dir="ltr"` unless told otherwise, which
 * flipped every menu item inside this RTL interface. The direction is fixed on
 * the root, so the whole menu subtree inherits it.
 */
export function DropdownMenu({ dir = 'rtl', ...props }: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root dir={dir} {...props} />
}

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuSub = DropdownMenuPrimitive.Sub

// Opaque surface: an open menu must not let the content underneath stay readable.
const contentClasses = cn(
  'z-[80] min-w-[12rem] max-w-[min(22rem,90vw)] overflow-y-auto overscroll-contain',
  'rounded-y-md border border-y-line bg-y-bg-elevated p-1 shadow-y-pop',
  'max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))]',
  'data-[state=open]:animate-y-fade-in',
)

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, collisionPadding = 8, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      {/* Portalled content lives outside `.yagent-root`; the layer puts the theme
          (tokens, Vazirmatn, RTL, scoped reset) back around it. */}
      <PortalLayer>
        <DropdownMenuPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          className={cn(contentClasses, className)}
          {...props}
        />
      </PortalLayer>
    </DropdownMenuPrimitive.Portal>
  )
})

export const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { danger?: boolean; icon?: ReactNode; selected?: boolean }
>(function DropdownMenuItem({ className, danger = false, icon, selected = false, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-y-xs px-2.5 py-2 text-y-base outline-none',
        'transition-colors duration-y-fast ease-y',
        danger
          ? 'text-y-danger data-[highlighted]:bg-y-danger-soft'
          : 'text-y-ink-muted data-[highlighted]:bg-y-surface-hover data-[highlighted]:text-y-ink',
        className,
      )}
      {...props}
    >
      {icon ? <span className="flex h-4 w-4 items-center justify-center text-y-ink-dim">{icon}</span> : null}
      <span className="min-w-0 flex-1 text-start">{children}</span>
      {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-y-accent" /> : null}
    </DropdownMenuPrimitive.Item>
  )
})

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return <DropdownMenuPrimitive.Separator ref={ref} className={cn('my-1 h-px bg-y-line', className)} {...props} />
})

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-2.5 py-1.5 text-y-xs text-y-ink-dim', className)}>{children}</div>
}
