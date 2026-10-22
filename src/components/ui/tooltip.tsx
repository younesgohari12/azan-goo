import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type ReactNode } from 'react'

import { PortalLayer } from './portal-layer'
import { cn } from '@/lib/utils'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={280} skipDelayDuration={120}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

export function Tooltip({
  label,
  children,
  side = 'bottom',
  disabled = false,
}: {
  label: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  disabled?: boolean
}) {
  if (disabled || !label) return <>{children}</>
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <PortalLayer>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            collisionPadding={8}
            className={cn(
              'z-[90] max-w-[16rem] rounded-y-sm border border-y-line bg-y-bg-elevated px-2.5 py-1.5',
              'text-y-xs leading-6 text-y-ink shadow-y-pop',
              'data-[state=delayed-open]:animate-y-fade-in',
            )}
          >
            {label}
          </TooltipPrimitive.Content>
        </PortalLayer>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
