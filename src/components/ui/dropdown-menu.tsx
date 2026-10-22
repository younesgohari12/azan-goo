import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** RTL by default: the menu renders in a portal outside the shell, so it must
 *  not inherit the host page's direction. `dir` reaches the portalled content
 *  through Radix's own context. */
export function DropdownMenu({ dir = 'rtl', ...props }: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root dir={dir} {...props} />
}

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuSub = DropdownMenuPrimitive.Sub

const contentClasses = cn(
  /* Portal content lives outside the shell: re-apply the theme scope. */
  'yagent-root z-[80] min-w-[12rem] overflow-hidden rounded-y-md border border-y-line bg-y-bg-elevated p-1',
  'shadow-y-pop data-[state=open]:animate-y-fade-in',
)

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(contentClasses, className)}
        {...props}
      />
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
      <span className="flex-1 truncate">{children}</span>
      {selected ? <Check className="h-3.5 w-3.5 text-y-accent" /> : null}
    </DropdownMenuPrimitive.Item>
  )
})

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator ref={ref} className={cn('my-1 h-px bg-y-line', className)} {...props} />
  )
})

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-2.5 py-1.5 text-y-xs text-y-ink-dim', className)}>{children}</div>
}
