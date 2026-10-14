import { useMemo, useState } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { getTransactionDate, toPersianDigits } from '../../lib/format'
import type { Transaction } from '../../data/types'
import { TransactionList } from './TransactionList'
import { useWallet } from './WalletProvider'
import './TransactionsView.css'

type TransactionFilter = 'all' | 'in' | 'out' | 'pending'

const FILTERS: Array<{ id: TransactionFilter; label: string }> = [
  { id: 'all', label: 'همه' },
  { id: 'in', label: 'ورودی' },
  { id: 'out', label: 'خروجی' },
  { id: 'pending', label: 'در انتظار' },
]

interface TransactionsViewProps {
  onBack: () => void
  onOpenTransaction: (id: string) => void
}

export function TransactionsView({ onBack, onOpenTransaction }: TransactionsViewProps) {
  const { transactions } = useWallet()
  const [filter, setFilter] = useState<TransactionFilter>('all')

  const filtered = useMemo(() => {
    if (filter === 'in') return transactions.filter((item) => item.amount > 0)
    if (filter === 'out') return transactions.filter((item) => item.amount < 0)
    if (filter === 'pending') return transactions.filter((item) => item.status === 'pending')
    return transactions
  }, [transactions, filter])

  const groups = useMemo(() => {
    const buckets = new Map<string, Transaction[]>()
    filtered.forEach((item) => {
      const key = getTransactionDate(item.date).dayKey
      const bucket = buckets.get(key)
      if (bucket) bucket.push(item)
      else buckets.set(key, [item])
    })
    return Array.from(buckets.values())
  }, [filtered])

  return (
    <div className="transactions">
      <AppHeader
        title="همهٔ تراکنش‌ها"
        subtitle={`${toPersianDigits(transactions.length)} تراکنش`}
        onBack={onBack}
      />

      <div className="transactions__body">
        <div className="transactions__filters" role="group" aria-label="فیلتر تراکنش‌ها">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="transactions__filter"
              data-selected={filter === item.id ? 'true' : 'false'}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <p className="transactions__empty">تراکنشی در این دسته نیست.</p>
        ) : (
          groups.map((group) => {
            const dayLabel = getTransactionDate(group[0].date).dayLabel
            return (
              <section className="transactions__group" key={group[0].id} aria-label={dayLabel}>
                <h2 className="transactions__day">{dayLabel}</h2>
                <TransactionList items={group} onOpen={onOpenTransaction} />
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
