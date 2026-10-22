import {
  Check,
  ExternalLink,
  Highlighter,
  History,
  LayoutPanelLeft,
  Monitor,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Rows2,
  Smartphone,
  Tablet,
  Undo2,
  X,
} from 'lucide-react'
import { type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Segmented } from '@/components/ui/segmented'
import { Tooltip } from '@/components/ui/tooltip'
import { cn, fa, formatClock } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import { buildPreviewDocument } from '@/preview/buildPreviewDocument'
import type { PreviewDevice } from '@/types/model'

const DEVICES: Array<{ value: PreviewDevice; label: string; icon: ReactNode }> = [
  { value: 'desktop', label: 'دسکتاپ', icon: <Monitor className="h-3.5 w-3.5" /> },
  { value: 'tablet', label: 'تبلت', icon: <Tablet className="h-3.5 w-3.5" /> },
  { value: 'mobile', label: 'موبایل', icon: <Smartphone className="h-3.5 w-3.5" /> },
]

/**
 * Preview toolbar, grouped by intent: where you are and what you can do to the
 * page on the first row (publish, close), how you look at it on the second
 * (device, zoom, width, annotation), and everything secondary — reload, open in
 * a window, revision history and comparison — behind the "more" menu.
 */
export function PreviewToolbar({
  onClose,
  onTogglePanel,
  panelOpen,
  onRequestPublish,
  canPublish,
}: {
  onClose: () => void
  onTogglePanel?: () => void
  panelOpen?: boolean
  onRequestPublish: () => void
  canPublish: boolean
}) {
  const { state, actions, derived } = useYAgent()

  const revision = derived.currentRevision
  const revisions = [...derived.revisions].sort((a, b) => b.revision - a.revision)
  const draftCount = derived.draftAnnotations.length

  function openInNewTab() {
    if (!revision) return
    const blob = new Blob([buildPreviewDocument(revision)], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="border-b border-y-line bg-y-bg-elevated">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        {onTogglePanel ? (
          <Tooltip label={panelOpen ? 'جمع‌کردن مراحل انجام کار' : 'نمایش مراحل انجام کار'}>
            <IconButton
              label="مراحل انجام کار"
              className="yagent-tap"
              aria-pressed={panelOpen}
              onClick={onTogglePanel}
            >
              {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </IconButton>
          </Tooltip>
        ) : null}

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="truncate text-y-base font-medium text-y-ink">{revision?.pageTitle ?? 'پیش‌نمایش صفحه'}</h2>
          {revision ? (
            <Badge variant={revision.status === 'published' ? 'success' : 'accent'}>
              {revision.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
            </Badge>
          ) : null}
          {revision ? <Badge variant="plain">نسخهٔ {fa(revision.revision)}</Badge> : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="success"
            className="yagent-tap h-9"
            disabled={!canPublish}
            onClick={onRequestPublish}
            title={canPublish ? 'انتشار آزمایشی این نسخهٔ پیش‌نویس' : 'نسخهٔ فعلی منتشر شده است'}
          >
            <Check className="h-3.5 w-3.5" />
            انتشار
          </Button>
          <Tooltip label="بستن پیش‌نمایش">
            <IconButton label="بستن پیش‌نمایش" className="yagent-tap" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 pb-2.5">
        <Segmented
          value={state.preview.device}
          options={DEVICES}
          label="اندازهٔ دستگاه"
          onChange={(device) => actions.setDevice(device)}
        />

        <Segmented
          size="sm"
          label="مقیاس نمایش"
          value={state.preview.zoom}
          onChange={(zoom) => actions.setZoom(zoom)}
          options={[
            { value: 'fit', label: 'تناسب' },
            { value: 'actual', label: '۱۰۰٪' },
          ]}
        />

        <div className="flex items-center gap-2 rounded-y-sm border border-y-line bg-y-surface-soft px-2.5 py-1">
          <input
            type="range"
            min={360}
            max={1600}
            step={20}
            value={state.preview.width}
            aria-label="عرض پیش‌نمایش"
            onChange={(event) => actions.setPreviewWidth(Number(event.target.value))}
            className="h-1.5 w-24 cursor-pointer sm:w-32"
            style={{ accentColor: 'rgb(var(--y-accent))' }}
          />
          <span className="yagent-num w-[4.5rem] text-y-xs text-y-ink-dim">{fa(state.preview.width)} px</span>
        </div>

        <button
          type="button"
          onClick={() => actions.setAnnotate(!state.preview.annotate)}
          aria-pressed={state.preview.annotate}
          className={cn(
            'yagent-tap inline-flex h-9 items-center gap-1.5 rounded-y-sm border px-2.5 text-y-sm transition-colors duration-y-fast ease-y',
            state.preview.annotate
              ? 'border-y-accent-border bg-y-accent-soft text-y-accent'
              : 'border-y-line bg-y-surface-soft text-y-ink-muted hover:text-y-ink',
          )}
        >
          <Highlighter className="h-3.5 w-3.5" />
          علامت‌گذاری
          {draftCount > 0 ? (
            <span className="yagent-num rounded-full bg-y-accent/25 px-1.5 text-y-xs">{fa(draftCount)}</span>
          ) : null}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="yagent-tap h-9" aria-label="ابزارهای بیشتر پیش‌نمایش">
              <MoreHorizontal className="h-4 w-4" />
              بیشتر
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[16rem]">
            <DropdownMenuItem icon={<RefreshCw className="h-3.5 w-3.5" />} onSelect={() => actions.reloadPreview()}>
              بازخوانی پیش‌نمایش
            </DropdownMenuItem>
            <DropdownMenuItem icon={<ExternalLink className="h-3.5 w-3.5" />} onSelect={openInNewTab}>
              بازکردن در پنجرهٔ جدید
            </DropdownMenuItem>
            {state.preview.height > 0 ? (
              <DropdownMenuItem icon={<LayoutPanelLeft className="h-3.5 w-3.5" />} disabled>
                <span className="yagent-num">ارتفاع صفحه: {fa(state.preview.height)} px</span>
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>تاریخچهٔ نسخه‌ها</DropdownMenuLabel>
            {revisions.map((item) => (
              <DropdownMenuItem
                key={item.id}
                selected={item.id === revision?.id}
                icon={<History className="h-3.5 w-3.5" />}
                onSelect={() => actions.selectRevision(item.id)}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-y-base text-y-ink">
                    نسخهٔ {fa(item.revision)}
                    <Badge variant={item.status === 'published' ? 'success' : 'accent'}>
                      {item.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-y-xs text-y-ink-dim">{item.summary}</span>
                </span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>مقایسه با</DropdownMenuLabel>
            <DropdownMenuItem
              selected={!state.preview.compareRevisionId}
              onSelect={() => actions.setCompareRevision(undefined)}
            >
              بدون مقایسه
            </DropdownMenuItem>
            {revisions
              .filter((item) => item.id !== revision?.id)
              .map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  selected={item.id === state.preview.compareRevisionId}
                  icon={<Rows2 className="h-3.5 w-3.5" />}
                  onSelect={() => actions.setCompareRevision(item.id)}
                >
                  <span className="flex items-center gap-2">
                    نسخهٔ {fa(item.revision)}
                    <span className="yagent-num text-y-xs text-y-ink-dim">{formatClock(item.createdAt)}</span>
                  </span>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {state.preview.annotate ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-y-line bg-y-accent-soft px-3 py-2">
          <Highlighter className="h-3.5 w-3.5 shrink-0 text-y-accent" />
          <span className="min-w-0 flex-1 text-y-xs text-y-ink-muted">
            روی یک بخش بزن تا پین بگذاری، یا بکش تا ناحیه بسازی — با موس و با لمس. در این حالت اسکرول صفحه
            غیرفعال است؛ برای اسکرول، حالت علامت‌گذاری را خاموش کن.
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="yagent-tap h-9"
              disabled={draftCount === 0}
              onClick={() => actions.undoAnnotation()}
            >
              <Undo2 className="h-3.5 w-3.5" />
              واگرد
            </Button>
            <Button
              size="sm"
              variant={draftCount > 0 ? 'primary' : 'secondary'}
              className="yagent-tap h-9"
              disabled={draftCount === 0}
              onClick={() => void actions.sendFeedback()}
            >
              <Check className="h-3.5 w-3.5" />
              {draftCount > 0 ? `فرستادن ${fa(draftCount)} اصلاح` : 'فرستادن اصلاحات'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
