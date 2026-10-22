import { AlertTriangle, Check, ExternalLink, Eye } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

/**
 * Compact outcome card for any finished operation: success or failure, a short
 * explanation, the related link and — collapsed — the technical receipt.
 *
 * "مشاهدهٔ پیش‌نمایش" is offered whenever the page can be resolved: from the
 * revision the result points at, or from the page the conversation works on.
 * That is what makes the card work after a reload, when the revisions arrive
 * with the conversation snapshot instead of a live event.
 */
export function ResultCard({ resultId }: { resultId: string }) {
  const { state, actions, derived } = useYAgent()
  const [showTechnical, setShowTechnical] = useState(false)
  const result = state.results[resultId]

  if (!result) return null

  const success = result.status === 'success'
  const previewRevisionId = result.previewRevisionId
  const previewPageId =
    (previewRevisionId ? state.revisions[previewRevisionId]?.pageId : undefined) ??
    derived.activeConversation?.previewPageId
  // The mock returns `#` for links it cannot honour; a dead link is worse than
  // no link, so it is only offered when it actually points somewhere.
  const link = result.link && result.link !== '#' ? result.link : undefined

  return (
    <div
      className={cn(
        'my-3 rounded-y-lg border p-3.5',
        success ? 'border-y-success/25 bg-y-success-soft' : 'border-y-danger/30 bg-y-danger-soft',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            success ? 'bg-y-success/20 text-y-success' : 'bg-y-danger/20 text-y-danger',
          )}
        >
          {success ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <AlertTriangle className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-y-base font-medium', success ? 'text-y-ink' : 'text-y-danger')}>{result.title}</p>
          <p className="mt-1 text-y-sm text-y-ink-muted">{result.message}</p>
        </div>
      </div>

      {result.status === 'error' ? (
        <p className="mt-3 rounded-y-sm border border-y-danger/30 bg-y-bg/50 px-3 py-2 text-y-xs text-y-ink-muted">
          قدم بعدی: علت را برطرف کن و دوباره درخواست بده — YAgent قبل از تکرار، وضعیت فعلی سایت را دوباره می‌خواند.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {previewPageId ? (
          <Button
            size="sm"
            variant="secondary"
            className="yagent-tap h-9"
            onClick={() => void actions.openPreview(previewPageId, previewRevisionId)}
          >
            <Eye className="h-3.5 w-3.5" />
            مشاهدهٔ پیش‌نمایش
          </Button>
        ) : null}

        {link ? (
          <Button size="sm" variant="ghost" className="yagent-tap h-9" asChild>
            <a href={link} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              {result.linkLabel ?? 'مشاهده در سایت'}
            </a>
          </Button>
        ) : result.linkLabel ? (
          <Badge variant="plain">{result.linkLabel} — در نسخهٔ نمایشی غیرفعال است</Badge>
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
        <dl className="mt-2.5 animate-y-fade-in space-y-1 rounded-y-sm border border-y-line bg-y-bg/60 p-2.5 text-y-xs">
          {result.technical.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <dt className="text-y-ink-dim">{item.label}</dt>
              <dd className="yagent-ltr text-y-ink-muted">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}
