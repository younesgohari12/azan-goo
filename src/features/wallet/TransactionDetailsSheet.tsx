import { useState } from 'react'
import { Amount } from '../../components/Amount'
import { SummaryList, type SummaryItem } from '../../components/SummaryList'
import { Sheet } from '../../components/Sheet'
import { StatusBadge } from '../../components/StatusBadge'
import type { Transaction, TransactionKind } from '../../data/types'
import { formatAmount, getTransactionDate } from '../../lib/format'
import { FlowFooter } from './flows/flowParts'
import './TransactionDetailsSheet.css'

const KIND_LABEL: Record<TransactionKind, string> = {
  topup: 'افزایش اعتبار',
  transfer_in: 'انتقال ورودی',
  transfer_out: 'انتقال خروجی',
  withdraw: 'برداشت',
  refund: 'بازگشت وجه',
}

interface TransactionDetailsSheetProps {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionDetailsSheet({ transaction, onClose }: TransactionDetailsSheetProps) {
  // محتوا هنگام انیمیشن بستن هم نگه داشته می‌شود
  const [shown, setShown] = useState<Transaction | null>(transaction)
  if (transaction && transaction !== shown) setShown(transaction)

  const date = shown ? getTransactionDate(shown.date) : null

  const items: SummaryItem[] = shown
    ? [
        { label: 'نوع تراکنش', value: KIND_LABEL[shown.kind] },
        ...(shown.counterparty ? [{ label: 'طرف مقابل', value: shown.counterparty }] : []),
        { label: 'تاریخ', value: date?.fullLabel ?? '—' },
        { label: 'ساعت', value: date?.timeLabel ?? '—' },
        ...(shown.fee ? [{ label: 'کارمزد', hint: '(نمونه)', value: `${formatAmount(shown.fee)} تومان` }] : []),
        { label: 'شناسهٔ پیگیری', value: shown.reference },
        ...(shown.note ? [{ label: 'توضیح', value: shown.note }] : []),
      ]
    : []

  return (
    <Sheet open={Boolean(transaction)} onClose={onClose} title="جزئیات تراکنش" variant="auto">
      {shown ? (
        <div className="tx-details">
          <div className="tx-details__hero">
            <Amount value={shown.amount} size="lg" sign={shown.amount < 0 ? 'out' : 'in'} unit />
            <StatusBadge status={shown.status} swap size="md" />
          </div>

          <p className="tx-details__title">{shown.title}</p>

          <SummaryList items={items} />

          <p className="tx-details__note">
            {shown.demo
              ? 'این تراکنش در همین نسخهٔ نمایشی و بدون بک‌اند ساخته شده است.'
              : 'دادهٔ این تراکنش نمونه است و پس از اتصال به بک‌اند از سرور خوانده می‌شود.'}
          </p>

          <FlowFooter primaryLabel="بستن" onPrimary={onClose} />
        </div>
      ) : null}
    </Sheet>
  )
}
