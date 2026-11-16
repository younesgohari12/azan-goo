/**
 * Domain types for the SnappShop Automation REST API.
 * Field names mirror the plugin's JSON payloads (snake_case).
 */

export type SyncStatus = 'synced' | 'pending' | 'error' | 'paused' | 'not_linked'
export type MatchStatus = 'matched' | 'missing' | 'conflict'
export type StoreConnection = 'connected' | 'disconnected' | 'error'

export interface Store {
  id: number
  name: string
  code: string
  status: StoreConnection
  sync_status: 'idle' | 'running' | 'error'
  products_count: number
  orders_count: number
  last_connection: string | null
  is_default: boolean
  vendor_id: string
  settings: {
    stock_source: 'woocommerce' | 'snappshop'
    auto_sync: boolean
    sync_interval_minutes: number
    price_markup_percent: number
  }
}

export interface ProductVariant {
  id: number
  name: string
  sku: string
  wc_price: number
  snapp_price: number | null
  wc_stock: number
  snapp_stock: number | null
}

export interface Product {
  id: number
  name: string
  sku: string
  product_number: string | null
  image: string | null
  type: 'simple' | 'variable'
  category: string
  status: 'publish' | 'draft' | 'out_of_stock'
  wc_price: number
  snapp_price: number | null
  wc_stock: number
  snapp_stock: number | null
  stock_source: 'woocommerce' | 'snappshop' | 'manual'
  match_status: MatchStatus
  sync_status: SyncStatus
  last_updated: string
  errors: string[]
  variants?: ProductVariant[]
}

export interface PriceHistoryEntry {
  id: number
  product_id: number
  product_name: string
  from_price: number
  to_price: number
  source: 'manual' | 'bulk' | 'automation' | 'sync'
  actor: string
  created_at: string
}

export type OrderStatus =
  | 'new'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export interface OrderItem {
  id: number
  product_id: number
  name: string
  sku: string
  quantity: number
  unit_price: number
  total: number
}

export interface OrderEvent {
  id: number
  type: 'created' | 'status_changed' | 'cancelled' | 'synced' | 'error' | 'updated'
  title: string
  description?: string
  created_at: string
  actor: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export interface Order {
  id: number
  number: string
  created_at: string
  updated_at: string
  status: OrderStatus
  items_count: number
  total: number
  shipping_type: 'express' | 'standard' | 'pickup'
  cancel_status: 'none' | 'partial' | 'full'
  customer_name: string | null
  customer_phone: string | null
  wc_order_id: number | null
  items: OrderItem[]
  events: OrderEvent[]
}

export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'partially_completed'

export interface BackgroundJob {
  id: number
  type: 'product_sync' | 'price_sync' | 'stock_sync' | 'order_sync' | 'full_sync' | 'automation'
  title: string
  scope: 'products' | 'prices' | 'stock' | 'orders' | 'all'
  status: JobStatus
  progress: number
  processed: number
  total: number
  failed: number
  retry_count: number
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  store_id: number
  errors: string[]
}

export interface AutomationCondition {
  field: string
  operator: string
  value: string
}

export interface AutomationAction {
  type: string
  params: Record<string, string>
}

export interface Automation {
  id: number
  name: string
  description: string
  trigger: string
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  schedule: string
  enabled: boolean
  last_run_at: string | null
  next_run_at: string | null
  last_result: 'success' | 'failed' | 'never'
  runs_count: number
}

export interface NotificationItem {
  id: number
  title: string
  body: string
  type: 'success' | 'warning' | 'error' | 'info'
  read: boolean
  created_at: string
  link: string | null
}

export type ActivityType = 'order' | 'price' | 'stock' | 'sync' | 'error' | 'automation'

export interface ActivityEntry {
  id: number
  type: ActivityType
  title: string
  description: string
  status: 'success' | 'warning' | 'error' | 'info'
  created_at: string
  actor: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface DashboardSummary {
  range: string
  products: { total: number; active: number; out_of_stock: number; needs_review: number }
  orders: { new: number; cancelled: number; total: number; sales_value: number }
  sync: { success: number; failed: number; last_sync_at: string | null }
  trends: {
    orders: number | null
    sales: number | null
    products: number | null
    failures: number | null
  }
  orders_series: TrendPoint[]
  sales_series: TrendPoint[]
  inventory_breakdown: { name: string; value: number; color: string }[]
  sync_series: { date: string; success: number; failed: number }[]
  top_issues: Product[]
  jobs_status: { status: JobStatus; count: number }[]
}

export interface SyncOverview {
  store_id: number
  connected: boolean
  last_sync_at: string | null
  next_sync_at: string | null
  running_job: BackgroundJob | null
  last_result: {
    processed: number
    success: number
    failed: number
    duration_seconds: number
  } | null
  history: BackgroundJob[]
}

export interface InventoryRule {
  id: number
  title: string
  description: string
  enabled: boolean
}

export interface InventorySummary {
  total: number
  in_stock: number
  low_stock: number
  out_of_stock: number
  mismatched: number
  rules: InventoryRule[]
}

export interface Discount {
  id: number
  title: string
  type: 'percentage' | 'fixed'
  value: number
  scope: 'all' | 'category' | 'products'
  products_count: number
  starts_at: string
  ends_at: string
  synced: boolean
}

export interface ReportResult {
  type: string
  from: string
  to: string
  columns: { key: string; label: string; type: 'text' | 'number' | 'money' | 'date' | 'status' }[]
  rows: Record<string, string | number>[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface SettingsPayload {
  general: {
    business_name: string
    currency_unit: 'toman'
    date_display: 'jalali' | 'gregorian'
    number_display: 'fa' | 'en'
    default_store_id: number
  }
  connection: {
    api_base_url: string
    timeout_seconds: number
    verify_ssl: boolean
    last_checked_at: string | null
  }
  sync: {
    auto_sync: boolean
    interval_minutes: number
    batch_size: number
    sync_products: boolean
    sync_prices: boolean
    sync_stock: boolean
    sync_orders: boolean
    conflict_policy: 'woocommerce' | 'snappshop' | 'newest'
  }
  products: {
    auto_publish: boolean
    default_category: string
    skip_missing_sku: boolean
    image_sync: boolean
  }
  inventory: {
    stock_source: 'woocommerce' | 'snappshop'
    low_stock_threshold: number
    block_zero_stock: boolean
  }
  pricing: {
    round_to: number
    min_price: number
    max_markup_percent: number
    price_sync_enabled: boolean
  }
  automation: {
    enabled: boolean
    max_daily_runs: number
    notify_on_failure: boolean
  }
  jobs: {
    concurrency: number
    retry_attempts: number
    retry_delay_seconds: number
    log_retention_days: number
  }
  notifications: {
    email_enabled: boolean
    email_address: string
    on_sync_failure: boolean
    on_sync_success: boolean
    on_stock_change: boolean
  }
  security: {
    rest_nonce_enabled: boolean
    allowed_roles: string[]
    log_ip_address: boolean
  }
  advanced: {
    debug_mode: boolean
    api_version: string
    clear_logs_on_deactivate: boolean
  }
}
