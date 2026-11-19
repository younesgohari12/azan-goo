import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openDrawer, confirmDialog,
  skeletonRows, emptyState, errorState,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, relTime, duration } from '../core/utils.js';
import { pageHead, card, paginationBar, bindPagination, statCard, tabs } from '../components/common.js';

let state = null;
let pollTimer = null;

function initial(params) {
  return {
    page: 1,
    perPage: 15,
    status: params.get('status') || 'all',
    search: '',
    data: null,
    all: [],
    loading: true,
  };
}

async function load(root, { silent = false } = {}) {
  if (!silent) {
    state.loading = true;
    root.querySelector('#jobs-table').innerHTML = `<div class="table-wrap"><table class="table"><tbody>${skeletonRows(7, 8)}</tbody></table></div>`;
    refreshIcons(root);
  }
  try {
    const [data, all] = await Promise.all([
      api.get('/jobs', { page: state.page, per_page: state.perPage, status: state.status, search: state.search }),
      api.get('/jobs', { per_page: 100 }),
    ]);
    state.data = data;
    state.all = all.items;
    state.loading = false;
    paint(root);
  } catch (err) {
    state.loading = false;
    if (silent) return;
    root.querySelector('#jobs-table').innerHTML = errorState({ text: err.message });
    refreshIcons(root);
    root.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function statsMarkup() {
  const all = state.all;
  const count = (s) => all.filter((j) => j.status === s).length;
  return `
    ${statCard({ iconName: 'loader', tone: 'info', label: 'در حال اجرا', value: fa(count('running')), foot: '<span class="t-muted">پیشرفت از Job API</span>' })}
    ${statCard({ iconName: 'clock', tone: 'warning', label: 'در صف', value: fa(count('pending')), foot: '<span class="t-muted">در انتظار پردازش</span>' })}
    ${statCard({ iconName: 'circle-check-big', tone: 'success', label: 'کامل‌شده', value: fa(count('completed')), foot: '<span class="t-muted">بدون خطا</span>' })}
    ${statCard({ iconName: 'circle-alert', tone: 'danger', label: 'ناموفق یا ناقص', value: fa(count('failed') + count('partial')), foot: '<a class="btn btn--link btn--sm" href="#/jobs?status=failed">مشاهده خطاها</a>' })}
  `;
}

function actionButtons(job) {
  return `
    <div class="row-actions">
      <button class="row-action" data-view-job="${job.id}" aria-label="جزئیات">${icon('eye')}</button>
      <button class="row-action" data-cancel-job="${job.id}" aria-label="لغو" ${job.cancelable ? '' : 'disabled style="opacity:.35;cursor:not-allowed"'}>${icon('ban')}</button>
      <button class="row-action" data-retry-job="${job.id}" aria-label="تلاش مجدد" ${job.retryable ? '' : 'disabled style="opacity:.35;cursor:not-allowed"'}>${icon('rotate-ccw')}</button>
    </div>`;
}

function paint(root) {
  const { items } = state.data;
  const host = root.querySelector('#jobs-table');
  root.querySelector('#jobs-stats').innerHTML = statsMarkup();
  refreshIcons(root.querySelector('#jobs-stats'));

  if (!items.length) {
    host.innerHTML = emptyState({
      iconName: 'list-checks',
      title: 'عملیاتی در این وضعیت نیست',
      text: 'فیلتر وضعیت را تغییر دهید یا یک همگام‌سازی جدید اجرا کنید.',
      action: `<a class="btn btn--secondary btn--sm" href="#/sync">${icon('refresh-cw')} مرکز همگام‌سازی</a>`,
    });
    refreshIcons(host);
    return;
  }

  host.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>نوع عملیات</th>
          <th>فروشگاه</th>
          <th>وضعیت</th>
          <th style="min-width:150px">پیشرفت</th>
          <th>موفق / ناموفق</th>
          <th>زمان اجرا</th>
          <th style="text-align:end">عملیات</th>
        </tr></thead>
        <tbody>
          ${items.map((j) => `
            <tr>
              <td>
                <div class="cell-stack">
                  <span class="cell-stack__main">${escapeHtml(j.type)}</span>
                  <span class="cell-stack__sub t-mono">${escapeHtml(j.id)}</span>
                </div>
              </td>
              <td><span class="t-muted" style="font-size:11.5px">${escapeHtml(j.store)}</span></td>
              <td>${badge(j.status)}</td>
              <td>
                <div class="progress ${j.status === 'running' ? '' : j.status === 'pending' ? 'is-indeterminate' : ''}" style="margin-bottom:4px">
                  <div class="progress__bar ${j.status === 'failed' ? 'is-danger' : j.status === 'partial' ? 'is-warning' : j.status === 'completed' ? 'is-success' : ''}" style="width:${j.progress}%"></div>
                </div>
                <span class="t-muted" style="font-size:10.5px">${fa(j.progress)}٪ از ${fa(j.total)} مورد</span>
              </td>
              <td>
                <span class="t-success" style="font-weight:600">${fa(j.success)}</span>
                <span class="t-faint"> / </span>
                <span style="color:${j.failed ? 'var(--danger)' : 'var(--muted)'};font-weight:${j.failed ? 600 : 400}">${fa(j.failed)}</span>
              </td>
              <td>
                <div class="cell-stack">
                  <span class="cell-stack__main" style="font-size:11.5px">${j.durationSec ? duration(j.durationSec) : '—'}</span>
                  <span class="cell-stack__sub">${j.startedAt ? relTime(j.startedAt) : 'شروع نشده'}</span>
                </div>
              </td>
              <td class="actions">${actionButtons(j)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${paginationBar({ page: state.data.page, pages: state.data.pages, total: state.data.total, perPage: state.data.per_page, label: 'عملیات' })}`;
  refreshIcons(host);

  bindPagination(host, (page) => { state.page = page; load(root); });

  host.querySelectorAll('[data-view-job]').forEach((btn) => {
    btn.addEventListener('click', () => openJob(btn.dataset.viewJob));
  });
  host.querySelectorAll('[data-cancel-job]').forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener('click', () => cancelJob(root, btn.dataset.cancelJob));
  });
  host.querySelectorAll('[data-retry-job]').forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener('click', () => retryJob(root, btn.dataset.retryJob));
  });
}

