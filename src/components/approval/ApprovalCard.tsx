import { AlertTriangle, Check, FilePen, PackagePlus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/feedback'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import type { ApprovalKind, ApprovalStatus } from '@/types/model'

const KIND_ICON: Record<ApprovalKind, ReactNode> = {
  publish_page: <ShieldCheck className="h-4 w-4" />,
  install_plugin: <PackagePlus className="h-4 w-4" />,
  delete_plugin: <Trash2 className="h-4 w-4" />,
  update_content: <FilePen className="h-4 w-4" />,
}

const STATUS_BADGE: Record<
  ApprovalStatus,
  { label: string; variant: 'warn' | 'accent' | 'success' | 'danger' | 'neutral' }
> = {
  pending: { label: 'منتظر تأیید', variant: 'warn' },
  approved: { label: 'تأیید شد', variant: 'accent' },
  running: { label: 'در حال اجرا', variant: 'accent' },
  succeeded: { label: 'انجام شد', variant: 'success' },
  rejected: { label: 'رد شد', variant: 'neutral' },
  failed: { label: 'ناموفق', variant: 'danger' },
}

/**
 * In-thread confirmation card for an operation that changes the site
 * (publishing a page, installing or deleting a plugin…).
 *
 * Both buttons lock the moment a decision starts, and the adapter ignores a
 * second decision for an approval that is no longer pending — so a double click
 * (or a click that lands while the operation is running) cannot run it twice.
 */
export function ApprovalCard({ approvalId }: { approvalId: string }) {
  const { state, actions } = useYAgent()
  const [locked, setLocked] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const approval = state.approvals[approvalId]

  if (!approval) return null

  const badge = STATUS_BADGE[approval.status]
  const isPending = approval.status === 'pending' && !locked
  const isRunning = approval.status === 'running' || (locked && approval.status === 'pending')

  async function decide(decision: 'approve' | 'reject') {
    if (locked) return
    setLocked(true)
    await actions.resolveApproval(approvalId, decision)
  }

  return (
    <div
      className={cn(
        'my-3 rounded-y-lg border p-4',
        isPending ? 'border-y-warn/30 bg-y-warn-soft' : 'border-y-line bg-y-surface-soft',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-y-sm',
            isPending ? 'bg-y-warn/20 text-y-warn' : 'bg-y-surface text-y-ink-muted',
          )}
        >
          {KIND_ICON[approval.kind]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-y-base font-medium text-y-ink">{approval.title}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="mt-1 text-y-sm text-y-ink-muted">
            <span className="text-y-ink-dim">هدف: </span>
            {approval.target}
          </p>
        </div>
      </div>

      <p className="mt-3 text-y-base text-y-ink">{approval.summary}</p>

      {approval.changes.length > 0 ? (
        <ul className="mt-2.5 space-y-1.5">
          {approval.changes.map((change) => (
            <li key={change} className="flex items-start gap-2 text-y-sm text-y-ink-muted">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-y-ink-dim" />
              {change}
            </li>
          ))}
        </ul>
      ) : null}

      {isRunning ? (
        <div className="mt-3.5 flex items-center gap-2 text-y-sm text-y-accent" role="status">
          <Spinner size={14} />
          در حال اجرای عملیات…
        </div>
      ) : null}

      {isPending ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="success"
            size="sm"
            className="yagent-tap h-10"
            onClick={() => void decide('approve')}
            disabled={locked}
          >
            <Check className="h-3.5 w-3.5" />
            تأیید و اجرا
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="yagent-tap h-10"
            onClick={() => void decide('reject')}
            disabled={locked}
          >
            <X className="h-3.5 w-3.5" />
            رد
          </Button>
        </div>
      ) : null}

      {approval.status === 'succeeded' ? (
        <div className="mt-3.5 space-y-2">
          <p className="flex items-center gap-2 text-y-sm text-y-success">
            <Check className="h-3.5 w-3.5" />
            {approval.result?.message ?? 'عملیات با موفقیت انجام شد.'}
          </p>
          {approval.result?.technical?.length ? (
            <>
              <button
                type="button"
                onClick={() => setShowReceipt((value) => !value)}
                className="text-y-xs text-y-ink-dim underline decoration-y-line-strong underline-offset-4 transition-colors duration-y-fast hover:text-y-ink-muted"
              >
                {showReceipt ? 'پنهان‌کردن جزئیات فنی' : 'نمایش جزئیات فنی و رسید'}
              </button>
              {showReceipt ? (
                <dl className="animate-y-fade-in space-y-1 rounded-y-sm border border-y-line bg-y-bg/60 p-2.5 text-y-xs">
                  {approval.result.technical.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <dt className="text-y-ink-dim">{item.label}</dt>
                      <dd className="yagent-ltr text-y-ink-muted">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {approval.status === 'rejected' ? (
        <p className="mt-3.5 rounded-y-sm border border-y-line bg-y-bg/50 px-3 py-2 text-y-sm text-y-ink-muted">
          این عملیات رد شد و هیچ تغییری روی سایت اعمال نشد. اگر بعداً خواستی، می‌توانی همین درخواست را دوباره بدهی.
        </p>
      ) : null}

      {approval.status === 'failed' ? (
        <p className="mt-3.5 flex items-start gap-2 rounded-y-sm border border-y-danger/30 bg-y-danger-soft px-3 py-2 text-y-sm text-y-danger">
          <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0" />
          {approval.error ?? 'اجرای عملیات ناموفق بود.'}
        </p>
      ) : null}
    </div>
  )
}
