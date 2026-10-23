import { el, Fragment } from '../../native/dom.js';
import { memo } from '../../native/dom.js';
import Markdown from '../../native/markdown.js';

import { CodeBlock } from './CodeBlock.js';
import { cn } from '../../lib/utils.js';
function extractText(node) {
    if (node === null || node === undefined || typeof node === 'boolean')
        return '';
    if (typeof node === 'string' || typeof node === 'number')
        return String(node);
    if (Array.isArray(node))
        return node.map(extractText).join('');
    if (typeof node === 'object') {
        const props = node.props;
        if (props)
            return extractText(props.children);
    }
    return '';
}
const components = {
    p: ({ children }) => el("p", { className: "my-2.5 text-y-chat text-y-ink/95" }, children),
    h1: ({ children }) => el("h1", { className: "mb-2 mt-5 text-y-xl font-semibold text-y-ink" }, children),
    h2: ({ children }) => el("h2", { className: "mb-2 mt-5 text-y-lg font-semibold text-y-ink" }, children),
    h3: ({ children }) => el("h3", { className: "mb-1.5 mt-4 text-y-md font-semibold text-y-ink" }, children),
    h4: ({ children }) => el("h4", { className: "mb-1.5 mt-3 text-y-base font-semibold text-y-ink" }, children),
    ul: ({ children }) => el("ul", { className: "my-2.5 list-disc space-y-1.5 ps-5 text-y-chat" }, children),
    ol: ({ children }) => el("ol", { className: "my-2.5 list-decimal space-y-1.5 ps-5 text-y-chat" }, children),
    li: ({ children }) => el("li", { className: "marker:text-y-ink-dim" }, children),
    strong: ({ children }) => el("strong", { className: "font-semibold text-y-ink" }, children),
    em: ({ children }) => el("em", { className: "italic text-y-ink/90" }, children),
    a: ({ children, href }) => (el("a", { href: href, target: "_blank", rel: "noreferrer", className: "yagent-ltr inline break-all text-y-accent underline decoration-y-accent/40 underline-offset-2 transition-colors duration-y-fast hover:text-y-accent-hover" }, children)),
    blockquote: ({ children }) => (el("blockquote", { className: "my-3 border-s-2 border-y-accent-border ps-3 text-y-chat text-y-ink-muted" }, children)),
    hr: () => el("hr", { className: "my-4 border-t border-y-line" }),
    code: ({ children }) => (el("code", { className: "yagent-ltr inline-block max-w-full break-all rounded-y-xs bg-y-surface px-1.5 py-0.5 align-middle font-mono text-[13px] text-y-ink" }, children)),
    pre: ({ children }) => {
        const child = Array.isArray(children) ? children[0] : children;
        const className = child?.props?.className ?? '';
        const language = /language-([\w-]+)/.exec(className)?.[1];
        const code = extractText(child?.props?.children).replace(/\n$/, '');
        return el(CodeBlock, { code: code, language: language });
    },
    table: ({ children }) => (el("div", { className: "yagent-scroll my-3 overflow-x-auto rounded-y-md border border-y-line" },
        el("table", { className: "w-full min-w-[26rem] border-collapse text-y-sm" }, children))),
    thead: ({ children }) => el("thead", { className: "bg-y-surface-soft" }, children),
    th: ({ children }) => (el("th", { className: "border-b border-y-line px-3 py-2 text-start font-medium text-y-ink-muted" }, children)),
    td: ({ children }) => (el("td", { className: "border-b border-y-line px-3 py-2 text-start align-top text-y-ink/90" }, children)),
};
export const MarkdownContent = memo(function MarkdownContent({ text, className, }) {
    return (el("div", { className: cn('yagent-md break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className), dir: "rtl" },
        el(Markdown, { components: components }, text)));
});
