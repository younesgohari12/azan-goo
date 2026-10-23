import { el } from '../../native/dom.js';
import { cn } from '../../lib/utils.js';

/**
 * Ordinary labelled settings controls.
 *
 * Everything here is a native form element (checkbox, select, input) so the
 * keyboard, screen readers and focus rings keep working without reimplementation.
 */
export function SettingField({ label, description, hint, control, className }) {
    return (el("div", { className: cn('yagent-field', className) },
        el("div", { className: "yagent-field-text" },
            el("span", { className: "yagent-field-label" }, label),
            description ? (el("p", { className: "yagent-field-description" }, description)) : null,
            hint ? (el("p", { className: "yagent-field-hint" }, hint)) : null),
        el("div", { className: "yagent-field-control" }, control)));
}

/** Native checkbox styled as a switch. */
export function Switch({ checked, onChange, label, disabled = false }) {
    return (el("label", { className: cn('yagent-switch', disabled && 'yagent-switch--disabled') },
        el("input", { type: "checkbox", checked: Boolean(checked), disabled: disabled, "aria-label": label, onChange: (event) => onChange(event.target.checked) }),
        el("span", { className: "yagent-switch-track", "aria-hidden": "true" },
            el("span", { className: "yagent-switch-knob" }))));
}

export function Select({ value, onChange, options, label, disabled = false, className }) {
    return (el("select", { className: cn('yagent-select', className), value: value ?? '', disabled: disabled, "aria-label": label, onChange: (event) => onChange(event.target.value) }, options.map((option) => (el("option", { key: option.value, value: option.value, disabled: option.disabled }, option.label)))));
}

export function NumberInput({ value, onChange, label, min = 0, max, step = 1, disabled = false, className }) {
    return (el("input", { type: "number", className: cn('yagent-select yagent-number', className), value: value ?? '', min: min, max: max, step: step, disabled: disabled, "aria-label": label, onChange: (event) => onChange(Number(event.target.value)) }));
}
