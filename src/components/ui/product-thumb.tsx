import { cn } from '@/lib/utils'

const palettes = [
  'from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-300',
  'from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-300',
  'from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-300',
  'from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-300',
  'from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-300',
  'from-cyan-500/15 to-cyan-500/5 text-cyan-600 dark:text-cyan-300',
]

export function ProductThumb({
  id,
  name,
  size = 'md',
  className,
}: {
  id: number
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const palette = palettes[Math.abs(id) % palettes.length]
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br font-semibold',
        palette,
        size === 'sm' && 'h-7 w-7 text-[11px]',
        size === 'md' && 'h-9 w-9 text-[13px]',
        size === 'lg' && 'h-16 w-16 rounded-xl text-xl',
        className,
      )}
    >
      {name.trim().charAt(0)}
    </div>
  )
}

export function StoreMark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-[13px] font-semibold text-primary', className)}>
      {name.trim().charAt(0)}
    </span>
  )
}
