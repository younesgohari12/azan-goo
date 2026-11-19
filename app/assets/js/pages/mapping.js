import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openModal, openDrawer, confirmDialog,
  skeletonRows, emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, relTime, gradientFor, debounce } from '../core/utils.js';
import {
  pageHead, card, paginationBar, bindPagination, tabs,
} from '../components/common.js';

let state = null;

function initial(params) {
  return {
    tab: params.get('tab') || 'all',
    search: params.get('search') || '',
    page: 1,
    perPage: 20,
    data: null,
    loading: true,
  };
}

function headerRow() {
  return `
    <div class="map-compare" style="background:var(--bg-elevated);border-bottom:1px solid var(--border);padding-block:6px">
      <div class="t-label">محصول اسنپ‌شاپ</div>
      <div></div>
      <div class="t-label">محصول یا تنوع ووکامرس</div>
    </div>`;
}

function rowMarkup(p) {
  const linked = Boolean(p.woo);
  return `
    <div class="map-compare" data-map-row="${p.id}">
      <div class="map-side">
        <div class="thumb" style="background:${gradientFor(p.name)}">${escapeHtml(p.name.slice(0, 2))}</div>
        <div class="map-side__body">
          <div class="map-side__name">${escapeHtml(p.name)}</div>
          <div class="map-side__meta">
            <span class="t-mono">${escapeHtml(p.snappId || '—')}</span>
            <span>·</span>
            <span class="t-mono">${escapeHtml(p.sku || 'بدون SKU')}</span>
            ${badge(p.mapping, { dot: false })}
          </div>
        </div>
      </div>
      <div class="map-link ${linked ? (p.mapping === 'conflict' ? 'is-conflict' : 'is-linked') : ''}" title="${linked ? 'نگاشت برقرار است' : 'بدون نگاشت'}">
        ${icon(linked ? (p.mapping === 'conflict' ? 'unlink-2' : 'link-2') : 'minus')}
      </div>
      <div class="map-side ${linked ? '' : 'is-empty'}">
        ${linked ? `
          <div class="thumb" style="background:${gradientFor(p.woo.name)}">${escapeHtml(p.woo.name.slice(0, 2))}</div>
          <div class="map-side__body">
            <div class="map-side__name">${escapeHtml(p.woo.name)}</div>
            <div class="map-side__meta">
              <span>${p.woo.kind === 'variation' ? 'تنوع' : 'محصول'} <span class="t-mono">#${fa(p.woo.id)}</span></span>
              ${p.woo.parentId ? `<span>· والد <span class="t-mono">#${fa(p.woo.parentId)}</span></span>` : ''}
            </div>
          </div>
        ` : `
          <div class="map-side__body">
            <div class="map-empty-slot">${icon('link-2')} هنوز به ووکامرس متصل نشده</div>
          </div>
        `}
        <div class="row-actions" style="margin-inline-start:auto">
          ${linked
            ? `<button class="row-action" data-relink="${p.id}" aria-label="ویرایش نگاشت">${icon('pencil')}</button>
               <button class="row-action is-danger" data-unlink="${p.id}" aria-label="حذف نگاشت">${icon('unlink')}</button>`
            : `<button class="btn btn--soft btn--sm" data-link="${p.id}">${icon('plus')} اتصال</button>`}
        </div>
      </div>
    </div>`;
}

