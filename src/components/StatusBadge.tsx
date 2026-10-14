import { AnimatePresence, motion } from 'framer-motion'
import type { TransactionStatus } from '../data/types'
import { feedbackTransition } from '../motion/variants'
import { Icon, type IconName } from './Icon'
import { cx } from '../lib/cx'
import './StatusBadge.css'

const STATUS_LABEL: Record<TransactionStatus, string> = {
  success: 'موفق',
  pending: 'در انتظار',
  failed: 'ناموفق',
}

const STATUS_ICON: Record<TransactionStatus, IconName> = {
  success: 'check',
  pending: 'clock',
  failed: 'alert',
}

interface StatusBadgeProps {
  status: TransactionStatus
  /** تعویض نرم آیکون و متن در فضای ثابت */
  swap?: boolean
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, swap = false, size = 'sm' }: StatusBadgeProps) {
  if (!swap) {
    return (
      <span className={cx('status-badge', `status-badge--${status}`, `status-badge--${size}`)}>
        <Icon name={STATUS_ICON[status]} size={size === 'sm' ? 13 : 15} strokeWidth={1.8} />
        <span className="status-badge__label">{STATUS_LABEL[status]}</span>
      </span>
    )
  }

  return (
    <span className={cx('status-badge-swap', `status-badge-swap--${size}`)}>
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={status}
          className={cx('status-badge', `status-badge--${status}`, `status-badge--${size}`)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={feedbackTransition}
        >
          <Icon name={STATUS_ICON[status]} size={size === 'sm' ? 13 : 15} strokeWidth={1.8} />
          <span className="status-badge__label">{STATUS_LABEL[status]}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
