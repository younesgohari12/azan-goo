import { el, Fragment } from '../../native/dom.js';
import { PreviewCanvas } from './PreviewCanvas.js';
import { PreviewToolbar } from './PreviewToolbar.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/**
 * Canvas mode: the chat stays in a narrow column, the preview takes the room,
 * the history collapses to a rail and the panel becomes a drawer (see YAgentApp).
 */
export function PreviewWorkspace() {
    const { actions, state } = useYAgent();
    return (el("div", { className: "flex h-full min-h-0 min-w-0 flex-1 flex-col bg-y-bg" },
        el(PreviewToolbar, { onClose: () => actions.closePreview(), onTogglePanel: () => actions.setPanel({ open: !state.panelOpen }), panelOpen: state.panelOpen }),
        el('p', { className: 'yagent-proposal-note' }, 'پیش‌نمایش محتوای پیشنهادی؛ قالب، کدهای خارجی و ابزارک‌ها ممکن است در سایت متفاوت باشند.'),
        el("div", { className: "min-h-0 flex-1" },
            el(PreviewCanvas, { frameKey: state.preview.nonce }))));
}
