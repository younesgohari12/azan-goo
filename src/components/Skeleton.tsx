import { cx } from '../lib/cx'
import './Skeleton.css'

interface SkeletonProps {
  /** عرض ناحیه نسبت به ظرف (مثلاً '60%') */
  width?: string
  /** ارتفاع ناحیه؛ هم‌اندازهٔ متن واقعی انتخاب شود تا هنگام جای‌گزینی نپرد */
  height?: string
  className?: string
}

/**
 * جای‌گیرندهٔ محتوا: هم‌اندازهٔ همان متن یا عددی که بعداً جایش می‌آید، با
 * تغییر آرام روشنایی. برای اعداد از `u-tnum` استفاده نکنید تا عرض ثابت نشود.
 */
export function Skeleton({ width = '58%', height = '0.875rem', className }: SkeletonProps) {
  return <span className={cx('skeleton', className)} style={{ width, height }} aria-hidden="true" />
}
