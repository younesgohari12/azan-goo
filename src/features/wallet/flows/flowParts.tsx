import { useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../../../components/Button'
import { Icon, type IconName } from '../../../components/Icon'
import { Skeleton } from '../../../components/Skeleton'
import { SummaryList, type SummaryItem } from '../../../components/SummaryList'
import { DUR, EASE_BASE } from '../../../motion/tokens'
import {
  feedbackTransition,
  groupRise,
  panelTransition,
  resultContainer,
  resultIcon,
} from '../../../motion/variants'
import { formatAmount, formatCardTail, formatPhone, toLatinDigits, toPersianDigits } from '../../../lib/format'
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
  /** وضعیت در حال انجام روی همان اقدام نمایش داده می‌شود */
  busy?: boolean
  busyLabel?: string
  hint?: string
  secondaryLabel?: string
  onSecondary?: () => void
}

export function FlowFooter({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  busy = false,
  busyLabel = 'در حال پردازش…',
  hint,
  secondaryLabel,
  onSecondary,
}: FlowFooterProps) {
  return (
    <div className="flow-footer">
      {hint ? <p className="flow-footer__hint">{hint}</p> : null}
      <Button variant="primary" fullWidth onClick={onPrimary} disabled={primaryDisabled || busy} data-busy={busy ? 'true' : 'false'}>
        {busy ? (
          <span className="flow-footer__busy">
            <span className="flow-footer__spinner" aria-hidden="true" />
            {busyLabel}
          </span>
        ) : (
          primaryLabel
        )}
      </Button>
      {secondaryLabel && onSecondary ? (
        <Button variant="ghost" fullWidth onClick={onSecondary} disabled={busy}>
          {secondaryLabel}
        </Button>
      ) : null}
    </div>
  )
}

/* ---------------------------------- نتیجه --------------------------------- */

/** رسم کوتاه تیک برای نتیجهٔ موفق — بدون افکت جشن */
function DrawnCheck() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <motion.path
        d="M5.2 12.6 9.8 17.2 18.8 7.4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: DUR.panel + 0.15, ease: EASE_BASE }}
      />
    </svg>
  )
}

