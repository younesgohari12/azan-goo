import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-y-sm font-medium ' +
    'transition-[background-color,color,box-shadow,opacity] duration-y ease-y ' +
    // `opacity-45` is declared in the theme (the default scale has no 45).
    'disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        // Filled states use the deeper accent so a white label keeps ≥4.5:1.
        primary: 'bg-y-accent-strong text-white hover:bg-y-accent-strong-hover shadow-y-soft',
        secondary: 'border border-y-line bg-y-surface text-y-ink hover:bg-y-surface-hover',
        outline: 'border border-y-line-strong bg-transparent text-y-ink hover:bg-y-surface-hover',
        ghost: 'bg-transparent text-y-ink-muted hover:bg-y-surface-hover hover:text-y-ink',
        success: 'bg-y-success text-[#062018] hover:brightness-105 shadow-y-soft',
        danger: 'border border-y-danger/35 bg-y-danger-soft text-y-danger hover:bg-y-danger/20',
        link: 'px-0 text-y-accent underline-offset-4 hover:text-y-accent-hover hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-y-sm',
        md: 'h-9 px-3.5 text-y-base',
        lg: 'h-11 px-5 text-y-md',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
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
  xs: 'h-8 w-8',
  sm: 'h-9 w-9',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
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
