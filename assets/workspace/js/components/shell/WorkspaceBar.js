import { el, Fragment } from '../../native/dom.js';
import { useYAgent } from '../../state/YAgentProvider.js';
import { Settings, RefreshCw, Monitor, X, ChevronDown } from '../../icons.js';
export function WorkspaceBar() {
  const { state, actions, derived } = useYAgent();
  const task = derived.currentTask;
  const model = state.models.find(m => m.id === state.selectedModelId);
  const busy = derived.running || state.sending;
  const connected = state.booted && state.models.length > 0;
  return el(Fragment, null,
    el('header', { className: 'workspace-bar yagent-root', 'aria-label': 'ابزارهای گفتگو' },
      el('span', { className: 'workspace-brand' }, 'YAgent', el('small', null, window.YAgentUI.siteName)),
      el('span', { className: 'workspace-connection', role: 'status', 'data-state': connected ? 'ready' : 'idle' }, !state.booted ? 'در حال اتصال…' : state.models.length ? state.workspace.provider : 'اتصال تنظیم نشده'),
      el('div', { className: 'workspace-controls' },
        el('label', { className: 'workspace-field' },
          el('span', { className: 'workspace-field-label' }, 'حالت'),
          el('span', { className: 'workspace-select' },
            el('select', { 'aria-label': 'حالت اجرا', value: state.executionMode, disabled: busy, onChange: e => actions.setOptions({ executionMode: e.target.value }) },
              el('option', { value: 'chat' }, 'گفتگو'),
              el('option', { value: 'agent', disabled: !model?.supportsTools }, 'اجرای ابزار')),
            el(ChevronDown, { className: 'workspace-select-caret', 'aria-hidden': true }))),
        el('label', { className: 'workspace-switch', title: state.workspace.readOnly ? 'اجازهٔ تغییر سایت در تنظیمات اتصال غیرفعال است.' : 'مجوز تغییر برای همین کار؛ عملیات حساس کارت تأیید دارند.' },
          el('input', { type: 'checkbox', checked: state.readOnly || state.workspace.readOnly, disabled: state.workspace.readOnly || busy, onChange: e => actions.setOptions({ readOnly: e.target.checked }) }),
          el('span', { className: 'workspace-switch-track', 'aria-hidden': true }, el('span', { className: 'workspace-switch-thumb' })),
          el('span', null, 'فقط خواندنی'))),
      el('span', { className: 'workspace-spacer' }),
      task?.paused ? el('button', { className: 'workspace-resume', onClick: () => void actions.resume() }, 'ادامهٔ کار') : null,
      el('div', { className: 'workspace-actions' },
        el('button', { 'aria-label': 'تازه‌سازی وضعیت', title: 'تازه‌سازی وضعیت', disabled: state.sending, onClick: () => void actions.refresh() }, el(RefreshCw, { className: 'h-4 w-4' })),
        el('button', { 'aria-label': 'تمام‌صفحه', title: 'تمام‌صفحه', onClick: () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.().catch(() => {}); } }, el(Monitor, { className: 'h-4 w-4' })),
        el('span', { className: 'workspace-actions-sep', 'aria-hidden': true }),
        el('a', { href: window.YAgentUI.settingsUrl, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'تنظیمات اتصال و مدیریت', title: 'تنظیمات اتصال و مدیریت' }, el(Settings, { className: 'h-4 w-4' })))),
    state.error ? el('div', { className: 'workspace-alert yagent-root', role: 'alert' }, el('span', null, state.error), el('button', { onClick: actions.dismissError, 'aria-label': 'بستن پیام خطا' }, el(X, { className: 'h-4 w-4' }))) : null,
    state.booted && !state.models.length ? el('div', { className: 'workspace-onboarding yagent-root' }, el('span', null, 'برای شروع، سرویس هوش مصنوعی و کلید API را ذخیره کنید.'), el('a', { href: window.YAgentUI.settingsUrl, target: '_blank', rel: 'noopener noreferrer' }, 'تنظیم اتصال'), el('button', { onClick: () => void actions.refresh() }, 'ذخیره کردم؛ بررسی دوباره')) : null);
}
