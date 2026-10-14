import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AppHeader } from '../../components/AppHeader'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { getTransactionDate, toLatinDigits, toPersianDigits } from '../../lib/format'
import { panelTransition } from '../../motion/variants'
import type { Transaction } from '../../data/types'
import { HistoryFilters, type HistoryKind, type HistoryStatus } from './HistoryFilters'
import { TransactionList } from './TransactionList'
import { useWallet } from './WalletProvider'
import './TransactionsView.css'

interface TransactionsViewProps {
  onBack: () => void
  onOpenTransaction: (id: string, anchorY: number) => void
}

interface DayGroup {
  key: string
  label: string
  items: Transaction[]
  offset: number
}

interface Filters {
  query: string
  kind: HistoryKind
  status: HistoryStatus
}

const DEFAULT_FILTERS: Filters = { query: '', kind: 'all', status: 'all' }

/** «افزایش اعتبار» شامل بازگشت وجه هم می‌شود؛ هر دو اعتبار ورودی‌اند. */
const KIND_BUCKETS: Record<HistoryKind, ((item: Transaction) => boolean) | null> = {
  all: null,
  topup: (item) => item.kind === 'topup' || item.kind === 'refund',
  transfer: (item) => item.kind === 'transfer_in' || item.kind === 'transfer_out',
  withdraw: (item) => item.kind === 'withdraw',
}

export function TransactionsView({ onBack, onOpenTransaction }: TransactionsViewProps) {
  const { transactions, config } = useWallet()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [visible, setVisible] = useState<number>(config.historyPageSize)
  /** شمارهٔ اولین مورد جدید پس از «نمایش بیشتر»؛ null یعنی بدون stagger */
  const [staggerFrom, setStaggerFrom] = useState<number | null>(null)

  const signature = `${filters.query.trim()}|${filters.kind}|${filters.status}`
  const canClear = signature !== `${DEFAULT_FILTERS.query}|${DEFAULT_FILTERS.kind}|${DEFAULT_FILTERS.status}`

  /** با هر تغییر فیلتر، صفحه‌بندی از ابتدا و بدون stagger شروع می‌شود */
  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    setVisible(config.historyPageSize)
    setStaggerFrom(null)
  }

  const filtered = useMemo(() => {
    const needle = filters.query.trim().toLowerCase()
    const latinDigits = toLatinDigits(needle).replace(/[^\d]/g, '')
    const bucket = KIND_BUCKETS[filters.kind]

    return transactions.filter((item) => {
      if (bucket && !bucket(item)) return false
      if (filters.status !== 'all' && item.status !== filters.status) return false
      if (!needle) return true
      if (item.title.toLowerCase().includes(needle)) return true
      if (item.counterparty?.toLowerCase().includes(needle)) return true
      if (item.note?.toLowerCase().includes(needle)) return true
      if (item.reference.toLowerCase().includes(needle)) return true
      if (latinDigits.length >= 3 && String(Math.abs(item.amount)).includes(latinDigits)) return true
      return false
    })
  }, [transactions, filters])

  const shown = filtered.slice(0, visible)
  const hasMore = filtered.length > shown.length

  const groups = useMemo<DayGroup[]>(() => {
    const buckets = new Map<string, DayGroup>()
    shown.forEach((item, index) => {
      const date = getTransactionDate(item.date)
      const existing = buckets.get(date.dayKey)
      if (existing) existing.items.push(item)
      else buckets.set(date.dayKey, { key: date.dayKey, label: date.dayLabel, items: [item], offset: index })
    })
    return Array.from(buckets.values())
  }, [shown])

  const showMore = () => {
    setStaggerFrom(shown.length)
    setVisible((current) => current + config.historyPageSize)
  }

  return (
    <div className="transactions">
      <AppHeader
        title="همهٔ تراکنش‌ها"
        subtitle={`${toPersianDigits(filtered.length)} تراکنش`}
        onBack={onBack}
      />

      <div className="transactions__body">
        <HistoryFilters
          query={filters.query}
          onQueryChange={(query) => updateFilters({ query })}
          kind={filters.kind}
          onKindChange={(kind) => updateFilters({ kind })}
          status={filters.status}
          onStatusChange={(status) => updateFilters({ status })}
          canClear={canClear}
          onClear={() => updateFilters(DEFAULT_FILTERS)}
        />

        {filtered.length === 0 ? (
          transactions.length === 0 ? (
            <EmptyState
              icon="receipt"
              title="هنوز تراکنشی ثبت نشده است."
              description="اولین افزایش اعتبار یا انتقال، همین‌جا نمایش داده می‌شود."
            />
          ) : (
            <EmptyState
              icon="search"
              title="با این فیلترها چیزی پیدا نشد."
              description="عبارت دیگری را امتحان کنید یا فیلترها را پاک کنید."
              actionLabel="پاک‌کردن فیلترها"
              onAction={() => updateFilters(DEFAULT_FILTERS)}
            />
          )
        ) : (
          <motion.div
            key={signature}
            className="transactions__results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={panelTransition}
          >
            {groups.map((group) => (
              <section className="transactions__group" key={group.key} aria-label={group.label}>
                <h2 className="transactions__day">{group.label}</h2>
                <TransactionList
                  items={group.items}
                  onOpen={onOpenTransaction}
                  staggerFrom={staggerFrom}
                  offset={group.offset}
                />
              </section>
            ))}

            {hasMore ? (
              <Button variant="secondary" fullWidth onClick={showMore}>
                نمایش بیشتر
                <span className="transactions__more-count u-tnum">
                  ({toPersianDigits(filtered.length - shown.length)} مورد دیگر)
                </span>
              </Button>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  )
}
