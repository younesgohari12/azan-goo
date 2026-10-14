import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import './SummaryList.css'

export interface SummaryItem {
  label: string
  value: ReactNode
  hint?: string
  /** سطر تأکیدی (مثلاً «مبلغ قابل پرداخت») */
  emphasis?: boolean
}

interface SummaryListProps {
  items: SummaryItem[]
  caption?: string
  className?: string
}

export function SummaryList({ items, caption, className }: SummaryListProps) {
  return (
    <div className={cx('summary-list', className)}>
      <dl className="summary-list__items">
        {items.map((item) => (
          <div
            key={item.label}
            className={cx('summary-list__row', item.emphasis && 'summary-list__row--emphasis')}
          >
            <dt className="summary-list__label">
              {item.label}
              {item.hint ? <span className="summary-list__hint">{item.hint}</span> : null}
            </dt>
            <dd className="summary-list__value">{item.value}</dd>
          </div>
        ))}
      </dl>
      {caption ? <p className="summary-list__caption">{caption}</p> : null}
    </div>
  )
}
