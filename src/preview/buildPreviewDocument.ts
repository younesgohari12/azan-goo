import type { PreviewRevision } from '@/types/model'
import { PREVIEW_BRIDGE_SCRIPT } from './bridge'

/**
 * Wraps a revision's HTML into the document loaded by the preview iframe: the
 * page's own markup plus the bridge runtime. The page is never modified, so the
 * preview stays faithful to what WordPress will render.
 */
export function buildPreviewDocument(revision: PreviewRevision): string {
  const script = `<script>${PREVIEW_BRIDGE_SCRIPT}</script>`
  if (/<\/body>/i.test(revision.html)) {
    return revision.html.replace(/<\/body>/i, `${script}</body>`)
  }
  return `${revision.html}${script}`
}
