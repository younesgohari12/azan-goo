import { Amount } from '../../components/Amount'
import { Icon, type IconName } from '../../components/Icon'
import { StatusBadge } from '../../components/StatusBadge'
import type { Transaction, TransactionKind } from '../../data/types'
import { getTransactionDate } from '../../lib/format'
import './TransactionRow.css'

const KIND_ICON: Record<TransactionKind, IconName> = {
  topup: 'plus',
  transfer_in: 'transfer',
  transfer_out: 'transfer',
  withdraw: 'withdraw',
  refund: 'receipt',
}

interface TransactionRowProps {
  item: Transaction
  onOpen: (id: string) => void
}

export function TransactionRow({ item, onOpen }: TransactionRowProps) {
  const date = getTransactionDate(item.date)
  const isOutgoing = item.amount < 0

  return (
    <button type="button" className="tx-row" onClick={() => onOpen(item.id)}>
      <span className="tx-row__icon" aria-hidden="true">
        <Icon name={KIND_ICON[item.kind]} size={18} />
      </span>

      <span className="tx-row__body">
        <span className="tx-row__line">
          <span className="tx-row__title">{item.title}</span>
          <Amount
            value={item.amount}
            size="row"
            sign={isOutgoing ? 'out' : 'in'}
            tone={item.status === 'failed' ? 'muted' : 'default'}
          />
        </span>
        <span className="tx-row__line tx-row__line--meta">
          <span className="tx-row__meta">
            {date.dayLabel}
            <span className="tx-row__separator" aria-hidden="true">
              ·
            </span>
            {date.timeLabel}
          </span>
          <span className="tx-row__tail">
            <StatusBadge status={item.status} />
            <span className="tx-row__chevron" aria-hidden="true">
              <Icon name="chevron-left" size={16} />
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}
