import { el } from '../../native/dom.js';
import { Plus } from '../../icons.js';
import { ModelRow } from '../models/ModelRow.js';
import { Button } from '../ui/button.js';
import { Select, SettingField } from '../ui/control.js';
import { useYAgent } from '../../state/YAgentProvider.js';

/** «مدل‌ها و اتصال» — the active model and the saved model list. */
export function ModelsTab() {
    const { state, actions } = useYAgent();
    const models = state.models;
    const activeId = state.settings.activeModelId || state.selectedModelId || models[0]?.id || '';
    return (el("div", { className: "yagent-stack" },
        el("section", { className: "yagent-card" },
            el("h3", { className: "yagent-card-title" }, "مدل فعال برای گفتگو"),
            el(SettingField, { label: "مدل پیش‌فرض", description: "درخواست‌های تازه با این مدل اجرا می‌شوند؛ از کادر گفتگو هم می‌توانید مدل را عوض کنید.", control: el(Select, { value: activeId, label: "مدل پیش‌فرض", disabled: models.length === 0, options: models.map((model) => ({ value: model.id, label: `${model.name} — ${model.hint ?? model.provider}` })), onChange: (value) => {
                    actions.setModel(value);
                    actions.updateSettings({ activeModelId: value });
                } }) })),
        el("section", { className: "yagent-card" },
            el("div", { className: "yagent-card-head" },
                el("div", { className: "min-w-0" },
                    el("h3", { className: "yagent-card-title" }, "مدل‌های ذخیره‌شده"),
                    el("p", { className: "yagent-card-note" }, "مدل‌ها همین‌جا مدیریت می‌شوند و بی‌درنگ در فهرست انتخاب مدل کادر گفتگو دیده می‌شوند.")),
                el(Button, { size: "sm", variant: "primary", onClick: () => actions.openModelDialog() },
                    el(Plus, { className: "h-3.5 w-3.5" }),
                    "افزودن مدل")),
            models.length
                ? el("ul", { className: "yagent-model-list" }, models.map((model) => (el(ModelRow, { key: model.id, model: model, active: model.id === activeId, onEdit: (id) => actions.openModelDialog(id), onRemove: (id) => void actions.removeModel(id) }))))
                : el("p", { className: "yagent-empty" }, "هنوز مدلی ذخیره نشده است. با «افزودن مدل» شروع کنید.")),
        el("p", { className: "yagent-card-note" }, "کلیدهای API روی سرور نگه داشته می‌شوند و در این صفحه نمایش داده نمی‌شوند.")));
}
