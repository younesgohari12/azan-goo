import type { JobStatus, MatchStatus, OrderStatus, SyncStatus } from '@/api/types'

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'

export const syncStatusMeta: Record<SyncStatus, { label: string; tone: Tone }> = {
  synced: { label: 'همگام‌شده', tone: 'success' },
  pending: { label: 'در انتظار', tone: 'warning' },
  error: { label: 'خطا', tone: 'danger' },
  paused: { label: 'متوقف', tone: 'neutral' },
  not_linked: { label: 'متصل نشده', tone: 'info' },
}

export const matchStatusMeta: Record<MatchStatus, { label: string; tone: Tone }> = {
  matched: { label: 'منطبق', tone: 'success' },
  conflict: { label: 'مغایرت', tone: 'warning' },
  missing: { label: 'یافت نشد', tone: 'danger' },
}

export const orderStatusMeta: Record<OrderStatus, { label: string; tone: Tone }> = {
  new: { label: 'جدید', tone: 'info' },
  processing: { label: 'در حال پردازش', tone: 'warning' },
  shipped: { label: 'ارسال شده', tone: 'primary' },
  delivered: { label: 'تحویل شده', tone: 'success' },
  cancelled: { label: 'لغو شده', tone: 'danger' },
  returned: { label: 'مرجوعی', tone: 'neutral' },
}

export const jobStatusMeta: Record<JobStatus, { label: string; tone: Tone }> = {
  pending: { label: 'در صف', tone: 'neutral' },
  running: { label: 'در حال اجرا', tone: 'info' },
  completed: { label: 'تکمیل شده', tone: 'success' },
  failed: { label: 'ناموفق', tone: 'danger' },
  cancelled: { label: 'لغو شده', tone: 'neutral' },
  partially_completed: { label: 'تکمیل جزئی', tone: 'warning' },
}

export const shippingMeta = {
  express: 'ارسال فوری',
  standard: 'ارسال عادی',
  pickup: 'تحویل حضوری',
} as const

export const jobTypeMeta: Record<string, string> = {
  product_sync: 'همگام‌سازی محصول',
  price_sync: 'همگام‌سازی قیمت',
  stock_sync: 'همگام‌سازی موجودی',
  order_sync: 'همگام‌سازی سفارش',
  full_sync: 'همگام‌سازی کامل',
  automation: 'اتوماسیون',
}

export const activityLabels: Record<string, { label: string; tone: Tone }> = {
  order: { label: 'سفارش', tone: 'info' },
  price: { label: 'قیمت', tone: 'primary' },
  stock: { label: 'موجودی', tone: 'warning' },
  sync: { label: 'همگام‌سازی', tone: 'success' },
  error: { label: 'خطا', tone: 'danger' },
  automation: { label: 'اتوماسیون', tone: 'info' },
}

export const automationTriggerLabels: Record<string, string> = {
  product_created: 'ایجاد محصول',
  product_updated: 'ویرایش محصول',
  stock_changed: 'تغییر موجودی',
  order_created: 'سفارش جدید',
  schedule: 'زمان‌بندی‌شده',
  sync_failed: 'خطای همگام‌سازی',
}

export const automationActionLabels: Record<string, string> = {
  adjust_price: 'تنظیم قیمت',
  sync_product: 'همگام‌سازی محصول',
  sync_order: 'همگام‌سازی سفارش',
  send_notification: 'ارسال اعلان',
  set_stock: 'تنظیم موجودی',
  set_status: 'تغییر وضعیت محصول',
  disable_sync: 'توقف همگام‌سازی',
}

export const conditionFieldLabels: Record<string, string> = {
  stock: 'موجودی',
  price: 'قیمت',
  category: 'دسته‌بندی',
  status: 'وضعیت محصول',
  error_code: 'کد خطا',
}

export const conditionOperatorLabels: Record<string, string> = {
  eq: 'برابر است با',
  neq: 'برابر نیست با',
  lt: 'کمتر از',
  lte: 'کمتر یا مساوی',
  gt: 'بیشتر از',
  gte: 'بیشتر یا مساوی',
  contains: 'شامل',
}

export const scheduleLabels: Record<string, string> = {
  event: 'هنگام رویداد',
  daily_02: 'هر روز ساعت ۰۲:۰۰',
  every_6h: 'هر ۶ ساعت',
  weekly: 'هفتگی',
}
