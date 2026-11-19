/* Reusable UI primitives: icons, toasts, modals, drawers, menus, states. */

import { escapeHtml, uid, gradientFor, initials } from './utils.js';

const overlayRoot = () => document.getElementById('overlay-root');
const toastRoot = () => document.getElementById('toast-stack');

export function icon(name, cls = '') {
  return `<i data-lucide="${name}"${cls ? ` class="${cls}"` : ''}></i>`;
}

export function refreshIcons(root = document) {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 }, root });
  }
}

/* ----------------------------------------------------------------- toasts */
export function toast({ title, text = '', tone = 'success', duration = 4200 } = {}) {
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  const iconName = { success: 'check', error: 'alert-circle', warning: 'alert-triangle', info: 'info' }[tone] || 'check';
  el.innerHTML = `
    <div class="toast__icon">${icon(iconName)}</div>
    <div class="u-grow">
      <div class="toast__title">${escapeHtml(title)}</div>
      ${text ? `<div class="toast__text">${escapeHtml(text)}</div>` : ''}
    </div>
    <button class="toast__close" aria-label="بستن">${icon('x')}</button>
  `;
  toastRoot().appendChild(el);
  refreshIcons(el);
  const close = () => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 200);
  };
  el.querySelector('.toast__close').addEventListener('click', close);
  if (duration) setTimeout(close, duration);
  return { close };
}

/* ------------------------------------------------------------------ modal */
let modalStack = [];

function trapFocus(container) {
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    const nodes = Array.from(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

export function openModal({
  title, desc = '', iconName = '', iconTone = '', body = '', footer = '',
  size = '', onMount, closeOnBackdrop = true, onClose,
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.innerHTML = `
    <div class="modal ${size ? `modal--${size}` : ''}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal__head">
        ${iconName ? `<div class="modal__icon ${iconTone ? `is-${iconTone}` : ''}">${icon(iconName)}</div>` : ''}
        <div class="u-grow">
          <div class="modal__title">${escapeHtml(title)}</div>
          ${desc ? `<div class="modal__desc">${desc}</div>` : ''}
        </div>
        <button class="icon-btn modal__close" aria-label="بستن">${icon('x')}</button>
      </div>
      <div class="modal__body">${body}</div>
      <div class="modal__foot" ${footer ? '' : 'style="display:none"'}>${footer}</div>
    </div>
  `;
  overlayRoot().appendChild(wrap);
  refreshIcons(wrap);

  const modal = wrap.querySelector('.modal');
  const untrap = trapFocus(modal);
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    untrap();
    modalStack = modalStack.filter((m) => m !== handle);
    wrap.style.animation = 'fade-in 120ms reverse both';
    setTimeout(() => wrap.remove(), 120);
    onClose?.();
  };

  wrap.querySelector('.modal__close')?.addEventListener('click', close);
  if (closeOnBackdrop) {
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  }

  const footerEl = wrap.querySelector('.modal__foot');
  const handle = {
    root: wrap,
    body: wrap.querySelector('.modal__body'),
    footer: footerEl,
    setFooter: (html) => {
      if (!footerEl) return;
      footerEl.innerHTML = html;
      footerEl.style.display = html ? 'flex' : 'none';
    },
    close,
    setBusy: (busy) => modal.style.pointerEvents = busy ? 'none' : '',
  };
  modalStack.push(handle);
  onMount?.(handle);
  setTimeout(() => {
    const focusable = modal.querySelector('input, select, textarea, button.btn--primary');
    focusable?.focus();
  }, 40);
  return handle;
}

export function closeTopOverlay() {
  const top = modalStack[modalStack.length - 1];
  if (top) { top.close(); return true; }
  return false;
}

/** Remove every open overlay — used when the route changes. */
export function closeAllOverlays() {
  modalStack.forEach((handle) => {
    try { handle.close(); } catch (e) { /* already closed */ }
  });
  modalStack = [];
  document.querySelectorAll('#overlay-root .overlay, .palette, .menu').forEach((el) => el.remove());
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTopOverlay();
});

/* --------------------------------------------------------------- popover */
export function openPopover(anchor, html, { width = 320, align = 'end' } = {}) {
  document.querySelectorAll('.menu').forEach((m) => m.remove());
  const panel = document.createElement('div');
  panel.className = 'menu';
  panel.style.minWidth = `${width}px`;
  panel.innerHTML = html;
  document.body.appendChild(panel);
  refreshIcons(panel);

  const rect = anchor.getBoundingClientRect();
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  let left = align === 'end' ? rect.left + rect.width - pw : rect.left;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  let top = rect.bottom + 6;
  if (top + ph > window.innerHeight - 8) top = Math.max(8, rect.top - ph - 6);
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;

  const destroy = () => {
    panel.remove();
    document.removeEventListener('mousedown', onDoc);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll, true);
  };
  const onDoc = (e) => { if (!panel.contains(e.target) && !anchor.contains(e.target)) destroy(); };
  const onKey = (e) => { if (e.key === 'Escape') destroy(); };
  const onScroll = () => destroy();
  setTimeout(() => {
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
  }, 0);
  return { panel, close: destroy };
}

