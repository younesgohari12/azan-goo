import { useSearchParams } from 'react-router-dom'
import { BarChart3, Download, FileJson, RefreshCw } from 'lucide-react'
import { useReport } from '@/api/hooks'
import { formatDate, formatDateShort, formatNumber, formatToman, isoDaysAgo, toIsoDate } from '@/lib/format'
import { downloadCsv, downloadJson } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs } from '@/components/ui/tabs'

const reportTypes = [
  { value: 'products', label: 'محصولات' },
  { value: 'sales', label: 'فروش' },
  { value: 'inventory', label: 'موجودی' },
  { value: 'prices', label: 'تغییر قیمت' },
  { value: 'sync', label: 'همگام‌سازی' },
  { value: 'errors', label: 'خطاها' },
]

type Row = Record<string, string | number>

export default function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const type = params.get('type') ?? 'products'
  const from = params.get('from') ?? isoDaysAgo(30)
  const to = params.get('to') ?? toIsoDate(new Date())

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    })
    setParams(next, { replace: true })
  }

  const { data, isLoading, isFetching, isError, error, refetch } = useReport({ type, from, to })

  const columns: Column<Row>[] =
    data?.columns.map((column) => ({
      key: column.key,
      header: column.label,
      align: column.type === 'money' || column.type === 'number' ? 'end' : 'start',
      cell: (row) => {
        const value = row[column.key]
        if (column.type === 'money') return <span className="num text-[11.5px] font-medium text-foreground">{formatToman(Number(value))}</span>
        if (column.type === 'number') return <span className="num text-[11.5px] text-foreground">{formatNumber(Number(value))}</span>
        if (column.type === 'date') return <span className="text-[11px] text-muted-foreground">{formatDate(String(value))}</span>
        if (column.type === 'status') return <Badge variant="outline">{String(value)}</Badge>
        return <span className="text-[11.5px] text-foreground">{String(value)}</span>
      },
    })) ?? []

  const exportCsv = () => {
    if (!data) return
    downloadCsv(
      `snappshop-${type}-${from}-${to}.csv`,
      data.columns.map((column) => column.label),
      data.rows.map((row) => data.columns.map((column) => row[column.key] ?? '')),
    )
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="گزارش‌ها"
        description="گزارش‌های محصولات، فروش، موجودی، قیمت، همگام‌سازی و خطاها در بازهٔ زمانی انتخابی. خروجی از دادهٔ همان گزارش ساخته می‌شود."
        actions={
          <>
            <Button variant="outline" size="sm" startIcon={<FileJson className="h-3.5 w-3.5" />} disabled={!data} onClick={() => data && downloadJson(`snappshop-${type}-${from}-${to}.json`, data)}>
              JSON
            </Button>
            <Button variant="outline" size="sm" startIcon={<Download className="h-3.5 w-3.5" />} disabled={!data} onClick={exportCsv}>
              CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              startIcon={<RefreshCw className={isFetching ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />}
              onClick={() => refetch()}
            >
              اجرای گزارش
            </Button>
          </>
        }
      />

      <Tabs
        value={type}
        onChange={(value) => update({ type: value })}
        tabs={reportTypes}
        className="mb-3"
      />

      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[10.5px] text-muted-foreground">
            از تاریخ
            <Input type="date" value={from} onChange={(event) => update({ from: event.target.value })} className="mt-1 h-8 w-[150px]" />
            <span className="mt-1 block text-[9.5px]">{formatDateShort(from)}</span>
          </label>
          <label className="text-[10.5px] text-muted-foreground">
            تا تاریخ
            <Input type="date" value={to} onChange={(event) => update({ to: event.target.value })} className="mt-1 h-8 w-[150px]" />
            <span className="mt-1 block text-[9.5px]">{formatDateShort(to)}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '۷ روز', days: 7 },
              { label: '۳۰ روز', days: 30 },
              { label: '۹۰ روز', days: 90 },
            ].map((preset) => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => update({ from: isoDaysAgo(preset.days), to: toIsoDate(new Date()) })}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <span className="ms-auto text-[10.5px] text-muted-foreground">{formatNumber(data?.rows.length ?? 0)} ردیف در این گزارش</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={data?.rows ?? []}
            rowKey={(row) => JSON.stringify(row)}
            loading={isLoading}
            dense
            skeletonRows={10}
            empty={<EmptyState icon={BarChart3} title="داده‌ای برای این گزارش نیست" description="بازهٔ زمانی دیگری را انتخاب کنید یا پس از همگام‌سازی دوباره تلاش کنید." />}
          />
        )}
      </Card>
    </div>
  )
}
