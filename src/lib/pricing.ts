import type { Product } from '@/api/types'

export type AdjustMode = 'set' | 'increase_percent' | 'decrease_percent' | 'increase_amount' | 'decrease_amount'

export const adjustModeLabels: Record<AdjustMode, string> = {
  set: 'تنظیم مقدار ثابت',
  increase_percent: 'افزایش درصدی',
  decrease_percent: 'کاهش درصدی',
  increase_amount: 'افزایش مبلغ ثابت',
  decrease_amount: 'کاهش مبلغ ثابت',
}

/**
 * Pure, integer-safe price/stock adjustment. Prices round to the configured
 * step (Toman) and are clamped at zero so no negative or fractional value can
 * be displayed or submitted.
 */
export function applyAdjustment(from: number, mode: AdjustMode, value: number, priceStep = 1000): number {
  let next = from
  if (mode === 'set') next = value
  if (mode === 'increase_percent') next = Math.round((from * (100 + value)) / 100)
  if (mode === 'decrease_percent') next = Math.round((from * (100 - value)) / 100)
  if (mode === 'increase_amount') next = from + value
  if (mode === 'decrease_amount') next = from - value
  next = Math.max(0, next)
  return priceStep > 0 ? Math.round(next / priceStep) * priceStep : Math.round(next)
}

export function priceDiffPercent(from: number, to: number): number {
  if (from === 0) return 0
  return Math.round(((to - from) / from) * 1000) / 10
}

export type PreviewRow = { id: number; name: string; from: number; to: number }

export function buildPreview(
  products: Pick<Product, 'id' | 'name' | 'wc_price' | 'wc_stock' | 'snapp_price'>[],
  operation: 'price' | 'stock',
  mode: AdjustMode,
  value: number,
  priceStep = 1000,
): PreviewRow[] {
  return products.map((product) => {
    const from = operation === 'price' ? product.wc_price : product.wc_stock
    const to = applyAdjustment(from, mode, value, operation === 'price' ? priceStep : 0)
    return { id: product.id, name: product.name, from, to }
  })
}
