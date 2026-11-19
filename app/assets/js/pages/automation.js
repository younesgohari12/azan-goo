import { api } from '../core/api.js';
import {
  icon, refreshIcons, toast, badge, confirmDialog, emptyState, errorState, setBusy,
} from '../core/ui.js';
import { fa, escapeHtml, relTime } from '../core/utils.js';
import { pageHead, card, statCard } from '../components/common.js';

let state = null;

const TRIGGER_TYPES = [
  { key: 'schedule', label: 'بازه زمانی', icon: 'calendar-clock', hint: 'مثلاً هر روز ساعت ۰۲:۰۰' },
  { key: 'cron', label: 'Cron', icon: 'timer-reset', hint: 'مثلاً */15 * * * *' },
  { key: 'event', label: 'رویداد', icon: 'zap', hint: 'مثلاً سفارش جدید در اسنپ‌شاپ' },
];

const CONDITION_FIELDS = [
  ['stock', 'موجودی ووکامرس'], ['snappStock', 'موجودی اسنپ‌شاپ'], ['price', 'قیمت'],
  ['mapping', 'وضعیت نگاشت'], ['sync', 'وضعیت همگام‌سازی'], ['status', 'وضعیت محصول'], ['category', 'دسته‌بندی'],
];

const ACTION_TYPES = [
  { key: 'pricing', label: 'قیمت‌گذاری', icon: 'badge-percent' },
  { key: 'sync', label: 'همگام‌سازی', icon: 'refresh-cw' },
  { key: 'notify', label: 'ایجاد اعلان', icon: 'bell' },
];

function initial(params) {
  return {
    view: params.get('new') === '1' ? 'builder' : 'list',
    rules: [],
    loading: true,
    draft: null,
    dirty: false,
  };
}

function blankRule() {
  return {
    id: null,
    name: '',
    enabled: true,
    trigger: { type: 'schedule', value: 'هر روز ساعت ۰۲:۰۰' },
    conditions: [{ field: 'stock', op: '>', value: '10' }],
    conditionLogic: 'AND',
    actions: [{ type: 'pricing', value: 'کاهش ۳٪' }],
  };
}

async function load(root) {
  try {
    const { items } = await api.get('/automation');
    state.rules = items;
    state.loading = false;
    if (state.view === 'list') paintList(root);
  } catch (err) {
    state.loading = false;
    root.querySelector('#automation-view').innerHTML = `<div class="card">${errorState({ text: err.message })}</div>`;
    refreshIcons(root);
    root.querySelector('[data-retry]')?.addEventListener('click', () => load(root));
  }
}

function ruleSummary(rule) {
  return `
    <div class="rule-card__body">
      <div class="rule-line">
        <span class="builder-block__tag">WHEN</span>
        <b>${escapeHtml(rule.trigger.value)}</b>
      </div>
      <div class="rule-line">
        <span class="builder-block__tag is-if">IF</span>
        ${rule.conditions.map((c, i) => `
          ${i ? `<span class="logic-chip">${rule.conditionLogic}</span>` : ''}
          <span class="pill">${escapeHtml(CONDITION_FIELDS.find((f) => f[0] === c.field)?.[1] || c.field)} ${escapeHtml(c.op)} ${escapeHtml(c.value)}</span>`).join('')}
      </div>
      <div class="rule-line">
        <span class="builder-block__tag is-then">THEN</span>
        ${rule.actions.map((a) => `<span class="pill">${icon(ACTION_TYPES.find((t) => t.key === a.type)?.icon || 'bolt')} ${escapeHtml(a.value)}</span>`).join('')}
      </div>
    </div>`;
}

