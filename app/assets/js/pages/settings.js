import { api } from '../core/api.js';
import { store, ROLES } from '../core/store.js';
import {
  icon, refreshIcons, toast, badge, confirmDialog, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml } from '../core/utils.js';
import { pageHead } from '../components/common.js';

const TABS = [
  { key: 'general', label: 'عمومی', icon: 'settings-2' },
  { key: 'sync', label: 'همگام‌سازی', icon: 'refresh-cw' },
  { key: 'pricing', label: 'قیمت و ارز', icon: 'badge-percent' },
  { key: 'inventory', label: 'موجودی', icon: 'boxes' },
  { key: 'orders', label: 'سفارش‌ها', icon: 'shopping-bag' },
  { key: 'limits', label: 'محدودیت درخواست‌ها', icon: 'gauge' },
  { key: 'permissions', label: 'دسترسی‌ها', icon: 'shield-check' },
  { key: 'security', label: 'امنیت', icon: 'lock' },
  { key: 'modules', label: 'ماژول‌ها', icon: 'blocks' },
  { key: 'retention', label: 'نگهداری اطلاعات', icon: 'archive' },
];

const CAPABILITIES = [
  { key: 'products.write', label: 'ویرایش محصولات' },
  { key: 'pricing.apply', label: 'اعمال قیمت‌گذاری' },
  { key: 'inventory.write', label: 'رزرو و آزادسازی موجودی' },
  { key: 'orders.import', label: 'واردسازی سفارش' },
  { key: 'sync.control', label: 'اجرای همگام‌سازی' },
  { key: 'automation.write', label: 'ویرایش قوانین اتوماسیون' },
  { key: 'connections.write', label: 'مدیریت اتصال و توکن' },
  { key: 'settings.write', label: 'تغییر تنظیمات' },
];

let state = null;

function initial() {
  return { tab: 'general', settings: null, loading: true, dirty: false };
}

function field({ label, hint, group, key, value, type = 'text', suffix = '', disabled = false }) {
  return `
    <div class="field">
      <label class="field__label">${label}</label>
      ${suffix
        ? `<div class="input-group">
             <input class="input" data-setting data-group="${group}" data-key="${key}" type="${type}" value="${escapeHtml(String(value ?? ''))}" ${disabled ? 'disabled' : ''} />
             <span class="input-group__suffix">${suffix}</span>
           </div>`
        : `<input class="input" data-setting data-group="${group}" data-key="${key}" type="${type}" value="${escapeHtml(String(value ?? ''))}" ${disabled ? 'disabled' : ''} />`}
      ${hint ? `<div class="field__hint">${hint}</div>` : ''}
    </div>`;
}

