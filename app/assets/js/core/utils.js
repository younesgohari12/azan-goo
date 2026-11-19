/* Small DOM / formatting helpers shared by every view. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const nf = new Intl.NumberFormat('fa-IR');
const nfLatin = new Intl.NumberFormat('en-US');

/** Persian digits, grouped. */
export function fa(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return nf.format(n);
}

/** Latin digits with grouping — used for ids, SKUs and technical values. */
export function en(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return nfLatin.format(n);
}

/**
 * Money is handled as a decimal string end to end (never parsed for arithmetic
 * outside dedicated helpers). `null` means "unknown", never zero.
 */
export function money(value, { currency = 'تومان', placeholder = 'نامشخص' } = {}) {
  if (value === null || value === undefined || value === '') return placeholder;
  const n = Number(value);
  if (!Number.isFinite(n)) return placeholder;
  return `${fa(n)} <small>${currency}</small>`;
}

export function plainMoney(value) {
  if (value === null || value === undefined || value === '') return 'نامشخص';
  const n = Number(value);
  return Number.isFinite(n) ? fa(n) : 'نامشخص';
}

export function percent(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${nf.format(Number(n.toFixed(digits)))}٪`;
}

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

export function formatDate(iso, { time = false } = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return (time ? dateTimeFmt : dateFmt).format(d);
}

export function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : timeFmt.format(d);
}

export function relTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return '—';
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'همین حالا';
  if (min < 60) return `${fa(min)} دقیقه پیش`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${fa(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${fa(days)} روز پیش`;
  return formatDate(iso);
}

export function duration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const s = Math.max(0, Math.round(Number(seconds)));
  if (s < 60) return `${fa(s)} ثانیه`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${fa(m)} دقیقه و ${fa(rest)} ثانیه` : `${fa(m)} دقیقه`;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function debounce(fn, wait = 260) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] || '').join('');
}

const AVATAR_COLORS = [
  ['#7C3AED', '#A78BFA'],
  ['#0F766E', '#34D399'],
  ['#B45309', '#FBBF24'],
  ['#1D4ED8', '#60A5FA'],
  ['#BE123C', '#FB7185'],
  ['#4338CA', '#818CF8'],
  ['#047857', '#6EE7B7'],
  ['#7E22CE', '#D8B4FE'],
];

export function gradientFor(seed) {
  let h = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 9973;
  const [a, b] = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

/** Parse a numeric input that may contain Persian digits and separators. */
export function parseNumber(value) {
  if (value === null || value === undefined) return NaN;
  const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
  const normalized = String(value)
    .replace(/[۰-۹٠-٩]/g, (d) => map[d])
    .replace(/[,٬\s]/g, '')
    .replace(/٫/g, '.');
  return normalized === '' ? NaN : Number(normalized);
}

export function deburr(str) {
  return String(str || '')
    .replace(/[ىي]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .toLowerCase();
}

export function matches(query, ...fields) {
  const q = deburr(query).trim();
  if (!q) return true;
  return fields.some((f) => deburr(f).includes(q));
}

export function statusTone(kind) {
  const map = {
    active: 'success', synced: 'success', completed: 'success', delivered: 'success',
    mapped: 'success', imported: 'success', connected: 'success', healthy: 'success',
    pending: 'warning', running: 'info', partial: 'warning', ambiguous: 'warning',
    stale: 'warning', conflict: 'danger', failed: 'danger', canceled: 'neutral',
    out_of_stock: 'danger', unmapped: 'neutral', inactive: 'neutral', draft: 'neutral',
    scheduled: 'info', paused: 'neutral',
  };
  return map[kind] || 'neutral';
}