async function load(root) {
  state.loading = true;
  const list = root.querySelector('#map-list');
  list.innerHTML = `<div class="table-wrap"><table class="table"><tbody>${skeletonRows(3, 8)}</tbody></table></div>`;
  refreshIcons(root);
  try {
    const data = await api.get('/mapping', {
      tab: state.tab, search: state.search, page: state.page, per_page: state.perPage,
    });
    state.data = data;
    state.loading = false;
    paint(root);
  } catch (err) {
    state.loading = false;
    list.innerHTML = errorState({ text: err.message });
    refreshIcons(list);
    list.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function paint(root) {
  const { counts, items } = state.data;
  root.querySelector('#map-tabs').innerHTML = tabs({
    name: 'mapping',
    active: state.tab,
    items: [
      { key: 'all', label: 'همه محصولات', count: counts.all },
      { key: 'unmapped', label: 'بدون نگاشت', count: counts.unmapped, iconName: 'unlink' },
      { key: 'ambiguous', label: 'مبهم و تکراری', count: counts.ambiguous, iconName: 'copy' },
      { key: 'conflict', label: 'تداخل', count: counts.conflict, iconName: 'triangle-alert' },
      { key: 'mapped', label: 'نگاشت‌شده', count: counts.mapped, iconName: 'link-2' },
    ],
  });
  refreshIcons(root.querySelector('#map-tabs'));
  root.querySelectorAll('#map-tabs [data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.tab = btn.dataset.tab;
      state.page = 1;
      load(root);
    });
  });

  const list = root.querySelector('#map-list');
  list.innerHTML = items.length
    ? `${headerRow()}${items.map(rowMarkup).join('')}
       ${paginationBar({ page: state.data.page, pages: state.data.pages, total: state.data.total, perPage: state.data.per_page, label: 'محصول' })}`
    : emptyState({
      iconName: state.tab === 'unmapped' ? 'party-popper' : 'search-x',
      title: state.tab === 'unmapped' ? 'همه محصولات نگاشت شده‌اند' : 'موردی پیدا نشد',
      text: state.tab === 'unmapped'
        ? 'هیچ محصول بدون نگاشتی باقی نمانده است. با تغییر SKU یا افزودن محصول جدید، موارد جدید اینجا نمایش داده می‌شوند.'
        : 'عبارت جست‌وجو را تغییر دهید یا تب دیگری را انتخاب کنید.',
      action: state.tab === 'unmapped'
        ? `<button class="btn btn--secondary btn--sm" data-auto>${icon('wand-2')} نگاشت خودکار بر اساس SKU</button>` : '',
    });
  refreshIcons(list);

  list.querySelector('[data-auto]')?.addEventListener('click', () => autoMap(root));
  bindPagination(list, (page) => { state.page = page; load(root); });

  list.querySelectorAll('[data-link]').forEach((btn) => {
    btn.addEventListener('click', () => openLinkModal(root, btn.dataset.link));
  });
  list.querySelectorAll('[data-relink]').forEach((btn) => {
    btn.addEventListener('click', () => openLinkModal(root, btn.dataset.relink));
  });
  list.querySelectorAll('[data-unlink]').forEach((btn) => {
    btn.addEventListener('click', () => unlink(root, btn.dataset.unlink));
  });
}

async function autoMap(root) {
  const ok = await confirmDialog({
    title: 'نگاشت خودکار بر اساس SKU',
    desc: 'همه محصولات بدون نگاشت بررسی می‌شوند و در صورت وجود SKU یکتا و منطبق در ووکامرس، به‌صورت خودکار متصل می‌شوند.',
    details: 'موارد تکراری یا بدون SKU نادیده گرفته می‌شوند و برای بررسی دستی باقی می‌مانند.',
    confirmText: 'شروع نگاشت خودکار',
    iconName: 'wand-2',
  });
  if (!ok) return;
  try {
    const res = await api.post('/mapping/auto');
    toast({
      title: 'نگاشت خودکار انجام شد',
      text: `${fa(res.linked)} محصول متصل شد${res.skipped ? ` — ${fa(res.skipped)} مورد نیازمند بررسی دستی است` : ''}.`,
      tone: res.linked ? 'success' : 'warning',
    });
    state.page = 1;
    load(root);
  } catch (err) {
    toast({ title: 'نگاشت خودکار ناموفق بود', text: err.message, tone: 'error' });
  }
}

