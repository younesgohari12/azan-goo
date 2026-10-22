import { MotionConfig } from 'framer-motion'
import { MessageSquare, MonitorPlay, PanelLeftOpen, PanelRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { TaskPanel } from '@/components/activity/TaskPanel'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatThread } from '@/components/chat/ChatThread'
import { PreviewWorkspace } from '@/components/preview/PreviewWorkspace'
import { ChatSidebar, YAgentMark } from '@/components/sidebar/ChatSidebar'
import { Button, IconButton } from '@/components/ui/button'
import { Dialog, DialogContent, Sheet } from '@/components/ui/dialog'
import { Segmented } from '@/components/ui/segmented'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsDesktop, useIsWide } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

/**
 * Product shell.
 *
 * Desktop: conversations on the right, chat in the middle, work plan on the left
 * (three independently scrolling columns).
 * Preview mode: history collapses to a rail, the chat narrows, the canvas takes
 * the room and the plan becomes a collapsible drawer.
 * Mobile: the same pieces as drawers plus a chat/preview tab switch.
 */
export function YAgentApp() {
  const { state, actions, derived } = useYAgent()
  const isDesktop = useIsDesktop()
  const isWide = useIsWide()
  const [sidebarSheet, setSidebarSheet] = useState(false)
  const [panelSheet, setPanelSheet] = useState(false)
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat')

  const previewOpen = state.preview.open

  useEffect(() => {
    if (previewOpen && !isDesktop) setMobileView('preview')
    if (!previewOpen) setMobileView('chat')
  }, [previewOpen, isDesktop])

  const railForced = previewOpen && !isWide
  const sidebarCollapsed = state.sidebarCollapsed || railForced
  const panelDocked = isDesktop && state.panelOpen && (!previewOpen || isWide)

  const historyColumn = (
    <ChatSidebar
      collapsed={sidebarCollapsed && isDesktop}
      onToggleCollapse={isDesktop ? () => actions.toggleSidebar() : undefined}
      onSelectConversation={() => setSidebarSheet(false)}
    />
  )

  const panelColumn = <TaskPanel onCollapse={isDesktop ? () => actions.setPanel({ open: false }) : undefined} />

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        {/* One column on mobile (header → content → composer), three columns from
            1024px. Height comes from `.yagent-viewport` (dvh with a vh fallback);
            every flex child gets min-h-0/min-w-0 so nothing is clipped away. */}
        <div className="yagent-root yagent-viewport flex w-full min-w-0 flex-col bg-y-bg lg:flex-row" dir="rtl">
          {isDesktop ? (
            <>
              <div
                className={cn(
                  'shrink-0 border-s border-y-line transition-[width] duration-y-slow ease-y',
                  sidebarCollapsed ? 'w-[var(--y-sidebar-rail-w)]' : 'w-[var(--y-sidebar-w)]',
                )}
              >
                {historyColumn}
              </div>

              <main
                className={cn(
                  'flex min-h-0 min-w-0 flex-col',
                  previewOpen ? 'w-[24rem] shrink-0 border-s border-y-line xl:w-[26rem]' : 'flex-1',
                )}
              >
                <ChatThread />
                <ChatComposer />
              </main>

              {previewOpen ? <PreviewWorkspace /> : null}

              {panelDocked ? (
                <div className="w-[var(--y-panel-w)] shrink-0 border-e border-y-line">{panelColumn}</div>
              ) : null}
            </>
          ) : (
            <>
              <header className="flex shrink-0 items-center gap-1.5 border-b border-y-line bg-y-sidebar px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
                <IconButton label="تاریخچهٔ گفتگوها" size="md" onClick={() => setSidebarSheet(true)}>
                  <PanelRight className="h-4 w-4" />
                </IconButton>
                <YAgentMark className="h-7 w-7 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="yagent-ltr truncate text-start text-y-md font-semibold text-y-ink">YAgent</div>
                  <div className="truncate text-y-xs text-y-ink-dim">
                    {derived.activeConversation?.title ?? 'دستیار وردپرس'}
                  </div>
                </div>
                {previewOpen ? (
                  <Segmented
                    size="sm"
                    value={mobileView}
                    onChange={setMobileView}
                    options={[
                      { value: 'chat', label: 'چت', icon: <MessageSquare className="h-3.5 w-3.5" /> },
                      { value: 'preview', label: 'پیش‌نمایش', icon: <MonitorPlay className="h-3.5 w-3.5" /> },
                    ]}
                  />
                ) : null}
                <IconButton label="مراحل انجام کار" size="md" onClick={() => setPanelSheet(true)}>
                  <PanelLeftOpen className="h-4 w-4" />
                </IconButton>
              </header>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {previewOpen && mobileView === 'preview' ? (
                  <PreviewWorkspace />
                ) : (
                  <>
                    <ChatThread />
                    <ChatComposer />
                  </>
                )}
              </div>
            </>
          )}

          {/* Mobile drawers */}
          <Sheet
            open={sidebarSheet}
            onOpenChange={setSidebarSheet}
            side="right"
            title="تاریخچهٔ گفتگوها"
            className="bg-y-sidebar"
          >
            <ChatSidebar onSelectConversation={() => setSidebarSheet(false)} />
          </Sheet>
          <Sheet open={panelSheet} onOpenChange={setPanelSheet} side="left" title="مراحل انجام کار">
            <TaskPanel />
          </Sheet>
        </div>

        <Dialog
          open={Boolean(state.confirmDeleteConversationId)}
          onOpenChange={(open) => {
            if (!open) actions.dismissDelete()
          }}
        >
          {state.confirmDeleteConversationId ? (
            <DialogContent
              title="حذف گفتگو"
              description="این گفتگو و پیام‌هایش حذف می‌شود. این کار برگشت‌پذیر نیست."
              footer={
                <>
                  <Button variant="ghost" size="sm" onClick={() => actions.dismissDelete()}>
                    لغو
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => void actions.confirmDelete()}>
                    حذف کن
                  </Button>
                </>
              }
            />
          ) : null}
        </Dialog>
      </TooltipProvider>
    </MotionConfig>
  )
}
