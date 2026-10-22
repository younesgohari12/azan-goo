import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `text-y-xl` and `text-y-ink` both start with `text-`, and the stock
 * tailwind-merge config does not know our custom font sizes. Without this it
 * treats them as one group and drops the earlier class — so
 * `cn('text-y-xl text-y-ink')` silently lost the size and every heading fell
 * back to the inherited one. Declaring the custom scale keeps size and colour
 * side by side, while a genuine size conflict (`text-y-sm text-y-lg`) still
 * resolves to the last one.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['y-xs', 'y-sm', 'y-base', 'y-md', 'y-lg', 'y-xl', 'y-2xl'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/** Persian digits for user-facing numbers (counters, times, step numbers). */
export function fa(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)])
}

let counter = 0
export function uid(prefix: string): string {
  counter += 1
  return `${prefix}_${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** mm:ss for the live elapsed timer. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return fa(`${minutes}:${String(seconds).padStart(2, '0')}`)
}

export function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000))
  if (seconds < 60) return `${fa(seconds)} ثانیه`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${fa(minutes)} دقیقه` : `${fa(minutes)} دقیقه و ${fa(rest)} ثانیه`
}

export function formatClock(timestamp: number): string {
  return fa(
    new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp)),
  )
}

export function formatRelative(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'همین حالا'
  if (diff < hour) return `${fa(Math.floor(diff / minute))} دقیقه پیش`
  if (diff < day) return `${fa(Math.floor(diff / hour))} ساعت پیش`
  if (diff < 2 * day) return 'دیروز'
  return `${fa(Math.floor(diff / day))} روز پیش`
}

export const DATE_GROUPS = ['امروز', 'دیروز', '۷ روز گذشته', 'قدیمی‌تر'] as const
export type DateGroup = (typeof DATE_GROUPS)[number]

export function dateGroupOf(timestamp: number, now = Date.now()): DateGroup {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const today = startOfToday.getTime()
  if (timestamp >= today) return 'امروز'
  if (timestamp >= today - 24 * 60 * 60 * 1000) return 'دیروز'
  if (timestamp >= now - 7 * 24 * 60 * 60 * 1000) return '۷ روز گذشته'
  return 'قدیمی‌تر'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${fa(bytes)} بایت`
  if (bytes < 1024 * 1024) return `${fa((bytes / 1024).toFixed(1))} کیلوبایت`
  return `${fa((bytes / (1024 * 1024)).toFixed(1))} مگابایت`
}

export function truncate(value: string, length = 60): string {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value
}

/** Marks Latin-only runs so they keep their own direction inside the RTL UI. */
export function isLatinRun(value: string): boolean {
  return !/[\u0600-\u06FF]/.test(value)
}

export function percentOf(value: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}
