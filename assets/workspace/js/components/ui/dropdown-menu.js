import { el, Fragment } from '../../native/dom.js';
import * as DropdownMenuPrimitive from '../../native/menu.js';
import { Check } from '../../icons.js';
import { withRef } from '../../native/dom.js';
import { cn } from '../../lib/utils.js';
/** RTL by default: the menu renders in a portal outside the shell, so it must
 *  not inherit the host page's direction. `dir` reaches the portalled content
 *  through Radix's own context. */
export function DropdownMenu({ dir = 'rtl', ...props }) {
    return el(DropdownMenuPrimitive.Root, { dir: dir, ...props });
}
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const contentClasses = cn(
/* Portal content lives outside the shell: re-apply the theme scope. */
'yagent-root z-[80] min-w-[12rem] max-w-[calc(100vw-1rem)] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-y-md border border-y-line bg-y-bg-elevated p-1', 'shadow-y-pop data-[state=open]:animate-y-fade-in');
export const DropdownMenuContent = withRef(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
    return (el(DropdownMenuPrimitive.Portal, null,
        el(DropdownMenuPrimitive.Content, { ref: ref, sideOffset: sideOffset, collisionPadding: 8, className: cn(contentClasses, className), ...props })));
});
export const DropdownMenuItem = withRef(function DropdownMenuItem({ className, danger = false, icon, selected = false, children, ...props }, ref) {
    return (el(DropdownMenuPrimitive.Item, { ref: ref, className: cn('flex cursor-pointer items-center gap-2.5 rounded-y-xs px-2.5 py-2 text-y-base outline-none', 'transition-colors duration-y-fast ease-y', 'data-[disabled]:pointer-events-none data-[disabled]:cursor-default data-[disabled]:opacity-50', danger
            ? 'text-y-danger data-[highlighted]:bg-y-danger-soft'
            : 'text-y-ink-muted data-[highlighted]:bg-y-surface-hover data-[highlighted]:text-y-ink', className), ...props },
        icon ? el("span", { className: "flex h-4 w-4 items-center justify-center text-y-ink-dim" }, icon) : null,
        el("span", { className: "flex-1 truncate" }, children),
        selected ? el(Check, { className: "h-3.5 w-3.5 text-y-accent" }) : null));
});
export const DropdownMenuSeparator = withRef(function DropdownMenuSeparator({ className, ...props }, ref) {
    return (el(DropdownMenuPrimitive.Separator, { ref: ref, className: cn('my-1 h-px bg-y-line', className), ...props }));
});
export function DropdownMenuLabel({ children, className }) {
    return el("div", { className: cn('px-2.5 py-1.5 text-y-xs text-y-ink-dim', className) }, children);
}
