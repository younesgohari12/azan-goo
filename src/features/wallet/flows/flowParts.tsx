import { useId, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../../components/Button'
import { Icon, type IconName } from '../../../components/Icon'
import { SummaryList, type SummaryItem } from '../../../components/SummaryList'
import { formatAmount, formatCardTail, formatPhone, toLatinDigits, toPersianDigits } from '../../../lib/format'
import { groupRise, resultIcon } from '../../../motion/variants'
import type { Recipient, TransactionStatus, WithdrawDestination } from '../../../data/types'

/* ---------------------------------- پیشرفت --------------------------------- */

export function FlowProgress({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div className="flow-progress">
      <span className="flow-progress__text">
        گام {toPersianDigits(step + 1)} از {toPersianDigits(total)} · {labels[step]}
      </span>
      <span className="flow-progress__bars" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className="flow-progress__bar" data-done={index <= step ? 'true' : 'false'} />
        ))}
      </span>
    </div>
  )
}

/* ------------------------------ مبالغ پیشنهادی ----------------------------- */

interface AmountChipsProps {
  amounts: readonly number[]
  selected: number
  onSelect: (amount: number) => void
}

export function AmountChips({ amounts, selected, onSelect }: AmountChipsProps) {
  return (
    <div className="amount-chips" role="group" aria-label="مبالغ پیشنهادی">
      {amounts.map((amount) => {
        const isSelected = selected === amount
        return (
          <button
            key={amount}
            type="button"
            className="amount-chip"
            data-selected={isSelected ? 'true' : 'false'}
            aria-pressed={isSelected}
            onClick={() => onSelect(amount)}
          >
            <span className="amount-chip__value u-tnum">{formatAmount(amount)}</span>
            <span className="amount-chip__check" aria-hidden="true">
              <Icon name="check" size={13} strokeWidth={2.2} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------ توضیح انتقال ------------------------------ */

interface NoteFieldProps {
  value: string
  onValueChange: (value: string) => void
  maxLength: number
  label?: string
}

export function NoteField({ value, onValueChange, maxLength, label = 'توضیح (اختیاری)' }: NoteFieldProps) {
  const id = useId()
  return (
    <div className="note-field">
      <div className="note-field__head">
        <label className="note-field__label" htmlFor={id}>
          {label}
        </label>
        <span className="note-field__counter u-tnum">
          {toPersianDigits(value.length)}/{toPersianDigits(maxLength)}
        </span>
      </div>
      <textarea
        id={id}
        className="note-field__input"
        value={value}
        rows={2}
        maxLength={maxLength}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="مثلاً سهم شام"
      />
    </div>
  )
}

/* --------------------------------- پابرگ‌ها -------------------------------- */

interface FlowFooterProps {
  primaryLabel: string
  onPrimary: () => void
  primaryDisabled?: boolean
  hint?: string
  secondaryLabel?: string
  onSecondary?: () => void
}

export function FlowFooter({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  hint,
  secondaryLabel,
  onSecondary,
}: FlowFooterProps) {
  return (
    <div className="flow-footer">
      {hint ? <p className="flow-footer__hint">{hint}</p> : null}
      <Button variant="primary" fullWidth onClick={onPrimary} disabled={primaryDisabled}>
        {primaryLabel}
      </Button>
      {secondaryLabel && onSecondary ? (
        <Button variant="ghost" fullWidth onClick={onSecondary}>
          {secondaryLabel}
        </Button>
      ) : null}
    </div>
  )
}

/* --------------------------------- نتیجه --------------------------------- */

const RESULT_ICON: Record<TransactionStatus, IconName> = {
  success: 'check',
  pending: 'clock',
  failed: 'alert',
}

interface FlowResultProps {
  status: TransactionStatus
  title: string
  description?: string
  items?: SummaryItem[]
  caption?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export function FlowResult({
  status,
  title,
  description,
  items,
  caption,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: FlowResultProps) {
  return (
    <motion.div className="flow-result" variants={groupRise} initial="hidden" animate="visible">
      <div className="flow-result__header">
        <motion.span className="flow-result__icon" data-status={status} variants={resultIcon}>
          <Icon name={RESULT_ICON[status]} size={22} strokeWidth={1.8} />
        </motion.span>
        <div className="flow-result__text">
          <h3 className="flow-result__title">{title}</h3>
          {description ? <p className="flow-result__description">{description}</p> : null}
        </div>
      </div>

      {items && items.length > 0 ? <SummaryList items={items} caption={caption} /> : null}

      <FlowFooter
        primaryLabel={primaryLabel}
        onPrimary={onPrimary}
        secondaryLabel={secondaryLabel}
        onSecondary={onSecondary}
      />
    </motion.div>
  )
}

/* ------------------------------ انتخاب گیرنده ----------------------------- */

interface RecipientPickerProps {
  recipients: Recipient[]
  selectedId: string | null
  onSelect: (recipient: Recipient) => void
}

export function RecipientPicker({ recipients, selectedId, onSelect }: RecipientPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return recipients
    const latinNeedle = toLatinDigits(needle).replace(/[\s-]/g, '')
    return recipients.filter((recipient) => {
      if (recipient.name.toLowerCase().includes(needle)) return true
      if (recipient.handle.toLowerCase().includes(needle)) return true
      if (latinNeedle.length >= 3 && toLatinDigits(recipient.phone).includes(latinNeedle)) return true
      return false
    })
  }, [recipients, query])

  return (
    <div className="picker">
      <div className="picker__search">
        <Icon name="search" size={17} />
        <input
          className="picker__input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجوی نام، شناسه یا شماره"
          aria-label="جست‌وجوی گیرنده"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="picker__empty">گیرنده‌ای با این مشخصات پیدا نشد.</p>
      ) : (
        <ul className="picker__list">
          {filtered.map((recipient) => {
            const isSelected = recipient.id === selectedId
            return (
              <li key={recipient.id}>
                <button
                  type="button"
                  className="picker__option"
                  data-selected={isSelected ? 'true' : 'false'}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(recipient)}
                >
                  <span className="picker__avatar" aria-hidden="true">
                    {recipient.name.slice(0, 1)}
                  </span>
                  <span className="picker__text">
                    <span className="picker__name">{recipient.name}</span>
                    {/* جداسازی جهت: شناسه و شماره در یک قطعهٔ چپ‌به‌راست می‌مانند */}
                    <span className="picker__meta" dir="ltr">
                      @{recipient.handle} · {formatPhone(recipient.phone)}
                    </span>
                  </span>
                  <span className="picker__check" aria-hidden="true">
                    <Icon name="check" size={15} strokeWidth={2} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------ انتخاب مقصد ------------------------------- */

interface DestinationPickerProps {
  destinations: WithdrawDestination[]
  selectedId: string | null
  onSelect: (destination: WithdrawDestination) => void
}

export function DestinationPicker({ destinations, selectedId, onSelect }: DestinationPickerProps) {
  return (
    <ul className="picker__list">
      {destinations.map((destination) => {
        const isSelected = destination.id === selectedId
        return (
          <li key={destination.id}>
            <button
              type="button"
              className="picker__option"
              data-selected={isSelected ? 'true' : 'false'}
              aria-pressed={isSelected}
              onClick={() => onSelect(destination)}
            >
              <span className="picker__avatar" aria-hidden="true">
                <Icon name="card" size={17} />
              </span>
              <span className="picker__text">
                <span className="picker__name">{destination.label}</span>
                <span className="picker__meta">
                  {destination.bank} · {formatCardTail(destination.last4)}
                </span>
              </span>
              <span className="picker__check" aria-hidden="true">
                <Icon name="check" size={15} strokeWidth={2} />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
