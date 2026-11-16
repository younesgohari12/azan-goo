import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, History, Package, Save, Tag } from 'lucide-react'
import { usePriceHistory, useProduct, useUpdateProduct } from '@/api/hooks'
import { formatDateTime, formatNumber, formatPercent, formatRelative, formatToman } from '@/lib/format'
import { matchStatusMeta, syncStatusMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Drawer } from '@/components/ui/drawer'
import { Field, Input } from '@/components/ui/input'
import { ProductThumb } from '@/components/ui/product-thumb'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-[11.5px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

export function ProductDrawer({ productId, onClose }: { productId: number | null; onClose: () => void }) {
  const { data: product, isLoading } = useProduct(productId)
  const { data: history } = usePriceHistory({ product_id: productId ?? 0, limit: 6 })
  const updateProduct = useUpdateProduct()
  const { toast } = useToast()
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!product) return
    setPrice(String(product.wc_price))
    setStock(String(product.wc_stock))
  }, [product?.id])

  const nextPrice = Number(price)
  const nextStock = Number(stock)
  const priceDirty = Boolean(product) && Number.isFinite(nextPrice) && nextPrice !== product?.wc_price
  const stockDirty = Boolean(product) && Number.isFinite(nextStock) && nextStock !== product?.wc_stock
  const dirty = priceDirty || stockDirty

  const save = () => {
    if (!product) return
    updateProduct.mutate(
      {
        id: product.id,
        body: {
          ...(priceDirty ? { wc_price: Math.max(0, Math.round(nextPrice)) } : {}),
          ...(stockDirty ? { wc_stock: Math.max(0, Math.round(nextStock)) } : {}),
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'تغییرات ذخیره شد', description: 'محصول با موفقیت به‌روزرسانی شد.', variant: 'success' })
          setConfirmOpen(false)
        },
        onError: (error) => toast({ title: 'ذخیره ناموفق بود', description: (error as Error).message, variant: 'error' }),
      },
    )
  }

  const pricePercent = product && nextPrice ? formatPercent(((nextPrice - product.wc_price) / product.wc_price) * 100, true) : '—'

  return (
    <>
      <Drawer
        open={productId !== null}
        onClose={onClose}
        title="جزئیات محصول"
        description={product ? product.name : 'در حال دریافت اطلاعات…'}
        width="lg"
        footer={
          <>
            <span className="text-[10.5px] text-muted-foreground">
              {dirty ? 'تغییرات ذخیره‌نشده دارید' : 'اطلاعات به‌روز است'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                بستن
              </Button>
              <Button
                variant="primary"
                startIcon={<Save className="h-3.5 w-3.5" />}
                disabled={!dirty}
                onClick={() => setConfirmOpen(true)}
              >
                ذخیره تغییرات
              </Button>
            </div>
          </>
        }
      >
        {isLoading || !product ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3">
              <ProductThumb id={product.id} name={product.name} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold leading-6 text-foreground">{product.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">SKU: {product.sku}</Badge>
                  {product.type === 'variable' && <Badge variant="info">محصول متغیر</Badge>}
                  <Badge variant={syncStatusMeta[product.sync_status].tone} dot>
                    {syncStatusMeta[product.sync_status].label}
                  </Badge>
                  <Badge variant={matchStatusMeta[product.match_status].tone}>{matchStatusMeta[product.match_status].label}</Badge>
                </div>
              </div>
            </div>

            {product.errors.length > 0 && (
              <div className="rounded-xl border border-danger/25 bg-danger-soft/60 p-3">
                <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-danger">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  خطای همگام‌سازی
                </p>
                <ul className="mt-1.5 space-y-1">
                  {product.errors.map((error) => (
                    <li key={error} className="text-[11px] leading-5 text-foreground/80">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-border bg-muted/25 px-3 py-1">
              <InfoRow label="شماره محصول در اسنپ‌شاپ" value={product.product_number ?? '—'} />
              <InfoRow label="دسته‌بندی" value={product.category} />
              <InfoRow label="منبع موجودی" value={product.stock_source === 'woocommerce' ? 'ووکامرس' : product.stock_source === 'snappshop' ? 'اسنپ‌شاپ' : 'دستی'} />
              <InfoRow label="آخرین به‌روزرسانی" value={<span title={formatDateTime(product.last_updated)}>{formatRelative(product.last_updated)}</span>} />
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                مقایسه قیمت و موجودی
              </h4>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-[11.5px]">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">مورد</th>
                      <th className="px-3 py-2 text-end font-medium">ووکامرس</th>
                      <th className="px-3 py-2 text-end font-medium">اسنپ‌شاپ</th>
                      <th className="px-3 py-2 text-end font-medium">مغایرت</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/60">
                      <td className="px-3 py-2 text-muted-foreground">قیمت</td>
                      <td className="num px-3 py-2 text-end text-foreground">{formatToman(product.wc_price)}</td>
                      <td className="num px-3 py-2 text-end text-foreground">{formatToman(product.snapp_price)}</td>
                      <td className="num px-3 py-2 text-end">
                        {product.snapp_price === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className={cn(product.snapp_price === product.wc_price ? 'text-muted-foreground' : 'text-warning')}>
                            {product.snapp_price === product.wc_price
                              ? 'بدون اختلاف'
                              : `${formatNumber(product.snapp_price - product.wc_price)} تومان`}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr className="border-t border-border/60">
                      <td className="px-3 py-2 text-muted-foreground">موجودی</td>
                      <td className="num px-3 py-2 text-end text-foreground">{formatNumber(product.wc_stock)}</td>
                      <td className="num px-3 py-2 text-end text-foreground">{product.snapp_stock === null ? '—' : formatNumber(product.snapp_stock)}</td>
                      <td className="num px-3 py-2 text-end">
                        {product.snapp_stock === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : product.snapp_stock === product.wc_stock ? (
                          <span className="text-muted-foreground">بدون اختلاف</span>
                        ) : (
                          <span className="text-warning">{formatNumber(product.snapp_stock - product.wc_stock)}</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  تنوع‌های محصول ({formatNumber(product.variants.length)})
                </h4>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-[11px]">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-2.5 py-2 text-start font-medium">تنوع</th>
                        <th className="px-2.5 py-2 text-start font-medium">SKU</th>
                        <th className="px-2.5 py-2 text-end font-medium">قیمت</th>
                        <th className="px-2.5 py-2 text-end font-medium">موجودی</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="border-t border-border/60">
                          <td className="px-2.5 py-1.5 text-foreground">{variant.name}</td>
                          <td className="px-2.5 py-1.5 text-muted-foreground">{variant.sku}</td>
                          <td className="num px-2.5 py-1.5 text-end text-foreground">{formatNumber(variant.wc_price)}</td>
                          <td className="num px-2.5 py-1.5 text-end text-foreground">{formatNumber(variant.wc_stock)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                ویرایش قیمت و موجودی
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="قیمت ووکامرس (تومان)" hint="مبلغ به تومان ذخیره می‌شود؛ تبدیل واحد انجام نمی‌شود.">
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="num"
                  />
                </Field>
                <Field label="موجودی ووکامرس" hint={`مقدار فعلی: ${formatNumber(product.wc_stock)} عدد`}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    className="num"
                  />
                </Field>
              </div>

              {dirty && (
                <div className="mt-3 rounded-xl border border-primary/20 bg-primary-soft/40 p-3 text-[11px] leading-6">
                  <p className="font-medium text-foreground">پیش‌نمایش تغییرات</p>
                  {priceDirty && (
                    <p className="mt-1 text-muted-foreground">
                      قیمت: <span className="num">{formatToman(product.wc_price)}</span> ←{' '}
                      <span className="num font-medium text-foreground">{formatToman(nextPrice)}</span>{' '}
                      <span className="text-primary">({pricePercent})</span>
                    </p>
                  )}
                  {stockDirty && (
                    <p className="mt-0.5 text-muted-foreground">
                      موجودی: <span className="num">{formatNumber(product.wc_stock)}</span> ←{' '}
                      <span className="num font-medium text-foreground">{formatNumber(nextStock)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                تاریخچه قیمت
              </h4>
              <div className="space-y-2">
                {history && history.length > 0 ? (
                  history.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-2.5 py-2 text-[11px]">
                      <div className="min-w-0">
                        <p className="num text-foreground">
                          {formatNumber(entry.from_price)} ← {formatNumber(entry.to_price)} تومان
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {entry.actor} • {formatRelative(entry.created_at)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {entry.source === 'manual' ? 'دستی' : entry.source === 'bulk' ? 'گروهی' : entry.source === 'automation' ? 'اتوماسیون' : 'همگام‌سازی'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">
                    تاریخچه‌ای برای این محصول ثبت نشده است.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={save}
        loading={updateProduct.isPending}
        tone="primary"
        title="تأیید تغییرات محصول"
        confirmLabel="ذخیره و اعمال"
        description={
          product && (
            <div className="space-y-1.5">
              <p>تغییرات زیر پس از تأیید ذخیره می‌شوند:</p>
              {priceDirty && (
                <p>
                  قیمت: <span className="num">{formatToman(product.wc_price)}</span> ←{' '}
                  <span className="num font-medium text-foreground">{formatToman(nextPrice)}</span>
                </p>
              )}
              {stockDirty && (
                <p>
                  موجودی: <span className="num">{formatNumber(product.wc_stock)}</span> ←{' '}
                  <span className="num font-medium text-foreground">{formatNumber(nextStock)}</span>
                </p>
              )}
            </div>
          )
        }
      />
    </>
  )
}
