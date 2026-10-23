import { el, Fragment } from '../../native/dom.js';
import { Check, ExternalLink, Highlighter, History, Monitor, PanelLeftClose, PanelLeftOpen, RefreshCw, Rocket, Rows2, Smartphone, Tablet, Undo2, X, } from '../../icons.js';
import { stateCell } from '../../native/dom.js';
import { Badge } from '../ui/badge.js';
import { Button, IconButton } from '../ui/button.js';
import { Dialog, DialogContent } from '../ui/dialog.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '../ui/dropdown-menu.js';
import { Spinner } from '../ui/feedback.js';
import { Segmented } from '../ui/segmented.js';
import { Tooltip } from '../ui/tooltip.js';
import { cn, fa, formatClock } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
import { buildPreviewDocument } from '../../preview/buildPreviewDocument.js';
const DEVICES = [
    { value: 'desktop', label: 'دسکتاپ', icon: el(Monitor, { className: "h-3.5 w-3.5" }) },
    { value: 'tablet', label: 'تبلت', icon: el(Tablet, { className: "h-3.5 w-3.5" }) },
    { value: 'mobile', label: 'موبایل', icon: el(Smartphone, { className: "h-3.5 w-3.5" }) },
];
/**
 * Preview toolbar. Only what is used while looking at the page stays on the bar
 * (annotation, publish, display scale, close); the device size, the width, the
 * revision history and the comparison live behind the "بیشتر" menu.
 */
