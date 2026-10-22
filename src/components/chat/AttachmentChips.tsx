import { FileText, ImageIcon, X } from 'lucide-react'

import { IconButton } from '@/components/ui/button'
import { Spinner } from '@/components/ui/feedback'
import { cn, formatBytes, isLatinRun } from '@/lib/utils'
import type { Attachment } from '@/types/model'

const STATUS_LABEL: Record<Attachment['status'], string> = {
  uploading: 'در حال بارگذاری',
  ready: 'آماده',
  error: 'خطا در بارگذاری',
}

export function AttachmentChip({
  attachment,
  onRemove,
  className,
}: {
  attachment: Attachment
  onRemove?: (id: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex max-w-[15rem] items-center gap-2 rounded-y-sm border border-y-line bg-y-surface py-1.5 pe-1.5 ps-2',
        className,
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-y-xs bg-y-surface-hover text-y-ink-dim">
        {attachment.previewUrl ? (
          <img src={attachment.previewUrl} alt={attachment.name} className="h-full w-full object-cover" />
        ) : attachment.mime.startsWith('image/') ? (
          <ImageIcon className="h-3.5 w-3.5" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn('block truncate text-y-sm text-y-ink', isLatinRun(attachment.name) && 'yagent-ltr')}
          title={attachment.name}
        >
          {attachment.name}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-y-xs text-y-ink-dim">
          <span className="yagent-num">{formatBytes(attachment.size)}</span>
          <span aria-hidden>·</span>
          <span
            className={cn(
              'flex items-center gap-1',
              attachment.status === 'error' ? 'text-y-danger' : attachment.status === 'ready' ? 'text-y-success' : '',
            )}
          >
            {attachment.status === 'uploading' ? <Spinner size={11} /> : null}
            {STATUS_LABEL[attachment.status]}
          </span>
        </span>
      </span>

      {onRemove ? (
        <IconButton label="حذف فایل" size="xs" onClick={() => onRemove(attachment.id)}>
          <X className="h-3.5 w-3.5" />
        </IconButton>
      ) : null}
    </div>
  )
}

export function AttachmentChips({
  attachments,
  onRemove,
}: {
  attachments: Attachment[]
  onRemove?: (id: string) => void
}) {
  if (attachments.length === 0) return null
  return (
    <div className="yagent-scroll mb-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
      {attachments.map((attachment) => (
        <AttachmentChip
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove ? () => onRemove(attachment.id) : undefined}
        />
      ))}
    </div>
  )
}
