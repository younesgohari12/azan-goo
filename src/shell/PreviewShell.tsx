import type { ReactNode } from 'react'
import './PreviewShell.css'

/**
 * پوستهٔ سادهٔ پیش‌نمایش.
 * کیف پول قرار است داخل پیام‌رسان Orbit بنشیند؛ این پوسته فقط عرض محتوا را
 * کنترل می‌کند و روی دسکتاپ یک قاب ساده دور کیف پول می‌کشد.
 */
export function PreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <p className="shell__label">پیش‌نمایش مستقل کیف پول Orbit</p>
      <div className="shell__panel">{children}</div>
    </div>
  )
}
