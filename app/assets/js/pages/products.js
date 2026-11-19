import { api } from '../core/api.js';
import { store } from '../core/store.js';
import {
  icon, refreshIcons, toast, badge, openModal, openDrawer, openMenu,
  confirmDialog, skeletonRows, emptyState, errorState, permissionState, setBusy, copyText,
} from '../core/ui.js';
import {
  fa, formatDate, relTime, escapeHtml, money as fmtMoney, parseNumber, gradientFor,
} from '../core/utils.js';
import {
  pageHead, card, paginationBar, bindPagination, moneyCell,
} from '../components/common.js';

const COLUMNS = [
  { key: 'name', label: 'محصول', always: true },
  { key: 'sku', label: 'SKU' },
  { key: 'snappId', label: 'شناسه اسنپ‌شاپ' },
  { key: 'woo', label: 'محصول ووکامرس' },
  { key: 'price', label: 'قیمت اسنپ‌شاپ' },
  { key: 'stock', label: 'موجودی' },
  { key: 'status', label: 'وضعیت محصول' },
  { key: 'mapping', label: 'وضعیت نگاشت' },
  { key: 'sync', label: 'وضعیت همگام‌سازی' },
  { key: 'updatedAt', label: 'آخرین بروزرسانی' },
];

const SORTABLE = new Set(['name', 'price', 'stock', 'updatedAt', 'sku']);

let state = null;

function initialState(params) {
  return {
    page: 1,
    perPage: 25,
    search: '',
    status: 'all',
    mapping: 'all',
    sync: 'all',
    category: 'all',
    issue: params.get('issue') === '1',
    sort: 'updatedAt',
    dir: 'desc',
    selected: new Set(),
    visible: new Set(COLUMNS.map((c) => c.key)),
    data: null,
    loading: false,
  };
}

function guard(cap, label) {
  if (store.can(cap)) return true;
  openModal({
    title: 'دسترسی کافی ندارید',
    body: permissionState({ cap: label }),
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-close>بستن</button>',
    onMount: (h) => h.root.querySelector('[data-close]').addEventListener('click', h.close),
  });
  return false;
}

function filterChips() {
  const chips = [];
  if (state.issue) chips.push({ key: 'issue', label: 'فقط موارد دارای مشکل' });
  if (state.status !== 'all') chips.push({ key: 'status', label: `وضعیت: ${state.status === 'active' ? 'فعال' : state.status === 'inactive' ? 'غیرفعال' : 'ناموجود'}` });
  if (state.mapping !== 'all') chips.push({ key: 'mapping', label: `نگاشت: ${state.mapping}` });
  if (state.sync !== 'all') chips.push({ key: 'sync', label: `همگام‌سازی: ${state.sync}` });
  if (state.category !== 'all') chips.push({ key: 'category', label: `دسته: ${state.category}` });
  return chips.map((c) => `
    <span class="chip is-active">${escapeHtml(c.label)}
      <button class="chip__x" data-clear-chip="${c.key}" aria-label="حذف فیلتر">${icon('x')}</button>
    </span>`).join('');
}

function toolbar() {
  return `
    <div class="table-toolbar">
      <div class="search-box" style="min-width:230px">
        ${icon('search')}
        <input class="input" id="product-search" placeholder="جست‌وجوی نام، SKU یا شناسه اسنپ‌شاپ…" value="${escapeHtml(state.search)}" />
      </div>
      <select class="select" id="filter-status" style="width:auto;min-width:118px" aria-label="وضعیت محصول">
        <option value="all">همه وضعیت‌ها</option>
        <option value="active" ${state.status === 'active' ? 'selected' : ''}>فعال</option>
        <option value="inactive" ${state.status === 'inactive' ? 'selected' : ''}>غیرفعال</option>
        <option value="out_of_stock" ${state.status === 'out_of_stock' ? 'selected' : ''}>ناموجود</option>
      </select>
      <select class="select" id="filter-mapping" style="width:auto;min-width:118px" aria-label="وضعیت نگاشت">
        <option value="all">همه نگاشت‌ها</option>
        <option value="mapped" ${state.mapping === 'mapped' ? 'selected' : ''}>نگاشت‌شده</option>
        <option value="unmapped" ${state.mapping === 'unmapped' ? 'selected' : ''}>بدون نگاشت</option>
        <option value="ambiguous" ${state.mapping === 'ambiguous' ? 'selected' : ''}>مبهم</option>
        <option value="conflict" ${state.mapping === 'conflict' ? 'selected' : ''}>تداخل</option>
      </select>
      <select class="select" id="filter-sync" style="width:auto;min-width:120px" aria-label="وضعیت همگام‌سازی">
        <option value="all">همه همگام‌سازی‌ها</option>
        <option value="synced" ${state.sync === 'synced' ? 'selected' : ''}>همگام</option>
        <option value="pending" ${state.sync === 'pending' ? 'selected' : ''}>در انتظار</option>
        <option value="stale" ${state.sync === 'stale' ? 'selected' : ''}>قدیمی</option>
        <option value="failed" ${state.sync === 'failed' ? 'selected' : ''}>ناموفق</option>
      </select>
      <button class="btn btn--secondary btn--sm" id="advanced-filter">${icon('sliders-horizontal')}<span>فیلتر پیشرفته</span></button>
      <div class="table-toolbar__right">
        ${filterChips()}
        <button class="btn btn--ghost btn--sm" id="columns-btn">${icon('columns-3')}<span>ستون‌ها</span></button>
      </div>
    </div>`;
}

