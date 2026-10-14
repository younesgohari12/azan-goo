import type { OperationType, TransactionStatus } from './types'

/**
 * تنظیمات نمایشی کیف پول.
 *
 * ⚠️ همهٔ مقادیر این فایل «نمونه» هستند: کارمزد، حد پایین، مبالغ پیشنهادی و
 * وضعیت نتیجهٔ عملیات هیچ‌کدام قانون واقعی سرویس نیستند و در نسخهٔ نهایی از
 * پاسخ بک‌اند خوانده و جایگزین می‌شوند.
 */
export const walletDisplayConfig = {
  currency: 'تومان',
  /** مقدار مرجع برای رزرو عرض اعداد در ناحیهٔ موجودی */
  amountReserve: 9_999_999,
  /** حداکثر تعداد رقم قابل ورود در کادر مبلغ */
  maxAmountDigits: 9,
  /** مبالغ پیشنهادی افزایش اعتبار */
  suggestedTopUps: [50_000, 100_000, 200_000, 500_000, 1_000_000],
  /** طول مجاز توضیح انتقال */
  transferNoteMax: 60,
  /** حد پایین نمایشی هر عملیات */
  limits: { topup: 10_000, transfer: 1_000, withdraw: 50_000 },
  /** کارمزد نمایشی هر عملیات */
  fees: { topup: 0, transfer: 0, withdraw: 5_000 },
  /** وضعیت نتیجهٔ هر عملیات در این نمونه */
  demoStatus: {
    topup: 'success',
    transfer: 'success',
    withdraw: 'pending',
  } as Record<OperationType, TransactionStatus>,
} as const

export type WalletDisplayConfig = typeof walletDisplayConfig
