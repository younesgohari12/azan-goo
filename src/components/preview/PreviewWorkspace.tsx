import { PreviewCanvas } from './PreviewCanvas'
import { PreviewToolbar } from './PreviewToolbar'
import { useYAgent } from '@/state/YAgentProvider'

/**
 * Canvas mode: the chat stays in a narrow column, the preview takes the room,
 * the history collapses to a rail and the step/feedback panel is either docked
 * (≥1280px) or a real drawer (below that).
 */
export function PreviewWorkspace({
  onTogglePanel,
  panelOpen,
}: {
  onTogglePanel?: () => void
  panelOpen?: boolean
}) {
  const { actions, state } = useYAgent()

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-y-bg">
      <PreviewToolbar
        onClose={() => actions.closePreview()}
        onTogglePanel={onTogglePanel ?? (() => actions.setPanel({ open: !state.panelOpen }))}
        panelOpen={panelOpen ?? state.panelOpen}
      />
      <div className="min-h-0 flex-1">
        <PreviewCanvas frameKey={state.preview.nonce} />
      </div>
    </div>
  )
}
