import { el } from '../../native/dom.js';
import { AnimatePresence, motion } from '../../native/motion.js';
import { ChevronDown } from '../../icons.js';
import { stateCell } from '../../native/dom.js';
import { STEP_STATUS_META, StepStatusIcon, TASK_STATUS_META, toneTextClass } from './status.js';
import { ProgressBar, ShimmerBar, WorkingRing } from '../ui/feedback.js';
import { useNow } from '../../hooks/useNow.js';
import { cn, fa, formatElapsed, percentOf } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/**
 * In-thread activity block: a short, live summary of the visible work plan.
 * It renders the plan and its statuses as they arrive from the adapter — there
 * is no fake reasoning, only the steps and summaries the adapter reports.
 */
export function ActivityBlock({ taskId }) {
    const { state } = useYAgent();
    const [expanded, setExpanded] = stateCell(false);
    const task = state.tasks[taskId];
    const live = task?.status === 'running' || task?.status === 'queued';
    const now = useNow(Boolean(live));
    if (!task)
        return null;
    const meta = TASK_STATUS_META[task.status];
    const done = task.steps.filter((step) => step.status === 'done').length;
    const total = task.steps.length;
    const percent = percentOf(done, total);
    const activeStep = task.steps.find((step) => step.status === 'active') ??
        task.steps.find((step) => step.status === 'waiting_approval') ??
        task.steps.find((step) => step.status === 'pending');
    const elapsed = Math.max(0, (task.endedAt ?? now) - task.startedAt);
    return (el(motion.div, { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }, className: cn('overflow-hidden rounded-y-lg border bg-y-surface-soft/70 transition-[border-color,background-color] duration-y ease-y', live && 'yagent-working', task.status === 'error' ? 'border-y-danger/25' : 'border-y-line') },
        el("button", { type: "button", onClick: () => setExpanded((value) => !value), "aria-expanded": expanded, className: "flex w-full items-start gap-3 px-3.5 py-3 text-start" },
            el("span", { className: "relative mt-0.5 flex h-5 w-5 items-center justify-center" }, live ? (el(WorkingRing, { size: 18 })) : (el(StepStatusIcon, { status: task.status === 'done'
                    ? 'done'
                    : task.status === 'error'
                        ? 'error'
                        : task.status === 'waiting_approval'
                            ? 'waiting_approval'
                            : 'skipped', index: 0 }))),
            el("span", { className: "min-w-0 flex-1" },
                el("span", { className: "flex flex-wrap items-center gap-x-2 gap-y-0.5" },
                    el("span", { className: cn('text-y-base font-medium', toneTextClass(meta.tone)) }, meta.label),
                    el("span", { className: "yagent-num text-y-xs text-y-ink-dim", title: "\u0632\u0645\u0627\u0646 \u0633\u067E\u0631\u06CC\u200C\u0634\u062F\u0647" }, formatElapsed(elapsed))),
                el("span", { className: "mt-1 block text-y-base leading-7 text-y-ink-muted" }, task.status === 'error' && task.error ? task.error : task.summary),
                activeStep && live ? (el("span", { className: "yagent-working-line" },
                    el("span", { className: "yagent-working-label" }, 'در حال آماده‌سازی'),
                    el("span", { className: "yagent-working-step", title: activeStep.title }, activeStep.title))) : null),
            el(ChevronDown, { className: cn('mt-1 h-4 w-4 shrink-0 text-y-ink-dim transition-transform duration-y ease-y', expanded && 'rotate-180') })),
        el("div", { className: "px-3.5 pb-3" },
            activeStep && live ? el("div", { className: "yagent-working-bar" }, el(ShimmerBar)) : null,
            el("div", { className: "flex items-center gap-2.5" },
                el(ProgressBar, { percent: percent, tone: task.status === 'error' ? 'danger' : task.status === 'done' ? 'success' : 'accent' }),
                el("span", { className: "yagent-num shrink-0 text-y-xs text-y-ink-dim" },
                    fa(done),
                    " \u0627\u0632 ",
                    fa(total)))),
        el(AnimatePresence, { initial: false }, expanded ? (el(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.19, ease: [0.22, 0.61, 0.36, 1] }, className: "overflow-hidden border-t border-y-line" },
            el("ul", { className: "space-y-2.5 p-3.5" }, task.steps.map((step, index) => (el("li", { key: step.id, className: "flex items-start gap-2.5" },
                el(StepStatusIcon, { status: step.status, index: index + 1, className: "mt-0.5" }),
                el("div", { className: "min-w-0 flex-1" },
                    el("div", { className: "flex flex-wrap items-center gap-2" },
                        el("span", { className: cn('text-y-sm', step.status === 'pending' ? 'text-y-ink-dim' : 'text-y-ink') }, step.title),
                        el("span", { className: cn('text-y-xs', toneTextClass(STEP_STATUS_META[step.status].tone)) }, STEP_STATUS_META[step.status].label)),
                    step.summary ? (el("p", { className: "mt-0.5 text-y-xs leading-6 text-y-ink-muted" }, step.summary)) : null,
                    step.detail?.logs?.length ? (el("pre", { className: "yagent-ltr mt-1.5 max-w-full overflow-x-auto rounded-y-xs bg-y-bg p-2 text-[11px] leading-5 text-y-ink-dim" }, step.detail.logs.join('\n'))) : null))))))) : null)));
}
