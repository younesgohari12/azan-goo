import {
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { useMemo } from 'react'

import { ConversationGroupHeader, ConversationRow } from './ConversationRow'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/field'
import { Tooltip } from '@/components/ui/tooltip'
import { DATE_GROUPS, cn, dateGroupOf, fa } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

export function YAgentMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-y-sm bg-y-accent-soft text-y-accent ring-1 ring-inset ring-y-accent-border/50',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M6 4.5l6 7.2 6-7.2" />
        <path d="M12 11.7v7.8" />
      </svg>
    </span>
  )
}

const SUGGESTIONS_HINT = 'YAgent روی سایت تو کار می‌کند؛ ساخت صفحه، افزونه و اصلاح بصری.'

export function ChatSidebar({
  collapsed = false,
  onToggleCollapse,
  onSelectConversation,
}: {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onSelectConversation?: () => void
}) {
  const { state, actions, derived } = useYAgent()
  const { conversations, searchQuery } = state

  const groups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const visible = query
      ? conversations.filter((conversation) => conversation.title.toLowerCase().includes(query))
      : conversations
    const pinned = visible.filter((conversation) => conversation.pinned)
    const sections = DATE_GROUPS.map((label) => ({
      label,
      items: visible.filter(
        (conversation) => !conversation.pinned && dateGroupOf(conversation.updatedAt) === label,
      ),
    })).filter((section) => section.items.length > 0)
    return { pinned, sections, total: visible.length, searching: query.length > 0 }
  }, [conversations, searchQuery])

  const runningConversationId = derived.running ? state.activeConversationId : null

  if (collapsed) {
    return (
      <aside className="flex h-full w-full flex-col items-center gap-1 bg-y-sidebar py-3">
        <YAgentMark className="h-8 w-8" />
        <div className="my-1 h-px w-6 bg-y-line" />
        <Tooltip label="گفتگوی جدید" side="left">
          <IconButton label="گفتگوی جدید" size="md" variant="secondary" onClick={() => void actions.newConversation()}>
            <Plus className="h-4 w-4" />
          </IconButton>
        </Tooltip>
        <Tooltip label="نمایش تاریخچه" side="left">
          <IconButton label="نمایش تاریخچه" size="md" onClick={onToggleCollapse}>
            <PanelRightOpen className="h-4 w-4" />
          </IconButton>
        </Tooltip>
        <div className="yagent-scroll mt-2 flex flex-1 flex-col items-center gap-1 overflow-y-auto px-2">
          {conversations.slice(0, 14).map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              selected={conversation.id === state.activeConversationId}
              compact
              busy={conversation.id === runningConversationId}
              onSelect={() => {
                actions.selectConversation(conversation.id)
                onSelectConversation?.()
              }}
              onRename={(title) => void actions.renameConversation(conversation.id, title)}
              onTogglePin={() => void actions.togglePin(conversation.id)}
              onDelete={() => actions.requestDelete(conversation.id)}
            />
          ))}
        </div>
        <AccountMenu collapsed />
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-full flex-col bg-y-sidebar">
      <header className="flex items-center gap-2 px-3 pb-2 pt-4">
        <YAgentMark className="h-8 w-8" />
        <div className="min-w-0 flex-1">
          <div className="yagent-ltr text-start text-y-md font-semibold text-y-ink">YAgent</div>
          <div className="truncate text-y-xs text-y-ink-dim">دستیار هوش مصنوعی وردپرس</div>
        </div>
        {onToggleCollapse ? (
          <Tooltip label="جمع‌کردن سایدبار" side="bottom">
            <IconButton label="جمع‌کردن سایدبار" onClick={onToggleCollapse}>
              <PanelRightClose className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        ) : null}
      </header>

      <div className="space-y-2 px-3">
        <div className="relative">
          <Search className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-y-ink-dim" />
          <Input
            value={searchQuery}
            onChange={(event) => actions.setSearch(event.target.value)}
            placeholder="جست‌وجو در گفتگوها"
            className="h-9 border-transparent bg-y-surface-soft pe-8"
          />
          {searchQuery ? (
            <IconButton
              label="پاک‌کردن جست‌وجو"
              size="xs"
              className="absolute start-1 top-1/2 -translate-y-1/2"
              onClick={() => actions.setSearch('')}
            >
              <X className="h-3.5 w-3.5" />
            </IconButton>
          ) : null}
        </div>

        <Button
          variant="secondary"
          className="w-full justify-start border-y-line-strong bg-transparent text-y-ink hover:bg-y-accent-soft"
          onClick={() => {
            void actions.newConversation()
            onSelectConversation?.()
          }}
        >
          <Plus className="h-4 w-4 text-y-accent" />
          گفتگوی جدید
        </Button>
      </div>

      <div className="yagent-scroll mt-1 flex-1 px-2 pb-2">
        {groups.total === 0 ? (
          <div className="px-2.5 pt-6 text-center text-y-sm leading-7 text-y-ink-dim">
            {groups.searching ? 'گفتگویی با این عنوان پیدا نشد.' : 'هنوز گفتگویی نداری. یک گفتگوی جدید بساز.'}
          </div>
        ) : null}

        {groups.pinned.length > 0 ? (
          <>
            <ConversationGroupHeader label="سنجاق‌شده" count={groups.pinned.length} />
            <div className="space-y-0.5">
              {groups.pinned.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  selected={conversation.id === state.activeConversationId}
                  compact={false}
                  busy={conversation.id === runningConversationId}
                  onSelect={() => {
                    actions.selectConversation(conversation.id)
                    onSelectConversation?.()
                  }}
                  onRename={(title) => void actions.renameConversation(conversation.id, title)}
                  onTogglePin={() => void actions.togglePin(conversation.id)}
                  onDelete={() => actions.requestDelete(conversation.id)}
                />
              ))}
            </div>
          </>
        ) : null}

        {groups.sections.map((section) => (
          <div key={section.label}>
            <ConversationGroupHeader label={section.label} count={section.items.length} />
            <div className="space-y-0.5">
              {section.items.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  selected={conversation.id === state.activeConversationId}
                  compact={false}
                  busy={conversation.id === runningConversationId}
                  onSelect={() => {
                    actions.selectConversation(conversation.id)
                    onSelectConversation?.()
                  }}
                  onRename={(title) => void actions.renameConversation(conversation.id, title)}
                  onTogglePin={() => void actions.togglePin(conversation.id)}
                  onDelete={() => actions.requestDelete(conversation.id)}
                />
              ))}
            </div>
          </div>
        ))}

        <p className="px-2.5 pt-6 text-y-xs leading-6 text-y-ink-dim/80">{SUGGESTIONS_HINT}</p>
      </div>

      <div className="border-t border-y-line p-2">
        <AccountMenu />
      </div>
    </aside>
  )
}

