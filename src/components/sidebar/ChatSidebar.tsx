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
        'flex items-center justify-center rounded-y-sm bg-y-accent-soft text-y-accent ring-1 ring-inset ring-y-accent-border',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[55%] w-[55%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M6 4.5l6 7.2 6-7.2" />
        <path d="M12 11.7v7.8" />
      </svg>
    </span>
  )
}

const SIDEBAR_HINT = 'YAgent روی سایت تو کار می‌کند؛ ساخت صفحه، افزونه و اصلاح بصری.'

/** History sidebar: search, groups, and the account menu. Collapses to a rail. */
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

  const rowProps = (conversationId: string) => ({
    selected: conversationId === state.activeConversationId,
    busy: conversationId === runningConversationId,
    onSelect: () => {
      actions.selectConversation(conversationId)
      onSelectConversation?.()
    },
    onRename: (title: string) => void actions.renameConversation(conversationId, title),
    onTogglePin: () => void actions.togglePin(conversationId),
    onDelete: () => actions.requestDelete(conversationId),
  })

  if (collapsed) {
    return (
      <aside className="flex h-full min-h-0 w-full flex-col items-center gap-1 bg-y-sidebar py-3">
        <YAgentMark className="h-8 w-8" />
        <div className="my-1 h-px w-6 bg-y-line" />
        <Tooltip label="گفتگوی جدید" side="left">
          <IconButton
            label="گفتگوی جدید"
            size="md"
            variant="secondary"
            className="yagent-tap"
            onClick={() => void actions.newConversation()}
          >
            <Plus className="h-4 w-4" />
          </IconButton>
        </Tooltip>
        <Tooltip label="نمایش تاریخچه" side="left">
          <IconButton label="نمایش تاریخچه" size="md" className="yagent-tap" onClick={onToggleCollapse}>
            <PanelRightOpen className="h-4 w-4" />
          </IconButton>
        </Tooltip>
        <div className="yagent-scroll mt-2 flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto px-2">
          {conversations.slice(0, 14).map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} compact {...rowProps(conversation.id)} />
          ))}
        </div>
        <AccountMenu collapsed />
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-y-sidebar">
      <header className="flex shrink-0 items-center gap-2 px-3 pb-2 pt-3">
        <YAgentMark className="h-8 w-8" />
        <div className="min-w-0 flex-1">
          <h2 className="yagent-ltr text-start text-y-md font-semibold text-y-ink">YAgent</h2>
          <p className="truncate text-y-xs text-y-ink-dim">دستیار هوش مصنوعی وردپرس</p>
        </div>
        {onToggleCollapse ? (
          <Tooltip label="جمع‌کردن تاریخچه" side="bottom">
            <IconButton label="جمع‌کردن تاریخچه" className="yagent-tap" onClick={onToggleCollapse}>
              <PanelRightClose className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        ) : null}
      </header>

      <div className="shrink-0 space-y-2 px-3">
        <div className="relative">
          <label className="sr-only" htmlFor="yagent-search">
            جست‌وجو در گفتگوها
          </label>
          <Search
            className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-y-ink-dim"
            aria-hidden
          />
          <Input
            id="yagent-search"
            value={searchQuery}
            onChange={(event) => actions.setSearch(event.target.value)}
            placeholder="جست‌وجو در گفتگوها"
            className="h-10 border-transparent bg-y-surface-soft pe-8"
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
          className="yagent-tap w-full justify-start border-y-line-strong bg-transparent text-y-ink hover:bg-y-accent-soft"
          onClick={() => {
            void actions.newConversation()
            onSelectConversation?.()
          }}
        >
          <Plus className="h-4 w-4 text-y-accent" />
          گفتگوی جدید
        </Button>
      </div>

      <div className="yagent-scroll mt-1 min-h-0 flex-1 px-2 pb-2">
        {groups.total === 0 ? (
          <div className="px-2.5 pt-6 text-center text-y-sm text-y-ink-dim">
            {groups.searching ? 'گفتگویی با این عنوان پیدا نشد.' : 'هنوز گفتگویی نداری. یک گفتگوی جدید بساز.'}
          </div>
        ) : null}

        {groups.pinned.length > 0 ? (
          <>
            <ConversationGroupHeader label="سنجاق‌شده" count={groups.pinned.length} />
            <div className="space-y-0.5">
              {groups.pinned.map((conversation) => (
                <ConversationRow key={conversation.id} conversation={conversation} compact={false} {...rowProps(conversation.id)} />
              ))}
            </div>
          </>
        ) : null}

        {groups.sections.map((section) => (
          <div key={section.label}>
            <ConversationGroupHeader label={section.label} count={section.items.length} />
            <div className="space-y-0.5">
              {section.items.map((conversation) => (
                <ConversationRow key={conversation.id} conversation={conversation} compact={false} {...rowProps(conversation.id)} />
              ))}
            </div>
          </div>
        ))}

        <p className="px-2.5 pt-6 text-y-xs text-y-ink-dim">{SIDEBAR_HINT}</p>
      </div>

      <div className="shrink-0 border-t border-y-line p-2">
        <AccountMenu />
      </div>
    </aside>
  )
}

/**
 * Account menu. Settings, the WordPress dashboard and signing out have no
 * backend in this front-end-only build, so they are shown as unavailable with
 * the reason attached instead of pretending to work.
 */
function AccountMenu({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <button
            type="button"
            aria-label="حساب کاربری"
            className="yagent-tap flex h-9 w-9 items-center justify-center rounded-full bg-y-surface text-y-xs font-semibold text-y-ink-muted"
          >
            یق
          </button>
        ) : (
          <button
            type="button"
            className="yagent-tap flex w-full items-center gap-2.5 rounded-y-sm px-1.5 py-1.5 text-start transition-colors duration-y-fast hover:bg-y-surface-soft"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-y-surface text-y-xs font-semibold text-y-ink-muted">
              یق
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-y-base text-y-ink">یونس ق.</span>
              <span className="block truncate text-y-xs text-y-ink-dim">استودیو آرا — حساب حرفه‌ای</span>
            </span>
            <Settings className="h-4 w-4 shrink-0 text-y-ink-dim" aria-hidden />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align={collapsed ? 'center' : 'start'} className="min-w-[15rem]">
        <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
        <DropdownMenuItem icon={<Sparkles className="h-3.5 w-3.5" />} disabled>
          <span className="yagent-num">استفادهٔ این ماه: {fa(38)}٪</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Settings className="h-3.5 w-3.5" />} disabled title="در این نسخهٔ نمایشی تنظیمات وجود ندارد">
          تنظیمات YAgent
        </DropdownMenuItem>
        <DropdownMenuItem icon={<PanelRightOpen className="h-3.5 w-3.5" />} disabled title="دستیابی به پیشخوان وردپرس در این نسخهٔ نمایشی فعال نیست">
          پیشخوان وردپرس
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
        <DropdownMenuItem
          danger
          disabled
          icon={<LogOut className="h-3.5 w-3.5" />}
          title="این نسخه احراز هویت ندارد؛ خارج‌شدن از حساب فعال نیست"
        >
          خروج از حساب
        </DropdownMenuItem>
        <div className="px-2.5 pb-1 pt-2">
          <Badge variant="plain">نسخهٔ نمایشی — بدون بک‌اند و بدون احراز هویت</Badge>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
