import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Transaction } from '../../data/types'
import { listRowVariants } from '../../motion/variants'
import { TransactionRow } from './TransactionRow'
import './TransactionList.css'

interface TransactionListProps {
  items: Transaction[]
  onOpen: (id: string, anchorY: number) => void
  labelledBy?: string
  /**
   * شمارهٔ اولین مورد جدید؛ فقط موارد تازه با stagger کوتاه وارد می‌شوند.
   * null یعنی هیچ‌کدام از موارد این فهرست نباید انیمیت ورود بگیرند.
   */
  staggerFrom?: number | null
  /** شمارهٔ شروع این گروه در فهرست کامل */
  offset?: number
}

export function TransactionList({
  items,
  onOpen,
  labelledBy,
  staggerFrom = null,
  offset = 0,
}: TransactionListProps) {
  const variants = useMemo(() => listRowVariants(staggerFrom), [staggerFrom])

  return (
    <ul className="tx-list" aria-labelledby={labelledBy}>
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          className="tx-list__item"
          custom={offset + index}
          variants={variants}
          initial={staggerFrom === null ? false : 'hidden'}
          animate="visible"
        >
          <TransactionRow item={item} onOpen={onOpen} />
        </motion.li>
      ))}
    </ul>
  )
}
