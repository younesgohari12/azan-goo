import { MotionConfig } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'

import { TaskPanel } from '@/components/activity/TaskPanel'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatThread } from '@/components/chat/ChatThread'
import { ChatHeader, type ChatView } from '@/components/shell/ChatHeader'
import { ChatSidebar } from '@/components/sidebar/ChatSidebar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, Sheet } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/feedback'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsDesktop, useIsWide } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

// The preview workspace (iframe bridge + preview document builder) is only
// needed once a preview is opened, so it is split out of the initial bundle.
const PreviewWorkspace = lazy(() =>
  import('@/components/preview/PreviewWorkspace').then((module) => ({ default: module.PreviewWorkspace })),
)

function PreviewFallback() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center gap-2 bg-y-bg text-y-sm text-y-ink-muted">
      <Spinner size={15} />
      در حال آماده‌سازی پیش‌نمایش…
    </div>
  )
}

/**
 * Product shell.
 *
 * One column is the base layout: on phones and tablets the header sits on top at
 * full width and the chat column below it flexes with `min-height: 0`, so the
 * thread scrolls and the composer stays on screen. The earlier version kept the
 * root as a row at every width, which pushed the header next to the chat and cut
 * the composer off the left edge of a 390px screen.
 *
 * From 1024px up the same pieces become columns; from 1280px up the work plan
 * docks beside the chat. Below that, the plan and the history are drawers — so
 * both panels can always be closed and reopened, at every breakpoint.
 */
export function YAgentApp() {
  const { state, actions } = useYAgent()
  const isDesktop = useIsDesktop()
  const isWide = useIsWide()
  const [historySheet, setHistorySheet] = useState(false)
  const [railHistory, setRailHistory] = useState(false)
  const [mobileView, setMobileView] = useState<ChatView>('chat')

  const previewOpen = state.preview.open

  useEffect(() => {
    if (previewOpen && !isDesktop) setMobileView('preview')
    if (!previewOpen) setMobileView('chat')
  }, [previewOpen, isDesktop])

  // The plan docks only where three columns genuinely fit; on every narrower
  // layout it is a drawer, and it must start closed instead of covering the chat.
  useEffect(() => {
    if (!isWide && state.panelOpen) actions.setPanel({ open: false })
    // Keyed on the breakpoint only: re-running whenever `panelOpen` changes would
    // immediately close the drawer the user just opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWide])

  // Notes are written in the feedback panel. Where that panel is a drawer, bring
  // it up as soon as a note is placed or picked, so the comment field is reachable.
  useEffect(() => {
    if (!state.preview.selectedAnnotationId) return
    if (isWide && !state.preview.annotate) return
    actions.setPanel({ open: true, tab: 'feedback' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.preview.selectedAnnotationId, state.preview.annotate, isWide])

  const railForced = previewOpen && !isWide
  const sidebarCollapsed = state.sidebarCollapsed || railForced
  const showRail = isDesktop && sidebarCollapsed
  const panelDocked = isDesktop && isWide && state.panelOpen
  const panelDrawer = state.panelOpen && !panelDocked

  const openHistory = () => {
    if (!isDesktop) {
      setHistorySheet(true)
      return
    }
    setRailHistory(true)
  }

  const historyColumn = (
    <ChatSidebar
      collapsed={showRail}
      onToggleCollapse={isDesktop ? (showRail ? openHistory : () => actions.toggleSidebar()) : undefined}
      onSelectConversation={() => {
        setHistorySheet(false)
        setRailHistory(false)
      }}
    />
  )

  const chatHeader = (
    <ChatHeader
      onOpenHistory={isDesktop ? undefined : openHistory}
      showViewSwitch={!isDesktop && previewOpen}
      view={mobileView}
      onViewChange={setMobileView}
      onTogglePanel={() => actions.setPanel({ open: !state.panelOpen })}
    />
  )

  const chatBody = (
    <>
      <ChatThread />
      <ChatComposer />
    </>
  )

  const panelColumn = (
    <TaskPanel hideHeader onCollapse={panelDocked ? () => actions.setPanel({ open: false }) : undefined} />
  )

  const showingMobilePreview = !isDesktop && previewOpen && mobileView === 'preview'

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <div className="yagent-root flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-y-bg" dir="rtl">
          {isDesktop ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-row">
              <div
                className={cn(
                  'shrink-0 border-s border-y-line transition-[width] duration-y-slow ease-y',
                  sidebarCollapsed ? 'w-[var(--y-sidebar-rail-w)]' : 'w-[var(--y-sidebar-w)]',
                )}
              >
                {historyColumn}
              </div>

              {previewOpen ? (
                <>
                  <main className="flex min-h-0 w-[23rem] min-w-0 shrink-0 flex-col border-s border-y-line xl:w-[26rem]">
                    {chatHeader}
                    {chatBody}
                  </main>
                  <Suspense fallback={<PreviewFallback />}>
                    <PreviewWorkspace />
                  </Suspense>
                </>
              ) : (
                <main className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {chatHeader}
                  {chatBody}
                </main>
              )}

              {panelDocked ? (
                <div className="flex w-[var(--y-panel-w)] shrink-0 flex-col border-e border-y-line">{panelColumn}</div>
              ) : null}
            </div>
          ) : (
            <>
              {chatHeader}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {showingMobilePreview ? (
                  <Suspense fallback={<PreviewFallback />}>
                    <PreviewWorkspace />
                  </Suspense>
                ) : (
                  chatBody
                )}
              </div>
            </>
          )}

          {/* History: the mobile drawer, and the desktop rail's overlay for when
              the preview forces the sidebar into its rail form. */}
          <Sheet
            open={historySheet}
            onOpenChange={setHistorySheet}
            side="right"
            title="تاریخچهٔ گفتگوها"
            className="bg-y-sidebar"
          >
            <ChatSidebar onSelectConversation={() => setHistorySheet(false)} />
          </Sheet>
          <Sheet
            open={railHistory}
            onOpenChange={setRailHistory}
            side="right"
            title="تاریخچهٔ گفتگوها"
            className="bg-y-sidebar"
          >
            <ChatSidebar
              onToggleCollapse={() => setRailHistory(false)}
              onSelectConversation={() => setRailHistory(false)}
            />
          </Sheet>

          {/* Work plan + feedback: a drawer wherever it is not docked. */}
          <Sheet
            open={panelDrawer}
            onOpenChange={(open) => actions.setPanel({ open })}
            side="left"
            title="مراحل انجام کار"
            className="bg-y-bg-elevated"
          >
            <TaskPanel hideHeader />
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
