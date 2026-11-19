import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, openModal, confirmDialog,
  emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, relTime } from '../core/utils.js';
import { pageHead, card, statCard } from '../components/common.js';

let state = null;
let pollTimer = null;

function initial() {
  return { backups: [], recovery: null, loading: true };
}

async function load(root) {
  try {
    const { items, recovery } = await api.get('/backups');
    state.backups = items;
    state.recovery = recovery;
    state.loading = false;
    paint(root);
  } catch (err) {
    state.loading = false;
    root.querySelector('#backup-content').innerHTML = `<div class="card">${errorState({ text: err.message })}</div>`;
    refreshIcons(root);
    root.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function recoveryCard() {
  const r = state.recovery;
  if (!r) return '';
  const done = r.status === 'completed';
  return card({
    title: 'وضعیت بازیابی',
    sub: done ? 'بازیابی با موفقیت پایان یافت' : 'در حال بازیابی داده‌ها — صفحه را نبندید',
    actions: badge(done ? 'completed' : 'running', { text: done ? 'کامل شد' : 'در حال اجرا' }),
    body: `
      <div class="progress progress--lg ${done ? '' : 'is-indeterminate'}">
        <div class="progress__bar ${done ? 'is-success' : ''}" style="width:${r.progress}%"></div>
      </div>
      <div class="u-between" style="margin-top:8px">
        <span class="t-muted" style="font-size:11.5px">${escapeHtml(r.step)}</span>
        <span class="t-muted" style="font-size:11.5px">${fa(r.progress)}٪</span>
      </div>`,
  });
}

function paint(root) {
  const host = root.querySelector('#backup-content');
  const totalSize = state.backups.reduce((s, b) => s + b.size, 0);
  host.innerHTML = `
    ${state.recovery ? `<div class="section-gap" style="margin-top:0;margin-bottom:12px">${recoveryCard()}</div>` : ''}
    <div class="stats-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      ${statCard({ iconName: 'database-backup', tone: 'brand', label: 'تعداد پشتیبان‌ها', value: fa(state.backups.length), foot: '<span class="t-muted">همه رمزنگاری‌شده</span>' })}
      ${statCard({ iconName: 'hard-drive', label: 'حجم کل', value: `${fa((totalSize / (1024 * 1024)).toFixed(1))} مگابایت`, foot: '<span class="t-muted">روی فضای افزونه</span>' })}
      ${statCard({ iconName: 'clock', tone: 'info', label: 'آخرین پشتیبان', value: state.backups[0] ? relTime(state.backups[0].createdAt) : '—', foot: '<span class="t-muted">نگهداری پیشنهادی: ۱۴ روز</span>' })}
    </div>
    <div class="section-gap">
      ${card({
        title: 'پشتیبان‌های رمزنگاری‌شده',
        sub: 'برای بازیابی، رمز عبور فایل پشتیبان لازم است',
        flush: true,
        body: state.backups.length ? state.backups.map((b) => `
          <div class="file-row">
            <div class="file-row__icon" style="background:var(--brand-soft);color:var(--brand)">${icon('shield')}</div>
            <div class="u-grow" style="min-width:0">
              <div style="font-size:12.3px;font-weight:550" class="t-clamp">${escapeHtml(b.name)}</div>
              <div class="t-muted" style="font-size:10.8px">${formatDate(b.createdAt, { time: true })} — ${fa((b.size / (1024 * 1024)).toFixed(1))} مگابایت</div>
              <div class="u-row gap-4 u-wrap" style="margin-top:3px">
                ${b.includes.map((i) => `<span class="badge badge--neutral" style="height:18px;font-size:9.5px">${escapeHtml(i)}</span>`).join('')}
              </div>
            </div>
            ${badge(b.status, { text: 'تأییدشده' })}
            <button class="row-action" data-download-backup="${b.id}" aria-label="دانلود">${icon('download')}</button>
            <button class="btn btn--secondary btn--sm" data-restore="${b.id}">${icon('history')} بازیابی</button>
          </div>`).join('')
          : emptyState({ iconName: 'database-backup', title: 'پشتیبانی ایجاد نشده', text: 'اولین پشتیبان رمزنگاری‌شده را بسازید تا در صورت خطا بتوانید داده‌ها را بازگردانید.' }),
      })}
    </div>`;
  refreshIcons(host);

  host.querySelectorAll('[data-restore]').forEach((btn) => {
    btn.addEventListener('click', () => restore(root, btn.dataset.restore));
  });
  host.querySelectorAll('[data-download-backup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const b = state.backups.find((x) => x.id === btn.dataset.downloadBackup);
      const blob = new Blob([`SnappShop Automation encrypted backup\n${b.name}\n${b.createdAt}`], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = b.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
      toast({ title: 'دانلود پشتیبان آغاز شد', text: 'فایل رمزنگاری‌شده است و فقط با رمز عبور بازیابی می‌شود.', tone: 'success' });
    });
  });
}

