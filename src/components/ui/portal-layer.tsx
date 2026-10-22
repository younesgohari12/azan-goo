import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Theme scope for everything Radix renders into a portal.
 *
 * Menus, tooltips, dialogs and sheets are mounted in `document.body`, outside
 * `.yagent-root`. Without a wrapper they inherit none of the product: no design
 * tokens (transparent menus), no Vazirmatn (Times New Roman), and no `dir="rtl"`
 * (LTR menus inside an RTL interface).
 *
 * The wrapper carries the same `.yagent-root` class as the app root, so tokens,
 * font and the scoped reset apply to portalled content too. It stays a plain
 * static box — no transform, filter or overflow — so the fixed-positioned
 * popper/dialog inside it keeps positioning against the viewport, and its
 * z-index stays in the same stacking context as the rest of the app.
 */
export function PortalLayer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div dir="rtl" lang="fa" className={cn('yagent-root yagent-portal-layer', className)}>
      {children}
    </div>
  )
}
