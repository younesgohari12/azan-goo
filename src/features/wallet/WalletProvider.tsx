import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { walletDisplayConfig, type WalletDisplayConfig } from '../../data/walletConfig'
import { resolveDemoStatus, resolveInitialBalance, resolveShowTransactions } from '../../data/walletDemo'
import { transferRecipients, walletSnapshot, withdrawDestinations } from '../../data/walletData'
import { operationBalanceDelta, operationFee, type WalletOperation } from '../../data/walletRules'
import type { Recipient, Transaction, WithdrawDestination } from '../../data/types'
import { emitWalletEvent } from '../../host/hostBridge'

export type { WalletOperation }

interface WalletContextValue {
  balance: number
  pendingBalance: number
  transactions: Transaction[]
  recipients: Recipient[]
  destinations: WithdrawDestination[]
  config: WalletDisplayConfig
  /** اجرای عملیات به‌صورت کاملاً محلی/نمایشی — بدون بک‌اند و بدون درگاه واقعی */
  submitOperation: (operation: WalletOperation) => Transaction
  introPlayed: boolean
  markIntroPlayed: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

function makeReference(): string {
  return `${walletDisplayConfig.referencePrefix}${Math.floor(10_000 + Math.random() * 89_999)}`
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(() => resolveInitialBalance(walletSnapshot.balance))
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    resolveShowTransactions() ? walletSnapshot.transactions : [],
  )
  const [introPlayed, setIntroPlayed] = useState(false)

  const markIntroPlayed = useCallback(() => setIntroPlayed(true), [])

  const submitOperation = useCallback((operation: WalletOperation): Transaction => {
    const status = resolveDemoStatus(operation.type)
    const fee = operationFee(operation)
    const now = new Date().toISOString()

    let transaction: Transaction

    if (operation.type === 'topup') {
      transaction = {
        id: `demo-${Date.now()}`,
        kind: 'topup',
        title: 'افزایش اعتبار از درگاه بانکی',
        amount: operation.amount,
        status,
        date: now,
        reference: makeReference(),
        note: 'عملیات نمایشی این نسخه',
        demo: true,
      }
    } else if (operation.type === 'transfer') {
      transaction = {
        id: `demo-${Date.now()}`,
        kind: 'transfer_out',
        title: `انتقال به ${operation.recipient.name}`,
        counterparty: operation.recipient.name,
        amount: -operation.amount,
        status,
        date: now,
        reference: makeReference(),
        note: operation.note?.trim() ? operation.note.trim() : undefined,
        fee: fee || undefined,
        demo: true,
      }
    } else {
      transaction = {
        id: `demo-${Date.now()}`,
        kind: 'withdraw',
        title: `برداشت به ${operation.destination.label}`,
        counterparty: operation.destination.label,
        amount: -operation.amount,
        status,
        date: now,
        reference: makeReference(),
        fee: fee || undefined,
        note: status === 'pending' ? 'در انتظار تسویهٔ بانکی' : undefined,
        demo: true,
      }
    }

    // موجودی فقط با همان قاعدهٔ نمونهٔ عملیات عوض می‌شود (نگاه کنید به walletRules)
    const delta = operationBalanceDelta(operation, status)
    if (delta !== 0) setBalance((current) => Math.max(current + delta, 0))

    setTransactions((current) => [transaction, ...current])
    emitWalletEvent({ type: operation.type, amount: operation.amount, status })

    return transaction
  }, [])

  const value = useMemo<WalletContextValue>(
    () => ({
      balance,
      pendingBalance: walletSnapshot.pendingBalance,
      transactions,
      recipients: transferRecipients,
      destinations: withdrawDestinations,
      config: walletDisplayConfig,
      submitOperation,
      introPlayed,
      markIntroPlayed,
    }),
    [balance, transactions, submitOperation, introPlayed, markIntroPlayed],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext)
  if (!context) throw new Error('useWallet باید داخل WalletProvider استفاده شود')
  return context
}
