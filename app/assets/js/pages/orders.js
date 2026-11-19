import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openDrawer, openModal, confirmDialog,
  skeletonRows, emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, relTime, money as fmtMoney } from '../core/utils.js';
import {
  pageHead, card, paginationBar, bindPagination, moneyCell,
} from '../components/common.js';

let state = null;

function initial() {
  return {
    page: 1,
    perPage: 20,
    search: '',
    status: 'all',
    imported: 'all',
    from: '',
    to: '',
    data: null,
    loading: true,
  };
}

const STATUS_OPTIONS = [
  ['all', 'همه وضعیت‌ها'], ['new', 'جدید'], ['processing', 'در حال پردازش'],
  ['shipped', 'ارسال‌شده'], ['delivered', 'تحویل‌شده'], ['canceled', 'لغوشده'], ['returned', 'مرجوعی'],
];

async function load(root) {
  state.loading = true;
  const host = root.querySelector('#orders-table');
  host.innerHTML = `<div class="table-wrap"><table class="table"><tbody>${skeletonRows(7, 10)}</tbody></table></div>`;
  refreshIcons(root);
  try {
    const data = await api.get('/orders', {
      page: state.page, per_page: state.perPage, search: state.search,
      status: state.status, imported: state.imported, from: state.from, to: state.to,
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

function paint(root) {
  const { items } = state.data;
  const host = root.querySelector('#orders-table');
  if (!items.length) {
    host.innerHTML = emptyState({
      iconName: 'shopping-bag',
      title: 'سفارشی پیدا نشد',
      text: 'بازه زمانی یا فیلترها را تغییر دهید. سفارش‌ها پس از همگام‌سازی با اسنپ‌شاپ اینجا نمایش داده می‌شوند.',
      action: `<button class="btn btn--secondary btn--sm" data-reset>${icon('rotate-ccw')} حذف فیلترها</button>`,
    });
    refreshIcons(host);
    host.querySelector('[data-reset]')?.addEventListener('click', () => {
      state = initial();
      root.querySelector('#orders-filter').innerHTML = filterBar();
      bindFilters(root);
      load(root);
    });
    return;
  }
  host.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>شماره سفارش اسنپ‌شاپ</th>
          <th>سفارش ووکامرس</th>
          <th>تاریخ</th>
          <th>مبلغ</th>
          <th>وضعیت</th>
          <th>ورود به ووکامرس</th>
          <th style="text-align:end">عملیات</th>
        </tr></thead>
        <tbody>
          ${items.map((o) => `
            <tr data-order="${o.id}" style="cursor:pointer">
              <td>
                <div class="cell-stack">
                  <span class="cell-stack__main t-mono">${escapeHtml(o.snappOrderId)}</span>
                  <span class="cell-stack__sub">${escapeHtml(o.customer.name)} — ${escapeHtml(o.customer.city)}</span>
                </div>
              </td>
              <td>${o.wooOrderId ? `<span class="t-mono t-muted">#${fa(o.wooOrderId)}</span>` : '<span class="t-faint" style="font-size:11px">—</span>'}</td>
              <td><div class="cell-stack"><span class="cell-stack__main" style="font-size:11.5px">${formatDate(o.createdAt, { time: true })}</span><span class="cell-stack__sub">${relTime(o.createdAt)}</span></div></td>
              <td class="num">${o.amount ? moneyCell(o.amount) : '<span class="badge badge--warning">نامشخص</span>'}</td>
              <td>${badge(o.status)}</td>
              <td>${badge(o.imported, { text: o.imported === 'imported' ? 'وارد شده' : o.imported === 'pending' ? 'در انتظار' : 'ناموفق' })}</td>
              <td class="actions">
                <div class="row-actions">
                  <button class="row-action" data-view-order="${o.id}" aria-label="جزئیات">${icon('eye')}</button>
                  ${o.imported !== 'imported'
                    ? `<button class="row-action" data-import-order="${o.id}" aria-label="واردسازی به ووکامرس">${icon('download')}</button>`
                    : `<button class="row-action" data-refetch-order="${o.id}" aria-label="دریافت مجدد">${icon('refresh-cw')}</button>`}
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${paginationBar({ page: state.data.page, pages: state.data.pages, total: state.data.total, perPage: state.data.per_page, label: 'سفارش' })}`;
  refreshIcons(host);

  bindPagination(host, (page) => { state.page = page; load(root); });

  host.querySelectorAll('[data-order]').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      openOrder(root, row.dataset.order);
    });
  });
  host.querySelectorAll('[data-view-order]').forEach((btn) => {
    btn.addEventListener('click', () => openOrder(root, btn.dataset.viewOrder));
  });
  host.querySelectorAll('[data-import-order]').forEach((btn) => {
    btn.addEventListener('click', () => importOrder(root, btn.dataset.importOrder));
  });
  host.querySelectorAll('[data-refetch-order]').forEach((btn) => {
    btn.addEventListener('click', () => refetchOrder(root, btn.dataset.refetchOrder));
  });
}

function filterBar() {
  return `
    <div class="table-toolbar">
      <div class="search-box" style="min-width:220px">
        ${icon('search')}
        <input class="input" id="order-search" placeholder="شماره سفارش یا مشتری…" value="${escapeHtml(state.search)}" />
      </div>
      <select class="select" id="order-status" style="width:auto">
        ${STATUS_OPTIONS.map(([v, l]) => `<option value="${v}" ${state.status === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select class="select" id="order-imported" style="width:auto">
        <option value="all">همه (ووکامرس)</option>
        <option value="imported" ${state.imported === 'imported' ? 'selected' : ''}>وارد شده</option>
        <option value="pending" ${state.imported === 'pending' ? 'selected' : ''}>در انتظار</option>
        <option value="failed" ${state.imported === 'failed' ? 'selected' : ''}>ناموفق</option>
      </select>
      <div class="u-row gap-6">
        <input class="input" type="date" id="order-from" value="${state.from}" style="width:auto" aria-label="از تاریخ" />
        <span class="t-faint">تا</span>
        <input class="input" type="date" id="order-to" value="${state.to}" style="width:auto" aria-label="تا تاریخ" />
      </div>
      <div class="table-toolbar__right">
        <button class="btn btn--ghost btn--sm" id="order-clear">${icon('rotate-ccw')} پاک کردن</button>
      </div>
    </div>`;
}

function bindFilters(root) {
  let t;
  root.querySelector('#order-search').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.search = e.target.value; state.page = 1; load(root); }, 280);
  });
  ['status', 'imported', 'from', 'to'].forEach((key) => {
    const id = key === 'imported' ? '#order-imported' : `#order-${key}`;
    root.querySelector(id)?.addEventListener('change', (e) => {
      state[key] = e.target.value;
      state.page = 1;
      load(root);
    });
  });
  root.querySelector('#order-clear').addEventListener('click', () => {
    state = initial();
    root.querySelector('#orders-filter').innerHTML = filterBar();
    bindFilters(root);
    load(root);
  });
}

async function openOrder(root, id) {
  const handle = openDrawer({
    title: 'جزئیات سفارش',
    sub: 'اطلاعات مجاز سفارش و وضعیت ورود به ووکامرس',
    size: 'lg',
    body: '<div class="stack-12">' + Array.from({ length: 6 }).map(() => '<div class="skeleton sk-line" style="height:34px"></div>').join('') + '</div>',
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-close>بستن</button>',
  });
  refreshIcons(handle.root);
  handle.footer.querySelector('[data-close]').addEventListener('click', handle.close);

  let order;
  try {
    order = await api.get(`/orders/${id}`);
  } catch (err) {
    handle.body.innerHTML = errorState({ text: err.message });
    refreshIcons(handle.body);
    return;
  }

  const itemsTotal = order.items.reduce((sum, it) => sum + Number(it.unitPrice) * it.qty, 0);
  handle.body.innerHTML = `
    <div class="detail-hero">
      <div class="modal__icon" style="width:38px;height:38px">${icon('receipt-text')}</div>
      <div class="u-grow">
        <div style="font-size:14px;font-weight:650"><span class="t-mono">${escapeHtml(order.snappOrderId)}</span></div>
        <div class="t-muted" style="font-size:11.5px;margin-top:2px">${formatDate(order.createdAt, { time: true })}</div>
        <div class="u-row gap-6" style="margin-top:6px">${badge(order.status)}${badge(order.imported, { text: order.imported === 'imported' ? 'وارد ووکامرس شده' : order.imported === 'pending' ? 'در انتظار ورود' : 'ورود ناموفق' })}</div>
      </div>
    </div>

    <div class="detail-grid" style="margin:14px 0">
      <div class="detail-box"><div class="detail-box__label">سفارش ووکامرس</div><div class="detail-box__value">${order.wooOrderId ? `<span class="t-mono">#${fa(order.wooOrderId)}</span>` : 'ثبت نشده'}</div></div>
      <div class="detail-box"><div class="detail-box__label">مبلغ سفارش</div><div class="detail-box__value">${order.amount ? `${fa(Number(order.amount))} تومان` : '<span class="badge badge--warning">نامشخص</span>'}</div></div>
    </div>

    <div class="t-section-title" style="margin-bottom:6px">مشتری</div>
    <div class="card" style="box-shadow:none;margin-bottom:14px">
      <div class="card__body">
        <dl class="kv-list">
          <div><dt>نام</dt><dd>${escapeHtml(order.customer.name)}</dd></div>
          <div><dt>شماره تماس</dt><dd><span class="t-mono">${escapeHtml(order.customer.phone)}</span></dd></div>
          <div><dt>شهر</dt><dd>${escapeHtml(order.customer.city)}</dd></div>
          <div><dt>نشانی</dt><dd style="font-weight:400;color:var(--muted);font-size:11.5px;max-width:230px;text-align:end">${escapeHtml(order.customer.addressMasked)}</dd></div>
        </dl>
      </div>
    </div>

    <div class="u-between" style="margin-bottom:6px">
      <div class="t-section-title">اقلام سفارش</div>
      <span class="badge badge--neutral">${fa(order.items.length)} قلم</span>
    </div>
    <div class="order-items" style="margin-bottom:14px">
      ${order.items.map((it) => `
        <div class="order-item">
          <div class="thumb" style="width:26px;height:26px;font-size:9px;background:${'var(--brand-soft)'};color:var(--brand-ink)">${fa(it.qty)}</div>
          <div class="u-grow" style="min-width:0">
            <div class="t-clamp" style="font-size:12px">${escapeHtml(it.name)}</div>
            <div class="t-mono t-muted" style="font-size:10px">${escapeHtml(it.sku || '—')}</div>
          </div>
          <div class="order-item__price">${fmtMoney(it.unitPrice)}</div>
        </div>`).join('')}
      <div class="order-item" style="background:var(--bg-elevated)">
        <span class="t-muted" style="font-size:11.5px">جمع اقلام</span>
        <span class="order-item__price">${fa(itemsTotal)} تومان</span>
      </div>
    </div>

    <div class="t-section-title" style="margin-bottom:8px">تاریخچه</div>
    <div class="timeline">
      ${order.timeline.map((t) => `
        <div class="timeline__item">
          <span class="timeline__dot ${t.tone ? `is-${t.tone}` : ''}"></span>
          <div class="timeline__title">${escapeHtml(t.title)}</div>
          <div class="timeline__meta">${formatDate(t.time, { time: true })}</div>
        </div>`).join('')}
    </div>

    <div class="alert alert--info" style="margin-top:14px">${icon('info')}<div class="alert__text">
      تغییر وضعیت سفارش یا استرداد وجه از این پنل انجام نمی‌شود؛ این عملیات فقط در پنل فروشنده اسنپ‌شاپ امکان‌پذیر است.
      ${order.canceled ? ' این سفارش در اسنپ‌شاپ لغو شده است.' : ''}
    </div></div>
  `;
  refreshIcons(handle.body);

  handle.footer.innerHTML = `
    <button class="btn btn--secondary btn--sm" data-close>بستن</button>
    <div style="flex:1"></div>
    <button class="btn btn--secondary btn--sm" data-refetch>${icon('refresh-cw')} دریافت مجدد</button>
    ${order.imported !== 'imported' ? `<button class="btn btn--primary btn--sm" data-import>${icon('download')} واردسازی به ووکامرس</button>` : ''}`;
  refreshIcons(handle.footer);
  handle.footer.querySelector('[data-close]').addEventListener('click', handle.close);
  handle.footer.querySelector('[data-refetch]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    setBusy(btn, true);
    try {
      await api.post(`/orders/${order.id}/refetch`);
      toast({ title: 'سفارش دریافت مجدد شد', tone: 'success' });
      handle.close();
      load(root);
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'دریافت مجدد ناموفق بود', text: err.message, tone: 'error' });
    }
  });
  handle.footer.querySelector('[data-import]')?.addEventListener('click', () => {
    handle.close();
    importOrder(root, order.id);
  });
}

async function importOrder(root, id) {
  const order = state.data.items.find((o) => o.id === id);
  const ok = await confirmDialog({
    title: 'واردسازی سفارش به ووکامرس',
    desc: `سفارش ${order?.snappOrderId || ''} به‌عنوان یک سفارش جدید در ووکامرس ثبت می‌شود.`,
    details: 'این عملیات سفارش، اقلام و اطلاعات مجاز مشتری را ایجاد می‌کند و قابل بازگشت خودکار نیست.',
    confirmText: 'واردسازی سفارش',
    iconName: 'download',
  });
  if (!ok) return;
  try {
    const res = await api.post(`/orders/${id}/import`);
    toast({ title: 'سفارش به ووکامرس وارد شد', text: `شماره سفارش ووکامرس: #${fa(res.order.wooOrderId)}`, tone: 'success' });
    load(root);
  } catch (err) {
    toast({ title: 'واردسازی ناموفق بود', text: err.message, tone: 'error' });
  }
}

async function refetchOrder(root, id) {
  try {
    await api.post(`/orders/${id}/refetch`);
    toast({ title: 'سفارش دریافت مجدد شد', tone: 'success' });
    load(root);
  } catch (err) {
    toast({ title: 'دریافت مجدد ناموفق بود', text: err.message, tone: 'error' });
  }
}

export async function render(root) {
  state = initial();
  root.innerHTML = `
    ${pageHead({
      title: 'سفارش‌ها',
      sub: 'سفارش‌های دریافت‌شده از اسنپ‌شاپ و وضعیت ورود به ووکامرس',
      actions: `
        <button class="btn btn--secondary" id="orders-export">${icon('file-down')}<span>خروجی CSV</span></button>
        <button class="btn btn--primary" id="orders-fetch">${icon('download')}<span>دریافت سفارش‌های جدید</span></button>`,
    })}
    ${card({ flush: true, body: `<div id="orders-filter">${filterBar()}</div><div id="orders-table"></div>` })}
  `;
  refreshIcons(root);
  bindFilters(root);

  root.querySelector('#orders-export').addEventListener('click', () => { window.location.hash = '#/data?export=csv'; });
  root.querySelector('#orders-fetch').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    setBusy(btn, true);
    try {
      const { job } = await api.post('/sync/scan');
      toast({ title: 'دریافت سفارش‌ها شروع شد', text: `عملیات ${job.id} در صف قرار گرفت.`, tone: 'success' });
      window.location.hash = '#/jobs';
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'دریافت ناموفق بود', text: err.message, tone: 'error' });
    }
  });

  await load(root);
}
