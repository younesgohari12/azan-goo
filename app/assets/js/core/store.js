/* Global UI/session state. Holds no credentials — the auth token never reaches JS storage. */

const LS_THEME = 'snapp.theme';
const LS_SIDEBAR = 'snapp.sidebar';
const LS_ROLE = 'snapp.role';

export const ROLES = {
  admin: { label: 'مدیر کل', desc: 'دسترسی کامل به همه بخش‌ها', caps: '*' },
  operator: {
    label: 'اپراتور فروشگاه',
    desc: 'مدیریت محصولات، قیمت، موجودی و سفارش‌ها',
    caps: [
      'products.write', 'pricing.apply', 'inventory.write', 'orders.import',
      'sync.control', 'automation.write', 'discounts.write', 'data.export',
    ],
  },
  viewer: {
    label: 'فقط مشاهده',
    desc: 'مشاهده گزارش‌ها و وضعیت همگام‌سازی',
    caps: [],
  },
};

export const STORES = [
  { id: 'store_1', name: 'فروشگاه اصلی', code: 'SNAP-8841', role: 'owner', orders: 1842, products: 128, status: 'connected' },
  { id: 'store_2', name: 'شعبه دیجیتال', code: 'SNAP-9127', role: 'manager', orders: 611, products: 42, status: 'connected' },
  { id: 'store_3', name: 'انبار شمال', code: 'SNAP-7742', role: 'viewer', orders: 0, products: 0, status: 'limited' },
];

function read(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (e) {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) { /* storage may be unavailable inside the WP admin iframe */ }
}

const initialTheme = (() => {
  try {
    return document.documentElement.getAttribute('data-theme')
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {
    return 'light';
  }
})();

const listeners = new Map();

export const store = {
  state: {
    theme: initialTheme,
    sidebarCollapsed: read(LS_SIDEBAR, '0') === '1',
    role: ROLES[read(LS_ROLE, 'admin')] ? read(LS_ROLE, 'admin') : 'admin',
    storeId: 'store_1',
    online: true,
    autoSync: true,
    mirror: true,
    notifications: [
      { id: 'n1', tone: 'danger', title: '۳ محصول با تداخل موجودی', text: 'موجودی اسنپ‌شاپ بیشتر از ووکامرس است', time: new Date(Date.now() - 1000 * 60 * 6).toISOString(), unread: true },
      { id: 'n2', tone: 'warning', title: 'عملیات قیمت‌گذاری ناقص ماند', text: '۲۴ مورد از ۱۲۰ محصول به‌روزرسانی نشد', time: new Date(Date.now() - 1000 * 60 * 52).toISOString(), unread: true },
      { id: 'n3', tone: 'info', title: 'همگام‌سازی سفارش‌ها انجام شد', text: '۳۸ سفارش جدید از اسنپ‌شاپ دریافت شد', time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), unread: true },
      { id: 'n4', tone: 'success', title: 'پشتیبان‌گیری رمزنگاری‌شده کامل شد', text: 'حجم فایل ۴٫۲ مگابایت — نگهداری ۱۴ روز', time: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), unread: false },
    ],
    runningJobs: 2,
    issues: 6,
  },

  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event)?.delete(fn);
  },

  emit(event, payload) {
    listeners.get(event)?.forEach((fn) => {
      try { fn(payload); } catch (err) { console.error(err); }
    });
  },

  set(patch) {
    Object.assign(this.state, patch);
    this.emit('change', this.state);
  },

  toggleTheme() {
    const next = this.state.theme === 'dark' ? 'light' : 'dark';
    this.state.theme = next;
    document.documentElement.setAttribute('data-theme', next);
    write(LS_THEME, next);
    this.emit('theme', next);
    this.emit('change', this.state);
  },

  toggleSidebar() {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    write(LS_SIDEBAR, this.state.sidebarCollapsed ? '1' : '0');
    this.emit('sidebar', this.state.sidebarCollapsed);
  },

  setRole(role) {
    if (!ROLES[role]) return;
    this.state.role = role;
    write(LS_ROLE, role);
    this.emit('role', role);
    this.emit('change', this.state);
  },

  setStore(storeId) {
    this.state.storeId = storeId;
    this.emit('store', storeId);
    this.emit('change', this.state);
  },

  setOnline(online) {
    this.state.online = online;
    this.emit('online', online);
    this.emit('change', this.state);
  },

  activeStore() {
    return STORES.find((s) => s.id === this.state.storeId) || STORES[0];
  },

  can(cap) {
    const role = ROLES[this.state.role] || ROLES.admin;
    if (role.caps === '*') return true;
    return role.caps.includes(cap);
  },

  unreadCount() {
    return this.state.notifications.filter((n) => n.unread).length;
  },

  markAllRead() {
    this.state.notifications.forEach((n) => { n.unread = false; });
    this.emit('change', this.state);
  },
};
