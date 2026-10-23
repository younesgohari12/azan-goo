import { el, Fragment } from '../../native/dom.js';
import { callback, afterRender, memoValue, reference, stateCell } from '../../native/dom.js';
import { HOST_SOURCE, isPreviewMessage, } from '../../preview/bridge.js';
import { buildPreviewDocument } from '../../preview/buildPreviewDocument.js';
/**
 * Renders a revision inside an isolated iframe and speaks to it exclusively
 * through the message bridge: the shell never reads or writes the preview's DOM.
 * The same component therefore works when the previewed page lives on another
 * origin (the WordPress front-end) or in a sandboxed document without
 * `allow-same-origin`.
 */
export function AnnotationLayer({ revision, mode, annotations, selectedAnnotationId, nonce, interactive = true, onReady, onResize, onAnnotationCreated, onAnnotationClick, }) {
    const iframeRef = reference(null);
    const [ready, setReady] = stateCell(false);
    const document = memoValue(() => buildPreviewDocument(revision), [revision]);
    const post = callback((message) => {
        iframeRef.current?.contentWindow?.postMessage(message, '*');
    }, []);
    afterRender(() => {
        function handleMessage(event) {
            if (event.source !== iframeRef.current?.contentWindow)
                return;
            if (!isPreviewMessage(event.data))
                return;
            const message = event.data;
            if (message.type === 'ready') {
                setReady(true);
                onReady?.(message.payload);
            }
            else if (message.type === 'resize') {
                onResize?.(message.payload.height);
            }
            else if (message.type === 'created') {
                onAnnotationCreated?.(message.payload);
            }
            else if (message.type === 'annotation:click') {
                onAnnotationClick?.(message.payload.annotationId);
            }
        }
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onReady, onResize, onAnnotationCreated, onAnnotationClick]);
    afterRender(() => {
        setReady(false);
    }, [revision.id, nonce]);
    afterRender(() => {
        if (!ready)
            return;
        post({ source: HOST_SOURCE, type: 'mode', mode: interactive ? mode : 'browse' });
    }, [ready, mode, interactive, post]);
    afterRender(() => {
        if (!ready)
            return;
        post({ source: HOST_SOURCE, type: 'sync', annotations });
    }, [ready, annotations, post]);
    afterRender(() => {
        if (!ready)
            return;
        post({ source: HOST_SOURCE, type: 'select', annotationId: selectedAnnotationId });
    }, [ready, selectedAnnotationId, post]);
    return (el("iframe", { key: `${revision.id}-${nonce}`, ref: iframeRef, title: `پیش‌نمایش ${revision.pageTitle}`, srcDoc: document, 
        // The shell never touches this document's DOM; isolation here keeps the
        // page's CSS/JS out of the admin UI. Dropping `allow-same-origin` (the
        // configuration used for cross-origin previews) changes nothing for the
        // bridge, because all traffic goes through postMessage.
        sandbox: "allow-scripts", onLoad: () => post({ source: HOST_SOURCE, type: 'hello' }), className: "block h-full w-full bg-white" }));
}
