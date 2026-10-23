import { el, Fragment } from '../../native/dom.js';
import { callback, afterRender, memoValue, stateCell } from '../../native/dom.js';
import { AnnotationLayer } from './AnnotationLayer.js';
import { Badge } from '../ui/badge.js';
import { cn, fa } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/** Canvas box model, kept in one place so the fit-scale math stays honest. */
const CANVAS_PADDING = 16;
const FRAME_GAP = 16;
const FRAME_HEADER_H = 24;
const FRAME_HEADER_GAP = 8;
/**
 * The preview surface.
 *
 * Two independent values drive what is rendered:
 * - the *device width* (`state.preview.width`) is the real CSS width the page is
 *   laid out at inside the iframe — it never changes with the window;
 * - the *display scale* (`state.preview.zoom`) only scales the frame on screen,
 *   `fit` (default) shrinking it to the canvas and `100%` showing it 1:1.
 *
 * Scaling is a CSS transform on the host side, so coordinates inside the page —
 * and therefore annotation geometry, which is stored normalised (0..1) — are
 * untouched. In comparison mode both revisions keep the same device width; they
 * are scaled down together instead of being squeezed into half-width frames.
 */
export function PreviewCanvas({ frameKey }) {
    const { state, actions, derived } = useYAgent();
    const revision = derived.currentRevision;
    const compareRevision = state.preview.compareRevisionId
        ? state.revisions[state.preview.compareRevisionId]
        : undefined;
    const [canvasElement, setCanvasElement] = stateCell(null);
    const [canvas, setCanvas] = stateCell({ width: 0, height: 0 });
    afterRender(() => {
        const element = canvasElement;
        if (!element)
            return;
        const update = () => setCanvas({ width: element.clientWidth, height: element.clientHeight });
        update();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', update);
            return () => window.removeEventListener('resize', update);
        }
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [canvasElement]);
    const bridgeAnnotations = memoValue(() => {
        if (!revision)
            return [];
        return Object.values(state.annotations)
            .filter((annotation) => annotation.revisionId === revision.id)
            .filter((annotation) => annotation.status !== 'draft'
            || state.annotationOwners[annotation.id] === state.preview.conversationId)
            .sort((a, b) => a.index - b.index)
            .map((annotation) => ({
            id: annotation.id,
            index: annotation.index,
            kind: annotation.kind,
            rect: annotation.rect,
            comment: annotation.comment,
            status: annotation.status,
            selected: annotation.id === state.preview.selectedAnnotationId,
        }));
    }, [revision, state.annotations, state.annotationOwners, state.preview.conversationId, state.preview.selectedAnnotationId]);
    const handleCreated = callback((draft) => actions.addBridgeAnnotation(draft), [actions]);
    const handleClick = callback((id) => actions.selectAnnotation(id), [actions]);
    const handleResize = callback((height) => actions.reportPreviewHeight(height), [actions]);
    const mode = state.preview.annotate ? 'annotate' : 'browse';
    if (!revision) {
        return (el("div", { className: "flex h-full items-center justify-center px-6 text-center text-y-base text-y-ink-muted" }, "\u0646\u0633\u062E\u0647\u200C\u0627\u06CC \u0627\u0632 \u0627\u06CC\u0646 \u0635\u0641\u062D\u0647 \u0645\u0648\u062C\u0648\u062F \u0646\u06CC\u0633\u062A."));
    }
    const comparing = Boolean(compareRevision && compareRevision.id !== revision.id);
    const frames = comparing ? 2 : 1;
    const deviceWidth = state.preview.width;
    const availableWidth = Math.max(1, canvas.width - CANVAS_PADDING * 2 - FRAME_GAP * (frames - 1));
    const scale = state.preview.zoom === 'fit' && canvas.width > 0
        ? Math.min(1, availableWidth / frames / deviceWidth)
        : 1;
    const availableHeight = Math.max(160, (canvas.height || 640) - CANVAS_PADDING * 2);
    const frameHeight = availableHeight - FRAME_HEADER_H - FRAME_HEADER_GAP;
    const scaleLabel = `جای‌گیری ${fa(Math.round(scale * 100))}٪`;
    return (el("div", { ref: setCanvasElement, className: "yagent-canvas-bg h-full min-h-0 w-full overflow-auto p-4" },
        el("div", { className: "mx-auto flex h-full w-max gap-4" },
            el(PreviewFrame, { revision: revision, badge: "\u0646\u0633\u062E\u0647\u0654 \u0641\u0639\u0644\u06CC", width: deviceWidth, height: Math.round(frameHeight / scale), scale: scale, note: state.preview.zoom === 'fit' ? scaleLabel : null, mode: mode, annotations: bridgeAnnotations, selectedAnnotationId: state.preview.selectedAnnotationId, frameKey: frameKey, onResize: handleResize, onAnnotationCreated: handleCreated, onAnnotationClick: handleClick, highlight: true }),
            comparing && compareRevision ? (el(PreviewFrame, { revision: compareRevision, badge: `نسخهٔ ${fa(compareRevision.revision)}`, width: deviceWidth, height: Math.round(frameHeight / scale), scale: scale, mode: "browse", annotations: [], frameKey: frameKey, onResize: () => undefined, interactive: false })) : null)));
}
function PreviewFrame({ revision, badge, width, height, scale, note, mode, annotations, selectedAnnotationId, frameKey, onReady, onResize, onAnnotationCreated, onAnnotationClick, interactive = true, highlight = false, }) {
    const displayWidth = Math.max(1, Math.floor(width * scale));
    return (el("div", { className: "flex h-full min-h-0 shrink-0 flex-col gap-2", style: { width: displayWidth } },
        el("div", { className: "flex shrink-0 items-center justify-between gap-2 overflow-hidden px-1", style: { height: FRAME_HEADER_H } },
            el("span", { className: "truncate text-y-xs text-y-ink-dim" }, revision.pageTitle),
            el("span", { className: "flex shrink-0 items-center gap-2" },
                note && displayWidth >= 360 ? el("span", { className: "yagent-num text-y-xs text-y-ink-dim" }, note) : null,
                el(Badge, { variant: revision.status === 'published' ? 'success' : 'neutral' }, badge),
                displayWidth >= 240 ? el(Badge, { variant: revision.status === 'published' ? 'plain' : 'accent' }, revision.status === 'published' ? 'منتشرشده' : 'پیش‌نویس') : null)),
        el("div", { className: "min-h-0 flex-1 overflow-hidden", dir: "ltr" },
            el("div", { className: cn('overflow-hidden rounded-y-md border bg-white shadow-y-soft', highlight && mode === 'annotate' ? 'border-y-accent-border' : 'border-y-line-strong'), style: { width, height, transform: `scale(${scale})`, transformOrigin: 'top left' } },
                el(AnnotationLayer, { revision: revision, mode: mode, annotations: annotations, selectedAnnotationId: selectedAnnotationId, nonce: frameKey, interactive: interactive, onReady: onReady, onResize: onResize, onAnnotationCreated: onAnnotationCreated, onAnnotationClick: onAnnotationClick })))));
}
