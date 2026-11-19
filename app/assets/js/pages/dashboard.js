import { api } from '../core/api.js';
import { store } from '../core/store.js';
import {
  icon, refreshIcons, toast, badge, errorState, openDrawer,
} from '../core/ui.js';
import { fa, relTime, formatDate, escapeHtml, percent } from '../core/utils.js';
import {
  pageHead, card, statCard, moneyCell,
} from '../components/common.js';

function skeleton() {
  const stat = Array.from({ length: 6 }).map(() => `
    <article class="stat">
      <div class="skeleton sk-line" style="width:60%"></div>
      <div class="skeleton sk-line sk-line--lg" style="width:40%;height:20px"></div>
      <div class="skeleton sk-line sk-line--sm" style="width:70%"></div>
    </article>`).join('');
  const rows = Array.from({ length: 5 }).map(() => `
    <tr>${Array.from({ length: 5 }).map(() => '<td><div class="skeleton sk-line" style="width:70%"></div></td>').join('')}</tr>`).join('');
  return `
    <div class="stats-grid">${stat}</div>
    <div class="dash-grid">
      <section class="card"><div class="card__head"><div class="skeleton sk-line" style="width:140px"></div></div>
        <div class="table-wrap"><table class="table"><tbody>${rows}</tbody></table></div>
      </section>
      <section class="card"><div class="card__head"><div class="skeleton sk-line" style="width:110px"></div></div>
        <div class="card__body stack-12">
          ${Array.from({ length: 4 }).map(() => '<div class="skeleton sk-line" style="width:100%;height:32px"></div>').join('')}
        </div>
      </section>
    </div>`;
}

function healthCard(health, counts) {
  const mirror = health.mirror.enabled;
  return `
    <section class="card">
      <div class="card__head">
        <div class="u-grow">
          <div class="card__title">وضعیت اتصال و همگام‌سازی</div>
          <div class="card__sub">آخرین بررسی: ${relTime(health.mirror.lastProductSync)}</div>
        </div>
        ${badge('connected', { text: 'سالم' })}
      </div>
      <div class="card__body card__body--flush">
        <div class="health-row">
          <div class="health-row__icon is-ok">${icon('shopping-cart')}</div>
          <div class="health-row__main">
            <div class="health-row__title">ووکامرس ${badge('connected', { text: 'متصل' })}</div>
            <div class="health-row__meta">${escapeHtml(health.woocommerce.detail)}</div>
          </div>
          <button class="icon-btn" data-goto="/connections" aria-label="مدیریت">${icon('chevron-left')}</button>
        </div>
        <div class="health-row">
          <div class="health-row__icon is-ok">${icon('store')}</div>
          <div class="health-row__main">
            <div class="health-row__title">اسنپ‌شاپ ${badge('connected', { text: 'متصل' })}</div>
            <div class="health-row__meta">${escapeHtml(health.snapp.detail)}</div>
          </div>
          <button class="icon-btn" data-goto="/connections" aria-label="مدیریت">${icon('chevron-left')}</button>
        </div>
        <div class="health-row">
          <div class="health-row__icon ${mirror ? 'is-ok' : ''}">${icon('copy-check')}</div>
          <div class="health-row__main">
            <div class="health-row__title">WooCommerce Mirror</div>
            <div class="health-row__meta">${mirror ? 'فعال — منبع حقیقت: ووکامرس' : 'غیرفعال'}</div>
          </div>
          <label class="switch switch--sm">
            <input type="checkbox" id="dash-mirror" ${mirror ? 'checked' : ''} />
            <span class="switch__track"></span>
          </label>
        </div>
        <div class="health-row">
          <div class="health-row__icon ${health.autoSync ? 'is-ok' : 'is-warn'}">${icon('timer')}</div>
          <div class="health-row__main">
            <div class="health-row__title">همگام‌سازی خودکار</div>
            <div class="health-row__meta">${health.autoSync ? `هر ${fa(health.interval)} دقیقه` : 'خاموش'} — آخرین دریافت ${relTime(health.mirror.lastOrderSync)}</div>
          </div>
          <label class="switch switch--sm">
            <input type="checkbox" id="dash-autosync" ${health.autoSync ? 'checked' : ''} />
            <span class="switch__track"></span>
          </label>
        </div>
      </div>
      <div class="card__foot" style="gap:14px;flex-wrap:wrap">
        <span class="t-muted" style="font-size:11px">${fa(counts.unmapped)} بدون نگاشت</span>
        <span class="t-muted" style="font-size:11px">${fa(counts.conflicts)} تداخل</span>
        <span class="t-muted" style="font-size:11px">${fa(counts.failedJobs)} عملیات ناموفق</span>
        <a class="btn btn--link btn--sm" href="#/sync" style="margin-inline-start:auto">مرکز همگام‌سازی ${icon('arrow-left')}</a>
      </div>
    </section>`;
}

