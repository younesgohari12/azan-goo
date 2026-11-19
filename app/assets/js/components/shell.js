/* Application shell: sidebar, topbar, command palette, notifications, account. */

import { NAV_GROUPS, ROUTES, navigate, parseHash, routeFor } from '../core/router.js';
import { store, ROLES, STORES } from '../core/store.js';
import {
  icon, refreshIcons, openMenu, openPopover, toast, copyText,
} from '../core/ui.js';
import { relTime, fa, escapeHtml, debounce } from '../core/utils.js';
import { api } from '../core/api.js';

const DOWNLOAD_URL = 'download/snappshop-automation-ui.zip';

function navBadges() {
  return {
    '/products': { count: store.state.issues, tone: 'danger' },
    '/jobs': { count: store.state.runningJobs, tone: '' },
    '/logs': { count: 2, tone: 'danger' },
  };
}

function sidebarMarkup() {
  const badges = navBadges();
  const groups = NAV_GROUPS.map((group) => {
    const items = ROUTES.filter((r) => r.group === group).map((route) => {
      const b = badges[route.path];
      return `
        <a class="nav-item" href="#${route.path}" data-path="${route.path}" data-tip="${route.label}">
          ${icon(route.icon)}
          <span>${route.label}</span>
          ${b && b.count ? `<span class="nav-item__count ${b.tone === 'danger' ? 'is-danger' : ''}">${fa(b.count)}</span>` : ''}
        </a>`;
    }).join('');
    return `<div class="nav-group"><div class="nav-group__label">${group}</div>${items}</div>`;
  }).join('');

  return `
    <div class="sidebar__head">
      <div class="brand">
        <div class="brand__mark">${icon('box')}</div>
        <div class="brand__text">
          <div class="brand__name">اسنپ‌شاپ اتومیشن</div>
          <div class="brand__sub">WooCommerce Connector</div>
        </div>
      </div>
      <button class="sidebar__collapse" id="sidebar-collapse" aria-label="جمع کردن منو">${icon('panel-right-close')}</button>
    </div>
    <div class="sidebar__scroll">${groups}</div>
    <div class="sidebar__foot">
      <a class="sidebar-help" href="${DOWNLOAD_URL}" download style="text-decoration:none">
        ${icon('download')}
        <div class="sidebar-help__body u-grow">
          <div class="sidebar-help__title">دانلود نسخه ZIP</div>
          <div class="sidebar-help__text">فایل مستقل HTML/CSS/JS</div>
        </div>
      </a>
    </div>`;
}

function topbarMarkup() {
  const activeStore = store.activeStore();
  return `
    <button class="topbar__burger" id="burger" aria-label="منو">${icon('menu')}</button>
    <nav class="breadcrumb" aria-label="مسیر">
      <span class="breadcrumb__root">اسنپ‌شاپ اتومیشن</span>
      ${icon('chevron-left')}
      <span id="crumb-group" class="t-muted">نمای کلی</span>
      ${icon('chevron-left')}
      <span class="breadcrumb__current" id="crumb-page">داشبورد</span>
    </nav>

    <button class="topbar__search" id="search-trigger" aria-label="جست‌وجوی سریع">
      ${icon('search')}
      <span class="u-grow" style="text-align:start">جست‌وجو یا دستور…</span>
      <kbd>Ctrl K</kbd>
    </button>

    <div class="topbar__spacer"></div>

    <div class="topbar__actions">
      <button class="store-switch" id="store-switch" aria-label="انتخاب فروشگاه">
        <span class="store-switch__dot"></span>
        <span class="store-switch__label t-muted">فروشگاه:</span>
        <span class="store-switch__name">${escapeHtml(activeStore.name)}</span>
        ${icon('chevron-down')}
      </button>

      <button class="conn-pill" id="conn-pill" title="وضعیت اتصال">
        <span class="conn-pill__dot"></span>
        <span id="conn-label">متصل</span>
      </button>

      <button class="icon-btn" id="theme-toggle" aria-label="تغییر تم" title="تغییر تم">${icon('moon')}</button>
      <button class="icon-btn" id="notif-btn" aria-label="اعلان‌ها" title="اعلان‌ها">
        ${icon('bell')}
        <span class="icon-btn__dot" id="notif-dot"></span>
      </button>
      <button class="account" id="account-btn" aria-label="حساب کاربری">
        <span class="avatar">م</span>
        <span class="account__meta">
          <span class="account__name">مدیر فروشگاه</span>
          <span class="account__role" id="account-role">${ROLES[store.state.role].label}</span>
        </span>
        ${icon('chevron-down')}
      </button>
    </div>`;
}

