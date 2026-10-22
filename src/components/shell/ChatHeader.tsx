import { ListChecks, MessageSquare, MonitorPlay, PanelRight, X } from 'lucide-react'

import { YAgentMark } from '@/components/sidebar/ChatSidebar'
import { Button, IconButton } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'
import { revisionsOfPage } from '@/state/state'

export type ChatView = 'chat' | 'preview'

/**
 * Short chat header: which conversation you are in, which site page it is
 * working on, and the three controls that must always be reachable — the
 * preview, the work plan and (on small screens) the history drawer.
 *
 * It is what makes the panels recoverable: both the work plan and the preview
 * can be closed and reopened from here at every breakpoint, and the preview can
 * also be opened straight from a conversation that owns a page, without going
 * through a result card first.
 */
export function ChatHeader({
  onOpenHistory,
  showViewSwitch = false,
  view,
  onViewChange,
  onTogglePanel,
}: {
  onOpenHistory?: () => void
  showViewSwitch?: boolean
  view?: ChatView
  onViewChange?: (view: ChatView) => void
  onTogglePanel?: () => void
}) {
  const { state, actions, derived } = useYAgent()
  const conversation = derived.activeConversation

  const pageId = conversation?.previewPageId
  const pageRevisions = revisionsOfPage(state, pageId)
  const latestRevision = [...pageRevisions].sort((a, b) => b.revision - a.revision)[0]
  const previewOpen = state.preview.open
  const canOpenPreview = Boolean(pageId && (latestRevision || derived.revisions.length > 0))

  const context = previewOpen
    ? `پیش‌نمایش: ${state.revisions[state.preview.revisionId ?? '']?.pageTitle ?? 'صفحهٔ سایت'}`
    : conversation?.previewPageId
      ? `صفحهٔ در دست کار: ${latestRevision?.pageTitle ?? 'صفحهٔ سایت'}`
      : 'ساخت صفحه، افزونه و اصلاح سایت با گفتگو'

  return (
    <header className="flex shrink-0 items-center gap-1.5 border-b border-y-line bg-y-bg px-2 py-1.5 sm:px-3">
      {onOpenHistory ? (
        <Tooltip label="تاریخچهٔ گفتگوها">
          <IconButton
            label="تاریخچهٔ گفتگوها"
            size="md"
            className="yagent-tap lg:hidden"
            onClick={onOpenHistory}
          >
            <PanelRight className="h-4 w-4" />
          </IconButton>
        </Tooltip>
      ) : null}

      <YAgentMark className="h-7 w-7 shrink-0 lg:hidden" />

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-y-base font-medium text-y-ink">
          {conversation?.title ?? 'YAgent'}
        </h1>
        <p className="truncate text-y-xs text-y-ink-dim">{context}</p>
      </div>

      {showViewSwitch && view && onViewChange ? (
        <Segmented
          size="sm"
          label="نمای چت یا پیش‌نمایش"
          className="yagent-tap shrink-0"
          value={view}
          onChange={onViewChange}
          options={[
            { value: 'chat', label: 'چت', icon: <MessageSquare className="h-3.5 w-3.5" /> },
            { value: 'preview', label: 'پیش‌نمایش', icon: <MonitorPlay className="h-3.5 w-3.5" /> },
          ]}
        />
      ) : null}

      {previewOpen ? (
        <Tooltip label="بستن پیش‌نمایش">
          <IconButton label="بستن پیش‌نمایش" size="md" className="yagent-tap" onClick={() => actions.closePreview()}>
            <X className="h-4 w-4" />
          </IconButton>
        </Tooltip>
      ) : canOpenPreview ? (
        <Button
          size="sm"
          variant="secondary"
          className="yagent-tap h-9 shrink-0"
          onClick={() => void actions.openPreview(pageId as string, latestRevision?.id)}
        >
          <MonitorPlay className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">پیش‌نمایش</span>
        </Button>
      ) : null}

      {onTogglePanel ? (
        <Tooltip label={state.panelOpen ? 'جمع‌کردن مراحل انجام کار' : 'نمایش مراحل انجام کار'}>
          <IconButton
            label="مراحل انجام کار"
            size="md"
            className={cn('yagent-tap relative', state.panelOpen && 'text-y-ink')}
            aria-pressed={state.panelOpen}
            onClick={onTogglePanel}
          >
            <ListChecks className="h-4 w-4" />
            {derived.pendingApproval ? (
              <span className="absolute end-1 top-1 h-1.5 w-1.5 rounded-full bg-y-warn" aria-hidden />
            ) : null}
          </IconButton>
        </Tooltip>
      ) : null}
    </header>
  )
}
