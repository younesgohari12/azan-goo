import { PREVIEW_BRIDGE_SCRIPT } from './bridge.js';
/**
 * Wraps a revision's HTML into the document loaded by the preview iframe: the
 * page's own markup plus the bridge runtime. The page is never modified, so the
 * preview stays faithful to what WordPress will render.
 */
export function buildPreviewDocument(revision) {
    const script = `<script>${PREVIEW_BRIDGE_SCRIPT}</script>`;
    const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https:; font-src https: data:; script-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'">`;
    const html = revision.html.replace(/<base\b[^>]*>/gi, '');
    return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">${policy}<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}${script}</body></html>`;
}
