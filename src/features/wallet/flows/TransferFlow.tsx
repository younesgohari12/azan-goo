import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Amount } from '../../../components/Amount'
import { AmountField } from '../../../components/AmountField'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Sheet } from '../../../components/Sheet'
import { StepTransition } from '../../../components/StepTransition'
import { SummaryList, type SummaryItem } from '../../../components/SummaryList'
import { formatAmount, parseAmount, toPersianDigits } from '../../../lib/format'
import { panelTransition } from '../../../motion/variants'
import type { Recipient, Transaction } from '../../../data/types'
import { AmountChips, FlowFooter, FlowProcessing, FlowProgress, FlowResult, NoteField, RecipientPicker } from './flowParts'
import { useWallet } from '../WalletProvider'
import './flows.css'

interface TransferFlowProps {
  open: boolean
  onClose: () => void
  onViewTransactions: () => void
}

type Phase = 'form' | 'processing' | 'result'

const TOTAL_STEPS = 3
const STEP_LABELS = ['گیرنده', 'مبلغ', 'تأیید']

export function TransferFlow({ open, onClose, onViewTransactions }: TransferFlowProps) {
  const { balance, recipients, config, submitOperation } = useWallet()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [phase, setPhase] = useState<Phase>('form')
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [query, setQuery] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Transaction | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)

  const timerRef = useRef<number | null>(null)
  // محافظ ثبت دوباره: تا پایان پردازش، تأیید دوم نادیده گرفته می‌شود
  const busyRef = useRef(false)

  const amount = parseAmount(amountInput)
  const fee = config.fees.transfer
  const total = amount + fee
  const minAmount = config.limits.transfer

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (!open) return
    clearTimer()
    busyRef.current = false
    setStep(0)
    setDirection(1)
    setPhase('form')
    setRecipient(null)
    setQuery('')
    setAmountInput('')
    setNote('')
    setError(null)
    setResult(null)
    setDiscardOpen(false)
  }, [open])

  useEffect(() => () => clearTimer(), [])

  const goTo = (nextStep: number, nextDirection: 1 | -1) => {
    setDirection(nextDirection)
    setStep(nextStep)
  }

  const handleAmountChange = (value: string) => {
    setAmountInput(value)
    setError(null)
  }

  const handleReview = () => {
    if (!amount) {
      setError('مبلغ را وارد کنید.')
      return
    }
    if (amount < minAmount) {
      setError(`کمترین مبلغ در این نمونه ${formatAmount(minAmount)} تومان است.`)
      return
    }
    if (total > balance) {
      setError('مبلغ انتقال از موجودی قابل استفاده بیشتر است.')
      return
    }
    setError(null)
    goTo(2, 1)
  }

  const requestClose = () => {
    if (phase === 'processing') {
      clearTimer()
      busyRef.current = false
      onClose()
      return
    }
    if (phase === 'form' && (recipient || amountInput !== '' || note !== '')) {
      setDiscardOpen(true)
      return
    }
    onClose()
  }

  const handleConfirm = () => {
    if (!recipient || busyRef.current) return
    busyRef.current = true
    setPhase('processing')
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setResult(submitOperation({ type: 'transfer', amount, recipient, note }))
      setPhase('result')
      busyRef.current = false
    }, config.processingMs.transfer)
  }

  /** نتیجهٔ ناموفق: بازگشت به گام تأیید با همان اطلاعات */
  const handleRetry = () => {
    setResult(null)
    goTo(2, -1)
    setPhase('form')
  }

  const confirmItems: SummaryItem[] = recipient
    ? [
        { label: 'گیرنده', value: recipient.name },
        {
          label: 'شناسه',
          value: (
            <span dir="ltr">
              @{recipient.handle}
            </span>
          ),
        },
        { label: 'مبلغ انتقال', value: <Amount value={amount} size="md" unit /> },
        { label: 'کارمزد', hint: '(نمونه)', value: <Amount value={fee} size="md" unit /> },
        ...(note.trim() ? [{ label: 'توضیح', value: note.trim() }] : []),
        { label: 'جمع', value: <Amount value={total} size="md" unit />, emphasis: true },
      ]
    : []

  // ردیف‌های رسید از روی state ساخته می‌شوند تا در حالت پردازش و نتیجه یکی باشند
  const receiptItems: SummaryItem[] = [
    { label: 'گیرنده', value: recipient ? recipient.name : '—' },
    { label: 'مبلغ', value: <Amount value={amount} size="md" unit /> },
    { label: 'موجودی جدید', value: <Amount value={balance} size="md" unit /> },
    { label: 'کد پیگیری', value: result ? result.reference : '—' },
  ]

  const failed = result?.status === 'failed'

  return (
    <>
      <Sheet
        open={open}
        onClose={requestClose}
        title="انتقال اعتبار"
        subtitle={phase === 'result' ? 'نتیجه' : `گام ${toPersianDigits(step + 1)} از ${toPersianDigits(TOTAL_STEPS)}`}
        onBack={phase === 'form' && step > 0 ? () => goTo(step - 1, -1) : undefined}
        variant="full"
      >
        {phase === 'form' ? <FlowProgress step={step} total={TOTAL_STEPS} labels={STEP_LABELS} /> : null}

        <StepTransition stepKey={`${step}-${phase}`} direction={direction}>
          {phase === 'form' && step === 0 ? (
            <div className="flow-step">
              <RecipientPicker
                recipients={recipients}
                selected={recipient}
                onSelect={setRecipient}
                onChange={() => setRecipient(null)}
                query={query}
                onQueryChange={setQuery}
              />
              <FlowFooter
                primaryLabel="ادامه"
                onPrimary={() => recipient && goTo(1, 1)}
                primaryDisabled={!recipient}
                hint={recipient ? undefined : 'گیرنده را از فهرست انتخاب کنید.'}
              />
            </div>
          ) : null}

          {phase === 'form' && step === 1 ? (
            <div className="flow-step">
              <AmountField
                label="مبلغ انتقال"
                value={amountInput}
                onValueChange={handleAmountChange}
                error={error}
                helper={`موجودی قابل استفاده: ${formatAmount(balance)} تومان`}
                maxDigits={config.maxAmountDigits}
              />

              <AmountChips
                amounts={config.suggestedTransfers}
                selected={amount}
                onSelect={(value) => handleAmountChange(String(value))}
              />

              <NoteField value={note} onValueChange={setNote} maxLength={config.transferNoteMax} />

              <AnimatePresence initial={false}>
                {amount > 0 ? (
                  <motion.div
                    key="summary"
                    className="flow-amount-summary"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={panelTransition}
                  >
                    <span className="flow-amount-summary__label">جمع انتقال</span>
                    <Amount value={total} size="md" unit />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <FlowFooter primaryLabel="مرور و تأیید" onPrimary={handleReview} />
            </div>
          ) : null}

          {phase === 'form' && step === 2 ? (
            <div className="flow-step">
              <SummaryList
                items={confirmItems}
                caption="این انتقال نمایشی است و به بک‌اند یا شبکهٔ پرداخت وصل نمی‌شود."
              />
              <FlowFooter primaryLabel="تأیید و انتقال" onPrimary={handleConfirm} />
            </div>
          ) : null}

          {phase === 'processing' ? (
            <div className="flow-step">
              <FlowProcessing
                title="در حال پردازش…"
                description="این انتقال نمایشی است و چند لحظه بیشتر طول نمی‌کشد."
                items={receiptItems}
              />
              <FlowFooter primaryLabel="تأیید و انتقال" onPrimary={handleConfirm} busy busyLabel="در حال پردازش…" />
            </div>
          ) : null}

          {phase === 'result' && result ? (
            <div className="flow-step">
              <FlowResult
                status={result.status}
                icon="transfer"
                title={
                  result.status === 'success'
                    ? 'انتقال انجام شد'
                    : result.status === 'pending'
                      ? 'انتقال در انتظار تأیید است'
                      : 'انتقال انجام نشد'
                }
                description={
                  recipient
                    ? result.status === 'success'
                      ? `مبلغ برای ${recipient.name} ثبت شد.`
                      : result.status === 'pending'
                        ? `انتقال به ${recipient.name} پس از تأیید نهایی نهایی می‌شود.`
                        : `انتقال به ${recipient.name} کامل نشد؛ می‌توانید دوباره تلاش کنید.`
                    : undefined
                }
                items={receiptItems}
                caption="این نتیجه در همین نسخهٔ نمایشی و بدون بک‌اند ساخته شده است."
                primaryLabel={failed ? 'تلاش دوباره' : 'بستن'}
                onPrimary={failed ? handleRetry : onClose}
                secondaryLabel={failed ? 'بستن' : 'همهٔ تراکنش‌ها'}
                onSecondary={failed ? onClose : onViewTransactions}
              />
            </div>
          ) : null}
        </StepTransition>
      </Sheet>

      <ConfirmDialog
        open={discardOpen}
        title="بستن فرم انتقال؟"
        description="اطلاعات واردشده پاک می‌شود و انتقالی ثبت نخواهد شد."
        confirmLabel="بستن فرم"
        cancelLabel="ادامهٔ ویرایش"
        onConfirm={() => {
          setDiscardOpen(false)
          onClose()
        }}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  )
}
