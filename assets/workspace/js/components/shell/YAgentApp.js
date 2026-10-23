import { el, Fragment } from '../../native/dom.js';
import { MotionConfig } from '../../native/motion.js';
import { ListChecks, MessageSquare, MessageSquareWarning, MonitorPlay, PanelLeftOpen, PanelRight } from '../../icons.js';
import { afterRender, stateCell } from '../../native/dom.js';
import { TaskPanel } from '../activity/TaskPanel.js';
import { ChatComposer } from '../chat/ChatComposer.js';
import { ChatThread } from '../chat/ChatThread.js';
import { PreviewWorkspace } from '../preview/PreviewWorkspace.js';
import { ChatSidebar, YAgentMark } from '../sidebar/ChatSidebar.js';
import { Button, IconButton } from '../ui/button.js';
import { Dialog, DialogContent, Sheet } from '../ui/dialog.js';
import { Segmented } from '../ui/segmented.js';
import { Tooltip, TooltipProvider } from '../ui/tooltip.js';
import { useIsDesktop, useIsWide } from '../../hooks/useMediaQuery.js';
import { cn, fa } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/**
 * Product shell.
 *
 * Desktop: conversations on the right, chat in the middle, work plan on the left
 * (three independently scrolling columns). Closing the plan leaves a slim rail
 * behind, so it can always be brought back.
 * Preview mode: history collapses to a rail, the chat narrows, the canvas takes
 * the room; between 1024px and 1280px the plan/feedback opens as a real drawer
 * over the canvas.
 * Mobile: the same pieces as drawers plus a chat/preview tab switch.
 */
export function YAgentApp() {
    const { state, actions, derived } = useYAgent();
    const isDesktop = useIsDesktop();
    const isWide = useIsWide();
    const [sidebarSheet, setSidebarSheet] = stateCell(false);
    const [panelSheet, setPanelSheet] = stateCell(false);
    const [mobileView, setMobileView] = stateCell('chat');
    const previewOpen = state.preview.open;
    afterRender(() => {
        if (previewOpen && !isDesktop)
            setMobileView('preview');
        if (!previewOpen)
            setMobileView('chat');
    }, [previewOpen, isDesktop]);
    const railForced = previewOpen;
    const sidebarCollapsed = state.sidebarCollapsed || railForced;
    const panelDocked = isDesktop && state.panelOpen && (!previewOpen || isWide);
    /** Preview on a 1024–1279px screen: the plan has no room to dock, so it opens
     *  as a drawer over the canvas — which is what makes writing a note possible
     *  while looking at the page. */
    const panelPreviewDrawer = isDesktop && previewOpen && !isWide;
    const panelRail = isDesktop && !state.panelOpen && !previewOpen;
    const historyColumn = (el(ChatSidebar, { collapsed: sidebarCollapsed && isDesktop, onToggleCollapse: isDesktop
            ? () => railForced ? setSidebarSheet(true) : actions.toggleSidebar()
            : undefined, onSelectConversation: () => setSidebarSheet(false) }));
    const panelColumn = el(TaskPanel, { onCollapse: isDesktop ? () => actions.setPanel({ open: false }) : undefined });
    return (el(MotionConfig, { reducedMotion: "user" },
        el(TooltipProvider, null,
            el("div", { className: "yagent-root yagent-viewport flex w-full min-w-0 flex-col bg-y-bg lg:flex-row", dir: "rtl" },
                isDesktop ? (el(Fragment, null,
                    el("div", { className: cn('shrink-0 border-s border-y-line transition-[width] duration-y-slow ease-y', sidebarCollapsed ? 'w-[var(--y-sidebar-rail-w)]' : 'w-[var(--y-sidebar-w)]') }, historyColumn),
                    el("main", { className: cn('flex min-h-0 min-w-0 flex-col', previewOpen ? 'w-[24rem] shrink-0 border-s border-y-line xl:w-[26rem]' : 'flex-1') },
                        el(ChatThread, null),
                        el(ChatComposer, null)),
                    previewOpen ? el(PreviewWorkspace, null) : null,
                    panelDocked ? (el("div", { className: "w-[var(--y-panel-w)] shrink-0 border-e border-y-line" }, panelColumn)) : null,
                    panelRail ? el(PanelRail, null) : null)) : (el(Fragment, null,
                    el("header", { className: "flex shrink-0 items-center gap-1.5 border-b border-y-line bg-y-sidebar px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]" },
                        el(IconButton, { label: "\u062A\u0627\u0631\u06CC\u062E\u0686\u0647\u0654 \u06AF\u0641\u062A\u06AF\u0648\u0647\u0627", size: "md", onClick: () => setSidebarSheet(true) },
                            el(PanelRight, { className: "h-4 w-4" })),
                        el(YAgentMark, { className: "h-7 w-7 shrink-0" }),
                        el("div", { className: "min-w-0 flex-1" },
                            el("div", { className: "yagent-ltr truncate text-start text-y-md font-semibold text-y-ink" }, "YAgent"),
                            el("div", { className: "truncate text-y-xs text-y-ink-dim" }, derived.activeConversation?.title ?? 'دستیار وردپرس')),
                        previewOpen ? (el(Segmented, { size: "sm", value: mobileView, onChange: setMobileView, options: [
                                { value: 'chat', label: 'چت', icon: el(MessageSquare, { className: "h-3.5 w-3.5" }) },
                                { value: 'preview', label: 'پیش‌نمایش', icon: el(MonitorPlay, { className: "h-3.5 w-3.5" }) },
                            ] })) : null,
                        el(IconButton, { label: "\u0645\u0631\u0627\u062D\u0644 \u0627\u0646\u062C\u0627\u0645 \u06A9\u0627\u0631", size: "md", onClick: () => setPanelSheet(true) },
                            el(PanelLeftOpen, { className: "h-4 w-4" }))),
                    el("div", { className: "flex min-h-0 min-w-0 flex-1 flex-col" }, previewOpen && mobileView === 'preview' ? (el(PreviewWorkspace, null)) : (el(Fragment, null,
                        el(ChatThread, null),
                        el(ChatComposer, null)))))),
                el(Sheet, { open: sidebarSheet, onOpenChange: setSidebarSheet, side: "right", title: "\u062A\u0627\u0631\u06CC\u062E\u0686\u0647\u0654 \u06AF\u0641\u062A\u06AF\u0648\u0647\u0627", className: "bg-y-sidebar" },
                    el(ChatSidebar, { onSelectConversation: () => setSidebarSheet(false) })),
                el(Sheet, { open: panelSheet, onOpenChange: setPanelSheet, side: "left", title: "\u0645\u0631\u0627\u062D\u0644 \u0627\u0646\u062C\u0627\u0645 \u06A9\u0627\u0631" },
                    el(TaskPanel, null)),
                panelPreviewDrawer ? (el(Sheet, { open: state.panelOpen, onOpenChange: (open) => actions.setPanel({ open }), side: "left", title: "\u0645\u0631\u0627\u062D\u0644 \u0648 \u0628\u0627\u0632\u062E\u0648\u0631\u062F" },
                    el(TaskPanel, null))) : null),
            el(Dialog, { open: Boolean(state.confirmDeleteConversationId), onOpenChange: (open) => {
                    if (!open)
                        actions.dismissDelete();
                } }, state.confirmDeleteConversationId ? (el(DialogContent, { title: "\u062D\u0630\u0641 \u06AF\u0641\u062A\u06AF\u0648", description: "\u0627\u06CC\u0646 \u06AF\u0641\u062A\u06AF\u0648 \u0648 \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC\u0634 \u062D\u0630\u0641 \u0645\u06CC\u200C\u0634\u0648\u062F. \u0627\u06CC\u0646 \u06A9\u0627\u0631 \u0628\u0631\u06AF\u0634\u062A\u200C\u067E\u0630\u06CC\u0631 \u0646\u06CC\u0633\u062A.", footer: el(Fragment, null,
                    el(Button, { variant: "ghost", size: "sm", onClick: () => actions.dismissDelete() }, "\u0644\u063A\u0648"),
                    el(Button, { variant: "danger", size: "sm", onClick: () => void actions.confirmDelete() }, "\u062D\u0630\u0641 \u06A9\u0646")) })) : null))));
}
/**
 * What is left of the work plan once it is closed: a slim, always-present rail
 * that brings back either tab of the panel.
 */
