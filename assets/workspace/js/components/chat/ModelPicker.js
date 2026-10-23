import { el, Fragment } from '../../native/dom.js';
import { ChevronDown, Plus, Settings } from '../../icons.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '../ui/dropdown-menu.js';
import { cn } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
/** Compact model selector inside the composer capsule, with model management. */
export function ModelPicker() {
    const { state, actions } = useYAgent();
    const selected = state.models.find((model) => model.id === state.selectedModelId);
    return (el(DropdownMenu, null,
        el(DropdownMenuTrigger, { asChild: true },
            el("button", { type: "button", "aria-label": "انتخاب مدل", disabled: state.sending, className: cn('inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-y-sm text-y-ink-muted', 'transition-colors duration-y-fast ease-y hover:bg-y-surface-hover hover:text-y-ink') },
                el("span", { className: "yagent-ltr" }, selected?.name ?? 'مدل را تنظیم کنید'),
                el(ChevronDown, { className: "h-3 w-3 opacity-70" }))),
        el(DropdownMenuContent, { side: "top", align: "start", className: "min-w-[13rem]" },
            el(DropdownMenuLabel, null, "\u0627\u0646\u062A\u062E\u0627\u0628 \u0645\u062F\u0644"),
            state.models.length
                ? state.models.map((model) => (el(DropdownMenuItem, { key: model.id, selected: model.id === state.selectedModelId, onSelect: () => actions.setModel(model.id) },
                    el("span", { className: "min-w-0" },
                        el("span", { className: "yagent-ltr block text-y-base text-y-ink" }, model.name),
                        model.hint ? el("span", { className: "yagent-bidi mt-0.5 block text-y-xs text-y-ink-dim" }, model.hint) : null))))
                : el(DropdownMenuLabel, null, "\u0645\u062F\u0644\u06CC \u0630\u062E\u06CC\u0631\u0647 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A"),
            el(DropdownMenuSeparator, null),
            el(DropdownMenuItem, { icon: el(Plus, { className: "h-3.5 w-3.5" }), onSelect: () => actions.openModelDialog() }, "\u0627\u0641\u0632\u0648\u062F\u0646 \u0645\u062F\u0644"),
            el(DropdownMenuItem, { icon: el(Settings, { className: "h-3.5 w-3.5" }), onSelect: () => actions.openSettings('models') }, "\u0645\u062F\u06CC\u0631\u06CC\u062A \u0645\u062F\u0644\u200C\u0647\u0627"))));
}
