import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openModal, setBusy,
  skeletonRows, errorState,
} from '../core/ui.js';
import { fa, relTime, escapeHtml, formatDate } from '../core/utils.js';
import { pageHead, card, statCard } from '../components/common.js';

let state = null;

function initial() {
  return { sync: null, jobs: [], loading: true, error: null };
}

async function load(root) {
  state.loading = true;
  root.querySelector('#sync-content').innerHTML = `
    <div class="stats-grid">${Array.from({ length: 4 }).map(() => '<article class="stat"><div class="skeleton sk-line" style="width:60%"></div><div class="skeleton sk-line sk-line--lg" style="width:45%;height:20px"></div></article>').join('')}</div>
    <div class="dash-grid"><div class="card"><div class="card__body"><div class="skeleton sk-line" style="height:180px"></div></div></div><div class="card"><div class="card__body"><div class="skeleton sk-line" style="height:180px"></div></div></div></div>`;
  try {
    const [sync, jobs] = await Promise.all([
      api.get('/sync/status'),
      api.get('/jobs', { per_page: 5 }),
    ]);
    state.sync = sync;
    state.jobs = jobs.items;
    state.loading = false;
    paint(root);
  } catch (err) {
    state.loading = false;
    state.error = err;
    root.querySelector('#sync-content').innerHTML = `<div class="card">${errorState({ text: err.message })}</div>`;
    refreshIcons(root);
    root.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function paint(root) {
  const s = state.sync;
  const productProgress = Math.round((s.productsSynced / s.productsTotal) * 100);
  const orderProgress = Math.round((s.ordersSynced / s.ordersTotal) * 100);
  const running = state.jobs.filter((j) => ['running', 'pending'].includes(j.status));

  root.querySelector('#sync-content').innerHTML = `
    <div class="stats-grid">
      ${statCard({ iconName: 'refresh-cw', tone: 'brand', label: 'آخرین دریافت محصولات', value: relTime(s.lastProductSync), foot: `<span class="t-muted">${formatDate(s.lastProductSync, { time: true })}</span>` })}
      ${statCard({ iconName: 'shopping-bag', tone: 'info', label: 'آخرین دریافت سفارش‌ها', value: relTime(s.lastOrderSync), foot: `<span class="t-muted">${formatDate(s.lastOrderSync, { time: true })}</span>` })}
      ${statCard({ iconName: 'timer', tone: s.autoSync ? 'success' : 'warning', label: 'همگام‌سازی خودکار', value: s.autoSync ? `هر ${fa(s.intervalMinutes)} دقیقه` : 'غیرفعال', foot: '<span class="t-muted">قابل تغییر از تنظیمات</span>' })}
      ${statCard({ iconName: 'triangle-alert', tone: 'danger', label: 'موارد نیازمند بررسی', value: fa(s.conflicts + s.ambiguous + s.unmapped), foot: `<a class="btn btn--link btn--sm" href="#/mapping?tab=unmapped">مدیریت نگاشت</a>` })}
    </div>

    <div class="dash-grid">
      <div class="stack-12">
        ${card({
          title: 'حالت WooCommerce Mirror',
          sub: 'منبع حقیقت و جهت انتقال تغییرات',
          actions: `<label class="switch"><input type="checkbox" id="mirror-toggle" ${s.mirror ? 'checked' : ''} /><span class="switch__track"></span></label>`,
          body: `
            <div class="u-row gap-12" style="align-items:flex-start">
              <div class="stat__icon ${s.mirror ? 'is-brand' : ''}" style="width:34px;height:34px">${icon('copy-check')}</div>
              <div class="u-grow">
                <div style="font-size:12.5px;font-weight:600">${s.mirror ? 'فعال — ووکامرس منبع حقیقت است' : 'غیرفعال — فقط خواندن از اسنپ‌شاپ'}</div>
                <div class="t-muted" style="font-size:11.5px;line-height:1.8;margin-top:2px">
                  ${s.mirror
                    ? 'قیمت و موجودی ووکامرس به اسنپ‌شاپ منتقل می‌شود؛ تغییرات اسنپ‌شاپ فقط خوانده می‌شوند.'
                    : 'تغییرات اسنپ‌شاپ دریافت می‌شوند اما چیزی به آن ارسال نمی‌شود.'}
                </div>
              </div>
            </div>
            <div class="alert alert--warning" style="margin-top:12px">${icon('triangle-alert')}<div class="alert__text">
              در حالت Mirror، قبل از اعمال قیمت‌گذاری گروهی مطمئن شوید جهت همگام‌سازی با سیاست فروشگاه هم‌راستا است.
            </div></div>`,
        })}
        ${card({
          title: 'وضعیت همگام‌سازی محصولات',
          sub: `${fa(s.productsSynced)} از ${fa(s.productsTotal)} محصول همگام شده`,
          actions: `<button class="btn btn--secondary btn--sm" id="sync-products">${icon('refresh-cw')} اجرای همگام‌سازی</button>`,
          body: `
            <div class="progress progress--lg"><div class="progress__bar" style="width:${productProgress}%"></div></div>
            <div class="u-between" style="margin-top:8px">
              <span class="t-muted" style="font-size:11px">${fa(productProgress)}٪ تکمیل</span>
              <span class="t-muted" style="font-size:11px">فاصله زمانی: هر ${fa(s.intervalMinutes)} دقیقه</span>
            </div>
            <div class="metric-row" style="margin-top:14px">
              <div class="metric"><div class="metric__label">بدون نگاشت</div><div class="metric__value" style="color:var(--warning)">${fa(s.unmapped)}</div></div>
              <div class="metric"><div class="metric__label">مبهم</div><div class="metric__value">${fa(s.ambiguous)}</div></div>
              <div class="metric"><div class="metric__label">تداخل</div><div class="metric__value" style="color:var(--danger)">${fa(s.conflicts)}</div></div>
            </div>`,
        })}
        ${card({
          title: 'وضعیت همگام‌سازی سفارش‌ها',
          sub: `${fa(s.ordersSynced)} از ${fa(s.ordersTotal)} سفارش وارد ووکامرس شده`,
          actions: `<button class="btn btn--secondary btn--sm" id="sync-orders">${icon('download')} دریافت سفارش‌ها</button>`,
          body: `<div class="progress progress--lg"><div class="progress__bar is-success" style="width:${orderProgress}%"></div></div>
            <div class="u-between" style="margin-top:8px"><span class="t-muted" style="font-size:11px">${fa(orderProgress)}٪ تکمیل</span>
            <a class="btn btn--link btn--sm" href="#/orders">مشاهده سفارش‌ها</a></div>`,
        })}
      </div>

      <div class="stack-12">
        ${card({
          title: 'روش تطبیق محصولات',
          sub: 'مبنای نگاشت خودکار محصولات',
          body: `
            <div class="stack-6">
              ${[
                ['sku', 'SKU یکتا', 'دقیق‌ترین روش؛ نیازمند SKU یکتا در ووکامرس و اسنپ‌شاپ'],
                ['id', 'شناسه محصول', 'تطبیق بر اساس شناسه ذخیره‌شده در نگاشت‌های قبلی'],
                ['name', 'نام محصول', 'کم‌دقت‌ترین روش؛ فقط برای موارد بدون SKU'],
              ].map(([key, title, desc]) => `
                <label class="option-card ${s.matching === key ? 'is-selected' : ''}" data-match="${key}">
                  <input type="radio" name="matching" value="${key}" ${s.matching === key ? 'checked' : ''} class="u-sr" />
                  <span class="u-grow">
                    <span class="option-card__title" style="display:block">${title}</span>
                    <span class="option-card__desc" style="display:block">${desc}</span>
                  </span>
                  ${s.matching === key ? `<span class="t-brand">${icon('check')}</span>` : ''}
                </label>`).join('')}
            </div>`,
        })}
        ${card({
          title: 'Checkpointها',
          sub: 'آخرین نقاط امن همگام‌سازی',
          flush: true,
          body: s.checkpoints.map((cp) => `
            <div class="file-row">
              <div class="file-row__icon">${icon('flag')}</div>
              <div class="u-grow" style="min-width:0">
                <div style="font-size:12px;font-weight:540">${escapeHtml(cp.label)}</div>
                <div class="t-muted" style="font-size:10.5px">${relTime(cp.at)}</div>
              </div>
              ${badge(cp.status)}
            </div>`).join(''),
        })}
        ${card({
          title: 'پیشرفت عملیات',
          sub: running.length ? `${fa(running.length)} عملیات در حال اجرا` : 'عملیات فعالی نیست',
          flush: true,
          actions: `<a class="btn btn--ghost btn--sm" href="#/jobs">صف عملیات ${icon('arrow-left')}</a>`,
          body: running.length ? running.map((j) => `
            <div class="job-mini">
              <div class="job-mini__top">
                <span class="t-strong" style="font-size:11.8px">${escapeHtml(j.type)}</span>
                ${badge(j.status)}
                <span class="job-mini__meta">${fa(j.progress)}٪</span>
              </div>
              <div class="progress ${j.status === 'running' ? '' : 'is-indeterminate'}"><div class="progress__bar" style="width:${j.progress}%"></div></div>
            </div>`).join('')
            : `<div class="empty-state" style="padding:22px"><div class="empty-state__icon">${icon('check-check')}</div><div class="empty-state__title">همه عملیات‌ها پایان یافته</div></div>`,
        })}
      </div>
    </div>`;
  refreshIcons(root);

  root.querySelector('#mirror-toggle')?.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    try {
      await api.patch('/sync/settings', { mirror: enabled });
      toast({ title: enabled ? 'WooCommerce Mirror فعال شد' : 'WooCommerce Mirror غیرفعال شد', tone: enabled ? 'success' : 'warning' });
      load(root);
    } catch (err) {
      e.target.checked = !enabled;
      toast({ title: 'تغییر ناموفق بود', text: err.message, tone: 'error' });
    }
  });

  root.querySelectorAll('[data-match]').forEach((el) => {
    el.addEventListener('click', async () => {
      try {
        await api.patch('/sync/settings', { matching: el.dataset.match });
        toast({ title: 'روش تطبیق ذخیره شد', text: el.querySelector('.option-card__title').textContent, tone: 'success' });
        load(root);
      } catch (err) {
        toast({ title: 'ذخیره ناموفق بود', text: err.message, tone: 'error' });
      }
    });
  });

  const scan = async (btn) => {
    setBusy(btn, true);
    try {
      const { job } = await api.post('/sync/scan');
      toast({ title: 'عملیات همگام‌سازی در صف قرار گرفت', text: `شناسه عملیات: ${job.id}`, tone: 'success' });
      window.location.hash = '#/jobs';
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'اجرای عملیات ناموفق بود', text: err.message, tone: 'error' });
    }
  };
  root.querySelector('#sync-products')?.addEventListener('click', (e) => scan(e.currentTarget));
  root.querySelector('#sync-orders')?.addEventListener('click', (e) => scan(e.currentTarget));
}

