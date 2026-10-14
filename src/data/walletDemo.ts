import { demoTestParams, DEMO_OUTCOMES, walletDisplayConfig } from './walletConfig'
import type { OperationType, TransactionStatus } from './types'

/**
 * وضعیت نتیجهٔ نمایشی هر عملیات.
 *
 * پیش‌فرض از `walletDisplayConfig.demoStatus` می‌آید و پارامتر آدرس (فقط برای
 * تست) می‌تواند آن را روی همهٔ عملیات‌ها بازنویسی کند؛ مثلاً `/?demo=failed`.
 * چون هنگام اجرای عملیات خوانده می‌شود، تغییر آدرس بدون بارگذاری دوباره هم اثر دارد.
 */
export function resolveDemoStatus(type: OperationType): TransactionStatus {
  if (typeof window !== 'undefined') {
    const value = new URLSearchParams(window.location.search).get(demoTestParams.outcome)
    if (value && (DEMO_OUTCOMES as string[]).includes(value)) return value as TransactionStatus
  }
  return walletDisplayConfig.demoStatus[type]
}

function readSearchParam(name: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

/** فقط برای نمایش حالت «موجودی صفر» در پیش‌نمایش: `/?balance=0` */
export function resolveInitialBalance(fallback: number): number {
  if (readSearchParam(demoTestParams.emptyList) === '1') return 0
  const raw = readSearchParam(demoTestParams.balance)
  if (raw === null) return fallback
  const value = Number(raw.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[^\d]/g, ''))
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

/** فقط برای نمایش حالت «بدون تراکنش» در پیش‌نمایش: `/?empty=1` */
export function resolveShowTransactions(): boolean {
  return readSearchParam(demoTestParams.emptyList) !== '1'
}
