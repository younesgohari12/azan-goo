/**
 * DEMO DATA — only used when API_MODE === 'mock'.
 * This module is never imported by a live build (dynamic import in the client),
 * and the UI shows a visible "داده نمونه" badge whenever it is active.
 */
import type {
  ActivityEntry,
  Automation,
  BackgroundJob,
  Discount,
  InventoryRule,
  InventorySummary,
  NotificationItem,
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
  PriceHistoryEntry,
  Product,
  ProductVariant,
  SettingsPayload,
  Store,
} from '../types'

/* Deterministic PRNG so the demo looks identical on every reload. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261117)
const pick = <T,>(array: T[]): T => array[Math.floor(rand() * array.length)]
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const NOW = Date.now()
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString()
const hoursAgo = (h: number) => minutesAgo(h * 60)
const daysAgo = (d: number) => minutesAgo(d * 60 * 24)

const CATALOG: [string, string, number][] = [
  ['گوشی موبایل سامسونگ گلکسی A55', 'موبایل و تبلت', 18_900_000],
  ['گوشی موبایل شیائومی Redmi Note 13', 'موبایل و تبلت', 9_850_000],
  ['تبلت سامسونگ Galaxy Tab S9 FE', 'موبایل و تبلت', 24_500_000],
  ['اپل واچ سری ۹ سایز ۴۵ میلی‌متری', 'موبایل و تبلت', 31_200_000],
  ['هندزفری بی‌سیم شیائومی Redmi Buds 5', 'صوتی و تصویری', 1_790_000],
  ['هدفون سونی WH-CH720N', 'صوتی و تصویری', 7_450_000],
  ['اسپیکر بلوتوثی JBL Flip 6', 'صوتی و تصویری', 6_300_000],
  ['ساندبار سامسونگ HW-B550', 'صوتی و تصویری', 12_800_000],
  ['تلویزیون ال‌جی ۵۵ اینچ UHD', 'صوتی و تصویری', 38_500_000],
  ['میکروفون بویا BY-M1', 'صوتی و تصویری', 890_000],
  ['لپ‌تاپ ایسوس Vivobook 15', 'کامپیوتر و لپ‌تاپ', 42_900_000],
  ['لپ‌تاپ اپل مک‌بوک ایر M3', 'کامپیوتر و لپ‌تاپ', 89_000_000],
  ['مانیتور ال‌جی ۲۴ اینچ IPS', 'کامپیوتر و لپ‌تاپ', 8_950_000],
  ['کیبورد مکانیکی لاجیتک MX Mechanical', 'کامپیوتر و لپ‌تاپ', 9_200_000],
  ['ماوس بی‌سیم لاجیتک M330', 'کامپیوتر و لپ‌تاپ', 1_150_000],
  ['هارد اکسترنال وسترن ۲ ترابایت', 'کامپیوتر و لپ‌تاپ', 4_350_000],
  ['فلش مموری سن‌دیسک ۱۲۸ گیگابایت', 'کامپیوتر و لپ‌تاپ', 780_000],
  ['روتر تی‌پی‌لینک Archer AX23', 'کامپیوتر و لپ‌تاپ', 3_650_000],
  ['پاوربانک انکر ۲۰۰۰۰ میلی‌آمپر', 'لوازم جانبی', 2_450_000],
  ['شارژر سریع ۶۵ وات GaN', 'لوازم جانبی', 1_290_000],
  ['کابل Type-C بافته‌شده ۲ متری', 'لوازم جانبی', 320_000],
  ['پایه نگهدارنده لپ‌تاپ آلومینیومی', 'لوازم جانبی', 690_000],
  ['کیف چرمی لپ‌تاپ ۱۵ اینچ', 'لوازم جانبی', 1_450_000],
  ['سه‌پایه مانفروتو Compact', 'لوازم جانبی', 3_100_000],
  ['دوربین کانن EOS 200D', 'دوربین', 34_700_000],
  ['دوربین بدون آینه سونی A6400', 'دوربین', 62_400_000],
  ['جاروبرقی رباتیک شیائومی S10', 'لوازم خانگی', 14_300_000],
  ['چای‌ساز بوش ۱.۷ لیتری', 'لوازم خانگی', 2_890_000],
  ['اسپرسوساز دلمونگی EC685', 'لوازم خانگی', 11_750_000],
  ['ماشین اصلاح فیلیپس سری ۵۰۰۰', 'لوازم خانگی', 3_250_000],
  ['سشوار پاناسونیک ۲۲۰۰ وات', 'لوازم خانگی', 4_780_000],
  ['تصفیه هوای شارپ اتاق‌خواب', 'لوازم خانگی', 16_900_000],
  ['مایکروویو سامسونگ ۲۳ لیتری', 'لوازم خانگی', 9_650_000],
  ['کتری برقی فلزی ۱.۷ لیتری', 'لوازم خانگی', 1_190_000],
  ['غذاساز چندکاره کنوود', 'لوازم خانگی', 7_850_000],
  ['پنکه ایستاده ریموت‌دار', 'لوازم خانگی', 2_350_000],
  ['گوشی موبایل سامسونگ گلکسی S24', 'موبایل و تبلت', 46_800_000],
  ['گوشی موبایل نوکیا G42', 'موبایل و تبلت', 5_450_000],
  ['هندزفری اپل ایرپاد پرو نسل ۲', 'صوتی و تصویری', 13_900_000],
  ['اسپیکر قابل حمل Bose SoundLink', 'صوتی و تصویری', 15_600_000],
  ['فلاشر استودیویی نئوور', 'دوربین', 5_900_000],
  ['لنز کانن ۵۰ میلی‌متری f/1.8', 'دوربین', 8_400_000],
  ['کارت حافظه سونی ۶۴ گیگابایت', 'دوربین', 1_650_000],
  ['استابلایزر گوشی DJI OM 6', 'لوازم جانبی', 4_950_000],
  ['تبلت اپل آی‌پد ایر ۱۱', 'موبایل و تبلت', 39_200_000],
  ['پرینتر لیزری اچ‌پی M404', 'کامپیوتر و لپ‌تاپ', 18_200_000],
  ['اسکنر کانن LiDE 300', 'کامپیوتر و لپ‌تاپ', 3_950_000],
  ['وبکم لاجیتک C920', 'کامپیوتر و لپ‌تاپ', 2_780_000],
  ['میکروفون استودیویی هایپرایکس', 'صوتی و تصویری', 6_700_000],
  ['ساعت هوشمند هوآوی Watch GT 4', 'موبایل و تبلت', 9_800_000],
  ['جارو شارژی بوش سری ۸', 'لوازم خانگی', 13_200_000],
  ['آبمیوه‌گیری فیلیپس', 'لوازم خانگی', 3_480_000],
  ['ترازوی آشپزخانه دیجیتال', 'لوازم خانگی', 520_000],
  ['چراغ رینگی ۱۸ اینچ', 'دوربین', 2_980_000],
]

const ERROR_MESSAGES = [
  'شناسه محصول در اسنپ‌شاپ یافت نشد (404)',
  'قیمت ارسالی کمتر از حد مجاز اسنپ‌شاپ است',
  'SKU تکراری در ووکامرس',
  'توکن فروشگاه منقضی شده است',
]

const SYNC_STATUSES: Product['sync_status'][] = ['synced', 'synced', 'synced', 'pending', 'error', 'not_linked', 'paused']

export const products: Product[] = CATALOG.map(([name, category, basePrice], index) => {
  const id = 1000 + index
  const syncStatus = index % 11 === 0 ? 'error' : SYNC_STATUSES[between(0, SYNC_STATUSES.length - 1)]
  const isVariable = index % 7 === 3
  const priceDrift = index % 4 === 0 ? between(1, 12) : 0
  const wcPrice = basePrice + between(0, 40) * 1000
  const snappPrice =
    syncStatus === 'not_linked' || index % 13 === 0
      ? null
      : Math.round((wcPrice * (100 + priceDrift)) / 100 / 1000) * 1000
  const wcStock = index % 9 === 0 ? 0 : between(0, 120)
  const snappStock = snappPrice === null ? null : Math.max(0, wcStock + (index % 5 === 0 ? between(-6, 6) : 0))

  const variants: ProductVariant[] | undefined = isVariable
    ? ['مشکی', 'نقره‌ای', 'سفید'].map((color, v) => ({
        id: id * 10 + v,
        name: color,
        sku: `SNP-${id}-${v + 1}`,
        wc_price: wcPrice + v * 150_000,
        snapp_price: snappPrice === null ? null : snappPrice + v * 150_000,
        wc_stock: Math.max(0, wcStock - v * 3),
        snapp_stock: snappStock === null ? null : Math.max(0, snappStock - v * 3),
      }))
    : undefined

  return {
    id,
    name,
    sku: `SNP-${id}`,
    product_number: syncStatus === 'not_linked' ? null : `SHP-${20_000 + index * 7}`,
    image: null,
    type: isVariable ? 'variable' : 'simple',
    category,
    status: wcStock === 0 ? 'out_of_stock' : index % 17 === 0 ? 'draft' : 'publish',
    wc_price: wcPrice,
    snapp_price: snappPrice,
    wc_stock: wcStock,
    snapp_stock: snappStock,
    stock_source: index % 6 === 0 ? 'snappshop' : index % 5 === 0 ? 'manual' : 'woocommerce',
    match_status: snappPrice === null ? 'missing' : priceDrift > 0 || (snappStock ?? 0) !== wcStock ? 'conflict' : 'matched',
    sync_status: syncStatus as Product['sync_status'],
    last_updated: minutesAgo(between(3, 5200)),
    errors: syncStatus === 'error' ? [ERROR_MESSAGES[index % ERROR_MESSAGES.length]] : [],
    variants,
  }
})

/* -------------------------------------------------------------------------- */
/* Stores                                                                     */
/* -------------------------------------------------------------------------- */

