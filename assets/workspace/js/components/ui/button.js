import { el, Fragment } from '../../native/dom.js';
import { Slot } from '../../native/slot.js';
import { cva } from '../../vendor.js';
import { withRef } from '../../native/dom.js';
import { cn } from '../../lib/utils.js';
const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-y-sm font-medium ' +
    'transition-[background-color,color,box-shadow,opacity] duration-y ease-y ' +
    'disabled:pointer-events-none disabled:opacity-50 select-none', {
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
});
export const Button = withRef(function Button({ className, variant, size, shape, asChild = false, ...props }, ref) {
    const Component = asChild ? Slot : 'button';
    return el(Component, { ref: ref, className: cn(buttonVariants({ variant, size, shape }), className), ...props });
});
const iconSizes = {
    xs: 'h-7 w-7',
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
};
/** Square, quiet icon control used across the toolbar, sidebar and composer. */
export const IconButton = withRef(function IconButton({ className, label, size = 'sm', variant = 'ghost', ...props }, ref) {
    return (el(Button, { ref: ref, "aria-label": label, title: label, variant: variant, size: "icon", className: cn('shrink-0 rounded-y-sm p-0 [&>svg]:shrink-0', iconSizes[size], className), ...props }));
});