function updateThemeButton() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.innerHTML = icon(store.state.theme === 'dark' ? 'sun' : 'moon');
  refreshIcons(btn);
}

function updateConnectionPill() {
  const pill = document.getElementById('conn-pill');
  const label = document.getElementById('conn-label');
  if (!pill || !label) return;
  pill.classList.toggle('is-offline', !store.state.online);
  label.textContent = store.state.online ? 'متصل' : 'قطع اتصال';
  pill.title = store.state.online ? 'اسنپ‌شاپ و ووکامرس در دسترس هستند' : 'اتصال شبیه‌سازی‌شده قطع است';
}

function updateNotifDot() {
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = store.unreadCount() ? 'block' : 'none';
}

function setActiveNav(path) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.path === path);
  });
}

export function updateBreadcrumb(route) {
  const group = document.getElementById('crumb-group');
  const page = document.getElementById('crumb-page');
  if (group) group.textContent = route.group;
  if (page) page.textContent = route.label;
  document.title = `${route.label} — اسنپ‌شاپ اتومیشن`;
}

/* ----------------------------------------------------------- notifications */
function openNotifications(anchor) {
  const items = store.state.notifications;
  const body = items.map((n) => `
    <div class="feed-item" style="padding:9px 12px">
      <div class="feed-item__dot ${n.tone === 'danger' ? 'is-danger' : n.tone === 'warning' ? 'is-warning' : n.tone === 'success' ? 'is-success' : 'is-brand'}">
        ${icon(n.tone === 'danger' ? 'alert-circle' : n.tone === 'warning' ? 'alert-triangle' : n.tone === 'success' ? 'check' : 'info')}
      </div>
      <div class="u-grow">
        <div class="feed-item__text" style="font-size:12px">${escapeHtml(n.title)}${n.unread ? ' <span class="badge badge--brand" style="height:16px;font-size:9px">جدید</span>' : ''}</div>
        <div class="feed-item__time">${escapeHtml(n.text)}</div>
        <div class="feed-item__time">${relTime(n.time)}</div>
      </div>
    </div>`).join('');

  const { panel: menu, close } = openPopover(anchor, `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px 8px;border-bottom:1px solid var(--border)">
      <span style="font-size:12px;font-weight:650">اعلان‌ها</span>
      <span class="badge badge--neutral" style="height:17px">${fa(items.length)}</span>
      <button class="btn btn--link btn--sm" id="mark-read" style="margin-inline-start:auto">همه خوانده شد</button>
    </div>
    <div style="max-height:330px;overflow:auto;margin:0 -4px">${body}</div>
    <div style="border-top:1px solid var(--border);padding:6px 8px 2px">
      <button class="btn btn--ghost btn--sm btn--block" id="notif-all">مشاهده همه فعالیت‌ها</button>
    </div>`, { width: 340 });

  menu.querySelector('#mark-read').addEventListener('click', () => {
    store.markAllRead();
    updateNotifDot();
    close();
    toast({ title: 'همه اعلان‌ها خوانده شد', tone: 'success' });
  });
  menu.querySelector('#notif-all').addEventListener('click', () => {
    close();
    navigate('/reports');
  });
}

/* ----------------------------------------------------------------- account */
function openAccount(anchor) {
  const role = store.state.role;
  openMenu(anchor, [
    { label: 'حساب کاربری' },
    { text: 'مدیر فروشگاه — admin@example.com', iconName: 'user', hint: '' },
    { divider: true },
    { label: 'نقش نمایشی (برای بررسی دسترسی‌ها)' },
    ...Object.entries(ROLES).map(([key, value]) => ({
      text: value.label,
      iconName: key === role ? 'check' : 'shield',
      active: key === role,
      onClick: () => {
        store.setRole(key);
        toast({ title: `نقش به «${value.label}» تغییر کرد`, text: value.desc, tone: 'info' });
      },
    })),
    { divider: true },
    { text: 'دانلود نسخه ZIP', iconName: 'download', onClick: () => window.open(DOWNLOAD_URL, '_blank') },
    { text: 'کپی آدرس API', iconName: 'link', onClick: () => copyText('/wp-json/snappshop-automation/v1') },
    { divider: true },
    { text: 'خروج از حساب', iconName: 'log-out', tone: 'danger', onClick: () => toast({ title: 'در نسخه نمایشی خروج غیرفعال است', text: 'احراز هویت نهایی داخل وردپرس انجام می‌شود.', tone: 'warning' }) },
  ], { width: 260 });
}

