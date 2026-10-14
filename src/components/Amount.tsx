import { cx } from '../lib/cx'
import { formatAmount } from '../lib/format'
import './Amount.css'

export type AmountSize = 'hero' | 'lg' | 'md' | 'row' | 'sm'

export interface AmountProps {
  value: number
  size?: AmountSize
  /** علامت ورودی/خروجی */
  sign?: 'in' | 'out'
  /** نمایش «تومان» کنار مبلغ */
  unit?: boolean
  /** حالت پوشیده (crossfade روی همان فضا) */
  hidden?: boolean
  /**
   * مقدار مرجع برای رزرو عرض ناحیه؛ چیدمان اطراف هنگام تغییر مقدار جابه‌جا نمی‌شود.
   */
  reserve?: number
  tone?: 'default' | 'muted'
  className?: string
}

const MASK = '••••••'

export function Amount({
  value,
  size = 'md',
  sign,
  unit = false,
  hidden = false,
  reserve,
  tone = 'default',
  className,
}: AmountProps) {
  const reserveValue = Math.max(reserve ?? 0, Math.abs(value))
  const signChar = sign === 'in' ? '+' : sign === 'out' ? '−' : ''
  const accessibleLabel = hidden
    ? 'مبلغ پنهان است'
    : `${sign === 'in' ? 'ورودی ' : sign === 'out' ? 'خروجی ' : ''}${formatAmount(value)}${unit ? ' تومان' : ''}`

  return (
    <span
      className={cx(
        'amount',
        `amount--${size}`,
        tone === 'muted' && 'amount--muted',
        className,
      )}
      data-hidden={hidden ? 'true' : 'false'}
    >
      {/* رزرو عرض: نامرئی، فقط فضا نگه می‌دارد */}
      <span className="amount__layer amount__ghost" aria-hidden="true">
        <span className="amount__num" dir="ltr">
          {signChar ? <span className="amount__sign">{signChar}</span> : null}
          {formatAmount(reserveValue)}
        </span>
        {unit ? <span className="amount__unit">تومان</span> : null}
      </span>

      <span className="amount__layer amount__live" aria-hidden="true">
        <span className="amount__num" dir="ltr">
          {signChar ? <span className="amount__sign">{signChar}</span> : null}
          <span className="amount__slot">
            <span className="amount__value u-tnum">{formatAmount(value)}</span>
            <span className="amount__mask u-tnum">{MASK}</span>
          </span>
        </span>
        {unit ? <span className="amount__unit">تومان</span> : null}
      </span>

      <span className="u-visually-hidden">{accessibleLabel}</span>
    </span>
  )
}
