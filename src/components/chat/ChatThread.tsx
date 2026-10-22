import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { EmptyState } from './EmptyState'
import { MessageItem } from './MessageItem'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

/** Chat column: independent, controlled scrolling with a sticky composer below. */
export function ChatThread() {
  const { derived } = useYAgent()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)
  const messages = derived.messages

  // A cheap signature lets us react to deltas, status changes and new cards.
  const signature = `${messages.length}:${messages.map((message) => `${message.id}-${message.text?.length ?? 0}-${message.status}`).join('|')}`

  useEffect(() => {
    if (!atBottom) return
    const element = scrollRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [signature, atBottom])

  useEffect(() => {
    setAtBottom(true)
  }, [derived.activeConversation?.id])

  function handleScroll() {
    const element = scrollRef.current
    if (!element) return
    setAtBottom(element.scrollHeight - element.scrollTop - element.clientHeight < 96)
  }

  function scrollToBottom() {
    const element = scrollRef.current
    if (!element) return
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} onScroll={handleScroll} className="yagent-scroll flex flex-1 flex-col">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-auto w-full max-w-[var(--y-reading-w)] space-y-0.5 px-4 py-4 sm:px-6 sm:py-6">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div className="h-2" />
          </div>
        )}
      </div>

      {!atBottom && messages.length > 0 ? (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="رفتن به آخرین پیام"
          className={cn(
            'absolute bottom-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full',
            'border border-y-line-strong bg-y-surface text-y-ink-muted shadow-y-pop',
            'transition-colors duration-y-fast hover:text-y-ink',
          )}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