async function openLinkModal(root, id) {
  const product = state.data.items.find((p) => p.id === id);
  if (!product) return;
  const handle = openModal({
    title: 'اتصال به محصول ووکامرس',
    desc: `محصول اسنپ‌شاپ: ${escapeHtml(product.name)}`,
    iconName: 'link-2',
    size: 'lg',
    body: `
      <div class="field">
        <label class="field__label">جست‌وجوی محصول یا تنوع ووکامرس</label>
        <div class="input-icon">
          ${icon('search')}
          <input class="input" id="woo-search" placeholder="نام یا SKU محصول ووکامرس…" value="${escapeHtml(product.sku || '')}" />
        </div>
        <div class="field__hint">SKU یکتا سریع‌ترین راه برای تطبیق دقیق است. تنوع‌ها با شناسه والد نمایش داده می‌شوند.</div>
      </div>
      <div id="woo-results" class="stack-6" style="margin-top:12px"></div>`,
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-cancel>انصراف</button>',
    onMount: (h) => {
      h.root.querySelector('[data-cancel]').addEventListener('click', h.close);
      const results = h.root.querySelector('#woo-results');
      const input = h.root.querySelector('#woo-search');
      const search = debounce(async (q) => {
        results.innerHTML = `<div class="skeleton sk-line" style="height:42px"></div><div class="skeleton sk-line" style="height:42px;margin-top:6px"></div>`;
        try {
          const { items } = await api.get('/woo-products', { search: q });
          results.innerHTML = items.length ? items.map((w) => `
            <button class="woo-pick" data-pick="${w.id}">
              <div class="thumb" style="background:${gradientFor(w.name)}">${escapeHtml(w.name.slice(0, 2))}</div>
              <div class="u-grow" style="min-width:0">
                <div class="map-side__name">${escapeHtml(w.name)}</div>
                <div class="map-side__meta">
                  <span>${w.kind === 'variation' ? 'تنوع' : 'محصول'} #${fa(w.id)}</span>
                  <span class="t-mono">${escapeHtml(w.sku || '—')}</span>
                </div>
              </div>
              ${icon('chevron-left')}
            </button>`).join('')
            : emptyState({ iconName: 'search-x', title: 'محصولی پیدا نشد', text: 'عبارت دیگری را امتحان کنید.' });
          refreshIcons(results);
          results.querySelectorAll('[data-pick]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              setBusy(btn, true);
              try {
                await api.post(`/mapping/${id}/link`, { wooId: btn.dataset.pick });
                h.close();
                toast({ title: 'نگاشت ایجاد شد', text: 'محصول اسنپ‌شاپ به محصول ووکامرس متصل شد.', tone: 'success' });
                load(root);
              } catch (err) {
                setBusy(btn, false);
                toast({ title: 'اتصال ناموفق بود', text: err.message, tone: 'error' });
              }
            });
          });
        } catch (err) {
          results.innerHTML = errorState({ text: err.message });
          refreshIcons(results);
        }
      }, 220);
      input.addEventListener('input', () => search(input.value));
      search(product.sku || '');
      setTimeout(() => input.focus(), 60);
    },
  });
  refreshIcons(handle.root);
}

async function unlink(root, id) {
  const product = state.data.items.find((p) => p.id === id);
  const ok = await confirmDialog({
    title: 'حذف نگاشت محصول',
    desc: 'ارتباط بین این محصول اسنپ‌شاپ و محصول ووکامرس قطع می‌شود.',
    details: 'هیچ محصولی از ووکامرس یا اسنپ‌شاپ حذف نمی‌شود. فقط همگام‌سازی قیمت و موجودی برای این محصول متوقف می‌شود و می‌توانید دوباره آن را متصل کنید.',
    confirmText: 'حذف نگاشت',
    tone: 'danger',
    iconName: 'unlink',
  });
  if (!ok) return;
  try {
    await api.del(`/mapping/${id}/link`);
    toast({ title: 'نگاشت حذف شد', text: `${product?.name || 'محصول'} از ووکامرس جدا شد؛ محصول حذف نشده است.`, tone: 'success' });
    load(root);
  } catch (err) {
    toast({ title: 'حذف نگاشت ناموفق بود', text: err.message, tone: 'error' });
  }
}

export async function render(root, ctx) {
  state = initial(ctx.params);
  root.innerHTML = `
    ${pageHead({
      title: 'نگاشت محصولات',
      sub: 'اتصال محصولات اسنپ‌شاپ به محصولات و تنوع‌های ووکامرس',
      actions: `
        <button class="btn btn--secondary" id="refresh-map">${icon('refresh-cw')}<span>بروزرسانی</span></button>
        <button class="btn btn--primary" id="auto-map">${icon('wand-2')}<span>نگاشت خودکار (SKU)</span></button>`,
    })}
    ${card({
      flush: true,
      body: `
        <div style="padding:10px 14px;border-bottom:1px solid var(--border)">
          <div class="search-box" style="max-width:340px">
            ${icon('search')}
            <input class="input" id="map-search" placeholder="جست‌وجوی نام، SKU یا شناسه…" value="${escapeHtml(state.search)}" />
          </div>
        </div>
        <div id="map-tabs"></div>
        <div id="map-list"></div>`,
    })}
  `;
  refreshIcons(root);

  root.querySelector('#auto-map').addEventListener('click', () => autoMap(root));
  root.querySelector('#refresh-map').addEventListener('click', () => load(root));
  let t;
  root.querySelector('#map-search').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.search = e.target.value; state.page = 1; load(root); }, 280);
  });

  await load(root);
}
