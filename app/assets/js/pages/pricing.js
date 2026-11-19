import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openModal, confirmDialog,
  skeletonRows, emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, relTime, parseNumber, money as fmtMoney } from '../core/utils.js';
import { pageHead, card, moneyCell } from '../components/common.js';

const RULE_TYPES = [
  { key: 'percent', title: 'افزایش یا کاهش درصدی', desc: 'درصدی از قیمت فعلی کم یا زیاد می‌شود', icon: 'percent' },
  { key: 'fixed', title: 'تغییر مبلغ ثابت', desc: 'یک مبلغ مشخص به قیمت اضافه یا از آن کم می‌شود', icon: 'arrow-up-down' },
  { key: 'set', title: 'تعیین قیمت مشخص', desc: 'قیمت همه محصولات انتخاب‌شده برابر یک مقدار می‌شود', icon: 'equal' },
  { key: 'formula', title: 'فرمول سفارشی', desc: 'محاسبه قیمت با عبارت ریاضی روی متغیر price', icon: 'sigma' },
];

const ROUNDINGS = [
  { key: 'none', label: 'بدون گرد کردن' },
  { key: '1000', label: 'نزدیک‌ترین ۱٬۰۰۰ تومان' },
  { key: '5000', label: 'نزدیک‌ترین ۵٬۰۰۰ تومان' },
  { key: '10000', label: 'نزدیک‌ترین ۱۰٬۰۰۰ تومان' },
];

let state = null;

function initial() {
  return {
    view: 'builder',
    step: 1,
    selected: new Map(),
    search: '',
    products: [],
    loadingProducts: true,
    rule: { type: 'percent', direction: 'increase', value: '5', rounding: '10000', min: '', max: '' },
    preview: null,
    previewing: false,
    history: [],
    loadingHistory: true,
  };
}

function ruleLabel(rule) {
  const value = parseNumber(rule.value) || 0;
  if (rule.type === 'percent') return `${rule.direction === 'decrease' ? 'کاهش' : 'افزایش'} ${fa(value)}٪`;
  if (rule.type === 'fixed') return `${rule.direction === 'decrease' ? 'کاهش' : 'افزایش'} ${fa(value)} تومان`;
  if (rule.type === 'set') return `قیمت ثابت ${fa(value)} تومان`;
  return `فرمول: ${rule.value}`;
}

function stepper() {
  const steps = ['انتخاب محصولات', 'تعیین قانون', 'پیش‌نمایش', 'تأیید نهایی'];
  return `
    <div class="stepper" style="margin-bottom:14px">
      ${steps.map((label, i) => {
        const n = i + 1;
        const cls = state.step === n ? 'is-active' : state.step > n ? 'is-done' : '';
        return `${i ? '<span class="step__sep">—</span>' : ''}
          <div class="step ${cls}">
            <span class="step__num">${state.step > n ? icon('check') : fa(n)}</span>
            <span>${label}</span>
          </div>`;
      }).join('')}
    </div>`;
}

async function loadProducts(root) {
  state.loadingProducts = true;
  const box = root.querySelector('#pricing-step');
  if (box && state.step === 1) box.innerHTML = stepProducts();
  refreshIcons(root);
  try {
    const data = await api.get('/products', { per_page: 40, search: state.search, sort: 'name', dir: 'asc' });
    state.products = data.items;
    state.loadingProducts = false;
    if (state.step === 1) {
      box.innerHTML = stepProducts();
      refreshIcons(root);
      bindStep1(root);
    }
  } catch (err) {
    state.loadingProducts = false;
    if (box) {
      box.innerHTML = errorState({ text: err.message });
      refreshIcons(root);
      box.querySelector('[data-retry]')?.addEventListener('click', () => loadProducts(root));
    }
  }
}

