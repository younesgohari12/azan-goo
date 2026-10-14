import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx'
import './Button.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx('btn', `btn--${variant}`, `btn--${size}`, fullWidth && 'btn--full', className)}
      {...rest}
    >
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** برچسب دسترس‌پذیر (به‌عنوان tooltip هم استفاده می‌شود) */
  label: string
  size?: 'md' | 'sm'
  children: ReactNode
}

export function IconButton({ label, size = 'md', className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cx('icon-btn', `icon-btn--${size}`, className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  )
}
