/**
 * Display formatting.
 *
 * Money rule: every price in this UI is Toman (integers). The WooCommerce API
 * may report IRR — conversion is the backend's job only, never done here.
 * We never divide/multiply stored amounts, so no floating point drift.
 */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/** User display preferences (see PreferencesProvider). */
let numberDisplay: 'fa' | 'en' = 'fa'
let dateDisplay: 'jalali' | 'gregorian' = 'jalali'

export function configureDisplay(next: { number?: 'fa' | 'en'; date?: 'jalali' | 'gregorian' }) {
  if (next.number) numberDisplay = next.number
  if (next.date) dateDisplay = next.date
}

function digits(value: string): string {
  return numberDisplay === 'fa' ? toFaDigits(value) : value
}

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 })
const enNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** 1250000 → «۱٬۲۵۰٬۰۰۰» (Persian digits, grouped) */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return (numberDisplay === 'fa' ? faNumber : enNumber).format(Math.round(value))
}

/** 1250000 → «۱٬۲۵۰٬۰۰۰ تومان» */
export function formatToman(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${formatNumber(value)} تومان`
}

/** Compact: 1250000 → «۱٫۲۵ میلیون تومان» */
export function formatTomanCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (Math.abs(value) >= 1_000_000_000) {
    return `${digits((value / 1_000_000_000).toFixed(1))} میلیارد تومان`
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${digits((value / 1_000_000).toFixed(1))} میلیون تومان`
  }
  return formatToman(value)
}

export function formatPercent(value: number | null | undefined, withSign = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const rounded = Math.round(value * 10) / 10
  const sign = withSign && rounded > 0 ? '+' : ''
  return `${sign}${digits(String(rounded))}٪`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return `${digits(String(Math.round(seconds)))} ثانیه`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m < 60) return s ? `${digits(String(m))} دقیقه و ${digits(String(s))} ثانیه` : `${digits(String(m))} دقیقه`
  const h = Math.floor(m / 60)
  return `${digits(String(h))} ساعت و ${digits(String(m % 60))} دقیقه`
}

/** Parse a localized numeric input («۱٬۲۵۰٬۰۰۰» or «۱٬۲۵۰٬۰۰۰») into an integer. */
export function parseAmount(input: string): number | null {
  const normalized = toEnDigits(input).replace(/[,\s٬،]/g, '')
  if (normalized === '') return null
  const value = Number(normalized)
  return Number.isFinite(value) ? Math.round(value) : null
}

/* -------------------------------------------------------------------------- */
/* Jalali (Persian) calendar display                                          */
/* API always exchanges ISO-8601 (Gregorian) — conversion is display only.    */
/* -------------------------------------------------------------------------- */

function makeDateFormatter(options: Intl.DateTimeFormatOptions) {
  const persian = new Intl.DateTimeFormat('fa-IR', { ...options, calendar: 'persian', numberingSystem: 'latn' })
  const gregorian = new Intl.DateTimeFormat('fa-IR', { ...options, calendar: 'gregory', numberingSystem: 'latn' })
  return (date: Date) => digits((dateDisplay === 'jalali' ? persian : gregorian).format(date))
}

const dateFormatter = makeDateFormatter({ year: 'numeric', month: 'long', day: 'numeric' })
const dateTimeFormatter = makeDateFormatter({ year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const shortFormatter = makeDateFormatter({ year: '2-digit', month: '2-digit', day: '2-digit' })
const clockFormatter = new Intl.DateTimeFormat('fa-IR', { numberingSystem: 'latn', hour: '2-digit', minute: '2-digit' })

function safeDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** 2024-11-16T10:20:00Z → «۲۶ آبان ۱۴۰۳» */
export function formatDate(value: string | Date | null | undefined): string {
  const d = safeDate(value)
  return d ? dateFormatter(d) : '—'
}

/** 2024-11-16T10:20:00Z → «۲۶ آبان ۱۴۰۳، ۱۳:۵۰» */
export function formatDateTime(value: string | Date | null | undefined): string {
  const d = safeDate(value)
  return d ? dateTimeFormatter(d) : '—'
}

/** 2024-11-16 → «۰۳/۰۸/۲۶» */
export function formatDateShort(value: string | Date | null | undefined): string {
  const d = safeDate(value)
  return d ? shortFormatter(d) : '—'
}

export function formatTime(value: string | Date | null | undefined): string {
  const d = safeDate(value)
  return d ? digits(clockFormatter.format(d)) : '—'
}

const relativeFormatter = new Intl.RelativeTimeFormat('fa', { numeric: 'auto' })

/** «۳ دقیقه پیش» */
export function formatRelative(value: string | Date | null | undefined): string {
  const d = safeDate(value)
  if (!d) return '—'
  const diff = (d.getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 45) return 'همین حالا'
  if (abs < 3600) return digits(relativeFormatter.format(Math.round(diff / 60), 'minute'))
  if (abs < 86400) return digits(relativeFormatter.format(Math.round(diff / 3600), 'hour'))
  if (abs < 86400 * 30) return digits(relativeFormatter.format(Math.round(diff / 86400), 'day'))
  if (abs < 86400 * 365) return digits(relativeFormatter.format(Math.round(diff / 2592000), 'month'))
  return digits(relativeFormatter.format(Math.round(diff / 31536000), 'year'))
}

/** ISO date (Gregorian) used for API query params. */
export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function isoDaysAgo(days: number): string {
  return toIsoDate(new Date(Date.now() - days * 86_400_000))
}
