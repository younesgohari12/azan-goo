import { useCallback, useMemo } from 'react'

import { AnnotationLayer } from './AnnotationLayer'
import { Badge } from '@/components/ui/badge'
import { useElementSize } from '@/hooks/useElementSize'
import { cn, fa } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import type { BridgeAnnotation, BridgeAnnotationDraft, PreviewMode } from '@/preview/bridge'
import type { PreviewRevision } from '@/types/model'

const FRAME_GAP = 16
/** Below this, two frames side by side stop being readable — stack them instead. */
const MIN_SIDE_BY_SIDE = 760

/**
 * The preview surface: the current revision rendered at its real device width,
 * plus — when the user picks an older revision — the two side by side.
 *
 * The device frame is laid out at the width the user selected and shrunk with a
 * display-only CSS scale when "fit" is on. The scale never touches the iframe's
 * own viewport (the iframe is still `width` CSS pixels wide inside), so a pin
 * drawn at 60% of the page is stored at 60% of the page, and the annotation
 * coordinates stay correct at every zoom level. Comparison also keeps both
 * frames at the selected device width instead of halving it.
 */
export function PreviewCanvas({ frameKey }: { frameKey: number }) {
  const { state, actions, derived } = useYAgent()
  const { ref: canvasRef, size: canvas } = useElementSize<HTMLDivElement>()
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

  const handleCreated = useCallback((draft: BridgeAnnotationDraft) => actions.addBridgeAnnotation(draft), [actions])
  const handleClick = useCallback((id: string) => actions.selectAnnotation(id), [actions])
  const handleResize = useCallback((height: number) => actions.reportPreviewHeight(height), [actions])

  const mode: PreviewMode = state.preview.annotate ? 'annotate' : 'browse'

  if (!revision) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center px-6 text-center text-y-base text-y-ink-muted">
        نسخه‌ای از این صفحه موجود نیست.
      </div>
    )
  }

  const comparing = Boolean(compareRevision && compareRevision.id !== revision.id)
  const deviceWidth = state.preview.width
  const columnWidth = Math.max(320, canvas.width - 32 - (comparing ? FRAME_GAP : 0))
  const stacked = comparing && columnWidth < MIN_SIDE_BY_SIDE
  const perFrame = comparing && !stacked ? Math.floor(columnWidth / 2) : columnWidth
  const scale = state.preview.zoom === 'actual' ? 1 : Math.min(1, perFrame / deviceWidth)
  const frameHeight = Math.max(320, Math.round(canvas.height - 104))

  return (
    <div ref={canvasRef} className="yagent-canvas-bg h-full min-h-0 w-full overflow-auto p-4">
      <div
        className={cn(
          'flex min-h-full w-full items-start justify-center',
          stacked ? 'flex-col items-center gap-4' : 'flex-row gap-4',
        )}
      >
        <DeviceFrame
          revision={revision}
          badge="نسخهٔ فعلی"
          deviceWidth={deviceWidth}
          scale={scale}
          frameHeight={frameHeight}
          mode={mode}
          annotations={bridgeAnnotations}
          selectedAnnotationId={state.preview.selectedAnnotationId}
          frameKey={frameKey}
          onResize={handleResize}
          onAnnotationCreated={handleCreated}
          onAnnotationClick={handleClick}
          highlight
        />

        {comparing && compareRevision ? (
          <DeviceFrame
            revision={compareRevision}
            badge={`نسخهٔ ${fa(compareRevision.revision)}`}
            deviceWidth={deviceWidth}
            scale={scale}
            frameHeight={frameHeight}
            mode="browse"
            annotations={[]}
            frameKey={frameKey}
            interactive={false}
          />
        ) : null}
      </div>
    </div>
  )
}

function DeviceFrame({
  revision,
  badge,
  deviceWidth,
  scale,
  frameHeight,
  mode,
  annotations,
  selectedAnnotationId,
  frameKey,
  onResize,
  onAnnotationCreated,
  onAnnotationClick,
  interactive = true,
  highlight = false,
}: {
  revision: PreviewRevision
  badge: string
  deviceWidth: number
  scale: number
  frameHeight: number
  mode: PreviewMode
  annotations: BridgeAnnotation[]
  selectedAnnotationId?: string
  frameKey: number
  onResize?: (height: number) => void
  onAnnotationCreated?: (draft: BridgeAnnotationDraft) => void
  onAnnotationClick?: (id: string) => void
  interactive?: boolean
  highlight?: boolean
}) {
  return (
    <div className="shrink-0" style={{ width: Math.round(deviceWidth * scale) }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-y-xs text-y-ink-muted">{revision.pageTitle}</span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge variant={revision.status === 'published' ? 'success' : 'neutral'}>{badge}</Badge>
          <Badge variant={revision.status === 'published' ? 'plain' : 'accent'}>
            {revision.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
          </Badge>
        </span>
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-y-md border bg-white shadow-y-soft',
          highlight && mode === 'annotate' ? 'border-y-accent-border' : 'border-y-line-strong',
        )}
        style={{ height: Math.round(frameHeight * scale) }}
      >
        <div
          style={{
            width: deviceWidth,
            height: frameHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <AnnotationLayer
            revision={revision}
            mode={mode}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            nonce={frameKey}
            interactive={interactive}
            onResize={onResize}
            onAnnotationCreated={onAnnotationCreated}
            onAnnotationClick={onAnnotationClick}
          />
        </div>
      </div>

      <p className="mt-1.5 text-center text-y-xs text-y-ink-dim">
        {fa(deviceWidth)} × {fa(frameHeight)} پیکسل
        {scale < 1 ? ` — نمایش با ${fa(Math.round(scale * 100))}٪` : ''}
      </p>
    </div>
  )
}
