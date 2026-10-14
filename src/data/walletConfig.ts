import type { OperationType, TransactionStatus } from './types'

/**
 * تنظیمات نمایشی کیف پول.
 *
 * ⚠️ همهٔ مقادیر این فایل «نمونه» هستند: کارمزد، حد پایین، مبالغ پیشنهادی،
 * مدت پردازش و وضعیت نتیجهٔ عملیات هیچ‌کدام قانون واقعی سرویس نیستند و در
 * نسخهٔ نهایی از پاسخ بک‌اند خوانده و جایگزین می‌شوند. هیچ‌کدام داخل UI
 * hardcode نشده‌اند؛ تنها مرجع همین فایل است.
 */
export const walletDisplayConfig = {
  currency: 'تومان',
  /** مقدار مرجع برای رزرو عرض اعداد در ناحیهٔ موجودی */
  amountReserve: 9_999_999,
  /** حداکثر تعداد رقم قابل ورود در کادر مبلغ */
  maxAmountDigits: 9,
  /** مبالغ پیشنهادی افزایش اعتبار */
  suggestedTopUps: [50_000, 100_000, 200_000, 500_000, 1_000_000],
  /** مبالغ پیشنهادی انتقال */
  suggestedTransfers: [50_000, 100_000, 250_000, 500_000],
  /** طول مجاز توضیح انتقال */
  transferNoteMax: 60,
  /** حد پایین نمایشی هر عملیات */
  limits: { topup: 10_000, transfer: 1_000, withdraw: 50_000 },
  /** کارمزد نمایشی هر عملیات */
  fees: { topup: 0, transfer: 0, withdraw: 5_000 },
  /** زمان تسویهٔ نمایشی برداشت (برچسب نمونه) */
  settlement: { withdraw: 'تا ۲۴ ساعت کاری' },
  /** وضعیت نتیجهٔ هر عملیات در این نمونه */
  demoStatus: {
    topup: 'success',
    transfer: 'success',
    withdraw: 'pending',
  } as Record<OperationType, TransactionStatus>,
  /** مدت نمایشی «در حال پردازش» هر عملیات (میلی‌ثانیه) */
  processingMs: { topup: 1_100, transfer: 1_250, withdraw: 1_050 },
  /** تعداد تراکنش هر صفحه در تاریخچه */
  historyPageSize: 5,
  /** پیشوند شناسهٔ پیگیری نمونه */
  referencePrefix: 'ORB-',
} as const

export type WalletDisplayConfig = typeof walletDisplayConfig

/**
 * نام پارامترهای آدرس برای مسیرهای تست (هیچ‌کدام در UI دیده نمی‌شوند).
 * نمونه: `/?demo=failed` یا `/?balance=0` یا `/?empty=1`
 */
export const demoTestParams = {
  /** موفق | ناموفق | در انتظار → success | failed | pending */
  outcome: 'demo',
  /** موجودی اولیه برای دیدن حالت «موجودی صفر» */
  balance: 'balance',
  /** فهرست تراکنش‌های خالی */
  emptyList: 'empty',
} as const

export const DEMO_OUTCOMES: TransactionStatus[] = ['success', 'pending', 'failed']
