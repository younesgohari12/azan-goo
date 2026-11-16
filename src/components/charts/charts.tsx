import type { ReactNode } from 'react'
import { formatNumber, formatTomanCompact } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  footer,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  footer?: ReactNode
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1 p-3 pt-2">{children}</div>
      {footer && <div className="border-t border-border px-4 py-2.5">{footer}</div>}
    </Card>
  )
}

export type TooltipPayload = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

export function FaChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = (value: number) => formatNumber(value),
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  labelFormatter?: (label: string | number) => string
  valueFormatter?: (value: number) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div dir="rtl" className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] shadow-pop">
      {label !== undefined && (
        <p className="mb-1.5 border-b border-border pb-1.5 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="num font-medium text-foreground">
              {valueFormatter(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function moneyTooltipValue(value: number) {
  return formatTomanCompact(value)
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export const axisProps = {
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 },
  axisLine: false,
  tickLine: false,
} as const
