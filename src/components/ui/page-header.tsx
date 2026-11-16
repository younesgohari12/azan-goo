import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  badge,
  className,
}: {
  title: string
  description?: string
  breadcrumb?: string[]
  actions?: ReactNode
  badge?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            {breadcrumb.map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-1">
                <span className={index === breadcrumb.length - 1 ? 'text-foreground/80' : ''}>{item}</span>
                {index < breadcrumb.length - 1 && <ChevronLeft className="h-3 w-3 opacity-50" />}
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 max-w-2xl text-xs leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
