/* Hash router + route table (works from any static path and inside wp-admin). */

import { closeAllOverlays } from './ui.js';

export const ROUTES = [
  { path: '/dashboard', label: 'داشبورد', icon: 'layout-dashboard', group: 'نمای کلی', page: () => import('../pages/dashboard.js') },
  { path: '/reports', label: 'گزارش‌ها', icon: 'chart-no-axes-column', group: 'نمای کلی', page: () => import('../pages/reports.js') },

  { path: '/products', label: 'محصولات', icon: 'package', group: 'فروش', page: () => import('../pages/products.js') },
  { path: '/mapping', label: 'نگاشت محصولات', icon: 'git-compare-arrows', group: 'فروش', page: () => import('../pages/mapping.js') },
  { path: '/pricing', label: 'قیمت‌گذاری', icon: 'badge-percent', group: 'فروش', page: () => import('../pages/pricing.js') },
  { path: '/inventory', label: 'مدیریت موجودی', icon: 'boxes', group: 'فروش', page: () => import('../pages/inventory.js') },
  { path: '/discounts', label: 'تخفیف‌ها', icon: 'tag', group: 'فروش', page: () => import('../pages/discounts.js') },
  { path: '/orders', label: 'سفارش‌ها', icon: 'shopping-bag', group: 'فروش', page: () => import('../pages/orders.js') },

  { path: '/sync', label: 'همگام‌سازی', icon: 'refresh-cw', group: 'عملیات', page: () => import('../pages/sync.js') },
  { path: '/automation', label: 'اتوماسیون', icon: 'workflow', group: 'عملیات', page: () => import('../pages/automation.js') },
  { path: '/jobs', label: 'صف عملیات', icon: 'list-checks', group: 'عملیات', page: () => import('../pages/jobs.js') },
  { path: '/logs', label: 'لاگ‌ها', icon: 'scroll-text', group: 'عملیات', page: () => import('../pages/logs.js') },

  { path: '/connections', label: 'اتصالات و فروشگاه‌ها', icon: 'plug', group: 'سیستم', page: () => import('../pages/connections.js') },
  { path: '/data', label: 'ورود و خروج اطلاعات', icon: 'arrow-left-right', group: 'سیستم', page: () => import('../pages/data.js') },
  { path: '/backup', label: 'پشتیبان‌گیری', icon: 'database-backup', group: 'سیستم', page: () => import('../pages/backup.js') },
  { path: '/settings', label: 'تنظیمات', icon: 'settings', group: 'سیستم', page: () => import('../pages/settings.js') },
];

export const NAV_GROUPS = ['نمای کلی', 'فروش', 'عملیات', 'سیستم'];

export function parseHash() {
  const raw = (window.location.hash || '').replace(/^#/, '') || '/dashboard';
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');
  return { path: path || '/dashboard', params };
}

export function routeFor(path) {
  return ROUTES.find((r) => r.path === path) || ROUTES[0];
}

export function navigate(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  if (replace) {
    history.replaceState(null, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
}

export function createRouter({ onBeforeRender, onRender, onError }) {
  let token = 0;
  let cleanup = null;

  async function render() {
    const { path, params } = parseHash();
    const route = ROUTES.find((r) => r.path === path);
    const current = ++token;
    closeAllOverlays();
    onBeforeRender?.(route || ROUTES[0], params);

    if (typeof cleanup === 'function') {
      try { cleanup(); } catch (e) { /* noop */ }
      cleanup = null;
    }

    const root = document.getElementById('page-root');
    if (!root) return;

    if (!route) {
      root.innerHTML = `
        <div class="card" style="margin-top:20px">
          <div class="empty-state">
            <div class="empty-state__icon"><i data-lucide="compass"></i></div>
            <div class="empty-state__title">صفحه پیدا نشد</div>
            <div class="empty-state__text">مسیر «${path}» در این پنل وجود ندارد.</div>
            <div class="empty-state__actions"><a class="btn btn--primary btn--sm" href="#/dashboard">بازگشت به داشبورد</a></div>
          </div>
        </div>`;
      window.lucide?.createIcons({ attrs: { 'stroke-width': 1.8 } });
      return;
    }

    try {
      const module = await route.page();
      if (current !== token) return;
      const result = await module.render(root, { params, route, navigate });
      if (current !== token) return;
      cleanup = result?.cleanup || null;
      onRender?.(route, params);
    } catch (err) {
      console.error(err);
      if (current !== token) return;
      onError?.(err, route);
    }
  }

  window.addEventListener('hashchange', render);
  return { render, refresh: render };
}
