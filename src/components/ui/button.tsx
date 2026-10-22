import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-y-sm font-medium ' +
    'transition-[background-color,color,box-shadow,opacity] duration-y ease-y ' +
    'disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-y-accent text-white hover:bg-y-accent-hover shadow-y-soft',
        secondary: 'bg-y-surface text-y-ink hover:bg-y-surface-hover border border-y-line',
        outline: 'border border-y-line-strong bg-transparent text-y-ink hover:bg-y-surface-hover',
        ghost: 'bg-transparent text-y-ink-muted hover:bg-y-surface-hover hover:text-y-ink',
        success: 'bg-y-success text-[#062018] hover:brightness-105 shadow-y-soft',
        danger: 'bg-y-danger-soft text-y-danger border border-y-danger/25 hover:bg-y-danger/20',
        link: 'text-y-accent hover:text-y-accent-hover underline-offset-4 hover:underline px-0',
      },
      size: {
        sm: 'h-8 px-3 text-y-sm',
        md: 'h-9 px-3.5 text-y-base',
        lg: 'h-11 px-5 text-y-md',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
        'icon-lg': 'h-10 w-10',
      },
      shape: {
        default: '',
        pill: 'rounded-full',
        capsule: 'rounded-full',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md', shape: 'default' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, shape, asChild = false, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'button'
  return <Component ref={ref} className={cn(buttonVariants({ variant, size, shape }), className)} {...props} />
})

export interface IconButtonProps extends Omit<ButtonProps, 'size' | 'shape'> {
  label: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const iconSizes: Record<NonNullable<IconButtonProps['size']>, string> = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
}

/** Square, quiet icon control used across the toolbar, sidebar and composer. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, size = 'sm', variant = 'ghost', ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      aria-label={label}
      title={label}
      variant={variant}
      className={cn('shrink-0 rounded-y-sm', iconSizes[size], className)}
      {...props}
    />
  )
})
