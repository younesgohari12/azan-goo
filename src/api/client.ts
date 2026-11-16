import { endpoints } from './endpoints'
import type {
  ActivityEntry,
  Automation,
  BackgroundJob,
  DashboardSummary,
  Discount,
  InventorySummary,
  NotificationItem,
  Order,
  Paginated,
  PriceHistoryEntry,
  Product,
  ReportResult,
  SettingsPayload,
  Store,
  SyncOverview,
} from './types'

export type QueryValue = string | number | boolean | undefined | null
export type QueryParams = Record<string, QueryValue | QueryValue[]>

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  query?: QueryParams
  body?: unknown
}

type ApiEnvelope<T> = { success?: boolean; data?: T; message?: string }

declare global {
  interface Window {
    snappShopAutomation?: {
      restUrl?: string
      nonce?: string
      apiMode?: 'mock' | 'live'
    }
  }
}

export type ApiMode = 'mock' | 'live'

/**
 * `mock` (demo data, default) or `live` (the WordPress plugin).
 * The plugin can force live mode by injecting `window.snappShopAutomation.apiMode`.
 */
export const API_MODE: ApiMode =
  window.snappShopAutomation?.apiMode ??
  ((import.meta.env.VITE_API_MODE as ApiMode | undefined) === 'live' ? 'live' : 'mock')

export const API_BASE =
  window.snappShopAutomation?.restUrl ??
  import.meta.env.VITE_API_BASE ??
  '/wp-json/snappshop-automation/v1'

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function buildQuery(query?: QueryParams): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      value.filter((v) => v !== undefined && v !== null && v !== '').forEach((v) => params.append(`${key}[]`, String(v)))
    } else {
      params.append(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Central API client. Every request in the app goes through here so auth,
 * error shaping and the transport can change in one place.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body } = options

  if (API_MODE === 'mock') {
    const { mockRequest } = await import('./mock/transport')
    return mockRequest<T>(path, { method, query, body })
  }

  const url = `${API_BASE}${path}${buildQuery(query)}`
  const nonce = window.snappShopAutomation?.nonce

  let response: Response
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(nonce ? { 'X-WP-Nonce': nonce } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw new ApiError('ارتباط با سرور وردپرس برقرار نشد. اتصال شبکه یا دسترسی REST را بررسی کنید.', 0, 'network_error', error)
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  const envelope = payload as ApiEnvelope<T> | null

  if (!response.ok) {
    const message =
      (envelope && typeof envelope === 'object' && 'message' in envelope && envelope.message) ||
      'درخواست با خطا مواجه شد.'
    throw new ApiError(String(message), response.status, `http_${response.status}`, payload)
  }

  // WordPress plugins commonly wrap payloads as { success, data }.
  if (envelope && typeof envelope === 'object' && 'data' in envelope) {
    return envelope.data as T
  }
  return payload as T
}

/* -------------------------------------------------------------------------- */
/* Typed endpoints — the app never strings a URL together on its own.         */
/* -------------------------------------------------------------------------- */

export const api = {
  dashboard: (params: { store_id?: number; range?: string }) =>
    apiRequest<DashboardSummary>(endpoints.dashboard, { query: params }),

  activity: (params: { limit?: number; type?: string } = {}) =>
    apiRequest<ActivityEntry[]>(endpoints.activity, { query: params }),

  stores: () => apiRequest<Store[]>(endpoints.stores),
  store: (id: number) => apiRequest<Store>(endpoints.store(id)),
  checkStore: (id: number) => apiRequest<{ ok: boolean; checked_at: string; message: string }>(endpoints.storeCheck(id), { method: 'POST' }),

  products: (params: Record<string, QueryValue>) => apiRequest<Paginated<Product>>(endpoints.products, { query: params }),
  product: (id: number) => apiRequest<Product>(endpoints.product(id)),
  updateProduct: (id: number, body: Partial<Pick<Product, 'wc_price' | 'wc_stock' | 'sync_status' | 'stock_source'>>) =>
    apiRequest<Product>(endpoints.product(id), { method: 'PATCH', body }),
  bulkProducts: (body: {
    ids: number[]
    operation: 'price' | 'stock'
    mode: 'set' | 'increase_percent' | 'decrease_percent' | 'increase_amount' | 'decrease_amount'
    value: number
  }) => apiRequest<{ updated: number; failed: number; preview: { id: number; from: number; to: number }[] }>(endpoints.productsBulk, { method: 'POST', body }),
  priceHistory: (params: { product_id?: number; limit?: number } = {}) =>
    apiRequest<PriceHistoryEntry[]>(endpoints.priceHistory, { query: params }),

  inventorySummary: (params: { store_id?: number } = {}) =>
    apiRequest<InventorySummary>(endpoints.inventorySummary, { query: params }),

  orders: (params: Record<string, QueryValue>) => apiRequest<Paginated<Order>>(endpoints.orders, { query: params }),
  order: (id: number) => apiRequest<Order>(endpoints.order(id)),

  syncStatus: (params: { store_id?: number } = {}) => apiRequest<SyncOverview>(endpoints.syncStatus, { query: params }),
  runSync: (body: { store_id: number; scope: 'products' | 'prices' | 'stock' | 'orders' | 'all'; mode: 'full' | 'incremental' }) =>
    apiRequest<BackgroundJob>(endpoints.syncRun, { method: 'POST', body }),

  jobs: (params: Record<string, QueryValue> = {}) => apiRequest<Paginated<BackgroundJob>>(endpoints.jobs, { query: params }),
  job: (id: number) => apiRequest<BackgroundJob>(endpoints.job(id)),
  cancelJob: (id: number) => apiRequest<BackgroundJob>(endpoints.jobCancel(id), { method: 'POST' }),
  retryJob: (id: number) => apiRequest<BackgroundJob>(endpoints.jobRetry(id), { method: 'POST' }),

  automations: () => apiRequest<Automation[]>(endpoints.automations),
  createAutomation: (body: Omit<Automation, 'id' | 'last_run_at' | 'next_run_at' | 'last_result' | 'runs_count'>) =>
    apiRequest<Automation>(endpoints.automations, { method: 'POST', body }),
  updateAutomation: (id: number, body: Partial<Automation>) =>
    apiRequest<Automation>(endpoints.automation(id), { method: 'PATCH', body }),
  toggleAutomation: (id: number) => apiRequest<Automation>(endpoints.automationToggle(id), { method: 'POST' }),
  runAutomation: (id: number) => apiRequest<{ ok: boolean; message: string }>(endpoints.automationRun(id), { method: 'POST' }),

  discounts: () => apiRequest<Discount[]>(endpoints.discounts),

  report: (params: { type: string; from?: string; to?: string }) =>
    apiRequest<ReportResult>(endpoints.reports, { query: params }),

  notifications: () => apiRequest<NotificationItem[]>(endpoints.notifications),
  markNotifications: (body: { ids?: number[]; all?: boolean }) =>
    apiRequest<NotificationItem[]>(endpoints.notificationsRead, { method: 'POST', body }),

  settings: () => apiRequest<SettingsPayload>(endpoints.settings),
  saveSettings: (body: SettingsPayload) => apiRequest<SettingsPayload>(endpoints.settings, { method: 'PUT', body }),
}
