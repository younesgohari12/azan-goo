import { el, Fragment } from '../../native/dom.js';
import { AnimatePresence, motion } from '../../native/motion.js';
import { AlertTriangle, ChevronDown, Eye } from '../../icons.js';
import { stateCell } from '../../native/dom.js';
import { STEP_STATUS_META, StepStatusIcon, toneTextClass } from './status.js';
import { Badge } from '../ui/badge.js';
import { Button } from '../ui/button.js';
import { cn } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
export function TaskStepItem({ step, index }) {
    const { state, actions, derived } = useYAgent();
    const [open, setOpen] = stateCell(false);
    const meta = STEP_STATUS_META[step.status];
    const active = step.status === 'active';
    const hasDetails = Boolean(step.description || step.summary || step.detail);
    const previewPageId = state.preview.pageId ?? derived.activeConversation?.previewPageId;
    return (el("li", { className: "yagent-step-line relative ps-9" },
        el("span", { className: "absolute start-0 top-1.5" },
            el(StepStatusIcon, { status: step.status, index: index })),
        el("div", { className: cn('rounded-y-sm px-2 py-1.5 transition-colors duration-y ease-y', active ? 'bg-y-accent-soft/50 ring-1 ring-inset ring-y-accent-border/40' : 'hover:bg-y-surface-soft/70') },
            el("button", { type: "button", onClick: () => hasDetails && setOpen((value) => !value), className: "flex w-full items-start gap-2 text-start", "aria-expanded": open },
                el("span", { className: "min-w-0 flex-1" },
                    el("span", { className: "flex flex-wrap items-center gap-2" },
                        el("span", { className: cn('text-y-base', active
                                ? 'font-medium text-y-ink'
                                : step.status === 'pending'
                                    ? 'text-y-ink-dim'
                                    : 'text-y-ink-muted') }, step.title),
                        step.status === 'waiting_approval' ? el(Badge, { variant: "warn" }, "\u0645\u0646\u062A\u0638\u0631 \u062A\u0623\u06CC\u06CC\u062F") : null,
                        step.status === 'error' ? el(Badge, { variant: "danger" }, "\u062E\u0637\u0627") : null,
                        step.status === 'skipped' ? el(Badge, { variant: "neutral" }, "\u0627\u062C\u0631\u0627 \u0646\u0634\u062F") : null),
                    step.description ? (el("span", { className: "mt-0.5 block text-y-xs leading-6 text-y-ink-dim" }, step.description)) : null),
                hasDetails ? (el(ChevronDown, { className: cn('mt-1 h-3.5 w-3.5 shrink-0 text-y-ink-dim transition-transform duration-y ease-y', open && 'rotate-180') })) : null),
            el(AnimatePresence, { initial: false }, open ? (el(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.17, ease: [0.22, 0.61, 0.36, 1] }, className: "overflow-hidden" },
                el("div", { className: "mt-2 space-y-2 rounded-y-sm border border-y-line bg-y-bg/50 p-2.5" },
                    step.summary ? (el("p", { className: "text-y-sm leading-7 text-y-ink-muted" }, step.summary)) : null,
                    step.detail?.output ? (el("p", { className: "text-y-sm leading-7 text-y-ink/90" },
                        el("span", { className: cn('text-y-xs', toneTextClass(meta.tone)) }, "\u0646\u062A\u06CC\u062C\u0647 \u00B7 "),
                        step.detail.output)) : null,
                    step.detail?.warning ? (el("p", { className: "flex items-start gap-1.5 text-y-sm leading-7 text-y-warn" },
                        el(AlertTriangle, { className: "mt-1.5 h-3.5 w-3.5 shrink-0" }),
                        el("span", null, step.detail.warning))) : null,
                    step.detail?.receipt?.length ? (el("dl", { className: "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-y-line pt-2 text-y-xs" }, step.detail.receipt.map((item) => (el("div", { key: item.label, className: "col-span-2 flex items-start justify-between gap-3" },
                        el("dt", { className: "shrink-0 text-y-ink-dim" }, item.label),
                        el("dd", { className: "yagent-ltr min-w-0 break-all text-y-ink-muted" }, item.value)))))) : null,
                    step.detail?.logs?.length ? (el("pre", { className: "yagent-ltr overflow-x-auto rounded-y-xs bg-y-bg p-2 text-[11px] leading-5 text-y-ink-dim" }, step.detail.logs.join('\n'))) : null,
                    step.detail?.previewRevisionId && previewPageId ? (el(Button, { size: "sm", variant: "outline", className: "w-full", onClick: () => void actions.openPreview(previewPageId, step.detail?.previewRevisionId) },
                        el(Eye, { className: "h-3.5 w-3.5" }),
                        "\u0645\u0634\u0627\u0647\u062F\u0647\u0654 \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634")) : null))) : null))));
}
