import { useId, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { feedbackTransition } from '../motion/variants'
import { formatAmountInput, sanitizeAmountInput } from '../lib/format'
import { cx } from '../lib/cx'
import { Icon } from './Icon'
import './AmountField.css'

interface AmountFieldProps {
  label: string
  /** رشتهٔ رقم لاتین */
  value: string
  onValueChange: (value: string) => void
  error?: string | null
  helper?: string
  placeholder?: string
  maxDigits?: number
}

/**
 * کادر مبلغ: ارقام فارسی با جداکنندهٔ هزارگان، عرض متناسب با محتوا (تا واحد
 * «تومان» کنار عدد بماند) و خطای نزدیک همان کادر.
 */
export function AmountField({
  label,
  value,
  onValueChange,
  error,
  helper,
  placeholder = '۰',
  maxDigits = 9,
}: AmountFieldProps) {
  const generatedId = useId()
  const inputId = `amount-${generatedId}`
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  const inputRef = useRef<HTMLInputElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null)

  const display = formatAmountInput(value)
  const isEmpty = display.length === 0

  useLayoutEffect(() => {
    const node = measureRef.current
    if (!node) return
    setMeasuredWidth(Math.ceil(node.getBoundingClientRect().width))
  }, [display])

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input || document.activeElement !== input) return
    const end = input.value.length
    input.setSelectionRange(end, end)
  }, [display])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(sanitizeAmountInput(event.target.value, maxDigits))
  }

  const describedBy = [error ? errorId : null, helper ? helperId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="amount-field">
      <label className="amount-field__label" htmlFor={inputId}>
        {label}
      </label>

      <div className={cx('amount-field__box')} data-invalid={error ? 'true' : 'false'} data-empty={isEmpty ? 'true' : 'false'}>
        <span className="amount-field__measure u-tnum" ref={measureRef} dir="ltr" aria-hidden="true">
          {display}
        </span>
        <input
          id={inputId}
          ref={inputRef}
          className="amount-field__input u-tnum"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          placeholder={placeholder}
          value={display}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          style={isEmpty ? undefined : { width: measuredWidth ? `${measuredWidth + 2}px` : undefined }}
        />
        <span className="amount-field__unit" aria-hidden="true">
          تومان
        </span>
      </div>

      <div className="amount-field__messages">
        <AnimatePresence initial={false} mode="wait">
          {error ? (
            <motion.p
              key="error"
              id={errorId}
              className="amount-field__error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={feedbackTransition}
            >
              <Icon name="alert" size={13} strokeWidth={1.8} />
              <span>{error}</span>
            </motion.p>
          ) : helper ? (
            <motion.p
              key="helper"
              id={helperId}
              className="amount-field__helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={feedbackTransition}
            >
              {helper}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