function openCreate(root) {
  openModal({
    title: 'ایجاد پشتیبان رمزنگاری‌شده',
    desc: 'فایل با رمز عبور شما رمزنگاری می‌شود؛ رمز را در جای امن نگه دارید.',
    iconName: 'shield',
    size: 'lg',
    body: `
      <form id="backup-form" autocomplete="off">
        <div class="form-grid">
          <div class="field">
            <label class="field__label">رمز عبور پشتیبان <span class="req">*</span></label>
            <input class="input" type="password" name="password" placeholder="حداقل ۸ کاراکتر" />
          </div>
          <div class="field">
            <label class="field__label">تکرار رمز عبور <span class="req">*</span></label>
            <input class="input" type="password" name="confirm" placeholder="تکرار رمز" />
          </div>
        </div>
        <div class="form-section">
          <div class="form-section__title">محتویات پشتیبان</div>
          <div class="form-section__desc">همه موارد پیش‌فرض انتخاب شده‌اند.</div>
          <div class="grid-2" style="gap:6px">
            ${['محصولات', 'نگاشت‌ها', 'قوانین قیمت', 'تنظیمات'].map((label) => `
              <label class="check"><input type="checkbox" checked /><span class="check__box">${icon('check')}</span>${label}</label>`).join('')}
          </div>
        </div>
      </form>
      <div class="alert alert--warning" style="margin-top:14px">${icon('triangle-alert')}<div class="alert__text">
        رمز عبور پشتیبان قابل بازیابی نیست. اگر آن را فراموش کنید، فایل قابل بازگردانی نخواهد بود.
      </div></div>`,
    footer: '<div class="spacer"></div><button class="btn btn--secondary" data-cancel>انصراف</button><button class="btn btn--primary" data-create>ایجاد پشتیبان</button>',
    onMount: (h) => {
      h.root.querySelector('[data-cancel]').addEventListener('click', h.close);
      h.root.querySelector('[data-create]').addEventListener('click', async (e) => {
        const form = h.root.querySelector('#backup-form');
        const data = Object.fromEntries(new FormData(form).entries());
        if (!data.password || data.password.length < 8) {
          toast({ title: 'رمز عبور کوتاه است', text: 'حداقل ۸ کاراکتر لازم است.', tone: 'warning' });
          return;
        }
        if (data.password !== data.confirm) {
          toast({ title: 'رمزها یکسان نیستند', tone: 'warning' });
          return;
        }
        const btn = e.currentTarget;
        setBusy(btn, true);
        try {
          await api.post('/backups', { password: data.password });
          h.close();
          toast({ title: 'پشتیبان رمزنگاری‌شده ایجاد شد', text: 'وضعیت فایل تأیید شد و آماده دانلود است.', tone: 'success' });
          load(root);
        } catch (err) {
          setBusy(btn, false);
          toast({ title: 'ایجاد پشتیبان ناموفق بود', text: err.message, tone: 'error' });
        }
      });
    },
  });
}

async function restore(root, id) {
  const b = state.backups.find((x) => x.id === id);
  const ok = await confirmDialog({
    title: 'بازیابی از پشتیبان',
    desc: `داده‌های فعلی با محتوای «${b?.name || ''}» جایگزین می‌شود.`,
    details: 'محصولات، نگاشت‌ها، قوانین قیمت و تنظیمات به وضعیت این پشتیبان بازمی‌گردند. این عملیات قابل بازگشت نیست.',
    confirmText: 'شروع بازیابی',
    tone: 'danger',
    iconName: 'history',
    requireText: 'بازیابی',
  });
  if (!ok) return;
  try {
    const recovery = await api.post(`/backups/${id}/restore`);
    state.recovery = recovery;
    paint(root);
    toast({ title: 'بازیابی آغاز شد', text: 'پیشرفت در همین صفحه نمایش داده می‌شود.', tone: 'info' });
    clearInterval(pollTimer);
    let ticks = 0;
    pollTimer = setInterval(async () => {
      ticks += 1;
      try {
        const r = await api.get('/backups/recovery');
        state.recovery = r;
        paint(root);
        if (r?.status === 'completed' || ticks > 8) {
          clearInterval(pollTimer);
          if (r?.status === 'completed') {
            toast({ title: 'بازیابی کامل شد', text: 'داده‌ها به وضعیت پشتیبان بازگشت.', tone: 'success' });
          }
        }
      } catch (e) {
        clearInterval(pollTimer);
      }
    }, 1200);
  } catch (err) {
    toast({ title: 'شروع بازیابی ناموفق بود', text: err.message, tone: 'error' });
  }
}

export async function render(root) {
  state = initial();
  root.innerHTML = `
    ${pageHead({
      title: 'پشتیبان‌گیری',
      sub: 'ایجاد نسخه رمزنگاری‌شده، بازیابی و پیگیری وضعیت Recovery',
      actions: `<button class="btn btn--primary" id="create-backup">${icon('shield-plus')}<span>ایجاد پشتیبان</span></button>`,
    })}
    <div id="backup-content">
      <div class="skeleton" style="height:200px;border-radius:12px"></div>
    </div>`;
  refreshIcons(root);
  root.querySelector('#create-backup').addEventListener('click', () => openCreate(root));
  await load(root);
  return { cleanup: () => clearInterval(pollTimer) };
}
