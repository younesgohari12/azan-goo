const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)])
}

export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit as (typeof PERSIAN_DIGITS)[number])))
}

const amountFormatter = new Intl.NumberFormat('fa-IR', {
  maximumFractionDigits: 0,
  useGrouping: true,
})

/** مبلغ بدون علامت، با جداکنندهٔ هزارگان فارسی */
export function formatAmount(value: number): string {
  return toPersianDigits(amountFormatter.format(Math.round(Math.abs(value))))
}

/** ورودی کاربر → رشتهٔ رقم لاتین (تبدیل ارقام فارسی، حذف جداکننده و نویسه‌های دیگر) */
export function sanitizeAmountInput(input: string, maxDigits = 9): string {
  const latin = toLatinDigits(input).replace(/[^\d]/g, '')
  return latin.replace(/^0+(?=\d)/, '').slice(0, maxDigits)
}

/** رشتهٔ رقم → عدد (ورودی خالی یا نامعتبر = صفر) */
export function parseAmount(input: string): number {
  const latin = sanitizeAmountInput(input, 12)
  return latin ? Number(latin) : 0
}

/** رشتهٔ رقم → نمایش گروه‌بندی‌شدهٔ فارسی برای کادر مبلغ */
export function formatAmountInput(input: string): string {
  const latin = sanitizeAmountInput(input, 12)
  return latin ? formatAmount(Number(latin)) : ''
}

/** شمارهٔ موبایل نمونه: ۰۹۱۲ ۳۴۵ ۶۷۸۹ */
export function formatPhone(raw: string): string {
  const latin = toLatinDigits(raw).replace(/[^\d]/g, '')
  if (latin.length !== 11) return toPersianDigits(latin)
  return toPersianDigits(`${latin.slice(0, 4)} ${latin.slice(4, 7)} ${latin.slice(7)}`)
}

/** چهار رقم آخر کارت: •••• ۴۵۶۷ */
export function formatCardTail(last4: string): string {
  return `•••• ${toPersianDigits(last4)}`
}

const weekdayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' })
const dayMonthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long' })
const monthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export interface TransactionDateParts {
  /** امروز / دیروز / ۱۹ مهر */
  dayLabel: string
  /** ۱۴:۳۲ */
  timeLabel: string
  /** چهارشنبه ۲۲ مهر ۱۴۰۵ */
  fullLabel: string
  /** کلید گروه‌بندی روز (YYYY-MM-DD) */
  dayKey: string
}

function dayKeyOf(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function getTransactionDate(iso: string): TransactionDateParts {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)

  let dayLabel: string
  if (diffDays === 0) dayLabel = 'امروز'
  else if (diffDays === 1) dayLabel = 'دیروز'
  else dayLabel = toPersianDigits(dayMonthFormatter.format(date))

  return {
    dayLabel,
    timeLabel: toPersianDigits(timeFormatter.format(date)),
    fullLabel: toPersianDigits(`${weekdayFormatter.format(date)} ${monthFormatter.format(date)}`),
    dayKey: dayKeyOf(date),
  }
}

/** برچسب نسبی برای گروه‌های تاریخ در فهرست کامل */
export function getDayGroupLabel(iso: string): string {
  return getTransactionDate(iso).dayLabel
}