export const stores: Store[] = [
  {
    id: 1,
    name: 'فروشگاه اصلی اسنپ‌شاپ',
    code: 'main-store',
    status: 'connected',
    sync_status: 'running',
    products_count: products.length,
    orders_count: 2140,
    last_connection: minutesAgo(4),
    is_default: true,
    vendor_id: 'VN-10294',
    settings: { stock_source: 'woocommerce', auto_sync: true, sync_interval_minutes: 30, price_markup_percent: 3 },
  },
  {
    id: 2,
    name: 'شعبه دیجیتال تهران',
    code: 'tehran-digital',
    status: 'connected',
    sync_status: 'idle',
    products_count: 812,
    orders_count: 946,
    last_connection: minutesAgo(38),
    is_default: false,
    vendor_id: 'VN-10311',
    settings: { stock_source: 'snappshop', auto_sync: true, sync_interval_minutes: 15, price_markup_percent: 5 },
  },
  {
    id: 3,
    name: 'فروشگاه لوازم خانگی',
    code: 'home-appliances',
    status: 'disconnected',
    sync_status: 'error',
    products_count: 0,
    orders_count: 0,
    last_connection: hoursAgo(52),
    is_default: false,
    vendor_id: 'VN-10427',
    settings: { stock_source: 'woocommerce', auto_sync: false, sync_interval_minutes: 60, price_markup_percent: 0 },
  },
]

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

