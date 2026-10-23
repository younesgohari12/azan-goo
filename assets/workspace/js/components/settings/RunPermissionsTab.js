import { el } from '../../native/dom.js';
import { SettingField, Switch } from '../ui/control.js';
import { useYAgent } from '../../state/YAgentProvider.js';

/** «اجرا و مجوزها» — what the assistant may do on the site. */
export function RunPermissionsTab() {
    const { state, actions } = useYAgent();
    const settings = state.settings;
    return (el("div", { className: "yagent-stack" },
        el("section", { className: "yagent-card" },
            el(SettingField, { label: "حالت فقط خواندنی", description: "اجازهٔ تغییر سایت از داخل گفتگو گرفته می‌شود؛ YAgent فقط می‌خواند، می‌سنجد و پیشنهاد می‌سازد.", control: el(Switch, { checked: settings.readOnly, label: "حالت فقط خواندنی", onChange: (value) => actions.updateSettings({ readOnly: value }) }), hint: settings.readOnly ? 'تا وقتی این گزینه روشن است، هیچ عملیات تغییری اجرا نمی‌شود.' : 'اجرای ابزار مجاز است؛ عملیات حساس کارت تأیید دارند.' }),
            el(SettingField, { label: "نصب خودکار افزونه‌های تولیدشده", description: "اجازهٔ نصب و فعال‌سازی افزونه‌ای که خود YAgent ساخته است، بدون تأیید جدا برای هر بار.", control: el(Switch, { checked: settings.autoInstall, label: "نصب خودکار افزونه‌های تولیدشده", onChange: (value) => actions.updateSettings({ autoInstall: value }) }), hint: 'این گزینه روی افزونه‌های موجود سایت اثری ندارد.' })),
        el("p", { className: "yagent-card-note" }, "انتشار، حذف و نصب همیشه کارت تأیید جداگانه دارند؛ این دو گزینه فقط دامنهٔ کار روزمره را تعیین می‌کنند.")));
}
