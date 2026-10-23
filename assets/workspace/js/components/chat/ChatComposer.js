import { el, Fragment } from '../../native/dom.js';
import { ArrowUp, Mic, Plus, Square } from '../../icons.js';
import { afterRender, reference, stateCell } from '../../native/dom.js';
import { AttachmentChips } from './AttachmentChips.js';
import { ModelPicker } from './ModelPicker.js';
import { Button, IconButton } from '../ui/button.js';
import { Tooltip } from '../ui/tooltip.js';
import { cn } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';
import { composerOf } from '../../state/state.js';
const MAX_TEXTAREA_HEIGHT = 208;
/**
 * Capsule composer: always reachable at the bottom of the chat column.
 * Enter sends, Shift+Enter adds a line, the textarea grows and then scrolls.
 */
export function ChatComposer() {
    const { state, actions, derived } = useYAgent();
    const composer = composerOf(state, state.activeConversationId);
    const textareaRef = reference(null);
    const fileInputRef = reference(null);
    const [focused, setFocused] = stateCell(false);
    afterRender(() => {
        const element = textareaRef.current;
        if (!element)
            return;
        element.style.height = 'auto';
        element.style.height = `${Math.min(element.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }, [composer.text]);
    function handleFiles(files) {
        if (!files || files.length === 0)
            return;
        actions.addAttachments(Array.from(files));
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    }
    async function submit() {
        if (derived.running || !derived.canSend)
            return;
        await actions.send();
        textareaRef.current?.focus();
    }
    const voiceLabel = state.capabilities.voiceInput
        ? 'ورودی صوتی'
        : 'ورودی صوتی در این نسخه فعال نیست';
    return (el("div", { className: "shrink-0 border-t border-y-line bg-y-bg/95 px-3 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-5" },
        el("div", { className: "mx-auto w-full max-w-[var(--y-reading-w)]" },
            el(AttachmentChips, { attachments: composer.attachments, onRemove: actions.removeAttachment }),
            el("div", { className: cn('rounded-y-2xl border bg-y-surface transition-[border-color,box-shadow] duration-y ease-y', focused ? 'border-y-accent-border/60 shadow-y-soft' : 'border-y-line') },
                el("textarea", { ref: textareaRef, value: composer.text, rows: 1, "aria-label": "پیام شما", disabled: state.sending, onChange: (event) => actions.setComposerText(event.target.value), onFocus: () => setFocused(true), onBlur: () => setFocused(false), onKeyDown: (event) => {
                        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                            event.preventDefault();
                            void submit();
                        }
                    }, placeholder: "\u0627\u0632 YAgent \u0628\u062E\u0648\u0627\u0647 \u0631\u0648\u06CC \u0633\u0627\u06CC\u062A\u062A \u06A9\u0627\u0631\u06CC \u0627\u0646\u062C\u0627\u0645 \u0628\u062F\u0647\u2026", className: cn('block min-h-[56px] w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-y-chat text-y-ink', 'outline-none placeholder:text-y-ink-dim') }),
                el("div", { className: "flex items-center gap-1 px-2 pb-2 pt-0.5" },
                    el(Tooltip, { label: "\u0627\u0641\u0632\u0648\u062F\u0646 \u0641\u0627\u06CC\u0644" },
                        el(IconButton, { label: "\u0627\u0641\u0632\u0648\u062F\u0646 \u0641\u0627\u06CC\u0644", size: "md", onClick: () => fileInputRef.current?.click() },
                            el(Plus, { className: "h-4 w-4" }))),
                    el(ModelPicker, null),
                    el("span", { className: "flex-1" }),
                    el(Tooltip, { label: voiceLabel },
                        el("span", { className: "inline-flex" },
                            el(IconButton, { label: "\u0648\u0631\u0648\u062F\u06CC \u0635\u0648\u062A\u06CC", size: "md", disabled: !state.capabilities.voiceInput },
                                el(Mic, { className: "h-4 w-4" })))),
                    derived.running ? (el(Button, { variant: "secondary", shape: "pill", className: "h-11 gap-2 border-y-line-strong px-4 sm:h-10 sm:px-3.5", onClick: () => void actions.stop(), "aria-label": "\u062A\u0648\u0642\u0641 \u06A9\u0627\u0631" },
                        el(Square, { className: "h-3 w-3 fill-current" }),
                        "\u062A\u0648\u0642\u0641")) : (el(Button, { variant: derived.canSend ? 'primary' : 'secondary', shape: "pill", size: "icon", "aria-label": "\u0627\u0631\u0633\u0627\u0644 \u067E\u06CC\u0627\u0645", className: cn('h-11 w-11 sm:h-10 sm:w-10', !derived.canSend && 'border border-y-line text-y-ink-dim'), disabled: !derived.canSend, onClick: () => void submit() },
                        el(ArrowUp, { className: "h-[18px] w-[18px]" }))))),
            el("p", { className: "mt-2 text-center text-y-xs leading-6 text-y-ink-dim" }, "پیام‌ها روی سایت ذخیره می‌شوند · Enter ارسال · Shift+Enter خط جدید")),
        el("input", { ref: fileInputRef, type: "file", multiple: true, className: "hidden", onChange: (event) => handleFiles(event.target.files) })));
}
