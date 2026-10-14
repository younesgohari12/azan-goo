import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Amount } from '../../../components/Amount'
import { AmountField } from '../../../components/AmountField'
import { Sheet } from '../../../components/Sheet'
import { StepTransition } from '../../../components/StepTransition'
import { SummaryList, type SummaryItem } from '../../../components/SummaryList'
import { formatAmount, parseAmount, toPersianDigits } from '../../../lib/format'
import { panelTransition } from '../../../motion/variants'
import type { Transaction } from '../../../data/types'
import { AmountChips, FlowFooter, FlowProgress, FlowResult } from './flowParts'
import { useWallet } from '../WalletProvider'
import './flows.css'

interface TopUpFlowProps {
  open: boolean
  onClose: () => void
  onViewTransactions: () => void
}

const TOTAL_STEPS = 2
const RESULT_STEP = 2
const STEP_LABELS = ['مبلغ', 'تأیید']

export function TopUpFlow({ open, onClose, onViewTransactions }: TopUpFlowProps) {
  const { balance, config, submitOperation } = useWallet()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [amountInput, setAmountInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Transaction | null>(null)

  const amount = parseAmount(amountInput)
  const fee = config.fees.topup
  const payable = amount + fee
  const minAmount = config.limits.topup

  useEffect(() => {
    if (!open) return
    setStep(0)
    setDirection(1)
    setAmountInput('')
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

  const handleContinue = () => {
    if (!amount) {
      setError('مبلغ را وارد کنید.')
      return
    }
    if (amount < minAmount) {
      setError(`کمترین مبلغ در این نمونه ${formatAmount(minAmount)} تومان است.`)
      return
    }
    setError(null)
    goTo(1, 1)
  }

  const handleConfirm = () => {
    setResult(submitOperation({ type: 'topup', amount }))
    goTo(RESULT_STEP, 1)
  }

  const confirmItems: SummaryItem[] = [
    { label: 'مبلغ افزایش اعتبار', value: <Amount value={amount} size="md" unit /> },
    { label: 'کارمزد', hint: '(نمونه)', value: <Amount value={fee} size="md" unit /> },
    { label: 'مبلغ قابل پرداخت', value: <Amount value={payable} size="md" unit />, emphasis: true },
    { label: 'روش پرداخت', value: 'درگاه بانکی (نمونه)' },
  ]

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="افزایش اعتبار"
      subtitle={step === RESULT_STEP ? 'نتیجه' : `گام ${toPersianDigits(step + 1)} از ${toPersianDigits(TOTAL_STEPS)}`}
      onBack={step === 1 ? () => goTo(0, -1) : undefined}
      variant="auto"
    >
      {step < RESULT_STEP ? <FlowProgress step={step} total={TOTAL_STEPS} labels={STEP_LABELS} /> : null}

      <StepTransition stepKey={step} direction={direction}>
        {step === 0 ? (
          <div className="flow-step">
            <AmountField
              label="مبلغ افزایش اعتبار"
              value={amountInput}
              onValueChange={handleAmountChange}
              error={error}
              helper={`کمترین مبلغ در این نمونه ${formatAmount(minAmount)} تومان است.`}
              maxDigits={config.maxAmountDigits}
            />

            <AmountChips
              amounts={config.suggestedTopUps}
              selected={amount}
              onSelect={(value) => handleAmountChange(String(value))}
            />

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
                  <span className="flow-amount-summary__label">مبلغ قابل پرداخت</span>
                  <Amount value={payable} size="md" unit />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <FlowFooter primaryLabel="ادامه" onPrimary={handleContinue} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flow-step">
            <SummaryList
              items={confirmItems}
              caption="این یک عملیات نمایشی است و به درگاه بانکی واقعی وصل نمی‌شود."
            />
            <FlowFooter primaryLabel="تأیید و پرداخت" onPrimary={handleConfirm} />
          </div>
        ) : null}

        {step === RESULT_STEP && result ? (
          <FlowResult
            status={result.status}
            title="افزایش اعتبار انجام شد"
            description="مبلغ به موجودی قابل استفادهٔ کیف پول اضافه شد."
            items={[
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