const ORDER_STATUSES: OrderStatus[] = ['new', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
const CUSTOMERS = [
  ['سارا محمدی', '۰۹۱۲۳۴۵۶۷۸۹'],
  ['امیر رضایی', '۰۹۳۵۱۱۲۲۳۳۴'],
  ['نگار کریمی', '۰۹۱۹۸۸۷۷۶۶۵'],
  ['حسین موسوی', '۰۹۱۲۴۴۵۵۶۶۷'],
  ['مینا احمدی', '۰۹۳۶۹۹۸۸۷۷۶'],
  ['رضا شریفی', '۰۹۱۲۷۷۸۸۹۹۰'],
  ['الهام نوری', '۰۹۳۰۱۲۳۴۵۶۷'],
] as const

function buildItems(count: number): OrderItem[] {
  return Array.from({ length: count }, (_, i) => {
    const product = pick(products)
    const quantity = between(1, 3)
    return {
      id: Date.now() % 100000 + i,
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unit_price: product.wc_price,
      total: product.wc_price * quantity,
    }
  })
}

function buildEvents(status: OrderStatus, createdAt: string): OrderEvent[] {
  const events: OrderEvent[] = [
    {
      id: 1,
      type: 'created',
      title: 'سفارش در اسنپ‌شاپ ثبت شد',
      description: 'سفارش به‌صورت خودکار از API دریافت شد.',
      created_at: createdAt,
      actor: 'همگام‌سازی خودکار',
      status: 'info',
    },
    {
      id: 2,
      type: 'synced',
      title: 'ثبت سفارش در ووکامرس',
      description: 'سفارش با موفقیت به ووکامرس منتقل شد.',
      created_at: new Date(new Date(createdAt).getTime() + 90_000).toISOString(),
      actor: 'سیستم',
      status: 'success',
    },
  ]
  if (status !== 'new') {
    events.push({
      id: 3,
      type: 'status_changed',
      title: 'تغییر وضعیت سفارش',
      description: `وضعیت به «${status === 'processing' ? 'در حال پردازش' : status === 'shipped' ? 'ارسال شده' : status === 'delivered' ? 'تحویل شده' : status === 'cancelled' ? 'لغو شده' : 'مرجوعی'}» تغییر کرد.`,
      created_at: new Date(new Date(createdAt).getTime() + 3_600_000).toISOString(),
      actor: 'سیستم',
      status: 'info',
    })
  }
  if (status === 'cancelled' || status === 'returned') {
    events.push({
      id: 4,
      type: 'cancelled',
      title: status === 'cancelled' ? 'لغو سفارش' : 'ثبت مرجوعی',
      description: status === 'cancelled' ? 'سفارش توسط مشتری لغو شد.' : 'درخواست مرجوعی تأیید شد.',
      created_at: new Date(new Date(createdAt).getTime() + 7_200_000).toISOString(),
      actor: 'پشتیبانی',
      status: 'warning',
    })
  }
  return events
}

export const orders: Order[] = Array.from({ length: 48 }, (_, index) => {
  const items = buildItems(between(1, 3))
  const createdAt = daysAgo(between(0, 21)) 
  const status = index % 13 === 0 ? 'cancelled' : ORDER_STATUSES[between(0, ORDER_STATUSES.length - 1)]
  const [customer_name, customer_phone] = CUSTOMERS[index % CUSTOMERS.length]
  return {
    id: 7000 + index,
    number: `SHP-${950_000 + index * 13}`,
    created_at: createdAt,
    updated_at: hoursAgo(between(0, 6)),
    status,
    items_count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.total, 0),
    shipping_type: pick(['express', 'standard', 'pickup'] as const),
    cancel_status: status === 'cancelled' ? 'full' : index % 17 === 0 ? 'partial' : 'none',
    customer_name: index % 5 === 0 ? null : customer_name,
    customer_phone: index % 5 === 0 ? null : customer_phone,
    wc_order_id: index % 9 === 0 ? null : 12_000 + index,
    items,
    events: buildEvents(status, createdAt),
  }
})

