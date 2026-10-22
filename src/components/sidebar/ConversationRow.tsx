import { Check, MoreHorizontal, Pencil, Pin, PinOff, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { StatusDot } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { cn, fa, truncate } from '@/lib/utils'
import type { Conversation } from '@/types/model'

export function ConversationRow({
  conversation,
  selected,
  compact,
  busy,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
}: {
  conversation: Conversation
  selected: boolean
  compact: boolean
  busy?: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onTogglePin: () => void
  onDelete: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(conversation.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [renaming])

  function commit() {
    const value = draft.trim()
    setRenaming(false)
    if (value && value !== conversation.title) onRename(value)
    setDraft(conversation.title)
  }

  if (compact) {
    return (
      <Tooltip label={conversation.title} side="left">
        <button
          type="button"
          onClick={onSelect}
          aria-label={conversation.title}
          className={cn(
            'yagent-tap mx-auto flex h-9 w-9 items-center justify-center rounded-y-sm text-y-sm font-medium',
            'transition-colors duration-y-fast ease-y',
            selected ? 'bg-y-surface text-y-ink' : 'text-y-ink-dim hover:bg-y-surface-soft hover:text-y-ink-muted',
          )}
        >
          {conversation.pinned ? <Pin className="h-3.5 w-3.5" /> : conversation.title.trim().charAt(0) || 'گ'}
        </button>
      </Tooltip>
    )
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-1.5 rounded-y-sm bg-y-surface px-2 py-1.5">
        <label className="sr-only" htmlFor={`rename-${conversation.id}`}>
          نام گفتگو
        </label>
        <input
          id={`rename-${conversation.id}`}
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') {
              setDraft(conversation.title)
              setRenaming(false)
            }
          }}
          className="h-7 min-w-0 flex-1 bg-transparent text-y-base text-y-ink outline-none"
        />
        <IconButton label="ذخیرهٔ نام" size="xs" onClick={commit}>
          <Check className="h-3.5 w-3.5 text-y-success" />
        </IconButton>
        <IconButton
          label="لغو"
          size="xs"
          onClick={() => {
            setDraft(conversation.title)
            setRenaming(false)
          }}
        >
          <X className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex items-center rounded-y-sm transition-colors duration-y-fast ease-y',
        selected ? 'bg-y-surface' : 'hover:bg-y-surface-soft',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        title={conversation.title}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-start"
      >
        {conversation.pinned ? <Pin className="h-3 w-3 shrink-0 text-y-accent" aria-hidden /> : null}
        <span className={cn('truncate text-y-base', selected ? 'text-y-ink' : 'text-y-ink-muted')}>
          {truncate(conversation.title, 42)}
        </span>
        {busy ? <StatusDot tone="accent" className="ms-auto" /> : null}
      </button>

      <div className="yagent-reveal absolute end-1 flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              label="گزینه‌های گفتگو"
              size="xs"
              className="bg-y-sidebar/90 backdrop-blur"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[12rem]">
            <DropdownMenuItem icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => setRenaming(true)}>
              تغییر نام
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={conversation.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              onSelect={onTogglePin}
            >
              {conversation.pinned ? 'برداشتن سنجاق' : 'سنجاق‌کردن'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger icon={<Trash2 className="h-3.5 w-3.5" />} onSelect={onDelete}>
              حذف گفتگو
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function ConversationGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-2.5 pb-1.5 pt-4">
      <span className="text-y-xs font-medium text-y-ink-dim">{label}</span>
      <span className="yagent-num text-y-xs text-y-ink-dim">{fa(count)}</span>
    </div>
  )
}
