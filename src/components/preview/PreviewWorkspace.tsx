import { Check } from 'lucide-react'
import { useState } from 'react'

import { PreviewCanvas } from './PreviewCanvas'
import { PreviewToolbar } from './PreviewToolbar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/feedback'
import { fa } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

/**
 * Preview mode: the chat keeps a narrow column next to it (desktop), the history
 * collapses to a rail and the work plan becomes a drawer — see YAgentApp, which
 * owns that layout. The workspace itself is the toolbar plus the canvas.
 */
export function PreviewWorkspace() {
  const { state, actions, derived } = useYAgent()
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const revision = derived.currentRevision
  const canPublish = Boolean(revision && revision.status === 'draft' && state.capabilities.publish && !derived.running)

  async function publish() {
    if (!revision) return
    setPublishing(true)
    await actions.publishRevision(revision.id)
    setPublishing(false)
    setPublishOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-y-bg">
      <PreviewToolbar
        onClose={() => actions.closePreview()}
        onTogglePanel={() => actions.setPanel({ open: !state.panelOpen })}
        panelOpen={state.panelOpen}
        onRequestPublish={() => setPublishOpen(true)}
        canPublish={canPublish}
      />
      <div className="min-h-0 min-w-0 flex-1">
        <PreviewCanvas frameKey={state.preview.nonce} />
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        {publishOpen ? (
          <DialogContent
            title={`انتشار آزمایشی نسخهٔ ${fa(revision?.revision ?? 1)}`}
            description="این نسخهٔ نمایشی است: انتشار فقط داخل همین محیط آزمایشی ثبت می‌شود و روی سایت واقعی هیچ تغییری اعمال نمی‌شود."
            footer={
              <>
                <Button variant="ghost" size="sm" onClick={() => setPublishOpen(false)} disabled={publishing}>
                  لغو
                </Button>
                <Button variant="success" size="sm" onClick={() => void publish()} disabled={publishing}>
                  {publishing ? <Spinner size={14} /> : <Check className="h-3.5 w-3.5" />}
                  تأیید انتشار آزمایشی
                </Button>
              </>
            }
          >
            <ul className="space-y-1.5 text-y-sm text-y-ink-muted">
              <li>
                <span className="text-y-ink-dim">صفحه: </span>
                {revision?.pageTitle}
              </li>
              <li>
                <span className="text-y-ink-dim">خلاصهٔ تغییر: </span>
                {revision?.summary}
              </li>
              <li className="yagent-num">
                <span className="text-y-ink-dim">نظرهای ثبت‌شده روی این نسخه: </span>
                {fa(derived.draftAnnotations.length)}
              </li>
            </ul>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}
