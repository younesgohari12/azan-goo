import { el, Fragment } from '../../native/dom.js';
import { AlertTriangle, Check, FilePen, PackagePlus, ShieldCheck, Trash2, X, } from '../../icons.js';
import { stateCell } from '../../native/dom.js';
import { Badge } from '../ui/badge.js';
import { Button } from '../ui/button.js';
import { Spinner } from '../ui/feedback.js';
import { cn } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
const KIND_ICON = {
    publish_page: el(ShieldCheck, { className: "h-4 w-4" }),
    install_plugin: el(PackagePlus, { className: "h-4 w-4" }),
    delete_plugin: el(Trash2, { className: "h-4 w-4" }),
    update_content: el(FilePen, { className: "h-4 w-4" }),
};
const STATUS_BADGE = {
    pending: { label: 'منتظر تأیید', variant: 'warn' },
    approved: { label: 'تأیید شد', variant: 'accent' },
    running: { label: 'در حال اجرا', variant: 'accent' },
    succeeded: { label: 'انجام شد', variant: 'success' },
    rejected: { label: 'رد شد', variant: 'neutral' },
    failed: { label: 'ناموفق', variant: 'danger' },
};
/**
 * In-thread confirmation card for an operation that changes the site
 * (publishing a page, installing or deleting a plugin…). The buttons are
 * disabled the moment the operation starts, so a double click cannot run it twice.
 */
export function ApprovalCard({ approvalId }) {
    const { state, actions } = useYAgent();
    const [locked, setLocked] = stateCell(false);
    const [showReceipt, setShowReceipt] = stateCell(false);
    const approval = state.approvals[approvalId];
    if (!approval)
        return null;
    const badge = STATUS_BADGE[approval.status] || STATUS_BADGE.failed;
    const isPending = approval.status === 'pending' && !locked;
    const isRunning = approval.status === 'running' || (locked && approval.status === 'pending');
    async function decide(decision) {
        if (locked)
            return;
        setLocked(true);
        try { await actions.resolveApproval(approvalId, decision); } finally { setLocked(false); }
    }
    return (el("div", { className: cn('my-3 rounded-y-lg border p-4', isPending ? 'border-y-warn/25 bg-y-warn-soft/25' : 'border-y-line bg-y-surface-soft/60') },
        el("div", { className: "flex items-start gap-2.5" },
            el("span", { className: cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-y-sm', isPending ? 'bg-y-warn/15 text-y-warn' : 'bg-y-surface text-y-ink-muted') }, KIND_ICON[approval.kind]),
            el("div", { className: "min-w-0 flex-1" },
                el("div", { className: "flex flex-wrap items-center gap-2" },
                    el("span", { className: "break-words text-y-base font-medium text-y-ink" }, approval.title),
                    el(Badge, { variant: badge.variant }, badge.label)),
                el("p", { className: "mt-1 break-words text-y-sm text-y-ink-muted" },
                    el("span", { className: "text-y-ink-dim" }, "\u0647\u062F\u0641: "),
                    approval.target))),
        el("p", { className: "mt-3 break-words text-y-base leading-7 text-y-ink/90" }, approval.summary),
        approval.changes.length > 0 ? (el("ul", { className: "mt-2.5 space-y-1.5" }, approval.changes.map((change) => (el("li", { key: change, className: "flex items-start gap-2 text-y-sm leading-7 text-y-ink-muted" },
            el("span", { className: "mt-3 h-1 w-1 shrink-0 rounded-full bg-y-ink-dim" }),
            el("span", { className: "min-w-0 break-words" }, change)))))) : null,
        approval.preview ? el('details', { className: 'yagent-approval-preview' }, el('summary', null, 'بررسی کامل تغییر و محتوای پیشنهادی'), el('pre', null, JSON.stringify(approval.preview, null, 2))) : null,
        isRunning ? (el("div", { className: "mt-3.5 flex items-center gap-2 text-y-sm text-y-accent" },
            el(Spinner, { size: 14 }),
            "\u062F\u0631 \u062D\u0627\u0644 \u0627\u062C\u0631\u0627\u06CC \u0639\u0645\u0644\u06CC\u0627\u062A\u2026")) : null,
        isPending ? (el("div", { className: "mt-4 flex items-center gap-2" },
            el(Button, { variant: "success", size: "sm", onClick: () => void decide('approve'), disabled: locked },
                el(Check, { className: "h-3.5 w-3.5" }),
                "\u062A\u0623\u06CC\u06CC\u062F \u0648 \u0627\u062C\u0631\u0627"),
            el(Button, { variant: "ghost", size: "sm", onClick: () => void decide('reject'), disabled: locked },
                el(X, { className: "h-3.5 w-3.5" }),
                "\u0631\u062F"))) : null,
        approval.status === 'succeeded' ? (el("div", { className: "mt-3.5 space-y-2" },
            el("p", { className: "flex items-center gap-2 text-y-sm text-y-success" },
                el(Check, { className: "h-3.5 w-3.5" }),
                approval.result?.message ?? 'عملیات با موفقیت انجام شد.'),
            approval.result?.technical?.length ? (el(Fragment, null,
                el("button", { type: "button", onClick: () => setShowReceipt((value) => !value), className: "text-y-xs text-y-ink-dim underline decoration-y-line-strong underline-offset-4 transition-colors duration-y-fast hover:text-y-ink-muted" }, showReceipt ? 'پنهان‌کردن جزئیات فنی' : 'نمایش جزئیات فنی و رسید'),
                showReceipt ? (el("dl", { className: "animate-y-fade-in space-y-1 rounded-y-sm border border-y-line bg-y-bg/50 p-2.5 text-y-xs" }, approval.result.technical.map((item) => (el("div", { key: item.label, className: "flex items-start justify-between gap-3" },
                    el("dt", { className: "shrink-0 text-y-ink-dim" }, item.label),
                    el("dd", { className: "yagent-ltr min-w-0 break-all text-y-ink-muted" }, item.value)))))) : null)) : null)) : null,
        approval.status === 'rejected' ? (el("p", { className: "mt-3.5 rounded-y-sm border border-y-line bg-y-bg/40 px-3 py-2 text-y-sm text-y-ink-muted" }, "\u0627\u06CC\u0646 \u0639\u0645\u0644\u06CC\u0627\u062A \u0631\u062F \u0634\u062F \u0648 \u0647\u06CC\u0686 \u062A\u063A\u06CC\u06CC\u0631\u06CC \u0631\u0648\u06CC \u0633\u0627\u06CC\u062A \u0627\u0639\u0645\u0627\u0644 \u0646\u0634\u062F.")) : null,
        approval.status === 'failed' ? (el("p", { className: "mt-3.5 flex items-start gap-2 rounded-y-sm border border-y-danger/25 bg-y-danger-soft/40 px-3 py-2 text-y-sm text-y-danger" },
            el(AlertTriangle, { className: "mt-1.5 h-3.5 w-3.5 shrink-0" }),
            approval.error ?? 'اجرای عملیات ناموفق بود.')) : null));
}
