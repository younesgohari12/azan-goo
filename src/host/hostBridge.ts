import type { TransactionStatus } from '../data/types'

/**
 * محل اتصال کیف پول به برنامهٔ میزبان (پیام‌رسان Orbit).
 *
 * کیف پول هیچ وابستگی‌ای به میزبان ندارد: تنها از طریق همین واسط با آن حرف می‌زند.
 * میزبان می‌تواند پیش از سوار کردن کیف پول، `window.OrbitHost` را تنظیم کند:
 *
 * ```js
 * window.OrbitHost = {
 *   onWalletBack: () => router.back(),
 *   onWalletEvent: (event) => analytics.track('wallet_action', event),
 * }
 * ```
 *
 * بدون میزبان، کیف پول به‌صورت مستقل کار می‌کند (حالت پیش‌نمایش).
 */
export interface OrbitWalletEvent {
  type: 'topup' | 'transfer' | 'withdraw'
  amount: number
  status: TransactionStatus
}

export interface OrbitHostBridge {
  /** دکمهٔ بازگشت صفحهٔ اصلی کیف پول */
  onWalletBack?: () => void
  /** رویداد عملیات کیف پول، برای هماهنگی با میزبان */
  onWalletEvent?: (event: OrbitWalletEvent) => void
}

declare global {
  interface Window {
    OrbitHost?: OrbitHostBridge
  }
}

function getHost(): OrbitHostBridge {
  if (typeof window === 'undefined') return {}
  return window.OrbitHost ?? {}
}

/** آیا میزبان یک کنترل بازگشت به کیف پول داده است؟ */
export function hasHostBridge(): boolean {
  return typeof getHost().onWalletBack === 'function'
}

/** بازگشت به میزبان؛ اگر میزبانی وصل نباشد false برمی‌گرداند */
export function requestHostBack(): boolean {
  const handler = getHost().onWalletBack
  if (typeof handler !== 'function') return false
  handler()
  return true
}

/** اطلاع‌دادن عملیات کیف پول به میزبان */
export function emitWalletEvent(event: OrbitWalletEvent): void {
  getHost().onWalletEvent?.(event)
}
