import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { scrimVariants, sheetPanelDesktop, sheetPanelMobile } from '../motion/variants'
import { useMediaQuery } from '../lib/useMediaQuery'
import { cx } from '../lib/cx'
import { Icon } from './Icon'
import { IconButton } from './Button'
import './Sheet.css'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** در صورت وجود، کنترل بازگشت به مرحلهٔ قبل نمایش داده می‌شود */
  onBack?: () => void
  backLabel?: string
  /** auto: فرم کوتاه | full: جریان چندمرحله‌ای */
  variant?: 'auto' | 'full'
  children: ReactNode
}

/**
 * پنل شناور: روی موبایل از پایین می‌آید (bottom sheet) و روی دسکتاپ در مرکز
 * باز می‌شود. سایه و scrim فقط برای همین لایهٔ شناور استفاده شده‌اند.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  onBack,
  backLabel = 'مرحلهٔ قبل',
  variant = 'auto',
  children,
}: SheetProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    lastFocusedRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 40)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      lastFocusedRef.current?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className={cx('sheet', isDesktop && 'sheet--desktop')}>
          <motion.div
            className="sheet__scrim"
            variants={scrimVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-variant={variant}
            className="sheet__panel"
            variants={isDesktop ? sheetPanelDesktop : sheetPanelMobile}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <span className="sheet__grabber" aria-hidden="true" />
            <header className="sheet__header">
              {onBack ? (
                <IconButton label={backLabel} onClick={onBack}>
                  <Icon name="chevron-right" size={18} />
                </IconButton>
              ) : (
                <span className="sheet__header-spacer" />
              )}
              <div className="sheet__titles">
                {subtitle ? <p className="sheet__subtitle">{subtitle}</p> : null}
                <h2 className="sheet__title" id={titleId}>
                  {title}
                </h2>
              </div>
              <IconButton label="بستن" onClick={onClose}>
                <Icon name="close" size={17} />
              </IconButton>
            </header>
            <div className="sheet__body">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
