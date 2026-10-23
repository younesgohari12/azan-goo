import { el, Fragment } from '../../native/dom.js';
import { LogOut, PanelRightClose, PanelRightOpen, Plus, Search, Settings, Sparkles, X, } from '../../icons.js';
import { memoValue } from '../../native/dom.js';
import { ConversationGroupHeader, ConversationRow } from './ConversationRow.js';
import { Badge } from '../ui/badge.js';
import { Button, IconButton } from '../ui/button.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '../ui/dropdown-menu.js';
import { Input } from '../ui/field.js';
import { Tooltip } from '../ui/tooltip.js';
import { DATE_GROUPS, cn, dateGroupOf, fa } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
export function YAgentMark({ className }) {
    return (el("span", { className: cn('flex items-center justify-center rounded-y-sm bg-y-accent-soft text-y-accent ring-1 ring-inset ring-y-accent-border/50', className) },
        el("svg", { viewBox: "0 0 24 24", className: "h-[55%] w-[55%]", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round" },
            el("path", { d: "M6 4.5l6 7.2 6-7.2" }),
            el("path", { d: "M12 11.7v7.8" }))));
}
const SUGGESTIONS_HINT = 'YAgent روی سایت تو کار می‌کند؛ ساخت صفحه، افزونه و اصلاح بصری.';
export function ChatSidebar({ collapsed = false, onToggleCollapse, onSelectConversation, }) {
    const { state, actions, derived } = useYAgent();
    const { conversations, searchQuery } = state;
    const groups = memoValue(() => {
        const query = searchQuery.trim().toLowerCase();
        const visible = query
            ? conversations.filter((conversation) => conversation.title.toLowerCase().includes(query))
            : conversations;
        const pinned = visible.filter((conversation) => conversation.pinned);
        const sections = DATE_GROUPS.map((label) => ({
            label,
            items: visible.filter((conversation) => !conversation.pinned && dateGroupOf(conversation.updatedAt) === label),
        })).filter((section) => section.items.length > 0);
        return { pinned, sections, total: visible.length, searching: query.length > 0 };
    }, [conversations, searchQuery]);
    const runningConversationId = derived.running ? state.activeConversationId : null;
    if (collapsed) {
        return (el("aside", { className: "flex h-full w-full flex-col items-center gap-1 bg-y-sidebar py-3" },
            el(YAgentMark, { className: "h-8 w-8" }),
            el("div", { className: "my-1 h-px w-6 bg-y-line" }),
            el(Tooltip, { label: "\u06AF\u0641\u062A\u06AF\u0648\u06CC \u062C\u062F\u06CC\u062F", side: "left" },
                el(IconButton, { label: "\u06AF\u0641\u062A\u06AF\u0648\u06CC \u062C\u062F\u06CC\u062F", size: "md", variant: "secondary", onClick: () => void actions.newConversation() },
                    el(Plus, { className: "h-4 w-4" }))),
            el(Tooltip, { label: "\u0646\u0645\u0627\u06CC\u0634 \u062A\u0627\u0631\u06CC\u062E\u0686\u0647", side: "left" },
                el(IconButton, { label: "\u0646\u0645\u0627\u06CC\u0634 \u062A\u0627\u0631\u06CC\u062E\u0686\u0647", size: "md", onClick: onToggleCollapse },
                    el(PanelRightOpen, { className: "h-4 w-4" }))),
            el("div", { className: "yagent-scroll mt-2 flex flex-1 flex-col items-center gap-1 overflow-y-auto px-2" }, conversations.slice(0, 14).map((conversation) => (el(ConversationRow, { key: conversation.id, conversation: conversation, selected: conversation.id === state.activeConversationId, compact: true, busy: conversation.id === runningConversationId, onSelect: () => {
                    actions.selectConversation(conversation.id);
                    onSelectConversation?.();
                }, onRename: (title) => void actions.renameConversation(conversation.id, title), onTogglePin: () => void actions.togglePin(conversation.id), onDelete: () => actions.requestDelete(conversation.id) })))),
            el(AccountMenu, { collapsed: true })));
    }
    return (el("aside", { className: "flex h-full w-full flex-col bg-y-sidebar" },
        el("header", { className: "flex items-center gap-2 px-3 pb-2 pt-4" },
            el(YAgentMark, { className: "h-8 w-8" }),
            el("div", { className: "min-w-0 flex-1" },
                el("div", { className: "yagent-ltr text-start text-y-md font-semibold text-y-ink" }, "YAgent"),
                el("div", { className: "truncate text-y-xs text-y-ink-dim" }, "\u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u0648\u0631\u062F\u067E\u0631\u0633")),
            onToggleCollapse ? (el(Tooltip, { label: "\u062C\u0645\u0639\u200C\u06A9\u0631\u062F\u0646 \u0633\u0627\u06CC\u062F\u0628\u0627\u0631", side: "bottom" },
                el(IconButton, { label: "\u062C\u0645\u0639\u200C\u06A9\u0631\u062F\u0646 \u0633\u0627\u06CC\u062F\u0628\u0627\u0631", onClick: onToggleCollapse },
                    el(PanelRightClose, { className: "h-4 w-4" })))) : null),
        el("div", { className: "space-y-2 px-3" },
            el("div", { className: "relative" },
                el(Search, { className: "pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-y-ink-dim" }),
                el(Input, { value: searchQuery, onChange: (event) => actions.setSearch(event.target.value), "aria-label": "جستجو در گفتگوها", placeholder: "\u062C\u0633\u062A\u200C\u0648\u062C\u0648 \u062F\u0631 \u06AF\u0641\u062A\u06AF\u0648\u0647\u0627", className: "h-9 border-transparent bg-y-surface-soft pe-8" }),
                searchQuery ? (el(IconButton, { label: "\u067E\u0627\u06A9\u200C\u06A9\u0631\u062F\u0646 \u062C\u0633\u062A\u200C\u0648\u062C\u0648", size: "xs", className: "absolute start-1 top-1/2 -translate-y-1/2", onClick: () => actions.setSearch('') },
                    el(X, { className: "h-3.5 w-3.5" }))) : null),
            el(Button, { variant: "secondary", className: "w-full justify-start border-y-line-strong bg-transparent text-y-ink hover:bg-y-accent-soft", onClick: () => {
                    void actions.newConversation();
                    onSelectConversation?.();
                } },
                el(Plus, { className: "h-4 w-4 text-y-accent" }),
                "\u06AF\u0641\u062A\u06AF\u0648\u06CC \u062C\u062F\u06CC\u062F")),
        el("div", { className: "yagent-scroll mt-1 flex-1 px-2 pb-2" },
            groups.total === 0 ? (el("div", { className: "px-2.5 pt-6 text-center text-y-sm leading-7 text-y-ink-dim" }, groups.searching ? 'گفتگویی با این عنوان پیدا نشد.' : 'هنوز گفتگویی نداری. یک گفتگوی جدید بساز.')) : null,
            groups.pinned.length > 0 ? (el(Fragment, null,
                el(ConversationGroupHeader, { label: "\u0633\u0646\u062C\u0627\u0642\u200C\u0634\u062F\u0647", count: groups.pinned.length }),
                el("div", { className: "space-y-0.5" }, groups.pinned.map((conversation) => (el(ConversationRow, { key: conversation.id, conversation: conversation, selected: conversation.id === state.activeConversationId, compact: false, busy: conversation.id === runningConversationId, onSelect: () => {
                        actions.selectConversation(conversation.id);
                        onSelectConversation?.();
                    }, onRename: (title) => void actions.renameConversation(conversation.id, title), onTogglePin: () => void actions.togglePin(conversation.id), onDelete: () => actions.requestDelete(conversation.id) })))))) : null,
            groups.sections.map((section) => (el("div", { key: section.label },
                el(ConversationGroupHeader, { label: section.label, count: section.items.length }),
                el("div", { className: "space-y-0.5" }, section.items.map((conversation) => (el(ConversationRow, { key: conversation.id, conversation: conversation, selected: conversation.id === state.activeConversationId, compact: false, busy: conversation.id === runningConversationId, onSelect: () => {
                        actions.selectConversation(conversation.id);
                        onSelectConversation?.();
                    }, onRename: (title) => void actions.renameConversation(conversation.id, title), onTogglePin: () => void actions.togglePin(conversation.id), onDelete: () => actions.requestDelete(conversation.id) }))))))),
            el("p", { className: "px-2.5 pt-6 text-y-xs leading-6 text-y-ink-dim" }, SUGGESTIONS_HINT)),
        el("div", { className: "border-t border-y-line p-2" },
            el(AccountMenu, null))));
}
function AccountMenu({ collapsed = false }) {
    const settings = window.YAgentUI || {};
    return el('div', { className: 'mt-auto border-t border-y-line p-3' },
        el('a', { href: settings.settingsUrl, target: '_blank', rel: 'noopener noreferrer', title: 'تنظیمات YAgent', className: 'flex items-center gap-2 text-y-ink-muted' },
            el(Settings, { className: 'h-4 w-4 shrink-0' }),
            !collapsed ? el('span', { className: 'min-w-0 flex-1' },
                el('span', { className: 'block truncate text-y-base text-y-ink' }, settings.userName || 'مدیر سایت'),
                el('span', { className: 'block truncate text-y-xs text-y-ink-dim' }, 'تنظیمات و مدیریت · ' + settings.version)) : null));
}
