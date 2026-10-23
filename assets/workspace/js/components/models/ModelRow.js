import { el } from '../../native/dom.js';
import { PenLine, Trash2 } from '../../icons.js';
import { Badge } from '../ui/badge.js';
import { Button } from '../ui/button.js';

/**
 * One saved model inside «مدل‌ها و اتصال»: identity, capabilities and the edit
 * and remove actions.
 */
export function ModelRow({ model, active, onEdit, onRemove }) {
    return (el("li", { className: "yagent-model-row" },
        el("div", { className: "yagent-model-main" },
            el("span", { className: "yagent-model-name" },
                el("span", { className: "yagent-ltr" }, model.name),
                active ? el(Badge, { variant: "success" }, "مدل فعال") : null),
            el("span", { className: "yagent-model-meta" },
                el("span", { className: "yagent-bidi text-y-ink-dim" }, model.hint ?? model.provider),
                model.supportsTools
                    ? el(Badge, { variant: "accent" }, "اجرای ابزار")
                    : el(Badge, { variant: "neutral" }, "بدون ابزار"))),
        el("div", { className: "yagent-model-actions" },
            el(Button, { size: "sm", variant: "ghost", "aria-label": `ویرایش مدل ${model.name}`, onClick: () => onEdit(model.id) },
                el(PenLine, { className: "h-3.5 w-3.5" }),
                "ویرایش"),
            el(Button, { size: "sm", variant: "ghost", className: "text-y-danger hover:text-y-danger", "aria-label": `حذف مدل ${model.name}`, onClick: () => onRemove(model.id) },
                el(Trash2, { className: "h-3.5 w-3.5" }),
                "حذف"))));
}
