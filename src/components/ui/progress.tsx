import { cn } from '@/lib/utils'

export function Progress({
  value,
  tone = 'primary',
  className,
  height = 'md',
}: {
  value: number
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  height?: 'sm' | 'md'
}) {
  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
  }
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full overflow-hidden rounded-full bg-muted', height === 'md' ? 'h-2' : 'h-1.5', className)}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-smooth', colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
