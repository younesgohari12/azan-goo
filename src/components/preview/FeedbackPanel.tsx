import { AlertTriangle, Check, Highlighter, MapPin, MessageSquareWarning, Send, Trash2, Undo2 } from 'lucide-react'
import { useMemo } from 'react'

import { ANNOTATION_STATUS_META, isReviewNeeded } from './annotationStatus'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { cn, fa, formatRelative, truncate } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import type { Annotation } from '@/types/model'

/**
 * Feedback panel: the notes written on the preview.
 * Drafts live in local state (editable, deletable, undoable); after sending they
 * come back from the adapter with a `sent` status, and become `stale` /
 * `unmatched` when a newer revision makes them worth a second look.
 */
export function FeedbackPanel() {
  const { state, actions, derived } = useYAgent()
  const pageId = state.preview.pageId
  const drafts = derived.draftAnnotations

  const others = useMemo(
    () =>
      Object.values(state.annotations)
        .filter((annotation) => annotation.pageId === pageId && annotation.status !== 'draft')
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.annotations, pageId],
  )

  const reviewNeeded = others.filter((annotation) => isReviewNeeded(annotation.status))
  const history = others.filter((annotation) => !isReviewNeeded(annotation.status))
  const emptyCommentCount = drafts.filter((annotation) => annotation.comment.trim().length === 0).length

  if (!pageId) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-14 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-y-md bg-y-surface-soft text-y-ink-dim">
          <MessageSquareWarning className="h-4 w-4" />
        </span>
        <p className="text-y-base text-y-ink-muted">پیش‌نمایشی باز نیست.</p>
        <p className="text-y-xs leading-6 text-y-ink-dim">
          یک صفحه را در حالت پیش‌نمایش باز کن تا بتوانی روی بخش‌هایش علامت بگذاری و نظر بنویسی.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-y-md border border-y-line bg-y-surface-soft/60 p-2.5">
        <button
          type="button"
          onClick={() => actions.setAnnotate(!state.preview.annotate)}
          className={cn(
            'flex w-full items-center gap-2 rounded-y-sm border px-2.5 py-2 text-y-sm transition-colors duration-y-fast',
            state.preview.annotate
              ? 'border-y-accent-border bg-y-accent-soft text-y-accent'
              : 'border-y-line bg-y-bg/50 text-y-ink-muted hover:text-y-ink',
          )}
        >
          <Highlighter className="h-3.5 w-3.5" />
          {state.preview.annotate ? 'حالت علامت‌گذاری روشن است' : 'روشن‌کردن حالت علامت‌گذاری'}
        </button>
        <p className="mt-2 text-y-xs leading-6 text-y-ink-dim">
          کلیک روی یک بخش = پین · کشیدن موس = ناحیه. علامت‌ها شماره‌گذاری می‌شوند و در همین گفتگو ثبت می‌شوند.
        </p>
      </div>

      <section className="space-y-2">
        <header className="flex items-center justify-between">
          <h3 className="text-y-sm font-medium text-y-ink">نظرهای این نسخه</h3>
          <span className="yagent-num text-y-xs text-y-ink-dim">{fa(drafts.length)}</span>
        </header>

        {drafts.length === 0 ? (
          <p className="rounded-y-sm border border-dashed border-y-line px-3 py-3 text-y-xs leading-6 text-y-ink-dim">
            هنوز علامتی ثبت نکرده‌ای. حالت علامت‌گذاری را روشن کن و روی بخشی از پیش‌نمایش بزن.
          </p>
        ) : (
          <ul className="space-y-2">
            {drafts.map((annotation) => (
              <DraftCard key={annotation.id} annotation={annotation} selected={annotation.id === state.preview.selectedAnnotationId} />
            ))}
          </ul>
        )}

        {drafts.length > 0 ? (
          <>
            {emptyCommentCount > 0 ? (
              <p className="flex items-start gap-1.5 text-y-xs leading-6 text-y-warn">
                <AlertTriangle className="mt-1.5 h-3.5 w-3.5 shrink-0" />
                {fa(emptyCommentCount)} علامت هنوز توضیح ندارد؛ توضیح‌دادن باعث می‌شود اصلاح دقیق‌تر انجام شود.
              </p>
            ) : null}
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="primary" className="flex-1" onClick={() => void actions.sendFeedback()}>
                <Send className="h-3.5 w-3.5" />
                ارسال اصلاحات به دستیار
              </Button>
              <Button variant="ghost" size="sm" onClick={() => actions.undoAnnotation()} title="واگرد آخرین علامت">
                <Undo2 className="h-3.5 w-3.5" />
                واگرد
              </Button>
            </div>
          </>
        ) : null}
      </section>

      {reviewNeeded.length > 0 ? (
        <section className="space-y-2">
          <header className="flex items-center justify-between">
            <h3 className="text-y-sm font-medium text-y-warn">نیازمند بررسی</h3>
            <span className="yagent-num text-y-xs text-y-ink-dim">{fa(reviewNeeded.length)}</span>
          </header>
          <ul className="space-y-2">
            {reviewNeeded.map((annotation) => (
              <ReviewCard key={annotation.id} annotation={annotation} />
            ))}
          </ul>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-2">
          <header className="flex items-center justify-between">
            <h3 className="text-y-sm font-medium text-y-ink">نظرهای نسخه‌های قبلی</h3>
            <span className="yagent-num text-y-xs text-y-ink-dim">{fa(history.length)}</span>
          </header>
          <ul className="space-y-1.5">
            {history.map((annotation) => {
              const meta = ANNOTATION_STATUS_META[annotation.status]
              const revision = state.revisions[annotation.revisionId]
              return (
                <li key={annotation.id}>
                  <button
                    type="button"
                    onClick={() => void actions.openPreview(annotation.pageId, annotation.revisionId).then(() => actions.selectAnnotation(annotation.id))}
                    className="flex w-full items-start gap-2 rounded-y-sm border border-y-line bg-y-surface-soft/40 p-2 text-start transition-colors duration-y-fast hover:bg-y-surface-soft"
                  >
                    <span className="yagent-num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-y-surface text-y-xs text-y-ink-muted">
                      {fa(annotation.index)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-y-sm text-y-ink/90">
                        {annotation.comment || 'بدون توضیح'}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-y-xs text-y-ink-dim">
                        <span>نسخهٔ {revision ? fa(revision.revision) : '—'}</span>
                        <span aria-hidden>·</span>
                        <span>{formatRelative(annotation.createdAt)}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function DraftCard({ annotation, selected }: { annotation: Annotation; selected: boolean }) {
  const { actions } = useYAgent()

  return (
    <li
      className={cn(
        'rounded-y-md border p-2.5 transition-colors duration-y-fast',
        selected ? 'border-y-accent-border bg-y-accent-soft/30' : 'border-y-line bg-y-surface-soft/50',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => actions.selectAnnotation(annotation.id)}
          title="انتخاب این علامت در پیش‌نمایش"
          className="yagent-num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-y-accent-soft text-y-xs text-y-accent ring-1 ring-inset ring-y-accent-border/50"
        >
          {fa(annotation.index)}
        </button>

        <div className="min-w-0 flex-1">
          <textarea
            value={annotation.comment}
            onChange={(event) => actions.updateAnnotationComment(annotation.id, event.target.value)}
            rows={3}
            /* A freshly placed mark opens this surface with the caret ready. */
            autoFocus={selected && annotation.comment.length === 0}
            aria-label={`توضیح علامت ${annotation.index}`}
            placeholder="توضیح اصلاح را بنویس… مثلاً: ارتفاع این بخش کمتر شود."
            className="w-full resize-y break-words rounded-y-sm border border-y-line bg-y-bg/60 p-2.5 text-y-sm leading-7 text-y-ink outline-none placeholder:text-y-ink-dim hover:border-y-line-strong focus:border-y-accent-border [overflow-wrap:anywhere]"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-y-xs text-y-ink-dim">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {annotation.kind === 'pin' ? 'پین' : 'ناحیه'}
            </span>
            {annotation.elementId ? (
              <span className="yagent-ltr rounded-y-xs bg-y-surface px-1.5 py-0.5">{annotation.elementId}</span>
            ) : null}
            {annotation.elementLabel ? (
              <span className="min-w-0 max-w-[14rem] truncate">{truncate(annotation.elementLabel, 34)}</span>
            ) : null}
          </div>
        </div>

        <IconButton label="حذف علامت" size="xs" onClick={() => actions.removeAnnotation(annotation.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </li>
  )
}

function ReviewCard({ annotation }: { annotation: Annotation }) {
  const { state, actions } = useYAgent()
  const meta = ANNOTATION_STATUS_META[annotation.status]
  const revision = state.revisions[annotation.revisionId]

  return (
    <li className="rounded-y-md border border-y-warn/25 bg-y-warn-soft/25 p-2.5">
      <div className="flex items-start gap-2">
        <span className="yagent-num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-y-surface text-y-xs text-y-ink-muted">
          {fa(annotation.index)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-y-sm leading-7 text-y-ink/90">{annotation.comment || 'بدون توضیح'}</p>
          <p className="mt-1 text-y-xs leading-6 text-y-ink-dim">
            ثبت‌شده روی نسخهٔ {revision ? fa(revision.revision) : '—'} · {meta.hint}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void actions.openPreview(annotation.pageId, annotation.revisionId).then(() => actions.selectAnnotation(annotation.id))}
            >
              بررسی در پیش‌نمایش
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void actions.resolveAnnotation(annotation.id)}>
              <Check className="h-3.5 w-3.5" />
              بررسی‌شده
            </Button>
          </div>
        </div>
      </div>
    </li>
  )
}
