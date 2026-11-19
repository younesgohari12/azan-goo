import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openModal, openDrawer, confirmDialog,
  skeletonRows, emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, relTime, parseNumber, gradientFor } from '../core/utils.js';
import { pageHead, card, paginationBar, bindPagination, statCard } from '../components/common.js';

const CONFLICT_LABELS = {
  remote_stock_drop: 'کاهش موجودی از سمت اسنپ‌شاپ',
  shared_variation: 'موجودی مشترک تنوع‌ها',
};

let state = null;

function initial(params) {
  return {
    page: 1,
    perPage: 20,
    search: '',
    conflict: params.get('conflict') === '1',
    data: null,
    all: [],
    loading: true,
  };
}

async function loadStats(root) {
  try {
    const res = await api.get('/inventory', { per_page: 500 });
    state.all = res.items;
    const sums = state.all.reduce((acc, i) => {
      acc.woo += i.wooStock;
      acc.snapp += i.snappStock;
      acc.reserved += i.reserved;
      acc.allocatable += i.allocatable;
      if (i.conflict) acc.conflicts += 1;
      return acc;
    }, { woo: 0, snapp: 0, reserved: 0, allocatable: 0, conflicts: 0 });
    root.querySelector('#inv-stats').innerHTML = `
      ${statCard({ iconName: 'warehouse', label: 'موجودی ووکامرس', value: fa(sums.woo), foot: '<span class="t-muted">مجموع همه محصولات</span>' })}
      ${statCard({ iconName: 'store', tone: 'brand', label: 'موجودی اسنپ‌شاپ', value: fa(sums.snapp), foot: '<span class="t-muted">آخرین دریافت از API</span>' })}
      ${statCard({ iconName: 'lock', tone: 'warning', label: 'رزروشده', value: fa(sums.reserved), foot: '<span class="t-muted">تخصیص‌یافته به سفارش‌ها</span>' })}
      ${statCard({ iconName: 'package-check', tone: 'success', label: 'قابل تخصیص', value: fa(sums.allocatable), foot: '<span class="t-muted">اسنپ‌شاپ منهای رزرو</span>' })}
      ${statCard({ iconName: 'triangle-alert', tone: 'danger', label: 'تداخل موجودی', value: fa(sums.conflicts), foot: '<a class="btn btn--link btn--sm" href="#/inventory?conflict=1">فقط موارد دارای تداخل</a>' })}
    `;
    refreshIcons(root.querySelector('#inv-stats'));
  } catch (err) {
    root.querySelector('#inv-stats').innerHTML = '';
  }
}