/* -------------------------------------------------------------------------- */
/* Jobs                                                                       */
/* -------------------------------------------------------------------------- */

type JobSeed = {
  type: BackgroundJob['type']
  title: string
  scope: BackgroundJob['scope']
  status: BackgroundJob['status']
  total: number
  processed: number
  failed: number
  started: string
  duration: number | null
}

const JOB_SEEDS: JobSeed[] = [
  { type: 'full_sync', title: 'همگام‌سازی کامل فروشگاه', scope: 'all', status: 'completed', total: 812, processed: 812, failed: 3, started: hoursAgo(2), duration: 412 },
  { type: 'price_sync', title: 'همگام‌سازی قیمت‌ها', scope: 'prices', status: 'completed', total: 540, processed: 540, failed: 0, started: hoursAgo(5), duration: 128 },
  { type: 'stock_sync', title: 'به‌روزرسانی موجودی', scope: 'stock', status: 'partially_completed', total: 640, processed: 640, failed: 12, started: hoursAgo(8), duration: 204 },
  { type: 'order_sync', title: 'دریافت سفارش‌های جدید', scope: 'orders', status: 'completed', total: 48, processed: 48, failed: 0, started: hoursAgo(9), duration: 22 },
  { type: 'product_sync', title: 'همگام‌سازی محصولات', scope: 'products', status: 'failed', total: 620, processed: 118, failed: 41, started: hoursAgo(13), duration: 96 },
  { type: 'automation', title: 'اجرای قانون کاهش قیمت فصلی', scope: 'prices', status: 'completed', total: 74, processed: 74, failed: 0, started: daysAgo(1), duration: 34 },
  { type: 'full_sync', title: 'همگام‌سازی کامل فروشگاه', scope: 'all', status: 'completed', total: 805, processed: 805, failed: 1, started: daysAgo(1), duration: 388 },
  { type: 'stock_sync', title: 'به‌روزرسانی موجودی', scope: 'stock', status: 'cancelled', total: 640, processed: 190, failed: 0, started: daysAgo(2), duration: 44 },
  { type: 'price_sync', title: 'همگام‌سازی قیمت‌ها', scope: 'prices', status: 'completed', total: 521, processed: 521, failed: 2, started: daysAgo(2), duration: 141 },
  { type: 'order_sync', title: 'دریافت سفارش‌های جدید', scope: 'orders', status: 'completed', total: 39, processed: 39, failed: 0, started: daysAgo(3), duration: 18 },
  { type: 'product_sync', title: 'همگام‌سازی محصولات', scope: 'products', status: 'completed', total: 610, processed: 610, failed: 4, started: daysAgo(3), duration: 264 },
  { type: 'automation', title: 'اجرای قانون هشدار موجودی', scope: 'stock', status: 'completed', total: 24, processed: 24, failed: 0, started: daysAgo(4), duration: 11 },
]

