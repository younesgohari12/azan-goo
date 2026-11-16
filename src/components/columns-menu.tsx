import { Columns3, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Popover } from './ui/popover'

export function ColumnsMenu({
  columns,
  visible,
  onChange,
  onReset,
}: {
  columns: { key: string; label: string }[]
  visible: string[]
  onChange: (next: string[]) => void
  onReset: () => void
}) {
  return (
    <Popover
      align="end"
      contentClassName="w-56"
      trigger={({ toggle }) => (
        <Button variant="outline" size="sm" onClick={toggle} startIcon={<Columns3 className="h-3.5 w-3.5" />}>
          ستون‌ها
        </Button>
      )}
    >
      <div className="max-h-72 overflow-y-auto p-1">
        {columns.map((column) => (
          <label
            key={column.key}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[11.5px] text-foreground hover:bg-muted"
          >
            <Checkbox
              checked={visible.includes(column.key)}
              onChange={(checked) => {
                if (checked) onChange([...visible, column.key])
                else if (visible.length > 1) onChange(visible.filter((key) => key !== column.key))
              }}
            />
            {column.label}
          </label>
        ))}
      </div>
      <div className="border-t border-border p-1">
        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          بازنشانی ستون‌ها
        </button>
      </div>
    </Popover>
  )
}
