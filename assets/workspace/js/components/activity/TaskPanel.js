import { el, Fragment } from '../../native/dom.js';
import { ListChecks, MessageSquareWarning, PanelLeftClose } from '../../icons.js';
import { TaskStepItem } from './TaskStepItem.js';
import { TASK_STATUS_META, toneTextClass } from './status.js';
import { Badge } from '../ui/badge.js';
import { IconButton } from '../ui/button.js';
import { ProgressBar } from '../ui/feedback.js';
import { Segmented } from '../ui/segmented.js';
import { FeedbackPanel } from '../preview/FeedbackPanel.js';
import { useNow } from '../../hooks/useNow.js';
import { cn, fa, formatElapsed } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/**
 * "مراحل انجام کار" — the plan of the current request.
 * Step order and count come from the adapter; the progress percentage is
 * computed from the real step states (no cosmetic completion).
 */
export function TaskPanel({ onCollapse }) {
    const { state, actions, derived } = useYAgent();
    const task = derived.currentTask;
    const live = task ? task.status === 'running' || task.status === 'queued' : false;
    const allStepsDone = Boolean(task?.steps.length && task.steps.every((step) => step.status === 'done'));
    const now = useNow(Boolean(live));
    const draftCount = derived.draftAnnotations.length;
    const tab = state.panelTab;
    return (el("div", { className: "flex h-full w-full flex-col bg-y-bg-elevated" },
        el("header", { className: "flex items-center gap-2 border-b border-y-line px-3 py-3" },
            el(ListChecks, { className: "h-4 w-4 shrink-0 text-y-accent" }),
            el("span", { className: "flex-1 text-y-base font-medium text-y-ink" }, "\u0645\u0631\u0627\u062D\u0644 \u0627\u0646\u062C\u0627\u0645 \u06A9\u0627\u0631"),
            onCollapse ? (el(IconButton, { label: "\u062C\u0645\u0639\u200C\u06A9\u0631\u062F\u0646 \u067E\u0646\u0644", onClick: onCollapse },
                el(PanelLeftClose, { className: "h-4 w-4" }))) : null),
        el("div", { className: "px-3 pt-3" },
            el(Segmented, { className: "w-full [&>button]:flex-1", value: tab, onChange: (value) => actions.setPanel({ tab: value }), options: [
                    { value: 'steps', label: 'مراحل', icon: el(ListChecks, { className: "h-3.5 w-3.5" }) },
                    {
                        value: 'feedback',
                        label: draftCount > 0 ? `بازخورد (${fa(draftCount)})` : 'بازخورد',
                        icon: el(MessageSquareWarning, { className: "h-3.5 w-3.5" }),
                    },
                ] })),
        el("div", { className: "yagent-scroll flex-1 px-3 py-3.5" }, tab === 'feedback' ? (el(FeedbackPanel, null)) : task ? (el("div", { className: "space-y-4" },
            el("div", { className: cn('rounded-y-md border border-y-line bg-y-surface-soft/60 p-3 transition-[border-color,background-color] duration-y ease-y', live && 'yagent-working') },
                el("div", { className: "flex items-start justify-between gap-2" },
                    el("div", { className: "min-w-0 flex-1" },
                        el("p", { className: "truncate text-y-base font-medium text-y-ink" }, task.title),
                        el("p", { className: "mt-0.5 text-y-xs text-y-ink-dim" },
                            "\u0634\u0631\u0648\u0639: ",
                            formatElapsed(Math.max(0, (task.endedAt ?? now) - task.startedAt)),
                            " \u067E\u06CC\u0634")),
                    el(Badge, { variant: task.status === 'done'
                            ? allStepsDone ? 'success' : 'neutral'
                            : task.status === 'error'
                                ? 'danger'
                                : task.status === 'waiting_approval'
                                    ? 'warn'
                                    : 'accent' }, TASK_STATUS_META[task.status].label)),
                el("p", { className: cn('mt-2 text-y-sm leading-7', task.status === 'done' && !allStepsDone
                        ? 'text-y-ink-muted' : toneTextClass(TASK_STATUS_META[task.status].tone)) }, task.status === 'error' && task.error ? task.error : task.summary),
                el("div", { className: "mt-3 flex items-center gap-2.5" },
                    el(ProgressBar, { percent: derived.taskProgress.percent, tone: task.status === 'error' ? 'danger' : task.status === 'done' && allStepsDone ? 'success' : 'accent' }),
                    el("span", { className: "yagent-num shrink-0 text-y-xs text-y-ink-dim" },
                        fa(derived.taskProgress.done),
                        " \u0627\u0632 ",
                        fa(derived.taskProgress.total)))),
            el("ol", { className: "space-y-1.5" }, task.steps.map((step, index) => (el(TaskStepItem, { key: step.id, step: step, index: index + 1 })))),
            task.status === 'done' ? (el("div", { className: cn('yagent-note', allStepsDone && 'yagent-note--success') },
                allStepsDone ? el("span", { className: "yagent-status-label text-y-success" }, 'انجام شد') : null,
                el("span", { className: "min-w-0 flex-1 text-y-sm leading-7 text-y-ink-muted" }, allStepsDone ? 'همهٔ مراحل با موفقیت انجام شد.' : task.summary))) : null,
            task.status === 'stopped' ? (el("p", { className: "rounded-y-md border border-y-line bg-y-surface-soft/60 px-3 py-2 text-y-sm text-y-ink-muted" }, "\u0627\u06CC\u0646 \u06A9\u0627\u0631 \u0645\u062A\u0648\u0642\u0641 \u0634\u062F. \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0627\u0632\u0647\u200C\u0627\u06CC \u0628\u062F\u0647\u06CC \u06CC\u0627 \u0627\u0632 \u0647\u0645\u06CC\u0646\u200C\u062C\u0627 \u0627\u062F\u0627\u0645\u0647 \u0628\u062F\u0647\u06CC.")) : null)) : (el("div", { className: "flex flex-col items-center gap-2 px-2 py-14 text-center" },
            el("span", { className: "flex h-10 w-10 items-center justify-center rounded-y-md bg-y-surface-soft text-y-ink-dim" },
                el(ListChecks, { className: "h-4 w-4" })),
            el("p", { className: "text-y-base text-y-ink-muted" }, "\u0647\u0646\u0648\u0632 \u06A9\u0627\u0631\u06CC \u062F\u0631 \u0627\u06CC\u0646 \u06AF\u0641\u062A\u06AF\u0648 \u0634\u0631\u0648\u0639 \u0646\u0634\u062F\u0647."),
            el("p", { className: "text-y-xs leading-6 text-y-ink-dim" }, "\u0648\u0642\u062A\u06CC \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC \u0628\u0641\u0631\u0633\u062A\u06CC\u060C \u0645\u0631\u0627\u062D\u0644 \u0627\u062C\u0631\u0627\u06CC \u0622\u0646 \u0647\u0645\u06CC\u0646\u200C\u062C\u0627 \u0645\u0631\u062D\u0644\u0647\u200C\u0628\u0647\u200C\u0645\u0631\u062D\u0644\u0647 \u0646\u0634\u0627\u0646 \u062F\u0627\u062F\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F."))))));
}