export const jobs: BackgroundJob[] = JOB_SEEDS.map((seed, index) => ({
  id: 500 + index,
  type: seed.type,
  title: seed.title,
  scope: seed.scope,
  status: seed.status,
  progress: Math.round((seed.processed / seed.total) * 100),
  processed: seed.processed,
  total: seed.total,
  failed: seed.failed,
  retry_count: seed.status === 'failed' ? 1 : 0,
  started_at: seed.started,
  finished_at: seed.duration ? new Date(new Date(seed.started).getTime() + seed.duration * 1000).toISOString() : null,
  duration_seconds: seed.duration,
  store_id: 1,
  errors:
    seed.failed > 0
      ? Array.from({ length: Math.min(3, seed.failed) }, (_, i) => `ردیف ${seed.processed - i}: ${ERROR_MESSAGES[i % ERROR_MESSAGES.length]}`)
      : [],
}))

/** A live job that visibly progresses while the Sync Center polls. */
export const runningJob: BackgroundJob = {
  id: 1201,
  type: 'full_sync',
  title: 'همگام‌سازی کامل فروشگاه',
  scope: 'all',
  status: 'running',
  progress: 0,
  processed: 0,
  total: 860,
  failed: 4,
  retry_count: 0,
  started_at: minutesAgo(0.6),
  finished_at: null,
  duration_seconds: null,
  store_id: 1,
  errors: ['ردیف ۱۸۴: شناسه محصول در اسنپ‌شاپ یافت نشد (404)'],
}

/* -------------------------------------------------------------------------- */
/* Automations                                                                */
/* -------------------------------------------------------------------------- */

