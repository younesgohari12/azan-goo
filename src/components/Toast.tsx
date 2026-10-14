import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { feedbackTransition } from '../motion/variants'
import './Toast.css'

interface ToastMessage {
  id: number
  text: string
}

interface ToastContextValue {
  show: (text: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VISIBLE_MS = 2600

/**
 * پیام کوتاه شناور. حداکثر دو پیام روی هم می‌مانند تا صفحه از پیام پر نشود و
 * هر پیام خودش بعد از چند لحظه می‌رود.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])
  const timersRef = useRef<number[]>([])

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const show = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setMessages((current) => [...current.slice(-1), { id, text }])
    const timer = window.setTimeout(() => {
      setMessages((current) => current.filter((message) => message.id !== id))
    }, VISIBLE_MS)
    timersRef.current.push(timer)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="toast-viewport" role="status" aria-live="polite">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.p
                key={message.id}
                className="toast"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={feedbackTransition}
              >
                {message.text}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast باید داخل ToastProvider استفاده شود')
  return context
}
