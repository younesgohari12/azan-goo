import { Gauge, LayoutTemplate, PenLine, Plug } from 'lucide-react'
import { motion } from 'framer-motion'

import { YAgentMark } from '@/components/sidebar/ChatSidebar'
import { useYAgent } from '@/state/YAgentProvider'

const SUGGESTIONS = [
  {
    icon: LayoutTemplate,
    title: 'ساخت صفحه با المنتور',
    description: 'صفحهٔ فرود برای معرفی خدمات',
    prompt: 'یک صفحهٔ فرود با المنتور برای معرفی خدمات استودیو آرا بساز.',
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
    description: 'سرعت و پیشنهادهای اولویت‌دار',
    prompt: 'سرعت سایت را بررسی کن و بگو چه چیزی را باید اصلاح کنم.',
  },
  {
    icon: PenLine,
    title: 'ویرایش یک صفحه',
    description: 'بازطراحی ساختار صفحهٔ دربارهٔ ما',
    prompt: 'صفحهٔ دربارهٔ ما را بازطراحی کن.',
  },
]

export function EmptyState() {
  const { actions } = useYAgent()

  return (
    <div className="mx-auto flex w-full max-w-[var(--y-reading-w)] flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <YAgentMark className="h-12 w-12 rounded-y-md" />
        <h1 className="mt-4 text-y-xl font-semibold text-y-ink">چه کاری روی سایتت انجام بدم؟</h1>
        <p className="mt-2 max-w-[34rem] text-y-base leading-8 text-y-ink-muted">
          درخواستت را بنویس تا صفحه بسازم، افزونه نصب کنم یا سرعت سایت را بررسی کنم. قبل از هر تغییر روی
          سایت، از تو تأیید می‌گیرم.
        </p>
      </motion.div>

      <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion, index) => (
          <motion.button
            key={suggestion.title}
            type="button"
            onClick={() => void actions.sendPrompt(suggestion.prompt)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.04 * index, ease: [0.22, 0.61, 0.36, 1] }}
            className="group flex items-start gap-3 rounded-y-md border border-y-line bg-y-surface-soft/60 p-3.5 text-start transition-colors duration-y-fast ease-y hover:border-y-line-strong hover:bg-y-surface"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-y-sm bg-y-surface text-y-accent">
              <suggestion.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-y-base font-medium text-y-ink">{suggestion.title}</span>
              <span className="mt-0.5 block truncate text-y-sm text-y-ink-dim">{suggestion.description}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
