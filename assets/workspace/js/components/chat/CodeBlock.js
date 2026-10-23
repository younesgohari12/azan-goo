import { el, Fragment } from '../../native/dom.js';
import { Check, Copy } from '../../icons.js';
import { afterRender, reference, stateCell } from '../../native/dom.js';
import { cn } from '../../lib/utils.js';
/**
 * Code block with language label, copy action and horizontal scrolling.
 * The content keeps its own LTR direction inside the RTL interface.
 */
export function CodeBlock({ code, language }) {
    const [copied, setCopied] = stateCell(false);
    const timer = reference();
    afterRender(() => () => window.clearTimeout(timer.current), []);
    async function copy() {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            timer.current = window.setTimeout(() => setCopied(false), 1600);
        }
        catch {
            setCopied(false);
        }
    }
    return (el("div", { className: "my-3 overflow-hidden rounded-y-md border border-y-line bg-[#17171b]" },
        el("div", { className: "flex items-center justify-between gap-2 border-b border-y-line px-3 py-1.5" },
            el("span", { className: "yagent-ltr text-y-xs text-y-ink-dim" }, language || 'code'),
            el("button", { type: "button", onClick: () => void copy(), className: cn('inline-flex items-center gap-1.5 rounded-y-xs px-2 py-1 text-y-xs transition-colors duration-y-fast', copied ? 'text-y-success' : 'text-y-ink-dim hover:bg-y-surface-hover hover:text-y-ink') },
                copied ? el(Check, { className: "h-3 w-3" }) : el(Copy, { className: "h-3 w-3" }),
                copied ? 'کپی شد' : 'کپی')),
        el("pre", { className: "yagent-ltr max-h-[26rem] overflow-auto p-3 text-[12.5px] leading-6 text-[#d8d8e0]" },
            el("code", { className: "font-mono" }, code))));
}
