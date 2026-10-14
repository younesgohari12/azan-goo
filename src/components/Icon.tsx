import type { JSX } from 'react'

export type IconName =
  | 'plus'
  | 'transfer'
  | 'withdraw'
  | 'history'
  | 'wallet'
  | 'eye'
  | 'eye-off'
  | 'chevron-right'
  | 'chevron-left'
  | 'close'
  | 'check'
  | 'clock'
  | 'alert'
  | 'search'
  | 'user'
  | 'card'
  | 'receipt'

/** آیکون‌های خطی یکدست روی شبکهٔ ۲۴ با ضخامت یکسان */
const PATHS: Record<IconName, JSX.Element> = {
  plus: (
    <>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </>
  ),
  transfer: (
    <>
      <path d="M4.5 9h12.2" />
      <path d="M13.6 5.9 16.7 9l-3.1 3.1" />
      <path d="M19.5 15H7.3" />
      <path d="M10.4 11.9 7.3 15l3.1 3.1" />
    </>
  ),
  withdraw: (
    <>
      <path d="M12 19V6" />
      <path d="M7.6 10.4 12 6l4.4 4.4" />
      <path d="M5 21.2h14" />
    </>
  ),
  history: (
    <>
      <path d="M3.6 12a8.4 8.4 0 1 0 2.5-6" />
      <path d="M3.3 4.4v3.9h3.9" />
      <path d="M12 7.8V12l3 1.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.6A2.6 2.6 0 0 1 6.6 5H17a2 2 0 0 1 2 2v9.4a2 2 0 0 1-2 2H6.6A2.6 2.6 0 0 1 4 15.8V7.6Z" />
      <path d="M19 11h-3.1a1.5 1.5 0 0 0 0 3H19" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6.1 5.6 12 5.6 21.5 12 21.5 12 17.9 18.4 12 18.4 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.7" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M4 4.5 20 20" />
      <path d="M9.8 6A10 10 0 0 1 12 5.8c5.9 0 9.5 6.2 9.5 6.2a17.8 17.8 0 0 1-3.3 4.1" />
      <path d="M6.6 8.2A17.6 17.6 0 0 0 2.5 12s3.6 6.2 9.5 6.2c1.5 0 2.8-.3 4-.9" />
      <path d="M9.7 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  'chevron-right': <path d="M9.6 5.6 16 12l-6.4 6.4" />,
  'chevron-left': <path d="M14.4 5.6 8 12l6.4 6.4" />,
  close: (
    <>
      <path d="M6.4 6.4 17.6 17.6" />
      <path d="M17.6 6.4 6.4 17.6" />
    </>
  ),
  check: <path d="M5.2 12.6 9.8 17.2 18.8 7.4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3 1.8" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.4 3.6 19h16.8L12 4.4Z" />
      <path d="M12 10v4" />
      <path d="M12 16.6h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.4" />
      <path d="M15.8 15.8 20 20" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.6" r="3.5" />
      <path d="M5.6 20c0-3.4 2.9-5.6 6.4-5.6s6.4 2.2 6.4 5.6" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.6" width="18" height="12.8" rx="2.6" />
      <path d="M3 10.2h18" />
    </>
  ),
  receipt: (
    <>
      <path d="M6.2 3.6h11.6v16.8l-2.9-1.6-2.9 1.6-2.9-1.6-2.9 1.6V3.6Z" />
      <path d="M9.2 8.4h5.6" />
      <path d="M9.2 12.4h5.6" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}

export function Icon({ name, size = 20, strokeWidth = 1.6, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
