import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AppHeader } from '../../components/AppHeader'
import { Icon } from '../../components/Icon'
import { introContainer, introGroup } from '../../motion/variants'
import type { OperationType } from '../../data/types'
import { BalanceCard } from './BalanceCard'
import { QuickActions } from './QuickActions'
import { TransactionList } from './TransactionList'
import { useWallet } from './WalletProvider'
import './HomeView.css'

interface HomeViewProps {
  onOpenFlow: (type: OperationType) => void
  onOpenTransactions: () => void
  onOpenTransaction: (id: string) => void
  onBack: () => void
}

const RECENT_COUNT = 4

export function HomeView({ onOpenFlow, onOpenTransactions, onOpenTransaction, onBack }: HomeViewProps) {
  const { transactions, introPlayed, markIntroPlayed } = useWallet()
  const shouldAnimateIntro = !introPlayed

  // ورود اولیه فقط یک‌بار: بعد از پایان stagger پرچم ثبت می‌شود
  useEffect(() => {
    if (!shouldAnimateIntro) return
    const timer = window.setTimeout(markIntroPlayed, 700)
    return () => window.clearTimeout(timer)
  }, [shouldAnimateIntro, markIntroPlayed])

  const recent = transactions.slice(0, RECENT_COUNT)

  return (
    <motion.div
      className="home"
      variants={introContainer}
      initial={shouldAnimateIntro ? 'hidden' : false}
      animate={shouldAnimateIntro ? 'visible' : 'settled'}
    >
      <motion.div variants={introGroup}>
        <AppHeader title="کیف پول" subtitle="مدیریت اعتبار و تراکنش‌ها" onBack={onBack} />
      </motion.div>

      <motion.div className="home__section" variants={introGroup}>
        <BalanceCard />
      </motion.div>

      <motion.div className="home__section" variants={introGroup}>
        <QuickActions
          onSelect={(type) => {
            if (type === 'history') onOpenTransactions()
            else onOpenFlow(type)
          }}
        />
      </motion.div>

      <motion.section className="home__section" variants={introGroup} aria-labelledby="wallet-activity-title">
        <div className="home__section-head">
          <h2 className="home__section-title" id="wallet-activity-title">
            فعالیت‌های اخیر
          </h2>
          <button type="button" className="home__link" onClick={onOpenTransactions}>
            همهٔ تراکنش‌ها
            <Icon name="chevron-left" size={14} />
          </button>
        </div>

        <TransactionList items={recent} onOpen={onOpenTransaction} />

        <p className="home__note">داده‌ها و عملیات این نسخه نمایشی است.</p>
      </motion.section>
    </motion.div>
  )
}
