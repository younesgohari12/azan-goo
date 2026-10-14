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
import type { Transaction } from '../../../data/types'
import { AmountChips, FlowFooter, FlowProcessing, FlowProgress, FlowResult } from './flowParts'
import { useWallet } from '../WalletProvider'
import './flows.css'

interface TopUpFlowProps {
  open: boolean
  onClose: () => void
  onViewTransactions: () => void
}

type Phase = 'form' | 'processing' | 'result'

const TOTAL_STEPS = 2
const STEP_LABELS = ['مبلغ', 'تأیید']

export function TopUpFlow({ open, onClose, onViewTransactions }: TopUpFlowProps) {
  const { balance, config, submitOperation } = useWallet()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [phase, setPhase] = useState<Phase>('form')
  const [amountInput, setAmountInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Transaction | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)

  const timerRef = useRef<number | null>(null)
  // محافظ ثبت دوباره: تا پایان پردازش، تأیید دوم نادیده گرفته می‌شود
  const busyRef = useRef(false)

  const amount = parseAmount(amountInput)
  const fee = config.fees.topup
  const payable = amount + fee
  const minAmount = config.limits.topup

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
    setAmountInput('')
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

  /** بستن: وسط پردازش لغو می‌شود، نیمه‌کاره بودن فرم تأیید می‌خواهد */
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
    if (busyRef.current) return
    busyRef.current = true
    setPhase('processing')
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setResult(submitOperation({ type: 'topup', amount }))
      setPhase('result')
      busyRef.current = false
    }, config.processingMs.topup)
  }

  /** نتیجهٔ ناموفق: بازگشت به گام تأیید با همان اطلاعات */
  const handleRetry = () => {
    setResult(null)
    goTo(1, -1)
    setPhase('form')
  }

  const confirmItems: SummaryItem[] = [
    { label: 'مبلغ افزایش اعتبار', value: <Amount value={amount} size="md" unit /> },
    { label: 'کارمزد', hint: '(نمونه)', value: <Amount value={fee} size="md" unit /> },
    { label: 'مبلغ قابل پرداخت', value: <Amount value={payable} size="md" unit />, emphasis: true },
    { label: 'روش پرداخت', value: 'درگاه بانکی (نمونه)' },
  ]

  // ردیف‌های رسید از روی state ساخته می‌شوند تا در حالت پردازش و نتیجه یکی باشند
  const receiptItems: SummaryItem[] = [
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
        title="افزایش اعتبار"
        subtitle={phase === 'result' ? 'نتیجه' : `گام ${toPersianDigits(step + 1)} از ${toPersianDigits(TOTAL_STEPS)}`}
        onBack={phase === 'form' && step === 1 ? () => goTo(0, -1) : undefined}
        variant="auto"
      >
        {phase === 'form' ? <FlowProgress step={step} total={TOTAL_STEPS} labels={STEP_LABELS} /> : null}

        <StepTransition stepKey={`${step}-${phase}`} direction={direction}>
          {phase === 'form' && step === 0 ? (
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

          {phase === 'form' && step === 1 ? (
            <div className="flow-step">
              <SummaryList
                items={confirmItems}
                caption="این یک عملیات نمایشی است و به درگاه بانکی واقعی وصل نمی‌شود."
              />
              <FlowFooter primaryLabel="تأیید و پرداخت" onPrimary={handleConfirm} />
            </div>
          ) : null}

          {phase === 'processing' ? (
            <div className="flow-step">
              <FlowProcessing
                title="در حال پردازش…"
                description="این عملیات نمایشی است و چند لحظه بیشتر طول نمی‌کشد."
                items={receiptItems}
              />
              <FlowFooter primaryLabel="تأیید و پرداخت" onPrimary={handleConfirm} busy busyLabel="در حال پردازش…" />
            </div>
          ) : null}

          {phase === 'result' && result ? (
            <div className="flow-step">
              <FlowResult
                status={result.status}
                icon="plus"
                title={
                  result.status === 'success'
                    ? 'افزایش اعتبار انجام شد'
                    : result.status === 'pending'
                      ? 'افزایش اعتبار در انتظار تأیید است'
                      : 'افزایش اعتبار انجام نشد'
                }
                description={
                  result.status === 'success'
                    ? 'مبلغ به موجودی قابل استفادهٔ کیف پول اضافه شد.'
                    : result.status === 'pending'
                      ? 'مبلغ پس از تأیید نهایی به موجودی اضافه می‌شود.'
                      : 'پرداخت کامل نشد؛ می‌توانید دوباره تلاش کنید.'
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
        title="بستن فرم افزایش اعتبار؟"
        description="مبلغ واردشده پاک می‌شود و عملیاتی ثبت نخواهد شد."
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
