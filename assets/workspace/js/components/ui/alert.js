import { el } from '../../native/dom.js';
import { AlertCircle, AlertTriangle, Check } from '../../icons.js';
import { cn } from '../../lib/utils.js';

const TONES = {
    info: { className: 'yagent-alert--info', icon: AlertCircle },
    success: { className: 'yagent-alert--success', icon: Check },
    warn: { className: 'yagent-alert--warn', icon: AlertTriangle },
    danger: { className: 'yagent-alert--danger', icon: AlertTriangle },
};

/** Small inline message used by forms: never a substitute for a field error. */
export function InlineAlert({ tone = 'info', children, className, role }) {
    const config = TONES[tone] ?? TONES.info;
    const Icon = config.icon;
    return el("p", { role: role ?? (tone === 'danger' ? 'alert' : 'status'), className: cn('yagent-alert', config.className, className) },
        el(Icon, { className: "h-3.5 w-3.5 shrink-0" }),
        el("span", { className: "min-w-0 flex-1" }, children));
}
