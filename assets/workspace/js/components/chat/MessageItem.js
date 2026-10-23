import { el, Fragment } from '../../native/dom.js';
import { AlertCircle, Ban, Check, Copy, MessageSquareWarning } from '../../icons.js';
import { motion } from '../../native/motion.js';
import { afterRender, reference, stateCell } from '../../native/dom.js';
import { AttachmentChip } from './AttachmentChips.js';
import { MarkdownContent } from './MarkdownContent.js';
import { ActivityBlock } from '../activity/ActivityBlock.js';
import { ApprovalCard } from '../approval/ApprovalCard.js';
import { ResultCard } from '../approval/ResultCard.js';
import { ANNOTATION_STATUS_META } from '../preview/annotationStatus.js';
import { Badge } from '../ui/badge.js';
import { IconButton } from '../ui/button.js';
import { cn, fa, formatClock } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/** Routes a message to the right presentation for its kind. */
export function MessageItem({ message }) {
    if (message.kind === 'activity' && message.taskId)
        return el(ActivityBlock, { taskId: message.taskId });
    if (message.kind === 'approval' && message.approvalId)
        return el(ApprovalCard, { approvalId: message.approvalId });
    if (message.kind === 'result' && message.resultId)
        return el(ResultCard, { resultId: message.resultId });
    if (message.kind === 'feedback')
        return el(FeedbackMessageCard, { message: message });
    return message.role === 'user' ? el(UserMessage, { message: message }) : el(AssistantMessage, { message: message });
}
function UserMessage({ message }) {
    return (el(motion.div, { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }, className: "flex justify-start py-1.5" },
        el("div", { className: "max-w-[88%] rounded-y-lg rounded-ss-sm bg-y-surface px-3.5 py-2.5" },
            message.attachments?.length ? (el("div", { className: "mb-2 flex flex-wrap gap-2" }, message.attachments.map((attachment) => (el(AttachmentChip, { key: attachment.id, attachment: attachment, className: "bg-y-bg/40" }))))) : null,
            message.text ? (el("p", { className: "whitespace-pre-wrap break-words text-y-chat text-y-ink" }, message.text)) : null,
            el("time", { className: "yagent-num mt-1.5 block text-y-xs text-y-ink-dim" }, formatClock(message.createdAt)))));
}
function AssistantMessage({ message }) {
    const [copied, setCopied] = stateCell(false);
    const timer = reference();
    afterRender(() => () => window.clearTimeout(timer.current), []);
    const streaming = message.status === 'streaming';
    async function copy() {
        try {
            await navigator.clipboard.writeText(message.text ?? '');
            setCopied(true);
            timer.current = window.setTimeout(() => setCopied(false), 1600);
        }
        catch {
            setCopied(false);
        }
    }
    return (el("div", { className: "group relative py-1.5" },
        el(MarkdownContent, { text: message.text ?? '' }),
        streaming ? (el("span", { className: "mt-1 inline-block h-4 w-[2px] translate-y-0.5 animate-y-blink bg-y-accent", "aria-hidden": true })) : null,
        message.status === 'stopped' ? (el("p", { className: "mt-2 flex items-center gap-1.5 text-y-xs text-y-ink-dim" },
            el(Ban, { className: "h-3.5 w-3.5" }),
            "\u06A9\u0627\u0631 \u0645\u062A\u0648\u0642\u0641 \u0634\u062F\u061B \u067E\u0627\u0633\u062E \u06A9\u0627\u0645\u0644 \u0646\u0634\u062F.")) : null,
        message.status === 'error' ? (el("p", { className: "mt-2 flex items-center gap-1.5 text-y-xs text-y-danger" },
            el(AlertCircle, { className: "h-3.5 w-3.5" }),
            "\u0627\u06CC\u0646 \u067E\u0627\u0633\u062E \u0628\u0627 \u062E\u0637\u0627 \u062A\u0645\u0627\u0645 \u0634\u062F.")) : null,
        !streaming && message.text ? (el("div", { className: "mt-1 flex items-center gap-1 opacity-0 transition-opacity duration-y-fast group-hover:opacity-100 group-focus-within:opacity-100" },
            el(IconButton, { label: "\u06A9\u067E\u06CC \u067E\u0627\u0633\u062E", size: "xs", onClick: () => void copy() }, copied ? el(Check, { className: "h-3.5 w-3.5 text-y-success" }) : el(Copy, { className: "h-3.5 w-3.5" })),
            el("span", { className: "yagent-num text-y-xs text-y-ink-dim" }, formatClock(message.createdAt)))) : null));
}
/**
 * Feedback sent from the preview: the annotations travel with the message, and
 * clicking one opens that annotation inside the preview workspace.
 */
function FeedbackMessageCard({ message }) {
    const { state, actions } = useYAgent();
    const annotations = (message.annotationIds ?? [])
        .map((id) => state.annotations[id])
        .filter((annotation) => Boolean(annotation));
    return (el(motion.div, { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }, className: "flex justify-start py-1.5" },
        el("div", { className: "max-w-[92%] rounded-y-lg rounded-ss-sm bg-y-surface p-3" },
            el("div", { className: "flex items-center gap-2 text-y-xs text-y-accent" },
                el(MessageSquareWarning, { className: "h-3.5 w-3.5" }),
                "\u0628\u0627\u0632\u062E\u0648\u0631\u062F \u0631\u0648\u06CC \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634",
                el("span", { className: "yagent-num text-y-ink-dim" },
                    "\u00B7 ",
                    fa(annotations.length),
                    " \u0645\u0648\u0631\u062F")),
            message.text ? (el("p", { className: "mt-1.5 break-words text-y-chat text-y-ink" }, message.text)) : null,
            el("ul", { className: "mt-2.5 space-y-1.5" }, annotations.map((annotation) => {
                const meta = ANNOTATION_STATUS_META[annotation.status];
                return (el("li", { key: annotation.id },
                    el("button", { type: "button", onClick: () => {
                            void actions.openPreview(annotation.pageId, annotation.revisionId).then(() => {
                                actions.selectAnnotation(annotation.id);
                            });
                        }, className: "flex w-full items-start gap-2.5 rounded-y-sm border border-y-line bg-y-bg/40 p-2.5 text-start transition-colors duration-y-fast hover:border-y-line-strong hover:bg-y-bg/70" },
                        el("span", { className: "yagent-num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-y-accent-soft text-y-xs text-y-accent" }, fa(annotation.index)),
                        el("span", { className: "min-w-0 flex-1" },
                            el("span", { className: "block break-words text-y-sm leading-7 text-y-ink/95" }, annotation.comment || 'بدون توضیح'),
                            el("span", { className: "mt-1 flex flex-wrap items-center gap-2 text-y-xs text-y-ink-dim" },
                                annotation.elementId ? (el("span", { className: "yagent-ltr max-w-full break-all rounded-y-xs bg-y-surface px-1.5 py-0.5" }, annotation.elementId)) : null,
                                el(Badge, { variant: meta.variant }, meta.label))))));
            })),
            el("time", { className: cn('yagent-num mt-2 block text-y-xs text-y-ink-dim') }, formatClock(message.createdAt)))));
}
