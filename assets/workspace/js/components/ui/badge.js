import { el, Fragment } from '../../native/dom.js';
import { cva } from '../../vendor.js';
import { cn } from '../../lib/utils.js';
// A status badge never wraps and never shrinks: it must stay readable next to a
// long title, which is the title's job to truncate instead.
const badgeVariants = cva('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-y-xs leading-none', {
    variants: {
        variant: {
            neutral: 'border-y-line bg-y-surface-soft text-y-ink-muted',
            accent: 'border-y-accent-border bg-y-accent-soft text-y-accent',
            success: 'border-y-success/25 bg-y-success-soft text-y-success',
            warn: 'border-y-warn/25 bg-y-warn-soft text-y-warn',
            danger: 'border-y-danger/25 bg-y-danger-soft text-y-danger',
            plain: 'border-transparent bg-transparent text-y-ink-dim px-0',
        },
    },
    defaultVariants: { variant: 'neutral' },
});
export function Badge({ children, className, icon, variant }) {
    return (el("span", { className: cn(badgeVariants({ variant }), className) },
        icon,
        children));
}
/** Small coloured dot used for statuses in lists and cards. */
export function StatusDot({ tone = 'neutral', className }) {
    const tones = {
        neutral: 'bg-y-ink-dim',
        accent: 'bg-y-accent',
        success: 'bg-y-success',
        warn: 'bg-y-warn',
        danger: 'bg-y-danger',
    };
    return el("span", { className: cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', tones[tone], className) });
}