function stepProducts() {
  return `
    ${card({
      flush: true,
      body: `
        <div class="table-toolbar">
          <div class="search-box" style="min-width:240px">
            ${icon('search')}
            <input class="input" id="pricing-search" placeholder="جست‌وجوی محصول…" value="${escapeHtml(state.search)}" />
          </div>
          <button class="btn btn--secondary btn--sm" id="select-all">${icon('check-check')} انتخاب همه نتایج</button>
          <div class="table-toolbar__right">
            <span class="badge badge--brand">${fa(state.selected.size)} محصول انتخاب‌شده</span>
          </div>
        </div>
        <div class="table-wrap" style="max-height:440px;overflow-y:auto">
          <table class="table">
            <thead><tr>
              <th style="width:34px"></th>
              <th>محصول</th>
              <th>SKU</th>
              <th>قیمت فعلی</th>
              <th>وضعیت</th>
            </tr></thead>
            <tbody>
              ${state.loadingProducts
                ? skeletonRows(5, 6)
                : state.products.length
                  ? state.products.map((p) => `
                    <tr>
                      <td>
                        <label class="check">
                          <input type="checkbox" data-pick="${p.id}" ${state.selected.has(p.id) ? 'checked' : ''} />
                          <span class="check__box">${icon('check')}</span>
                        </label>
                      </td>
                      <td><div class="cell-stack"><span class="cell-stack__main">${escapeHtml(p.name)}</span><span class="cell-stack__sub">${escapeHtml(p.category)}</span></div></td>
                      <td><span class="t-mono">${escapeHtml(p.sku || '—')}</span></td>
                      <td class="num">${moneyCell(p.price)}</td>
                      <td>${badge(p.status)}</td>
                    </tr>`).join('')
                  : `<tr><td colspan="5">${emptyState({ iconName: 'package-search', title: 'محصولی پیدا نشد', text: 'عبارت جست‌وجو را تغییر دهید.' })}</td></tr>`}
            </tbody>
          </table>
        </div>`,
    })}`;
}

function renderFooter(root) {
  const host = root.querySelector('#pricing-footer');
  if (!host) return;
  host.innerHTML = footer();
  refreshIcons(host);
  bindFooter(root);
}

function bindStep1(root) {
  const box = root.querySelector('#pricing-step');
  let t;
  box.querySelector('#pricing-search')?.addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.search = e.target.value; loadProducts(root); }, 280);
  });
  box.querySelector('#select-all')?.addEventListener('click', () => {
    state.products.forEach((p) => state.selected.set(p.id, p));
    box.innerHTML = stepProducts();
    refreshIcons(root);
    bindStep1(root);
    renderFooter(root);
  });
  box.querySelectorAll('[data-pick]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.pick;
      const product = state.products.find((p) => p.id === id);
      if (cb.checked) state.selected.set(id, product);
      else state.selected.delete(id);
      renderFooter(root);
      const badgeEl = box.querySelector('.badge--brand');
      if (badgeEl) badgeEl.textContent = `${fa(state.selected.size)} محصول انتخاب‌شده`;
    });
  });
}

