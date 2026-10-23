import { el, Fragment } from '../../native/dom.js';
import { ArrowDown } from '../../icons.js';
import { afterRender, reference, stateCell } from '../../native/dom.js';
import { EmptyState } from './EmptyState.js';
import { MessageItem } from './MessageItem.js';
import { cn } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/** Chat column: independent, controlled scrolling with a sticky composer below. */
export function ChatThread() {
    const { derived } = useYAgent();
    const scrollRef = reference(null);
    const [atBottom, setAtBottom] = stateCell(true);
    const messages = derived.messages;
    // A cheap signature lets us react to deltas, status changes and new cards.
    const signature = `${messages.length}:${messages.map((message) => `${message.id}-${message.text?.length ?? 0}-${message.status}`).join('|')}`;
    afterRender(() => {
        if (messages.length === 0) {
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            return;
        }
        if (!atBottom)
            return;
        const element = scrollRef.current;
        if (!element)
            return;
        element.scrollTop = element.scrollHeight;
    }, [signature, atBottom]);
    afterRender(() => {
        setAtBottom(true);
    }, [derived.activeConversation?.id]);
    function handleScroll() {
        const element = scrollRef.current;
        if (!element)
            return;
        setAtBottom(element.scrollHeight - element.scrollTop - element.clientHeight < 96);
    }
    function scrollToBottom() {
        const element = scrollRef.current;
        if (!element)
            return;
        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    }
    return (el("div", { className: "relative flex min-h-0 flex-1 flex-col" },
        el("div", { ref: scrollRef, onScroll: handleScroll, className: "yagent-scroll flex flex-1 flex-col" }, messages.length === 0 ? (el(EmptyState, null)) : (el("div", { className: "mx-auto w-full max-w-[var(--y-reading-w)] space-y-0.5 px-4 py-4 sm:px-6 sm:py-6" },
            messages.map((message) => (el(MessageItem, { key: message.id, message: message }))),
            el("div", { className: "h-2" })))),
        !atBottom && messages.length > 0 ? (el("button", { type: "button", onClick: scrollToBottom, "aria-label": "\u0631\u0641\u062A\u0646 \u0628\u0647 \u0622\u062E\u0631\u06CC\u0646 \u067E\u06CC\u0627\u0645", className: cn('absolute bottom-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full', 'border border-y-line-strong bg-y-surface text-y-ink-muted shadow-y-pop', 'transition-colors duration-y-fast hover:text-y-ink') },
            el(ArrowDown, { className: "h-4 w-4" }))) : null));
}