function AccountMenu({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <button
            type="button"
            aria-label="حساب کاربری"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-y-surface text-y-xs font-semibold text-y-ink-muted"
          >
            یق
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-y-sm px-1.5 py-1.5 text-start transition-colors duration-y-fast hover:bg-y-surface-soft"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-y-surface text-y-xs font-semibold text-y-ink-muted">
              یق
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-y-base text-y-ink">یونس ق.</span>
              <span className="block truncate text-y-xs text-y-ink-dim">استودیو آرا — حساب حرفه‌ای</span>
            </span>
            <Settings className="h-4 w-4 shrink-0 text-y-ink-dim" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align={collapsed ? 'center' : 'start'} className="min-w-[13rem]">
        <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
        <DropdownMenuItem icon={<Sparkles className="h-3.5 w-3.5" />} disabled>
          استفادهٔ این ماه: {fa(38)}٪
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* No handler behind them: they are labelled as demo instead of looking
            like live navigation. */}
        <DropdownMenuItem icon={<Settings className="h-3.5 w-3.5" />} disabled>
          تنظیمات YAgent — نمایشی
        </DropdownMenuItem>
        <DropdownMenuItem icon={<PanelRightOpen className="h-3.5 w-3.5" />} disabled>
          پیشخوان وردپرس — نمایشی
        </DropdownMenuItem>
        {import.meta.env.DEV ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<span className="text-y-sm">⤓</span>}
              onSelect={() => {
                window.location.href = '/yagent-source.zip'
              }}
            >
              دانلود کد پروژه (ZIP)
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem danger icon={<LogOut className="h-3.5 w-3.5" />} disabled>
          خروج از حساب — نمایشی
        </DropdownMenuItem>
        <div className="px-2.5 pb-1 pt-2">
          <Badge variant="plain">نسخهٔ نمایشی — بدون بک‌اند</Badge>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
