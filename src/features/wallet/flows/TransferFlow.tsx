import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Amount } from '../../../components/Amount'
import { AmountField } from '../../../components/AmountField'
import { Sheet } from '../../../components/Sheet'
import { StepTransition } from '../../../components/StepTransition'
import { SummaryList, type SummaryItem } from '../../../components/SummaryList'
import { formatAmount, parseAmount, toPersianDigits } from '../../../lib/format'
import { panelTransition } from '../../../motion/variants'
import type { Recipient, Transaction } from '../../../data/types'
import { AmountChips, FlowFooter, FlowProgress, FlowResult, NoteField, RecipientPicker } from './flowParts'
import { useWallet } from '../WalletProvider'
import './flows.css'

interface TransferFlowProps {
  open: boolean
  onClose: () => void
  onViewTransactions: () => void
}

const TOTAL_STEPS = 3
const RESULT_STEP = 3
const STEP_LABELS = ['گیرنده', 'مبلغ', 'تأیید']
const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000]

export function TransferFlow({ open, onClose, onViewTransactions }: TransferFlowProps) {
  const { balance, recipients, config, submitOperation } = useWallet()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [amountInput, setAmountInput] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Transaction | null>(null)

  const amount = parseAmount(amountInput)
  const fee = config.fees.transfer
  const total = amount + fee
  const minAmount = config.limits.transfer

  useEffect(() => {
    if (!open) return
    setStep(0)
    setDirection(1)
    setRecipient(null)
    setAmountInput('')
    setNote('')
    setError(null)
    setResult(null)
  }, [open])

  const goTo = (nextStep: number, nextDirection: 1 | -1) => {
    setDirection(nextDirection)
    setStep(nextStep)
  }

  const handleAmountChange = (value: string) => {
    setAmountInput(value)
    setError(null)
  }

  const handleContinueToAmount = () => {
    if (!recipient) return
    goTo(1, 1)
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

  const handleConfirm = () => {
    if (!recipient) return
    setResult(submitOperation({ type: 'transfer', amount, recipient, note }))
    goTo(RESULT_STEP, 1)
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

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="انتقال اعتبار"
      subtitle={step === RESULT_STEP ? 'نتیجه' : `گام ${toPersianDigits(step + 1)} از ${toPersianDigits(TOTAL_STEPS)}`}
      onBack={step > 0 && step < RESULT_STEP ? () => goTo(step - 1, -1) : undefined}
      variant="full"
    >
      {step < RESULT_STEP ? <FlowProgress step={step} total={TOTAL_STEPS} labels={STEP_LABELS} /> : null}

      <StepTransition stepKey={step} direction={direction}>
        {step === 0 ? (
          <div className="flow-step">
            <RecipientPicker
              recipients={recipients}
              selectedId={recipient?.id ?? null}
              onSelect={setRecipient}
            />
            <FlowFooter
              primaryLabel="ادامه"
              onPrimary={handleContinueToAmount}
              primaryDisabled={!recipient}
              hint={recipient ? `گیرنده: ${recipient.name}` : 'گیرنده را از فهرست انتخاب کنید.'}
            />
          </div>
        ) : null}

        {step === 1 ? (
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
              amounts={QUICK_AMOUNTS}
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

        {step === 2 ? (
          <div className="flow-step">
            <SummaryList
              items={confirmItems}
              caption="این انتقال نمایشی است و به بک‌اند یا شبکهٔ پرداخت وصل نمی‌شود."
            />
            <FlowFooter primaryLabel="تأیید و انتقال" onPrimary={handleConfirm} />
          </div>
        ) : null}

        {step === RESULT_STEP && result ? (
          <FlowResult
            status={result.status}
            title="انتقال انجام شد"
            description={recipient ? `مبلغ برای ${recipient.name} ثبت شد.` : undefined}
            items={[
              {
                label: 'گیرنده',
                value: recipient ? <span dir="ltr">@{recipient.handle}</span> : '—',
              },
              { label: 'مبلغ', value: <Amount value={amount} size="md" unit /> },
              { label: 'موجودی جدید', value: <Amount value={balance} size="md" unit /> },
              { label: 'کد پیگیری', value: result.reference },
            ]}
            caption="این نتیجه در همین نسخهٔ نمایشی و بدون بک‌اند ساخته شده است."
            primaryLabel="بستن"
            onPrimary={onClose}
            secondaryLabel="همهٔ تراکنش‌ها"
            onSecondary={onViewTransactions}
          />
        ) : null}
      </StepTransition>
    </Sheet>
  )
}
