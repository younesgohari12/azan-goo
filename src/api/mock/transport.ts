/**
 * MOCK TRANSPORT — demo backend used only when API_MODE === 'mock'.
 * Mirrors the shape of the real REST responses and keeps mutations in memory
 * so the UI can be exercised end-to-end. It is dynamically imported, so a live
 * build never ships it in the initial bundle.
 */
import { sleep } from '@/lib/utils'
import type {
  ActivityEntry,
  Automation,
  BackgroundJob,
  DashboardSummary,
  Discount,
  InventorySummary,
  NotificationItem,
  Order,
  OrderStatus,
  Paginated,
  PriceHistoryEntry,
  Product,
  ReportResult,
  SettingsPayload,
  Store,
  SyncOverview,
  TrendPoint,
} from '../types'
import * as seed from './seed'

const state = {
  products: [...seed.products],
  orders: [...seed.orders],
  jobs: [...seed.jobs],
  running: { ...seed.runningJob } as BackgroundJob,
  automations: [...seed.automations],
  notifications: [...seed.notifications],
  activity: [...seed.activity],
  priceHistory: [...seed.priceHistory],
  settings: structuredClone(seed.settings),
  stores: seed.stores.map((s) => ({ ...s })),
  discounts: [...seed.discounts],
  nextProductId: 9000,
  nextJobId: 1300,
}

function refreshRunningJob() {
  const job = state.running
  if (job.status !== 'running') return
  const elapsedSeconds = (Date.now() - new Date(job.started_at).getTime()) / 1000
  const processed = Math.min(job.total, Math.floor(elapsedSeconds * 9))
  job.processed = processed
  job.progress = Math.round((processed / job.total) * 100)
  if (processed >= job.total) {
    job.status = job.failed > 0 ? 'partially_completed' : 'completed'
    job.finished_at = new Date().toISOString()
    job.duration_seconds = Math.round(elapsedSeconds)
    state.stores[0].sync_status = job.failed > 0 ? 'error' : 'idle'
    state.jobs.unshift({ ...job })
  }
}

function paginate<T>(items: T[], page = 1, perPage = 20): Paginated<T> {
  const start = (page - 1) * perPage
  return { items: items.slice(start, start + perPage), total: items.length, page, per_page: perPage }
}

