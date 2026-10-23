import { el, Fragment } from '../../native/dom.js';
import { AlertTriangle, Check, ExternalLink, Eye } from '../../icons.js';
import { stateCell } from '../../native/dom.js';
import { Button } from '../ui/button.js';
import { cn } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/**
 * Compact outcome card for any finished operation: success or failure, a short
 * explanation, the related link and — collapsed — the technical receipt.
 *
 * The surface stays neutral; success is carried by a small green marker and a
 * compact status label instead of a large coloured block. The preview button is
 * offered only when this result really has a page preview. Links that cannot be
 * honoured (`#`) are shown disabled with a note rather than pretending to work.
 */
export function ResultCard({ resultId }) {
    const { state, actions, derived } = useYAgent();
    const [showTechnical, setShowTechnical] = stateCell(false);
    const result = state.results[resultId];
    if (!result)
        return null;
    const success = result.status === 'success';
    const previewRevisionId = result.previewRevisionId;
    // A restored conversation knows its page even before the revisions are loaded.
    const previewPageId = previewRevisionId
        ? state.revisions[previewRevisionId]?.pageId ?? derived.activeConversation?.previewPageId
        : undefined;
    const hasPreview = Boolean(previewRevisionId && previewPageId);
    const hasLink = Boolean(result.link);
    const demoLink = hasLink && (result.link === '#' || result.link?.startsWith('#'));
    return (el("div", { className: cn('yagent-outcome rounded-y-lg border', success ? 'yagent-outcome--success border-y-line bg-y-surface-soft/60' : 'border-y-danger/25 bg-y-danger-soft/20') },
        el("div", { className: "flex items-start gap-2.5" },
            el("span", { className: cn('yagent-outcome-icon', success ? 'text-y-success' : 'text-y-danger') }, success ? el(Check, { className: "h-3.5 w-3.5", strokeWidth: 3 }) : el(AlertTriangle, { className: "h-3.5 w-3.5" })),
            el("div", { className: "min-w-0 flex-1" },
                el("div", { className: "yagent-outcome-head" },
                    el("p", { className: cn('yagent-outcome-title text-y-base font-medium', success ? 'text-y-ink' : 'text-y-danger'), title: result.title }, result.title),
                    el("span", { className: cn('yagent-status-label', success ? 'text-y-success' : 'text-y-danger') }, success ? 'انجام شد' : 'ناموفق')),
                el("p", { className: "mt-1 break-words text-y-sm leading-7 text-y-ink-muted" }, result.message))),
        el("div", { className: "mt-3 flex flex-wrap items-center gap-2" },
            hasPreview ? (el(Button, { size: "sm", variant: "secondary", onClick: () => void actions.openPreview(previewPageId, previewRevisionId) },
                el(Eye, { className: "h-3.5 w-3.5" }),
                "\u0645\u0634\u0627\u0647\u062F\u0647\u0654 \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634")) : null,
            result.artifactId ? el('button', { type: 'button', className: 'workspace-download', onClick: () => void actions.downloadArtifact(result.artifactId) }, 'دانلود ZIP افزونه') : null,
            demoLink ? (el("span", { className: "inline-flex items-center gap-2" },
                el(Button, { size: "sm", variant: "ghost", disabled: true, title: "\u062F\u0631 \u0646\u0633\u062E\u0647\u0654 \u0646\u0645\u0627\u06CC\u0634\u06CC\u060C \u0633\u0627\u06CC\u062A \u0648\u0627\u0642\u0639\u06CC \u0648\u0635\u0644 \u0646\u06CC\u0633\u062A", className: "border border-dashed border-y-line text-y-ink-dim" },
                    el(ExternalLink, { className: "h-3.5 w-3.5" }),
                    result.linkLabel ?? 'مشاهده در سایت'),
                el("span", { className: "text-y-xs text-y-ink-dim" }, "\u0644\u06CC\u0646\u06A9 \u0646\u0645\u0627\u06CC\u0634\u06CC"))) : result.link ? (el(Button, { size: "sm", variant: "ghost", asChild: true },
                el("a", { href: result.link, target: "_blank", rel: "noreferrer" },
                    el(ExternalLink, { className: "h-3.5 w-3.5" }),
                    result.linkLabel ?? 'مشاهده در سایت'))) : null,
            result.technical?.length ? (el("button", { type: "button", onClick: () => setShowTechnical((value) => !value), className: "ms-auto text-y-xs text-y-ink-dim underline decoration-y-line-strong underline-offset-4 transition-colors duration-y-fast hover:text-y-ink-muted" }, showTechnical ? 'بستن جزئیات' : 'جزئیات فنی')) : null),
        showTechnical && result.technical?.length ? (el("dl", { className: "mt-2.5 animate-y-fade-in space-y-1 rounded-y-sm border border-y-line bg-y-bg/50 p-2.5 text-y-xs" }, result.technical.map((item) => (el("div", { key: item.label, className: "flex items-start justify-between gap-3" },
            el("dt", { className: "shrink-0 text-y-ink-dim" }, item.label),
            el("dd", { className: "yagent-ltr min-w-0 break-all text-y-ink-muted" }, item.value)))))) : null));
}
