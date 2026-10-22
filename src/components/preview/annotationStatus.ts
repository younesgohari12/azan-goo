import type { AnnotationStatus } from '@/types/model'

export const ANNOTATION_STATUS_META: Record<
  AnnotationStatus,
  { label: string; variant: 'neutral' | 'accent' | 'success' | 'warn' | 'danger'; hint?: string }
> = {
  draft: { label: 'آمادهٔ ارسال', variant: 'accent' },
  sent: { label: 'ارسال‌شده', variant: 'neutral' },
  stale: {
    label: 'نیازمند بررسی',
    variant: 'warn',
    hint: 'این نظر روی نسخهٔ قدیمی‌تر ثبت شده و عنصر هدف آن هنوز در نسخهٔ جدید هست؛ انطباقش را بررسی کن.',
  },
  unmatched: {
    label: 'عنصر پیدا نشد',
    variant: 'danger',
    hint: 'بخش هدف این نظر در نسخهٔ جدید پیدا نشد؛ باید بررسی شود.',
  },
  resolved: { label: 'بررسی‌شده', variant: 'success' },
}

export function isReviewNeeded(status: AnnotationStatus): boolean {
  return status === 'stale' || status === 'unmatched'
}
