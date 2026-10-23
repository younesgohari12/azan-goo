import { el, Fragment } from '../../native/dom.js';
import { withRef } from '../../native/dom.js';
import { cn } from '../../lib/utils.js';
export const Input = withRef(function Input({ className, ...props }, ref) {
    return (el("input", { ref: ref, className: cn('h-9 w-full rounded-y-sm border border-y-line bg-y-surface-soft px-3 text-y-base text-y-ink', 'placeholder:text-y-ink-dim transition-colors duration-y-fast ease-y', 'hover:border-y-line-strong focus:border-y-accent-border', className), ...props }));
});
export const Textarea = withRef(function Textarea({ className, ...props }, ref) {
    return (el("textarea", { ref: ref, className: cn('w-full rounded-y-md border border-y-line bg-y-surface-soft p-3 text-y-base text-y-ink', 'placeholder:text-y-ink-dim transition-colors duration-y-fast ease-y', 'hover:border-y-line-strong focus:border-y-accent-border', className), ...props }));
});
