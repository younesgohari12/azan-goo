import type { Transaction } from '../../data/types'
import { TransactionRow } from './TransactionRow'
import './TransactionList.css'

interface TransactionListProps {
  items: Transaction[]
  onOpen: (id: string) => void
  labelledBy?: string
}

export function TransactionList({ items, onOpen, labelledBy }: TransactionListProps) {
  return (
    <ul className="tx-list" aria-labelledby={labelledBy}>
      {items.map((item) => (
        <li key={item.id} className="tx-list__item">
          <TransactionRow item={item} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}
