import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { Button } from './Button'
import { cx } from '../lib/cx'
import './EmptyState.css'

interface EmptyStateProps {
  icon: IconName
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  /** compact برای جاهایی مثل کارت موجودی که فضای کمتری دارد */
  variant?: 'default' | 'compact'
  children?: ReactNode
}

/** حالت خالی: آیکون ظریف، یک جملهٔ کاربردی و حداکثر یک اقدام */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  children,
}: EmptyStateProps) {
  return (
    <div className={cx('empty-state', `empty-state--${variant}`)}>
      <span className="empty-state__icon" aria-hidden="true">
        <Icon name={icon} size={variant === 'compact' ? 16 : 20} strokeWidth={1.7} />
      </span>
      <div className="empty-state__text">
        <p className="empty-state__title">{title}</p>
        {description ? <p className="empty-state__description">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button variant="ghost" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </div>
  )
}
