import { MotionConfig } from 'framer-motion'
import { ToastProvider } from './components/Toast'
import { WalletProvider } from './features/wallet/WalletProvider'
import { WalletView } from './features/wallet/WalletView'
import { PreviewShell } from './shell/PreviewShell'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <WalletProvider>
          <PreviewShell>
            <WalletView />
          </PreviewShell>
        </WalletProvider>
      </ToastProvider>
    </MotionConfig>
  )
}