function stepRule() {
  const r = state.rule;
  const needsDirection = r.type === 'percent' || r.type === 'fixed';
  return `
    ${card({
      body: `
        <div class="form-section__title">نوع قانون</div>
        <div class="form-section__desc">قانون روی قیمت اسنپ‌شاپ محصولات انتخاب‌شده اعمال می‌شود.</div>
        <div class="grid-2" style="gap:8px">
          ${RULE_TYPES.map((t) => `
            <label class="option-card ${r.type === t.key ? 'is-selected' : ''}" data-rule-type="${t.key}">
              <span class="stat__icon" style="margin-top:1px">${icon(t.icon)}</span>
              <span class="u-grow">
                <span class="option-card__title" style="display:block">${t.title}</span>
                <span class="option-card__desc" style="display:block">${t.desc}</span>
              </span>
            </label>`).join('')}
        </div>

        <div class="form-section">
          <div class="form-grid">
            ${needsDirection ? `
              <div class="field">
                <label class="field__label">جهت تغییر</label>
                <div class="segmented" id="rule-direction">
                  <button type="button" class="${r.direction === 'increase' ? 'is-active' : ''}" data-dir="increase">${icon('arrow-up')} افزایش</button>
                  <button type="button" class="${r.direction === 'decrease' ? 'is-active' : ''}" data-dir="decrease">${icon('arrow-down')} کاهش</button>
                </div>
              </div>` : ''}
            <div class="field">
              <label class="field__label">${r.type === 'formula' ? 'فرمول (متغیر: price)' : r.type === 'percent' ? 'درصد تغییر' : 'مبلغ (تومان)'}</label>
              ${r.type === 'formula'
                ? `<input class="input t-mono" id="rule-value" value="${escapeHtml(r.value)}" placeholder="price * 1.05 + 10000" />`
                : `<div class="input-group">
                    <input class="input" id="rule-value" inputmode="numeric" value="${escapeHtml(r.value)}" />
                    <span class="input-group__suffix">${r.type === 'percent' ? '٪' : 'تومان'}</span>
                  </div>`}
            </div>
            <div class="field">
              <label class="field__label">گرد کردن قیمت</label>
              <select class="select" id="rule-rounding">
                ${ROUNDINGS.map((o) => `<option value="${o.key}" ${r.rounding === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section__title">محدوده مجاز قیمت</div>
          <div class="form-section__desc">قیمت‌های خارج از این محدوده به نزدیک‌ترین حد مجاز محدود می‌شوند. خالی گذاشتن یعنی بدون محدودیت.</div>
          <div class="form-grid">
            <div class="field">
              <label class="field__label">حداقل قیمت</label>
              <div class="input-group">
                <input class="input" id="rule-min" inputmode="numeric" value="${escapeHtml(r.min)}" placeholder="مثلاً ۱۵۰٬۰۰۰" />
                <span class="input-group__suffix">تومان</span>
              </div>
            </div>
            <div class="field">
              <label class="field__label">حداکثر قیمت</label>
              <div class="input-group">
                <input class="input" id="rule-max" inputmode="numeric" value="${escapeHtml(r.max)}" placeholder="مثلاً ۵۰٬۰۰۰٬۰۰۰" />
                <span class="input-group__suffix">تومان</span>
              </div>
            </div>
          </div>
        </div>

        <div class="alert alert--info" style="margin-top:14px">
          ${icon('info')}
          <div class="alert__text">قیمت پایه محصولات تومان است و بر ۱۰ تقسیم نمی‌شود. تغییرات ابتدا در پیش‌نمایش نمایش داده می‌شوند و فقط پس از تأیید نهایی اعمال می‌شوند.</div>
        </div>`,
    })}`;
}

function bindStepRule(root) {
  const box = root.querySelector('#pricing-step');
  const sync = () => {
    state.rule.value = box.querySelector('#rule-value')?.value ?? state.rule.value;
    state.rule.rounding = box.querySelector('#rule-rounding')?.value ?? state.rule.rounding;
    state.rule.min = box.querySelector('#rule-min')?.value ?? state.rule.min;
    state.rule.max = box.querySelector('#rule-max')?.value ?? state.rule.max;
  };
  box.querySelectorAll('[data-rule-type]').forEach((el) => {
    el.addEventListener('click', () => {
      sync();
      state.rule.type = el.dataset.ruleType;
      if (state.rule.type === 'formula' && state.rule.value === '5') state.rule.value = 'price * 1.05';
      if (state.rule.type !== 'formula' && state.rule.value.startsWith('price')) state.rule.value = '5';
      renderStep(root);
    });
  });
  box.querySelectorAll('[data-dir]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sync();
      state.rule.direction = btn.dataset.dir;
      renderStep(root);
    });
  });
  box.querySelectorAll('#rule-value, #rule-rounding, #rule-min, #rule-max').forEach((el) => {
    el.addEventListener('input', sync);
    el.addEventListener('change', sync);
  });
}

function previewSummary() {
  if (!state.preview) return '';
  const { summary } = state.preview;
  return `
    <div class="metric-row" style="margin-bottom:12px">
      <div class="metric"><div class="metric__label">محصولات انتخاب‌شده</div><div class="metric__value">${fa(summary.total)}</div></div>
      <div class="metric"><div class="metric__label">قیمت تغییر می‌کند</div><div class="metric__value">${fa(summary.changed)}</div></div>
      <div class="metric"><div class="metric__label">ردیف نامعتبر</div><div class="metric__value" style="color:${summary.invalid ? 'var(--danger)' : 'inherit'}">${fa(summary.invalid)}</div></div>
      <div class="metric"><div class="metric__label">قانون</div><div class="metric__value" style="font-size:13px">${escapeHtml(ruleLabel(state.rule))}</div></div>
    </div>`;
}

function stepPreview() {
  if (state.previewing) {
    return card({ flush: true, body: `<div class="table-wrap"><table class="table"><tbody>${skeletonRows(5, 8)}</tbody></table></div>` });
  }
  if (!state.preview) {
    return card({ body: emptyState({ iconName: 'eye', title: 'پیش‌نمایشی موجود نیست', text: 'بازگشت بزنید و قانون را تعیین کنید.' }) });
  }
  return `
    ${previewSummary()}
    ${card({
      flush: true,
      body: `
        <div class="table-wrap" style="max-height:420px;overflow-y:auto">
          <table class="table">
            <thead><tr>
              <th>محصول</th>
              <th>قیمت قبلی</th>
              <th>قیمت جدید</th>
              <th>اختلاف</th>
              <th>وضعیت</th>
            </tr></thead>
            <tbody>
              ${state.preview.rows.map((row) => {
                const diff = Number(row.diff);
                return `<tr>
                  <td>
                    <div class="cell-stack">
                      <span class="cell-stack__main t-clamp" style="max-width:260px">${escapeHtml(row.name)}</span>
                      <span class="cell-stack__sub t-mono">${escapeHtml(row.sku || '—')}</span>
                    </div>
                  </td>
                  <td class="num t-muted">${moneyCell(row.oldPrice)}</td>
                  <td class="num" style="font-weight:600">${moneyCell(row.newPrice)}</td>
                  <td class="num" style="color:${diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--muted)'}">
                    <span dir="ltr">${diff > 0 ? '+' : diff < 0 ? '−' : ''}${fa(Math.abs(diff))}</span>
                  </td>
                  <td>${row.valid
                    ? (Number(row.newPrice) === Number(row.oldPrice)
                      ? '<span class="badge badge--neutral">بدون تغییر</span>'
                      : '<span class="badge badge--success">معتبر</span>')
                    : `<span class="badge badge--danger">نامعتبر</span>`}
                    ${row.reason ? `<div class="cell-stack__sub" style="margin-top:2px">${escapeHtml(row.reason)}</div>` : ''}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`,
    })}`;
}

function stepReview() {
  const s = state.preview?.summary;
  return `
    ${card({
      body: `
        <div class="u-row gap-12" style="align-items:flex-start">
          <div class="modal__icon" style="width:38px;height:38px">${icon('shield-check')}</div>
          <div class="u-grow">
            <div class="t-section-title">آماده اعمال تغییرات</div>
            <div class="t-muted" style="font-size:12px;line-height:1.8">
              قانون <b>${escapeHtml(ruleLabel(state.rule))}</b> روی ${fa(s?.total || 0)} محصول اعمال می‌شود.
              ${s?.invalid ? `<span class="t-danger">${fa(s.invalid)} ردیف نامعتبر نادیده گرفته می‌شود.</span>` : ''}
            </div>
          </div>
        </div>
        <div class="detail-grid" style="margin-top:14px">
          <div class="detail-box"><div class="detail-box__label">محصولات</div><div class="detail-box__value">${fa(state.selected.size)}</div></div>
          <div class="detail-box"><div class="detail-box__label">قیمت‌های تغییر یافته</div><div class="detail-box__value">${fa(s?.changed || 0)}</div></div>
          <div class="detail-box"><div class="detail-box__label">گرد کردن</div><div class="detail-box__value">${ROUNDINGS.find((r) => r.key === state.rule.rounding)?.label || '—'}</div></div>
          <div class="detail-box"><div class="detail-box__label">محدوده</div><div class="detail-box__value">${state.rule.min ? `از ${fa(parseNumber(state.rule.min) || 0)}` : 'بدون حد'} ${state.rule.max ? `تا ${fa(parseNumber(state.rule.max) || 0)}` : ''}</div></div>
        </div>
        <div class="alert alert--warning" style="margin-top:14px">${icon('triangle-alert')}<div class="alert__text">
          پس از اعمال، قیمت‌ها در اسنپ‌شاپ تغییر می‌کنند. اگر WooCommerce Mirror فعال باشد، همگام‌سازی معکوس ممکن است قیمت ووکامرس را نیز به‌روزرسانی کند.
        </div></div>`,
    })}`;
}

function footer() {
  const selectedCount = state.selected.size;
  return `
    <div class="card__foot" style="justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div class="u-row gap-8">
        <button class="btn btn--secondary btn--sm" id="pricing-back" ${state.step === 1 ? 'disabled' : ''}>${icon('arrow-right')} مرحله قبل</button>
        <span class="t-muted" style="font-size:11px">${fa(selectedCount)} محصول انتخاب‌شده</span>
      </div>
      <div class="u-row gap-8">
        <button class="btn btn--ghost btn--sm" id="pricing-reset">شروع مجدد</button>
        ${state.step < 4
          ? `<button class="btn btn--primary btn--sm" id="pricing-next" ${state.step === 1 && !selectedCount ? 'disabled' : ''}>
               ${state.step === 3 ? 'تأیید و بررسی نهایی' : 'مرحله بعد'} ${icon('arrow-left')}
             </button>`
          : `<button class="btn btn--primary btn--sm" id="pricing-apply">${icon('check')} اعمال نهایی قیمت‌ها</button>`}
      </div>
    </div>`;
}

async function renderStep(root) {
  const box = root.querySelector('#pricing-step');
  if (state.step === 1) {
    box.innerHTML = stepProducts();
    refreshIcons(root);
    bindStep1(root);
  } else if (state.step === 2) {
    box.innerHTML = stepRule();
    refreshIcons(root);
    bindStepRule(root);
  } else if (state.step === 3) {
    box.innerHTML = stepPreview();
    refreshIcons(root);
  } else {
    box.innerHTML = stepReview();
    refreshIcons(root);
  }
  root.querySelector('#stepper').innerHTML = stepper();
  root.querySelector('#pricing-footer').innerHTML = footer();
  refreshIcons(root);
  bindFooter(root);
}

function bindFooter(root) {
  root.querySelector('#pricing-back')?.addEventListener('click', () => {
    if (state.step > 1) { state.step -= 1; renderStep(root); }
  });
  root.querySelector('#pricing-reset')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'شروع مجدد قیمت‌گذاری',
      desc: 'محصولات انتخاب‌شده و قانون فعلی پاک می‌شوند.',
      confirmText: 'شروع مجدد',
      tone: 'warning',
    });
    if (!ok) return;
    state = { ...initial(), history: state.history };
    root.querySelector('#pricing-view').innerHTML = builderView();
    refreshIcons(root);
    bindBuilder(root);
    loadProducts(root);
  });

  root.querySelector('#pricing-next')?.addEventListener('click', async () => {
    if (state.step === 2) {
      const value = parseNumber(state.rule.value);
      if (!Number.isFinite(value) || (state.rule.type !== 'formula' && value <= 0)) {
        toast({ title: 'مقدار قانون معتبر نیست', text: 'یک عدد بزرگ‌تر از صفر وارد کنید.', tone: 'warning' });
        return;
      }
    }
    if (state.step === 2) {
      state.previewing = true;
      state.step = 3;
      await renderStep(root);
      try {
        state.preview = await api.post('/pricing/preview', {
          productIds: Array.from(state.selected.keys()),
          rule: state.rule,
        });
        state.previewing = false;
        root.querySelector('#pricing-step').innerHTML = stepPreview();
        refreshIcons(root);
      } catch (err) {
        state.previewing = false;
        state.step = 2;
        await renderStep(root);
        toast({ title: 'پیش‌نمایش ناموفق بود', text: err.message, tone: 'error' });
      }
      return;
    }
    if (state.step < 4) {
      state.step += 1;
      renderStep(root);
    }
  });

  root.querySelector('#pricing-apply')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const ok = await confirmDialog({
      title: 'اعمال نهایی قیمت‌ها',
      desc: `قیمت ${fa(state.preview?.summary?.changed || 0)} محصول در اسنپ‌شاپ تغییر می‌کند.`,
      details: 'این عملیات در تاریخچه ثبت می‌شود و امکان درخواست بازگردانی قیمت قبلی وجود دارد.',
      confirmText: 'اعمال قیمت‌ها',
      tone: 'primary',
      iconName: 'badge-percent',
    });
    if (!ok) return;
    setBusy(btn, true);
    try {
      await api.post('/pricing/apply', {
        productIds: Array.from(state.selected.keys()),
        rule: state.rule,
        ruleLabel: ruleLabel(state.rule),
      });
      toast({ title: 'قیمت‌ها اعمال شد', text: `${fa(state.preview?.summary?.changed || 0)} محصول به‌روزرسانی شد.`, tone: 'success' });
      state.preview = null;
      state.selected = new Map();
      state.step = 1;
      switchView(root, 'history');
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'اعمال قیمت ناموفق بود', text: err.message, tone: 'error' });
    }
  });
}

