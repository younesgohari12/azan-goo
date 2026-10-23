import { el, Fragment } from '../../native/dom.js';
import { Gauge, LayoutTemplate, PenLine, Plug } from '../../icons.js';
import { motion } from '../../native/motion.js';
import { YAgentMark } from '../sidebar/ChatSidebar.js';
import { useYAgent } from '../../state/YAgentProvider.js';
const SUGGESTIONS = [
    {
        icon: LayoutTemplate,
        title: 'ساخت صفحه با المنتور',
        description: 'صفحهٔ فرود برای معرفی خدمات',
        prompt: 'یک صفحهٔ فرود برای معرفی خدمات سایت من طراحی کن؛ ابتدا ساختار پیشنهادی را توضیح بده.',
    },
    {
        icon: Plug,
        title: 'ساخت افزونه',
        description: 'افزونهٔ رزرو نوبت با فرم و تنظیمات',
        prompt: 'یک افزونهٔ رزرو نوبت برای سایت بساز و نصب کن.',
    },
    {
        icon: Gauge,
        title: 'بررسی سایت',
        description: 'پیکربندی و پیشنهادهای اولویت‌دار',
        prompt: 'پیکربندی و ابزارهای فعال سایت را بررسی کن و پیشنهادهای اولویت‌دار بده.',
    },
    {
        icon: PenLine,
        title: 'ویرایش یک صفحه',
        description: 'بازطراحی ساختار صفحهٔ دربارهٔ ما',
        prompt: 'صفحهٔ دربارهٔ ما را بازطراحی کن.',
    },
];
export function EmptyState() {
    const { actions } = useYAgent();
    return (el("div", { className: "mx-auto flex w-full max-w-[var(--y-reading-w)] flex-1 flex-col items-center justify-center px-5 py-10 text-center" },
        el(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }, className: "flex flex-col items-center" },
            el(YAgentMark, { className: "h-12 w-12 rounded-y-md" }),
            el("h1", { className: "mt-4 text-y-xl font-semibold text-y-ink" }, "\u0686\u0647 \u06A9\u0627\u0631\u06CC \u0631\u0648\u06CC \u0633\u0627\u06CC\u062A\u062A \u0627\u0646\u062C\u0627\u0645 \u0628\u062F\u0645\u061F"),
            el("p", { className: "mt-2 max-w-[34rem] text-y-base leading-8 text-y-ink-muted" }, "درخواستت را بنویس؛ با گفتگو صفحه طراحی کن، افزونه بساز یا سایت را بررسی کن. مراحل اجرا و نتیجهٔ ابزارها همین‌جا نمایش داده می‌شوند.")),
        el("div", { className: "mt-8 grid w-full gap-2.5 sm:grid-cols-2" }, SUGGESTIONS.map((suggestion, index) => (el(motion.button, { key: suggestion.title, type: "button", onClick: () => void actions.sendPrompt(suggestion.prompt), initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, delay: 0.04 * index, ease: [0.22, 0.61, 0.36, 1] }, className: "group flex items-start gap-3 rounded-y-md border border-y-line bg-y-surface-soft/60 p-3.5 text-start transition-colors duration-y-fast ease-y hover:border-y-line-strong hover:bg-y-surface" },
            el("span", { className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-y-sm bg-y-surface text-y-accent" },
                el(suggestion.icon, { className: "h-4 w-4" })),
            el("span", { className: "min-w-0" },
                el("span", { className: "block text-y-base font-medium text-y-ink" }, suggestion.title),
                el("span", { className: "mt-0.5 block truncate text-y-sm text-y-ink-dim" }, suggestion.description))))))));
}
