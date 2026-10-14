import { useState } from 'react'
import { Amount } from '../../components/Amount'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../components/Button'
import { useAnimatedNumber } from '../../lib/useAnimatedNumber'
import { useWallet } from './WalletProvider'
import './BalanceCard.css'

export function BalanceCard() {
  const { balance, pendingBalance, config } = useWallet()
  const [hidden, setHidden] = useState(false)
  const animatedBalance = useAnimatedNumber(balance)

  return (
    <section className="balance-card" aria-labelledby="wallet-balance-label">
      <div className="balance-card__head">
        <h2 className="balance-card__label" id="wallet-balance-label">
          موجودی قابل استفاده
        </h2>
        <IconButton
          size="sm"
          label={hidden ? 'نمایش موجودی' : 'پنهان‌کردن موجودی'}
          aria-pressed={hidden}
          onClick={() => setHidden((value) => !value)}
        >
          <Icon name={hidden ? 'eye-off' : 'eye'} size={18} />
        </IconButton>
      </div>

      <p className="balance-card__amount">
        <Amount value={animatedBalance} size="hero" unit hidden={hidden} reserve={config.amountReserve} />
      </p>

      {pendingBalance > 0 ? (
        <p className="balance-card__pending">
          <Icon name="clock" size={14} strokeWidth={1.8} />
          <span className="balance-card__pending-label">در انتظار تأیید</span>
          <span className="balance-card__pending-dot" aria-hidden="true" />
          <Amount value={pendingBalance} size="sm" unit sign="in" hidden={hidden} />
        </p>
      ) : null}
    </section>
  )
}
