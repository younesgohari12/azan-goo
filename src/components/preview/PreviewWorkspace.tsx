import { PreviewCanvas } from './PreviewCanvas'
import { PreviewToolbar } from './PreviewToolbar'
import { useYAgent } from '@/state/YAgentProvider'

/**
 * Canvas mode: the chat stays in a narrow column, the preview takes the room,
 * the history collapses to a rail and the panel becomes a drawer (see YAgentApp).
 */
export function PreviewWorkspace() {
  const { actions, state } = useYAgent()

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-y-bg">
      <PreviewToolbar
        onClose={() => actions.closePreview()}
        onTogglePanel={() => actions.setPanel({ open: !state.panelOpen })}
        panelOpen={state.panelOpen}
      />
      <div className="min-h-0 flex-1">
        <PreviewCanvas frameKey={state.preview.nonce} />
      </div>
    </div>
  )
}
