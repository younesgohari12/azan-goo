import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, confirmDialog, emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, formatDate, relTime } from '../core/utils.js';
import { pageHead, card } from '../components/common.js';

let state = null;

function initial(params) {
  return { tab: params.get('export') ? 'export' : 'import', files: [], loading: true, pickedFile: null, result: null };
}

function humanSize(bytes) {
  if (bytes >= 1024 * 1024) return `${fa((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  if (bytes >= 1024) return `${fa(Math.round(bytes / 1024))} کیلوبایت`;
  return `${fa(bytes)} بایت`;
}

async function loadFiles(root) {
  try {
    const { items } = await api.get('/files');
    state.files = items;
    state.loading = false;
    if (root.querySelector('#files-list')) paintFiles(root);
  } catch (err) {
    state.loading = false;
    const host = root.querySelector('#files-list');
    if (host) {
      host.innerHTML = errorState({ text: err.message });
      refreshIcons(root);
      host.querySelector('[data-retry]')?.addEventListener('click', () => loadFiles(root));
    }
  }
}

function paintFiles(root) {
  const host = root.querySelector('#files-list');
  if (!state.files.length) {
    host.innerHTML = emptyState({ iconName: 'folder-open', title: 'فایلی ایجاد نشده', text: 'از تب خروجی، یک فایل CSV یا JSON بسازید.' });
    refreshIcons(host);
    return;
  }
  host.innerHTML = state.files.map((f) => `
    <div class="file-row">
      <div class="file-row__icon">${icon(f.kind === 'backup' ? 'shield' : f.kind === 'json' ? 'braces' : 'table-2')}</div>
      <div class="u-grow" style="min-width:0">
        <div style="font-size:12.3px;font-weight:540" class="t-clamp">${escapeHtml(f.name)}</div>
        <div class="t-muted" style="font-size:10.8px">
          ${humanSize(f.size)}${f.rows ? ` — ${fa(f.rows)} ردیف` : ''} — ${relTime(f.createdAt)}
        </div>
      </div>
      ${badge(f.status, { text: 'آماده' })}
      <button class="row-action" data-download="${f.id}" aria-label="دانلود">${icon('download')}</button>
      <button class="row-action is-danger" data-delete-file="${f.id}" aria-label="حذف">${icon('trash-2')}</button>
    </div>`).join('');
  refreshIcons(host);

  host.querySelectorAll('[data-download]').forEach((btn) => {
    btn.addEventListener('click', () => downloadFile(btn.dataset.download));
  });
  host.querySelectorAll('[data-delete-file]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const file = state.files.find((f) => f.id === btn.dataset.deleteFile);
      const ok = await confirmDialog({
        title: 'حذف فایل',
        desc: `فایل «${file?.name || ''}» حذف می‌شود.`,
        details: 'این فایل فقط در فهرست فایل‌های افزونه حذف می‌شود و روی داده‌های فروشگاه اثری ندارد.',
        confirmText: 'حذف فایل',
        tone: 'danger',
        iconName: 'trash-2',
      });
      if (!ok) return;
      try {
        await api.del(`/files/${file.id}`);
        toast({ title: 'فایل حذف شد', tone: 'success' });
        loadFiles(root);
      } catch (err) {
        toast({ title: 'حذف ناموفق بود', text: err.message, tone: 'error' });
      }
    });
  });
}

function downloadFile(id) {
  const file = state.files.find((f) => f.id === id);
  if (!file) return;
  let content = '';
  let mime = 'text/csv;charset=utf-8';
  if (file.kind === 'json') {
    content = JSON.stringify({ exported_at: new Date().toISOString(), products: api.db.products.slice(0, 60) }, null, 2);
    mime = 'application/json;charset=utf-8';
  } else if (file.kind === 'backup') {
    content = 'این فایل در نسخه نمایشی رمزنگاری‌شده است و محتوای آن قابل خواندن نیست.';
    mime = 'text/plain;charset=utf-8';
  } else {
    const rows = [['id', 'name', 'sku', 'snapp_id', 'price', 'stock', 'status', 'mapping', 'sync']];
    api.db.products.slice(0, 60).forEach((p) => rows.push([
      p.id, `"${p.name}"`, p.sku, p.snappId || '', p.price, p.stock, p.status, p.mapping, p.sync,
    ]));
    content = '\ufeff' + rows.map((r) => r.join(',')).join('\n');
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast({ title: 'دانلود آغاز شد', text: file.name, tone: 'success', duration: 2400 });
}

function importTab() {
  return card({
    body: `
      <div class="dropzone" id="dropzone">
        <div class="dropzone__icon">${icon('upload')}</div>
        <div class="dropzone__title">فایل CSV محصولات را اینجا رها کنید</div>
        <div class="dropzone__text">یا برای انتخاب فایل کلیک کنید — حداکثر ۵ مگابایت</div>
        <input type="file" id="file-input" accept=".csv,text/csv" class="u-hidden" />
      </div>
      <div id="import-picked" style="margin-top:12px"></div>
      <div id="import-result" style="margin-top:12px"></div>
      <div class="alert alert--info" style="margin-top:14px">${icon('info')}<div class="alert__text">
        ستون‌های موردنیاز: <code>sku</code>، <code>price</code>، <code>stock</code>. ردیف‌های بدون SKU معتبر نادیده گرفته می‌شوند و تغییرات فقط پس از تأیید اعمال می‌شود.
      </div></div>`,
  });
}

function bindImport(root) {
  const drop = root.querySelector('#dropzone');
  const input = root.querySelector('#file-input');
  const picked = root.querySelector('#import-picked');

  const choose = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast({ title: 'فرمت فایل پشتیبانی نمی‌شود', text: 'فقط فایل CSV پذیرفته می‌شود.', tone: 'warning' });
      return;
    }
    state.pickedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split('\n').filter((l) => l.trim());
      const rows = Math.max(0, lines.length - 1);
      picked.innerHTML = `
        <div class="card" style="box-shadow:none">
          <div class="card__body">
            <div class="u-row gap-8">
              <div class="file-row__icon">${icon('file-spreadsheet')}</div>
              <div class="u-grow">
                <div style="font-size:12.5px;font-weight:550">${escapeHtml(file.name)}</div>
                <div class="t-muted" style="font-size:11px">${humanSize(file.size)} — حدود ${fa(rows)} ردیف داده</div>
              </div>
              <button class="btn btn--primary btn--sm" id="start-import">${icon('upload')} شروع ورود</button>
            </div>
          </div>
        </div>`;
      refreshIcons(picked);
      picked.querySelector('#start-import').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        setBusy(btn, true);
        try {
          const res = await api.post('/files/import', { rows });
          const result = root.querySelector('#import-result');
          result.innerHTML = `
            <div class="alert alert--success">${icon('check-circle-2')}<div>
              <div class="alert__title">ورود اطلاعات انجام شد</div>
              <div class="alert__text">${fa(res.imported)} ردیف وارد شد، ${fa(res.skipped)} ردیف رد شد.</div>
            </div></div>
            ${res.errors?.length ? `<div class="alert alert--warning" style="margin-top:8px">${icon('triangle-alert')}<div class="alert__text">
              ${res.errors.map((er) => `ردیف ${fa(er.row)}: ${escapeHtml(er.message)}`).join(' — ')}
            </div></div>` : ''}`;
          refreshIcons(result);
          toast({ title: 'ورود داده کامل شد', tone: 'success' });
          state.pickedFile = null;
          picked.innerHTML = '';
          loadFiles(root);
        } catch (err) {
          setBusy(btn, false);
          toast({ title: 'ورود داده ناموفق بود', text: err.message, tone: 'error' });
        }
      });
    };
    reader.readAsText(file);
  };

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('is-over');
    choose(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => choose(input.files[0]));
}

function exportTab() {
  return card({
    title: 'ایجاد فایل خروجی',
    sub: 'خروجی گرفتن از محصولات و سفارش‌های همین فروشگاه',
    body: `
      <div class="grid-2">
        <div class="field">
          <label class="field__label">داده موردنظر</label>
          <select class="select" id="export-scope">
            <option value="products">محصولات (شامل قیمت و موجودی)</option>
            <option value="orders">سفارش‌ها</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">فرمت خروجی</label>
          <div class="segmented" id="export-format">
            <button type="button" class="is-active" data-format="csv">${icon('table-2')} CSV</button>
            <button type="button" data-format="json">${icon('braces')} JSON</button>
          </div>
        </div>
      </div>
      <div class="alert alert--info" style="margin-top:14px">${icon('info')}<div class="alert__text">
        فایل خروجی در فهرست فایل‌ها ذخیره می‌شود و لینک دانلود مستقیم دارد. مبالغ به‌صورت رشته اعشاری و بدون تقسیم بر ۱۰ نوشته می‌شوند.
      </div></div>`,
    foot: `<span class="t-muted" style="font-size:11px">خروجی شامل اطلاعات حساس مشتری نیست.</span><div style="flex:1"></div><button class="btn btn--primary btn--sm" id="create-export">${icon('file-down')} ایجاد فایل</button>`,
  });
}

function bindExport(root) {
  let format = 'csv';
  root.querySelectorAll('#export-format [data-format]').forEach((btn) => {
    btn.addEventListener('click', () => {
      format = btn.dataset.format;
      root.querySelectorAll('#export-format [data-format]').forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });
  root.querySelector('#create-export').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    setBusy(btn, true);
    try {
      const file = await api.post('/files/export', { format, scope: root.querySelector('#export-scope').value });
      toast({ title: 'فایل خروجی ساخته شد', text: file.name, tone: 'success' });
      await loadFiles(root);
      switchTab(root, 'files');
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'ایجاد خروجی ناموفق بود', text: err.message, tone: 'error' });
    }
  });
}

function switchTab(root, tab) {
  state.tab = tab;
  root.querySelectorAll('#data-tabs [data-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  const host = root.querySelector('#data-body');
  if (tab === 'import') {
    host.innerHTML = importTab();
    refreshIcons(host);
    bindImport(root);
  } else if (tab === 'export') {
    host.innerHTML = exportTab();
    refreshIcons(host);
    bindExport(root);
  } else {
    host.innerHTML = card({ flush: true, title: 'فایل‌های ایجادشده', sub: 'خروجی‌ها و پشتیبان‌های رمزنگاری‌شده', body: '<div id="files-list"></div>' });
    refreshIcons(host);
    paintFiles(root);
  }
}

export async function render(root, ctx) {
  state = initial(ctx.params);
  root.innerHTML = `
    ${pageHead({
      title: 'ورود و خروج اطلاعات',
      sub: 'ورود محصولات از CSV، خروجی JSON/CSV و مدیریت فایل‌ها',
      actions: `<a class="btn btn--secondary" href="#/backup">${icon('database-backup')}<span>پشتیبان‌گیری</span></a>`,
    })}
    <div class="tabs" id="data-tabs" style="margin-bottom:14px">
      <button class="tab ${state.tab === 'import' ? 'is-active' : ''}" data-tab="import">${icon('upload')} ورود اطلاعات</button>
      <button class="tab ${state.tab === 'export' ? 'is-active' : ''}" data-tab="export">${icon('download')} خروجی</button>
      <button class="tab ${state.tab === 'files' ? 'is-active' : ''}" data-tab="files">${icon('folder-open')} فایل‌های من</button>
    </div>
    <div id="data-body"></div>`;
  refreshIcons(root);

  await loadFiles(root);

  root.querySelectorAll('#data-tabs [data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(root, btn.dataset.tab));
  });
  switchTab(root, state.tab);

  if (ctx.params.get('export')) {
    switchTab(root, 'export');
  }
}