function paintList(root) {
  const head = root.querySelector('#automation-head');
  if (head) head.style.display = '';
  const host = root.querySelector('#automation-view');
  const active = state.rules.filter((r) => r.enabled).length;
  const totalRuns = state.rules.reduce((sum, r) => sum + r.runs, 0);

  host.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">
      ${statCard({ iconName: 'workflow', tone: 'brand', label: 'کل قوانین', value: fa(state.rules.length), foot: '<span class="t-muted">شامل فعال و غیرفعال</span>' })}
      ${statCard({ iconName: 'play-circle', tone: 'success', label: 'قوانین فعال', value: fa(active), foot: '<span class="t-muted">در حال اجرا طبق زمان‌بندی</span>' })}
      ${statCard({ iconName: 'repeat', label: 'اجراهای ثبت‌شده', value: fa(totalRuns), foot: '<span class="t-muted">از ابتدای ایجاد</span>' })}
      ${statCard({ iconName: 'clock', tone: 'info', label: 'آخرین اجرا', value: state.rules.filter((r) => r.lastRun).length ? relTime(state.rules.filter((r) => r.lastRun).sort((a, b) => new Date(b.lastRun) - new Date(a.lastRun))[0].lastRun) : '—', foot: '<span class="t-muted">بر اساس آخرین قانون اجراشده</span>' })}
    </div>
    <div class="section-gap" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px" id="rules-grid">
      ${state.rules.map((rule) => `
        <article class="rule-card ${rule.enabled ? '' : 'is-disabled'}" data-rule="${rule.id}">
          <div class="rule-card__head">
            <div class="stat__icon ${rule.enabled ? 'is-brand' : ''}">${icon('workflow')}</div>
            <div class="u-grow" style="min-width:0">
              <div class="rule-card__title t-clamp">${escapeHtml(rule.name)}</div>
              <div class="rule-card__meta">${rule.lastRun ? `آخرین اجرا ${relTime(rule.lastRun)}` : 'هرگز اجرا نشده'} — ${fa(rule.runs)} اجرا</div>
            </div>
            <label class="switch switch--sm" title="فعال/غیرفعال">
              <input type="checkbox" data-toggle="${rule.id}" ${rule.enabled ? 'checked' : ''} />
              <span class="switch__track"></span>
            </label>
          </div>
          ${ruleSummary(rule)}
          <div class="card__foot" style="justify-content:space-between">
            <button class="btn btn--ghost btn--sm" data-edit-rule="${rule.id}">${icon('pencil')} ویرایش</button>
            <div class="u-row gap-6">
              <button class="btn btn--secondary btn--sm" data-run-rule="${rule.id}">${icon('play')} اجرای دستی</button>
              <button class="row-action is-danger" data-delete-rule="${rule.id}" aria-label="حذف">${icon('trash-2')}</button>
            </div>
          </div>
        </article>`).join('')}
    </div>`;
  refreshIcons(host);

  host.querySelectorAll('[data-toggle]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const id = cb.dataset.toggle;
      const rule = state.rules.find((r) => r.id === id);
      try {
        await api.patch(`/automation/${id}`, { enabled: cb.checked });
        rule.enabled = cb.checked;
        toast({ title: cb.checked ? 'قانون فعال شد' : 'قانون غیرفعال شد', text: rule.name, tone: cb.checked ? 'success' : 'warning' });
        paintList(root);
      } catch (err) {
        cb.checked = !cb.checked;
        toast({ title: 'تغییر وضعیت ناموفق بود', text: err.message, tone: 'error' });
      }
    });
  });
  host.querySelectorAll('[data-edit-rule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rule = state.rules.find((r) => r.id === btn.dataset.editRule);
      openBuilder(root, JSON.parse(JSON.stringify(rule)));
    });
  });
  host.querySelectorAll('[data-run-rule]').forEach((btn) => {
    btn.addEventListener('click', () => runRule(root, btn.dataset.runRule));
  });
  host.querySelectorAll('[data-delete-rule]').forEach((btn) => {
    btn.addEventListener('click', () => deleteRule(root, btn.dataset.deleteRule));
  });
}

async function runRule(root, id) {
  const rule = state.rules.find((r) => r.id === id);
  const ok = await confirmDialog({
    title: 'اجرای دستی قانون',
    desc: `قانون «${rule?.name}» همین حالا یک‌بار اجرا می‌شود.`,
    details: 'اجرای دستی زمان‌بندی قانون را تغییر نمی‌دهد و در شمار اجراها ثبت می‌شود.',
    confirmText: 'اجرا کن',
    iconName: 'play',
  });
  if (!ok) return;
  try {
    await api.post(`/automation/${id}/run`);
    toast({ title: 'قانون با موفقیت اجرا شد', text: rule?.name, tone: 'success' });
    load(root);
  } catch (err) {
    toast({ title: 'اجرای قانون ناموفق بود', text: err.message, tone: 'error' });
  }
}

async function deleteRule(root, id) {
  const rule = state.rules.find((r) => r.id === id);
  const ok = await confirmDialog({
    title: 'حذف قانون اتوماسیون',
    desc: `قانون «${rule?.name}» برای همیشه حذف می‌شود.`,
    details: 'اجراهای ثبت‌شده در لاگ‌ها باقی می‌مانند اما قانون دیگر اجرا نمی‌شود.',
    confirmText: 'حذف قانون',
    tone: 'danger',
    iconName: 'trash-2',
  });
  if (!ok) return;
  try {
    await api.del(`/automation/${id}`);
    toast({ title: 'قانون حذف شد', tone: 'success' });
    load(root);
  } catch (err) {
    toast({ title: 'حذف ناموفق بود', text: err.message, tone: 'error' });
  }
}

/* --------------------------------------------------------------- builder */
function openBuilder(root, rule) {
  state.view = 'builder';
  state.draft = rule || blankRule();
  state.dirty = false;
  paintBuilder(root);
}

function builderMarkup() {
  const r = state.draft;
  return `
    ${pageHead({
      title: r.id ? 'ویرایش قانون' : 'قانون جدید',
      sub: 'ساخت قانون با ساختار WHEN → IF → THEN',
      actions: `
        <button class="btn btn--secondary" id="builder-cancel">${icon('x')}<span>انصراف</span></button>
        <button class="btn btn--primary" id="builder-save">${icon('check')}<span>${r.id ? 'ذخیره تغییرات' : 'ایجاد قانون'}</span></button>`,
    })}
    <div class="grid-2" style="grid-template-columns:minmax(0,1fr) 300px;align-items:start">
      <div class="stack-12">
        <section class="card">
          <div class="card__head"><div class="card__title">نام و وضعیت قانون</div></div>
          <div class="card__body">
            <div class="form-grid">
              <div class="field span-2">
                <label class="field__label">نام قانون <span class="req">*</span></label>
                <input class="input" id="rule-name" value="${escapeHtml(r.name)}" placeholder="مثلاً کاهش قیمت محصولات کم‌فروش" />
              </div>
            </div>
            <div class="setting-row" style="border-bottom:0;padding-bottom:0">
              <div class="setting-row__main">
                <div class="setting-row__title">قانون فعال باشد</div>
                <div class="setting-row__desc">قوانین غیرفعال اجرا نمی‌شوند اما تنظیماتشان حفظ می‌شود.</div>
              </div>
              <div class="setting-row__control">
                <label class="switch"><input type="checkbox" id="rule-enabled" ${r.enabled ? 'checked' : ''} /><span class="switch__track"></span></label>
              </div>
            </div>
          </div>
        </section>

        <section class="builder-block">
          <div class="builder-block__head"><span class="builder-block__tag">WHEN</span> زمان یا رویداد شروع</div>
          <div class="builder-block__body">
            <div class="grid-3">
              ${TRIGGER_TYPES.map((t) => `
                <label class="option-card ${r.trigger.type === t.key ? 'is-selected' : ''}" data-trigger="${t.key}">
                  <span class="stat__icon" style="margin-top:1px">${icon(t.icon)}</span>
                  <span class="u-grow">
                    <span class="option-card__title" style="display:block">${t.label}</span>
                    <span class="option-card__desc" style="display:block">${t.hint}</span>
                  </span>
                </label>`).join('')}
            </div>
            <div class="field" style="margin-top:12px">
              <label class="field__label">مقدار</label>
              <input class="input" id="trigger-value" value="${escapeHtml(r.trigger.value)}" placeholder="${TRIGGER_TYPES.find((t) => t.key === r.trigger.type)?.hint}" />
            </div>
          </div>
        </section>

        <div class="flow-arrow">${icon('arrow-down')}</div>

        <section class="builder-block">
          <div class="builder-block__head">
            <span class="builder-block__tag is-if">IF</span> شرط‌ها
            <div class="u-row gap-6" style="margin-inline-start:auto">
              <span class="t-label">ترکیب:</span>
              <div class="segmented" id="logic-switch">
                ${['AND', 'OR', 'NOT'].map((l) => `<button type="button" class="${r.conditionLogic === l ? 'is-active' : ''}" data-logic="${l}">${l}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="builder-block__body" id="conditions">
            ${r.conditions.map((c, i) => `
              <div class="cond-row" data-cond="${i}">
                ${i ? `<span class="logic-chip">${r.conditionLogic}</span>` : ''}
                <select class="select" data-cond-field="${i}">
                  ${CONDITION_FIELDS.map(([k, l]) => `<option value="${k}" ${c.field === k ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
                <select class="select" data-cond-op="${i}" style="max-width:90px">
                  ${['=', '!=', '>', '<', '>=', '<='].map((op) => `<option ${c.op === op ? 'selected' : ''}>${op}</option>`).join('')}
                </select>
                <input class="input" data-cond-value="${i}" value="${escapeHtml(c.value)}" placeholder="مقدار" />
                <button class="row-action is-danger" data-cond-remove="${i}" aria-label="حذف شرط">${icon('x')}</button>
              </div>`).join('')}
            <button class="btn btn--ghost btn--sm" id="add-condition" style="margin-top:8px">${icon('plus')} افزودن شرط</button>
          </div>
        </section>

        <div class="flow-arrow">${icon('arrow-down')}</div>

        <section class="builder-block">
          <div class="builder-block__head"><span class="builder-block__tag is-then">THEN</span> اقدام‌ها</div>
          <div class="builder-block__body" id="actions">
            ${r.actions.map((a, i) => `
              <div class="cond-row" data-action="${i}">
                <select class="select" data-action-type="${i}" style="max-width:150px">
                  ${ACTION_TYPES.map((t) => `<option value="${t.key}" ${a.type === t.key ? 'selected' : ''}>${t.label}</option>`).join('')}
                </select>
                <input class="input" data-action-value="${i}" value="${escapeHtml(a.value)}" placeholder="مثلاً کاهش ۳٪" />
                <button class="row-action is-danger" data-action-remove="${i}" aria-label="حذف اقدام">${icon('x')}</button>
              </div>`).join('')}
            <button class="btn btn--ghost btn--sm" id="add-action" style="margin-top:8px">${icon('plus')} افزودن اقدام</button>
          </div>
        </section>
      </div>

      <div class="stack-12">
        <section class="card">
          <div class="card__head"><div class="card__title">پیش‌نمایش قانون</div></div>
          <div class="card__body">
            <div class="rule-line"><span class="builder-block__tag">WHEN</span><span>${escapeHtml(state.draft.trigger.value || '—')}</span></div>
            <div class="rule-line" style="margin-top:6px"><span class="builder-block__tag is-if">IF</span><span>${state.draft.conditions.length} شرط با ترکیب ${state.draft.conditionLogic}</span></div>
            <div class="rule-line" style="margin-top:6px"><span class="builder-block__tag is-then">THEN</span><span>${state.draft.actions.length} اقدام</span></div>
            <div class="divider" style="margin:12px 0"></div>
            <div class="t-muted" style="font-size:11.3px;line-height:1.8">
              قوانین فقط مجاز به اجرای عملیات موجود در افزونه هستند. تغییر وضعیت سفارش یا استرداد وجه در اسنپ‌شاپ از اتوماسیون انجام نمی‌شود.
            </div>
          </div>
        </section>
        <section class="card">
          <div class="card__head"><div class="card__title">راهنما</div></div>
          <div class="card__body">
            <ul class="mini-list">
              <li>${icon('calendar-clock')} برای اجرای دوره‌ای از «بازه زمانی» یا «Cron» استفاده کنید.</li>
              <li>${icon('filter')} شرط‌ها فقط روی محصولات اسنپ‌شاپ اعمال می‌شوند.</li>
              <li>${icon('bell')} برای اطلاع از نتیجه، اقدام «ایجاد اعلان» را اضافه کنید.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>`;
}

function collect() {
  const r = state.draft;
  r.name = document.getElementById('rule-name')?.value ?? r.name;
  r.enabled = document.getElementById('rule-enabled')?.checked ?? r.enabled;
  r.trigger.value = document.getElementById('trigger-value')?.value ?? r.trigger.value;
  r.conditions.forEach((c, i) => {
    c.field = document.querySelector(`[data-cond-field="${i}"]`)?.value ?? c.field;
    c.op = document.querySelector(`[data-cond-op="${i}"]`)?.value ?? c.op;
    c.value = document.querySelector(`[data-cond-value="${i}"]`)?.value ?? c.value;
  });
  r.actions.forEach((a, i) => {
    a.type = document.querySelector(`[data-action-type="${i}"]`)?.value ?? a.type;
    a.value = document.querySelector(`[data-action-value="${i}"]`)?.value ?? a.value;
  });
}

function paintBuilder(root) {
  const head = root.querySelector('#automation-head');
  if (head) head.style.display = 'none';
  root.querySelector('#automation-view').innerHTML = builderMarkup();
  refreshIcons(root);

  const view = root.querySelector('#automation-view');
  view.querySelectorAll('[data-trigger]').forEach((el) => {
    el.addEventListener('click', () => {
      collect();
      state.draft.trigger.type = el.dataset.trigger;
      const preset = { schedule: 'هر روز ساعت ۰۲:۰۰', cron: '*/15 * * * *', event: 'سفارش جدید در اسنپ‌شاپ' }[el.dataset.trigger];
      state.draft.trigger.value = preset;
      paintBuilder(root);
    });
  });
  view.querySelectorAll('[data-logic]').forEach((btn) => {
    btn.addEventListener('click', () => {
      collect();
      state.draft.conditionLogic = btn.dataset.logic;
      paintBuilder(root);
    });
  });
  view.querySelector('#add-condition')?.addEventListener('click', () => {
    collect();
    state.draft.conditions.push({ field: 'stock', op: '>', value: '0' });
    paintBuilder(root);
  });
  view.querySelectorAll('[data-cond-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      collect();
      state.draft.conditions.splice(Number(btn.dataset.condRemove), 1);
      paintBuilder(root);
    });
  });
  view.querySelector('#add-action')?.addEventListener('click', () => {
    collect();
    state.draft.actions.push({ type: 'notify', value: 'اعلان به اپراتور' });
    paintBuilder(root);
  });
  view.querySelectorAll('[data-action-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      collect();
      state.draft.actions.splice(Number(btn.dataset.actionRemove), 1);
      paintBuilder(root);
    });
  });
  view.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', () => { state.dirty = true; });
  });

  view.querySelector('#builder-cancel').addEventListener('click', async () => {
    collect();
    if (state.dirty) {
      const ok = await confirmDialog({
        title: 'تغییرات ذخیره نشده',
        desc: 'تغییرات این قانون ذخیره نشده است. خارج می‌شوید؟',
        confirmText: 'خروج بدون ذخیره',
        tone: 'danger',
      });
      if (!ok) return;
    }
    state.view = 'list';
    state.draft = null;
    paintList(root);
  });

  view.querySelector('#builder-save').addEventListener('click', async (e) => {
    collect();
    if (!state.draft.name.trim()) {
      toast({ title: 'نام قانون الزامی است', tone: 'warning' });
      view.querySelector('#rule-name').classList.add('input--invalid');
      return;
    }
    if (!state.draft.conditions.length || !state.draft.actions.length) {
      toast({ title: 'قانون ناقص است', text: 'حداقل یک شرط و یک اقدام لازم است.', tone: 'warning' });
      return;
    }
    const btn = e.currentTarget;
    setBusy(btn, true);
    try {
      const payload = {
        name: state.draft.name,
        enabled: state.draft.enabled,
        trigger: state.draft.trigger,
        conditions: state.draft.conditions,
        conditionLogic: state.draft.conditionLogic,
        actions: state.draft.actions,
      };
      if (state.draft.id) await api.patch(`/automation/${state.draft.id}`, payload);
      else await api.post('/automation', payload);
      toast({ title: state.draft.id ? 'قانون ویرایش شد' : 'قانون ایجاد شد', text: state.draft.name, tone: 'success' });
      state.view = 'list';
      state.draft = null;
      state.dirty = false;
      await load(root);
    } catch (err) {
      setBusy(btn, false);
      toast({ title: 'ذخیره ناموفق بود', text: err.message, tone: 'error' });
    }
  });
}

export async function render(root, ctx) {
  state = initial(ctx.params);
  root.innerHTML = `
    <div id="automation-head">
      ${pageHead({
        title: 'اتوماسیون',
        sub: 'قوانین WHEN → IF → THEN برای قیمت‌گذاری، همگام‌سازی و اعلان',
        actions: `
          <button class="btn btn--secondary" id="automation-refresh">${icon('refresh-cw')}<span>بروزرسانی</span></button>
          <button class="btn btn--primary" id="new-rule">${icon('plus')}<span>قانون جدید</span></button>`,
      })}
    </div>
    <div id="automation-view"></div>`;
  refreshIcons(root);

  root.querySelector('#new-rule').addEventListener('click', () => openBuilder(root, null));
  root.querySelector('#automation-refresh').addEventListener('click', () => {
    state.view = 'list';
    load(root);
  });

  await load(root);
  if (state.view === 'builder' && !state.draft) openBuilder(root, null);
}
