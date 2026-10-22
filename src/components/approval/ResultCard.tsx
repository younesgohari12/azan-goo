import { AlertTriangle, Check, ExternalLink, Eye } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

/**
 * Compact outcome card for any finished operation: success or failure, a short
 * explanation, the related link and — collapsed — the technical receipt.
 */
export function ResultCard({ resultId }: { resultId: string }) {
  const { state, actions, derived } = useYAgent()
  const [showTechnical, setShowTechnical] = useState(false)
  const result = state.results[resultId]

  if (!result) return null

  const success = result.status === 'success'
  const previewRevisionId = result.previewRevisionId
  const previewPageId = previewRevisionId
    ? state.revisions[previewRevisionId]?.pageId ??
      derived.activeConversation?.previewPageId ??
      state.preview.pageId
    : undefined
  /* A `#` link is not a destination: the demo never pretends the page is
     reachable on a real site. */
  const externalLink = result.link && result.link !== '#' ? result.link : undefined

  return (
    <div
      className={cn(
        'my-3 rounded-y-lg border p-3.5',
        success ? 'border-y-success/20 bg-y-success-soft/25' : 'border-y-danger/25 bg-y-danger-soft/25',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            success ? 'bg-y-success/15 text-y-success' : 'bg-y-danger/15 text-y-danger',
          )}
        >
          {success ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <AlertTriangle className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'min-w-0 break-words text-y-base font-medium',
                success ? 'text-y-ink' : 'text-y-danger',
              )}
            >
              {result.title}
            </p>
            {result.demo ? <Badge variant="plain">نمایشی</Badge> : null}
          </div>
          <p className="mt-1 break-words text-y-sm leading-7 text-y-ink-muted">{result.message}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {previewRevisionId && previewPageId ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void actions.openPreview(previewPageId, previewRevisionId)}
          >
            <Eye className="h-3.5 w-3.5" />
            مشاهدهٔ پیش‌نمایش
          </Button>
        ) : null}

        {externalLink ? (
          <Button size="sm" variant="ghost" asChild>
            <a href={externalLink} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              {result.linkLabel ?? 'مشاهده در سایت'}
            </a>
          </Button>
        ) : null}

        {!externalLink && result.linkLabel ? (
          <span className="text-y-xs text-y-ink-dim">
            {result.linkLabel} — در نسخهٔ نمایشی، سایت واقعی در دسترس نیست.
          </span>
        ) : null}

        {result.technical?.length ? (
          <button
            type="button"
            onClick={() => setShowTechnical((value) => !value)}
            className="ms-auto text-y-xs text-y-ink-dim underline decoration-y-line-strong underline-offset-4 transition-colors duration-y-fast hover:text-y-ink-muted"
          >
            {showTechnical ? 'بستن جزئیات' : 'جزئیات فنی'}
          </button>
        ) : null}
      </div>

      {showTechnical && result.technical?.length ? (
        <dl className="mt-2.5 animate-y-fade-in space-y-1 overflow-x-auto rounded-y-sm border border-y-line bg-y-bg/50 p-2.5 text-y-xs">
          {result.technical.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <dt className="shrink-0 text-y-ink-dim">{item.label}</dt>
              <dd className="yagent-ltr min-w-0 break-all text-y-ink-muted">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}