export function PreviewToolbar({ onClose, onTogglePanel, panelOpen, }) {
    const { state, actions, derived } = useYAgent();
    const [publishOpen, setPublishOpen] = stateCell(false);
    const [publishing, setPublishing] = stateCell(false);
    const revision = derived.currentRevision;
    const revisions = [...derived.revisions].sort((a, b) => b.revision - a.revision);
    const draftCount = derived.draftAnnotations.length;
    const canPublish = Boolean(revision && revision.status === 'draft' && state.capabilities.publish && !derived.running);
    function openInNewTab() {
        if (!revision)
            return;
        void document.querySelector('iframe[title^="پیش‌نمایش"]')?.requestFullscreen?.().catch(() => {});
    }
    async function publish() {
        if (!revision || publishing)
            return;
        setPublishing(true);
        await actions.publishRevision(revision.id);
        setPublishing(false);
        setPublishOpen(false);
    }
    return (el("div", { className: "shrink-0 border-b border-y-line bg-y-bg-elevated" },
        el("div", { className: "flex flex-wrap items-center gap-2 px-3 py-2.5" },
            el("div", { className: "flex min-w-0 basis-full items-center gap-2 2xl:basis-[12rem] 2xl:flex-1" },
                onTogglePanel ? (el(Tooltip, { label: panelOpen ? 'جمع‌کردن پنل مراحل' : 'نمایش پنل مراحل' },
                    el(IconButton, { label: panelOpen ? 'جمع‌کردن پنل مراحل' : 'نمایش پنل مراحل', size: "md", onClick: onTogglePanel }, panelOpen ? el(PanelLeftClose, { className: "h-4 w-4" }) : el(PanelLeftOpen, { className: "h-4 w-4" })))) : null,
                el("span", { className: "truncate text-y-base font-medium text-y-ink" }, revision?.pageTitle ?? 'پیش‌نمایش صفحه'),
                revision ? (el(Badge, { variant: revision.status === 'published' ? 'success' : 'accent' }, revision.status === 'published' ? 'منتشرشده' : 'پیش‌نویس')) : null,
                revision ? el(Badge, { variant: "plain" },
                    "\u0646\u0633\u062E\u0647\u0654 ",
                    fa(revision.revision)) : null),
            el("div", { className: "flex w-full min-w-0 flex-wrap items-center gap-1.5 2xl:w-auto" },
                el(Segmented, { size: "sm", value: state.preview.zoom, onChange: (zoom) => actions.setZoom(zoom), options: [
                        { value: 'fit', label: 'جای‌گیری', title: 'نمایش متناسب با فضای کارگاه' },
                        { value: 'full', label: '۱۰۰٪', title: 'نمایش در مقیاس واقعی' },
                    ] }),
                el("button", { type: "button", onClick: () => actions.setAnnotate(!state.preview.annotate), "aria-pressed": state.preview.annotate, className: cn('inline-flex h-8 items-center gap-1.5 rounded-y-sm border px-2.5 text-y-sm transition-colors duration-y-fast ease-y', state.preview.annotate
                        ? 'border-y-accent-border bg-y-accent-soft text-y-accent'
                        : 'border-y-line bg-y-surface-soft text-y-ink-muted hover:text-y-ink') },
                    el(Highlighter, { className: "h-3.5 w-3.5" }),
                    "\u0639\u0644\u0627\u0645\u062A\u200C\u06AF\u0630\u0627\u0631\u06CC",
                    draftCount > 0 ? (el("span", { className: "yagent-num rounded-full bg-y-accent/20 px-1.5 text-y-xs" }, fa(draftCount))) : null),
                el(DropdownMenu, null,
                    el(DropdownMenuTrigger, { asChild: true },
                        el(Button, { size: "sm", variant: "secondary", className: "h-8 gap-1.5" },
                            el(History, { className: "h-3.5 w-3.5" }),
                            "\u0628\u06CC\u0634\u062A\u0631")),
                    el(DropdownMenuContent, { align: "start", className: "min-w-[15rem]" },
                        el(DropdownMenuLabel, null, "\u0627\u0646\u062F\u0627\u0632\u0647\u0654 \u0646\u0645\u0627\u06CC\u0634 \u0648 \u062F\u0633\u062A\u06AF\u0627\u0647"),
                        DEVICES.map((device) => (el(DropdownMenuItem, { key: device.value, icon: device.icon, selected: device.value === state.preview.device, onSelect: () => actions.setDevice(device.value) }, device.label))),
                        el("div", { className: "flex items-center gap-2 px-2.5 py-2", onPointerDown: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation() },
                            el("span", { className: "text-y-xs text-y-ink-dim" }, "\u0639\u0631\u0636 \u062F\u0633\u062A\u06AF\u0627\u0647"),
                            el("input", { type: "range", min: 360, max: 1600, step: 20, value: state.preview.width, "aria-label": "\u0639\u0631\u0636 \u062F\u0633\u062A\u06AF\u0627\u0647 \u062F\u0631 \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634", onChange: (event) => actions.setPreviewWidth(Number(event.target.value)), className: "h-1 min-w-0 flex-1 cursor-pointer", style: { accentColor: 'rgb(var(--y-accent-rgb))' } }),
                            el("span", { className: "yagent-num w-[4.25rem] text-end text-y-xs text-y-ink-dim" },
                                fa(state.preview.width),
                                " px")),
                        el(DropdownMenuSeparator, null),
                        el(DropdownMenuItem, { icon: el(RefreshCw, { className: "h-3.5 w-3.5" }), onSelect: () => actions.reloadPreview() }, "\u0628\u0627\u0632\u062E\u0648\u0627\u0646\u06CC \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634"),
                        el(DropdownMenuItem, { icon: el(ExternalLink, { className: "h-3.5 w-3.5" }), onSelect: openInNewTab }, "\u0628\u0627\u0632\u06A9\u0631\u062F\u0646 \u062F\u0631 \u067E\u0646\u062C\u0631\u0647\u0654 \u062C\u062F\u06CC\u062F"),
                        el(DropdownMenuSeparator, null),
                        el(DropdownMenuLabel, null, "\u0646\u0633\u062E\u0647\u200C\u0647\u0627"),
                        revisions.map((item) => (el(DropdownMenuItem, { key: item.id, selected: item.id === revision?.id, onSelect: () => actions.selectRevision(item.id) },
                            el("span", { className: "min-w-0" },
                                el("span", { className: "flex items-center gap-2 text-y-base text-y-ink" },
                                    "\u0646\u0633\u062E\u0647\u0654 ",
                                    fa(item.revision),
                                    el(Badge, { variant: item.status === 'published' ? 'success' : 'accent' }, item.status === 'published' ? 'منتشرشده' : 'پیش‌نویس')),
                                el("span", { className: "mt-0.5 block truncate text-y-xs text-y-ink-dim" }, item.summary))))),
                        el(DropdownMenuSeparator, null),
                        el(DropdownMenuLabel, null, "\u0645\u0642\u0627\u06CC\u0633\u0647 \u0628\u0627"),
                        el(DropdownMenuItem, { selected: !state.preview.compareRevisionId, onSelect: () => actions.setCompareRevision(undefined) }, "\u0628\u062F\u0648\u0646 \u0645\u0642\u0627\u06CC\u0633\u0647"),
                        revisions
                            .filter((item) => item.id !== revision?.id)
                            .map((item) => (el(DropdownMenuItem, { key: item.id, icon: el(Rows2, { className: "h-3.5 w-3.5" }), selected: item.id === state.preview.compareRevisionId, onSelect: () => actions.setCompareRevision(item.id) },
                            el("span", { className: "flex items-center gap-2" },
                                "\u0646\u0633\u062E\u0647\u0654 ",
                                fa(item.revision),
                                el("span", { className: "text-y-xs text-y-ink-dim" }, formatClock(item.createdAt)))))),
                        state.preview.height > 0 ? (el(Fragment, null,
                            el(DropdownMenuSeparator, null),
                            el(DropdownMenuItem, { disabled: true },
                                "\u0627\u0631\u062A\u0641\u0627\u0639 \u0635\u0641\u062D\u0647: ",
                                fa(state.preview.height),
                                " px"))) : null)),
                el(Tooltip, { label: "\u0628\u0633\u062A\u0646 \u06A9\u0627\u0631\u06AF\u0627\u0647 \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634" },
                    el(IconButton, { label: "\u0628\u0633\u062A\u0646 \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634", size: "md", onClick: onClose },
                        el(X, { className: "h-4 w-4" }))))),
        state.preview.annotate ? (el("div", { className: "flex flex-wrap items-center gap-2 border-t border-y-line bg-y-accent-soft/40 px-3 py-2" },
            el(Highlighter, { className: "h-3.5 w-3.5 shrink-0 text-y-accent" }),
            el("span", { className: "text-y-xs leading-6 text-y-ink-muted" }, "\u0631\u0648\u06CC \u06CC\u06A9 \u0628\u062E\u0634 \u0628\u0632\u0646 \u062A\u0627 \u067E\u06CC\u0646 \u0628\u06AF\u0630\u0627\u0631\u06CC\u060C \u06CC\u0627 \u0646\u0627\u062D\u06CC\u0647\u200C\u0627\u06CC \u0628\u06A9\u0634. \u062A\u0648\u0636\u06CC\u062D \u0631\u0627 \u062F\u0631 \u067E\u0646\u0644 \u06A9\u0646\u0627\u0631 \u0628\u0646\u0648\u06CC\u0633."),
            el("div", { className: "ms-auto flex items-center gap-2" },
                el(Button, { size: "sm", variant: "ghost", disabled: draftCount === 0, onClick: () => actions.undoAnnotation(), title: "\u0648\u0627\u06AF\u0631\u062F \u0622\u062E\u0631\u06CC\u0646 \u0639\u0644\u0627\u0645\u062A" },
                    el(Undo2, { className: "h-3.5 w-3.5" }),
                    "\u0648\u0627\u06AF\u0631\u062F"),
                el(Button, { size: "sm", variant: draftCount > 0 ? 'primary' : 'secondary', disabled: draftCount === 0, onClick: () => void actions.sendFeedback() },
                    el(Check, { className: "h-3.5 w-3.5" }),
                    "\u0641\u0631\u0633\u062A\u0627\u062F\u0646 ",
                    draftCount > 0 ? `${fa(draftCount)} اصلاح` : 'اصلاحات')))) : null,
        el(Dialog, { open: publishOpen, onOpenChange: setPublishOpen }, publishOpen ? (el(DialogContent, { title: `انتشار آزمایشی نسخهٔ ${fa(revision?.revision ?? 1)}`, description: "\u0627\u06CC\u0646 \u0646\u0633\u062E\u0647 \u0646\u0645\u0627\u06CC\u0634\u06CC \u0627\u0633\u062A: \u0627\u0646\u062A\u0634\u0627\u0631 \u0631\u0648\u06CC \u0633\u0627\u06CC\u062A \u0648\u0627\u0642\u0639\u06CC \u0627\u0646\u062C\u0627\u0645 \u0646\u0645\u06CC\u200C\u0634\u0648\u062F \u0648 \u0641\u0642\u0637 \u0631\u0641\u062A\u0627\u0631 \u0631\u0627\u0628\u0637 \u0631\u0627 \u0646\u0634\u0627\u0646 \u0645\u06CC\u200C\u062F\u0647\u062F.", footer: el(Fragment, null,
                el(Button, { variant: "ghost", size: "sm", onClick: () => setPublishOpen(false), disabled: publishing }, "\u0627\u0646\u0635\u0631\u0627\u0641"),
                el(Button, { variant: "success", size: "sm", onClick: () => void publish(), disabled: publishing },
                    publishing ? el(Spinner, { size: 14 }) : el(Check, { className: "h-3.5 w-3.5" }),
                    "\u0627\u0646\u062A\u0634\u0627\u0631 \u0622\u0632\u0645\u0627\u06CC\u0634\u06CC")) },
            el("ul", { className: "space-y-1.5" },
                el("li", { className: "text-y-sm text-y-ink-muted" },
                    el("span", { className: "text-y-ink-dim" }, "\u0635\u0641\u062D\u0647: "),
                    revision?.pageTitle),
                el("li", { className: "text-y-sm leading-7 text-y-ink-muted" },
                    el("span", { className: "text-y-ink-dim" }, "\u062E\u0644\u0627\u0635\u0647\u0654 \u062A\u063A\u06CC\u06CC\u0631: "),
                    revision?.summary),
                el("li", { className: "text-y-sm text-y-ink-muted" },
                    el("span", { className: "text-y-ink-dim" }, "\u0646\u0638\u0631\u0647\u0627\u06CC \u062B\u0628\u062A\u200C\u0634\u062F\u0647 \u0631\u0648\u06CC \u0627\u06CC\u0646 \u0646\u0633\u062E\u0647: "),
                    el("span", { className: "yagent-num" }, fa(derived.draftAnnotations.length))),
                el("li", { className: "flex items-start gap-1.5 pt-1 text-y-xs leading-6 text-y-ink-dim" }, "\u062F\u0631 \u0646\u0633\u062E\u0647\u0654 \u0646\u0645\u0627\u06CC\u0634\u06CC\u060C \u0644\u06CC\u0646\u06A9 \u0635\u0641\u062D\u0647\u0654 \u0645\u0646\u062A\u0634\u0631\u0634\u062F\u0647 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.")))) : null)));
}
