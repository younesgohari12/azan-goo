import type { Transition, Variants } from 'framer-motion'
import { DUR, EASE_BASE, INTRO_STAGGER, STEP_SHIFT, VIEW_SHIFT } from './tokens'

export const feedbackTransition: Transition = { duration: DUR.feedback, ease: EASE_BASE }
export const controlTransition: Transition = { duration: DUR.control, ease: EASE_BASE }
export const panelTransition: Transition = { duration: DUR.panel, ease: EASE_BASE }

/** ورود اولیهٔ گروه‌ها: stagger کوتاه، یک‌بار */
export const introContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: INTRO_STAGGER, delayChildren: 0.02 } },
}

export const introGroup: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: panelTransition },
  /** حالت پایدار: بدون انیمیشن ورود دوباره */
  settled: { opacity: 1, y: 0, transition: { duration: 0 } },
}

/** ورود نرم یک گروه اطلاعات (خلاصهٔ تأیید) — همه با هم، نه هر عدد جداگانه */
export const groupRise: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: panelTransition },
}

/** گذار جهت‌دار صفحه‌ها */
export function viewVariants(direction: 1 | -1): Variants {
  return {
    enter: { opacity: 0, x: direction === 1 ? -VIEW_SHIFT : VIEW_SHIFT },
    center: { opacity: 1, x: 0, transition: panelTransition },
    exit: { opacity: 0, x: direction === 1 ? VIEW_SHIFT : -VIEW_SHIFT, transition: controlTransition },
  }
}

/** گذار جهت‌دار مراحل یک فرم */
export function stepVariants(direction: 1 | -1): Variants {
  return {
    enter: { opacity: 0, x: direction === 1 ? -STEP_SHIFT : STEP_SHIFT },
    center: { opacity: 1, x: 0, transition: panelTransition },
    exit: { opacity: 0, x: direction === 1 ? STEP_SHIFT : -STEP_SHIFT, transition: controlTransition },
  }
}

/** پنل شناور روی موبایل: از پایین می‌آید */
export const sheetPanelMobile: Variants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: panelTransition },
  exit: { y: '100%', transition: { duration: DUR.control + 0.04, ease: EASE_BASE } },
}

/** پنل شناور روی دسکتاپ: در مرکز، ورود کوتاه */
export const sheetPanelDesktop: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: panelTransition },
  exit: { opacity: 0, y: 10, scale: 0.99, transition: controlTransition },
}

export const scrimVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: controlTransition },
  exit: { opacity: 0, transition: controlTransition },
}

/** آیکون نتیجهٔ عملیات: بدون جهش، فقط جمع‌شدن آرام */
export const resultIcon: Variants = {
  hidden: { opacity: 0, scale: 0.86 },
  visible: { opacity: 1, scale: 1, transition: feedbackTransition },
}