function PanelRail() {
    const { derived, actions } = useYAgent();
    const draftCount = derived.draftAnnotations.length;
    const { done, total, percent } = derived.taskProgress;
    return (el("div", { className: "flex w-[var(--y-panel-rail-w)] shrink-0 flex-col items-center gap-2 border-e border-y-line bg-y-bg-elevated py-3" },
        el(Tooltip, { label: "\u0646\u0645\u0627\u06CC\u0634 \u0645\u0631\u0627\u062D\u0644 \u0627\u0646\u062C\u0627\u0645 \u06A9\u0627\u0631", side: "right" },
            el(IconButton, { label: "\u0646\u0645\u0627\u06CC\u0634 \u0645\u0631\u0627\u062D\u0644 \u0627\u0646\u062C\u0627\u0645 \u06A9\u0627\u0631", size: "md", variant: "secondary", className: "border-y-line bg-y-surface-soft", onClick: () => actions.setPanel({ open: true, tab: 'steps' }) },
                el(ListChecks, { className: "h-4 w-4" }))),
        total > 0 ? (el("span", { className: "yagent-num text-[10px] text-y-ink-dim", title: `${fa(done)} از ${fa(total)}` },
            fa(percent),
            "\u066A")) : null,
        el("span", { className: "my-0.5 h-px w-5 bg-y-line" }),
        el(Tooltip, { label: "\u0646\u0645\u0627\u06CC\u0634 \u0628\u0627\u0632\u062E\u0648\u0631\u062F \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634", side: "right" },
            el(IconButton, { label: "\u0646\u0645\u0627\u06CC\u0634 \u0628\u0627\u0632\u062E\u0648\u0631\u062F \u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634", size: "md", variant: "secondary", className: "border-y-line bg-y-surface-soft", onClick: () => actions.setPanel({ open: true, tab: 'feedback' }) },
                el(MessageSquareWarning, { className: "h-4 w-4" }))),
        draftCount > 0 ? (el("span", { className: "yagent-num text-[10px] text-y-accent", title: "\u0646\u0638\u0631\u0647\u0627\u06CC \u0622\u0645\u0627\u062F\u0647\u0654 \u0627\u0631\u0633\u0627\u0644" }, fa(draftCount))) : null));
}