/* ---------------------------------------------------------------- confirm */
export function confirmDialog({
  title, desc = '', confirmText = 'تأیید', cancelText = 'انصراف',
  tone = 'primary', iconName = 'alert-triangle', requireText = null, details = '',
} = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const body = `
      ${desc ? `<p class="t-muted" style="font-size:12.3px;line-height:1.8">${desc}</p>` : ''}
      ${details ? `<div class="alert alert--${tone === 'danger' ? 'danger' : 'info'}" style="margin-top:12px">${icon('info')}<div class="alert__text">${details}</div></div>` : ''}
      ${requireText ? `
        <div class="field" style="margin-top:14px">
          <label class="field__label">برای تأیید عبارت <code>${escapeHtml(requireText)}</code> را وارد کنید</label>
          <input class="input" data-confirm-input autocomplete="off" spellcheck="false" />
        </div>` : ''}
    `;
    const footer = `
      <div class="spacer"></div>
      <button class="btn btn--secondary" data-cancel>${escapeHtml(cancelText)}</button>
      <button class="btn btn--${tone}" data-confirm ${requireText ? 'disabled' : ''}>${escapeHtml(confirmText)}</button>
    `;
    const modal = openModal({
      title, desc: '', body, footer, size: 'sm',
      iconName, iconTone: tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : '',
      onMount: (h) => {
        const input = h.body.querySelector('[data-confirm-input]');
        const ok = h.root.querySelector('[data-confirm]');
        input?.addEventListener('input', () => {
          ok.disabled = input.value.trim() !== requireText;
        });
        h.root.querySelector('[data-cancel]').addEventListener('click', () => { finish(false); h.close(); });
        ok.addEventListener('click', () => { finish(true); h.close(); });
        input?.focus();
      },
      onClose: () => finish(false),
    });
    return modal;
  });
}

/* ----------------------------------------------------------------- drawer */
export function openDrawer({ title, sub = '', body = '', footer = '', size = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.style.padding = '0';
  wrap.style.justifyContent = 'flex-start';
  wrap.innerHTML = `
    <div class="drawer ${size ? `drawer--${size}` : ''}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="drawer__head">
        <div class="u-grow">
          <div class="drawer__title">${title}</div>
          ${sub ? `<div class="drawer__sub">${sub}</div>` : ''}
        </div>
        <button class="icon-btn drawer__close" aria-label="بستن">${icon('x')}</button>
      </div>
      <div class="drawer__body">${body}</div>
      ${footer ? `<div class="drawer__foot">${footer}</div>` : ''}
    </div>
  `;
  overlayRoot().appendChild(wrap);
  refreshIcons(wrap);

  const drawer = wrap.querySelector('.drawer');
  const untrap = trapFocus(drawer);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    untrap();
    modalStack = modalStack.filter((m) => m !== handle);
    wrap.style.animation = 'fade-in 120ms reverse both';
    setTimeout(() => wrap.remove(), 120);
  };
  wrap.querySelector('.drawer__close').addEventListener('click', close);
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  const handle = { root: wrap, body: wrap.querySelector('.drawer__body'), footer: wrap.querySelector('.drawer__foot'), close };
  modalStack.push(handle);
  return handle;
}