function bulkBar() {
  if (!state.selected.size) return '';
  return `
    <div class="bulkbar">
      <span class="bulkbar__count">${fa(state.selected.size)} محصول انتخاب شد</span>
      <span class="t-muted">|</span>
      <button class="btn btn--soft btn--sm" data-bulk="price">${icon('badge-cent')} ویرایش قیمت</button>
      <button class="btn btn--soft btn--sm" data-bulk="stock">${icon('boxes')} ویرایش موجودی</button>
      <button class="btn btn--ghost btn--sm" data-bulk="refresh">${icon('refresh-cw')} دریافت مجدد</button>
      <div class="bulkbar__actions">
        <button class="btn btn--ghost btn--sm" data-bulk="clear">${icon('x')} پاک کردن</button>
      </div>
    </div>`;
}

function headerRow() {
  const cols = COLUMNS.filter((c) => state.visible.has(c.key));
  return `
    <tr>
      <th style="width:34px">
        <label class="check">
          <input type="checkbox" id="check-all" aria-label="انتخاب همه" />
          <span class="check__box">${icon('check')}</span>
        </label>
      </th>
      ${cols.map((c) => `
        <th>
          ${SORTABLE.has(c.key)
            ? `<button class="th-sort ${state.sort === c.key ? 'is-active' : ''}" data-sort="${c.key}">
                ${c.label}
                ${icon(state.sort === c.key ? (state.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'chevrons-up-down')}
              </button>`
            : c.label}
        </th>`).join('')}
      <th style="width:92px;text-align:end">عملیات</th>
    </tr>`;
}

