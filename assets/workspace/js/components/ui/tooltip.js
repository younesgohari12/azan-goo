import { el, Fragment } from '../../native/dom.js';
import * as TooltipPrimitive from '../../native/tooltip.js';
import { cn } from '../../lib/utils.js';
export function TooltipProvider({ children }) {
    return (el(TooltipPrimitive.Provider, { delayDuration: 280, skipDelayDuration: 120 }, children));
}
export function Tooltip({ label, children, side = 'bottom', disabled = false, }) {
    if (disabled || !label)
        return el(Fragment, null, children);
    return (el(TooltipPrimitive.Root, null,
        el(TooltipPrimitive.Trigger, { asChild: true }, children),
        el(TooltipPrimitive.Portal, null,
            el(TooltipPrimitive.Content, { side: side, sideOffset: 8, dir: "rtl", className: cn(
                /* Portal content lives outside the shell: re-apply the theme scope. */
                'yagent-root z-[70] max-w-[16rem] rounded-y-sm border border-y-line bg-y-bg-elevated px-2.5 py-1.5', 'text-y-xs leading-6 text-y-ink-muted shadow-y-pop', 'data-[state=delayed-open]:animate-y-fade-in') }, label))));
}