/* ------------------------------------------------------------------- menu */
export function openMenu(anchor, items, { align = 'end', width } = {}) {
  document.querySelectorAll('.menu').forEach((m) => m.remove());
  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.setAttribute('role', 'menu');
  if (width) menu.style.minWidth = `${width}px`;
  menu.innerHTML = items.map((item, idx) => {
    if (item.divider) return '<div class="menu__divider"></div>';
    if (item.label && !item.onClick) return `<div class="menu__label">${escapeHtml(item.label)}</div>`;
    return `
      <button class="menu__item ${item.tone === 'danger' ? 'is-danger' : ''} ${item.active ? 'is-active' : ''}" data-idx="${idx}" role="menuitem">
        ${item.iconName ? icon(item.iconName) : ''}
        <span class="u-grow" style="text-align:start">${escapeHtml(item.text)}</span>
        ${item.active ? `<span class="menu__check">${icon('check')}</span>` : ''}
        ${item.hint ? `<span class="menu__item__hint">${escapeHtml(item.hint)}</span>` : ''}
      </button>`;
  }).join('');
  document.body.appendChild(menu);
  refreshIcons(menu);

  const rect = anchor.getBoundingClientRect();
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;
  let left = align === 'end' ? rect.left + rect.width - mw : rect.left;
  left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
  let top = rect.bottom + 6;
  if (top + mh > window.innerHeight - 8) top = Math.max(8, rect.top - mh - 6);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  const onDoc = (e) => {
    if (!menu.contains(e.target) && !anchor.contains(e.target)) destroy();
  };
  const onScroll = () => destroy();
  const onKey = (e) => { if (e.key === 'Escape') destroy(); };
  function destroy() {
    menu.remove();
    document.removeEventListener('mousedown', onDoc);
    window.removeEventListener('scroll', onScroll, true);
    document.removeEventListener('keydown', onKey);
  }
  setTimeout(() => {
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('keydown', onKey);
  }, 0);

  menu.querySelectorAll('.menu__item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items[Number(btn.dataset.idx)];
      destroy();
      item.onClick?.();
    });
  });
  return { close: destroy };
}

/* ------------------------------------------------------------------ states */
export function skeletonRows(cols = 6, rows = 8) {
  return Array.from({ length: rows }).map(() => `
    <tr>
      ${Array.from({ length: cols }).map((_, i) => `
        <td>${i === 0
          ? `<div class="u-row gap-8"><div class="skeleton sk-circle" style="width:32px;height:32px"></div><div class="u-grow stack-4"><div class="skeleton sk-line" style="width:${50 + (i * 7) % 30}%"></div><div class="skeleton sk-line sk-line--sm" style="width:30%"></div></div></div>`
          : `<div class="skeleton sk-line" style="width:${40 + (i * 13) % 50}%"></div>`}</td>
      `).join('')}
    </tr>`).join('');
}

export function emptyState({ iconName = 'inbox', title, text = '', action = '' } = {}) {
  return `
    <div class="empty-state">
      <div class="empty-state__icon">${icon(iconName)}</div>
      <div class="empty-state__title">${escapeHtml(title)}</div>
      ${text ? `<div class="empty-state__text">${escapeHtml(text)}</div>` : ''}
      ${action ? `<div class="empty-state__actions">${action}</div>` : ''}
    </div>
  `;
}

export function errorState({ title = 'خطا در دریافت اطلاعات', text = '', retryLabel = 'تلاش مجدد' } = {}) {
  return `
    <div class="empty-state">
      <div class="empty-state__icon" style="background:var(--danger-soft);border-color:var(--danger-border);color:var(--danger)">${icon('cloud-off')}</div>
      <div class="empty-state__title">${escapeHtml(title)}</div>
      <div class="empty-state__text">${escapeHtml(text || 'ارتباط با سرور برقرار نشد. اتصال شبکه یا دسترسی API را بررسی کنید.')}</div>
      <div class="empty-state__actions">
        <button class="btn btn--secondary btn--sm" data-retry>${icon('refresh-cw')}<span>${escapeHtml(retryLabel)}</span></button>
      </div>
    </div>
  `;
}

