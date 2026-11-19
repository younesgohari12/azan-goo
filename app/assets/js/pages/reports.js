import { api } from '../core/api.js';
import { icon, refreshIcons, errorState } from '../core/ui.js';
import { fa, percent } from '../core/utils.js';
import { pageHead, card, statCard } from '../components/common.js';

const STATUS_LABELS = {
  new: 'جدید', processing: 'در حال پردازش', shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده', canceled: 'لغوشده', returned: 'مرجوعی',
};
const SYNC_LABELS = { synced: 'همگام', pending: 'در انتظار', stale: 'قدیمی', failed: 'ناموفق' };

export async function render(root) {
  root.innerHTML = `
    ${pageHead({
      title: 'گزارش‌ها',
      sub: 'تحلیل عملیات فروشگاه، وضعیت سفارش‌ها و سلامت همگام‌سازی',
      actions: `<a class="btn btn--secondary" href="#/data?export=csv">${icon('file-down')}<span>خروجی گزارش</span></a>`,
    })}
    <div id="reports-content">
      <div class="stats-grid">${Array.from({ length: 4 }).map(() => '<article class="stat"><div class="skeleton sk-line" style="width:60%"></div><div class="skeleton sk-line sk-line--lg" style="width:40%;height:20px"></div></article>').join('')}</div>
    </div>`;
  refreshIcons(root);

  let data;
  try {
    data = await api.get('/reports');
  } catch (err) {
    root.querySelector('#reports-content').innerHTML = `<div class="card">${errorState({ text: err.message })}</div>`;
    refreshIcons(root);
    root.querySelector('[data-retry]')?.addEventListener('click', () => render(root));
    return;
  }

  const { totals, days, byStatus, syncBuckets } = data;
  const maxDay = Math.max(...days.map((d) => d.count), 1);
  const maxStatus = Math.max(...byStatus.map((s) => s.count), 1);
  const syncTotal = syncBuckets.reduce((s, b) => s + b.count, 0);

  root.querySelector('#reports-content').innerHTML = `
    <div class="stats-grid">
      ${statCard({ iconName: 'shopping-bag', tone: 'brand', label: 'کل سفارش‌ها', value: fa(totals.orders), foot: `<span class="t-muted">${fa(totals.imported)} سفارش وارد ووکامرس شده</span>` })}
      ${statCard({ iconName: 'circle-dollar-sign', tone: 'success', label: 'سفارش با مبلغ مشخص', value: fa(totals.knownAmounts), foot: `<span class="t-muted">${percent((totals.knownAmounts / totals.orders) * 100)} از کل سفارش‌ها</span>` })}
      ${statCard({ iconName: 'circle-help', tone: 'warning', label: 'سفارش با مبلغ نامشخص', value: fa(totals.unknownAmounts), foot: '<span class="t-muted">واحد پول سفارش تعیین نشده</span>' })}
      ${statCard({ iconName: 'git-compare-arrows', tone: 'info', label: 'محصولات نگاشت‌شده', value: fa(totals.mapped), foot: `<span class="t-muted">${percent((totals.mapped / totals.products) * 100)} از ${fa(totals.products)} محصول</span>` })}
    </div>

    <div class="dash-grid">
      ${card({
        title: 'سفارش‌های ۷ روز اخیر',
        sub: 'تعداد سفارش‌های دریافتی از اسنپ‌شاپ به تفکیک روز',
        body: `
          <div class="bars">
            ${days.map((d) => `
              <div class="bars__col" title="${d.label}: ${fa(d.count)} سفارش">
                <span class="t-muted" style="font-size:9.5px">${fa(d.count)}</span>
                <div class="bars__bar" style="height:${Math.max(6, (d.count / maxDay) * 100)}%"></div>
                <span class="bars__label">${d.label}</span>
              </div>`).join('')}
          </div>`,
      })}
      ${card({
        title: 'وضعیت سفارش‌ها',
        sub: 'توزیع سفارش‌ها بر اساس وضعیت ثبت‌شده در اسنپ‌شاپ',
        body: `
          <div class="stack-12">
            ${byStatus.map((s) => `
              <div>
                <div class="u-between" style="margin-bottom:4px">
                  <span style="font-size:11.8px">${STATUS_LABELS[s.key] || s.key}</span>
                  <span class="t-muted t-num" style="font-size:11px">${fa(s.count)}</span>
                </div>
                <div class="progress progress--sm"><div class="progress__bar" style="width:${(s.count / maxStatus) * 100}%"></div></div>
              </div>`).join('')}
          </div>`,
      })}
    </div>

    <div class="dash-grid">
      ${card({
        title: 'سلامت همگام‌سازی محصولات',
        sub: 'وضعیت آخرین همگام‌سازی هر محصول',
        body: `
          <div class="metric-row" style="margin-bottom:14px">
            <div class="metric"><div class="metric__label">نرخ موفقیت عملیات</div><div class="metric__value" style="color:var(--success)">${percent(totals.successRate)}</div></div>
            <div class="metric"><div class="metric__label">کل عملیات ثبت‌شده</div><div class="metric__value">${fa(totals.jobs)}</div></div>
          </div>
          <div class="stack-12">
            ${syncBuckets.map((b) => `
              <div>
                <div class="u-between" style="margin-bottom:4px">
                  <span style="font-size:11.8px">${SYNC_LABELS[b.key] || b.key}</span>
                  <span class="t-muted t-num" style="font-size:11px">${fa(b.count)}</span>
                </div>
                <div class="progress progress--sm">
                  <div class="progress__bar ${b.key === 'failed' ? 'is-danger' : b.key === 'stale' ? 'is-warning' : b.key === 'synced' ? 'is-success' : ''}" style="width:${syncTotal ? (b.count / syncTotal) * 100 : 0}%"></div>
                </div>
              </div>`).join('')}
          </div>`,
      })}
      ${card({
        title: 'درباره اعداد مالی',
        sub: 'شفافیت در نمایش مبالغ',
        body: `
          <div class="alert alert--warning" style="margin-bottom:12px">${icon('info')}<div>
            <div class="alert__title">این اعداد سود یا درآمد خالص نیستند</div>
            <div class="alert__text">تنها مجموع مبلغ سفارش‌های ثبت‌شده در اسنپ‌شاپ است. هزینه‌ها، کمیسیون و مرجوعی‌ها در آن محاسبه نشده‌اند.</div>
          </div></div>
          <dl class="kv-list">
            <div><dt>سفارش با مبلغ مشخص</dt><dd>${fa(totals.knownAmounts)}</dd></div>
            <div><dt>سفارش با مبلغ نامشخص</dt><dd>${fa(totals.unknownAmounts)}</dd></div>
            <div><dt>واحد پول سفارش</dt><dd>${totals.unknownAmounts ? 'نامشخص' : 'تومان'}</dd></div>
            <div><dt>محصولات کل</dt><dd>${fa(totals.products)}</dd></div>
          </dl>
          <div class="t-muted" style="font-size:11px;margin-top:10px;line-height:1.8">
            برای نمایش مبلغ فروش، واحد پول سفارش‌ها را از تنظیمات ← سفارش‌ها تعیین کنید.
          </div>`,
      })}
    </div>`;
  refreshIcons(root);
}
