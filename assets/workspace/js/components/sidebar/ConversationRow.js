import { el, Fragment } from '../../native/dom.js';
import { Check, MoreHorizontal, Pencil, Pin, PinOff, Trash2, X } from '../../icons.js';
import { afterRender, reference, stateCell } from '../../native/dom.js';
import { StatusDot } from '../ui/badge.js';
import { IconButton } from '../ui/button.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from '../ui/dropdown-menu.js';
import { Tooltip } from '../ui/tooltip.js';
import { cn, fa, truncate } from '../../lib/utils.js';
export function ConversationRow({ conversation, selected, compact, busy, onSelect, onRename, onTogglePin, onDelete, }) {
    const [renaming, setRenaming] = stateCell(false);
    const [draft, setDraft] = stateCell(conversation.title);
    const inputRef = reference(null);
    afterRender(() => {
        if (renaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [renaming]);
    function commit() {
        const value = draft.trim();
        setRenaming(false);
        if (value && value !== conversation.title)
            onRename(value);
        setDraft(conversation.title);
    }
    if (compact) {
        return (el(Tooltip, { label: conversation.title, side: "left" },
            el("button", { type: "button", onClick: onSelect, className: cn('mx-auto flex h-9 w-9 items-center justify-center rounded-y-sm text-y-sm font-medium', 'transition-colors duration-y-fast ease-y', selected
                    ? 'bg-y-surface text-y-ink'
                    : 'text-y-ink-dim hover:bg-y-surface-soft hover:text-y-ink-muted') }, conversation.pinned ? el(Pin, { className: "h-3.5 w-3.5" }) : conversation.title.trim().charAt(0) || 'گ')));
    }
    if (renaming) {
        return (el("div", { className: "flex items-center gap-1.5 rounded-y-sm bg-y-surface px-2 py-1.5" },
            el("input", { ref: inputRef, value: draft, onChange: (event) => setDraft(event.target.value), onBlur: commit, onKeyDown: (event) => {
                    if (event.key === 'Enter')
                        commit();
                    if (event.key === 'Escape') {
                        setDraft(conversation.title);
                        setRenaming(false);
                    }
                }, className: "h-7 min-w-0 flex-1 bg-transparent text-y-base text-y-ink outline-none" }),
            el(IconButton, { label: "\u0630\u062E\u06CC\u0631\u0647\u0654 \u0646\u0627\u0645", size: "xs", onClick: commit },
                el(Check, { className: "h-3.5 w-3.5 text-y-success" })),
            el(IconButton, { label: "\u0644\u063A\u0648", size: "xs", onClick: () => {
                    setDraft(conversation.title);
                    setRenaming(false);
                } },
                el(X, { className: "h-3.5 w-3.5" }))));
    }
    return (el("div", { className: cn('group relative flex items-center rounded-y-sm transition-colors duration-y-fast ease-y', selected ? 'bg-y-surface' : 'hover:bg-y-surface-soft') },
        el("button", { type: "button", onClick: onSelect, title: conversation.title, className: "flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-start" },
            conversation.pinned ? el(Pin, { className: "h-3 w-3 shrink-0 text-y-accent/80" }) : null,
            el("span", { className: cn('truncate text-y-base', selected ? 'text-y-ink' : 'text-y-ink-muted') }, truncate(conversation.title, 42)),
            busy ? el(StatusDot, { tone: "accent", className: "ms-auto animate-y-blink" }) : null),
        el("div", { className: "absolute end-1 flex items-center opacity-0 transition-opacity duration-y-fast group-hover:opacity-100 group-focus-within:opacity-100" },
            el(DropdownMenu, null,
                el(DropdownMenuTrigger, { asChild: true },
                    el(IconButton, { label: "\u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u06AF\u0641\u062A\u06AF\u0648", size: "xs", className: "bg-y-sidebar/90 backdrop-blur data-[state=open]:opacity-100", onClick: (event) => event.stopPropagation() },
                        el(MoreHorizontal, { className: "h-3.5 w-3.5" }))),
                el(DropdownMenuContent, { align: "start", className: "min-w-[11rem]" },
                    el(DropdownMenuItem, { icon: el(Pencil, { className: "h-3.5 w-3.5" }), onSelect: () => setRenaming(true) }, "\u062A\u063A\u06CC\u06CC\u0631 \u0646\u0627\u0645"),
                    el(DropdownMenuItem, { icon: conversation.pinned ? el(PinOff, { className: "h-3.5 w-3.5" }) : el(Pin, { className: "h-3.5 w-3.5" }), onSelect: onTogglePin }, conversation.pinned ? 'برداشتن سنجاق' : 'سنجاق‌کردن'),
                    el(DropdownMenuSeparator, null),
                    el(DropdownMenuItem, { danger: true, icon: el(Trash2, { className: "h-3.5 w-3.5" }), onSelect: onDelete }, "\u062D\u0630\u0641 \u06AF\u0641\u062A\u06AF\u0648"))))));
}
export function ConversationGroupHeader({ label, count }) {
    return (el("div", { className: "flex items-center justify-between px-2.5 pb-1.5 pt-4" },
        el("span", { className: "text-y-xs font-medium text-y-ink-dim" }, label),
        el("span", { className: "yagent-num text-y-xs text-y-ink-dim" }, fa(count))));
}