function cellFor(product, key) {
  switch (key) {
    case 'name':
      return `
        <div class="cell-product">
          <div class="thumb" style="background:${gradientFor(product.name)}">${escapeHtml(product.name.slice(0, 2))}</div>
          <div style="min-width:0">
            <div class="cell-product__name t-clamp" style="max-width:250px">${escapeHtml(product.name)}</div>
            <div class="cell-product__meta">${escapeHtml(product.category)}${product.issue ? ` — <span style="color:var(--warning)">${escapeHtml(product.issue.title)}</span>` : ''}</div>
          </div>
        </div>`;
    case 'sku':
      return product.sku
        ? `<span class="t-mono">${escapeHtml(product.sku)}</span>`
        : '<span class="badge badge--warning">ثبت نشده</span>';
    case 'snappId':
      return product.snappId
        ? `<span class="t-mono">${escapeHtml(product.snappId)}</span>`
        : '<span class="t-faint" style="font-size:11px">—</span>';
    case 'woo':
      return product.woo
        ? `<div class="cell-stack">
             <span class="cell-stack__main t-clamp" style="max-width:190px">${escapeHtml(product.woo.name)}</span>
             <span class="cell-stack__sub">${product.woo.kind === 'variation' ? 'تنوع' : 'محصول'} <span class="t-mono">#${fa(product.woo.id)}</span>${product.woo.parentId ? ` — والد <span class="t-mono">#${fa(product.woo.parentId)}</span>` : ''}</span>
           </div>`
        : `<span class="badge badge--neutral">متصل نیست</span>`;
    case 'price':
      return `<div class="cell-stack">
          <span class="t-num">${fmtMoney(product.snappPrice)}</span>
          ${product.snappPrice !== product.price ? `<span class="cell-stack__sub">ووکامرس: ${fmtMoney(product.price)}</span>` : ''}
        </div>`;
    case 'stock':
      return `<div class="cell-stack">
          <span class="t-num" style="font-weight:${product.snappStock < product.stock ? '600' : '500'};color:${product.snappStock < product.stock ? 'var(--warning)' : 'inherit'}">${fa(product.snappStock)}</span>
          <span class="cell-stack__sub">ووکامرس: ${fa(product.stock)}${product.reserved ? ` — رزرو ${fa(product.reserved)}` : ''}</span>
        </div>`;
    case 'status':
      return badge(product.status);
    case 'mapping':
      return `<div class="u-row gap-6">
          ${badge(product.mapping)}
          ${product.issue ? `<button class="row-action" data-issue="${product.id}" aria-label="علت">${icon('info')}</button>` : ''}
        </div>`;
    case 'sync':
      return badge(product.sync);
    case 'updatedAt':
      return `<span class="t-muted" style="font-size:11px">${relTime(product.updatedAt)}</span>`;
    default:
      return '';
  }
}

function rowMarkup(product) {
  const cols = COLUMNS.filter((c) => state.visible.has(c.key));
  const selected = state.selected.has(product.id);
  return `
    <tr data-row="${product.id}" class="${selected ? 'is-selected' : ''}">
      <td>
        <label class="check" onclick="event.stopPropagation()">
          <input type="checkbox" data-select="${product.id}" ${selected ? 'checked' : ''} aria-label="انتخاب ${escapeHtml(product.name)}" />
          <span class="check__box">${icon('check')}</span>
        </label>
      </td>
      ${cols.map((c) => `<td class="${c.key === 'price' || c.key === 'stock' ? 'num' : ''}">${cellFor(product, c.key)}</td>`).join('')}
      <td class="actions">
        <div class="row-actions">
          <button class="row-action" data-view="${product.id}" aria-label="جزئیات">${icon('eye')}</button>
          <button class="row-action" data-refetch="${product.id}" aria-label="دریافت مجدد">${icon('refresh-cw')}</button>
          <button class="row-action" data-more="${product.id}" aria-label="عملیات بیشتر">${icon('ellipsis')}</button>
        </div>
      </td>
    </tr>`;
}

function tableMarkup() {
  if (state.loading) {
    return `
      <div class="table-wrap">
        <table class="table">
          <thead>${headerRow()}</thead>
          <tbody>${skeletonRows(COLUMNS.filter((c) => state.visible.has(c.key)).length + 2, 10)}</tbody>
        </table>
      </div>`;
  }
  if (!state.data) return '';
  if (!state.data.items.length) {
    return emptyState({
      iconName: 'package-search',
      title: 'محصولی با این فیلترها پیدا نشد',
      text: 'عبارت جست‌وجو یا فیلترها را تغییر دهید. ممکن است هنوز هیچ محصولی از اسنپ‌شاپ دریافت نشده باشد.',
      action: `<button class="btn btn--secondary btn--sm" data-reset>${icon('rotate-ccw')} پاک کردن فیلترها</button>
               <button class="btn btn--primary btn--sm" data-sync-now>${icon('refresh-cw')} دریافت محصولات</button>`,
    });
  }
  return `
    <div class="table-wrap">
      <table class="table">
        <thead>${headerRow()}</thead>
        <tbody>${state.data.items.map(rowMarkup).join('')}</tbody>
      </table>
    </div>
    ${paginationBar({ page: state.data.page, pages: state.data.pages, total: state.data.total, perPage: state.data.per_page, label: 'محصول' })}`;
}

function shellMarkup() {
  return `
    ${pageHead({
      title: 'محصولات',
      sub: 'مدیریت محصولات اسنپ‌شاپ، نگاشت ووکامرس، قیمت و موجودی',
      actions: `
        <button class="btn btn--secondary" id="export-btn">${icon('file-down')}<span>خروجی CSV</span></button>
        <button class="btn btn--primary" id="sync-products">${icon('refresh-cw')}<span>دریافت از اسنپ‌شاپ</span></button>`,
    })}
    ${card({
      flush: true,
      body: `<div id="products-toolbar">${toolbar()}</div><div id="products-bulk"></div><div id="products-table"></div>`,
    })}
  `;
}

async function load(root) {
  state.loading = true;
  root.querySelector('#products-bulk').innerHTML = bulkBar();
  root.querySelector('#products-table').innerHTML = tableMarkup();
  refreshIcons(root);

  try {
    const data = await api.get('/products', {
      page: state.page,
      per_page: state.perPage,
      search: state.search,
      status: state.status,
      mapping: state.mapping,
      sync: state.sync,
      category: state.category,
      issue: state.issue ? '1' : '',
      sort: state.sort,
      dir: state.dir,
    });
    state.data = data;
    state.loading = false;
    if (state.page > data.pages) state.page = data.pages;
    root.querySelector('#products-table').innerHTML = tableMarkup();
    refreshIcons(root);
    bindTable(root);
  } catch (err) {
    state.loading = false;
    root.querySelector('#products-table').innerHTML = errorState({ text: err.message });
    refreshIcons(root);
    root.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function refreshToolbar(root) {
  root.querySelector('#products-toolbar').innerHTML = toolbar();
  refreshIcons(root);
  bindToolbar(root);
  root.querySelector('#products-bulk').innerHTML = bulkBar();
  bindBulk(root);
}

function bindBulk(root) {
  root.querySelectorAll('[data-bulk]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.bulk;
      if (action === 'clear') {
        state.selected.clear();
        refreshToolbar(root);
        load(root);
        return;
      }
      if (action === 'refresh') return bulkRefresh(root);
      openBulkEdit(root, action);
    });
  });
}

function bindToolbar(root) {
  let searchTimer;
  root.querySelector('#product-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = e.target.value;
      state.page = 1;
      load(root);
    }, 280);
  });

  ['status', 'mapping', 'sync'].forEach((key) => {
    root.querySelector(`#filter-${key}`)?.addEventListener('change', (e) => {
      state[key] = e.target.value;
      state.page = 1;
      refreshToolbar(root);
      load(root);
    });
  });

  root.querySelector('#advanced-filter')?.addEventListener('click', () => openAdvancedFilter(root));

  root.querySelector('#columns-btn')?.addEventListener('click', (e) => {
    openMenu(e.currentTarget, [
      { label: 'ستون‌های نمایش‌داده‌شده' },
      ...COLUMNS.filter((c) => !c.always).map((c) => ({
        text: c.label,
        active: state.visible.has(c.key),
        iconName: state.visible.has(c.key) ? 'check' : 'square',
        onClick: () => {
          if (state.visible.has(c.key)) state.visible.delete(c.key);
          else state.visible.add(c.key);
          root.querySelector('#products-table').innerHTML = tableMarkup();
          refreshIcons(root);
          bindTable(root);
        },
      })),
    ], { width: 210 });
  });

  root.querySelectorAll('[data-clear-chip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.clearChip;
      if (key === 'issue') state.issue = false;
      else state[key] = 'all';
      state.page = 1;
      refreshToolbar(root);
      load(root);
    });
  });
}

