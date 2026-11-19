import { api } from '../core/api.js';
import {
  icon, refreshIcons, badge, openDrawer, skeletonRows, emptyState, errorState, copyText,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, duration } from '../core/utils.js';
import { pageHead, card, paginationBar, bindPagination } from '../components/common.js';

let state = null;

function initial() {
  return { page: 1, perPage: 20, level: 'all', method: 'all', search: '', data: null, loading: true };
}

async function load(root) {
  state.loading = true;
  const host = root.querySelector('#logs-table');
  host.innerHTML = `<div class="table-wrap"><table class="table"><tbody>${skeletonRows(6, 12)}</tbody></table></div>`;
  refreshIcons(root);
  try {
    const data = await api.get('/logs', {
      page: state.page, per_page: state.perPage, level: state.level, method: state.method, search: state.search,
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

const LEVEL_LABEL = { info: 'اطلاع', warning: 'هشدار', error: 'خطا' };
const LEVEL_TONE = { info: 'info', warning: 'warning', error: 'danger' };

function paint(root) {
  const { items } = state.data;
  const host = root.querySelector('#logs-table');
  if (!items.length) {
    host.innerHTML = emptyState({
      iconName: 'scroll-text',
      title: 'لاگی با این فیلترها نیست',
      text: 'بازه یا سطح لاگ را تغییر دهید. لاگ‌ها فقط برای درخواست‌های همین افزونه ثبت می‌شوند.',
    });
    refreshIcons(host);
    return;
  }
  host.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>زمان</th>
          <th>سطح</th>
          <th>درخواست</th>
          <th>کد</th>
          <th>مدت</th>
          <th>پیام</th>
          <th style="text-align:end">جزئیات</th>
        </tr></thead>
        <tbody>
          ${items.map((l) => `
            <tr data-log="${l.id}" style="cursor:pointer">
              <td><span class="t-muted" style="font-size:11px">${formatDate(l.time, { time: true })}</span></td>
              <td>${badge(LEVEL_TONE[l.level], { text: LEVEL_LABEL[l.level] })}</td>
              <td>
                <div class="u-row gap-6">
                  <span class="badge badge--neutral" style="font-family:var(--font-mono);font-size:10px;direction:ltr">${escapeHtml(l.method)}</span>
                  <span class="t-mono t-clamp" style="max-width:280px">${escapeHtml(l.path)}</span>
                </div>
              </td>
              <td><span class="log-row-status" style="color:${l.status >= 500 ? 'var(--danger)' : l.status >= 400 ? 'var(--warning)' : 'var(--success)'}">${fa(l.status)}</span></td>
              <td class="num"><span class="t-muted" style="font-size:11px">${fa(l.durationMs)} ms</span></td>
              <td><span class="t-muted t-clamp" style="max-width:240px;display:inline-block;font-size:11.5px">${escapeHtml(l.message)}</span></td>
              <td class="actions"><button class="row-action" data-view-log="${l.id}" aria-label="جزئیات">${icon('eye')}</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${paginationBar({ page: state.data.page, pages: state.data.pages, total: state.data.total, perPage: state.data.per_page, label: 'لاگ' })}`;
  refreshIcons(host);

  bindPagination(host, (page) => { state.page = page; load(root); });
  host.querySelectorAll('[data-log]').forEach((row) => {
    row.addEventListener('click', () => openLog(row.dataset.log));
  });
  host.querySelectorAll('[data-view-log]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openLog(btn.dataset.viewLog); });
  });
}

function pretty(obj) {
  return escapeHtml(JSON.stringify(obj, null, 2))
    .replace(/(&quot;[\w-]+&quot;)(\s*:)/g, '<span class="k">$1</span>$2')
    .replace(/:\s*(&quot;[^&]*&quot;)/g, ': <span class="s">$1</span>')
    .replace(/:\s*(-?\d+(?:\.\d+)?)/g, ': <span class="n">$1</span>');
}

function openLog(id) {
  const log = state.data.items.find((l) => l.id === id);
  if (!log) return;
  const handle = openDrawer({
    title: 'جزئیات درخواست',
    sub: `${log.method} ${log.path}`,
    size: 'lg',
    body: `
      <div class="u-row gap-8" style="margin-bottom:14px">
        ${badge(LEVEL_TONE[log.level], { text: LEVEL_LABEL[log.level] })}
        <span class="log-row-status" style="color:${log.status >= 400 ? 'var(--danger)' : 'var(--success)'}">HTTP ${fa(log.status)}</span>
        <span class="t-muted" style="font-size:11px">${formatDate(log.time, { time: true })}</span>
        <span class="t-muted" style="font-size:11px">${fa(log.durationMs)} میلی‌ثانیه</span>
      </div>

      <div class="alert alert--info" style="margin-bottom:14px">${icon('shield-check')}<div class="alert__text">
        هدرهای حساس، توکن دسترسی و مقادیر محرمانه پیش از ذخیره لاگ پاکسازی شده‌اند و در این نمایانگر نمایش داده نمی‌شوند.
      </div></div>

      <div class="t-section-title" style="margin-bottom:6px">درخواست</div>
      <pre class="log-json">${pretty(log.request)}</pre>

      <div class="t-section-title" style="margin:14px 0 6px">پاسخ</div>
      <pre class="log-json">${pretty(log.response)}</pre>

      ${log.level === 'error' ? `<div class="alert alert--danger" style="margin-top:14px">${icon('alert-circle')}<div>
        <div class="alert__title">خطای پاکسازی‌شده</div>
        <div class="alert__text">${escapeHtml(log.message)} — جزئیات کامل خطا در سرور ثبت شده و مقادیر حساس حذف شده‌اند.</div>
      </div></div>` : ''}`,
    footer: `
      <div class="spacer" style="flex:1"></div>
      <button class="btn btn--secondary btn--sm" data-copy>${icon('copy')} کپی شناسه</button>
      <button class="btn btn--secondary btn--sm" data-close>بستن</button>`,
  });
  refreshIcons(handle.root);
  handle.footer.querySelector('[data-close]').addEventListener('click', handle.close);
  handle.footer.querySelector('[data-copy]').addEventListener('click', () => copyText(log.id));
}

export async function render(root) {
  state = initial();
  root.innerHTML = `
    ${pageHead({
      title: 'لاگ‌ها',
      sub: 'تاریخچه درخواست‌های API، خطاها و پاسخ‌های پاکسازی‌شده',
      actions: `<button class="btn btn--secondary" id="logs-refresh">${icon('refresh-cw')}<span>بروزرسانی</span></button>`,
    })}
    ${card({
      flush: true,
      body: `
        <div class="table-toolbar">
          <div class="search-box" style="min-width:230px">
            ${icon('search')}
            <input class="input" id="log-search" placeholder="جست‌وجو در مسیر، پیام یا کد وضعیت…" />
          </div>
          <select class="select" id="log-level" style="width:auto">
            <option value="all">همه سطوح</option>
            <option value="info">اطلاع</option>
            <option value="warning">هشدار</option>
            <option value="error">خطا</option>
          </select>
          <select class="select" id="log-method" style="width:auto">
            <option value="all">همه متدها</option>
            ${['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].map((m) => `<option value="${m}">${m}</option>`).join('')}
          </select>
          <div class="table-toolbar__right">
            <span class="t-muted" style="font-size:11px">${icon('lock')} مقادیر حساس پاکسازی می‌شوند</span>
          </div>
        </div>
        <div id="logs-table"></div>`,
    })}`;
  refreshIcons(root);

  let t;
  root.querySelector('#log-search').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.search = e.target.value; state.page = 1; load(root); }, 280);
  });
  ['level', 'method'].forEach((key) => {
    root.querySelector(`#log-${key}`).addEventListener('change', (e) => {
      state[key] = e.target.value;
      state.page = 1;
      load(root);
    });
  });
  root.querySelector('#logs-refresh').addEventListener('click', () => load(root));

  await load(root);
}
