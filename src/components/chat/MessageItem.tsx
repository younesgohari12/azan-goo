import { AlertCircle, Ban, Check, Copy, MessageSquareWarning } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { AttachmentChip } from './AttachmentChips'
import { MarkdownContent } from './MarkdownContent'
import { ActivityBlock } from '@/components/activity/ActivityBlock'
import { ApprovalCard } from '@/components/approval/ApprovalCard'
import { ResultCard } from '@/components/approval/ResultCard'
import { ANNOTATION_STATUS_META } from '@/components/preview/annotationStatus'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/button'
import { cn, fa, formatClock } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import type { Message } from '@/types/model'

/** Routes a message to the right presentation for its kind. */
export function MessageItem({ message }: { message: Message }) {
  if (message.kind === 'activity' && message.taskId) return <ActivityBlock taskId={message.taskId} />
  if (message.kind === 'approval' && message.approvalId) return <ApprovalCard approvalId={message.approvalId} />
  if (message.kind === 'result' && message.resultId) return <ResultCard resultId={message.resultId} />
  if (message.kind === 'feedback') return <FeedbackMessageCard message={message} />
  return message.role === 'user' ? <UserMessage message={message} /> : <AssistantMessage message={message} />
}

function UserMessage({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex justify-start py-1.5"
    >
      <div className="min-w-0 max-w-[88%] rounded-y-lg rounded-ss-sm bg-y-surface px-3.5 py-2.5">
        {message.attachments?.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} attachment={attachment} className="bg-y-bg/50" />
            ))}
          </div>
        ) : null}
        {message.text ? <p className="text-y-base whitespace-pre-wrap text-y-ink">{message.text}</p> : null}
        <time className="yagent-num mt-1.5 block text-y-xs text-y-ink-dim">{formatClock(message.createdAt)}</time>
      </div>
    </motion.div>
  )
}

function AssistantMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const streaming = message.status === 'streaming'

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.text ?? '')
      setCopied(true)
      timer.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="group relative py-1.5">
      <MarkdownContent text={message.text ?? ''} />
      {streaming ? (
        <span className="mt-1 inline-block h-4 w-[2px] translate-y-0.5 animate-y-blink bg-y-accent" aria-hidden />
      ) : null}

      {message.status === 'stopped' ? (
        <p className="mt-2 flex items-center gap-1.5 text-y-xs text-y-ink-muted">
          <Ban className="h-3.5 w-3.5" />
          کار متوقف شد؛ پاسخ کامل نشد.
        </p>
      ) : null}

      {message.status === 'error' ? (
        <p className="mt-2 flex items-center gap-1.5 text-y-xs text-y-danger">
          <AlertCircle className="h-3.5 w-3.5" />
          این پاسخ با خطا تمام شد.
        </p>
      ) : null}

      {!streaming && message.text ? (
        <div className="yagent-reveal mt-1 flex items-center gap-1.5">
          <IconButton label="کپی پاسخ" size="xs" onClick={() => void copy()}>
            {copied ? <Check className="h-3.5 w-3.5 text-y-success" /> : <Copy className="h-3.5 w-3.5" />}
          </IconButton>
          <span className="yagent-num text-y-xs text-y-ink-dim">{formatClock(message.createdAt)}</span>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Feedback sent from the preview: the annotations travel with the message, and
 * clicking one opens that annotation inside the preview workspace.
 */
function FeedbackMessageCard({ message }: { message: Message }) {
  const { state, actions } = useYAgent()
  const annotations = (message.annotationIds ?? [])
    .map((id) => state.annotations[id])
    .filter((annotation) => Boolean(annotation))

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex justify-start py-1.5"
    >
      <div className="min-w-0 max-w-[92%] rounded-y-lg rounded-ss-sm bg-y-surface p-3">
        <div className="flex items-center gap-2 text-y-xs text-y-accent">
          <MessageSquareWarning className="h-3.5 w-3.5" />
          بازخورد روی پیش‌نمایش
          <span className="yagent-num text-y-ink-dim">· {fa(annotations.length)} مورد</span>
        </div>

        {message.text ? <p className="mt-1.5 text-y-base text-y-ink">{message.text}</p> : null}

        <ul className="mt-2.5 space-y-1.5">
          {annotations.map((annotation) => {
            const meta = ANNOTATION_STATUS_META[annotation.status]
            return (
              <li key={annotation.id}>
                <button
                  type="button"
                  onClick={() => {
                    void actions.openPreview(annotation.pageId, annotation.revisionId).then(() => {
                      actions.selectAnnotation(annotation.id)
                    })
                  }}
                  className="flex w-full items-start gap-2.5 rounded-y-sm border border-y-line bg-y-bg/50 p-2.5 text-start transition-colors duration-y-fast hover:border-y-line-strong hover:bg-y-bg/80"
                >
                  <span className="yagent-num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-y-accent-soft text-y-xs text-y-accent">
                    {fa(annotation.index)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-y-sm text-y-ink">{annotation.comment || 'بدون توضیح'}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-y-xs text-y-ink-dim">
                      {annotation.elementId ? (
                        <span className="yagent-ltr rounded-y-xs bg-y-surface px-1.5 py-0.5">
                          {annotation.elementId}
                        </span>
                      ) : null}
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <time className={cn('yagent-num mt-2 block text-y-xs text-y-ink-dim')}>
          {formatClock(message.createdAt)}
        </time>
      </div>
    </motion.div>
  )
}
