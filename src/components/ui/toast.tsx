import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastItem = ToastOptions & { id: number }

const ToastContext = createContext<{ toast: (options: ToastOptions) => void } | null>(null)

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error: <XCircle className="h-4 w-4 text-danger" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  info: <Info className="h-4 w-4 text-info" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const toast = useCallback((options: ToastOptions) => {
    counter.current += 1
    const id = counter.current
    setItems((prev) => [...prev, { ...options, id }])
    window.setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== id)), 4500)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 start-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex animate-fade-up items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 shadow-pop"
          >
            <span className="mt-0.5">{icons[item.variant ?? 'info']}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground">{item.title}</p>
              {item.description && <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{item.description}</p>}
            </div>
            <button
              type="button"
              aria-label="بستن اعلان"
              className="rounded-md p-0.5 text-muted-foreground hover:bg-muted"
              onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

export function StatusDot({ tone, className }: { tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; className?: string }) {
  const colors = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-muted-foreground/50',
  }
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', colors[tone], className)} />
}
