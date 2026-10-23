import { el } from '../../native/dom.js';
import { Select, SettingField, Switch } from '../ui/control.js';
import { useYAgent } from '../../state/YAgentProvider.js';

const DENSITY = [
    { value: 'comfortable', label: 'راحت' },
    { value: 'compact', label: 'فشرده' },
];
const FONT_SCALE = [
    { value: 'sm', label: 'کوچک' },
    { value: 'md', label: 'متوسط' },
    { value: 'lg', label: 'بزرگ' },
];
const ACCENT = [
    { value: 'violet', label: 'بنفش (پیش‌فرض)' },
    { value: 'indigo', label: 'نیلی' },
    { value: 'teal', label: 'فیروزه‌ای' },
];
const TITLE_MODES = [
    { value: 'auto', label: 'خودکار از متن درخواست' },
    { value: 'manual', label: 'فقط تا وقتی نام می‌گذارم' },
];

/** «گفتگو و ظاهر» — drafts, titles and how the workspace looks. */
export function ChatAppearanceTab() {
    const { state, actions } = useYAgent();
    const { draft, appearance } = state.settings;
    const patchDraft = (values) => actions.updateSettings({ draft: { ...draft, ...values } });
    const patchAppearance = (values) => actions.updateSettings({ appearance: { ...appearance, ...values } });
    return (el("div", { className: "yagent-stack" },
        el("section", { className: "yagent-card" },
            el("h3", { className: "yagent-card-title" }, "پیش‌نویس‌ها و عنوان گفتگو"),
            el(SettingField, { label: "نگه‌داشتن پیش‌نویس پیام", description: "متنی که نوشته‌اید در همین مرورگر می‌ماند، حتی پس از بستن صفحه.", control: el(Switch, { checked: draft.keepDrafts, label: "نگه‌داشتن پیش‌نویس پیام", onChange: (value) => patchDraft({ keepDrafts: value }) }) }),
            el(SettingField, { label: "نگه‌داشتن پیوست‌های آماده", description: "فایل‌هایی که بارگذاری شده‌اند و هنوز فرستاده نشده‌اند.", control: el(Switch, { checked: draft.keepAttachments, label: "نگه‌داشتن پیوست‌های آماده", onChange: (value) => patchDraft({ keepAttachments: value }) }) }),
            el(SettingField, { label: "تأیید پیش از حذف گفتگو", description: "پیش از حذف گفتگو و پیام‌هایش یک تأیید می‌گیرید.", control: el(Switch, { checked: draft.confirmDelete, label: "تأیید پیش از حذف گفتگو", onChange: (value) => patchDraft({ confirmDelete: value }) }) }),
            el(SettingField, { label: "عنوان گفتگو", description: "گفتگوی بی‌عنوان می‌ماند تا درخواست روشن شود؛ سپس یک عنوان کوتاه فارسی می‌گیرد. عنوانی که خودتان نوشته‌اید هرگز بازنویسی نمی‌شود.", control: el(Select, { value: draft.titleGeneration, label: "عنوان گفتگو", options: TITLE_MODES, onChange: (value) => patchDraft({ titleGeneration: value }) }) })),
        el("section", { className: "yagent-card" },
            el("h3", { className: "yagent-card-title" }, "نمایش"),
            el(SettingField, { label: "چیدمان ستون‌ها", description: "فشرده‌تر یعنی ستون‌ها و ردیف‌های نزدیک‌تر به هم.", control: el(Select, { value: appearance.density, label: "چیدمان ستون‌ها", options: DENSITY, onChange: (value) => patchAppearance({ density: value }) }) }),
            el(SettingField, { label: "اندازهٔ متن گفتگو", description: "اندازهٔ متن پیام‌ها و توضیح‌ها.", control: el(Select, { value: appearance.fontScale, label: "اندازهٔ متن گفتگو", options: FONT_SCALE, onChange: (value) => patchAppearance({ fontScale: value }) }) }),
            el(SettingField, { label: "رنگ تأکید", description: "رنگ دکمه‌ها، نشانه‌ها و حالت فوکوس.", control: el(Select, { value: appearance.accent, label: "رنگ تأکید", options: ACCENT, onChange: (value) => patchAppearance({ accent: value }) }) }),
            el(SettingField, { label: "نمایش زمان پیام‌ها", description: "ساعت ارسال هر پیام زیر آن نوشته می‌شود.", control: el(Switch, { checked: appearance.showTimestamps, label: "نمایش زمان پیام‌ها", onChange: (value) => patchAppearance({ showTimestamps: value }) }) }),
            el(SettingField, { label: "کاهش حرکت", description: "انیمیشن‌های ورود و گذار حداقل می‌شوند.", control: el(Switch, { checked: appearance.reduceMotion, label: "کاهش حرکت", onChange: (value) => patchAppearance({ reduceMotion: value }) }) }))));
}
