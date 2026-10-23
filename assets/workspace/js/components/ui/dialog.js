import { el, Fragment } from '../../native/dom.js';
import * as DialogPrimitive from '../../native/dialog.js';
import { X } from '../../icons.js';
import { IconButton } from './button.js';
import { cn } from '../../lib/utils.js';
export const Dialog = DialogPrimitive.Root;
export const DialogClose = DialogPrimitive.Close;
/** Shared portal surface class: Radix portals render into <body>, outside the
 *  shell, so each one re-applies the theme scope and the RTL direction. */
const portalSurface = 'yagent-root';
function Overlay({ className }) {
    return (el(DialogPrimitive.Overlay, { className: cn('fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]', 'data-[state=open]:animate-y-fade-in', className) }));
}
/** Centered dialog used for confirmations (delete conversation, publish). */
export function DialogContent({ title, description, children, footer, className, }) {
    return (el(DialogPrimitive.Portal, null,
        el(Overlay, null),
        el("div", { className: cn('pointer-events-none fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4', 'pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]') },
            el(DialogPrimitive.Content, { dir: "rtl", className: cn(portalSurface, 'pointer-events-auto flex max-h-full w-full max-w-[30rem] flex-col overflow-hidden', 'rounded-y-lg border border-y-line bg-y-bg-elevated shadow-y-pop outline-none', 'data-[state=open]:animate-y-dialog-in', className) },
                el("div", { className: "flex shrink-0 items-start justify-between gap-3 p-4 pb-3 sm:p-5 sm:pb-3" },
                    el("div", { className: "min-w-0 space-y-1.5" },
                        el(DialogPrimitive.Title, { className: "text-y-lg font-semibold text-y-ink" }, title),
                        description ? (el(DialogPrimitive.Description, { className: "text-y-base leading-7 text-y-ink-muted" }, description)) : null),
                    el(DialogPrimitive.Close, { asChild: true },
                        el(IconButton, { label: "\u0628\u0633\u062A\u0646", size: "sm", variant: "secondary", className: "border-y-line bg-y-surface text-y-ink-muted hover:text-y-ink" },
                            el(X, { className: "h-4 w-4" })))),
                children ? (el("div", { className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 sm:px-5" }, children)) : null,
                footer ? (el("div", { className: "flex shrink-0 items-center justify-end gap-2 border-t border-y-line px-4 py-3 sm:px-5" }, footer)) : null))));
}
/** Side sheet for mobile drawers and the desktop overlay panel. Every sheet
 *  carries its own visible title and close button, so it is always obvious how
 *  to leave it. */
export function Sheet({ open, onOpenChange, side = 'right', title, children, className, }) {
    return (el(DialogPrimitive.Root, { open: open, onOpenChange: onOpenChange },
        el(DialogPrimitive.Portal, null,
            el(Overlay, null),
            el(DialogPrimitive.Content, { "aria-label": title, dir: "rtl", className: cn(portalSurface, 'fixed inset-y-0 z-[65] flex w-[min(20rem,88vw)] max-w-[88vw] flex-col overflow-hidden bg-y-bg shadow-y-pop outline-none', 'pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]', side === 'right' ? 'right-0 border-l border-y-line' : 'left-0 border-r border-y-line', 'transition-transform duration-[220ms] ease-y', side === 'right'
                    ? 'data-[state=closed]:translate-x-full data-[state=open]:translate-x-0'
                    : 'data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0', className) },
                el("div", { className: "flex shrink-0 items-center gap-2 border-b border-y-line bg-y-bg-elevated px-3 py-2" },
                    el(DialogPrimitive.Title, { className: "flex-1 truncate text-y-sm font-medium text-y-ink-muted" }, title),
                    el(DialogPrimitive.Close, { asChild: true },
                        el(IconButton, { label: "\u0628\u0633\u062A\u0646", size: "md", variant: "secondary", className: "border-y-line bg-y-surface text-y-ink-muted hover:text-y-ink" },
                            el(X, { className: "h-4 w-4" })))),
                el("div", { className: "flex min-h-0 flex-1 flex-col" }, children)))));
}