export const automations: Automation[] = [
  {
    id: 1,
    name: 'همگام‌سازی خودکار موجودی صفر',
    description: 'وقتی موجودی محصولی صفر می‌شود، وضعیت آن در اسنپ‌شاپ ناموجود می‌شود.',
    trigger: 'stock_changed',
    conditions: [{ field: 'stock', operator: 'lte', value: '0' }],
    actions: [{ type: 'send_notification', params: { channel: 'dashboard', message: 'موجودی محصول صفر شد' } }],
    schedule: 'event',
    enabled: true,
    last_run_at: minutesAgo(46),
    next_run_at: null,
    last_result: 'success',
    runs_count: 128,
  },
  {
    id: 2,
    name: 'افزایش قیمت شبانه ۳ درصد',
    description: 'هر شب ساعت ۰۲:۰۰ قیمت محصولات دسته لوازم خانگی سه درصد افزایش می‌یابد.',
    trigger: 'schedule',
    conditions: [{ field: 'category', operator: 'eq', value: 'لوازم خانگی' }],
    actions: [{ type: 'adjust_price', params: { mode: 'increase_percent', value: '3' } }],
    schedule: 'daily_02',
    enabled: true,
    last_run_at: hoursAgo(7),
    next_run_at: hoursAgo(-17),
    last_result: 'success',
    runs_count: 64,
  },
  {
    id: 3,
    name: 'ثبت سفارش جدید در ووکامرس',
    description: 'هر سفارش جدید اسنپ‌شاپ بلافاصله در ووکامرس ایجاد می‌شود.',
    trigger: 'order_created',
    conditions: [],
    actions: [{ type: 'sync_order', params: {} }],
    schedule: 'event',
    enabled: true,
    last_run_at: minutesAgo(12),
    next_run_at: null,
    last_result: 'success',
    runs_count: 942,
  },
  {
    id: 4,
    name: 'هشدار موجودی کم',
    description: 'اگر موجودی کمتر از ۵ عدد باشد، اعلان ارسال می‌شود.',
    trigger: 'schedule',
    conditions: [{ field: 'stock', operator: 'lt', value: '5' }],
    actions: [{ type: 'send_notification', params: { channel: 'email', message: 'موجودی کم' } }],
    schedule: 'every_6h',
    enabled: false,
    last_run_at: daysAgo(4),
    next_run_at: null,
    last_result: 'failed',
    runs_count: 21,
  },
  {
    id: 5,
    name: 'توقف همگام‌سازی در خطای اتصال',
    description: 'در صورت خطای احراز هویت، همگام‌سازی خودکار غیرفعال می‌شود.',
    trigger: 'sync_failed',
    conditions: [{ field: 'error_code', operator: 'eq', value: '401' }],
    actions: [{ type: 'disable_sync', params: {} }],
    schedule: 'event',
    enabled: true,
    last_run_at: daysAgo(2),
    next_run_at: null,
    last_result: 'success',
    runs_count: 3,
  },
  {
    id: 6,
    name: 'قیمت‌گذاری محصولات جدید',
    description: 'برای محصولات تازه، فرمول ۵ درصد بیشتر از قیمت ووکامرس اعمال می‌شود.',
    trigger: 'product_created',
    conditions: [{ field: 'status', operator: 'eq', value: 'publish' }],
    actions: [{ type: 'adjust_price', params: { mode: 'increase_percent', value: '5' } }],
    schedule: 'event',
    enabled: false,
    last_run_at: null,
    next_run_at: null,
    last_result: 'never',
    runs_count: 0,
  },
]

/* -------------------------------------------------------------------------- */
/* Notifications, activity, discounts, price history, inventory rules          */
/* -------------------------------------------------------------------------- */

export const notifications: NotificationItem[] = [
  { id: 1, title: 'همگام‌سازی کامل با موفقیت انجام شد', body: '۸۱۲ محصول بررسی شد؛ ۳ مورد ناموفق بود.', type: 'success', read: false, created_at: minutesAgo(24), link: '/sync' },
  { id: 2, title: '۴۱ خطا در همگام‌سازی محصولات', body: 'شناسه برخی محصولات در اسنپ‌شاپ یافت نشد.', type: 'error', read: false, created_at: hoursAgo(3), link: '/jobs' },
  { id: 3, title: 'موجودی ۱۲ محصول کم است', body: 'موجودی این محصولات کمتر از آستانه تعیین‌شده است.', type: 'warning', read: false, created_at: hoursAgo(5), link: '/inventory' },
  { id: 4, title: 'فروشگاه «لوازم خانگی» قطع شد', body: 'اتصال به اسنپ‌شاپ برقرار نشد. توکن را بررسی کنید.', type: 'error', read: false, created_at: hoursAgo(9), link: '/stores' },
  { id: 5, title: 'قانون «افزایش قیمت شبانه» اجرا شد', body: '۷۴ محصول به‌روزرسانی شد.', type: 'info', read: true, created_at: daysAgo(1), link: '/automation' },
  { id: 6, title: 'گزارش هفتگی آماده است', body: 'خلاصه عملکرد فروشگاه در بخش گزارش‌ها موجود است.', type: 'info', read: true, created_at: daysAgo(2), link: '/reports' },
]

