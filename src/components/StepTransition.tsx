import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { stepVariants } from '../motion/variants'
import { cx } from '../lib/cx'
import './StepTransition.css'

interface StepTransitionProps {
  /** کلید مرحلهٔ جاری */
  stepKey: string | number
  /** 1 = جلو، 1- = بازگشت */
  direction: 1 | -1
  className?: string
  children: ReactNode
}

/** گذار جهت‌دار بین مراحل یک فرم */
export function StepTransition({ stepKey, direction, className, children }: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        className={cx('step-transition', className)}
        variants={stepVariants(direction)}
        initial="enter"
        animate="center"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
