import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toFaDigits } from '@/lib/format'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50],
  className,
}: {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  perPageOptions?: number[]
  className?: string
}) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(total, page * perPage)

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-1', className)}>
      <p className="text-[11.5px] text-muted-foreground">
        نمایش {toFaDigits(from)} تا {toFaDigits(to)} از {toFaDigits(total)} مورد
      </p>
      <div className="flex items-center gap-2">
        {onPerPageChange && (
          <select
            aria-label="تعداد در هر صفحه"
            value={perPage}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            className="h-8 cursor-pointer rounded-lg border border-border bg-card px-2 text-[11.5px] text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {toFaDigits(option)} در صفحه
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="صفحه قبل"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="min-w-[68px] text-center text-[11.5px] text-muted-foreground">
            {toFaDigits(page)} / {toFaDigits(pages)}
          </span>
          <button
            type="button"
            aria-label="صفحه بعد"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
