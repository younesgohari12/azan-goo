import { useCallback, useMemo } from 'react'

import { AnnotationLayer } from './AnnotationLayer'
import { Badge } from '@/components/ui/badge'
import { cn, fa } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import type { BridgeAnnotation, BridgeAnnotationDraft, PreviewMode } from '@/preview/bridge'
import type { PreviewRevision } from '@/types/model'

/**
 * The preview surface: the current revision at its real width, plus — when the
 * user picks an older revision — a side-by-side comparison of the two.
 */
export function PreviewCanvas({ frameKey }: { frameKey: number }) {
  const { state, actions, derived } = useYAgent()
  const revision = derived.currentRevision
  const compareRevision = state.preview.compareRevisionId
    ? state.revisions[state.preview.compareRevisionId]
    : undefined

  const bridgeAnnotations = useMemo<BridgeAnnotation[]>(() => {
    if (!revision) return []
    return Object.values(state.annotations)
      .filter((annotation) => annotation.revisionId === revision.id)
      .sort((a, b) => a.index - b.index)
      .map((annotation) => ({
        id: annotation.id,
        index: annotation.index,
        kind: annotation.kind,
        rect: annotation.rect,
        comment: annotation.comment,
        status: annotation.status,
        selected: annotation.id === state.preview.selectedAnnotationId,
      }))
  }, [revision, state.annotations, state.preview.selectedAnnotationId])

  const handleCreated = useCallback(
    (draft: BridgeAnnotationDraft) => actions.addBridgeAnnotation(draft),
    [actions],
  )
  const handleClick = useCallback((id: string) => actions.selectAnnotation(id), [actions])
  const handleResize = useCallback((height: number) => actions.reportPreviewHeight(height), [actions])

  const mode: PreviewMode = state.preview.annotate ? 'annotate' : 'browse'

  if (!revision) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-y-base text-y-ink-muted">
        نسخه‌ای از این صفحه موجود نیست.
      </div>
    )
  }

  const comparing = Boolean(compareRevision && compareRevision.id !== revision.id)

  return (
    <div className="yagent-canvas-bg flex h-full min-h-0 w-full justify-center gap-4 overflow-auto p-4">
      <PreviewFrame
        revision={revision}
        badge="نسخهٔ فعلی"
        width={comparing ? Math.max(360, Math.floor(state.preview.width / 2)) : state.preview.width}
        mode={mode}
        annotations={bridgeAnnotations}
        selectedAnnotationId={state.preview.selectedAnnotationId}
        frameKey={frameKey}
        onReady={() => undefined}
        onResize={handleResize}
        onAnnotationCreated={handleCreated}
        onAnnotationClick={handleClick}
        highlight
      />

      {comparing && compareRevision ? (
        <PreviewFrame
          revision={compareRevision}
          badge={`نسخهٔ ${fa(compareRevision.revision)}`}
          width={Math.max(360, Math.floor(state.preview.width / 2))}
          mode="browse"
          annotations={[]}
          frameKey={frameKey}
          onReady={() => undefined}
          onResize={() => undefined}
          interactive={false}
        />
      ) : null}
    </div>
  )
}

function PreviewFrame({
  revision,
  badge,
  width,
  mode,
  annotations,
  selectedAnnotationId,
  frameKey,
  onReady,
  onResize,
  onAnnotationCreated,
  onAnnotationClick,
  interactive = true,
  highlight = false,
}: {
  revision: PreviewRevision
  badge: string
  width: number
  mode: PreviewMode
  annotations: BridgeAnnotation[]
  selectedAnnotationId?: string
  frameKey: number
  onReady: () => void
  onResize: (height: number) => void
  onAnnotationCreated?: (draft: BridgeAnnotationDraft) => void
  onAnnotationClick?: (id: string) => void
  interactive?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex shrink-0 flex-col gap-2" style={{ width }}>
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="truncate text-y-xs text-y-ink-dim">{revision.pageTitle}</span>
        <span className="flex items-center gap-2">
          <Badge variant={revision.status === 'published' ? 'success' : 'neutral'}>{badge}</Badge>
          <Badge variant={revision.status === 'published' ? 'plain' : 'accent'}>
            {revision.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
          </Badge>
        </span>
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-hidden rounded-y-md border bg-white shadow-y-soft',
          highlight && mode === 'annotate' ? 'border-y-accent-border' : 'border-y-line-strong',
        )}
      >
        <AnnotationLayer
          revision={revision}
          mode={mode}
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          nonce={frameKey}
          interactive={interactive}
          onReady={onReady}
          onResize={onResize}
          onAnnotationCreated={onAnnotationCreated}
          onAnnotationClick={onAnnotationClick}
        />
      </div>
    </div>
  )
}
