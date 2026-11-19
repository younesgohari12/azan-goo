import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openModal, confirmDialog,
  skeletonRows, emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, relTime } from '../core/utils.js';
import { pageHead, card } from '../components/common.js';

let state = null;

function initial(params) {
  return { items: [], loading: true, openNew: params.get('new') === '1' };
}

async function load(root) {
  const host = root.querySelector('#connections-list');
  try {
    const { items } = await api.get('/connections');
    state.items = items;
    state.loading = false;
    paint(root);
  } catch (err) {
    state.loading = false;
    host.innerHTML = `<div class="card">${errorState({ text: err.message })}</div>`;
    refreshIcons(host);
    host.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function paint(root) {
  const host = root.querySelector('#connections-list');
  if (!state.items.length) {
    host.innerHTML = card({
      body: emptyState({
        iconName: 'plug',
        title: 'هیچ اتصالی ثبت نشده',
        text: 'برای دریافت محصولات و سفارش‌ها، یک اتصال اسنپ‌شاپ با API Token بسازید.',
        action: `<button class="btn btn--primary btn--sm" data-new-connection>${icon('plus')} افزودن اتصال</button>`,
      }),
    });
    refreshIcons(host);
    host.querySelector('[data-new-connection]')?.addEventListener('click', () => openNew(root));
    return;
  }

  host.innerHTML = state.items.map((conn) => `
    <section class="card" style="margin-bottom:12px">
      <div class="card__head">
        <div class="stat__icon ${conn.status === 'connected' ? 'is-success' : 'is-danger'}">${icon('plug')}</div>
        <div class="u-grow" style="min-width:0">
          <div class="card__title">${escapeHtml(conn.name)}</div>
          <div class="card__sub">ایجاد ${formatDate(conn.createdAt)} — آخرین بررسی ${relTime(conn.lastCheck)}</div>
        </div>
        ${badge(conn.status, { text: conn.status === 'connected' ? 'متصل' : 'خطا در اتصال' })}
      </div>
      <div class="card__body">
        <div class="form-grid">
          <div class="field">
            <label class="field__label">API Token</label>
            <div class="input-icon">
              <input class="input t-mono" value="${escapeHtml(conn.tokenMasked)}" disabled />
              <span class="input-icon__action" style="pointer-events:none">${icon('lock')}</span>
            </div>
            <div class="field__hint">توکن فقط در سرور نگه‌داری می‌شود و هرگز به JavaScript یا LocalStorage ارسال نمی‌شود.</div>
          </div>
          <div class="field">
            <label class="field__label">User-Agent</label>
            <input class="input t-mono" value="${escapeHtml(conn.userAgent)}" disabled />
            <div class="field__hint">برای شناسایی درخواست‌های افزونه در پنل اسنپ‌شاپ.</div>
          </div>
        </div>

        <div class="u-between" style="margin-top:16px;margin-bottom:8px">
          <div class="t-section-title">دسترسی فروشگاه‌ها</div>
          <button class="btn btn--secondary btn--sm" data-discover="${conn.id}">${icon('radar')} کشف فروشگاه‌ها</button>
        </div>
        ${conn.stores.length ? `
          <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--radius)">
            <table class="table">
              <thead><tr><th>فروشگاه</th><th>کد</th><th>نقش</th><th>دسترسی افزونه</th></tr></thead>
              <tbody>
                ${conn.stores.map((s) => `
                  <tr>
                    <td><div class="cell-stack"><span class="cell-stack__main">${escapeHtml(s.name)}</span></div></td>
                    <td><span class="t-mono">${escapeHtml(s.code)}</span></td>
                    <td><span class="badge badge--neutral">${s.role === 'owner' ? 'مالک' : s.role === 'manager' ? 'مدیر' : 'مشاهده‌گر'}</span></td>
                    <td>
                      <label class="switch switch--sm">
                        <input type="checkbox" data-store-access="${conn.id}:${s.id}" ${s.access ? 'checked' : ''} />
                        <span class="switch__track"></span>
                      </label>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : `
          <div class="alert alert--warning">${icon('alert-triangle')}<div class="alert__text">
            هنوز فروشگاهی کشف نشده است. با دکمه «کشف فروشگاه‌ها» لیست فروشگاه‌های در دسترس این توکن دریافت می‌شود.
          </div></div>`}
      </div>
    </section>`).join('');
  refreshIcons(host);

  host.querySelectorAll('[data-discover]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      setBusy(btn, true);
      try {
        await api.post(`/connections/${btn.dataset.discover}/discover`);
        toast({ title: 'فروشگاه‌ها کشف شدند', text: 'دسترسی هر فروشگاه را می‌توانید جداگانه فعال یا غیرفعال کنید.', tone: 'success' });
        load(root);
      } catch (err) {
        setBusy(btn, false);
        toast({ title: 'کشف فروشگاه‌ها ناموفق بود', text: err.message, tone: 'error' });
      }
    });
  });

  host.querySelectorAll('[data-store-access]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const [connId, storeId] = cb.dataset.storeAccess.split(':');
      try {
        await api.patch(`/connections/${connId}/stores/${storeId}`, { access: cb.checked });
        toast({ title: cb.checked ? 'دسترسی فروشگاه فعال شد' : 'دسترسی فروشگاه غیرفعال شد', tone: cb.checked ? 'success' : 'warning', duration: 2400 });
      } catch (err) {
        cb.checked = !cb.checked;
        toast({ title: 'تغییر دسترسی ناموفق بود', text: err.message, tone: 'error' });
      }
    });
  });
}

