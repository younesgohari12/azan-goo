export type TransactionStatus = 'success' | 'pending' | 'failed'

export type TransactionKind = 'topup' | 'transfer_in' | 'transfer_out' | 'withdraw' | 'refund'

export type OperationType = 'topup' | 'transfer' | 'withdraw'

export interface Transaction {
  id: string
  kind: TransactionKind
  /** عنوان خوانا برای کاربر */
  title: string
  /** طرف مقابل تراکنش (در صورت وجود) */
  counterparty?: string
  /** ISO 8601 — هنگام نمایش به تاریخ و ساعت فارسی تبدیل می‌شود */
  date: string
  /** مبلغ به تومان، علامت‌دار: مثبت = ورودی، منفی = خروجی */
  amount: number
  status: TransactionStatus
  /** توضیح اختیاری */
  note?: string
  /** شناسهٔ پیگیری (نمونه) */
  reference: string
  /** آیا این تراکنش در همین نسخهٔ نمایشی ساخته شده است؟ */
  demo?: boolean
  /** کارمزد نمونه، در صورت وجود */
  fee?: number
}

export interface Recipient {
  id: string
  name: string
  /** شناسهٔ Orbit */
  handle: string
  phone: string
}

export interface WithdrawDestination {
  id: string
  label: string
  bank: string
  /** چهار رقم آخر کارت */
  last4: string
}

export interface WalletSnapshot {
  /** موجودی قابل استفاده (تومان) */
  balance: number
  /** جمع ورودی‌هایی که هنوز تأیید نشده‌اند */
  pendingBalance: number
  transactions: Transaction[]
}
