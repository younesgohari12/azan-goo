import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Calculator } from 'lucide-react'
import type { Product } from '@/api/types'
import { formatNumber, formatPercent, formatToman, parseAmount } from '@/lib/format'
import { adjustModeLabels, buildPreview, priceDiffPercent, type AdjustMode } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Modal } from './ui/dialog'
import { Field, Input, Select } from './ui/input'
import { Progress } from './ui/progress'

export function BulkEditModal({
  open,
  onClose,
  operation,
  products,
  loading,
  onConfirm,
  title,
}: {
  open: boolean
  onClose: () => void
  operation: 'price' | 'stock'
  products: Product[]
  loading?: boolean
  onConfirm: (payload: { mode: AdjustMode; value: number }) => void
  title: string
}) {
  const [mode, setMode] = useState<AdjustMode>(operation === 'price' ? 'increase_percent' : 'set')
  const [rawValue, setRawValue] = useState('')

  useEffect(() => {
    if (open) {
      setMode(operation === 'price' ? 'increase_percent' : 'set')
      setRawValue('')
    }
  }, [open, operation])

  const value = parseAmount(rawValue) ?? 0
  const valid = rawValue.trim() !== '' && value > 0
  const preview = useMemo(
    () => (valid ? buildPreview(products, operation, mode, value) : []),
    [valid, products, operation, mode, value],
  )

  const affected = preview.filter((row) => row.to !== row.from).length
  const totalDelta = preview.reduce((sum, row) => sum + (row.to - row.from), 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={`${formatNumber(products.length)} محصول انتخاب شده — تغییرات پس از تأیید روی همه اعمال می‌شود.`}
      size="lg"
      footer={
        <>
          <span className="me-auto text-[11px] text-muted-foreground">
            {valid ? `${formatNumber(affected)} محصول تغییر می‌کند` : 'مقدار را وارد کنید'}
          </span>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            variant="primary"
            loading={loading}
            disabled={!valid || affected === 0}
            onClick={() => onConfirm({ mode, value })}
          >
            تأیید و اعمال تغییرات
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="نوع تغییر" hint="عملیات روی مقدار فعلی ووکامرس اعمال می‌شود.">
          <Select value={mode} onChange={(event) => setMode(event.target.value as AdjustMode)}>
            {(Object.keys(adjustModeLabels) as AdjustMode[])
              .filter((key) => operation === 'price' || !key.includes('percent'))
              .map((key) => (
                <option key={key} value={key}>
                  {adjustModeLabels[key]}
                </option>
              ))}
          </Select>
        </Field>
        <Field
          label={operation === 'price' ? 'مقدار (تومان یا درصد)' : 'مقدار موجودی'}
          hint={operation === 'price' ? 'قیمت‌ها به تومان و رند شده به هزار تومان اعمال می‌شوند.' : 'موجودی عدد صحیح است.'}
        >
          <Input
            inputMode="numeric"
            value={rawValue}
            onChange={(event) => setRawValue(event.target.value)}
            placeholder={mode.includes('percent') ? 'مثلاً ۵' : 'مثلاً ۱٬۵۰۰٬۰۰۰'}
          />
        </Field>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
            پیش‌نمایش تغییرات
          </span>
          {valid && operation === 'price' && (
            <span className="text-[10.5px] text-muted-foreground">
              اختلاف کل: <span className={cn('num font-medium', totalDelta > 0 ? 'text-success' : totalDelta < 0 ? 'text-danger' : '')}>{totalDelta > 0 ? '+' : ''}{formatNumber(totalDelta)} تومان</span>
            </span>
          )}
        </div>
        {!valid ? (
          <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">برای دیدن پیش‌نمایش، مقدار را وارد کنید.</p>
        ) : (
          <div className="max-h-[240px] overflow-y-auto">
            <table className="w-full text-[11.5px]">
              <thead className="sticky top-0 bg-muted/80 text-muted-foreground backdrop-blur">
                <tr>
                  <th className="px-3 py-1.5 text-start font-medium">محصول</th>
                  <th className="px-3 py-1.5 text-end font-medium">مقدار فعلی</th>
                  <th className="px-3 py-1.5 text-end font-medium">مقدار جدید</th>
                  <th className="px-3 py-1.5 text-end font-medium">تغییر</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => {
                  const diff = priceDiffPercent(row.from, row.to)
                  return (
                    <tr key={row.id} className="border-t border-border/60">
                      <td className="max-w-[220px] truncate px-3 py-1.5 text-foreground">{row.name}</td>
                      <td className="num px-3 py-1.5 text-end text-muted-foreground">
                        {operation === 'price' ? formatToman(row.from) : formatNumber(row.from)}
                      </td>
                      <td className="num px-3 py-1.5 text-end font-medium text-foreground">
                        {operation === 'price' ? formatToman(row.to) : formatNumber(row.to)}
                      </td>
                      <td
                        className={cn(
                          'num px-3 py-1.5 text-end',
                          row.to === row.from ? 'text-muted-foreground' : row.to > row.from ? 'text-success' : 'text-danger',
                        )}
                      >
                        {operation === 'price' ? formatPercent(diff, true) : `${row.to > row.from ? '+' : ''}${formatNumber(row.to - row.from)}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {valid && products.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-[10.5px] text-muted-foreground">
          <ArrowLeft className="h-3 w-3" />
          پیش‌نمایش برای {formatNumber(Math.min(preview.length, products.length))} محصول اول محاسبه شده است.
        </div>
      )}
      {loading && <Progress value={70} className="mt-3" />}
    </Modal>
  )
}
