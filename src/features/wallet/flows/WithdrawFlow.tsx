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
import type { Transaction, WithdrawDestination } from '../../../data/types'
import { DestinationPicker, FlowFooter, FlowProcessing, FlowProgress, FlowResult } from './flowParts'
import { useWallet } from '../WalletProvider'
import './flows.css'

interface WithdrawFlowProps {
  open: boolean
  onClose: () => void
  onViewTransactions: () => void
}

type Phase = 'form' | 'processing' | 'result'

const TOTAL_STEPS = 2
const STEP_LABELS = ['مقصد و مبلغ', 'تأیید']

export function WithdrawFlow({ open, onClose, onViewTransactions }: WithdrawFlowProps) {
  const { balance, destinations, config, submitOperation } = useWallet()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [phase, setPhase] = useState<Phase>('form')
  const [destination, setDestination] = useState<WithdrawDestination | null>(null)
  const [amountInput, setAmountInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Transaction | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)

  const timerRef = useRef<number | null>(null)
  // محافظ ثبت دوباره: تا پایان پردازش، تأیید دوم نادیده گرفته می‌شود
  const busyRef = useRef(false)

  const amount = parseAmount(amountInput)
  const fee = config.fees.withdraw
  const netAmount = Math.max(amount - fee, 0)
  const minAmount = config.limits.withdraw

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
    setDestination(destinations[0] ?? null)
    setAmountInput('')
    setError(null)
    setResult(null)
    setDiscardOpen(false)
  }, [open, destinations])

  useEffect(() => () => clearTimer(), [])

  const goTo = (nextStep: number, nextDirection: 1 | -1) => {
    setDirection(nextDirection)
    setStep(nextStep)
  }

  const handleAmountChange = (value: string) => {
    setAmountInput(value)
    setError(null)
  }

  const handleContinue = () => {
    if (!destination) {
      setError('مقصد برداشت را انتخاب کنید.')
      return
    }
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

  const requestClose = () => {
    if (phase === 'processing') {
      clearTimer()
      busyRef.current = false
      onClose()
      return
    }
    if (phase === 'form' && amountInput !== '') {
      setDiscardOpen(true)
      return
    }
    onClose()
  }

  const handleConfirm = () => {
    if (!destination || busyRef.current) return
    busyRef.current = true
    setPhase('processing')
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setResult(submitOperation({ type: 'withdraw', amount, destination }))
      setPhase('result')
      busyRef.current = false
    }, config.processingMs.withdraw)
  }

  /** نتیجهٔ ناموفق: بازگشت به گام تأیید با همان اطلاعات */
  const handleRetry = () => {
    setResult(null)
    goTo(1, -1)
    setPhase('form')
  }

  const liveItems: SummaryItem[] = [
    { label: 'مبلغ برداشت', value: <Amount value={amount} size="md" unit /> },
    { label: 'کارمزد', hint: '(نمونه)', value: <Amount value={fee} size="md" unit /> },
    { label: 'مبلغ دریافتی', value: <Amount value={netAmount} size="md" unit />, emphasis: true },
  ]

  const confirmItems: SummaryItem[] = destination
    ? [
        { label: 'مقصد', value: destination.label },
        {
          label: 'کارت',
          value: (
            <span dir="ltr" className="u-tnum">
              •••• {toPersianDigits(destination.last4)}
            </span>
          ),
        },
        ...liveItems,
      ]
    : []

  // ردیف‌های رسید از روی state ساخته می‌شوند تا در حالت پردازش و نتیجه یکی باشند
  const receiptItems: SummaryItem[] = [
    { label: 'مقصد', value: destination ? destination.label : '—' },
    { label: 'مبلغ برداشت', value: <Amount value={amount} size="md" unit /> },
    { label: 'کارمزد', hint: '(نمونه)', value: <Amount value={fee} size="md" unit /> },
    { label: 'موجودی جدید', value: <Amount value={balance} size="md" unit /> },
    { label: 'کد پیگیری', value: result ? result.reference : '—' },
  ]

  const failed = result?.status === 'failed'

  return (
    <>
      <Sheet
        open={open}
        onClose={requestClose}
        title="برداشت از کیف پول"
        subtitle={phase === 'result' ? 'نتیجه' : `گام ${toPersianDigits(step + 1)} از ${toPersianDigits(TOTAL_STEPS)}`}
        onBack={phase === 'form' && step === 1 ? () => goTo(0, -1) : undefined}
        variant="auto"
      >
        {phase === 'form' ? <FlowProgress step={step} total={TOTAL_STEPS} labels={STEP_LABELS} /> : null}

        <StepTransition stepKey={`${step}-${phase}`} direction={direction}>
          {phase === 'form' && step === 0 ? (
            <div className="flow-step">
              <DestinationPicker
                destinations={destinations}
                selectedId={destination?.id ?? null}
                onSelect={setDestination}
                settlement={config.settlement.withdraw}
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

          {phase === 'form' && step === 1 ? (
            <div className="flow-step">
              <SummaryList
                items={confirmItems}
                caption="مقادیر کارمزد و مبلغ دریافتی نمونه‌اند و پس از اتصال به بک‌اند جایگزین می‌شوند."
              />
              <FlowFooter primaryLabel="تأیید برداشت" onPrimary={handleConfirm} />
            </div>
          ) : null}

          {phase === 'processing' ? (
            <div className="flow-step">
              <FlowProcessing
                title="در حال ثبت درخواست…"
                description="این برداشت نمایشی است و چند لحظه بیشتر طول نمی‌کشد."
                items={receiptItems}
              />
              <FlowFooter primaryLabel="تأیید برداشت" onPrimary={handleConfirm} busy busyLabel="در حال ثبت درخواست…" />
            </div>
          ) : null}

          {phase === 'result' && result ? (
            <div className="flow-step">
              <FlowResult
                status={result.status}
                icon="withdraw"
                title={
                  result.status === 'success'
                    ? 'برداشت انجام شد'
                    : result.status === 'pending'
                      ? 'درخواست برداشت در انتظار تسویه است'
                      : 'درخواست برداشت ثبت نشد'
                }
                description={
                  result.status === 'success'
                    ? 'مبلغ به کارت مقصد واریز شد.'
                    : result.status === 'pending'
                      ? 'مبلغ برداشت تا تسویهٔ بانکی در کیف پول رزرو شده است.'
                      : 'این درخواست کامل نشد؛ می‌توانید دوباره تلاش کنید.'
                }
                items={receiptItems}
                caption="این نتیجه در همین نسخهٔ نمایشی و بدون اتصال به شبکهٔ بانکی ساخته شده است."
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
        title="بستن فرم برداشت؟"
        description="مبلغ واردشده پاک می‌شود و درخواستی ثبت نخواهد شد."
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