function quickActions() {
  const actions = [
    { icon: 'package-search', label: 'محصولات نیازمند بررسی', href: '#/products?issue=1' },
    { icon: 'git-compare-arrows', label: 'نگاشت خودکار SKU', href: '#/mapping?tab=unmapped' },
    { icon: 'refresh-cw', label: 'اجرای اسکن دستی', action: 'scan' },
    { icon: 'list-checks', label: 'صف عملیات', href: '#/jobs' },
    { icon: 'workflow', label: 'قانون جدید', href: '#/automation?new=1' },
    { icon: 'file-down', label: 'خروجی CSV', href: '#/data?export=csv' },
  ];
  return `
    <section class="card">
      <div class="card__head"><div class="card__title">دسترسی سریع</div></div>
      <div class="card__body">
        <div class="quick-actions">
          ${actions.map((a) => `
            <a class="quick-action" ${a.href ? `href="${a.href}"` : `data-action="${a.action}"`} style="cursor:pointer">
              ${icon(a.icon)}<span>${a.label}</span>
            </a>`).join('')}
        </div>
      </div>
    </section>`;
}

function ordersCard(orders) {
  return card({
    title: 'آخرین سفارش‌ها',
    sub: 'سفارش‌های دریافت‌شده از اسنپ‌شاپ',
    actions: `<a class="btn btn--ghost btn--sm" href="#/orders">همه سفارش‌ها ${icon('arrow-left')}</a>`,
    flush: true,
    body: `
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>شماره سفارش</th>
            <th>مشتری</th>
            <th>تاریخ</th>
            <th>مبلغ</th>
            <th>وضعیت</th>
            <th>ووکامرس</th>
          </tr></thead>
          <tbody>
            ${orders.map((o) => `
              <tr>
                <td><span class="t-mono">${escapeHtml(o.snappOrderId)}</span></td>
                <td>
                  <div class="cell-stack">
                    <span class="cell-stack__main">${escapeHtml(o.customer.name)}</span>
                    <span class="cell-stack__sub">${escapeHtml(o.customer.city)}</span>
                  </div>
                </td>
                <td class="num"><span class="t-muted" style="font-size:11.5px">${formatDate(o.createdAt, { time: true })}</span></td>
                <td class="num">${moneyCell(o.amount)}</td>
                <td>${badge(o.status)}</td>
                <td>${o.imported === 'imported'
                  ? `<span class="t-mono t-muted">#${fa(o.wooOrderId)}</span>`
                  : badge(o.imported)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`,
  });
}

function jobsCard(jobs) {
  return card({
    title: 'عملیات در حال اجرا',
    sub: jobs.length ? `${fa(jobs.length)} عملیات فعال در صف` : 'عملیات فعالی وجود ندارد',
    actions: `<a class="btn btn--ghost btn--sm" href="#/jobs">صف عملیات ${icon('arrow-left')}</a>`,
    flush: true,
    body: jobs.length
      ? jobs.map((j) => `
        <div class="job-mini">
          <div class="job-mini__top">
            <span class="t-strong" style="font-size:12px">${escapeHtml(j.type)}</span>
            ${badge(j.status, { dot: true })}
            <span class="job-mini__meta">${j.status === 'running' ? `${fa(j.progress)}٪` : 'در انتظار شروع'}</span>
          </div>
          <div class="progress ${j.status === 'running' ? '' : 'is-indeterminate'}">
            <div class="progress__bar" style="width:${j.progress}%"></div>
          </div>
          <div class="job-mini__meta" style="margin-top:5px">${escapeHtml(j.store)} — ${fa(j.success)} موفق، ${fa(j.failed)} ناموفق از ${fa(j.total)}</div>
        </div>`).join('')
      : `<div class="empty-state" style="padding:26px"><div class="empty-state__icon">${icon('check-check')}</div><div class="empty-state__title">همه عملیات‌ها پایان یافته‌اند</div></div>`,
  });
}

function issuesCard(issues, counts) {
  return card({
    title: 'خطاها و تداخل‌های نیازمند بررسی',
    sub: 'مواردی که نیاز به تصمیم شما دارند',
    actions: `<span class="badge badge--warning">${fa(counts.conflicts + counts.unmapped)} مورد</span>`,
    flush: true,
    body: issues.length ? `
      ${issues.map((p) => `
        <div class="issue-item">
          <div class="issue-item__icon">${icon('triangle-alert')}</div>
          <div class="u-grow" style="min-width:0">
            <div class="issue-item__title">${escapeHtml(p.issue.title)}</div>
            <div class="issue-item__text">${escapeHtml(p.name)}</div>
          </div>
          <a class="btn btn--ghost btn--sm" href="#/products?issue=1">بررسی</a>
        </div>`).join('')}
      <div class="card__foot" style="border-top:1px solid var(--border)">
        <span class="t-muted" style="font-size:11px">تداخل موجودی معمولاً ناشی از کاهش موجودی در اسنپ‌شاپ است.</span>
        <a class="btn btn--link btn--sm" href="#/inventory?conflict=1" style="margin-inline-start:auto">مدیریت موجودی</a>
      </div>`
      : `<div class="empty-state" style="padding:26px"><div class="empty-state__icon">${icon('shield-check')}</div><div class="empty-state__title">موردی برای بررسی نیست</div></div>`,
  });
}

function activityCard(activity) {
  return card({
    title: 'آخرین فعالیت‌ها',
    sub: 'رویدادهای اخیر پنل و همگام‌سازی',
    flush: true,
    body: `<div class="feed">
      ${activity.map((a) => `
        <div class="feed-item">
          <div class="feed-item__dot ${a.tone === 'danger' ? 'is-danger' : a.tone === 'warning' ? 'is-warning' : a.tone === 'success' ? 'is-success' : 'is-brand'}">
            ${icon(a.tone === 'danger' ? 'alert-circle' : a.tone === 'warning' ? 'alert-triangle' : a.tone === 'success' ? 'check' : 'sparkles')}
          </div>
          <div class="u-grow">
            <div class="feed-item__text">${a.text}</div>
            <div class="feed-item__time">${relTime(a.time)}</div>
          </div>
        </div>`).join('')}
    </div>`,
  });
}

export async function render(root) {
  root.innerHTML = pageHead({
    title: 'داشبورد',
    sub: 'نمای کلی وضعیت فروشگاه، همگام‌سازی و عملیات',
    actions: `
      <button class="btn btn--secondary" data-refresh>${icon('refresh-cw')}<span>بروزرسانی</span></button>
      <button class="btn btn--primary" data-scan>${icon('play')}<span>شروع اسکن همگام‌سازی</span></button>`,
  }) + `<div id="dash-content">${skeleton()}</div>`;
  refreshIcons(root);

  let data;
  try {
    data = await api.get('/overview');
  } catch (err) {
    root.querySelector('#dash-content').innerHTML = `<div class="card">${errorState({ text: err.message })}</div>`;
    root.querySelector('[data-retry]')?.addEventListener('click', () => render(root));
    refreshIcons(root);
    return;
  }

  const { stats, health, recentOrders, activity, runningJobs, issues, counts } = data;
  const activePercent = stats.products ? Math.round((stats.active / stats.products) * 100) : 0;

  root.innerHTML = pageHead({
    title: 'داشبورد',
    sub: `آخرین به‌روزرسانی ${relTime(health.mirror.lastProductSync)} — فروشگاه ${store.activeStore().name}`,
    actions: `
      <button class="btn btn--secondary" data-refresh>${icon('refresh-cw')}<span>بروزرسانی</span></button>
      <button class="btn btn--primary" data-scan>${icon('play')}<span>شروع اسکن همگام‌سازی</span></button>`,
  }) + `
    <div class="stats-grid anim-rise">
      ${statCard({ iconName: 'package', tone: 'brand', label: 'تعداد محصولات', value: fa(stats.products), foot: `<span class="t-muted">${fa(counts.unmapped)} محصول بدون نگاشت</span>` })}
      ${statCard({ iconName: 'circle-check-big', tone: 'success', label: 'محصولات فعال', value: fa(stats.active), foot: `<span class="t-muted">${percent(activePercent)} از کل محصولات</span>` })}
      ${statCard({ iconName: 'package-x', tone: 'danger', label: 'محصولات ناموجود', value: fa(stats.outOfStock), foot: `<a class="btn btn--link btn--sm" href="#/inventory">بررسی موجودی</a>` })}
      ${statCard({ iconName: 'shopping-bag', tone: 'info', label: 'تعداد سفارش‌ها', value: fa(stats.orders), foot: `<span class="t-muted">دریافت‌شده از اسنپ‌شاپ</span>` })}
      ${statCard({
        iconName: 'banknote', tone: 'brand', label: 'مبلغ فروش ثبت‌شده',
        valueHtml: `${fa(stats.sales)} <small>تومان</small>`,
        foot: `<span class="t-muted">${fa(stats.salesKnown)} سفارش با مبلغ مشخص — ${fa(stats.salesUnknown)} سفارش نامشخص</span>`,
      })}
      ${statCard({ iconName: 'circle-alert', tone: 'warning', label: 'عملیات ناموفق', value: fa(stats.failedJobs), foot: `<a class="btn btn--link btn--sm" href="#/jobs?status=failed">مشاهده خطاها</a>` })}
    </div>

    <div class="dash-grid">
      <div class="stack-12">
        ${ordersCard(recentOrders)}
        ${jobsCard(runningJobs)}
      </div>
      <div class="stack-12">
        ${healthCard(health, counts)}
        ${quickActions()}
      </div>
    </div>

    <div class="dash-grid">
      ${issuesCard(issues, counts)}
      ${activityCard(activity)}
    </div>
  `;
  refreshIcons(root);

  root.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => { window.location.hash = `#${btn.dataset.goto}`; });
  });

  root.querySelector('[data-refresh]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.classList.add('is-loading');
    await render(root);
    toast({ title: 'داشبورد بروزرسانی شد', tone: 'success', duration: 2200 });
  });

  root.querySelector('[data-scan]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = `${icon('loader-circle')}<span>در حال شروع…</span>`;
    refreshIcons(btn);
    try {
      const { job } = await api.post('/sync/scan');
      store.set({ runningJobs: store.state.runningJobs + 1 });
      toast({ title: 'اسکن همگام‌سازی در صف قرار گرفت', text: `${job.id} — پیشرفت از صف عملیات قابل پیگیری است.`, tone: 'success' });
      window.location.hash = '#/jobs';
    } catch (err) {
      toast({ title: 'شروع اسکن ممکن نشد', text: err.message, tone: 'error' });
      btn.disabled = false;
      btn.innerHTML = `${icon('play')}<span>شروع اسکن همگام‌سازی</span>`;
      refreshIcons(btn);
    }
  });

  root.querySelector('[data-action="scan"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    root.querySelector('[data-scan]')?.click();
  });

  root.querySelector('#dash-mirror')?.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    try {
      await api.patch('/sync/settings', { mirror: enabled });
      store.set({ mirror: enabled });
      toast({ title: enabled ? 'WooCommerce Mirror فعال شد' : 'WooCommerce Mirror غیرفعال شد', text: enabled ? 'منبع حقیقت ووکامرس است و تغییرات به اسنپ‌شاپ منتقل می‌شود.' : 'همگام‌سازی معکوس متوقف شد.', tone: enabled ? 'success' : 'warning' });
    } catch (err) {
      e.target.checked = !enabled;
      toast({ title: 'تغییر ممکن نشد', text: err.message, tone: 'error' });
    }
  });

  root.querySelector('#dash-autosync')?.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    try {
      await api.patch('/sync/settings', { autoSync: enabled });
      store.set({ autoSync: enabled });
      toast({ title: enabled ? 'همگام‌سازی خودکار فعال شد' : 'همگام‌سازی خودکار غیرفعال شد', tone: enabled ? 'success' : 'warning' });
    } catch (err) {
      e.target.checked = !enabled;
      toast({ title: 'تغییر ممکن نشد', text: err.message, tone: 'error' });
    }
  });
}
