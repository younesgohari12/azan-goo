import { MotionConfig } from 'framer-motion'
import { WalletProvider } from './features/wallet/WalletProvider'
import { WalletView } from './features/wallet/WalletView'
import { PreviewShell } from './shell/PreviewShell'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <WalletProvider>
        <PreviewShell>
          <WalletView />
        </PreviewShell>
      </WalletProvider>
    </MotionConfig>
  )
}