function openJob(id) {
  const job = state.all.find((j) => j.id === id) || state.data.items.find((j) => j.id === id);
  if (!job) return;
  const handle = openDrawer({
    title: escapeHtml(job.type),
    sub: `شناسه عملیات ${job.id}`,
    body: `
      <div class="u-row gap-8" style="margin-bottom:14px">${badge(job.status)}<span class="t-muted" style="font-size:11.5px">${escapeHtml(job.store)}</span></div>
      <div class="progress progress--lg" style="margin-bottom:6px">
        <div class="progress__bar ${job.status === 'failed' ? 'is-danger' : job.status === 'completed' ? 'is-success' : ''}" style="width:${job.progress}%"></div>
      </div>
      <div class="u-between" style="margin-bottom:14px">
        <span class="t-muted" style="font-size:11px">${fa(job.progress)}٪</span>
        <span class="t-muted" style="font-size:11px">${fa(job.success)} موفق — ${fa(job.failed)} ناموفق از ${fa(job.total)}</span>
      </div>
      <dl class="kv-list">
        <div><dt>زمان ایجاد</dt><dd>${formatDate(job.createdAt, { time: true })}</dd></div>
        <div><dt>زمان شروع</dt><dd>${job.startedAt ? formatDate(job.startedAt, { time: true }) : 'شروع نشده'}</dd></div>
        <div><dt>مدت اجرا</dt><dd>${job.durationSec ? duration(job.durationSec) : '—'}</dd></div>
        <div><dt>قابل لغو</dt><dd>${job.cancelable ? 'بله' : 'خیر'}</dd></div>
        <div><dt>قابل تلاش مجدد</dt><dd>${job.retryable ? 'بله' : 'خیر'}</dd></div>
      </dl>
      ${job.error ? `<div class="alert alert--danger" style="margin-top:14px">${icon('alert-circle')}<div>
        <div class="alert__title">جزئیات خطا</div>
        <div class="alert__text">${escapeHtml(job.error)}</div>
      </div></div>` : ''}
      <div class="t-muted" style="font-size:11px;margin-top:14px;line-height:1.8">
        پیشرفت و شمارش موفق/ناموفق مستقیماً از Job API خوانده می‌شود. لغو فقط برای عملیات در صف یا در حال اجرا و تلاش مجدد فقط برای عملیات ناموفق، ناقص یا لغوشده مجاز است.
      </div>`,
    footer: `
      <div class="spacer" style="flex:1"></div>
      ${job.cancelable ? `<button class="btn btn--danger-soft btn--sm" data-cancel>${icon('ban')} لغو عملیات</button>` : ''}
      ${job.retryable ? `<button class="btn btn--primary btn--sm" data-retry>${icon('rotate-ccw')} تلاش مجدد</button>` : ''}
      <button class="btn btn--secondary btn--sm" data-close>بستن</button>`,
  });
  refreshIcons(handle.root);
  handle.footer.querySelector('[data-close]').addEventListener('click', handle.close);
  handle.footer.querySelector('[data-cancel]')?.addEventListener('click', () => { handle.close(); cancelJob(document, job.id); });
  handle.footer.querySelector('[data-retry]')?.addEventListener('click', () => { handle.close(); retryJob(document, job.id); });
}