function selectField({ label, hint, group, key, value, options }) {
  return `
    <div class="field">
      <label class="field__label">${label}</label>
      <select class="select" data-setting data-group="${group}" data-key="${key}">
        ${options.map(([v, l]) => `<option value="${v}" ${String(value) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      ${hint ? `<div class="field__hint">${hint}</div>` : ''}
    </div>`;
}

function switchRow({ title, desc, group, key, checked, disabled = false }) {
  return `
    <div class="setting-row">
      <div class="setting-row__main">
        <div class="setting-row__title">${title}</div>
        <div class="setting-row__desc">${desc}</div>
      </div>
      <div class="setting-row__control">
        <label class="switch">
          <input type="checkbox" data-setting data-group="${group}" data-key="${key}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} />
          <span class="switch__track"></span>
        </label>
      </div>
    </div>`;
}

function panel(tab) {
  const s = state.settings;
  if (tab === 'general') {
    return `
      ${field({ label: 'نام فروشگاه', group: 'general', key: 'storeName', value: s.general.storeName, hint: 'در عنوان پنل و گزارش‌ها نمایش داده می‌شود.' })}
      <div class="form-grid" style="margin-top:12px">
        ${selectField({ label: 'زبان پنل', group: 'general', key: 'adminLanguage', value: s.general.adminLanguage, options: [['fa', 'فارسی'], ['en', 'English']], hint: 'رابط به‌صورت پیش‌فرض راست‌به‌چپ فارسی است.' })}
        ${selectField({ label: 'منطقه زمانی', group: 'general', key: 'timezone', value: s.general.timezone, options: [['Asia/Tehran', 'تهران (UTC+3:30)'], ['UTC', 'UTC']] })}
        ${selectField({ label: 'قالب تاریخ', group: 'general', key: 'dateFormat', value: s.general.dateFormat, options: [['jYYYY/jMM/jDD', 'شمسی'], ['YYYY-MM-DD', 'میلادی']] })}
      </div>
      <div class="alert alert--info" style="margin-top:14px">${icon('info')}<div class="alert__text">
        تغییر نام فروشگاه روی داده‌های همگام‌شده اثری ندارد و فقط نمایش پنل را تغییر می‌دهد.
      </div></div>`;
  }

  if (tab === 'sync') {
    return `
      <div class="form-grid">
        ${selectField({ label: 'فاصله همگام‌سازی خودکار', group: 'sync', key: 'interval', value: s.sync.interval, options: [['5', 'هر ۵ دقیقه'], ['15', 'هر ۱۵ دقیقه'], ['30', 'هر ۳۰ دقیقه'], ['60', 'هر ۶۰ دقیقه']] })}
        ${selectField({ label: 'روش تطبیق محصولات', group: 'sync', key: 'matchBy', value: s.sync.matchBy, options: [['sku', 'SKU یکتا'], ['id', 'شناسه محصول'], ['manual', 'فقط دستی']] })}
      </div>
      ${switchRow({ title: 'WooCommerce Mirror', desc: 'قیمت و موجودی ووکامرس به اسنپ‌شاپ منتقل شود (ووکامرس منبع حقیقت).', group: 'sync', key: 'mirror', checked: s.sync.mirror })}
      ${switchRow({ title: 'تلاش مجدد خودکار', desc: 'در صورت خطای موقت (مثل محدودیت نرخ)، عملیات با تأخیر پلکانی تکرار شود.', group: 'sync', key: 'autoRetry', checked: s.sync.autoRetry })}
      <div class="alert alert--warning" style="margin-top:12px">${icon('triangle-alert')}<div class="alert__text">
        با فعال بودن Mirror، اعمال قیمت گروهی روی اسنپ‌شاپ ممکن است در همگام‌سازی بعدی روی ووکامرس هم نوشته شود.
      </div></div>`;
  }

  if (tab === 'pricing') {
    return `
      <div class="form-grid">
        ${selectField({ label: 'واحد پول قیمت پایه', group: 'pricing', key: 'currency', value: s.pricing.currency, options: [['IRT', 'تومان (بدون تقسیم بر ۱۰)']], hint: 'قیمت پایه محصولات تومان است و هرگز بر ۱۰ تقسیم نمی‌شود.' })}
        ${selectField({ label: 'گرد کردن پیش‌فرض', group: 'pricing', key: 'rounding', value: s.pricing.rounding, options: [['none', 'بدون گرد کردن'], ['1000', '۱٬۰۰۰ تومان'], ['5000', '۵٬۰۰۰ تومان'], ['10000', '۱۰٬۰۰۰ تومان']] })}
        ${field({ label: 'حداقل قیمت مجاز', group: 'pricing', key: 'minPrice', value: s.pricing.minPrice, suffix: 'تومان', hint: 'قوانین قیمت‌گذاری از این مقدار پایین‌تر نمی‌روند.' })}
        ${field({ label: 'حداکثر قیمت مجاز', group: 'pricing', key: 'maxPrice', value: s.pricing.maxPrice, suffix: 'تومان' })}
      </div>`;
  }

  if (tab === 'inventory') {
    return `
      <div class="form-grid">
        ${selectField({ label: 'منبع موجودی', group: 'inventory', key: 'source', value: s.inventory.source, options: [['min', 'کمینه دو سامانه'], ['woo', 'ووکامرس'], ['snapp', 'اسنپ‌شاپ']], hint: 'در حالت «کمینه»، موجودی کمتر از دو سمت اعمال می‌شود تا فروش بیش از موجودی رخ ندهد.' })}
        ${field({ label: 'موجودی ایمنی پیش‌فرض', group: 'inventory', key: 'safety', value: s.inventory.safety, suffix: 'عدد', hint: 'این مقدار از موجودی قابل تخصیص کم می‌شود.' })}
      </div>
      ${switchRow({ title: 'رزرو خودکار هنگام دریافت سفارش', desc: 'با دریافت سفارش جدید، موجودی به‌صورت خودکار رزرو می‌شود.', group: 'inventory', key: 'reserveOnOrder', checked: s.inventory.reserveOnOrder })}`;
  }

  if (tab === 'orders') {
    return `
      <div class="form-grid">
        ${selectField({
          label: 'واحد پول مبلغ سفارش',
          group: 'orders',
          key: 'currencyUnit',
          value: s.orders.currencyUnit || 'unknown',
          options: [['unknown', 'نامشخص (نمایش «نامشخص» و حذف از جمع)'], ['IRT', 'تومان']],
          hint: 'تا زمانی که واحد پول مشخص نشود، مبلغ فروش جمع زده نمی‌شود.',
        })}
      </div>
      ${switchRow({ title: 'واردسازی خودکار سفارش‌ها', desc: 'سفارش‌های جدید بدون نیاز به تأیید دستی به ووکامرس وارد شوند.', group: 'orders', key: 'autoImport', checked: s.orders.autoImport })}
      ${switchRow({ title: 'محدودسازی اطلاعات مشتری', desc: 'شماره تماس و نشانی کامل در پنل نمایش داده نشود.', group: 'orders', key: 'customerMasking', checked: s.orders.customerMasking })}
      <div class="alert alert--info" style="margin-top:12px">${icon('info')}<div class="alert__text">
        تغییر وضعیت سفارش یا استرداد وجه از این افزونه انجام نمی‌شود؛ این عملیات فقط در پنل فروشنده اسنپ‌شاپ امکان‌پذیر است.
      </div></div>`;
  }

  if (tab === 'limits') {
    return `
      <div class="form-grid">
        ${field({ label: 'حداکثر درخواست در دقیقه', group: 'limits', key: 'requestsPerMinute', value: s.limits.requestsPerMinute, suffix: 'درخواست', hint: 'برای جلوگیری از خطای ۴۲۹ اسنپ‌شاپ.' })}
        ${field({ label: 'حداکثر عملیات همزمان', group: 'limits', key: 'concurrency', value: s.limits.concurrency, suffix: 'عملیات' })}
        ${selectField({ label: 'روش تأخیر پلکانی', group: 'limits', key: 'backoff', value: s.limits.backoff, options: [['exponential', 'نمایی'], ['linear', 'خطی'], ['fixed', 'ثابت']] })}
      </div>`;
  }

  if (tab === 'permissions') {
    return `
      <div class="alert alert--info" style="margin-bottom:12px">${icon('shield-check')}<div class="alert__text">
        نقش‌ها فقط برای نمایش و بررسی رابط هستند. دسترسی واقعی در وردپرس با نقش‌های کاربری و Nonce تعیین می‌شود.
      </div></div>
      <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--radius)">
        <table class="table">
          <thead><tr><th>دسترسی</th>${Object.values(ROLES).map((r) => `<th style="text-align:center">${r.label}</th>`).join('')}</tr></thead>
          <tbody>
            ${CAPABILITIES.map((cap) => `
              <tr>
                <td>${cap.label}</td>
                ${Object.entries(ROLES).map(([key, role]) => {
                  const allowed = role.caps === '*' || role.caps.includes(cap.key);
                  return `<td style="text-align:center">${allowed
                    ? `<span style="color:var(--success)">${icon('check')}</span>`
                    : `<span class="t-faint">${icon('minus')}</span>`}</td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="setting-row" style="margin-top:14px">
        <div class="setting-row__main">
          <div class="setting-row__title">نقش نمایشی فعلی</div>
          <div class="setting-row__desc">برای بررسی حالت «دسترسی غیرمجاز» نقش را تغییر دهید.</div>
        </div>
        <div class="setting-row__control">
          <select class="select" id="role-select" style="width:auto">
            ${Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${store.state.role === k ? 'selected' : ''}>${r.label}</option>`).join('')}
          </select>
        </div>
      </div>`;
  }

  if (tab === 'security') {
    return `
      ${switchRow({ title: 'الزام X-WP-Nonce', desc: 'همه درخواست‌های REST باید Nonce معتبر وردپرس داشته باشند. غیرفعال‌کردن توصیه نمی‌شود.', group: 'security', key: 'requireNonce', checked: s.security.requireNonce, disabled: true })}
      ${switchRow({ title: 'پاکسازی توکن در لاگ‌ها', desc: 'توکن، هدرهای حساس و مقادیر محرمانه پیش از ذخیره لاگ حذف شوند.', group: 'security', key: 'maskTokens', checked: s.security.maskTokens })}
      <div class="form-grid" style="margin-top:12px">
        ${field({ label: 'مدت نگهداری لاگ‌ها', group: 'security', key: 'logRetentionDays', value: s.security.logRetentionDays, suffix: 'روز' })}
      </div>
      <div class="alert alert--success" style="margin-top:14px">${icon('shield-check')}<div class="alert__text">
        توکن دسترسی اسنپ‌شاپ هرگز در JavaScript یا LocalStorage ذخیره نمی‌شود و فقط در سرور وردپرس نگه‌داری می‌شود.
      </div></div>`;
  }

  if (tab === 'modules') {
    return `
      ${switchRow({ title: 'موتور قیمت‌گذاری', desc: 'امکان تعریف قانون قیمت و اعمال گروهی.', group: 'modules', key: 'pricing', checked: s.modules.pricing })}
      ${switchRow({ title: 'اتوماسیون', desc: 'ساخت قوانین WHEN → IF → THEN.', group: 'modules', key: 'automation', checked: s.modules.automation })}
      ${switchRow({ title: 'تخفیف‌ها', desc: 'مدیریت برنامه‌های تخفیف محصولات.', group: 'modules', key: 'discounts', checked: s.modules.discounts })}
      ${switchRow({ title: 'گزارش‌ها', desc: 'نمایش تحلیل‌ها و نمودارهای فروش.', group: 'modules', key: 'reports', checked: s.modules.reports })}
      ${switchRow({ title: 'WooCommerce Mirror', desc: 'انتقال قیمت و موجودی از ووکامرس به اسنپ‌شاپ.', group: 'modules', key: 'mirror', checked: s.modules.mirror })}`;
  }

  return `
    <div class="form-grid">
      ${field({ label: 'نگهداری لاگ‌ها', group: 'retention', key: 'logsDays', value: s.retention.logsDays, suffix: 'روز' })}
      ${field({ label: 'نگهداری صف عملیات', group: 'retention', key: 'jobsDays', value: s.retention.jobsDays, suffix: 'روز' })}
      ${field({ label: 'نگهداری فایل‌ها', group: 'retention', key: 'filesDays', value: s.retention.filesDays, suffix: 'روز' })}
    </div>
    <div class="alert alert--info" style="margin-top:14px">${icon('info')}<div class="alert__text">
      داده‌های قدیمی‌تر از این بازه به‌صورت خودکار پاک می‌شوند. پشتیبان‌ها از این قاعده مستثنا هستند.
    </div></div>`;
}

function paintPanel(root) {
  const host = root.querySelector('#settings-panel');
  host.innerHTML = `
    <section class="card">
      <div class="card__head">
        <div class="u-grow">
          <div class="card__title">${TABS.find((t) => t.key === state.tab).label}</div>
          <div class="card__sub">تنظیمات این بخش پس از ذخیره روی همه عملیات اعمال می‌شود.</div>
        </div>
        ${state.dirty ? '<span class="badge badge--warning">تغییرات ذخیره نشده</span>' : ''}
      </div>
      <div class="card__body">${panel(state.tab)}</div>
      <div class="card__foot" style="justify-content:space-between">
        <span class="t-muted" style="font-size:11px">${icon('lock')} ذخیره از طریق REST API و با Nonce وردپرس انجام می‌شود.</span>
        <button class="btn btn--primary btn--sm" id="save-settings" ${state.dirty ? '' : 'disabled'}>${icon('check')} ذخیره تغییرات</button>
      </div>
    </section>`;
  refreshIcons(host);

  host.querySelectorAll('[data-setting]').forEach((el) => {
    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);
  });

  host.querySelector('#role-select')?.addEventListener('change', (e) => {
    store.setRole(e.target.value);
    toast({ title: 'نقش نمایشی تغییر کرد', text: ROLES[e.target.value].desc, tone: 'info' });
  });

  host.querySelector('#save-settings')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const payload = JSON.parse(JSON.stringify(state.settings));
    host.querySelectorAll('[data-setting]').forEach((el) => {
      const group = el.dataset.group;
      const key = el.dataset.key;
      payload[group] = payload[group] || {};
      payload[group][key] = el.type === 'checkbox' ? el.checked : el.value;
    });
    setBusy(btn, true);
    try {
      const saved = await api.put('/settings', payload);
      state.settings = saved;
      state.dirty = false;
      paintPanel(root);
      paintNav(root);
      toast({ title: 'تنظیمات ذخیره شد', text: 'تغییرات روی عملیات بعدی اعمال می‌شود.', tone: 'success' });
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'ذخیره تنظیمات ناموفق بود', text: err.message, tone: 'error' });
    }
  });
}