function openStoreSwitch(anchor) {
  openMenu(anchor, [
    { label: 'فروشگاه اسنپ‌شاپ' },
    ...STORES.map((s) => ({
      text: `${s.name} — ${s.code}`,
      iconName: store.state.storeId === s.id ? 'check' : 'store',
      active: store.state.storeId === s.id,
      onClick: () => {
        store.setStore(s.id);
        const btn = document.querySelector('#store-switch .store-switch__name');
        if (btn) btn.textContent = s.name;
        toast({ title: `فروشگاه به «${s.name}» تغییر کرد`, text: 'داده‌های صفحه بر اساس این فروشگاه نمایش داده می‌شود.', tone: 'info' });
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    })),
    { divider: true },
    { text: 'مدیریت اتصالات', iconName: 'plug', onClick: () => navigate('/connections') },
  ], { width: 260 });
}

function openConnectionMenu(anchor) {
  const online = store.state.online;
  openMenu(anchor, [
    { label: 'وضعیت اتصال' },
    { text: 'ووکامرس: متصل', iconName: 'check' },
    { text: 'اسنپ‌شاپ: متصل', iconName: 'check' },
    { divider: true },
    {
      text: online ? 'شبیه‌سازی قطعی اتصال' : 'بازگرداندن اتصال',
      iconName: online ? 'cloud-off' : 'cloud',
      tone: online ? 'danger' : '',
      onClick: () => {
        store.setOnline(!online);
        toast({
          title: online ? 'اتصال شبیه‌سازی‌شده قطع شد' : 'اتصال برقرار شد',
          text: online ? 'صفحات حالت خطای اتصال را نشان می‌دهند.' : 'داده‌ها دوباره بارگذاری می‌شوند.',
          tone: online ? 'warning' : 'success',
        });
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    },
    { text: 'تنظیمات اتصال', iconName: 'settings', onClick: () => navigate('/connections') },
  ], { width: 240 });
}

/* ----------------------------------------------------------------- palette */
const PALETTE_ACTIONS = [
  { text: 'اجرای اسکن همگام‌سازی', iconName: 'refresh-cw', hint: 'عملیات', run: () => navigate('/sync?scan=1') },
  { text: 'ایجاد قانون اتوماسیون', iconName: 'workflow', hint: 'عملیات', run: () => navigate('/automation?new=1') },
  { text: 'خروجی CSV محصولات', iconName: 'file-down', hint: 'فایل', run: () => navigate('/data?export=csv') },
  { text: 'افزودن اتصال اسنپ‌شاپ', iconName: 'plug', hint: 'اتصال', run: () => navigate('/connections?new=1') },
  { text: 'تغییر تم روشن / تاریک', iconName: 'sun-moon', hint: 'ظاهر', run: () => store.toggleTheme() },
  { text: 'دانلود نسخه ZIP رابط کاربری', iconName: 'download', hint: 'فایل', run: () => window.open(DOWNLOAD_URL, '_blank') },
];

export function openPalette() {
  if (document.querySelector('.palette')) return;
  const wrap = document.createElement('div');
  wrap.className = 'palette';
  wrap.innerHTML = `
    <div class="palette__box" role="dialog" aria-modal="true" aria-label="جست‌وجوی سریع">
      <div class="palette__input-row">
        ${icon('search')}
        <input class="palette__input" placeholder="جست‌وجوی صفحه، عملیات یا تنظیمات…" autocomplete="off" />
        <kbd class="kbd">Esc</kbd>
      </div>
      <div class="palette__list"></div>
      <div class="palette__foot">
        <span>${icon('arrow-up')}<kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> حرکت</span>
        <span><kbd class="kbd">Enter</kbd> انتخاب</span>
        <span style="margin-inline-start:auto">${icon('command')} جست‌وجوی سریع</span>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  refreshIcons(wrap);

  const input = wrap.querySelector('.palette__input');
  const list = wrap.querySelector('.palette__list');
  let focused = 0;
  let results = [];

  function build(query) {
    const q = query.trim().toLowerCase();
    const pages = ROUTES
      .filter((r) => !q || `${r.label} ${r.group} ${r.path}`.toLowerCase().includes(q))
      .map((r) => ({ text: r.label, iconName: r.icon, hint: r.group, group: 'صفحات', run: () => navigate(r.path) }));
    const actions = PALETTE_ACTIONS
      .filter((a) => !q || a.text.toLowerCase().includes(q))
      .map((a) => ({ ...a, group: 'عملیات' }));
    results = [...pages, ...actions];
    if (q && !results.length) {
      list.innerHTML = `<div class="empty-state" style="padding:26px 14px"><div class="empty-state__title">نتیجه‌ای پیدا نشد</div><div class="empty-state__text">عبارت دیگری را امتحان کنید.</div></div>`;
      return;
    }
    focused = Math.min(focused, Math.max(0, results.length - 1));
    let lastGroup = '';
    list.innerHTML = results.map((item, idx) => {
      const groupHeader = item.group !== lastGroup ? `<div class="palette__group">${item.group}</div>` : '';
      lastGroup = item.group;
      return `${groupHeader}
        <button class="palette__item ${idx === focused ? 'is-focused' : ''}" data-idx="${idx}">
          ${icon(item.iconName)}
          <span>${escapeHtml(item.text)}</span>
          ${item.hint ? `<kbd class="kbd" style="margin-inline-start:auto">${escapeHtml(item.hint)}</kbd>` : ''}
        </button>`;
    }).join('');
    refreshIcons(list);
    list.querySelectorAll('.palette__item').forEach((btn) => {
      btn.addEventListener('mousemove', () => {
        focused = Number(btn.dataset.idx);
        list.querySelectorAll('.palette__item').forEach((b) => b.classList.toggle('is-focused', b === btn));
      });
      btn.addEventListener('click', () => { runItem(Number(btn.dataset.idx)); });
    });
  }

  function runItem(idx) {
    const item = results[idx];
    if (!item) return;
    close();
    item.run?.();
  }

  function move(delta) {
    focused = (focused + delta + results.length) % results.length;
    list.querySelectorAll('.palette__item').forEach((b) => b.classList.toggle('is-focused', Number(b.dataset.idx) === focused));
    list.querySelector('.is-focused')?.scrollIntoView({ block: 'nearest' });
  }

  const close = () => {
    wrap.remove();
    document.removeEventListener('keydown', onKey, true);
  };
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runItem(focused); }
  }

  input.addEventListener('input', debounce(() => { focused = 0; build(input.value); }, 90));
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  document.addEventListener('keydown', onKey, true);
  build('');
  input.focus();
}

/* ------------------------------------------------------------------- mount */
export function mountShell(appRoot) {
  appRoot.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar ${store.state.sidebarCollapsed ? 'is-collapsed' : ''}" id="sidebar">
        ${sidebarMarkup()}
      </aside>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <div class="main-col">
        <header class="topbar">${topbarMarkup()}</header>
        <main class="page" id="page-root"></main>
      </div>
    </div>`;

  refreshIcons(appRoot);
  updateThemeButton();
  updateConnectionPill();
  updateNotifDot();

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  document.getElementById('sidebar-collapse')?.addEventListener('click', () => {
    store.toggleSidebar();
  });

  store.on('sidebar', (collapsed) => {
    sidebar.classList.toggle('is-collapsed', collapsed);
    const btn = document.getElementById('sidebar-collapse');
    if (btn) {
      btn.innerHTML = icon(collapsed ? 'panel-right-open' : 'panel-right-close');
      refreshIcons(btn);
    }
  });

  const closeMobile = () => {
    sidebar.classList.remove('is-mobile-open');
    overlay.classList.remove('is-open');
  };

  document.getElementById('burger')?.addEventListener('click', () => {
    sidebar.classList.toggle('is-mobile-open');
    overlay.classList.toggle('is-open');
  });
  overlay.addEventListener('click', closeMobile);

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', closeMobile);
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => store.toggleTheme());
  document.getElementById('notif-btn')?.addEventListener('click', (e) => openNotifications(e.currentTarget));
  document.getElementById('account-btn')?.addEventListener('click', (e) => openAccount(e.currentTarget));
  document.getElementById('store-switch')?.addEventListener('click', (e) => openStoreSwitch(e.currentTarget));
  document.getElementById('conn-pill')?.addEventListener('click', (e) => openConnectionMenu(e.currentTarget));
  document.getElementById('search-trigger')?.addEventListener('click', openPalette);

  store.on('theme', updateThemeButton);
  store.on('online', () => { updateConnectionPill(); });
  store.on('role', () => {
    const el = document.getElementById('account-role');
    if (el) el.textContent = ROLES[store.state.role].label;
    const btn = document.getElementById('account-btn');
    if (btn) refreshIcons(btn);
  });
  store.on('change', () => {
    updateNotifDot();
    updateConnectionPill();
    const badges = navBadges();
    Object.entries(badges).forEach(([path, b]) => {
      const el = document.querySelector(`.nav-item[data-path="${path}"] .nav-item__count`);
      if (el) el.textContent = b.count ? fa(b.count) : '';
    });
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
    }
  });

  const { path } = parseHash();
  setActiveNav(path);
  updateBreadcrumb(routeFor(path));

  return {
    setRoute(route) {
      setActiveNav(route.path);
      updateBreadcrumb(route);
      closeMobile();
      window.scrollTo({ top: 0 });
    },
  };
}

export { DOWNLOAD_URL };
