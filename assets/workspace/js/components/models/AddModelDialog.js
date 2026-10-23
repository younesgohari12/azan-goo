import { el, Fragment } from '../../native/dom.js';
import { Check, ChevronDown, Eye, EyeOff, Plus, RefreshCw, Search } from '../../icons.js';
import { afterRender, memoValue, stateCell } from '../../native/dom.js';
import { Dialog, DialogContent } from '../ui/dialog.js';
import { Button, IconButton } from '../ui/button.js';
import { Input } from '../ui/field.js';
import { InlineAlert } from '../ui/alert.js';
import { NumberInput, Select, SettingField, Switch } from '../ui/control.js';
import { Spinner } from '../ui/feedback.js';
import { PROVIDERS, THINKING_OPTIONS, providerOf } from '../../lib/providers.js';
import { draftFromModel, emptyModelDraft, firstError, validateModelDraft } from '../../lib/modelDraft.js';
import { cn } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';

/**
 * «افزودن مدل» / «ویرایش مدل».
 *
 * Everything the user typed stays in this dialog's own state: a failed
 * validation or a failed connection test never clears a field and never closes
 * the dialog — only an explicit «لغو» or a successful save does.
 */
export function AddModelDialog() {
    const { state, actions, adapter } = useYAgent();
    const open = state.modelDialog.open;
    const editingId = state.modelDialog.editingId;
    const [draft, setDraft] = stateCell(() => emptyModelDraft());
    const [errors, setErrors] = stateCell({});
    const [notice, setNotice] = stateCell(null);
    const [testResult, setTestResult] = stateCell(null);
    const [showKey, setShowKey] = stateCell(false);
    const [advancedOpen, setAdvancedOpen] = stateCell(false);
    const [discovered, setDiscovered] = stateCell([]);
    const [modelSearch, setModelSearch] = stateCell('');
    const [discovering, setDiscovering] = stateCell(false);
    const [testing, setTesting] = stateCell(false);
    const [saving, setSaving] = stateCell(false);

    // A fresh draft each time the dialog opens (or switches to another model).
    afterRender(() => {
        if (!open)
            return;
        const model = editingId ? state.models.find((item) => item.id === editingId) : null;
        setDraft(model ? draftFromModel(model) : emptyModelDraft());
        setErrors({});
        setNotice(null);
        setTestResult(null);
        setDiscovered([]);
        setModelSearch('');
        setShowKey(false);
        setAdvancedOpen(Boolean(model?.advanced));
    }, [open, editingId]);

    const providers = state.providers.length ? state.providers : PROVIDERS;
    const provider = providerOf(draft.provider);
    const needsBaseUrl = provider?.needsBaseUrl !== false;
    const supportsTools = typeof adapter.addModel === 'function';

    const visibleModels = memoValue(() => {
        const query = modelSearch.trim().toLowerCase();
        return query ? discovered.filter((id) => id.toLowerCase().includes(query)) : discovered;
    }, [discovered, modelSearch]);

    function patch(values) {
        setDraft({ ...draft, ...values });
        const touched = Object.keys(values);
        if (touched.some((key) => errors[key])) {
            const next = { ...errors };
            touched.forEach((key) => delete next[key]);
            setErrors(next);
        }
    }

    function changeProvider(value) {
        const next = providerOf(value);
        setDraft({ ...draft, provider: value, baseUrl: next?.baseUrl ?? '', modelId: '', id: draft.id });
        setDiscovered([]);
        setTestResult(null);
        setNotice(null);
        setErrors({});
    }

    async function discover() {
        if (typeof adapter.discoverModels !== 'function') {
            setNotice({ tone: 'danger', message: 'دریافت مدل‌ها در این نسخه در دسترس نیست.' });
            return;
        }
        setDiscovering(true);
        setNotice(null);
        setTestResult(null);
        try {
            const result = await adapter.discoverModels({ provider: draft.provider, apiKey: draft.apiKey, baseUrl: draft.baseUrl });
            setDiscovered(result?.models ?? []);
            if (!(result?.models ?? []).length)
                setNotice({ tone: 'info', message: 'این حساب مدلی برای نمایش برنگرداند.' });
        }
        catch (error) {
            setNotice({ tone: 'danger', message: error.message || 'دریافت مدل‌ها انجام نشد.' });
        }
        finally {
            setDiscovering(false);
        }
    }

    async function test() {
        const found = validateModelDraft(draft);
        setErrors(found);
        if (Object.keys(found).length) {
            setTestResult(null);
            setNotice({ tone: 'danger', message: firstError(found) });
            return;
        }
        if (typeof adapter.testConnection !== 'function') {
            setNotice({ tone: 'danger', message: 'تست اتصال در این نسخه در دسترس نیست.' });
            return;
        }
        setTesting(true);
        setNotice(null);
        setTestResult(null);
        try {
            const result = await adapter.testConnection(draft);
            setTestResult({ tone: 'success', message: result?.message || 'اتصال برقرار شد.' });
        }
        catch (error) {
            setTestResult({ tone: 'danger', message: error.message || 'اتصال برقرار نشد.' });
        }
        finally {
            setTesting(false);
        }
    }

    async function save() {
        const found = validateModelDraft(draft);
        setErrors(found);
        if (Object.keys(found).length) {
            setNotice({ tone: 'danger', message: 'چند مورد نیاز به اصلاح دارد؛ مقادیر واردشده حفظ شده است.' });
            return;
        }
        if (!supportsTools) {
            setNotice({ tone: 'danger', message: 'ذخیرهٔ مدل هنوز به سرویس وصل نشده است.' });
            return;
        }
        setSaving(true);
        setNotice(null);
        try {
            if (editingId)
                await adapter.updateModel(editingId, draft);
            else
                await adapter.addModel(draft);
            await actions.refreshModels();
            actions.closeModelDialog();
        }
        catch (error) {
            setNotice({ tone: 'danger', message: error.message || 'ذخیرهٔ مدل انجام نشد.' });
        }
        finally {
            setSaving(false);
        }
    }

    const title = editingId ? 'ویرایش مدل' : 'افزودن مدل';
    const description = 'مدل ذخیره‌شده در فهرست انتخاب مدل گفتگو دیده می‌شود. کلید API فقط روی سرور ذخیره می‌شود.';
    const footer = el(Fragment, null,
        el(Button, { variant: "ghost", size: "sm", onClick: () => actions.closeModelDialog() }, "لغو"),
        el(Button, { variant: "primary", size: "sm", disabled: saving, onClick: () => void save() },
            saving ? el(Spinner, { size: 14 }) : null,
            saving ? 'در حال ذخیره…' : 'ذخیرهٔ مدل'));

    return (el(Dialog, { open: open, onOpenChange: (value) => { if (!value)
            actions.closeModelDialog(); } }, open ? (el(DialogContent, { title: title, description: description, className: "yagent-model-dialog", footer: footer },
        el("div", { className: "yagent-form" },
            notice ? (el(InlineAlert, { tone: notice.tone, className: "yagent-form-notice" }, notice.message)) : null,
            el(SettingField, { label: "نام نمایشی", description: "نامی که در فهرست مدل‌ها و کادر گفتگو دیده می‌شود.", control: el(Input, { value: draft.name, placeholder: "مثلاً Gemini سریع", onChange: (event) => patch({ name: event.target.value }) }), hint: errors.name ? undefined : null }),
            errors.name ? el("p", { className: "yagent-field-error" }, errors.name) : null,
            el(SettingField, { label: "سرویس", description: "ارائه‌دهندهٔ مدل؛ نشانی پیش‌فرض هر سرویس خودکار پر می‌شود.", control: el(Select, { value: draft.provider, label: "سرویس", onChange: changeProvider, options: providers.map((item) => ({ value: item.value, label: `${item.label} – ${item.hint}` })) }) }),
            errors.provider ? el("p", { className: "yagent-field-error" }, errors.provider) : null,
            el(SettingField, { label: "کلید API", description: "کلید فقط برای همان سرویس استفاده می‌شود و در مرورگر ذخیره نمی‌شود.", control: el("div", { className: "yagent-secret" },
                    el(Input, { type: showKey ? 'text' : 'password', autoComplete: "off", spellCheck: false, className: "yagent-secret-input", value: draft.apiKey, placeholder: draft.keepExistingKey ? 'برای تغییر، کلید تازه را وارد کنید' : 'کلید API', onChange: (event) => patch({ apiKey: event.target.value }) }),
                    el(IconButton, { label: showKey ? 'پنهان‌کردن کلید' : 'نمایش کلید', size: "sm", className: "yagent-secret-toggle", onClick: () => setShowKey(!showKey) }, showKey ? el(EyeOff, { className: "h-4 w-4" }) : el(Eye, { className: "h-4 w-4" }))), hint: draft.keepExistingKey ? 'کلید فعلی روی سرور نگه داشته می‌شود.' : null }),
            errors.apiKey ? el("p", { className: "yagent-field-error" }, errors.apiKey) : null,
            needsBaseUrl ? (el(Fragment, null,
                el(SettingField, { label: "Base URL", description: "نشانی سازگار با OpenAI برای این سرویس.", control: el(Input, { className: "yagent-ltr", dir: "ltr", value: draft.baseUrl, placeholder: "https://api.example.ir/v1", onChange: (event) => patch({ baseUrl: event.target.value }) }) }),
                errors.baseUrl ? el("p", { className: "yagent-field-error" }, errors.baseUrl) : null)) : null,
            el(SettingField, { label: "شناسهٔ دقیق مدل", description: "شناسه‌ای که سرویس انتظار دارد؛ می‌توانید دستی بنویسید یا از فهرست انتخاب کنید.", control: el("div", { className: "yagent-row" },
                    el(Input, { className: "yagent-ltr min-w-0 flex-1", dir: "ltr", value: draft.modelId, placeholder: "gemini-3.5-flash", onChange: (event) => patch({ modelId: event.target.value }) }),
                    el(Button, { size: "sm", variant: "secondary", disabled: discovering, onClick: () => void discover() },
                        discovering ? el(Spinner, { size: 14 }) : el(RefreshCw, { className: "h-3.5 w-3.5" }),
                        discovering ? 'در حال دریافت…' : 'دریافت مدل‌ها')) }),
            errors.modelId ? el("p", { className: "yagent-field-error" }, errors.modelId) : null,
            discovered.length > 0 || discovering ? (el("div", { className: "yagent-model-discovery" },
                el("div", { className: "yagent-search" },
                    el(Search, { className: "yagent-search-icon" }),
                    el(Input, { className: "yagent-search-input", value: modelSearch, placeholder: "جست‌وجو در مدل‌ها", "aria-label": "جست‌وجو در مدل‌های سرویس", onChange: (event) => setModelSearch(event.target.value) })),
                el("div", { role: "listbox", "aria-label": "مدل‌های سرویس", className: "yagent-listbox" }, visibleModels.length
                    ? visibleModels.map((id) => (el("button", { key: id, type: "button", role: "option", "aria-selected": draft.modelId === id, className: cn('yagent-option', draft.modelId === id && 'is-selected'), onClick: () => patch({ modelId: id }) },
                        el("span", { className: "yagent-ltr min-w-0 flex-1 truncate" }, id),
                        draft.modelId === id ? el(Check, { className: "h-3.5 w-3.5 text-y-accent" }) : null)))
                    : el("p", { className: "yagent-empty" }, 'مدلی با این نام پیدا نشد.')))) : null,
            el("div", { className: "yagent-test-row" },
                el(Button, { size: "sm", variant: "secondary", disabled: testing, onClick: () => void test() },
                    testing ? el(Spinner, { size: 14 }) : null,
                    testing ? 'در حال تست اتصال…' : 'تست اتصال'),
                testResult ? el(InlineAlert, { tone: testResult.tone, className: "min-w-0 flex-1" }, testResult.message) : el("p", { className: "yagent-hint-text" }, 'پیش از ذخیره، اتصال و شناسهٔ مدل بررسی می‌شود.')),
            el("div", { className: "yagent-advanced" },
                el("button", { type: "button", "aria-expanded": advancedOpen, onClick: () => setAdvancedOpen(!advancedOpen), className: "yagent-advanced-toggle" },
                    el(ChevronDown, { className: cn('h-4 w-4 transition-transform duration-y', advancedOpen && 'rotate-180') }),
                    el("span", { className: "min-w-0 flex-1 text-start" }, 'تنظیمات تخصصی مدل'),
                    el("span", { className: "yagent-hint-text" }, advancedOpen ? 'بستن' : 'بازکردن')),
                advancedOpen ? (el("div", { className: "yagent-advanced-body" },
                    el(SettingField, { label: "زمان انتظار پاسخ", description: "بیشترین زمان انتظار برای هر درخواست (میلی‌ثانیه).", control: el(NumberInput, { value: draft.timeoutMs, min: 5000, step: 1000, label: "زمان انتظار", onChange: (value) => patch({ timeoutMs: value }) }) }),
                    el(SettingField, { label: "سقف توکن خروجی", description: "بیشترین حجم پاسخ هر فراخوانی.", control: el(NumberInput, { value: draft.outputTokens, min: 256, step: 256, label: "سقف توکن خروجی", onChange: (value) => patch({ outputTokens: value }) }) }),
                    el(SettingField, { label: "گنجایش زمینه", description: "بیشترین حجم متن ورودی که مدل می‌پذیرد.", control: el(NumberInput, { value: draft.contextTokens, min: 4096, step: 1024, label: "گنجایش زمینه", onChange: (value) => patch({ contextTokens: value }) }) }),
                    el(SettingField, { label: "پشتیبانی ابزار", description: "با روشن‌بودن این گزینه، حالت «اجرای ابزار» برای این مدل فعال می‌شود.", control: el(Switch, { checked: draft.supportsTools, label: "پشتیبانی ابزار", onChange: (value) => patch({ supportsTools: value }) }) }),
                    el(SettingField, { label: "حالت تفکر", description: "میزان زمان و توکن اختصاص‌یافته به تحلیل پیش از پاسخ.", control: el(Select, { value: draft.thinking, label: "حالت تفکر", onChange: (value) => patch({ thinking: value }), options: THINKING_OPTIONS }) }),
                    errors.timeoutMs || errors.outputTokens || errors.contextTokens ? el("p", { className: "yagent-field-error" }, errors.timeoutMs || errors.outputTokens || errors.contextTokens) : null)) : null)))) : null));
}
