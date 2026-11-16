import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95 border border-transparent',
  secondary:
    'bg-muted text-foreground hover:bg-muted/70 border border-transparent',
  outline:
    'border border-border bg-card text-foreground hover:bg-muted/60 hover:border-border',
  ghost: 'text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent',
  danger: 'bg-danger text-danger-foreground shadow-sm hover:bg-danger/90 border border-transparent',
  success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90 border border-transparent',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-[13px] gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
  icon: 'h-9 w-9 justify-center rounded-lg',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', loading, startIcon, endIcon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'focus-ring inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : startIcon}
      {children}
      {endIcon}
    </button>
  )
})

export function IconButton({ className, variant = 'ghost', ...props }: ButtonProps) {
  return <Button size="icon" variant={variant} className={className} {...props} />
}
