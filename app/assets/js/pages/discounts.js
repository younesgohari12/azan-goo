import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openModal, confirmDialog,
  skeletonRows, emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, parseNumber, gradientFor, money as fmtMoney } from '../core/utils.js';
import { pageHead, card, statCard, moneyCell } from '../components/common.js';

let state = null;

function initial() {
  return { items: [], loading: true, filter: 'all' };
}

async function load(root) {
  state.loading = true;
  const host = root.querySelector('#discounts-body');
  host.innerHTML = `<div class="table-wrap"><table class="table"><tbody>${skeletonRows(6, 8)}</tbody></table></div>`;
  refreshIcons(root);
  try {
    const { items } = await api.get('/discounts');
    state.items = items;
    state.loading = false;
    paint(root);
  } catch (err) {
    state.loading = false;
    host.innerHTML = errorState({ text: err.message });
    refreshIcons(host);
    host.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function filtered() {
  if (state.filter === 'all') return state.items;
  return state.items.filter((d) => d.status === state.filter);
}

function paint(root) {
  const items = filtered();
  const host = root.querySelector('#discounts-body');
  host.innerHTML = items.length ? `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>محصول</th>
          <th>نوع تخفیف</th>
          <th>قیمت ویژه</th>
          <th>بازه زمانی</th>
          <th>موجودی اختصاصی</th>
          <th>وضعیت</th>
          <th style="text-align:end">عملیات</th>
        </tr></thead>
        <tbody>
          ${items.map((d) => `
            <tr>
              <td>
                <div class="cell-product">
                  <div class="thumb" style="background:${gradientFor(d.product)}">${escapeHtml(d.product.slice(0, 2))}</div>
                  <div style="min-width:0">
                    <div class="cell-product__name t-clamp" style="max-width:230px">${escapeHtml(d.product)}</div>
                    <div class="cell-product__meta"><span class="t-mono">${escapeHtml(d.sku || '—')}</span></div>
                  </div>
                </div>
              </td>
              <td>
                <div class="cell-stack">
                  <span class="cell-stack__main">${d.type === 'percent' ? `${fa(Number(d.value))}٪ تخفیف` : `${fa(Number(d.value))} تومان تخفیف`}</span>
                  <span class="cell-stack__sub">قیمت پایه: ${fmtMoney(d.basePrice)}</span>
                </div>
              </td>
              <td class="num" style="font-weight:600">${moneyCell(d.specialPrice)}</td>
              <td>
                <div class="cell-stack">
                  <span class="cell-stack__main" style="font-size:11.5px">${formatDate(d.startsAt)}</span>
                  <span class="cell-stack__sub">تا ${formatDate(d.endsAt)}</span>
                </div>
              </td>
              <td>
                <div class="cell-stack">
                  <span class="cell-stack__main">${fa(d.allocatedStock)} عدد</span>
                  <span class="cell-stack__sub">${fa(d.soldStock)} فروش‌رفته</span>
                </div>
              </td>
              <td>${badge(d.status)}</td>
              <td class="actions">
                <div class="row-actions">
                  <button class="row-action" data-edit-discount="${d.id}" aria-label="ویرایش" ${d.editable ? '' : 'disabled style="opacity:.4;cursor:not-allowed"'}>${icon('pencil')}</button>
                  <button class="row-action is-danger" data-cancel-discount="${d.id}" aria-label="لغو" ${d.editable ? '' : 'disabled style="opacity:.4;cursor:not-allowed"'}>${icon('trash-2')}</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="card__foot" style="border-top:1px solid var(--border);border-radius:0">
      <span class="t-muted" style="font-size:11px">برنامه‌های ارسال‌شده به اسنپ‌شاپ قابل ویرایش یا لغو نیستند.</span>
    </div>` : emptyState({
      iconName: 'tag',
      title: state.filter === 'all' ? 'هنوز برنامه تخفیفی ایجاد نشده' : 'برنامه‌ای در این وضعیت نیست',
      text: 'برای محصولات انتخاب‌شده تخفیف درصدی یا مبلغی تعیین کنید و موجودی اختصاصی بدهید.',
      action: `<button class="btn btn--primary btn--sm" data-new-discount>${icon('plus')} برنامه تخفیف جدید</button>`,
    });
  refreshIcons(host);

  host.querySelector('[data-new-discount]')?.addEventListener('click', () => openEditor(root, null));
  host.querySelectorAll('[data-edit-discount]').forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener('click', () => {
      const record = state.items.find((d) => d.id === btn.dataset.editDiscount);
      openEditor(root, record);
    });
  });
  host.querySelectorAll('[data-cancel-discount]').forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener('click', () => cancelDiscount(root, btn.dataset.cancelDiscount));
  });
}

async function openEditor(root, record) {
  const isEdit = Boolean(record);
  let products = [];
  const handle = openModal({
    title: isEdit ? 'ویرایش برنامه تخفیف' : 'برنامه تخفیف جدید',
    desc: 'تخفیف روی قیمت اسنپ‌شاپ اعمال می‌شود و تا زمان ارسال قابل ویرایش است.',
    iconName: 'tag',
    size: 'lg',
    body: '<div class="skeleton sk-line" style="height:200px"></div>',
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-cancel>انصراف</button><button class="btn btn--primary" data-save>ذخیره برنامه</button>',
  });
  refreshIcons(handle.root);

  try {
    const res = await api.get('/products', { per_page: 60, sort: 'name', dir: 'asc' });
    products = res.items;
  } catch (err) {
    handle.body.innerHTML = errorState({ text: err.message });
    refreshIcons(handle.body);
    return;
  }

  const d = record || { type: 'percent', value: '10', specialPrice: '', allocatedStock: 10, startsAt: '', endsAt: '' };

  handle.body.innerHTML = `
    <div class="form-grid">
      <div class="field span-2">
        <label class="field__label">محصول <span class="req">*</span></label>
        <select class="select" id="disc-product" ${isEdit ? 'disabled' : ''}>
          ${products.map((p) => `<option value="${p.id}" ${record?.productId === p.id ? 'selected' : ''}>${escapeHtml(p.name)} — ${escapeHtml(p.sku || 'بدون SKU')}</option>`).join('')}
        </select>
        <div class="field__hint">${isEdit ? 'محصول برنامه ثبت‌شده قابل تغییر نیست؛ برای محصول دیگر برنامه جدید بسازید.' : 'فقط یک محصول برای هر برنامه انتخاب می‌شود.'}</div>
      </div>
      <div class="field">
        <label class="field__label">نوع تخفیف</label>
        <div class="segmented" id="disc-type">
          <button type="button" class="${d.type === 'percent' ? 'is-active' : ''}" data-dtype="percent">درصدی</button>
          <button type="button" class="${d.type === 'amount' ? 'is-active' : ''}" data-dtype="amount">مبلغی</button>
        </div>
      </div>
      <div class="field">
        <label class="field__label" id="disc-value-label">${d.type === 'percent' ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)'}</label>
        <div class="input-group">
          <input class="input" id="disc-value" inputmode="numeric" value="${escapeHtml(String(d.value))}" />
          <span class="input-group__suffix" id="disc-value-suffix">${d.type === 'percent' ? '٪' : 'تومان'}</span>
        </div>
      </div>
      <div class="field">
        <label class="field__label">قیمت ویژه (پیش‌نمایش)</label>
        <div class="input-group">
          <input class="input" id="disc-special" inputmode="numeric" value="${escapeHtml(String(d.specialPrice || ''))}" />
          <span class="input-group__suffix">تومان</span>
        </div>
        <div class="field__hint" id="disc-preview">—</div>
      </div>
      <div class="field">
        <label class="field__label">موجودی اختصاص‌یافته به تخفیف</label>
        <div class="input-group">
          <input class="input" id="disc-stock" inputmode="numeric" value="${escapeHtml(String(d.allocatedStock))}" />
          <span class="input-group__suffix">عدد</span>
        </div>
      </div>
      <div class="field">
        <label class="field__label">تاریخ شروع</label>
        <input class="input" type="date" id="disc-start" value="${d.startsAt ? d.startsAt.slice(0, 10) : ''}" />
      </div>
      <div class="field">
        <label class="field__label">تاریخ پایان</label>
        <input class="input" type="date" id="disc-end" value="${d.endsAt ? d.endsAt.slice(0, 10) : ''}" />
      </div>
    </div>
    <div class="alert alert--info" style="margin-top:14px">${icon('info')}<div class="alert__text">
      برنامه تا زمانی که به اسنپ‌شاپ ارسال نشود قابل ویرایش یا لغو است. پس از ارسال، تغییرات باید از پنل فروشنده انجام شود.
    </div></div>`;

  let type = d.type;
  const valueInput = handle.body.querySelector('#disc-value');
  const specialInput = handle.body.querySelector('#disc-special');
  const preview = handle.body.querySelector('#disc-preview');
  const productSelect = handle.body.querySelector('#disc-product');

  const recalc = () => {
    const product = products.find((p) => p.id === productSelect.value) || products[0];
    const base = Number(product?.price || 0);
    const val = parseNumber(valueInput.value) || 0;
    const special = type === 'percent' ? Math.round(base * (1 - val / 100)) : Math.max(0, base - val);
    if (!specialInput.dataset.touched) specialInput.value = String(special);
    const manual = parseNumber(specialInput.value);
    const shown = Number.isFinite(manual) && manual > 0 ? manual : special;
    preview.textContent = `قیمت پایه ${fa(base)} تومان → قیمت ویژه ${fa(shown)} تومان`;
  };

  handle.body.querySelectorAll('[data-dtype]').forEach((btn) => {
    btn.addEventListener('click', () => {
      type = btn.dataset.dtype;
      handle.body.querySelectorAll('[data-dtype]').forEach((b) => b.classList.toggle('is-active', b === btn));
      handle.body.querySelector('#disc-value-label').textContent = type === 'percent' ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)';
      handle.body.querySelector('#disc-value-suffix').textContent = type === 'percent' ? '٪' : 'تومان';
      specialInput.dataset.touched = '';
      recalc();
    });
  });
  [valueInput, productSelect].forEach((el) => el.addEventListener('input', () => { specialInput.dataset.touched = ''; recalc(); }));
  specialInput.addEventListener('input', () => { specialInput.dataset.touched = '1'; recalc(); });
  recalc();

  handle.root.querySelector('[data-cancel]').addEventListener('click', handle.close);
  handle.root.querySelector('[data-save]').addEventListener('click', async (e) => {
    const payload = {
      productId: productSelect.value,
      type,
      value: String(parseNumber(valueInput.value) || 0),
      specialPrice: String(parseNumber(specialInput.value) || 0),
      allocatedStock: parseNumber(handle.body.querySelector('#disc-stock').value) || 0,
      startsAt: handle.body.querySelector('#disc-start').value || new Date().toISOString(),
      endsAt: handle.body.querySelector('#disc-end').value || new Date().toISOString(),
    };
    if (!payload.value || payload.value <= 0) {
      toast({ title: 'مقدار تخفیف معتبر نیست', tone: 'warning' });
      return;
    }
    const btn = e.currentTarget;
    setBusy(btn, true);
    try {
      if (isEdit) await api.patch(`/discounts/${record.id}`, payload);
      else await api.post('/discounts', payload);
      handle.close();
      toast({ title: isEdit ? 'برنامه تخفیف ویرایش شد' : 'برنامه تخفیف ایجاد شد', text: 'وضعیت برنامه «پیش‌نویس» است و تا ارسال قابل ویرایش می‌باشد.', tone: 'success' });
      load(root);
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'ذخیره ناموفق بود', text: err.message, tone: 'error' });
    }
  });
}

async function cancelDiscount(root, id) {
  const record = state.items.find((d) => d.id === id);
  const ok = await confirmDialog({
    title: 'لغو برنامه تخفیف',
    desc: `برنامه «${record?.product || ''}» حذف می‌شود.`,
    details: 'این برنامه به اسنپ‌شاپ ارسال نشده است؛ لغو آن هیچ تغییری در قیمت محصول ایجاد نمی‌کند.',
    confirmText: 'لغو برنامه',
    tone: 'danger',
    iconName: 'trash-2',
  });
  if (!ok) return;
  try {
    await api.del(`/discounts/${id}`);
    toast({ title: 'برنامه تخفیف لغو شد', tone: 'success' });
    load(root);
  } catch (err) {
    toast({ title: 'لغو ناموفق بود', text: err.message, tone: 'error' });
  }
}

export async function render(root) {
  state = initial();
  root.innerHTML = `
    ${pageHead({
      title: 'تخفیف‌ها',
      sub: 'برنامه‌های تخفیف محصولات، بازه زمانی و موجودی اختصاص‌یافته',
      actions: `<button class="btn btn--primary" id="new-discount">${icon('plus')}<span>برنامه تخفیف جدید</span></button>`,
    })}
    <div class="stats-grid" id="discount-stats" style="grid-template-columns:repeat(4,minmax(0,1fr))"></div>
    <div class="section-gap">
      ${card({
        flush: true,
        body: `
          <div class="table-toolbar">
            <div class="tabs tabs--pill" id="discount-tabs">
              <button class="tab is-active" data-filter="all">همه</button>
              <button class="tab" data-filter="draft">پیش‌نویس</button>
              <button class="tab" data-filter="scheduled">زمان‌بندی‌شده</button>
              <button class="tab" data-filter="sent">ارسال‌شده</button>
            </div>
            <div class="table-toolbar__right">
              <span class="t-muted" style="font-size:11px">تخفیف روی قیمت اسنپ‌شاپ اعمال می‌شود</span>
            </div>
          </div>
          <div id="discounts-body"></div>`,
      })}
    </div>`;
  refreshIcons(root);

  root.querySelector('#new-discount').addEventListener('click', () => openEditor(root, null));
  root.querySelectorAll('#discount-tabs [data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      root.querySelectorAll('#discount-tabs [data-filter]').forEach((b) => b.classList.toggle('is-active', b === btn));
      paint(root);
    });
  });

  await load(root);

  const counts = {
    all: state.items.length,
    draft: state.items.filter((d) => d.status === 'draft').length,
    scheduled: state.items.filter((d) => d.status === 'scheduled').length,
    sent: state.items.filter((d) => d.status === 'sent').length,
  };
  root.querySelector('#discount-stats').innerHTML = `
    ${statCard({ iconName: 'tag', tone: 'brand', label: 'کل برنامه‌ها', value: fa(counts.all), foot: '<span class="t-muted">همه وضعیت‌ها</span>' })}
    ${statCard({ iconName: 'pencil-line', label: 'پیش‌نویس', value: fa(counts.draft), foot: '<span class="t-muted">قابل ویرایش</span>' })}
    ${statCard({ iconName: 'calendar-clock', tone: 'warning', label: 'زمان‌بندی‌شده', value: fa(counts.scheduled), foot: '<span class="t-muted">در انتظار شروع</span>' })}
    ${statCard({ iconName: 'send', tone: 'success', label: 'ارسال‌شده', value: fa(counts.sent), foot: '<span class="t-muted">قفل‌شده در اسنپ‌شاپ</span>' })}
  `;
  refreshIcons(root.querySelector('#discount-stats'));
}
