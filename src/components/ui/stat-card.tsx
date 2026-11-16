import { ArrowDownLeft, ArrowUpRight, Info, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'
import { Tooltip } from './tooltip'

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const accents: Record<Accent, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-muted text-muted-foreground',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  accent = 'primary',
  loading,
  suffix,
  footer,
  onClick,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: number | null
  hint?: string
  accent?: Accent
  loading?: boolean
  suffix?: string
  footer?: string
  onClick?: () => void
}) {
  const TrendIcon = trend === null || trend === undefined ? Minus : trend >= 0 ? ArrowUpRight : ArrowDownLeft
  const trendTone = trend === null || trend === undefined ? 'text-muted-foreground' : trend >= 0 ? 'text-success' : 'text-danger'

  return (
    <div
      className={cn(
        'surface group relative p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:border-border hover:shadow-pop',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
          {hint && (
            <Tooltip content={hint}>
              <Info className="h-3 w-3 text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
            </Tooltip>
          )}
        </div>
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', accents[accent])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="num text-[22px] font-semibold leading-8 tracking-tight text-foreground">{value}</span>
          {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
        </div>
      )}

      <div className="mt-1.5 flex items-center gap-1.5">
        {trend !== null && trend !== undefined && (
          <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium', trendTone)}>
            <TrendIcon className="h-3 w-3" />
            {formatPercent(Math.abs(trend))}
          </span>
        )}
        <span className="truncate text-[10.5px] text-muted-foreground">{footer ?? 'در مقایسه با دوره قبل'}</span>
      </div>
    </div>
  )
}
