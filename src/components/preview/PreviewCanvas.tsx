import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AnnotationLayer } from './AnnotationLayer'
import { Badge } from '@/components/ui/badge'
import { cn, fa } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import type { BridgeAnnotation, BridgeAnnotationDraft, PreviewMode } from '@/preview/bridge'
import type { PreviewRevision } from '@/types/model'

const CANVAS_PADDING = 16
const PANE_GAP = 20
const FALLBACK_FRAME_HEIGHT = 720

/**
 * The preview surface. Each revision is rendered at its real device width and —
 * in the default "fit" mode — scaled down with a CSS transform so the whole
 * frame is visible. Because the scale is applied outside the iframe, the page
 * keeps its real layout width (media queries included) and the annotation
 * geometry stays normalised to the page box, so marks stay on their element at
 * every zoom level.
 */
export function PreviewCanvas({ frameKey }: { frameKey: number }) {
  const { state, actions, derived } = useYAgent()
  const revision = derived.currentRevision
  const compareRevision = state.preview.compareRevisionId
    ? state.revisions[state.preview.compareRevisionId]
    : undefined

  const canvasRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(0)

  useEffect(() => {
    const element = canvasRef.current
    if (!element) return
    const update = () => setAvailable(element.clientWidth)
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

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
  const panes = comparing ? 2 : 1
  const deviceWidth = state.preview.width
  /* Both panes keep the full device width: the workspace scrolls or scales, it
     never squeezes a revision into half of the selected device. */
  const usable = Math.max(
    180,
    available - CANVAS_PADDING * 2 - PANE_GAP * (panes - 1),
  )
  const fitScale = available > 0 ? Math.min(1, usable / (panes * deviceWidth)) : 1
  const scale = state.preview.fit ? fitScale : 1
  const contentWidth = panes * deviceWidth * scale + PANE_GAP * (panes - 1)
  const centered = contentWidth <= available - CANVAS_PADDING * 2
  const frameHeight = Math.max(state.preview.height || FALLBACK_FRAME_HEIGHT, 480)

  return (
    <div
      ref={canvasRef}
      className="yagent-canvas-bg h-full min-h-0 w-full overflow-auto overscroll-contain"
    >
      <div
        className={cn(
          'flex min-h-full items-start',
          centered ? 'justify-center' : 'justify-start',
        )}
        style={{ gap: PANE_GAP, padding: CANVAS_PADDING }}
      >
        <PreviewFrame
          revision={revision}
          badge="نسخهٔ فعلی"
          width={deviceWidth}
          scale={scale}
          height={frameHeight}
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
          <PreviewFrame
            revision={compareRevision}
            badge={`نسخهٔ ${fa(compareRevision.revision)}`}
            width={deviceWidth}
            scale={scale}
            height={frameHeight}
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

function PreviewFrame({
  revision,
  badge,
  width,
  scale,
  height,
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
  width: number
  scale: number
  height: number
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
  const scaledWidth = Math.round(width * scale)
  const scaledHeight = Math.round(height * scale)

  return (
    <div className="flex min-w-0 shrink-0 flex-col gap-2" style={{ width: scaledWidth }}>
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
          'relative overflow-hidden rounded-y-md border bg-white shadow-y-soft',
          highlight && mode === 'annotate' ? 'border-y-accent-border' : 'border-y-line-strong',
        )}
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        {/* The unscaled frame stays exactly `width × height`, so the page inside
            lays out (and its media queries evaluate) at the real device width. */}
        <div
          dir="ltr"
          className="absolute left-0 top-0"
          style={{
            width,
            height,
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
    </div>
  )
}
