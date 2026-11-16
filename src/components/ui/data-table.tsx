import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Checkbox } from './checkbox'
import { Skeleton } from './skeleton'

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  className?: string
  headerClassName?: string
  width?: string
}

export type SortState = { key: string; direction: 'asc' | 'desc' } | null

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  sort,
  onSortChange,
  selected,
  onSelectedChange,
  onRowClick,
  empty,
  skeletonRows = 8,
  footer,
  className,
  dense,
  rowClassName,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  sort?: SortState
  onSortChange?: (key: string) => void
  selected?: Set<string | number>
  onSelectedChange?: (next: Set<string | number>) => void
  onRowClick?: (row: T) => void
  empty?: ReactNode
  skeletonRows?: number
  footer?: ReactNode
  className?: string
  dense?: boolean
  rowClassName?: (row: T) => string | undefined
}) {
  const selectable = Boolean(selected && onSelectedChange)
  const allSelected = rows.length > 0 && rows.every((row) => selected?.has(rowKey(row)))
  const someSelected = rows.some((row) => selected?.has(rowKey(row)))

  const toggleAll = (checked: boolean) => {
    if (!onSelectedChange) return
    const next = new Set(selected)
    rows.forEach((row) => {
      if (checked) next.add(rowKey(row))
      else next.delete(rowKey(row))
    })
    onSelectedChange(next)
  }

  const toggleOne = (key: string | number, checked: boolean) => {
    if (!onSelectedChange) return
    const next = new Set(selected)
    if (checked) next.add(key)
    else next.delete(key)
    onSelectedChange(next)
  }

  const alignClass = (align?: 'start' | 'center' | 'end') =>
    align === 'center' ? 'text-center' : align === 'end' ? 'text-end' : 'text-start'

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    ariaLabel="انتخاب همه"
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((column) => {
                const isSorted = sort?.key === column.key
                return (
                  <th
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      'whitespace-nowrap px-3 py-2.5 text-[11px] font-medium text-muted-foreground',
                      alignClass(column.align),
                      column.headerClassName,
                    )}
                  >
                    {column.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded transition-colors hover:text-foreground',
                          isSorted && 'text-foreground',
                          column.align === 'end' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        {isSorted ? (
                          sort?.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: skeletonRows }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-border/60">
                  {selectable && (
                    <td className="px-3 py-3">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  )}
                  {columns.map((column, columnIndex) => (
                    <td key={column.key} className="px-3 py-3">
                      <Skeleton className={cn('h-3.5', columnIndex === 0 ? 'w-40' : columnIndex === 1 ? 'w-20' : 'w-14')} />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              rows.map((row) => {
                const key = rowKey(row)
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-b border-border/60 transition-colors last:border-0',
                      onRowClick && 'cursor-pointer',
                      selected?.has(key) ? 'bg-primary-soft/40' : 'hover:bg-muted/40',
                      rowClassName?.(row),
                    )}
                  >
                    {selectable && (
                      <td className="px-3" onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          ariaLabel="انتخاب ردیف"
                          checked={Boolean(selected?.has(key))}
                          onChange={(checked) => toggleOne(key, checked)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-3 text-[12.5px] text-foreground',
                          dense ? 'py-2' : 'py-2.5',
                          alignClass(column.align),
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 && empty}
      {footer}
    </div>
  )
}
