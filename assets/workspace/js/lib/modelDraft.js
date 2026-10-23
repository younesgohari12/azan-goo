import { providerOf, PROVIDERS } from './providers.js';

/**
 * The model form contract: one place that knows which fields a saved model
 * needs, shared by the dialog and the adapters so a draft is validated the same
 * way before and after the request.
 */
export const DEFAULT_ADVANCED = {
  timeoutMs: 45000,
  outputTokens: 4096,
  contextTokens: 128000,
  supportsTools: true,
  thinking: 'auto',
};

export function emptyModelDraft(overrides = {}) {
  return {
    id: null,
    name: '',
    provider: PROVIDERS[0].value,
    apiKey: '',
    baseUrl: PROVIDERS[0].baseUrl,
    modelId: '',
    keepExistingKey: false,
    ...DEFAULT_ADVANCED,
    ...overrides,
  };
}

export function draftFromModel(model) {
  const provider = providerOf(model.provider);
  return emptyModelDraft({
    id: model.id,
    name: model.displayName || model.name,
    provider: model.provider,
    baseUrl: provider?.baseUrl ?? '',
    modelId: model.name,
    // The stored key never leaves the server, so editing keeps it unless the
    // user types a new one.
    keepExistingKey: true,
    supportsTools: Boolean(model.supportsTools),
    ...(model.advanced || {}),
  });
}

/** Field-level errors for a draft; an empty object means the draft is valid. */
export function validateModelDraft(draft) {
  const errors = {};
  if (!String(draft.name || '').trim())
    errors.name = 'نام نمایشی مدل را وارد کنید.';
  if (!draft.provider)
    errors.provider = 'سرویس را انتخاب کنید.';
  if (!String(draft.modelId || '').trim())
    errors.modelId = 'شناسهٔ دقیق مدل را وارد کنید یا از «دریافت مدل‌ها» انتخاب کنید.';
  const provider = providerOf(draft.provider);
  if (provider?.needsBaseUrl && !String(draft.baseUrl || '').trim())
    errors.baseUrl = 'نشانی Base URL برای این سرویس لازم است.';
  if (String(draft.baseUrl || '').trim() && !/^https?:\/\//.test(String(draft.baseUrl).trim()))
    errors.baseUrl = 'نشانی باید با http:// یا https:// شروع شود.';
  const key = String(draft.apiKey || '').trim();
  if (!key && !draft.keepExistingKey)
    errors.apiKey = 'کلید API را وارد کنید.';
  else if (key && key.length < 12)
    errors.apiKey = 'کلید API کوتاه‌تر از حد معمول است (حداقل ۱۲ نویسه).';
  if (!(Number(draft.timeoutMs) > 0))
    errors.timeoutMs = 'زمان انتظار باید یک عدد مثبت باشد.';
  if (!(Number(draft.outputTokens) > 0))
    errors.outputTokens = 'سقف توکن خروجی باید یک عدد مثبت باشد.';
  if (!(Number(draft.contextTokens) > 0))
    errors.contextTokens = 'گنجایش زمینه باید یک عدد مثبت باشد.';
  return errors;
}

export const firstError = (errors) => Object.values(errors)[0];
