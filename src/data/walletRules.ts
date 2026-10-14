import { walletDisplayConfig } from './walletConfig'
import type { Recipient, TransactionStatus, WithdrawDestination } from './types'

/**
 * عملیات قابل اجرا در کیف پول — کاملاً محلی و نمایشی.
 * این نوع‌ها مرز بین UI و قواعد نمونه‌اند؛ نسخهٔ نهایی همین عملیات را به بک‌اند
 * می‌فرستد و پاسخ سرور را نمایش می‌دهد.
 */
export type WalletOperation =
  | { type: 'topup'; amount: number }
  | { type: 'transfer'; amount: number; recipient: Recipient; note?: string }
  | { type: 'withdraw'; amount: number; destination: WithdrawDestination }

/** کارمزد نمونهٔ همان عملیات */
export function operationFee(operation: WalletOperation): number {
  return walletDisplayConfig.fees[operation.type]
}

/**
 * تغییر موجودی در نتیجهٔ همان عملیات:
 * - افزایش اعتبار فقط در نتیجهٔ موفق به موجودی اضافه می‌کند (کارمزد از پرداخت است، نه از کیف پول).
 * - انتقال در نتیجهٔ موفق (و نه ناموفق) «جمع» یعنی مبلغ + کارمزد را از موجودی کم می‌کند.
 * - برداشت کارمزد را از خودِ مبلغ برداشت کسر می‌کند (مبلغ دریافتی = مبلغ − کارمزد)، پس
 *   موجودی به اندازهٔ همان مبلغ برداشت کم می‌شود؛ در «در انتظار» رزرو و در «موفق» قطعی.
 *   نتیجهٔ ناموفق هیچ چیزی از موجودی کم نمی‌کند.
 */
export function operationBalanceDelta(operation: WalletOperation, status: TransactionStatus): number {
  if (status === 'failed') return 0
  if (operation.type === 'topup') return status === 'success' ? operation.amount : 0
  if (operation.type === 'transfer') return -(operation.amount + operationFee(operation))
  return -operation.amount
}

/** آیا این نتیجهٔ عملیات موجودی را دست می‌زند؟ (برای نمایش «موجودی جدید») */
export function operationChangesBalance(operation: WalletOperation, status: TransactionStatus): boolean {
  return operationBalanceDelta(operation, status) !== 0
}