function builderView() {
  return `
    <div id="stepper">${stepper()}</div>
    <div id="pricing-step">${stepProducts()}</div>
    <div id="pricing-footer">${footer()}</div>`;
}

function historyView() {
  return card({
    title: 'تاریخچه تغییرات قیمت',
    sub: 'همه عملیات قیمت‌گذاری، نتیجه و امکان درخواست بازگردانی',
    flush: true,
    body: `<div id="history-body">${skeletonRows(5, 7)}</div>`,
  });
}

async function loadHistory(root) {
  try {
    const { items } = await api.get('/pricing/history');
    state.history = items;
    const body = root.querySelector('#history-body');
    body.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>تاریخ</th>
            <th>قانون</th>
            <th>محصولات</th>
            <th>اعمال‌شده</th>
            <th>ناموفق</th>
            <th>وضعیت</th>
            <th>کاربر</th>
            <th style="text-align:end">عملیات</th>
          </tr></thead>
          <tbody>
            ${items.map((h) => `
              <tr>
                <td><div class="cell-stack"><span class="cell-stack__main" style="font-size:11.8px">${formatDate(h.at, { time: true })}</span><span class="cell-stack__sub">${relTime(h.at)}</span></div></td>
                <td><span style="font-size:12px">${escapeHtml(h.rule)}</span></td>
                <td class="num">${fa(h.products)}</td>
                <td class="num" style="color:var(--success)">${fa(h.applied)}</td>
                <td class="num" style="color:${h.failed ? 'var(--danger)' : 'var(--muted)'}">${fa(h.failed)}</td>
                <td>${badge(h.status)}</td>
                <td><span class="t-muted" style="font-size:11.5px">${escapeHtml(h.user)}</span></td>
                <td class="actions">
                  <button class="btn btn--ghost btn--sm" data-revert="${h.id}">${icon('history')} بازگردانی</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    refreshIcons(body);
    body.querySelectorAll('[data-revert]').forEach((btn) => {
      btn.addEventListener('click', () => openRevert(root, btn.dataset.revert));
    });
  } catch (err) {
    const body = root.querySelector('#history-body');
    body.innerHTML = errorState({ text: err.message });
    refreshIcons(body);
    body.querySelector('[data-retry]')?.addEventListener('click', () => loadHistory(root));
  }
}

async function openRevert(root, id) {
  const record = state.history.find((h) => h.id === id);
  const handle = openModal({
    title: 'درخواست بازگردانی قیمت',
    desc: escapeHtml(record?.rule || ''),
    iconName: 'history',
    size: 'lg',
    body: '<div class="skeleton sk-line" style="height:120px"></div>',
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-cancel>انصراف</button><button class="btn btn--primary" data-confirm disabled>ثبت درخواست بازگردانی</button>',
    onMount: (h) => {
      h.root.querySelector('[data-cancel]').addEventListener('click', h.close);
      h.root.querySelector('[data-confirm]').addEventListener('click', () => {
        h.close();
        toast({
          title: 'درخواست بازگردانی ثبت شد',
          text: 'پس از بررسی، قیمت‌های قبلی روی محصولات اعمال می‌شود. وضعیت در صف عملیات قابل پیگیری است.',
          tone: 'success',
        });
      });
    },
  });
  refreshIcons(handle.root);
  try {
    const { preview } = await api.post(`/pricing/history/${id}/revert`);
    handle.body.innerHTML = `
      <div class="alert alert--info">${icon('info')}<div class="alert__text">این جدول قیمت فعلی و قیمت قبلی را نشان می‌دهد. بازگردانی فقط پس از تأیید شما ثبت می‌شود.</div></div>
      <div class="table-wrap" style="margin-top:12px;max-height:340px;overflow:auto">
        <table class="table">
          <thead><tr><th>محصول</th><th>قیمت فعلی</th><th>قیمت قبلی</th></tr></thead>
          <tbody>
            ${preview.map((r) => `
              <tr>
                <td><span class="t-clamp" style="max-width:250px;display:inline-block">${escapeHtml(r.name)}</span></td>
                <td class="num t-muted">${moneyCell(r.current)}</td>
                <td class="num" style="font-weight:600">${moneyCell(r.restored)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    refreshIcons(handle.body);
    const confirm = handle.root.querySelector('[data-confirm]');
    confirm.disabled = false;
  } catch (err) {
    handle.body.innerHTML = errorState({ text: err.message });
    refreshIcons(handle.body);
  }
}

function bindBuilder(root) {
  bindFooter(root);
}

function bindViewTabs(root) {
  root.querySelectorAll('[data-view-btn]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(root, btn.dataset.viewBtn));
  });
}

function switchView(root, view) {
  state.view = view;
  root.querySelectorAll('[data-view-btn]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.viewBtn === view);
  });
  root.querySelector('#pricing-view').innerHTML = view === 'builder' ? builderView() : historyView();
  refreshIcons(root);
  if (view === 'builder') {
    bindBuilder(root);
    loadProducts(root);
  } else {
    loadHistory(root);
  }
}

export async function render(root) {
  state = initial();
  root.innerHTML = `
    ${pageHead({
      title: 'قیمت‌گذاری',
      sub: 'قانون‌های قیمت، پیش‌نمایش تغییرات و تاریخچه بازگردانی',
      actions: `<a class="btn btn--secondary" href="#/products">${icon('package')}<span>محصولات</span></a>`,
    })}
    <div class="tabs" style="margin-bottom:14px">
      <button class="tab ${state.view === 'builder' ? 'is-active' : ''}" data-view-btn="builder">${icon('wand-2')} قانون جدید</button>
      <button class="tab ${state.view === 'history' ? 'is-active' : ''}" data-view-btn="history">${icon('history')} تاریخچه تغییرات</button>
    </div>
    <div id="pricing-view">${builderView()}</div>
  `;
  refreshIcons(root);
  bindViewTabs(root);
  bindBuilder(root);
  await loadProducts(root);
}