interface FlowResultProps {
  status: TransactionStatus
  /** آیکون متناسب همان عملیات (در نتیجهٔ ناموفق نادیده گرفته می‌شود) */
  icon?: IconName
  title: string
  description?: string
  items?: SummaryItem[]
  caption?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

/**
 * ساختار مشترک نتیجهٔ همهٔ عملیات‌ها: وضعیت بالای رسید می‌آید و اطلاعات یک‌بار
 * و به‌صورت گروهی وارد می‌شوند. نتیجهٔ ناموفق آرام است و هیچ لرزشی ندارد.
 */
export function FlowResult({
  status,
  icon = 'check',
  title,
  description,
  items,
  caption,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: FlowResultProps) {
  const statusIcon: IconName = status === 'failed' ? 'alert' : status === 'pending' ? icon : 'check'

  return (
    <div className="flow-result">
      <motion.div
        className="flow-result__head"
        variants={resultContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flow-result__header" variants={resultIcon}>
          <span className="flow-result__icon" data-status={status}>
            {status === 'success' ? <DrawnCheck /> : <Icon name={statusIcon} size={22} strokeWidth={1.9} />}
          </span>
          <div className="flow-result__text">
            <h3 className="flow-result__title">{title}</h3>
            {description ? <p className="flow-result__description">{description}</p> : null}
          </div>
        </motion.div>

        {items && items.length > 0 ? (
          <motion.div className="flow-result__receipt" variants={groupRise}>
            <SummaryList items={items} caption={caption} />
          </motion.div>
        ) : null}
      </motion.div>

      <FlowFooter
        primaryLabel={primaryLabel}
        onPrimary={onPrimary}
        secondaryLabel={secondaryLabel}
        onSecondary={onSecondary}
        hint={status === 'failed' ? 'این نتیجه نمونه است؛ چیزی از موجودی کم نشد.' : undefined}
      />
    </div>
  )
}

/**
 * وضعیت کوتاه «در حال پردازش» با همان ابعاد رسید نهایی: به‌جای هر مقدار یک
 * جای‌گیرندهٔ هم‌اندازه می‌آید تا تبدیل شدن به نتیجه اندازه را نپرانَد.
 */
export function FlowProcessing({ title, description, items }: { title: string; description: string; items: SummaryItem[] }) {
  return (
    <div className="flow-result">
      <div className="flow-result__header">
        <span className="flow-result__icon" data-status="pending">
          <Icon name="clock" size={22} strokeWidth={1.9} />
        </span>
        <div className="flow-result__text">
          <h3 className="flow-result__title">{title}</h3>
          <p className="flow-result__description">{description}</p>
        </div>
      </div>

      <SummaryList
        items={items.map((item) => ({
          label: item.label,
          hint: item.hint,
          value: <Skeleton width="72%" height="0.875rem" />,
        }))}
      />
    </div>
  )
}

/* ------------------------------ انتخاب گیرنده ----------------------------- */

interface RecipientPickerProps {
  recipients: Recipient[]
  selected: Recipient | null
  onSelect: (recipient: Recipient) => void
  onChange?: () => void
  query: string
  onQueryChange: (query: string) => void
}

export function RecipientPicker({
  recipients,
  selected,
  onSelect,
  onChange,
  query,
  onQueryChange,
}: RecipientPickerProps) {
  // فهرست پس از انتخاب جمع می‌شود و به خلاصهٔ گیرنده تبدیل می‌شود
  const [listPhase, setListPhase] = useState<'open' | 'closing' | 'closed'>('open')

  useEffect(() => {
    if (selected) setListPhase('closing')
  }, [selected])

  useEffect(() => {
    if (!selected) setListPhase('open')
  }, [selected])

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
      <motion.div
        className="picker__browser"
        initial={false}
        animate={{ height: listPhase === 'open' ? 'auto' : 0, opacity: listPhase === 'open' ? 1 : 0 }}
        transition={panelTransition}
        onAnimationComplete={() => {
          if (listPhase === 'closing') setListPhase('closed')
        }}
      >
        {listPhase !== 'closed' ? (
          <>
            <div className="picker__search">
              <Icon name="search" size={17} />
              <input
                className="picker__input"
                type="text"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="جست‌وجوی نام، شناسه یا شماره"
                aria-label="جست‌وجوی گیرنده"
              />
            </div>

            <div className="picker__results" key={query}>
              <AnimatePresence initial={false}>
                {filtered.length === 0 ? (
                  <motion.p
                    key="empty"
                    className="picker__empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={feedbackTransition}
                  >
                    گیرنده‌ای با این مشخصات پیدا نشد.
                  </motion.p>
                ) : (
                  <motion.ul
                    key="list"
                    className="picker__list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={feedbackTransition}
                  >
                    {filtered.map((recipient) => {
                      const isSelected = recipient.id === selected?.id
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
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : null}
      </motion.div>

      <AnimatePresence initial={false}>
        {selected ? (
          <motion.div
            key="selected"
            className="picker__selected"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={panelTransition}
          >
            <span className="picker__selected-avatar" aria-hidden="true">
              {selected.name.slice(0, 1)}
            </span>
            <span className="picker__text">
              <span className="picker__name">{selected.name}</span>
              <span className="picker__meta" dir="ltr">
                @{selected.handle}
              </span>
            </span>
            <span className="picker__selected-check" aria-hidden="true">
              <Icon name="check" size={15} strokeWidth={2.1} />
            </span>
            {onChange ? (
              <Button variant="ghost" size="sm" onClick={onChange}>
                تغییر گیرنده
              </Button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------ انتخاب مقصد ------------------------------- */

interface DestinationPickerProps {
  destinations: WithdrawDestination[]
  selectedId: string | null
  onSelect: (destination: WithdrawDestination) => void
  /** متن نمونهٔ زمان تسویه (از تنظیمات نمایشی) */
  settlement: string
}

export function DestinationPicker({ destinations, selectedId, onSelect, settlement }: DestinationPickerProps) {
  return (
    <ul className="picker__list">
      {destinations.map((destination) => {
        const isSelected = destination.id === selectedId
        return (
          <li key={destination.id}>
            <div className="destination" data-selected={isSelected ? 'true' : 'false'}>
              <button
                type="button"
                className="picker__option destination__head"
                data-selected={isSelected ? 'true' : 'false'}
                aria-expanded={isSelected}
                aria-pressed={isSelected}
                onClick={() => onSelect(destination)}
              >
                <span className="picker__avatar" aria-hidden="true">
                  <Icon name="card" size={17} />
                </span>
                <span className="picker__text">
                  <span className="picker__name">{destination.label}</span>
                  <span className="picker__meta">{destination.bank}</span>
                </span>
                <span className="picker__check" aria-hidden="true">
                  <Icon name="check" size={15} strokeWidth={2} />
                </span>
              </button>

              {/* جزئیات مقصد به‌صورت accordion کوتاه و فقط برای مقصد انتخاب‌شده */}
              <AnimatePresence initial={false}>
                {isSelected ? (
                  <motion.div
                    className="destination__details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={panelTransition}
                    style={{ overflow: 'hidden' }}
                  >
                    <dl className="destination__list">
                      <div className="destination__row">
                        <dt>شمارهٔ کارت</dt>
                        {/* ارقام پوشیده در قطعهٔ چپ‌به‌راست می‌مانند تا ترتیبشان درست بماند */}
                        <dd className="destination__card u-tnum" dir="ltr">
                          {formatCardTail(destination.last4)}
                        </dd>
                      </div>
                      <div className="destination__row">
                        <dt>زمان تسویه (نمونه)</dt>
                        <dd>{settlement}</dd>
                      </div>
                    </dl>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

