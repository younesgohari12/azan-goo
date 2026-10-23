import { el, Fragment } from '../../native/dom.js';
import { AlertTriangle, Check, Highlighter, MapPin, MessageSquareWarning, Send, Trash2, Undo2 } from '../../icons.js';
import { memoValue } from '../../native/dom.js';
import { ANNOTATION_STATUS_META, isReviewNeeded } from './annotationStatus.js';
import { Badge } from '../ui/badge.js';
import { Button, IconButton } from '../ui/button.js';
import { cn, fa, formatRelative, truncate } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/**
 * Feedback panel: the notes written on the preview.
 * Drafts live in local state (editable, deletable, undoable); after sending they
 * come back from the adapter with a `sent` status, and become `stale` /
 * `unmatched` when a newer revision makes them worth a second look.
 */
export function FeedbackPanel() {
    const { state, actions, derived } = useYAgent();
    const pageId = state.preview.open && state.preview.conversationId === state.activeConversationId
        ? state.preview.pageId : undefined;
    const drafts = derived.draftAnnotations;
    const others = memoValue(() => Object.values(state.annotations)
        .filter((annotation) => annotation.pageId === pageId && annotation.status !== 'draft')
        .sort((a, b) => b.createdAt - a.createdAt), [state.annotations, pageId]);
    const reviewNeeded = others.filter((annotation) => isReviewNeeded(annotation.status));
    const history = others.filter((annotation) => !isReviewNeeded(annotation.status));
    const emptyCommentCount = drafts.filter((annotation) => annotation.comment.trim().length === 0).length;
    if (!pageId) {
        return (el("div", { className: "flex flex-col items-center gap-2 px-2 py-14 text-center" },
            el("span", { className: "flex h-10 w-10 items-center justify-center rounded-y-md bg-y-surface-soft text-y-ink-dim" },
                el(MessageSquareWarning, { className: "h-4 w-4" })),
            el("p", { className: "text-y-base text-y-ink-muted" }, "\u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634\u06CC \u0628\u0627\u0632 \u0646\u06CC\u0633\u062A."),
            el("p", { className: "text-y-xs leading-6 text-y-ink-dim" }, "\u06CC\u06A9 \u0635\u0641\u062D\u0647 \u0631\u0627 \u062F\u0631 \u062D\u0627\u0644\u062A \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634 \u0628\u0627\u0632 \u06A9\u0646 \u062A\u0627 \u0628\u062A\u0648\u0627\u0646\u06CC \u0631\u0648\u06CC \u0628\u062E\u0634\u200C\u0647\u0627\u06CC\u0634 \u0639\u0644\u0627\u0645\u062A \u0628\u06AF\u0630\u0627\u0631\u06CC \u0648 \u0646\u0638\u0631 \u0628\u0646\u0648\u06CC\u0633\u06CC.")));
    }
    return (el("div", { className: "space-y-4" },
        el("div", { className: "rounded-y-md border border-y-line bg-y-surface-soft/60 p-2.5" },
            el("button", { type: "button", onClick: () => actions.setAnnotate(!state.preview.annotate), className: cn('flex w-full items-center gap-2 rounded-y-sm border px-2.5 py-2 text-y-sm transition-colors duration-y-fast', state.preview.annotate
                    ? 'border-y-accent-border bg-y-accent-soft text-y-accent'
                    : 'border-y-line bg-y-bg/50 text-y-ink-muted hover:text-y-ink') },
                el(Highlighter, { className: "h-3.5 w-3.5" }),
                state.preview.annotate ? 'حالت علامت‌گذاری روشن است' : 'روشن‌کردن حالت علامت‌گذاری'),
            el("p", { className: "mt-2 text-y-xs leading-6 text-y-ink-dim" }, "\u0632\u062F\u0646 \u0631\u0648\u06CC \u06CC\u06A9 \u0628\u062E\u0634 = \u067E\u06CC\u0646 \u00B7 \u06A9\u0634\u06CC\u062F\u0646 \u0627\u0646\u06AF\u0634\u062A \u06CC\u0627 \u0645\u0648\u0633 = \u0646\u0627\u062D\u06CC\u0647. \u0639\u0644\u0627\u0645\u062A\u200C\u0647\u0627 \u0634\u0645\u0627\u0631\u0647\u200C\u06AF\u0630\u0627\u0631\u06CC \u0645\u06CC\u200C\u0634\u0648\u0646\u062F \u0648 \u062F\u0631 \u0647\u0645\u06CC\u0646 \u06AF\u0641\u062A\u06AF\u0648 \u062B\u0628\u062A \u0645\u06CC\u200C\u0634\u0648\u0646\u062F.")),
        el("section", { className: "space-y-2" },
            el("header", { className: "flex items-center justify-between" },
                el("h3", { className: "text-y-sm font-medium text-y-ink" }, "\u0646\u0638\u0631\u0647\u0627\u06CC \u0627\u06CC\u0646 \u0646\u0633\u062E\u0647"),
                el("span", { className: "yagent-num text-y-xs text-y-ink-dim" }, fa(drafts.length))),
            drafts.length === 0 ? (el("p", { className: "rounded-y-sm border border-dashed border-y-line px-3 py-3 text-y-xs leading-6 text-y-ink-dim" }, "\u0647\u0646\u0648\u0632 \u0639\u0644\u0627\u0645\u062A\u06CC \u062B\u0628\u062A \u0646\u06A9\u0631\u062F\u0647\u200C\u0627\u06CC. \u062D\u0627\u0644\u062A \u0639\u0644\u0627\u0645\u062A\u200C\u06AF\u0630\u0627\u0631\u06CC \u0631\u0627 \u0631\u0648\u0634\u0646 \u06A9\u0646 \u0648 \u0631\u0648\u06CC \u0628\u062E\u0634\u06CC \u0627\u0632 \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634 \u0628\u0632\u0646.")) : (el("ul", { className: "space-y-2" }, drafts.map((annotation) => (el(DraftCard, { key: annotation.id, annotation: annotation, selected: annotation.id === state.preview.selectedAnnotationId }))))),
            drafts.length > 0 ? (el(Fragment, null,
                emptyCommentCount > 0 ? (el("p", { className: "flex items-start gap-1.5 text-y-xs leading-6 text-y-warn" },
                    el(AlertTriangle, { className: "mt-1.5 h-3.5 w-3.5 shrink-0" }),
                    fa(emptyCommentCount),
                    " \u0639\u0644\u0627\u0645\u062A \u0647\u0646\u0648\u0632 \u062A\u0648\u0636\u06CC\u062D \u0646\u062F\u0627\u0631\u062F\u061B \u062A\u0648\u0636\u06CC\u062D\u200C\u062F\u0627\u062F\u0646 \u0628\u0627\u0639\u062B \u0645\u06CC\u200C\u0634\u0648\u062F \u0627\u0635\u0644\u0627\u062D \u062F\u0642\u06CC\u0642\u200C\u062A\u0631 \u0627\u0646\u062C\u0627\u0645 \u0634\u0648\u062F.")) : null,
                el("div", { className: "flex items-center gap-2 pt-1" },
                    el(Button, { size: "sm", variant: "primary", className: "flex-1", onClick: () => void actions.sendFeedback() },
                        el(Send, { className: "h-3.5 w-3.5" }),
                        "\u0627\u0631\u0633\u0627\u0644 \u0627\u0635\u0644\u0627\u062D\u0627\u062A \u0628\u0647 \u062F\u0633\u062A\u06CC\u0627\u0631"),
                    el(Button, { variant: "ghost", size: "sm", onClick: () => actions.undoAnnotation(), title: "\u0648\u0627\u06AF\u0631\u062F \u0622\u062E\u0631\u06CC\u0646 \u0639\u0644\u0627\u0645\u062A" },
                        el(Undo2, { className: "h-3.5 w-3.5" }),
                        "\u0648\u0627\u06AF\u0631\u062F")))) : null),
        reviewNeeded.length > 0 ? (el("section", { className: "space-y-2" },
            el("header", { className: "flex items-center justify-between" },
                el("h3", { className: "text-y-sm font-medium text-y-warn" }, "\u0646\u06CC\u0627\u0632\u0645\u0646\u062F \u0628\u0631\u0631\u0633\u06CC"),
                el("span", { className: "yagent-num text-y-xs text-y-ink-dim" }, fa(reviewNeeded.length))),
            el("ul", { className: "space-y-2" }, reviewNeeded.map((annotation) => (el(ReviewCard, { key: annotation.id, annotation: annotation })))))) : null,
        history.length > 0 ? (el("section", { className: "space-y-2" },
            el("header", { className: "flex items-center justify-between" },
                el("h3", { className: "text-y-sm font-medium text-y-ink" }, "\u0646\u0638\u0631\u0647\u0627\u06CC \u0646\u0633\u062E\u0647\u200C\u0647\u0627\u06CC \u0642\u0628\u0644\u06CC"),
                el("span", { className: "yagent-num text-y-xs text-y-ink-dim" }, fa(history.length))),
            el("ul", { className: "space-y-1.5" }, history.map((annotation) => {
                const meta = ANNOTATION_STATUS_META[annotation.status];
                const revision = state.revisions[annotation.revisionId];
                return (el("li", { key: annotation.id },
                    el("button", { type: "button", onClick: () => void actions.openPreview(annotation.pageId, annotation.revisionId).then(() => actions.selectAnnotation(annotation.id)), className: "flex w-full items-start gap-2 rounded-y-sm border border-y-line bg-y-surface-soft/40 p-2 text-start transition-colors duration-y-fast hover:bg-y-surface-soft" },
                        el("span", { className: "yagent-num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-y-surface text-y-xs text-y-ink-muted" }, fa(annotation.index)),
                        el("span", { className: "min-w-0 flex-1" },
                            el("span", { className: "block truncate text-y-sm text-y-ink/90" }, annotation.comment || 'بدون توضیح'),
                            el("span", { className: "mt-1 flex items-center gap-2 text-y-xs text-y-ink-dim" },
                                el("span", null,
                                    "\u0646\u0633\u062E\u0647\u0654 ",
                                    revision ? fa(revision.revision) : '—'),
                                el("span", { "aria-hidden": true }, "\u00B7"),
                                el("span", null, formatRelative(annotation.createdAt)),
                                el(Badge, { variant: meta.variant }, meta.label))))));
            })))) : null));
}
function DraftCard({ annotation, selected }) {
    const { actions } = useYAgent();
    return (el("li", { className: cn('rounded-y-md border p-2.5 transition-colors duration-y-fast', selected ? 'border-y-accent-border bg-y-accent-soft/30' : 'border-y-line bg-y-surface-soft/50') },
        el("div", { className: "flex items-start gap-2" },
            el("button", { type: "button", onClick: () => actions.selectAnnotation(annotation.id), title: "\u0627\u0646\u062A\u062E\u0627\u0628 \u0627\u06CC\u0646 \u0639\u0644\u0627\u0645\u062A \u062F\u0631 \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634", className: "yagent-num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-y-accent-soft text-y-xs text-y-accent ring-1 ring-inset ring-y-accent-border/50" }, fa(annotation.index)),
            el("div", { className: "min-w-0 flex-1" },
                el("textarea", { value: annotation.comment, onChange: (event) => actions.updateAnnotationComment(annotation.id, event.target.value), rows: 2, placeholder: "\u062A\u0648\u0636\u06CC\u062D \u0627\u0635\u0644\u0627\u062D \u0631\u0627 \u0628\u0646\u0648\u06CC\u0633\u2026 \u0645\u062B\u0644\u0627\u064B: \u0627\u0631\u062A\u0641\u0627\u0639 \u0627\u06CC\u0646 \u0628\u062E\u0634 \u06A9\u0645\u062A\u0631 \u0634\u0648\u062F.", className: "w-full resize-none rounded-y-sm border border-y-line bg-y-bg/50 p-2 text-y-md leading-7 text-y-ink outline-none placeholder:text-y-ink-dim focus:border-y-accent-border" }),
                el("div", { className: "mt-1.5 flex flex-wrap items-center gap-2 text-y-xs text-y-ink-dim" },
                    el("span", { className: "flex items-center gap-1" },
                        el(MapPin, { className: "h-3 w-3" }),
                        annotation.kind === 'pin' ? 'پین' : 'ناحیه'),
                    annotation.elementId ? (el("span", { className: "yagent-ltr max-w-full break-all rounded-y-xs bg-y-surface px-1.5 py-0.5" }, annotation.elementId)) : null,
                    annotation.elementLabel ? el("span", { className: "truncate" }, truncate(annotation.elementLabel, 34)) : null)),
            el(IconButton, { label: "\u062D\u0630\u0641 \u0639\u0644\u0627\u0645\u062A", size: "xs", onClick: () => actions.removeAnnotation(annotation.id) },
                el(Trash2, { className: "h-3.5 w-3.5" })))));
}
function ReviewCard({ annotation }) {
    const { state, actions } = useYAgent();
    const meta = ANNOTATION_STATUS_META[annotation.status];
    const revision = state.revisions[annotation.revisionId];
    return (el("li", { className: "rounded-y-md border border-y-warn/25 bg-y-warn-soft/25 p-2.5" },
        el("div", { className: "flex items-start gap-2" },
            el("span", { className: "yagent-num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-y-surface text-y-xs text-y-ink-muted" }, fa(annotation.index)),
            el("div", { className: "min-w-0 flex-1" },
                el("p", { className: "break-words text-y-sm leading-7 text-y-ink/90" }, annotation.comment || 'بدون توضیح'),
                el("p", { className: "mt-1 text-y-xs leading-6 text-y-ink-dim" },
                    "\u062B\u0628\u062A\u200C\u0634\u062F\u0647 \u0631\u0648\u06CC \u0646\u0633\u062E\u0647\u0654 ",
                    revision ? fa(revision.revision) : '—',
                    " \u00B7 ",
                    meta.hint),
                el("div", { className: "mt-2 flex items-center gap-2" },
                    el(Badge, { variant: meta.variant }, meta.label),
                    el(Button, { size: "sm", variant: "ghost", onClick: () => void actions.openPreview(annotation.pageId, annotation.revisionId).then(() => actions.selectAnnotation(annotation.id)) }, "\u0628\u0631\u0631\u0633\u06CC \u062F\u0631 \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634"),
                    el(Button, { size: "sm", variant: "ghost", onClick: () => void actions.resolveAnnotation(annotation.id) },
                        el(Check, { className: "h-3.5 w-3.5" }),
                        "\u0628\u0631\u0631\u0633\u06CC\u200C\u0634\u062F\u0647"))))));
}
