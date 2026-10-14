import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { feedbackTransition } from '../motion/variants'
import { copyText } from '../lib/clipboard'
import { useToast } from './Toast'
import { Icon } from './Icon'
import { IconButton } from './Button'
import { cx } from '../lib/cx'
import './CopyField.css'

interface CopyFieldProps {
  label: string
  /** مقدار لاتین؛ در یک قطعهٔ چپ‌به‌راست جدا نمایش داده می‌شود */
  value: string
  successText: string
  failureText: string
  className?: string
}

/**
 * ردیف شناسه با دکمهٔ کپی: آیکون کپی کوتاه به تیک تبدیل می‌شود و یک پیام
 * مختصر هم نشان داده می‌شود. مقدار در جای خودش نمی‌پرد.
 */
export function CopyField({ label, value, successText, failureText, className }: CopyFieldProps) {
  const { show } = useToast()
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const handleCopy = async () => {
    const ok = await copyText(value)
    show(ok ? successText : failureText)
    if (!ok) return
    setCopied(true)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={cx('copy-field', className)}>
      <span className="copy-field__label">{label}</span>
      <span className="copy-field__value u-tnum" dir="ltr">
        {value}
      </span>
      <IconButton
        size="sm"
        label={copied ? 'کپی شد' : 'کپی شناسه'}
        data-copied={copied ? 'true' : 'false'}
        onClick={handleCopy}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={copied ? 'check' : 'copy'}
            className="copy-field__icon"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={feedbackTransition}
          >
            <Icon name={copied ? 'check' : 'copy'} size={16} />
          </motion.span>
        </AnimatePresence>
      </IconButton>
    </div>
  )
}
