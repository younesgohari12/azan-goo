import { ChevronDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useYAgent } from '@/state/YAgentProvider'

/** Compact model selector inside the composer capsule. */
export function ModelPicker() {
  const { state, actions } = useYAgent()
  const selected = state.models.find((model) => model.id === state.selectedModelId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-y-sm text-y-ink-muted',
            'transition-colors duration-y-fast ease-y hover:bg-y-surface-hover hover:text-y-ink',
          )}
        >
          <span className="yagent-ltr">{selected?.name ?? 'YAgent'}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="min-w-[13rem]">
        <DropdownMenuLabel>انتخاب مدل</DropdownMenuLabel>
        {state.models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            selected={model.id === state.selectedModelId}
            onSelect={() => actions.setModel(model.id)}
          >
            <span className="min-w-0">
              <span className="yagent-ltr block text-y-base text-y-ink">{model.name}</span>
              {model.hint ? <span className="mt-0.5 block text-y-xs text-y-ink-dim">{model.hint}</span> : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
