import { ArrowUp, Mic, Plus, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AttachmentChips } from './AttachmentChips'
import { ModelPicker } from './ModelPicker'
import { Button, IconButton } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import { composerOf } from '@/state/state'

const MAX_TEXTAREA_HEIGHT = 208

/**
 * Composer: always reachable at the bottom of the chat column, above the phone's
 * safe area. Enter sends, Shift+Enter adds a line, the textarea grows and then
 * scrolls. The send control is the only filled element here, so "ready to send"
 * is unmistakable; while work is running it becomes an explicit stop.
 */
export function ChatComposer() {
  const { state, actions, derived } = useYAgent()
  const composer = composerOf(state, state.activeConversationId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [composer.text])

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    actions.addAttachments(Array.from(files))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submit() {
    if (derived.running || !derived.canSend) return
    await actions.send()
    textareaRef.current?.focus()
  }

  const voiceSupported = state.capabilities.voiceInput
  const voiceLabel = voiceSupported
    ? 'ورودی صوتی'
    : 'ورودی صوتی در این نسخه پشتیبانی نمی‌شود — افزونهٔ وردپرس آن را فعال می‌کند'

  return (
    <div
      className="shrink-0 border-t border-y-line bg-y-bg px-3 pt-3 sm:px-5"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto w-full max-w-[var(--y-reading-w)]">
        <AttachmentChips attachments={composer.attachments} onRemove={actions.removeAttachment} />

        <div
          className={cn(
            'rounded-y-xl border bg-y-surface transition-[border-color,box-shadow] duration-y ease-y',
            focused ? 'border-y-accent-border shadow-y-soft' : 'border-y-line-strong',
          )}
        >
          <label className="sr-only" htmlFor="yagent-composer">
            پیام به YAgent
          </label>
          <textarea
            id="yagent-composer"
            ref={textareaRef}
            value={composer.text}
            rows={1}
            onChange={(event) => actions.setComposerText(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                void submit()
              }
            }}
            placeholder="از YAgent بخواه روی سایتت کاری انجام بده…"
            className={cn(
              'block min-h-[52px] w-full resize-none bg-transparent px-4 pb-1 pt-3 text-y-md text-y-ink',
              'outline-none placeholder:text-y-ink-dim',
            )}
          />

          <div className="flex items-center gap-1 px-2 pb-2 pt-0.5">
            <Tooltip label="افزودن فایل">
              <IconButton label="افزودن فایل" size="md" className="yagent-tap" onClick={() => fileInputRef.current?.click()}>
                <Plus className="h-4 w-4" />
              </IconButton>
            </Tooltip>

            <ModelPicker />

            <span className="flex-1" />

            <Tooltip label={voiceLabel}>
              <span className="inline-flex">
                <IconButton
                  label="ورودی صوتی"
                  size="md"
                  className="yagent-tap"
                  disabled={!voiceSupported}
                  aria-disabled={!voiceSupported}
                >
                  <Mic className="h-4 w-4" />
                </IconButton>
              </span>
            </Tooltip>

            {derived.running ? (
              <Button
                variant="secondary"
                shape="pill"
                className="yagent-tap h-9 gap-2 border-y-line-strong px-3.5"
                onClick={() => void actions.stop()}
              >
                <Square className="h-3 w-3 fill-current" />
                توقف
              </Button>
            ) : (
              <Button
                variant={derived.canSend ? 'primary' : 'secondary'}
                shape="pill"
                aria-label="ارسال پیام"
                className={cn('yagent-tap h-9 w-9', !derived.canSend && 'border border-y-line text-y-ink-dim')}
                disabled={!derived.canSend}
                onClick={() => void submit()}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="mt-2 text-center text-y-xs text-y-ink-dim">
          نسخهٔ نمایشی با دادهٔ نمونه — YAgent پیش از هر تغییر روی سایت، تأیید تو را می‌گیرد.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  )
}
