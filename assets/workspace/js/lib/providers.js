/**
 * Provider catalogue shared by the model manager UI and the adapters.
 *
 * Mirrors the services the plugin supports (AvalAI, GapGPT, ArvanCloud, Gemini
 * and any OpenAI-compatible endpoint) so an adapter can hand the interface its
 * own list, while the standalone demo keeps working on its own.
 */
export const PROVIDERS = [
  { value: 'avalai', label: 'AvalAI', hint: 'اول ای‌آی', baseUrl: 'https://api.avalai.ir/v1', needsBaseUrl: true },
  { value: 'gapgpt', label: 'GapGPT', hint: 'گپ جی‌پی‌تی', baseUrl: 'https://api.gapgpt.app/v1', needsBaseUrl: true },
  { value: 'arvan', label: 'ArvanCloud', hint: 'ابر آروان', baseUrl: 'https://napi.arvancloud.ir/v1', needsBaseUrl: true },
  { value: 'gemini', label: 'Gemini', hint: 'گوگل ای‌آی استودیو', baseUrl: '', needsBaseUrl: false },
  { value: 'custom', label: 'Custom OpenAI-compatible', hint: 'سرویس سازگار با OpenAI', baseUrl: '', needsBaseUrl: true },
];

export const providerOf = (value) => PROVIDERS.find((provider) => provider.value === value);

/** Model ids the discovery button offers, per provider (simulated catalogue). */
export const DISCOVERABLE_MODELS = {
  avalai: ['gemini-3.5-flash', 'gemini-3.5-pro', 'gpt-4o-mini', 'gpt-4.1', 'claude-sonnet-4'],
  gapgpt: ['gpt-4o-mini', 'gpt-4.1-mini', 'gemini-2.0-flash'],
  arvan: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gpt-4o-mini'],
  gemini: ['gemini-3.5-flash', 'gemini-3.5-pro', 'gemini-2.5-flash'],
  custom: ['local-model', 'qwen2.5-72b-instruct', 'llama-3.3-70b'],
};

export const THINKING_OPTIONS = [
  { value: 'auto', label: 'خودکار' },
  { value: 'off', label: 'خاموش' },
  { value: 'low', label: 'کوتاه' },
  { value: 'high', label: 'گسترده' },
];
