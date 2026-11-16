import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Search, X } from 'lucide-react'
import { useProducts } from '@/api/hooks'
import { allNavItems } from '@/app/nav'
import { formatToman } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ProductThumb } from '@/components/ui/product-thumb'
import { Skeleton } from '@/components/ui/skeleton'

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { data, isFetching } = useProducts({ search: query.trim(), per_page: 5, page: 1 })

  useEffect(() => {
    if (!open) return
    setQuery('')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const pages = allNavItems.filter((item) => item.label.includes(query.trim())).slice(0, 5)
  const products = query.trim().length > 1 ? data?.items ?? [] : []

  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-3 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="جست‌وجوی سراسری"
        className="relative z-10 w-full max-w-xl animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-pop"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی محصول، صفحه یا SKU…"
            className="h-12 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">ESC</kbd>
          <button
            type="button"
            aria-label="بستن جست‌وجو"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2">
          {pages.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground">صفحات</p>
              {pages.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => go(item.to)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start text-[12.5px] text-foreground transition-colors hover:bg-muted"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <ArrowLeft className="h-3 w-3 text-muted-foreground/50" />
                  </button>
                )
              })}
            </>
          )}

          {query.trim().length > 1 && (
            <>
              <p className="mt-2 px-2 py-1.5 text-[10px] font-medium text-muted-foreground">محصولات</p>
              {isFetching &&
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2.5 px-2 py-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-3.5 w-2/3" />
                  </div>
                ))}
              {!isFetching && products.length === 0 && (
                <p className="px-2 py-6 text-center text-[11.5px] text-muted-foreground">محصولی با این عبارت پیدا نشد.</p>
              )}
              {!isFetching &&
                products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => go(`/products?search=${encodeURIComponent(product.sku)}`)}
                    className={cn('flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors hover:bg-muted')}
                  >
                    <ProductThumb id={product.id} name={product.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] text-foreground">{product.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{product.sku}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">{formatToman(product.wc_price)}</span>
                  </button>
                ))}
            </>
          )}

          {query.trim().length === 0 && (
            <div className="flex items-center gap-2 px-2 py-6 text-[11px] text-muted-foreground">
              <Package className="h-4 w-4" />
              نام محصول یا SKU را وارد کنید تا نتایج نمایش داده شود.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
