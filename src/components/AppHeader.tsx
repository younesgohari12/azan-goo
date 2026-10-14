import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { IconButton } from './Button'
import './AppHeader.css'

interface AppHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backLabel?: string
  aside?: ReactNode
}

export function AppHeader({ title, subtitle, onBack, backLabel = 'بازگشت', aside }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__row">
        {onBack ? (
          <IconButton label={backLabel} onClick={onBack}>
            <Icon name="chevron-right" size={18} />
          </IconButton>
        ) : (
          <span className="app-header__spacer" />
        )}
        <div className="app-header__titles">
          <h1 className="app-header__title">{title}</h1>
          {subtitle ? <p className="app-header__subtitle">{subtitle}</p> : null}
        </div>
        <div className="app-header__aside">{aside}</div>
      </div>
    </header>
  )
}
