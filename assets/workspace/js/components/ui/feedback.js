import { el, Fragment } from '../../native/dom.js';
import { cn } from '../../lib/utils.js';
/** Thin, always-smooth spinner used for active steps. */
export function Spinner({ className, size = 16 }) {
    return (el("span", { role: "status", "aria-label": "\u062F\u0631 \u062D\u0627\u0644 \u0627\u0646\u062C\u0627\u0645", style: { width: size, height: size }, className: cn('inline-block animate-spin rounded-full border-y-[1.5px] border-y-ink-dim/35 border-t-y-accent', className) }));
}
export function ProgressBar({ percent, tone = 'accent', className }) {
    const tones = {
        accent: 'bg-y-accent',
        success: 'bg-y-success',
        danger: 'bg-y-danger',
    };
    return (el("div", { className: cn('h-1 w-full overflow-hidden rounded-full bg-y-surface-hover', className) },
        el("div", { className: cn('h-full rounded-full transition-[width] duration-y-slow ease-y', tones[tone]), style: { width: `${Math.max(0, Math.min(100, percent))}%` } })));
}
/** Rotating accent arc with a breathing core: the active-step marker. */
export function WorkingRing({ size = 18, className }) {
    return (el("span", { role: "status", "aria-label": "در حال انجام", style: { width: size, height: size }, className: cn('yagent-ring', className) },
        el("span", { className: "yagent-ring-dot" })));
}
/** Indeterminate sweep for work whose length is not known yet. */
export function ShimmerBar({ className }) {
    return el("span", { "aria-hidden": true, className: cn('yagent-shimmer', className) });
}
