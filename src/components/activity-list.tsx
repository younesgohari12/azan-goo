import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Workflow,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { ActivityEntry } from '@/api/types'
import type { Tone } from '@/lib/status'
import { activityLabels } from '@/lib/status'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const iconMap: Record<string, LucideIcon> = {
  order: ShoppingCart,
  price: CircleDollarSign,
  stock: Boxes,
  sync: RefreshCw,
  error: AlertTriangle,
  automation: Workflow,
}

const toneStyles: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-muted text-muted-foreground',
}

export function ActivityIcon({ type }: { type: string }) {
  const Icon = iconMap[type] ?? Sparkles
  const meta = activityLabels[type] ?? { label: 'رویداد', tone: 'neutral' as Tone }
  return (
    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', toneStyles[meta.tone])}>
      <Icon className="h-4 w-4" strokeWidth={1.9} />
    </span>
  )
}

export function ActivityList({
  items,
  loading,
  columns = 1,
  showType = true,
}: {
  items?: ActivityEntry[]
  loading?: boolean
  columns?: 1 | 2
  showType?: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ul className={cn('divide-y divide-border/60', columns === 2 && 'sm:grid sm:grid-cols-2 sm:divide-y-0')}>
      {items?.map((item) => (
        <li
          key={item.id}
          className={cn(
            'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30',
            columns === 2 && 'sm:border-b sm:border-border/60',
          )}
        >
          <ActivityIcon type={item.type} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-[12px] font-medium text-foreground">{item.title}</p>
              {showType && (
                <Badge variant={activityLabels[item.type]?.tone ?? 'neutral'}>{activityLabels[item.type]?.label ?? 'رویداد'}</Badge>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{item.description}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
              <span>{formatRelative(item.created_at)}</span>
              <span className="text-muted-foreground/40">•</span>
              <span>{item.actor}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Dismissible({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-xl border border-warning/25 bg-warning-soft/50 px-4 py-3">
      <div className="flex items-start gap-2.5 pe-6">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="text-[11.5px] leading-6 text-foreground/90">{children}</div>
      </div>
      <button
        type="button"
        aria-label="بستن"
        onClick={onClose}
        className="absolute end-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-warning/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
