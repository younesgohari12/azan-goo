import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { scrimVariants, dialogPanelVariants } from '../motion/variants'
import { pushEscapeLayer } from '../lib/escapeLayer'
import { Button } from './Button'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  /** اقدام اصلی؛ بعد از اجرا دیالوگ بسته می‌شود */
  onConfirm: () => void
  onCancel: () => void
}

/**
 * دیالوگ تأیید کوچک: پس‌زمینه با fade و خود کارت با scale حدود ۰٫۹۸.
 * Escape آن را می‌بندد و focus به کنترل قبلی برمی‌گردد.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    lastFocusedRef.current = document.activeElement as HTMLElement | null
    const focusTimer = window.setTimeout(() => confirmRef.current?.focus(), 40)

    // فقط لایهٔ رویی به Escape پاسخ می‌دهد
    const removeEscapeLayer = pushEscapeLayer({ onEscape: onCancel })

    return () => {
      window.clearTimeout(focusTimer)
      removeEscapeLayer()
      lastFocusedRef.current?.focus?.()
    }
  }, [open, onCancel])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="confirm-dialog">
          <motion.div
            className="confirm-dialog__scrim"
            variants={scrimVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onCancel}
          />
          <motion.div
            className="confirm-dialog__card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            variants={dialogPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 className="confirm-dialog__title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="confirm-dialog__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
            <div className="confirm-dialog__actions">
              <Button variant="ghost" fullWidth onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button ref={confirmRef} variant="primary" fullWidth onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
