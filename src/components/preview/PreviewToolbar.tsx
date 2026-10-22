import {
  Check,
  ExternalLink,
  Highlighter,
  History,
  Maximize2,
  Minimize2,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Rocket,
  Rows2,
  Smartphone,
  Tablet,
  Undo2,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/feedback'
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
 * Preview workspace toolbar. Two quiet rows: the page identity plus the
 * decisions that matter (annotate, publish, close) on top; the viewing controls
 * (device, fit, width, reload, history, compare) below.
 */
export function PreviewToolbar({
  onClose,
  onTogglePanel,
  panelOpen,
}: {
  onClose: () => void
  onTogglePanel?: () => void
  panelOpen?: boolean
}) {
  const { state, actions, derived } = useYAgent()
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const revision = derived.currentRevision
  const revisions = [...derived.revisions].sort((a, b) => b.revision - a.revision)
  const draftCount = derived.draftAnnotations.length
  const canPublish = Boolean(
    revision && revision.status === 'draft' && state.capabilities.publish && !derived.running,
  )

  function openInNewTab() {
    if (!revision) return
    const blob = new Blob([buildPreviewDocument(revision)], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  async function publish() {
    if (!revision) return
    setPublishing(true)
    await actions.publishRevision(revision.id)
    setPublishing(false)
    setPublishOpen(false)
  }

  return (
    <div className="shrink-0 border-b border-y-line bg-y-bg-elevated">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {onTogglePanel ? (
            <Tooltip label={panelOpen ? 'بستن پنل مراحل' : 'نمایش مراحل و بازخورد'}>
              <IconButton
                label={panelOpen ? 'بستن پنل مراحل' : 'نمایش مراحل و بازخورد'}
                size="md"
                aria-pressed={Boolean(panelOpen)}
                className={cn(panelOpen && 'bg-y-surface-hover text-y-ink')}
                onClick={onTogglePanel}
              >
                {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </IconButton>
            </Tooltip>
          ) : null}
          <span className="truncate text-y-base font-medium text-y-ink">
            {revision?.pageTitle ?? 'پیش‌نمایش صفحه'}
          </span>
          {revision ? <Badge variant="plain">نسخهٔ {fa(revision.revision)}</Badge> : null}
          {revision ? (
            <Badge variant={revision.status === 'published' ? 'success' : 'accent'}>
              {revision.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
            </Badge>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Tooltip label={state.preview.annotate ? 'پایان علامت‌گذاری' : 'علامت‌گذاری روی صفحه'}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.setAnnotate(!state.preview.annotate)}
              aria-pressed={state.preview.annotate}
              className={cn(
                state.preview.annotate && 'bg-y-accent-soft text-y-accent hover:bg-y-accent-soft',
              )}
            >
              <Highlighter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">علامت‌گذاری</span>
              {draftCount > 0 ? (
                <span className="yagent-num rounded-full bg-y-accent/20 px-1.5 text-y-xs">{fa(draftCount)}</span>
              ) : null}
            </Button>
          </Tooltip>

          <Tooltip label={canPublish ? 'انتشار آزمایشی پیش‌نویس' : 'نسخهٔ فعلی منتشر شده است'}>
            <span className="inline-flex">
              <Button
                size="sm"
                variant="primary"
                disabled={!canPublish}
                onClick={() => setPublishOpen(true)}
                title={canPublish ? 'انتشار آزمایشی پیش‌نویس' : 'نسخهٔ فعلی منتشر شده است'}
              >
                <Rocket className="h-3.5 w-3.5" />
                انتشار
              </Button>
            </span>
          </Tooltip>

          <Tooltip label="بستن کارگاه پیش‌نمایش">
            <IconButton label="بستن پیش‌نمایش" size="md" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 pb-2.5">
        <Segmented value={state.preview.device} options={DEVICES} onChange={(device) => actions.setDevice(device)} />

        <Tooltip label={state.preview.fit ? 'نمایش در اندازهٔ واقعی' : 'تناسب با اندازهٔ کارگاه'}>
          <IconButton
            label={state.preview.fit ? 'نمایش در اندازهٔ واقعی' : 'تناسب با اندازهٔ کارگاه'}
            size="sm"
            variant="secondary"
            aria-pressed={state.preview.fit}
            className={cn(state.preview.fit && 'border-y-accent-border text-y-accent')}
            onClick={() => actions.setFit(!state.preview.fit)}
          >
            {state.preview.fit ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </IconButton>
        </Tooltip>

        <div className="flex items-center gap-2 rounded-y-sm border border-y-line bg-y-surface-soft px-2.5 py-1">
          <input
            type="range"
            min={360}
            max={1600}
            step={20}
            value={state.preview.width}
            aria-label="عرض پیش‌نمایش"
            onChange={(event) => actions.setPreviewWidth(Number(event.target.value))}
            className="h-1 w-20 cursor-pointer sm:w-28"
            style={{ accentColor: 'rgb(var(--y-accent-rgb))' }}
          />
          <span className="yagent-num w-[4.5rem] text-y-xs text-y-ink-dim">{fa(state.preview.width)} px</span>
        </div>

        <span className="ms-auto flex items-center gap-1">
          <Tooltip label="بازخوانی پیش‌نمایش">
            <IconButton label="بازخوانی" size="sm" onClick={() => actions.reloadPreview()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </IconButton>
          </Tooltip>

          <Tooltip label="بازکردن در پنجرهٔ جدید">
            <IconButton label="بازکردن در پنجرهٔ جدید" size="sm" onClick={openInNewTab}>
              <ExternalLink className="h-3.5 w-3.5" />
            </IconButton>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="px-2" aria-label="تاریخچهٔ نسخه‌ها">
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">نسخه‌ها</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[15rem]">
              <DropdownMenuLabel>تاریخچهٔ نسخه‌ها</DropdownMenuLabel>
              {revisions.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  selected={item.id === revision?.id}
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
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant={state.preview.compareRevisionId ? 'secondary' : 'ghost'}
                className="px-2"
                aria-label="مقایسهٔ نسخه‌ها"
              >
                <Rows2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">مقایسه</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[14rem]">
              <DropdownMenuLabel>مقایسه با نسخهٔ دیگر</DropdownMenuLabel>
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
                      <span className="text-y-xs text-y-ink-dim">{formatClock(item.createdAt)}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      {state.preview.annotate ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-y-line bg-y-accent-soft/40 px-3 py-2">
          <Highlighter className="h-3.5 w-3.5 shrink-0 text-y-accent" />
          <span className="text-y-xs leading-6 text-y-ink-muted">
            روی یک بخش بزن تا پین بگذاری، یا ناحیه بکش (موس و لمس). توضیح را در پنل بازخورد بنویس.
          </span>
          <div className="ms-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={draftCount === 0}
              onClick={() => actions.undoAnnotation()}
              title="واگرد آخرین علامت"
            >
              <Undo2 className="h-3.5 w-3.5" />
              واگرد
            </Button>
            <Button
              size="sm"
              variant={draftCount > 0 ? 'primary' : 'secondary'}
              disabled={draftCount === 0}
              onClick={() => void actions.sendFeedback()}
            >
              <Check className="h-3.5 w-3.5" />
              فرستادن {draftCount > 0 ? `${fa(draftCount)} اصلاح` : 'اصلاحات'}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        {publishOpen ? (
          <DialogContent
            title={`انتشار نسخهٔ ${fa(revision?.revision ?? 1)}`}
            description="این نسخه نمایشی است: انتشار فقط وضعیت پیش‌نمایش را تغییر می‌دهد و هیچ درخواستی به سایت واقعی نمی‌فرستد."
            footer={
              <>
                <Button variant="ghost" size="sm" onClick={() => setPublishOpen(false)} disabled={publishing}>
                  رد
                </Button>
                <Button variant="primary" size="sm" onClick={() => void publish()} disabled={publishing}>
                  {publishing ? <Spinner size={14} /> : <Check className="h-3.5 w-3.5" />}
                  {publishing ? 'در حال انتشار…' : 'انتشار آزمایشی'}
                </Button>
              </>
            }
          >
            <ul className="space-y-1.5">
              <li className="text-y-sm text-y-ink-muted">
                <span className="text-y-ink-dim">صفحه: </span>
                {revision?.pageTitle}
              </li>
              <li className="text-y-sm text-y-ink-muted">
                <span className="text-y-ink-dim">خلاصهٔ تغییر: </span>
                {revision?.summary}
              </li>
              <li className="text-y-sm text-y-ink-muted">
                <span className="text-y-ink-dim">نظرهای ثبت‌شده روی این نسخه: </span>
                <span className="yagent-num">{fa(derived.draftAnnotations.length)}</span>
              </li>
            </ul>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}