function bindTable(root) {
  const all = root.querySelector('#check-all');
  if (all && state.data) {
    const ids = state.data.items.map((p) => p.id);
    const selectedOnPage = ids.filter((id) => state.selected.has(id)).length;
    all.checked = selectedOnPage > 0 && selectedOnPage === ids.length;
    all.indeterminate = selectedOnPage > 0 && selectedOnPage < ids.length;
    all.addEventListener('change', () => {
      ids.forEach((id) => {
        if (all.checked) state.selected.add(id);
        else state.selected.delete(id);
      });
      root.querySelector('#products-table').innerHTML = tableMarkup();
      refreshIcons(root);
      bindTable(root);
      root.querySelector('#products-bulk').innerHTML = bulkBar();
      bindBulk(root);
    });
  }

  root.querySelectorAll('[data-select]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.select;
      if (cb.checked) state.selected.add(id);
      else state.selected.delete(id);
      root.querySelector(`tr[data-row="${id}"]`)?.classList.toggle('is-selected', cb.checked);
      root.querySelector('#products-bulk').innerHTML = bulkBar();
      bindBulk(root);
      const head = root.querySelector('#check-all');
      if (head && state.data) {
        const ids = state.data.items.map((p) => p.id);
        const count = ids.filter((x) => state.selected.has(x)).length;
        head.checked = count === ids.length;
        head.indeterminate = count > 0 && count < ids.length;
      }
    });
  });

  root.querySelectorAll('[data-sort]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sort;
      if (state.sort === key) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
      else { state.sort = key; state.dir = 'asc'; }
      state.page = 1;
      load(root);
    });
  });

  root.querySelectorAll('[data-row]').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button, input, label, a')) return;
      openProductDrawer(root, row.dataset.row);
    });
  });

  root.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openProductDrawer(root, btn.dataset.view); });
  });

  root.querySelectorAll('[data-issue]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const product = state.data.items.find((p) => p.id === btn.dataset.issue);
      if (!product?.issue) return;
      openModal({
        title: product.issue.title,
        iconName: 'triangle-alert', iconTone: 'warning',
        body: `<p style="font-size:12.3px;line-height:1.9" class="t-muted">${escapeHtml(product.issue.detail)}</p>
               <div class="alert alert--warning" style="margin-top:12px">${icon('lightbulb')}<div>
                 <div class="alert__title">پیشنهاد</div>
                 <div class="alert__text">ابتدا نگاشت و موجودی ووکامرس را بررسی کنید، سپس «دریافت مجدد» را اجرا کنید.</div>
               </div></div>`,
        footer: '<div class="spacer"></div><button class="btn btn--secondary" data-close>بستن</button><button class="btn btn--primary" data-go-map>رفتن به نگاشت</button>',
        onMount: (h) => {
          h.root.querySelector('[data-close]').addEventListener('click', h.close);
          h.root.querySelector('[data-go-map]').addEventListener('click', () => {
            h.close();
            window.location.hash = '#/mapping?tab=unmapped';
          });
        },
      });
    });
  });

  root.querySelectorAll('[data-refetch]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!guard('products.write', 'دریافت مجدد محصول')) return;
      const id = btn.dataset.refetch;
      btn.classList.add('is-loading');
      btn.innerHTML = icon('loader-circle');
      refreshIcons(btn);
      try {
        await api.post(`/products/${id}/refresh`);
        toast({ title: 'اطلاعات محصول از اسنپ‌شاپ دریافت شد', tone: 'success' });
        load(root);
      } catch (err) {
        toast({ title: 'دریافت مجدد ناموفق بود', text: err.message, tone: 'error' });
        btn.classList.remove('is-loading');
        btn.innerHTML = icon('refresh-cw');
        refreshIcons(btn);
      }
    });
  });

  root.querySelectorAll('[data-more]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.more;
      const product = state.data.items.find((p) => p.id === id);
      openMenu(btn, [
        { text: 'مشاهده جزئیات', iconName: 'eye', onClick: () => openProductDrawer(root, id) },
        { text: 'ویرایش نگاشت', iconName: 'git-compare-arrows', onClick: () => { window.location.hash = '#/mapping?search=' + encodeURIComponent(product?.sku || ''); } },
        { text: 'کپی SKU', iconName: 'copy', onClick: () => copyText(product?.sku || '') },
        { text: 'ویرایش قیمت', iconName: 'badge-cent', onClick: () => { state.selected = new Set([id]); refreshToolbar(root); openBulkEdit(root, 'price'); } },
        { divider: true },
        { text: 'دریافت مجدد', iconName: 'refresh-cw', onClick: () => root.querySelector(`[data-refetch="${id}"]`)?.click() },
      ]);
    });
  });

  root.querySelector('[data-reset]')?.addEventListener('click', () => {
    state = { ...initialState(new URLSearchParams()), visible: state.visible, perPage: state.perPage };
    refreshToolbar(root);
    load(root);
  });

  root.querySelector('[data-sync-now]')?.addEventListener('click', () => root.querySelector('#sync-products')?.click());

  bindPagination(root, (page) => {
    state.page = page;
    load(root);
    root.querySelector('.card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function openAdvancedFilter(root) {
  const categories = ['لوازم جانبی موبایل', 'صوتی و تصویری', 'کامپیوتر و لپ‌تاپ', 'شبکه', 'لوازم اداری', 'گیمینگ'];
  openModal({
    title: 'فیلتر پیشرفته',
    desc: 'فیلترهای بیشتر روی نتیجه جست‌وجوی فعلی اعمال می‌شوند.',
    iconName: 'sliders-horizontal',
    body: `
      <div class="form-grid">
        <div class="field">
          <label class="field__label">دسته‌بندی</label>
          <select class="select" id="adv-category">
            <option value="all">همه دسته‌ها</option>
            ${categories.map((c) => `<option value="${c}" ${state.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field__label">وضعیت نگاشت</label>
          <select class="select" id="adv-mapping">
            <option value="all">همه</option>
            <option value="unmapped" ${state.mapping === 'unmapped' ? 'selected' : ''}>بدون نگاشت</option>
            <option value="ambiguous" ${state.mapping === 'ambiguous' ? 'selected' : ''}>مبهم</option>
            <option value="conflict" ${state.mapping === 'conflict' ? 'selected' : ''}>تداخل</option>
          </select>
        </div>
      </div>
      <label class="check" style="margin-top:14px">
        <input type="checkbox" id="adv-issue" ${state.issue ? 'checked' : ''} />
        <span class="check__box">${icon('check')}</span>
        فقط محصولات دارای مشکل یا تداخل
      </label>
      <div class="alert alert--info" style="margin-top:14px">${icon('info')}<div class="alert__text">فیلترها فقط روی داده‌های همین فروشگاه اعمال می‌شوند و روی اسنپ‌شاپ تغییری ایجاد نمی‌کنند.</div></div>`,
    footer: '<div class="spacer"></div><button class="btn btn--ghost" data-reset-filters>حذف فیلترها</button><button class="btn btn--primary" data-apply>اعمال فیلتر</button>',
    onMount: (h) => {
      h.root.querySelector('[data-apply]').addEventListener('click', () => {
        state.category = h.root.querySelector('#adv-category').value;
        state.mapping = h.root.querySelector('#adv-mapping').value;
        state.issue = h.root.querySelector('#adv-issue').checked;
        state.page = 1;
        h.close();
        refreshToolbar(root);
        load(root);
      });
      h.root.querySelector('[data-reset-filters]').addEventListener('click', () => {
        state.category = 'all';
        state.mapping = 'all';
        state.issue = false;
        state.page = 1;
        h.close();
        refreshToolbar(root);
        load(root);
      });
    },
  });
}

function openBulkEdit(root, kind) {
  if (!guard('products.write', 'ویرایش گروهی محصولات')) return;
  const count = state.selected.size;
  const isPrice = kind === 'price';
  openModal({
    title: isPrice ? 'ویرایش گروهی قیمت' : 'ویرایش گروهی موجودی',
    desc: `${fa(count)} محصول انتخاب‌شده — مقدار جدید روی همه اعمال می‌شود.`,
    iconName: isPrice ? 'badge-cent' : 'boxes',
    body: `
      <div class="alert alert--warning">${icon('triangle-alert')}<div class="alert__text">
        این تغییر روی اسنپ‌شاپ اعمال می‌شود و ممکن است با همگام‌سازی بعدی ووکامرس تداخل داشته باشد.
      </div></div>
      <div class="field" style="margin-top:14px">
        <label class="field__label">${isPrice ? 'قیمت جدید (تومان)' : 'موجودی جدید'}</label>
        <div class="input-group">
          <input class="input" id="bulk-value" inputmode="numeric" placeholder="${isPrice ? 'مثلاً ۲۴۹۰۰۰۰' : 'مثلاً ۲۵'}" />
          <span class="input-group__suffix">${isPrice ? 'تومان' : 'عدد'}</span>
        </div>
        <div class="field__hint">${isPrice ? 'قیمت پایه تومان است و بر ۱۰ تقسیم نمی‌شود.' : 'موجودی صفر، محصول را ناموجود می‌کند.'}</div>
      </div>`,
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-cancel>انصراف</button><button class="btn btn--primary" data-save>اعمال روی انتخاب‌شده‌ها</button>',
    onMount: (h) => {
      h.root.querySelector('[data-cancel]').addEventListener('click', h.close);
      h.root.querySelector('[data-save]').addEventListener('click', async (e) => {
        const raw = h.root.querySelector('#bulk-value').value;
        const value = parseNumber(raw);
        if (!Number.isFinite(value) || value < 0) {
          h.root.querySelector('#bulk-value').classList.add('input--invalid');
          toast({ title: 'مقدار معتبر نیست', text: 'یک عدد صحیح وارد کنید.', tone: 'warning' });
          return;
        }
        const btn = e.currentTarget;
        setBusy(btn, true);
        try {
          const payload = { ids: Array.from(state.selected) };
          if (isPrice) payload.price = String(Math.round(value));
          else payload.stock = Math.round(value);
          const res = await api.post('/products/bulk-update', payload);
          h.close();
          state.selected.clear();
          refreshToolbar(root);
          await load(root);
          toast({ title: 'ویرایش گروهی انجام شد', text: `${fa(res.updated)} محصول به‌روزرسانی شد.`, tone: 'success' });
        } catch (err) {
          setBusy(btn, false);
          toast({ title: 'ویرایش ناموفق بود', text: err.message, tone: 'error' });
        }
      });
    },
  });
}

async function bulkRefresh(root) {
  if (!guard('products.write', 'دریافت مجدد گروهی')) return;
  const ids = Array.from(state.selected);
  const ok = await confirmDialog({
    title: 'دریافت مجدد اطلاعات محصولات',
    desc: `${fa(ids.length)} محصول از اسنپ‌شاپ دوباره خوانده می‌شود.`,
    details: 'این عملیات فقط داده‌های خواندنی را به‌روزرسانی می‌کند و قیمت یا موجودی را تغییر نمی‌دهد.',
    confirmText: 'دریافت مجدد',
  });
  if (!ok) return;
  let done = 0;
  for (const id of ids) {
    try { await api.post(`/products/${id}/refresh`); done += 1; } catch (e) { /* keep going */ }
  }
  toast({ title: 'دریافت مجدد انجام شد', text: `${fa(done)} از ${fa(ids.length)} محصول بروزرسانی شد.`, tone: done === ids.length ? 'success' : 'warning' });
  load(root);
}

async function openProductDrawer(root, id) {
  const cached = state.data?.items.find((p) => p.id === id);
  const handle = openDrawer({
    title: cached ? escapeHtml(cached.name) : 'جزئیات محصول',
    sub: 'جزئیات کامل محصول، نگاشت و وضعیت همگام‌سازی',
    body: '<div class="stack-12">' + Array.from({ length: 5 }).map(() => '<div class="skeleton sk-line" style="height:36px"></div>').join('') + '</div>',
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-close-drawer>بستن</button>',
    size: 'lg',
  });
  refreshIcons(handle.root);
  handle.root.querySelector('[data-close-drawer]').addEventListener('click', handle.close);

  let product;
  try {
    product = await api.get(`/products/${id}`);
  } catch (err) {
    handle.body.innerHTML = errorState({ text: err.message });
    refreshIcons(handle.body);
    return;
  }

  const tabs = [
    { key: 'overview', label: 'جزئیات' },
    { key: 'mapping', label: 'نگاشت' },
    { key: 'sync', label: 'همگام‌سازی' },
  ];

  const renderTab = (tab) => {
    if (tab === 'overview') {
      return `
        ${product.issue ? `<div class="alert alert--warning" style="margin-bottom:12px">${icon('triangle-alert')}<div>
          <div class="alert__title">${escapeHtml(product.issue.title)}</div>
          <div class="alert__text">${escapeHtml(product.issue.detail)}</div>
        </div></div>` : ''}
        <div class="detail-grid">
          <div class="detail-box"><div class="detail-box__label">SKU</div><div class="detail-box__value"><span class="t-mono">${escapeHtml(product.sku || '—')}</span></div></div>
          <div class="detail-box"><div class="detail-box__label">شناسه اسنپ‌شاپ</div><div class="detail-box__value"><span class="t-mono">${escapeHtml(product.snappId || '—')}</span></div></div>
          <div class="detail-box"><div class="detail-box__label">قیمت اسنپ‌شاپ</div><div class="detail-box__value">${moneyCell(product.snappPrice)}</div></div>
          <div class="detail-box"><div class="detail-box__label">قیمت ووکامرس</div><div class="detail-box__value">${moneyCell(product.price)}</div></div>
          <div class="detail-box"><div class="detail-box__label">موجودی اسنپ‌شاپ</div><div class="detail-box__value">${fa(product.snappStock)} عدد</div></div>
          <div class="detail-box"><div class="detail-box__label">موجودی ووکامرس</div><div class="detail-box__value">${fa(product.stock)} عدد</div></div>
          <div class="detail-box"><div class="detail-box__label">رزروشده</div><div class="detail-box__value">${fa(product.reserved)} عدد</div></div>
          <div class="detail-box"><div class="detail-box__label">موجودی ایمنی</div><div class="detail-box__value">${fa(product.safety)} عدد</div></div>
        </div>
        <div class="card" style="margin-top:14px;box-shadow:none">
          <div class="card__body">
            <dl class="kv-list">
              <div><dt>دسته‌بندی</dt><dd>${escapeHtml(product.category)}</dd></div>
              <div><dt>وضعیت محصول</dt><dd>${badge(product.status)}</dd></div>
              <div><dt>وضعیت نگاشت</dt><dd>${badge(product.mapping)}</dd></div>
              <div><dt>وضعیت همگام‌سازی</dt><dd>${badge(product.sync)}</dd></div>
              <div><dt>آخرین بروزرسانی</dt><dd>${formatDate(product.updatedAt, { time: true })}</dd></div>
            </dl>
          </div>
        </div>`;
    }
    if (tab === 'mapping') {
      return product.woo ? `
        <div class="map-compare" style="border:1px solid var(--border);border-radius:var(--radius);margin-bottom:12px">
          <div class="map-side">
            <div class="thumb" style="background:${gradientFor(product.name)}">${escapeHtml(product.name.slice(0, 2))}</div>
            <div class="map-side__body">
              <div class="map-side__name">${escapeHtml(product.name)}</div>
              <div class="map-side__meta"><span class="t-mono">${escapeHtml(product.snappId || '—')}</span></div>
            </div>
          </div>
          <div class="map-link is-linked">${icon('link-2')}</div>
          <div class="map-side">
            <div class="thumb" style="background:${gradientFor(product.woo.name)}">${escapeHtml(product.woo.name.slice(0, 2))}</div>
            <div class="map-side__body">
              <div class="map-side__name">${escapeHtml(product.woo.name)}</div>
              <div class="map-side__meta">${product.woo.kind === 'variation' ? 'تنوع' : 'محصول'} #${fa(product.woo.id)}</div>
            </div>
          </div>
        </div>
        <div class="alert alert--info">${icon('info')}<div class="alert__text">حذف نگاشت محصول را از ووکامرس یا اسنپ‌شاپ حذف نمی‌کند؛ فقط ارتباط بین آن دو قطع می‌شود.</div></div>`
        : `<div class="empty-state"><div class="empty-state__icon">${icon('unlink')}</div><div class="empty-state__title">این محصول به ووکامرس متصل نیست</div>
             <div class="empty-state__text">برای همگام‌سازی قیمت و موجودی، ابتدا آن را به یک محصول یا تنوع ووکامرس متصل کنید.</div>
             <div class="empty-state__actions"><button class="btn btn--primary btn--sm" data-open-mapping>${icon('git-compare-arrows')} رفتن به نگاشت</button></div>
           </div>`;
    }
    return `
      <div class="timeline">
        <div class="timeline__item">
          <span class="timeline__dot ${product.sync === 'failed' ? 'is-danger' : 'is-success'}"></span>
          <div class="timeline__title">آخرین همگام‌سازی ${badge(product.sync)}</div>
          <div class="timeline__meta">${formatDate(product.updatedAt, { time: true })}</div>
        </div>
        <div class="timeline__item">
          <span class="timeline__dot is-brand"></span>
          <div class="timeline__title">دریافت اطلاعات محصول از اسنپ‌شاپ</div>
          <div class="timeline__meta">قیمت و موجودی به‌روزرسانی شد</div>
        </div>
        <div class="timeline__item">
          <span class="timeline__dot"></span>
          <div class="timeline__title">ایجاد نگاشت با ووکامرس</div>
          <div class="timeline__meta">${product.woo ? `محصول #${fa(product.woo.id)}` : 'انجام نشده'}</div>
        </div>
      </div>
      ${product.sync === 'failed' ? `<div class="alert alert--danger" style="margin-top:12px">${icon('alert-circle')}<div><div class="alert__title">خطای دریافت</div><div class="alert__text">آخرین درخواست با محدودیت نرخ مواجه شد. تلاش مجدد به‌صورت خودکار زمان‌بندی شده است.</div></div></div>` : ''}`;
  };

  const paint = (tab) => {
    handle.body.innerHTML = `
      <div class="detail-hero">
        <div class="thumb thumb--xl" style="background:${gradientFor(product.name)}">${escapeHtml(product.name.slice(0, 2))}</div>
        <div class="u-grow" style="min-width:0">
          <div style="font-size:13.5px;font-weight:640;line-height:1.6">${escapeHtml(product.name)}</div>
          <div class="u-row gap-6 u-wrap" style="margin-top:5px">
            ${badge(product.status)}${badge(product.mapping)}${badge(product.sync)}
          </div>
          <div class="t-muted" style="font-size:11px;margin-top:4px">
            ${product.woo ? `ووکامرس: ${escapeHtml(product.woo.name)} (<span class="t-mono">#${fa(product.woo.id)}</span>)` : 'بدون محصول متناظر ووکامرس'}
          </div>
        </div>
      </div>
      <div class="tabs" style="margin:12px 0 14px">
        ${tabs.map((t) => `<button class="tab ${t.key === tab ? 'is-active' : ''}" data-dtab="${t.key}">${t.label}</button>`).join('')}
      </div>
      <div class="tab-panel">${renderTab(tab)}</div>`;
    refreshIcons(handle.body);
    handle.body.querySelectorAll('[data-dtab]').forEach((btn) => {
      btn.addEventListener('click', () => paint(btn.dataset.dtab));
    });
    handle.body.querySelector('[data-open-mapping]')?.addEventListener('click', () => {
      handle.close();
      window.location.hash = '#/mapping?tab=unmapped';
    });
  };
  paint('overview');

  handle.footer.innerHTML = `
    <button class="btn btn--secondary btn--sm" data-close-drawer>بستن</button>
    <div class="spacer" style="flex:1"></div>
    <button class="btn btn--secondary btn--sm" data-refetch-drawer>${icon('refresh-cw')} دریافت مجدد</button>
    <button class="btn btn--primary btn--sm" data-edit-drawer>${icon('pencil')} ویرایش قیمت و موجودی</button>`;
  refreshIcons(handle.footer);
  handle.footer.querySelector('[data-close-drawer]').addEventListener('click', handle.close);
  handle.footer.querySelector('[data-refetch-drawer]').addEventListener('click', async (e) => {
    if (!guard('products.write', 'دریافت مجدد محصول')) return;
    const btn = e.currentTarget;
    setBusy(btn, true);
    try {
      await api.post(`/products/${id}/refresh`);
      toast({ title: 'اطلاعات محصول بروزرسانی شد', tone: 'success' });
      handle.close();
      load(root);
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'دریافت مجدد ناموفق بود', text: err.message, tone: 'error' });
    }
  });
  handle.footer.querySelector('[data-edit-drawer]').addEventListener('click', () => {
    handle.close();
    state.selected = new Set([id]);
    refreshToolbar(root);
    openBulkEdit(root, 'price');
  });
}

export async function render(root, ctx) {
  state = initialState(ctx.params);
  root.innerHTML = shellMarkup();
  refreshIcons(root);
  bindToolbar(root);
  await load(root);

  root.querySelector('#sync-products')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    setBusy(btn, true);
    try {
      const { job } = await api.post('/sync/scan');
      toast({ title: 'دریافت محصولات شروع شد', text: `عملیات ${job.id} در صف قرار گرفت.`, tone: 'success' });
      window.location.hash = '#/jobs';
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'شروع دریافت ممکن نشد', text: err.message, tone: 'error' });
    }
  });

  root.querySelector('#export-btn')?.addEventListener('click', () => {
    window.location.hash = '#/data?export=csv';
  });
}
