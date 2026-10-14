/**
 * توکن‌های حرکت — یک سیستم مشترک برای همهٔ بخش‌ها.
 * مقدارها بر حسب ثانیه هستند (واحد framer-motion).
 */
export const DUR = {
  /** بازخورد فوری: فشار دکمه، نشان انتخاب */
  feedback: 0.12,
  /** کنترل و منو: چیپ، ردیف، دکمهٔ آیکونی */
  control: 0.18,
  /** پنل و تغییر مرحله */
  panel: 0.25,
} as const

export const EASE_BASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** فاصلهٔ ورود جهت‌دار بین مراحل (پیکسل) */
export const STEP_SHIFT = 18
/** فاصلهٔ ورود جهت‌دار بین صفحه‌ها (پیکسل) */
export const VIEW_SHIFT = 24
/** تأخیر بین گروه‌های ورود اولیه */
export const INTRO_STAGGER = 0.06
