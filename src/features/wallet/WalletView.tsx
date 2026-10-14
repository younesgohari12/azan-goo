import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { feedbackTransition, viewVariants } from '../../motion/variants'
import { requestHostBack } from '../../host/hostBridge'
import type { OperationType } from '../../data/types'
import { HomeView } from './HomeView'
import { TransactionsView } from './TransactionsView'
import { TransactionDetailsSheet } from './TransactionDetailsSheet'
import { TopUpFlow } from './flows/TopUpFlow'
import { TransferFlow } from './flows/TransferFlow'
import { WithdrawFlow } from './flows/WithdrawFlow'
import { useWallet } from './WalletProvider'
import './WalletView.css'

type WalletRouteName = 'home' | 'transactions'
type SheetKind = 'topup' | 'transfer' | 'withdraw' | null

export function WalletView() {
  const { transactions } = useWallet()
  const [routes, setRoutes] = useState<WalletRouteName[]>(['home'])
  const [direction, setDirection] = useState<1 | -1>(1)
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [backHint, setBackHint] = useState(false)
  const hintTimerRef = useRef<number | null>(null)

  const route = routes[routes.length - 1]

  useEffect(
    () => () => {
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  const push = useCallback((next: WalletRouteName) => {
    setDirection(1)
    setRoutes((current) => [...current, next])
  }, [])

  const pop = useCallback(() => {
    setDirection(-1)
    setRoutes((current) => (current.length > 1 ? current.slice(0, -1) : current))
  }, [])

  /** کنترل بازگشت: در گام اول به میزبان می‌سپارد، در نبود میزبان توضیح کوتاه می‌دهد */
  const handleHomeBack = useCallback(() => {
    if (requestHostBack()) return
    setBackHint(true)
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    hintTimerRef.current = window.setTimeout(() => setBackHint(false), 3000)
  }, [])

  const openTransactions = useCallback(() => {
    setSheet(null)
    push('transactions')
  }, [push])

  const closeSheet = useCallback(() => setSheet(null), [])

  const details = detailsId ? (transactions.find((item) => item.id === detailsId) ?? null) : null

  return (
    <div className="wallet">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={route}
          className="wallet__view"
          variants={viewVariants(direction)}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {route === 'home' ? (
            <HomeView
              onBack={handleHomeBack}
              onOpenFlow={(type: OperationType) => setSheet(type)}
              onOpenTransactions={() => push('transactions')}
              onOpenTransaction={setDetailsId}
            />
          ) : (
            <TransactionsView onBack={pop} onOpenTransaction={setDetailsId} />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {backHint ? (
          <motion.p
            className="wallet__toast"
            role="status"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={feedbackTransition}
          >
            در پیش‌نمایش مستقل، برنامه‌ای برای بازگشت وصل نیست.
          </motion.p>
        ) : null}
      </AnimatePresence>

      <TopUpFlow open={sheet === 'topup'} onClose={closeSheet} onViewTransactions={openTransactions} />
      <TransferFlow open={sheet === 'transfer'} onClose={closeSheet} onViewTransactions={openTransactions} />
      <WithdrawFlow open={sheet === 'withdraw'} onClose={closeSheet} onViewTransactions={openTransactions} />
      <TransactionDetailsSheet transaction={details} onClose={() => setDetailsId(null)} />
    </div>
  )
}
