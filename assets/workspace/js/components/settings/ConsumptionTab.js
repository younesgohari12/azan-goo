import { el } from '../../native/dom.js';
import { NumberInput, Select, SettingField, Switch } from '../ui/control.js';
import { fa } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';

const MODES = [
    { value: 'capped', label: 'محدود، با سقف ماهانه' },
    { value: 'notify', label: 'فقط اعلام مصرف' },
    { value: 'unlimited', label: 'بدون سقف' },
];

/** «مصرف» — the ceilings that protect the account. */
export function ConsumptionTab() {
    const { state, actions } = useYAgent();
    const consumption = state.settings.consumption;
    const patch = (values) => actions.updateSettings({ consumption: { ...consumption, ...values } });
    const capped = consumption.mode === 'capped';
    return (el("div", { className: "yagent-stack" },
        el("section", { className: "yagent-card" },
            el(SettingField, { label: "سیاست مصرف", description: "نحوهٔ برخورد با مصرف توکن حساب.", control: el(Select, { value: consumption.mode, label: "سیاست مصرف", options: MODES, onChange: (value) => patch({ mode: value }) }) }),
            el(SettingField, { label: "سقف ماهانه (توکن)", description: "بیشترین مصرف ماهانه؛ پس از آن اجرای درخواست‌های تازه متوقف می‌شود.", control: el(NumberInput, { value: consumption.monthlyTokens, min: 0, step: 50000, disabled: !capped, label: "سقف ماهانه", onChange: (value) => patch({ monthlyTokens: value }) }) }),
            el(SettingField, { label: "سقف هر درخواست (توکن)", description: "بیشترین حجمی که یک درخواست می‌تواند مصرف کند.", control: el(NumberInput, { value: consumption.requestTokens, min: 0, step: 1000, label: "سقف هر درخواست", onChange: (value) => patch({ requestTokens: value }) }) }),
            el(SettingField, { label: "هشدار در درصدی از سقف", description: "پیش از رسیدن به سقف، هشدار نشان داده می‌شود.", control: el(NumberInput, { value: consumption.notifyAtPercent, min: 10, max: 100, step: 5, label: "درصد هشدار", onChange: (value) => patch({ notifyAtPercent: value }) }) }),
            el(SettingField, { label: "توقف پس از رسیدن به سقف", description: "خاموش‌کردن این گزینه یعنی فقط هشدار می‌گیرید و اجرا ادامه دارد.", control: el(Switch, { checked: consumption.stopOnLimit, label: "توقف پس از رسیدن به سقف", onChange: (value) => patch({ stopOnLimit: value }) }) })),
        el("p", { className: "yagent-card-note" },
            "مصرف این ماه با سقف ",
            el("span", { className: "yagent-num" }, fa(consumption.monthlyTokens.toLocaleString('en-US'))),
            " توکن ثبت می‌شود؛ پروندهٔ مصرف فقط فرادادهٔ عملیاتی را نگه می‌دارد و متن گفتگوها را ذخیره نمی‌کند.")));
}
