import { Icon, type IconName } from '../../components/Icon'
import type { OperationType } from '../../data/types'
import './QuickActions.css'

type QuickActionType = OperationType | 'history'

interface QuickActionsProps {
  onSelect: (type: QuickActionType) => void
}

const ACTIONS: Array<{ type: QuickActionType; label: string; icon: IconName; primary?: boolean }> = [
  { type: 'topup', label: 'افزایش اعتبار', icon: 'plus', primary: true },
  { type: 'transfer', label: 'انتقال', icon: 'transfer' },
  { type: 'withdraw', label: 'برداشت', icon: 'withdraw' },
  { type: 'history', label: 'تاریخچه', icon: 'history' },
]

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <nav className="quick-actions" aria-label="اقدام‌های کیف پول">
      {ACTIONS.map((action) => (
        <button
          key={action.type}
          type="button"
          className="quick-action"
          data-primary={action.primary ? 'true' : 'false'}
          onClick={() => onSelect(action.type)}
        >
          <span className="quick-action__icon">
            <Icon name={action.icon} size={19} />
          </span>
          <span className="quick-action__label">{action.label}</span>
        </button>
      ))}
    </nav>
  )
}