function parseNumber(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function roundTo(value: number, step = 1000) {
  return Math.max(0, Math.round(value / step) * step)
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function buildSeries(days: number): { orders: TrendPoint[]; sales: TrendPoint[]; sync: { date: string; success: number; failed: number }[] } {
  const orders: TrendPoint[] = []
  const sales: TrendPoint[] = []
  const sync: { date: string; success: number; failed: number }[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    const dayOrders = state.orders.filter((o) => o.created_at.slice(0, 10) === date)
    orders.push({ date, value: dayOrders.length || Math.max(2, 6 + ((i * 7) % 9)) })
    sales.push({ date, value: dayOrders.reduce((sum, o) => sum + (o.status === 'cancelled' ? 0 : o.total), 0) || 40_000_000 + ((i * 13_000_000) % 55_000_000) })
    sync.push({ date, success: 40 + ((i * 11) % 26), failed: (i * 3) % 7 })
  }
  return { orders, sales, sync }
}

function dashboardSummary(range: string): DashboardSummary {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const series = buildSeries(Math.min(days, 30))
  const newOrders = state.orders.filter((o) => o.status === 'new').length
  const cancelled = state.orders.filter((o) => o.status === 'cancelled').length
  const salesValue = state.orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)
  const active = state.products.filter((p) => p.status === 'publish').length
  const outOfStock = state.products.filter((p) => p.wc_stock === 0).length
  const needsReview = state.products.filter((p) => p.sync_status === 'error' || p.match_status === 'conflict').length
  const completedJobs = state.jobs.filter((j) => j.status === 'completed' || j.status === 'partially_completed')
  const failedJobs = state.jobs.filter((j) => j.status === 'failed')

  return {
    range,
    products: { total: state.products.length, active, out_of_stock: outOfStock, needs_review: needsReview },
    orders: { new: newOrders, cancelled, total: state.orders.length, sales_value: salesValue },
    sync: {
      success: completedJobs.reduce((sum, j) => sum + (j.total - j.failed), 0),
      failed: failedJobs.reduce((sum, j) => sum + j.failed, 0),
      last_sync_at: completedJobs[0]?.finished_at ?? null,
    },
    trends: { orders: 12.4, sales: 8.1, products: -1.8, failures: -22.5 },
    orders_series: series.orders,
    sales_series: series.sales,
    inventory_breakdown: [
      { name: 'موجود', value: state.products.filter((p) => p.wc_stock > 5).length, color: 'hsl(var(--success))' },
      { name: 'موجودی کم', value: state.products.filter((p) => p.wc_stock > 0 && p.wc_stock <= 5).length, color: 'hsl(var(--warning))' },
      { name: 'ناموجود', value: outOfStock, color: 'hsl(var(--danger))' },
    ],
    sync_series: series.sync,
    top_issues: state.products.filter((p) => p.sync_status === 'error' || p.match_status === 'conflict').slice(0, 5),
    jobs_status: (['running', 'completed', 'failed', 'partially_completed', 'cancelled', 'pending'] as BackgroundJob['status'][]).map(
      (status) => ({
        status,
        count:
          status === 'running'
            ? state.jobs.filter((j) => j.status === 'running').length + (state.running.status === 'running' ? 1 : 0)
            : state.jobs.filter((j) => j.status === status).length,
      }),
    ),
  }
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

function buildReport(type: string, from: string, to: string): ReportResult {
  const statusLabels: Record<string, string> = {
    synced: 'همگام',
    pending: 'در انتظار',
    error: 'خطا',
    paused: 'متوقف',
    not_linked: 'متصل نشده',
  }
  if (type === 'sales') {
    return {
      type,
      from,
      to,
      columns: [
        { key: 'number', label: 'شماره سفارش', type: 'text' },
        { key: 'created_at', label: 'تاریخ', type: 'date' },
        { key: 'status', label: 'وضعیت', type: 'status' },
        { key: 'items_count', label: 'تعداد اقلام', type: 'number' },
        { key: 'total', label: 'مبلغ', type: 'money' },
      ],
      rows: state.orders.slice(0, 30).map((o) => ({
        number: o.number,
        created_at: o.created_at,
        status: o.status,
        items_count: o.items_count,
        total: o.total,
      })),
    }
  }
  if (type === 'inventory') {
    return {
      type,
      from,
      to,
      columns: [
        { key: 'sku', label: 'SKU', type: 'text' },
        { key: 'name', label: 'محصول', type: 'text' },
        { key: 'wc_stock', label: 'موجودی ووکامرس', type: 'number' },
        { key: 'snapp_stock', label: 'موجودی اسنپ‌شاپ', type: 'number' },
        { key: 'diff', label: 'مغایرت', type: 'number' },
      ],
      rows: state.products.slice(0, 40).map((p) => ({
        sku: p.sku,
        name: p.name,
        wc_stock: p.wc_stock,
        snapp_stock: p.snapp_stock ?? 0,
        diff: (p.snapp_stock ?? 0) - p.wc_stock,
      })),
    }
  }
  if (type === 'prices') {
    return {
      type,
      from,
      to,
      columns: [
        { key: 'product_name', label: 'محصول', type: 'text' },
        { key: 'from_price', label: 'قیمت قبلی', type: 'money' },
        { key: 'to_price', label: 'قیمت جدید', type: 'money' },
        { key: 'source', label: 'منبع تغییر', type: 'text' },
        { key: 'created_at', label: 'تاریخ', type: 'date' },
      ],
      rows: state.priceHistory.slice(0, 40).map((h) => ({
        product_name: h.product_name,
        from_price: h.from_price,
        to_price: h.to_price,
        source: h.source,
        created_at: h.created_at,
      })),
    }
  }
  if (type === 'sync' || type === 'errors') {
    const source = type === 'errors' ? state.jobs.filter((j) => j.failed > 0) : state.jobs
    return {
      type,
      from,
      to,
      columns: [
        { key: 'title', label: 'عملیات', type: 'text' },
        { key: 'status', label: 'وضعیت', type: 'status' },
        { key: 'processed', label: 'پردازش‌شده', type: 'number' },
        { key: 'failed', label: 'ناموفق', type: 'number' },
        { key: 'started_at', label: 'شروع', type: 'date' },
      ],
      rows: source.map((j) => ({ title: j.title, status: j.status, processed: j.processed, failed: j.failed, started_at: j.started_at })),
    }
  }
  return {
    type: 'products',
    from,
    to,
    columns: [
      { key: 'name', label: 'محصول', type: 'text' },
      { key: 'sku', label: 'SKU', type: 'text' },
      { key: 'wc_price', label: 'قیمت ووکامرس', type: 'money' },
      { key: 'wc_stock', label: 'موجودی', type: 'number' },
      { key: 'sync_status', label: 'وضعیت همگام‌سازی', type: 'status' },
    ],
    rows: state.products.slice(0, 40).map((p) => ({
      name: p.name,
      sku: p.sku,
      wc_price: p.wc_price,
      wc_stock: p.wc_stock,
      sync_status: statusLabels[p.sync_status] ?? p.sync_status,
    })),
  }
}

/* -------------------------------------------------------------------------- */
/* Router                                                                     */
/* -------------------------------------------------------------------------- */

export async function mockRequest<T>(
  path: string,
  options: { method?: string; query?: Record<string, unknown>; body?: unknown },
): Promise<T> {
  await sleep(140 + Math.random() * 200)
  refreshRunningJob()

  const method = options.method ?? 'GET'
  const query = options.query ?? {}
  const body = (options.body ?? {}) as Record<string, unknown>
  const [resource, idSegment, action] = path.split('?')[0].split('/').filter(Boolean)
  const id = Number(idSegment)

  /* dashboard */
  if (resource === 'dashboard' && method === 'GET') {
    return dashboardSummary(String(query.range ?? '30d')) as T
  }

  if (resource === 'activity' && method === 'GET') {
    const limit = Number(query.limit ?? 20)
    const type = query.type ? String(query.type) : null
    const items = type ? state.activity.filter((a) => a.type === type) : state.activity
    return items.slice(0, limit) as T
  }

  /* stores */
  if (resource === 'stores') {
    if (method === 'GET' && !idSegment) return state.stores as T
    if (method === 'POST' && action === 'check') {
      const store = state.stores.find((s) => s.id === id)
      if (!store) throw new Error('فروشگاه یافت نشد')
      const ok = store.status === 'connected'
      store.last_connection = ok ? new Date().toISOString() : store.last_connection
      return {
        ok,
        checked_at: new Date().toISOString(),
        message: ok ? 'اتصال با موفقیت برقرار است.' : 'اتصال برقرار نشد؛ توکن دسترسی را بررسی کنید.',
      } as T
    }
    if (method === 'GET' && id) {
      const store = state.stores.find((s) => s.id === id)
      if (!store) throw new Error('فروشگاه یافت نشد')
      return store as T
    }
  }

  /* products */
  if (resource === 'products') {
    if (method === 'GET' && !idSegment) {
      let items = [...state.products]
      const search = String(query.search ?? '').trim()
      if (search) items = items.filter((p) => p.name.includes(search) || p.sku.includes(search) || (p.product_number ?? '').includes(search))
      if (query.sync_status) items = items.filter((p) => p.sync_status === query.sync_status)
      if (query.match_status) items = items.filter((p) => p.match_status === query.match_status)
      if (query.category) items = items.filter((p) => p.category === query.category)
      if (query.stock_state === 'out') items = items.filter((p) => p.wc_stock === 0)
      if (query.stock_state === 'low') items = items.filter((p) => p.wc_stock > 0 && p.wc_stock <= 5)
      if (query.mismatch === 'true') items = items.filter((p) => p.snapp_stock !== null && p.snapp_stock !== p.wc_stock)
      if (query.only_errors === 'true' || query.only_errors === true) items = items.filter((p) => p.sync_status === 'error' || p.match_status === 'conflict')

      const sortKey = String(query.sort ?? 'last_updated')
      const direction = query.order === 'asc' ? 1 : -1
      items.sort((a, b) => {
        const av = a[sortKey as keyof Product]
        const bv = b[sortKey as keyof Product]
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction
        return String(av ?? '').localeCompare(String(bv ?? ''), 'fa') * direction
      })

      return paginate(items, parseNumber(query.page, 1), parseNumber(query.per_page, 20)) as T
    }

    if (method === 'GET' && id) {
      const product = state.products.find((p) => p.id === id)
      if (!product) throw new Error('محصول یافت نشد')
      return product as T
    }

    if (method === 'PATCH' && id) {
      const index = state.products.findIndex((p) => p.id === id)
      if (index < 0) throw new Error('محصول یافت نشد')
      const current = state.products[index]
      const next: Product = { ...current, ...(body as Partial<Product>), last_updated: new Date().toISOString() }
      // a single-product save is pushed to SnappShop by the plugin
      if (typeof body.wc_price === 'number') next.snapp_price = body.wc_price
      if (typeof body.wc_stock === 'number') next.snapp_stock = body.wc_stock
      if (typeof body.wc_price === 'number' || typeof body.wc_stock === 'number') next.sync_status = 'synced'
      if (typeof body.wc_price === 'number' && body.wc_price !== current.wc_price) {
        state.priceHistory.unshift({
          id: state.priceHistory.length + 1,
          product_id: current.id,
          product_name: current.name,
          from_price: current.wc_price,
          to_price: body.wc_price,
          source: 'manual',
          actor: 'مدیر فروشگاه',
          created_at: new Date().toISOString(),
        })
      }
      state.products[index] = next
      return next as T
    }

    if (method === 'POST' && idSegment === 'bulk') {
      const ids = (body.ids as number[]) ?? []
      const operation = body.operation as 'price' | 'stock'
      const mode = body.mode as string
      const value = Number(body.value ?? 0)
      const preview: { id: number; from: number; to: number }[] = []
      let failed = 0

      ids.forEach((productId) => {
        const product = state.products.find((p) => p.id === productId)
        if (!product) {
          failed += 1
          return
        }
        const from = operation === 'price' ? product.wc_price : product.wc_stock
        let to = from
        if (mode === 'set') to = value
        if (mode === 'increase_percent') to = Math.round((from * (100 + value)) / 100)
        if (mode === 'decrease_percent') to = Math.round((from * (100 - value)) / 100)
        if (mode === 'increase_amount') to = from + value
        if (mode === 'decrease_amount') to = from - value
        to = operation === 'price' ? roundTo(Math.max(0, to), 1000) : Math.max(0, Math.round(to))

        if (operation === 'price') {
          product.wc_price = to
          product.snapp_price = to
          product.sync_status = 'synced'
          state.priceHistory.unshift({
            id: state.priceHistory.length + 1,
            product_id: product.id,
            product_name: product.name,
            from_price: from,
            to_price: to,
            source: 'bulk',
            actor: 'مدیر فروشگاه',
            created_at: new Date().toISOString(),
          })
        } else {
          product.wc_stock = to
          product.snapp_stock = to
          product.sync_status = 'synced'
          product.status = to === 0 ? 'out_of_stock' : 'publish'
        }
        product.last_updated = new Date().toISOString()
        preview.push({ id: product.id, from, to })
      })

      return { updated: preview.length, failed, preview } as T
    }
  }

  /* pricing history */
  if (resource === 'pricing' && idSegment === 'history') {
    const productId = query.product_id ? Number(query.product_id) : null
    const items = productId ? state.priceHistory.filter((h) => h.product_id === productId) : state.priceHistory
    return items.slice(0, Number(query.limit ?? 50)) as T
  }

  /* inventory */
  if (resource === 'inventory' && idSegment === 'summary') {
    const summary: InventorySummary = {
      total: state.products.length,
      in_stock: state.products.filter((p) => p.wc_stock > 5).length,
      low_stock: state.products.filter((p) => p.wc_stock > 0 && p.wc_stock <= 5).length,
      out_of_stock: state.products.filter((p) => p.wc_stock === 0).length,
      mismatched: state.products.filter((p) => p.snapp_stock !== null && p.snapp_stock !== p.wc_stock).length,
      rules: seed.inventoryRules,
    }
    return summary as T
  }

  /* orders */
  if (resource === 'orders') {
    if (method === 'GET' && !idSegment) {
      let items = [...state.orders]
      if (query.status) items = items.filter((o) => o.status === query.status)
      const search = String(query.search ?? '').trim()
      if (search) items = items.filter((o) => o.number.includes(search) || (o.customer_name ?? '').includes(search))
      if (query.from) items = items.filter((o) => o.created_at >= String(query.from))
      if (query.to) items = items.filter((o) => o.created_at <= `${String(query.to)}T23:59:59.999Z`)
      items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      return paginate(items, parseNumber(query.page, 1), parseNumber(query.per_page, 15)) as T
    }
    if (method === 'GET' && id) {
      const order = state.orders.find((o) => o.id === id)
      if (!order) throw new Error('سفارش یافت نشد')
      return order as T
    }
  }

  /* sync */
  if (resource === 'sync' && idSegment === 'status' && method === 'GET') {
    const last = state.jobs[0]
    const overview: SyncOverview = {
      store_id: Number(query.store_id ?? 1),
      connected: state.stores[0].status === 'connected',
      last_sync_at: last?.finished_at ?? last?.started_at ?? null,
      next_sync_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      running_job: state.running.status === 'running' ? { ...state.running } : null,
      last_result: last
        ? { processed: last.total, success: last.total - last.failed, failed: last.failed, duration_seconds: last.duration_seconds ?? 0 }
        : null,
      history: state.jobs.slice(0, 10),
    }
    return overview as T
  }

  if (resource === 'sync' && idSegment === 'run' && method === 'POST') {
    const scope = (body.scope as BackgroundJob['scope']) ?? 'all'
    const mode = body.mode as string
    const totals: Record<string, number> = { products: 620, prices: 540, stock: 640, orders: 48, all: 860 }
    const typeMap: Record<string, BackgroundJob['type']> = {
      products: 'product_sync',
      prices: 'price_sync',
      stock: 'stock_sync',
      orders: 'order_sync',
      all: 'full_sync',
    }
    const titles: Record<string, string> = {
      products: 'همگام‌سازی محصولات',
      prices: 'همگام‌سازی قیمت‌ها',
      stock: 'به‌روزرسانی موجودی',
      orders: 'دریافت سفارش‌های جدید',
      all: mode === 'incremental' ? 'همگام‌سازی افزایشی' : 'همگام‌سازی کامل فروشگاه',
    }
    if (state.running.status === 'running') {
      throw new Error('یک عملیات همگام‌سازی در حال اجراست. ابتدا آن را متوقف کنید.')
    }
    state.nextJobId += 1
    state.running = {
      id: state.nextJobId,
      type: typeMap[scope],
      title: titles[scope],
      scope,
      status: 'running',
      progress: 0,
      processed: 0,
      total: totals[scope] ?? 500,
      failed: 0,
      retry_count: 0,
      started_at: new Date().toISOString(),
      finished_at: null,
      duration_seconds: null,
      store_id: Number(body.store_id ?? 1),
      errors: [],
    }
    state.stores[0].sync_status = 'running'
    return { ...state.running } as T
  }

  /* jobs */
  if (resource === 'jobs') {
    if (method === 'GET' && !idSegment) {
      const all = state.running.status === 'running' ? [state.running, ...state.jobs] : state.jobs
      let items = [...all]
      if (query.status) items = items.filter((j) => j.status === query.status)
      if (query.type) items = items.filter((j) => j.type === query.type)
      return paginate(items, parseNumber(query.page, 1), parseNumber(query.per_page, 10)) as T
    }
    if (method === 'POST' && action === 'cancel') {
      if (state.running.id === id && state.running.status === 'running') {
        state.running.status = 'cancelled'
        state.running.finished_at = new Date().toISOString()
        state.stores[0].sync_status = 'idle'
        return { ...state.running } as T
      }
      throw new Error('این عملیات قابل لغو نیست.')
    }
    if (method === 'POST' && action === 'retry') {
      const job = state.jobs.find((j) => j.id === id)
      if (!job) throw new Error('عملیات یافت نشد')
      const retried: BackgroundJob = {
        ...job,
        id: job.id + 5000,
        status: 'running',
        progress: 0,
        processed: 0,
        failed: 0,
        retry_count: job.retry_count + 1,
        started_at: new Date().toISOString(),
        finished_at: null,
        duration_seconds: null,
        errors: [],
      }
      state.running = retried
      return retried as T
    }
    if (method === 'GET' && id) {
      const job = state.jobs.find((j) => j.id === id) ?? (state.running.id === id ? state.running : null)
      if (!job) throw new Error('عملیات یافت نشد')
      return job as T
    }
  }

  /* automations */
  if (resource === 'automations') {
    if (method === 'GET' && !idSegment) return state.automations as T
    if (method === 'POST' && !idSegment) {
      const created: Automation = {
        ...(body as unknown as Automation),
        id: Math.max(...state.automations.map((a) => a.id)) + 1,
        last_run_at: null,
        next_run_at: null,
        last_result: 'never',
        runs_count: 0,
      }
      state.automations.unshift(created)
      return created as T
    }
    if (method === 'POST' && action === 'toggle') {
      const automation = state.automations.find((a) => a.id === id)
      if (!automation) throw new Error('قانون یافت نشد')
      automation.enabled = !automation.enabled
      return { ...automation } as T
    }
    if (method === 'POST' && action === 'run') {
      const automation = state.automations.find((a) => a.id === id)
      if (!automation) throw new Error('قانون یافت نشد')
      automation.last_run_at = new Date().toISOString()
      automation.runs_count += 1
      automation.last_result = 'success'
      state.activity.unshift({
        id: state.activity.length + 1,
        type: 'automation',
        title: `اجرای دستی «${automation.name}»`,
        description: 'قانون با موفقیت اجرا شد.',
        status: 'success',
        created_at: new Date().toISOString(),
        actor: 'مدیر فروشگاه',
      })
      return { ok: true, message: 'قانون با موفقیت اجرا شد.' } as T
    }
    if (method === 'PATCH' && id) {
      const index = state.automations.findIndex((a) => a.id === id)
      if (index < 0) throw new Error('قانون یافت نشد')
      state.automations[index] = { ...state.automations[index], ...(body as Partial<Automation>) }
      return { ...state.automations[index] } as T
    }
  }

  /* discounts */
  if (resource === 'discounts' && method === 'GET') return state.discounts as Discount[] as T

  /* reports */
  if (resource === 'reports' && method === 'GET') {
    return buildReport(String(query.type ?? 'products'), String(query.from ?? ''), String(query.to ?? '')) as T
  }

  /* notifications */
  if (resource === 'notifications') {
    if (method === 'GET' && !idSegment) return state.notifications as T
    if (method === 'POST' && idSegment === 'read') {
      if (body.all) state.notifications = state.notifications.map((n) => ({ ...n, read: true }))
      else if (Array.isArray(body.ids)) {
        const ids = body.ids as number[]
        state.notifications = state.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
      }
      return state.notifications as T
    }
  }

  /* settings */
  if (resource === 'settings') {
    if (method === 'GET') return structuredClone(state.settings) as T
    if (method === 'PUT') {
      state.settings = body as unknown as SettingsPayload
      return structuredClone(state.settings) as T
    }
  }

  throw new Error(`مسیر آزمایشی برای ${path} تعریف نشده است.`)
}

/** Exposed for the demo banner / integration report. */
export const mockMeta = {
  products: (): Product[] => state.products,
  orders: (): Order[] => state.orders,
  statuses: ['new', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as OrderStatus[],
  notifications: (): NotificationItem[] => state.notifications,
  activity: (): ActivityEntry[] => state.activity,
  priceHistory: (): PriceHistoryEntry[] => state.priceHistory,
  stores: (): Store[] => state.stores,
  automations: (): Automation[] => state.automations,
  discounts: (): Discount[] => state.discounts,
}