async function cancelJob(root, id) {
  const job = state.all.find((j) => j.id === id);
  const ok = await confirmDialog({
    title: 'لغو عملیات',
    desc: `عملیات «${job?.type || ''}» متوقف می‌شود.`,
    details: 'موارد پردازش‌شده حفظ می‌شوند و امکان تلاش مجدد وجود خواهد داشت.',
    confirmText: 'لغو عملیات',
    tone: 'danger',
    iconName: 'ban',
  });
  if (!ok) return;
  try {
    await api.post(`/jobs/${id}/cancel`);
    toast({ title: 'عملیات لغو شد', tone: 'success' });
    refreshJobs();
  } catch (err) {
    toast({ title: 'لغو ناموفق بود', text: err.message, tone: 'error' });
  }
}

async function retryJob(root, id) {
  const job = state.all.find((j) => j.id === id);
  const ok = await confirmDialog({
    title: 'تلاش مجدد عملیات',
    desc: `عملیات «${job?.type || ''}» دوباره در صف قرار می‌گیرد.`,
    details: 'فقط موارد ناموفق پردازش می‌شوند و موارد موفق تکرار نمی‌شوند.',
    confirmText: 'تلاش مجدد',
    iconName: 'rotate-ccw',
  });
  if (!ok) return;
  try {
    await api.post(`/jobs/${id}/retry`);
    toast({ title: 'عملیات در صف قرار گرفت', tone: 'success' });
    refreshJobs();
  } catch (err) {
    toast({ title: 'تلاش مجدد ناموفق بود', text: err.message, tone: 'error' });
  }
}

let currentRoot = null;
function refreshJobs() {
  if (currentRoot) load(currentRoot, { silent: true });
}

export async function render(root, ctx) {
  state = initial(ctx.params);
  currentRoot = root;
  root.innerHTML = `
    ${pageHead({
      title: 'صف عملیات',
      sub: 'وضعیت زنده عملیات همگام‌سازی، قیمت‌گذاری و خروجی داده',
      actions: `<button class="btn btn--secondary" id="jobs-refresh">${icon('refresh-cw')}<span>بروزرسانی</span></button>`,
    })}
    <div class="stats-grid" id="jobs-stats" style="grid-template-columns:repeat(4,minmax(0,1fr))"></div>
    <div class="section-gap">
      ${card({
        flush: true,
        body: `
          <div class="table-toolbar">
            <div class="tabs tabs--pill" id="jobs-tabs">
              ${[['all', 'همه'], ['running', 'در حال اجرا'], ['pending', 'در صف'], ['completed', 'کامل'], ['partial', 'ناقص'], ['failed', 'ناموفق'], ['canceled', 'لغوشده']].map(([k, l]) => `
                <button class="tab ${state.status === k ? 'is-active' : ''}" data-status="${k}">${l}</button>`).join('')}
            </div>
            <div class="table-toolbar__right">
              <span class="t-muted" style="font-size:11px">${icon('activity')} به‌روزرسانی خودکار هر ۶ ثانیه</span>
            </div>
          </div>
          <div id="jobs-table"></div>`,
      })}
    </div>`;
  refreshIcons(root);

  root.querySelectorAll('#jobs-tabs [data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.status = btn.dataset.status;
      state.page = 1;
      root.querySelectorAll('#jobs-tabs [data-status]').forEach((b) => b.classList.toggle('is-active', b === btn));
      load(root);
    });
  });
  root.querySelector('#jobs-refresh').addEventListener('click', () => load(root));

  await load(root);

  clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    const running = state.all.some((j) => ['running', 'pending'].includes(j.status));
    if (running && document.visibilityState === 'visible') load(root, { silent: true });
  }, 6000);

  return { cleanup: () => { clearInterval(pollTimer); currentRoot = null; } };
}