export const activity: ActivityEntry[] = [
  { id: 1, type: 'order', title: 'سفارش جدید SHP-950520', description: 'سفارش به مبلغ ۱۲٬۴۵۰٬۰۰۰ تومان ثبت و به ووکامرس منتقل شد.', status: 'success', created_at: minutesAgo(6), actor: 'همگام‌سازی خودکار' },
  { id: 2, type: 'stock', title: 'به‌روزرسانی موجودی', description: 'موجودی ۲۴ محصول از ووکامرس به اسنپ‌شاپ ارسال شد.', status: 'success', created_at: minutesAgo(28), actor: 'سیستم' },
  { id: 3, type: 'sync', title: 'همگام‌سازی کامل آغاز شد', description: '۸۶۰ آیتم در صف پردازش قرار گرفت.', status: 'info', created_at: minutesAgo(36), actor: 'مدیر فروشگاه' },
  { id: 4, type: 'price', title: 'تغییر گروهی قیمت', description: 'قیمت ۱۸ محصول در دسته صوتی و تصویری ۴٪ افزایش یافت.', status: 'success', created_at: hoursAgo(2), actor: 'مدیر فروشگاه' },
  { id: 5, type: 'error', title: 'خطای احراز هویت', description: 'فروشگاه لوازم خانگی پاسخ 401 دریافت کرد.', status: 'error', created_at: hoursAgo(3), actor: 'سیستم' },
  { id: 6, type: 'automation', title: 'اجرای قانون موجودی صفر', description: '۳ محصول ناموجود شد.', status: 'warning', created_at: hoursAgo(4), actor: 'اتوماسیون' },
  { id: 7, type: 'order', title: 'لغو سفارش SHP-950233', description: 'سفارش توسط مشتری لغو و در ووکامرس نیز بسته شد.', status: 'warning', created_at: hoursAgo(6), actor: 'همگام‌سازی خودکار' },
  { id: 8, type: 'sync', title: 'همگام‌سازی قیمت‌ها پایان یافت', description: '۵۴۰ محصول، بدون خطا.', status: 'success', created_at: hoursAgo(7), actor: 'سیستم' },
  { id: 9, type: 'price', title: 'ویرایش قیمت تک‌محصول', description: 'قیمت «هدفون سونی WH-CH720N» از ۷٬۲۰۰٬۰۰۰ به ۷٬۴۵۰٬۰۰۰ تومان تغییر کرد.', status: 'success', created_at: hoursAgo(9), actor: 'مدیر فروشگاه' },
  { id: 10, type: 'stock', title: 'مغایرت موجودی', description: 'موجودی ۸ محصول بین ووکامرس و اسنپ‌شاپ متفاوت است.', status: 'warning', created_at: hoursAgo(11), actor: 'سیستم' },
  { id: 11, type: 'automation', title: 'قانون هشدار موجودی ناموفق بود', description: 'ارسال ایمیل با خطا مواجه شد.', status: 'error', created_at: daysAgo(1), actor: 'اتوماسیون' },
  { id: 12, type: 'order', title: 'تحویل سفارش SHP-950118', description: 'وضعیت سفارش به «تحویل شده» تغییر کرد.', status: 'success', created_at: daysAgo(1), actor: 'همگام‌سازی خودکار' },
]

export const discounts: Discount[] = [
  { id: 1, title: 'تخفیف پایان هفته موبایل', type: 'percentage', value: 8, scope: 'category', products_count: 12, starts_at: daysAgo(2), ends_at: daysAgo(-2), synced: true },
  { id: 2, title: 'تخفیف لوازم جانبی', type: 'percentage', value: 15, scope: 'products', products_count: 24, starts_at: daysAgo(1), ends_at: daysAgo(-6), synced: true },
  { id: 3, title: 'کاهش ۵۰۰ هزار تومانی لپ‌تاپ‌ها', type: 'fixed', value: 500_000, scope: 'category', products_count: 6, starts_at: daysAgo(4), ends_at: daysAgo(-1), synced: false },
  { id: 4, title: 'حراج لوازم خانگی', type: 'percentage', value: 12, scope: 'all', products_count: 34, starts_at: daysAgo(0), ends_at: daysAgo(-9), synced: true },
]