export function permissionState({ cap = 'این عملیات' } = {}) {
  return `
    <div class="empty-state">
      <div class="empty-state__icon" style="background:var(--warning-soft);border-color:var(--warning-border);color:var(--warning)">${icon('shield-off')}</div>
      <div class="empty-state__title">دسترسی کافی ندارید</div>
      <div class="empty-state__text">نقش فعلی شما اجازه ${escapeHtml(cap)} را ندارد. برای تغییر دسترسی با مدیر کل تماس بگیرید یا نقش نمایشی را از منوی حساب تغییر دهید.</div>
    </div>
  `;
}

/* ------------------------------------------------------------------ form */
export function readForm(form) {
  const data = {};
  Array.from(form.elements).forEach((el) => {
    if (!el.name || el.disabled) return;
    if (el.type === 'checkbox') data[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
    else data[el.name] = el.value;
  });
  return data;
}

export function setBusy(button, busy, label = null) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.classList.add('is-loading');
    button.disabled = true;
    if (label) button.textContent = label;
  } else {
    button.classList.remove('is-loading');
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title: 'کپی شد', tone: 'success', duration: 2200 });
  } catch (e) {
    toast({ title: 'کپی ممکن نشد', text: 'دسترسی کلیپ‌بورد در این محیط فعال نیست.', tone: 'warning' });
  }
}

export function toneFor(kind) {
  const map = {
    success: 'success', synced: 'success', completed: 'success', delivered: 'success', connected: 'success',
    active: 'success', mapped: 'success', imported: 'success', verified: 'success', ready: 'success',
    pending: 'warning', partial: 'warning', ambiguous: 'warning', stale: 'warning', scheduled: 'warning',
    running: 'info', new: 'info', processing: 'info', shipped: 'info', draft: 'neutral',
    failed: 'danger', error: 'danger', conflict: 'danger', canceled: 'neutral', unmapped: 'neutral',
    inactive: 'neutral', returned: 'warning', out_of_stock: 'danger', paused: 'neutral', sent: 'success',
  };
  return map[kind] || 'neutral';
}

const LABELS = {
  active: 'فعال', inactive: 'غیرفعال', out_of_stock: 'ناموجود',
  mapped: 'نگاشت‌شده', unmapped: 'بدون نگاشت', ambiguous: 'مبهم', conflict: 'تداخل',
  synced: 'همگام', pending: 'در انتظار', failed: 'ناموفق', stale: 'قدیمی',
  new: 'جدید', processing: 'در حال پردازش', shipped: 'ارسال‌شده', delivered: 'تحویل‌شده',
  canceled: 'لغوشده', returned: 'مرجوعی', imported: 'وارد شده',
  completed: 'کامل', partial: 'ناقص', running: 'در حال اجرا', 'job pending': 'در صف',
  connected: 'متصل', error: 'خطا', limited: 'محدود', draft: 'پیش‌نویس', scheduled: 'زمان‌بندی‌شده',
  sent: 'ارسال‌شده', verified: 'تأییدشده', ready: 'آماده', paused: 'متوقف',
};

export function label(kind) {
  return LABELS[kind] || kind;
}

export function badge(kind, { text = null, dot = true, iconName = null } = {}) {
  const tone = toneFor(kind);
  return `<span class="badge badge--${tone} ${dot && !iconName ? 'badge--dot' : ''}">
    ${iconName ? icon(iconName) : (dot ? '<span class="badge__dot"></span>' : '')}
    ${escapeHtml(text ?? label(kind))}
  </span>`;
}

export function thumb(name, { size = '' } = {}) {
  return `<div class="thumb ${size}" style="background:${gradientFor(name)}">${escapeHtml(initials(name))}</div>`;
}

export function debounceInput(input, fn, wait = 260) {
  let t;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => fn(input.value), wait);
  });
}

export function pageNumbers(current, total) {
  const pages = [];
  const push = (p) => { if (!pages.includes(p) && p >= 1 && p <= total) pages.push(p); };
  push(1);
  for (let i = current - 1; i <= current + 1; i += 1) push(i);
  push(total);
  pages.sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export function mountPortal(content) {
  const host = document.createElement('div');
  host.innerHTML = content;
  document.body.appendChild(host);
  return host;
}

export { uid };
