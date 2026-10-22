import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type ReactNode } from 'react'

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
        <TooltipPrimitive.Content
          side={side}
          sideOffset={8}
          dir="rtl"
          className={cn(
            /* Portal content lives outside the shell: re-apply the theme scope. */
            'yagent-root z-[70] max-w-[16rem] rounded-y-sm border border-y-line bg-y-bg-elevated px-2.5 py-1.5',
            'text-y-xs leading-6 text-y-ink-muted shadow-y-pop',
            'data-[state=delayed-open]:animate-y-fade-in',
          )}
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