function openNew(root) {
  openModal({
    title: 'افزودن اتصال اسنپ‌شاپ',
    desc: 'توکن API از پنل فروشنده اسنپ‌شاپ دریافت می‌شود.',
    iconName: 'plug',
    size: 'lg',
    body: `
      <form id="conn-form" class="form-grid" autocomplete="off">
        <div class="field span-2">
          <label class="field__label">نام اتصال <span class="req">*</span></label>
          <input class="input" name="name" placeholder="مثلاً اتصال اصلی — فروشگاه تهران" />
        </div>
        <div class="field span-2">
          <label class="field__label">API Token <span class="req">*</span></label>
          <div class="input-icon">
            ${icon('key-round')}
            <input class="input t-mono" type="password" name="token" id="conn-token" placeholder="توکن دسترسی اسنپ‌شاپ" style="padding-inline-end:34px" />
            <button type="button" class="input-icon__action" id="toggle-token" aria-label="نمایش توکن">${icon('eye')}</button>
          </div>
          <div class="field__hint">توکن فقط برای بررسی اتصال ارسال می‌شود؛ در JavaScript ذخیره نمی‌شود.</div>
        </div>
        <div class="field span-2">
          <label class="field__label">User-Agent</label>
          <input class="input t-mono" name="userAgent" value="SnappShop-Automation/2.4.1 (+woocommerce)" />
          <div class="field__hint">این مقدار در هدر درخواست‌ها به اسنپ‌شاپ ارسال می‌شود.</div>
        </div>
      </form>
      <div class="alert alert--info" style="margin-top:14px">${icon('shield-check')}<div class="alert__text">
        اتصال پس از ذخیره بررسی می‌شود. اگر توکن منقضی شده باشد، وضعیت اتصال «خطا» نمایش داده می‌شود.
      </div></div>`,
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-cancel>انصراف</button><button class="btn btn--primary" data-save>بررسی و ذخیره اتصال</button>',
    onMount: (h) => {
      const token = h.root.querySelector('#conn-token');
      h.root.querySelector('#toggle-token').addEventListener('click', () => {
        token.type = token.type === 'password' ? 'text' : 'password';
        h.root.querySelector('#toggle-token').innerHTML = icon(token.type === 'password' ? 'eye' : 'eye-off');
        refreshIcons(h.root.querySelector('#toggle-token'));
      });
      h.root.querySelector('[data-cancel]').addEventListener('click', h.close);
      h.root.querySelector('[data-save]').addEventListener('click', async (e) => {
        const form = h.root.querySelector('#conn-form');
        const data = Object.fromEntries(new FormData(form).entries());
        if (!data.name || !data.token) {
          toast({ title: 'نام و توکن الزامی است', tone: 'warning' });
          return;
        }
        const btn = e.currentTarget;
        setBusy(btn, true);
        try {
          await api.post('/connections', data);
          h.close();
          toast({ title: 'اتصال ذخیره شد', text: 'برای دریافت فروشگاه‌ها روی «کشف فروشگاه‌ها» بزنید.', tone: 'success' });
          load(root);
        } catch (err) {
          setBusy(btn, false);
          toast({ title: 'ذخیره اتصال ناموفق بود', text: err.message, tone: 'error' });
        }
      });
    },
  });
}

export async function render(root, ctx) {
  state = initial(ctx.params);
  root.innerHTML = `
    ${pageHead({
      title: 'اتصالات و فروشگاه‌ها',
      sub: 'مدیریت اتصال اسنپ‌شاپ، توکن دسترسی و فروشگاه‌های مجاز',
      actions: `<button class="btn btn--primary" id="add-connection">${icon('plus')}<span>افزودن اتصال</span></button>`,
    })}
    <div id="connections-list"><div class="card"><div class="card__body"><div class="skeleton" style="height:140px;border-radius:10px"></div></div></div></div>`;
  refreshIcons(root);
  root.querySelector('#add-connection').addEventListener('click', () => openNew(root));
  await load(root);
  if (state.openNew) openNew(root);
}
