import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </div>
      <p className="text-[13px] font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-danger/20 bg-danger-soft text-danger">
        <span className="text-lg font-semibold">!</span>
      </div>
      <p className="text-[13px] font-medium text-foreground">دریافت اطلاعات ناموفق بود</p>
      <p className="mt-1 max-w-md text-xs leading-6 text-muted-foreground">{message ?? 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 h-8 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted"
        >
          تلاش دوباره
        </button>
      )}
    </div>
  )
}
