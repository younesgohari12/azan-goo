import { el, Fragment } from '../../native/dom.js';
import { Gauge, Plug, ShieldCheck, Sparkles } from '../../icons.js';
import { Dialog, DialogContent } from '../ui/dialog.js';
import { Button } from '../ui/button.js';
import { ChatAppearanceTab } from './ChatAppearanceTab.js';
import { ConsumptionTab } from './ConsumptionTab.js';
import { ModelsTab } from './ModelsTab.js';
import { RunPermissionsTab } from './RunPermissionsTab.js';
import { cn } from '../../lib/utils.js';
import { useYAgent } from '../../state/YAgentProvider.js';

const TABS = [
    { value: 'models', label: 'مدل‌ها و اتصال', icon: el(Plug, { className: "h-3.5 w-3.5" }) },
    { value: 'run', label: 'اجرا و مجوزها', icon: el(ShieldCheck, { className: "h-3.5 w-3.5" }) },
    { value: 'consumption', label: 'مصرف', icon: el(Gauge, { className: "h-3.5 w-3.5" }) },
    { value: 'chat', label: 'گفتگو و ظاهر', icon: el(Sparkles, { className: "h-3.5 w-3.5" }) },
];

/**
 * The settings view: the same dark shell, opened over the workspace.
 *
 * It is a tabbed surface of ordinary labelled controls — no embedded WordPress
 * screen and no JSON editor. The dialog primitive already provides the focus
 * trap, `Escape` and the explicit close button, so the panel can only be left
 * deliberately.
 */
export function SettingsView() {
    const { state, actions } = useYAgent();
    const open = state.settingsOpen;
    const active = state.settingsTab;
    const footer = el(Fragment, null,
        el(Button, { variant: "ghost", size: "sm", onClick: () => actions.closeSettings() }, "بستن"));
    return (el(Dialog, { open: open, onOpenChange: (value) => { if (!value)
            actions.closeSettings(); } }, open ? (el(DialogContent, { title: "تنظیمات و مدیریت", description: "مدل‌ها و اتصال، مجوزهای اجرا، سقف مصرف و ترجیحات گفتگو.", className: "yagent-settings-dialog", footer: footer },
        el("div", { className: "yagent-settings" },
            el("div", { role: "tablist", "aria-label": "بخش‌های تنظیمات", className: "yagent-tabs" }, TABS.map((tab) => (el("button", { key: tab.value, type: "button", role: "tab", id: `yagent-tab-${tab.value}`, "aria-selected": tab.value === active, "aria-controls": `yagent-tabpanel-${tab.value}`, tabIndex: tab.value === active ? 0 : -1, className: cn('yagent-tab', tab.value === active && 'is-active'), onClick: () => actions.setSettingsTab(tab.value) },
                tab.icon,
                el("span", null, tab.label))))),
            el("div", { role: "tabpanel", id: `yagent-tabpanel-${active}`, "aria-labelledby": `yagent-tab-${active}`, tabIndex: -1, className: "yagent-settings-panel" }, active === 'models' ? (el(ModelsTab, null)) : active === 'run' ? (el(RunPermissionsTab, null)) : active === 'consumption' ? (el(ConsumptionTab, null)) : (el(ChatAppearanceTab, null)))))) : null));
}
