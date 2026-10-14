import { Icon } from '../../components/Icon'
import { IconButton } from '../../components/Button'
import './HistoryFilters.css'

export type HistoryKind = 'all' | 'topup' | 'transfer' | 'withdraw'
export type HistoryStatus = 'all' | 'success' | 'pending' | 'failed'

const KIND_CHIPS: Array<{ id: HistoryKind; label: string }> = [
  { id: 'all', label: 'همه' },
  { id: 'topup', label: 'افزایش اعتبار' },
  { id: 'transfer', label: 'انتقال' },
  { id: 'withdraw', label: 'برداشت' },
]

const STATUS_CHIPS: Array<{ id: HistoryStatus; label: string }> = [
  { id: 'all', label: 'همه' },
  { id: 'success', label: 'موفق' },
  { id: 'pending', label: 'در انتظار' },
  { id: 'failed', label: 'ناموفق' },
]

interface ChipRowProps<T extends string> {
  label: string
  chips: Array<{ id: T; label: string }>
  value: T
  onChange: (value: T) => void
}

/** ردیف چیپ‌ها: نشان انتخاب کوتاه و هم‌زبان با بقیهٔ کیف پول */
function ChipRow<T extends string>({ label, chips, value, onChange }: ChipRowProps<T>) {
  return (
    <div className="history-filters__row" role="group" aria-label={label}>
      {chips.map((chip) => {
        const isSelected = chip.id === value
        return (
          <button
            key={chip.id}
            type="button"
            className="history-chip"
            data-selected={isSelected ? 'true' : 'false'}
            aria-pressed={isSelected}
            onClick={() => onChange(chip.id)}
          >
            <span className="history-chip__check" aria-hidden="true">
              <Icon name="check" size={12} strokeWidth={2.3} />
            </span>
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}

interface HistoryFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  kind: HistoryKind
  onKindChange: (value: HistoryKind) => void
  status: HistoryStatus
  onStatusChange: (value: HistoryStatus) => void
  canClear: boolean
  onClear: () => void
}

export function HistoryFilters({
  query,
  onQueryChange,
  kind,
  onKindChange,
  status,
  onStatusChange,
  canClear,
  onClear,
}: HistoryFiltersProps) {
  return (
    <div className="history-filters">
      <div className="history-filters__search">
        <Icon name="search" size={17} />
        <input
          className="history-filters__input"
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="جست‌وجو در نام، شناسه یا مبلغ"
          aria-label="جست‌وجوی تراکنش"
        />
        {query ? (
          <IconButton size="sm" label="پاک‌کردن جست‌وجو" onClick={() => onQueryChange('')}>
            <Icon name="close" size={15} />
          </IconButton>
        ) : null}
      </div>

      <ChipRow label="فیلتر نوع تراکنش" chips={KIND_CHIPS} value={kind} onChange={onKindChange} />
      <ChipRow label="فیلتر وضعیت تراکنش" chips={STATUS_CHIPS} value={status} onChange={onStatusChange} />

      <button
        type="button"
        className="history-filters__clear"
        data-visible={canClear ? 'true' : 'false'}
        disabled={!canClear}
        onClick={onClear}
      >
        <Icon name="trash" size={14} strokeWidth={1.7} />
        حذف فیلترها
      </button>
    </div>
  )
}