export const priceHistory: PriceHistoryEntry[] = Array.from({ length: 32 }, (_, index) => {
  const product = products[(index * 5) % products.length]
  const from = Math.round(product.wc_price * (1 - between(1, 9) / 100) / 1000) * 1000
  return {
    id: 900 + index,
    product_id: product.id,
    product_name: product.name,
    from_price: from,
    to_price: product.wc_price,
    source: pick(['manual', 'bulk', 'automation', 'sync'] as const),
    actor: index % 3 === 0 ? 'اتوماسیون' : 'مدیر فروشگاه',
    created_at: minutesAgo(between(20, 14_000)),
  }
})

export const inventoryRules: InventoryRule[] = [
  { id: 1, title: 'منبع اصلی موجودی: ووکامرس', description: 'موجودی اسنپ‌شاپ همیشه از ووکامرس بازنویسی می‌شود.', enabled: true },
  { id: 2, title: 'مسدودسازی فروش موجودی صفر', description: 'محصولات با موجودی صفر در اسنپ‌شاپ ناموجود می‌شوند.', enabled: true },
  { id: 3, title: 'آستانه موجودی کم: ۵ عدد', description: 'برای موجودی کمتر از این مقدار هشدار نمایش داده می‌شود.', enabled: true },
  { id: 4, title: 'همگام‌سازی فقط محصولات منتشرشده', description: 'پیش‌نویس‌ها به اسنپ‌شاپ ارسال نمی‌شوند.', enabled: false },
]

export const inventorySummary: InventorySummary = {
  total: products.length,
  in_stock: products.filter((p) => p.wc_stock > 5).length,
  low_stock: products.filter((p) => p.wc_stock > 0 && p.wc_stock <= 5).length,
  out_of_stock: products.filter((p) => p.wc_stock === 0).length,
  mismatched: products.filter((p) => p.snapp_stock !== null && p.snapp_stock !== p.wc_stock).length,
  rules: inventoryRules,
}

export const settings: SettingsPayload = {
  general: {
    business_name: 'فروشگاه اصلی اسنپ‌شاپ',
    currency_unit: 'toman',
    date_display: 'jalali',
    number_display: 'fa',
    default_store_id: 1,
  },
  connection: {
    api_base_url: 'https://api.snappshop.ir/v1',
    timeout_seconds: 30,
    verify_ssl: true,
    last_checked_at: minutesAgo(4),
  },
  sync: {
    auto_sync: true,
    interval_minutes: 30,
    batch_size: 50,
    sync_products: true,
    sync_prices: true,
    sync_stock: true,
    sync_orders: true,
    conflict_policy: 'woocommerce',
  },
  products: {
    auto_publish: false,
    default_category: 'لوازم جانبی',
    skip_missing_sku: true,
    image_sync: true,
  },
  inventory: {
    stock_source: 'woocommerce',
    low_stock_threshold: 5,
    block_zero_stock: true,
  },
  pricing: {
    round_to: 1000,
    min_price: 10_000,
    max_markup_percent: 25,
    price_sync_enabled: true,
  },
  automation: {
    enabled: true,
    max_daily_runs: 200,
    notify_on_failure: true,
  },
  jobs: {
    concurrency: 2,
    retry_attempts: 3,
    retry_delay_seconds: 60,
    log_retention_days: 30,
  },
  notifications: {
    email_enabled: true,
    email_address: 'admin@example.com',
    on_sync_failure: true,
    on_sync_success: false,
    on_stock_change: true,
  },
  security: {
    rest_nonce_enabled: true,
    allowed_roles: ['administrator', 'shop_manager'],
    log_ip_address: true,
  },
  advanced: {
    debug_mode: false,
    api_version: 'v1',
    clear_logs_on_deactivate: false,
  },
}
