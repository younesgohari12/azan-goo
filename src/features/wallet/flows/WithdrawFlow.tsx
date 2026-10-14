import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Amount } from '../../../components/Amount'
import { AmountField } from '../../../components/AmountField'
import { Sheet } from '../../../components/Sheet'
import { StepTransition } from '../../../components/StepTransition'
import { SummaryList, type SummaryItem } from '../../../components/SummaryList'
import { formatAmount, parseAmount, toPersianDigits } from '../../../lib/format'
import { panelTransition } from '../../../motion/variants'
import type { Transaction, WithdrawDestination } from '../../../data/types'
import { DestinationPicker, FlowFooter, FlowProgress, FlowResult } from './flowParts'
import { useWallet } from '../WalletProvider'
import './flows.css'

interface WithdrawFlowProps {
  open: boolean
  onClose: () => void
  onViewTransactions: () => void
}

const TOTAL_STEPS = 2
const RESULT_STEP = 2
const STEP_LABELS = ['مقصد و مبلغ', 'تأیید']

export function WithdrawFlow({ open, onClose, onViewTransactions }: WithdrawFlowProps) {
  const { balance, destinations, config, submitOperation } = useWallet()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [destination, setDestination] = useState<WithdrawDestination | null>(destinations[0] ?? null)
  const [amountInput, setAmountInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Transaction | null>(null)

  const amount = parseAmount(amountInput)
  const fee = config.fees.withdraw
  const netAmount = Math.max(amount - fee, 0)
  const minAmount = config.limits.withdraw

  useEffect(() => {
    if (!open) return
    setStep(0)
    setDirection(1)
    setDestination(destinations[0] ?? null)
    setAmountInput('')
    setError(null)
    setResult(null)
  }, [open, destinations])

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
    if (amount > balance) {
      setError('مبلغ برداشت از موجودی قابل استفاده بیشتر است.')
      return
    }
    setError(null)
    goTo(1, 1)
  }

  const handleConfirm = () => {
    if (!destination) return
    setResult(submitOperation({ type: 'withdraw', amount, destination }))
    goTo(RESULT_STEP, 1)
  }

  const liveItems: SummaryItem[] = [
    { label: 'مبلغ برداشت', value: <Amount value={amount} size="md" unit /> },
    { label: 'کارمزد', hint: '(نمونه)', value: <Amount value={fee} size="md" unit /> },
    { label: 'مبلغ دریافتی', value: <Amount value={netAmount} size="md" unit />, emphasis: true },
  ]

  const confirmItems: SummaryItem[] = destination
    ? [
        { label: 'مقصد', value: destination.label },
        { label: 'کارت', value: `${destination.bank} •••• ${toPersianDigits(destination.last4)}` },
        ...liveItems,
      ]
    : []

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="برداشت از کیف پول"
      subtitle={step === RESULT_STEP ? 'نتیجه' : `گام ${toPersianDigits(step + 1)} از ${toPersianDigits(TOTAL_STEPS)}`}
      onBack={step === 1 ? () => goTo(0, -1) : undefined}
      variant="auto"
    >
      {step < RESULT_STEP ? <FlowProgress step={step} total={TOTAL_STEPS} labels={STEP_LABELS} /> : null}

      <StepTransition stepKey={step} direction={direction}>
        {step === 0 ? (
          <div className="flow-step">
            <DestinationPicker
              destinations={destinations}
              selectedId={destination?.id ?? null}
              onSelect={setDestination}
            />

            <AmountField
              label="مبلغ برداشت"
              value={amountInput}
              onValueChange={handleAmountChange}
              error={error}
              helper={`موجودی قابل استفاده: ${formatAmount(balance)} تومان`}
              maxDigits={config.maxAmountDigits}
            />

            <AnimatePresence initial={false}>
              {amount > 0 ? (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={panelTransition}
                >
                  <SummaryList items={liveItems} caption="کارمزد و حد پایین از تنظیمات نمونه خوانده می‌شوند." />
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
              caption="مقادیر کارمزد و مبلغ دریافتی نمونه‌اند و پس از اتصال به بک‌اند جایگزین می‌شوند."
            />
            <FlowFooter primaryLabel="تأیید برداشت" onPrimary={handleConfirm} />
          </div>
        ) : null}

        {step === RESULT_STEP && result ? (
          <FlowResult
            status={result.status}
            title="درخواست برداشت ثبت شد"
            description="این درخواست در همین نسخهٔ نمایشی با وضعیت «در انتظار» ثبت می‌شود."
            items={[
              { label: 'مقصد', value: destination?.label ?? '—' },
              { label: 'مبلغ دریافتی', value: <Amount value={netAmount} size="md" unit /> },
              { label: 'موجودی جدید', value: <Amount value={balance} size="md" unit /> },
              { label: 'کد پیگیری', value: result.reference },
            ]}
            caption="کارمزد و زمان تسویه در این نسخه نمونه‌اند و قانون واقعی سرویس نیستند."
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
