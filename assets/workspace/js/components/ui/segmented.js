import { el, Fragment } from '../../native/dom.js';
import { cn } from '../../lib/utils.js';
export function Segmented({ value, options, onChange, className, size = 'md', }) {
    return (el("div", { role: "tablist", className: cn('inline-flex items-center gap-0.5 rounded-y-sm border border-y-line bg-y-surface-soft p-0.5', className) }, options.map((option) => {
        const active = option.value === value;
        return (el("button", { key: option.value, role: "tab", type: "button", "aria-selected": active, title: option.title ?? option.label, onClick: () => onChange(option.value), className: cn('inline-flex items-center gap-1.5 rounded-y-xs font-medium transition-colors duration-y-fast ease-y', size === 'sm' ? 'h-6 px-2 text-y-xs' : 'h-7 px-2.5 text-y-sm', active
                ? 'bg-y-surface-hover text-y-ink shadow-y-soft'
                : 'text-y-ink-dim hover:text-y-ink-muted') },
            option.icon,
            el("span", { className: cn(option.icon ? 'hidden sm:inline' : '') }, option.label)));
    })));
}