async function load(root) {
  state.loading = true;
  const host = root.querySelector('#inv-table');
  host.innerHTML = `<div class="table-wrap"><table class="table"><tbody>${skeletonRows(7, 10)}</tbody></table></div>`;
  refreshIcons(root);
  try {
    const data = await api.get('/inventory', {
      page: state.page,
      per_page: state.perPage,
      search: state.search,
      conflict: state.conflict ? '1' : '',
    });
    state.data = data;
    state.loading = false;
    paint(root);
  } catch (err) {
    state.loading = false;
    host.innerHTML = errorState({ text: err.message });
    refreshIcons(host);
    host.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function stockCell(value, tone) {
  return `<span class="t-num" style="font-weight:${tone ? 600 : 500};color:${tone || 'inherit'}">${fa(value)}</span>`;
}

function paint(root) {
  const { items } = state.data;
  const host = root.querySelector('#inv-table');
  if (!items.length) {
    host.innerHTML = emptyState({
      iconName: 'boxes',
      title: 'موجودی‌ای برای نمایش نیست',
      text: state.conflict ? 'در حال حاضر تداخل موجودی وجود ندارد.' : 'عبارت جست‌وجو را تغییر دهید.',
    });
    return;
  }
  host.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>محصول</th>
          <th>موجودی ووکامرس</th>
          <th>موجودی اسنپ‌شاپ</th>
          <th>رزروشده</th>
          <th>قابل تخصیص</th>
          <th>ایمنی</th>
          <th>وضعیت تداخل</th>
          <th>آخرین بروزرسانی</th>
          <th style="text-align:end">عملیات</th>
        </tr></thead>
        <tbody>
          ${items.map((i) => `
            <tr>
              <td>
                <div class="cell-product">
                  <div class="thumb" style="background:${gradientFor(i.name)}">${escapeHtml(i.name.slice(0, 2))}</div>
                  <div style="min-width:0">
                    <div class="cell-product__name t-clamp" style="max-width:230px">${escapeHtml(i.name)}</div>
                    <div class="cell-product__meta"><span class="t-mono">${escapeHtml(i.sku || '—')}</span>${i.sharedVariation ? ' — موجودی مشترک تنوع' : ''}</div>
                  </div>
                </div>
              </td>
              <td class="num">${stockCell(i.wooStock)}</td>
              <td class="num">${stockCell(i.snappStock, i.snappStock < i.wooStock ? 'var(--warning)' : null)}</td>
              <td class="num">${stockCell(i.reserved, i.reserved ? 'var(--warning)' : null)}</td>
              <td class="num">${stockCell(i.allocatable)}</td>
              <td class="num t-muted">${fa(i.safety)}</td>
              <td>
                ${i.conflict
                  ? `<div class="u-col gap-4" style="align-items:flex-start">
                       <span class="badge badge--danger">${escapeHtml(CONFLICT_LABELS[i.conflict] || 'تداخل')}</span>
                       <span class="t-faint" style="font-size:10px">${i.conflict === 'remote_stock_drop' ? 'همگام‌سازی معکوس متوقف شده' : 'ویرایش روی همه تنوع‌ها اثر دارد'}</span>
                     </div>`
                  : '<span class="badge badge--success">بدون تداخل</span>'}
              </td>
              <td><span class="t-muted" style="font-size:11px">${relTime(i.updatedAt)}</span></td>
              <td class="actions">
                <div class="row-actions">
                  <button class="row-action" data-history="${i.id}" aria-label="تاریخچه">${icon('history')}</button>
                  <button class="row-action" data-reserve="${i.id}" aria-label="رزرو">${icon('lock')}</button>
                  ${i.reserved ? `<button class="row-action is-danger" data-release="${i.id}" aria-label="آزادسازی">${icon('lock-open')}</button>` : ''}
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${paginationBar({ page: state.data.page, pages: state.data.pages, total: state.data.total, perPage: state.data.per_page, label: 'محصول' })}`;
  refreshIcons(host);

  bindPagination(host, (page) => { state.page = page; load(root); });

  host.querySelectorAll('[data-reserve]').forEach((btn) => {
    btn.addEventListener('click', () => openReserve(root, btn.dataset.reserve));
  });
  host.querySelectorAll('[data-release]').forEach((btn) => {
    btn.addEventListener('click', () => release(root, btn.dataset.release));
  });
  host.querySelectorAll('[data-history]').forEach((btn) => {
    btn.addEventListener('click', () => openHistory(btn.dataset.history));
  });
}

function openReserve(root, id) {
  const item = state.data.items.find((i) => i.id === id);
  if (!item) return;
  openModal({
    title: 'ایجاد رزرو موجودی',
    desc: `${escapeHtml(item.name)} — قابل تخصیص: ${fa(item.allocatable)} عدد`,
    iconName: 'lock',
    body: `
      <div class="alert alert--info">${icon('info')}<div class="alert__text">
        رزرو، موجودی را برای سفارش‌های در انتظار نگه می‌دارد و از فروش بیش از موجودی جلوگیری می‌کند. رزرو روی موجودی ووکامرس اثری ندارد.
      </div></div>
      <div class="field" style="margin-top:14px">
        <label class="field__label">تعداد رزرو</label>
        <div class="input-group">
          <input class="input" id="reserve-qty" inputmode="numeric" placeholder="مثلاً ۳" />
          <span class="input-group__suffix">عدد</span>
        </div>
        <div class="field__hint">حداکثر ${fa(item.allocatable)} عدد قابل رزرو است.</div>
      </div>`,
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-cancel>انصراف</button><button class="btn btn--primary" data-save>ایجاد رزرو</button>',
    onMount: (h) => {
      h.root.querySelector('[data-cancel]').addEventListener('click', h.close);
      h.root.querySelector('[data-save]').addEventListener('click', async (e) => {
        const qty = parseNumber(h.root.querySelector('#reserve-qty').value);
        if (!Number.isFinite(qty) || qty <= 0) {
          toast({ title: 'تعداد معتبر نیست', tone: 'warning' });
          return;
        }
        const btn = e.currentTarget;
        setBusy(btn, true);
        try {
          await api.post(`/inventory/${id}/reserve`, { qty });
          h.close();
          toast({ title: 'رزرو ایجاد شد', text: `${fa(qty)} عدد برای این محصول رزرو شد.`, tone: 'success' });
          load(root);
          loadStats(root);
        } catch (err) {
          setBusy(btn, false);
          toast({ title: 'رزرو ناموفق بود', text: err.message, tone: 'error' });
        }
      });
    },
  });
}

async function release(root, id) {
  const item = state.data.items.find((i) => i.id === id);
  const ok = await confirmDialog({
    title: 'آزادسازی رزرو',
    desc: `${fa(item?.reserved || 0)} عدد رزروشده برای «${item?.name || ''}» آزاد می‌شود.`,
    details: 'پس از آزادسازی، این تعداد دوباره در موجودی قابل تخصیص قرار می‌گیرد.',
    confirmText: 'آزادسازی رزرو',
    tone: 'danger',
    iconName: 'lock-open',
  });
  if (!ok) return;
  try {
    await api.post(`/inventory/${id}/release`);
    toast({ title: 'رزرو آزاد شد', tone: 'success' });
    load(root);
    loadStats(root);
  } catch (err) {
    toast({ title: 'آزادسازی ناموفق بود', text: err.message, tone: 'error' });
  }
}

function openHistory(id) {
  const item = state.data.items.find((i) => i.id === id);
  if (!item) return;
  const entries = [
    { title: 'دریافت موجودی از اسنپ‌شاپ', meta: `${fa(item.snappStock)} عدد — ${relTime(item.updatedAt)}`, tone: 'brand' },
    { title: 'رزرو موجودی برای سفارش', meta: `${fa(item.reserved)} عدد رزروشده`, tone: item.reserved ? 'success' : '' },
    { title: 'همگام‌سازی با ووکامرس', meta: `موجودی ووکامرس: ${fa(item.wooStock)} عدد`, tone: '' },
    ...(item.conflict ? [{ title: 'تشخیص تداخل موجودی', meta: CONFLICT_LABELS[item.conflict], tone: 'danger' }] : []),
    { title: 'آخرین تغییر دستی', meta: `${formatDate(item.updatedAt, { time: true })} — مدیر فروشگاه`, tone: '' },
  ];
  const handle = openDrawer({
    title: 'تاریخچه موجودی',
    sub: escapeHtml(item.name),
    body: `
      <div class="detail-grid" style="margin-bottom:14px">
        <div class="detail-box"><div class="detail-box__label">موجودی اسنپ‌شاپ</div><div class="detail-box__value">${fa(item.snappStock)}</div></div>
        <div class="detail-box"><div class="detail-box__label">موجودی ووکامرس</div><div class="detail-box__value">${fa(item.wooStock)}</div></div>
        <div class="detail-box"><div class="detail-box__label">رزروشده</div><div class="detail-box__value">${fa(item.reserved)}</div></div>
        <div class="detail-box"><div class="detail-box__label">قابل تخصیص</div><div class="detail-box__value">${fa(item.allocatable)}</div></div>
      </div>
      ${item.conflict ? `<div class="alert alert--warning" style="margin-bottom:14px">${icon('triangle-alert')}<div>
        <div class="alert__title">${CONFLICT_LABELS[item.conflict]}</div>
        <div class="alert__text">${item.conflict === 'remote_stock_drop'
          ? 'موجودی اسنپ‌شاپ کمتر از موجودی ووکامرس است. تا زمان رفع تداخل، همگام‌سازی معکوس اجرا نمی‌شود.'
          : 'این تنوع موجودی مستقل ندارد و از موجودی محصول اصلی استفاده می‌کند.'}</div>
      </div></div>` : ''}
      <div class="timeline">
        ${entries.map((e) => `
          <div class="timeline__item">
            <span class="timeline__dot ${e.tone ? `is-${e.tone}` : ''}"></span>
            <div class="timeline__title">${escapeHtml(e.title)}</div>
            <div class="timeline__meta">${escapeHtml(e.meta)}</div>
          </div>`).join('')}
      </div>`,
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-close>بستن</button>',
  });
  refreshIcons(handle.root);
  handle.footer.querySelector('[data-close]').addEventListener('click', handle.close);
}

export async function render(root, ctx) {
  state = initial(ctx.params);
  root.innerHTML = `
    ${pageHead({
      title: 'مدیریت موجودی',
      sub: 'موجودی ووکامرس، اسنپ‌شاپ، رزروها و تداخل‌های موجودی',
      actions: `<button class="btn btn--secondary" id="inv-refresh">${icon('refresh-cw')}<span>بروزرسانی</span></button>`,
    })}
    <div class="stats-grid" id="inv-stats">
      ${Array.from({ length: 5 }).map(() => `<article class="stat"><div class="skeleton sk-line" style="width:60%"></div><div class="skeleton sk-line sk-line--lg" style="width:40%;height:20px"></div></article>`).join('')}
    </div>
    <div class="section-gap">
      ${card({
        flush: true,
        body: `
          <div class="table-toolbar">
            <div class="search-box" style="min-width:240px">
              ${icon('search')}
              <input class="input" id="inv-search" placeholder="جست‌وجوی محصول یا SKU…" />
            </div>
            <button class="chip ${state.conflict ? 'is-active' : ''}" id="inv-conflict">${icon('triangle-alert')} فقط تداخل‌ها</button>
            <div class="table-toolbar__right">
              <span class="t-muted" style="font-size:11px">موجودی‌ها از آخرین همگام‌سازی خوانده می‌شوند</span>
            </div>
          </div>
          <div id="inv-table"></div>`,
      })}
    </div>`;
  refreshIcons(root);

  let t;
  root.querySelector('#inv-search').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.search = e.target.value; state.page = 1; load(root); }, 280);
  });
  root.querySelector('#inv-conflict').addEventListener('click', () => {
    state.conflict = !state.conflict;
    root.querySelector('#inv-conflict').classList.toggle('is-active', state.conflict);
    state.page = 1;
    load(root);
  });
  root.querySelector('#inv-refresh').addEventListener('click', () => {
    loadStats(root);
    load(root);
    toast({ title: 'موجودی‌ها بروزرسانی شد', tone: 'success', duration: 2000 });
  });

  await Promise.all([loadStats(root), load(root)]);
}