function markDirty() {
  if (state.dirty) return;
  state.dirty = true;
  const root = document;
  const panel = root.querySelector('#settings-panel');
  if (!panel) return;
  const head = panel.querySelector('.card__head');
  if (head && !head.querySelector('.badge--warning')) {
    head.insertAdjacentHTML('beforeend', '<span class="badge badge--warning">تغییرات ذخیره نشده</span>');
  }
  const save = panel.querySelector('#save-settings');
  if (save) save.disabled = false;
}

function paintNav(root) {
  root.querySelector('#settings-nav').innerHTML = TABS.map((t) => `
    <button class="settings-nav__item ${state.tab === t.key ? 'is-active' : ''}" data-settings-tab="${t.key}">
      ${icon(t.icon)}<span>${t.label}</span>
    </button>`).join('');
  refreshIcons(root.querySelector('#settings-nav'));

  root.querySelectorAll('[data-settings-tab]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (state.dirty) {
        const ok = await confirmDialog({
          title: 'تغییرات ذخیره نشده',
          desc: 'تغییرات این بخش ذخیره نشده است. با تغییر تب، تغییرات از بین می‌رود.',
          confirmText: 'دور ریختن تغییرات',
          tone: 'danger',
        });
        if (!ok) return;
      }
      state.dirty = false;
      state.tab = btn.dataset.settingsTab;
      paintNav(root);
      paintPanel(root);
    });
  });
}

export async function render(root) {
  state = initial();
  root.innerHTML = `
    ${pageHead({
      title: 'تنظیمات',
      sub: 'پیکربندی عمومی، همگام‌سازی، قیمت، موجودی، دسترسی و امنیت',
      actions: `<a class="btn btn--secondary" href="#/connections">${icon('plug')}<span>اتصالات</span></a>`,
    })}
    <div class="settings-shell">
      <nav class="settings-nav" id="settings-nav"></nav>
      <div class="settings-panel" id="settings-panel">
        <div class="card"><div class="card__body"><div class="skeleton" style="height:260px;border-radius:10px"></div></div></div>
      </div>
    </div>`;
  refreshIcons(root);

  try {
    state.settings = await api.get('/settings');
  } catch (err) {
    root.querySelector('#settings-panel').innerHTML = `<div class="card">${errorState({ text: err.message })}</div>`;
    refreshIcons(root);
    root.querySelector('[data-retry]')?.addEventListener('click', () => render(root));
    return;
  }
  paintNav(root);
  paintPanel(root);
}