/* ------------------------------------------------------------ setup wizard */
function openWizard(root) {
  const wiz = {
    step: 1,
    store: 'store_1',
    matching: state.sync?.matching || 'sku',
    currency: state.sync?.currencyUnit || 'unknown',
    autoSync: true,
    mirror: true,
  };
  const steps = ['اتصال', 'فروشگاه', 'روش نگاشت', 'واحد پول', 'فعال‌سازی'];
  const handle = openModal({
    title: 'راه‌اندازی اولیه افزونه',
    desc: 'پنج مرحله تا فعال‌سازی کامل اتصال ووکامرس و اسنپ‌شاپ',
    iconName: 'rocket',
    size: 'lg',
    body: '',
    footer: '<div class="spacer" style="flex:1"></div>',
  });
  refreshIcons(handle.root);

  const stores = [
    { id: 'store_1', name: 'فروشگاه اصلی', code: 'SNAP-8841', products: 128 },
    { id: 'store_2', name: 'شعبه دیجیتال', code: 'SNAP-9127', products: 42 },
    { id: 'store_3', name: 'انبار شمال', code: 'SNAP-7742', products: 0 },
  ];

  function body() {
    if (wiz.step === 1) {
      return `
        <div class="alert alert--success">${icon('check-circle-2')}<div>
          <div class="alert__title">اتصال ووکامرس برقرار است</div>
          <div class="alert__text">WooCommerce 9.3 — REST API فعال با دسترسی خواندن و نوشتن.</div>
        </div></div>
        <div class="alert alert--success" style="margin-top:8px">${icon('check-circle-2')}<div>
          <div class="alert__title">توکن اسنپ‌شاپ معتبر است</div>
          <div class="alert__text">اتصال «فروشگاه تهران» — توکن تا ۱۲ روز دیگر منقضی می‌شود.</div>
        </div></div>
        <div class="field" style="margin-top:14px">
          <label class="field__label">اتصال اسنپ‌شاپ</label>
          <select class="select">
            <option>فروشگاه تهران — conn_01</option>
            <option>اتصال آزمایشی — conn_02</option>
          </select>
        </div>`;
    }
    if (wiz.step === 2) {
      return `
        <div class="form-section__desc">فروشگاهی که محصولات و سفارش‌های آن مدیریت می‌شود را انتخاب کنید.</div>
        <div class="stack-6">
          ${stores.map((s) => `
            <label class="option-card ${wiz.store === s.id ? 'is-selected' : ''}" data-store="${s.id}">
              <input type="radio" name="wizard-store" class="u-sr" ${wiz.store === s.id ? 'checked' : ''} />
              <span class="u-grow">
                <span class="option-card__title" style="display:block">${s.name}</span>
                <span class="option-card__desc" style="display:block"><span class="t-mono">${s.code}</span> — ${fa(s.products)} محصول</span>
              </span>
              ${wiz.store === s.id ? `<span class="t-brand">${icon('check')}</span>` : ''}
            </label>`).join('')}
        </div>`;
    }
    if (wiz.step === 3) {
      return `
        <div class="form-section__desc">محصولات اسنپ‌شاپ چطور به ووکامرس متصل شوند؟</div>
        <div class="stack-6">
          ${[['sku', 'بر اساس SKU یکتا (پیشنهادی)', 'دقیق‌ترین روش تطبیق خودکار'], ['manual', 'فقط نگاشت دستی', 'هیچ محصولی خودکار متصل نمی‌شود'], ['name', 'بر اساس نام محصول', 'برای محصولات بدون SKU']].map(([key, title, desc]) => `
            <label class="option-card ${wiz.matching === key ? 'is-selected' : ''}" data-matching="${key}">
              <input type="radio" name="wizard-match" class="u-sr" ${wiz.matching === key ? 'checked' : ''} />
              <span class="u-grow">
                <span class="option-card__title" style="display:block">${title}</span>
                <span class="option-card__desc" style="display:block">${desc}</span>
              </span>
              ${wiz.matching === key ? `<span class="t-brand">${icon('check')}</span>` : ''}
            </label>`).join('')}
        </div>`;
    }
    if (wiz.step === 4) {
      return `
        <div class="form-section__desc">واحد پول مبالغ سفارش‌های اسنپ‌شاپ مشخص نشده است. برای نمایش مبلغ فروش، واحد را انتخاب کنید.</div>
        <div class="stack-6">
          ${[['IRT', 'تومان', 'مبالغ به‌صورت تومان نمایش داده می‌شوند'], ['unknown', 'نامشخص (پیشنهادی)', 'مبلغ سفارش‌ها «نامشخص» نمایش داده می‌شود']].map(([key, title, desc]) => `
            <label class="option-card ${wiz.currency === key ? 'is-selected' : ''}" data-currency="${key}">
              <input type="radio" name="wizard-currency" class="u-sr" ${wiz.currency === key ? 'checked' : ''} />
              <span class="u-grow">
                <span class="option-card__title" style="display:block">${title}</span>
                <span class="option-card__desc" style="display:block">${desc}</span>
              </span>
              ${wiz.currency === key ? `<span class="t-brand">${icon('check')}</span>` : ''}
            </label>`).join('')}
        </div>
        <div class="alert alert--warning" style="margin-top:12px">${icon('info')}<div class="alert__text">
          تا زمانی که واحد پول مشخص نشود، مبالغ سفارش «نامشخص» نمایش داده می‌شوند و در جمع فروش محاسبه نمی‌شوند.
        </div></div>`;
    }
    return `
      <div class="detail-grid" style="margin-bottom:14px">
        <div class="detail-box"><div class="detail-box__label">فروشگاه</div><div class="detail-box__value">${stores.find((s) => s.id === wiz.store)?.name}</div></div>
        <div class="detail-box"><div class="detail-box__label">روش نگاشت</div><div class="detail-box__value">${wiz.matching === 'sku' ? 'SKU یکتا' : wiz.matching === 'manual' ? 'دستی' : 'نام محصول'}</div></div>
        <div class="detail-box"><div class="detail-box__label">واحد پول</div><div class="detail-box__value">${wiz.currency === 'IRT' ? 'تومان' : 'نامشخص'}</div></div>
        <div class="detail-box"><div class="detail-box__label">همگام‌سازی خودکار</div><div class="detail-box__value">${wiz.autoSync ? 'فعال' : 'غیرفعال'}</div></div>
      </div>
      <div class="setting-row" style="padding-top:0">
        <div class="setting-row__main">
          <div class="setting-row__title">فعال‌سازی همگام‌سازی خودکار</div>
          <div class="setting-row__desc">هر ۱۵ دقیقه محصولات و سفارش‌ها به‌روزرسانی می‌شوند.</div>
        </div>
        <div class="setting-row__control">
          <label class="switch"><input type="checkbox" id="wiz-autosync" ${wiz.autoSync ? 'checked' : ''} /><span class="switch__track"></span></label>
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-row__main">
          <div class="setting-row__title">فعال‌سازی WooCommerce Mirror</div>
          <div class="setting-row__desc">قیمت و موجودی ووکامرس به اسنپ‌شاپ منتقل شود.</div>
        </div>
        <div class="setting-row__control">
          <label class="switch"><input type="checkbox" id="wiz-mirror" ${wiz.mirror ? 'checked' : ''} /><span class="switch__track"></span></label>
        </div>
      </div>`;
  }

  function chrome() {
    handle.body.innerHTML = `
      <div class="stepper" style="margin-bottom:14px">
        ${steps.map((label, i) => {
          const n = i + 1;
          return `${i ? '<span class="step__sep">—</span>' : ''}
            <div class="step ${wiz.step === n ? 'is-active' : wiz.step > n ? 'is-done' : ''}">
              <span class="step__num">${wiz.step > n ? icon('check') : fa(n)}</span>
              <span>${label}</span>
            </div>`;
        }).join('')}
      </div>
      <div id="wiz-body">${body()}</div>`;
    handle.setFooter(`
      <button class="btn btn--ghost btn--sm" data-wiz-back ${wiz.step === 1 ? 'disabled' : ''}>${icon('arrow-right')} قبلی</button>
      <div style="flex:1"></div>
      <button class="btn btn--secondary btn--sm" data-wiz-skip>انصراف</button>
      <button class="btn btn--primary btn--sm" data-wiz-next>${wiz.step === 5 ? `${icon('rocket')} فعال‌سازی` : `مرحله بعد ${icon('arrow-left')}`}</button>`);
    refreshIcons(handle.root);

    handle.body.querySelectorAll('[data-store]').forEach((el) => el.addEventListener('click', () => { wiz.store = el.dataset.store; chrome(); }));
    handle.body.querySelectorAll('[data-matching]').forEach((el) => el.addEventListener('click', () => { wiz.matching = el.dataset.matching; chrome(); }));
    handle.body.querySelectorAll('[data-currency]').forEach((el) => el.addEventListener('click', () => { wiz.currency = el.dataset.currency; chrome(); }));
    handle.body.querySelector('#wiz-autosync')?.addEventListener('change', (e) => { wiz.autoSync = e.target.checked; });
    handle.body.querySelector('#wiz-mirror')?.addEventListener('change', (e) => { wiz.mirror = e.target.checked; });

    handle.footer.querySelector('[data-wiz-back]').addEventListener('click', () => { if (wiz.step > 1) { wiz.step -= 1; chrome(); } });
    handle.footer.querySelector('[data-wiz-skip]').addEventListener('click', handle.close);
    handle.footer.querySelector('[data-wiz-next]').addEventListener('click', async (e) => {
      if (wiz.step < 5) { wiz.step += 1; chrome(); return; }
      const btn = e.currentTarget;
      setBusy(btn, true);
      try {
        await api.patch('/sync/settings', {
          matching: wiz.matching === 'manual' ? 'manual' : wiz.matching,
          currencyUnit: wiz.currency === 'unknown' ? null : wiz.currency,
          autoSync: wiz.autoSync,
          mirror: wiz.mirror,
        });
        handle.close();
        toast({ title: 'راه‌اندازی کامل شد', text: 'همگام‌سازی خودکار فعال است و از صف عملیات قابل پیگیری می‌باشد.', tone: 'success' });
        load(root);
      } catch (err) {
        setBusy(btn, false);
        toast({ title: 'فعال‌سازی ناموفق بود', text: err.message, tone: 'error' });
      }
    });
  }
  chrome();
}

export async function render(root, ctx) {
  state = initial();
  root.innerHTML = `
    ${pageHead({
      title: 'مرکز همگام‌سازی',
      sub: 'وضعیت دریافت داده‌ها، حالت Mirror و راه‌اندازی اولیه',
      actions: `
        <button class="btn btn--secondary" id="wizard-btn">${icon('rocket')}<span>راه‌اندازی اولیه</span></button>
        <button class="btn btn--primary" id="scan-btn">${icon('play')}<span>اسکن دستی</span></button>`,
    })}
    <div id="sync-content"></div>`;
  refreshIcons(root);

  root.querySelector('#wizard-btn').addEventListener('click', () => openWizard(root));
  root.querySelector('#scan-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    setBusy(btn, true);
    try {
      const { job } = await api.post('/sync/scan');
      toast({ title: 'اسکن دستی شروع شد', text: `عملیات ${job.id} در صف قرار گرفت.`, tone: 'success' });
      window.location.hash = '#/jobs';
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'شروع اسکن ناموفق بود', text: err.message, tone: 'error' });
    }
  });

  await load(root);

  if (ctx.params.get('scan') === '1') {
    root.querySelector('#scan-btn')?.click();
  }
}
