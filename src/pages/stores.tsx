import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Plug, RefreshCw, Settings2, Store as StoreIcon, WifiOff } from 'lucide-react'
import type { Store } from '@/api/types'
import { useCheckStore, useStores } from '@/api/hooks'
import { usePreferences } from '@/app/preferences'
import { formatDateTime, formatNumber, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Drawer } from '@/components/ui/drawer'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Modal } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreMark } from '@/components/ui/product-thumb'
import { useToast } from '@/components/ui/toast'

const connectionMeta = {
  connected: { label: 'متصل', variant: 'success' as const, icon: CheckCircle2 },
  disconnected: { label: 'قطع', variant: 'neutral' as const, icon: WifiOff },
  error: { label: 'خطا', variant: 'danger' as const, icon: AlertTriangle },
}

function StoreCard({ store, onDetails }: { store: Store; onDetails: () => void }) {
  const check = useCheckStore()
  const { preferences, setPreference } = usePreferences()
  const { toast } = useToast()
  const meta = connectionMeta[store.status]
  const Icon = meta.icon
  const isActive = preferences.activeStoreId === store.id

  return (
    <Card className={cn('flex flex-col overflow-hidden', isActive && 'ring-1 ring-primary/30')}>
      <div className="flex items-start gap-3 p-4">
        <StoreMark name={store.name} className="h-10 w-10 text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-semibold text-foreground">{store.name}</p>
            {store.is_default && <Badge variant="primary">پیش‌فرض</Badge>}
            {isActive && <Badge variant="outline">فعال در پنل</Badge>}
          </div>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">
            شناسه فروشگاه: <span className="num">{store.vendor_id}</span> • {store.code}
          </p>
        </div>
        <Badge variant={meta.variant} dot>
          {meta.label}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
          <p className="text-[9.5px] text-muted-foreground">محصولات</p>
          <p className="num mt-0.5 text-[12px] font-medium text-foreground">{formatNumber(store.products_count)}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
          <p className="text-[9.5px] text-muted-foreground">سفارش‌ها</p>
          <p className="num mt-0.5 text-[12px] font-medium text-foreground">{formatNumber(store.orders_count)}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
          <p className="text-[9.5px] text-muted-foreground">آخرین ارتباط</p>
          <p className="mt-0.5 text-[11px] text-foreground">{store.last_connection ? formatRelative(store.last_connection) : '—'}</p>
        </div>
      </div>

      <div className="space-y-1 border-t border-border/70 px-4 py-2.5 text-[10.5px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">همگام‌سازی خودکار</span>
          <span className="text-foreground">
            {store.settings.auto_sync ? `فعال — هر ${formatNumber(store.settings.sync_interval_minutes)} دقیقه` : 'غیرفعال'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">منبع موجودی</span>
          <span className="text-foreground">{store.settings.stock_source === 'woocommerce' ? 'ووکامرس' : 'اسنپ‌شاپ'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">افزایش قیمت</span>
          <span className="num text-foreground">{formatNumber(store.settings.price_markup_percent)}٪</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Icon className="h-3 w-3" />
          وضعیت همگام‌سازی: {store.sync_status === 'running' ? 'در حال اجرا' : store.sync_status === 'error' ? 'خطا' : 'آماده'}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[10.5px]"
            loading={check.isPending}
            startIcon={<Plug className="h-3 w-3" />}
            onClick={() =>
              check.mutate(store.id, {
                onSuccess: (result) =>
                  toast({
                    title: result.ok ? 'اتصال برقرار است' : 'اتصال برقرار نشد',
                    description: result.message,
                    variant: result.ok ? 'success' : 'error',
                  }),
                onError: (error) => toast({ title: 'بررسی اتصال ناموفق بود', description: (error as Error).message, variant: 'error' }),
              })
            }
          >
            بررسی اتصال
          </Button>
          {!isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10.5px]"
              onClick={() => {
                setPreference('activeStoreId', store.id)
                toast({ title: 'فروشگاه فعال تغییر کرد', description: store.name, variant: 'info' })
              }}
            >
              انتخاب
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10.5px]" onClick={onDetails}>
            جزئیات
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function StoresPage() {
  const { data: stores, isLoading, isError, error, refetch } = useStores()
  const [detail, setDetail] = useState<Store | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="مدیریت فروشگاه‌ها"
        description="فروشگاه‌های اسنپ‌شاپ متصل به افزونه، وضعیت اتصال و تنظیمات اختصاصی هر فروشگاه."
        actions={
          <>
            <Button variant="outline" size="sm" startIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => refetch()}>
              به‌روزرسانی
            </Button>
            <Button variant="primary" size="sm" startIcon={<Plug className="h-3.5 w-3.5" />} onClick={() => setConnectOpen(true)}>
              افزودن فروشگاه
            </Button>
          </>
        }
      />

      {isError ? (
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      ) : isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[260px] w-full" />
          ))}
        </div>
      ) : stores && stores.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} onDetails={() => setDetail(store)} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={StoreIcon}
            title="فروشگاهی متصل نیست"
            description="برای شروع، فروشگاه اسنپ‌شاپ خود را از طریق افزونه وردپرس متصل کنید."
            action={<Button variant="primary" size="sm" onClick={() => setConnectOpen(true)}>راهنمای اتصال</Button>}
          />
        </Card>
      )}

      <Card className="mt-3 p-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <div className="text-[10.5px] leading-5 text-muted-foreground">
            توکن دسترسی اسنپ‌شاپ هرگز در رابط کاربری نمایش داده نمی‌شود و فقط در بک‌اند افزونه نگهداری می‌شود. تمام ارتباطات با REST API
            وردپرس همراه با Nonce انجام می‌شود.
          </div>
        </div>
      </Card>

      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? 'جزئیات فروشگاه'}
        description={detail ? `شناسه فروشگاه ${detail.vendor_id}` : undefined}
        footer={
          detail && (
            <>
              <span className="text-[10px] text-muted-foreground">
                آخرین ارتباط: {detail.last_connection ? formatDateTime(detail.last_connection) : '—'}
              </span>
              <Button variant="outline" size="sm" onClick={() => setDetail(null)}>
                بستن
              </Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <Badge variant={connectionMeta[detail.status].variant} dot>
                {connectionMeta[detail.status].label}
              </Badge>
              <span className="text-[10.5px] text-muted-foreground">کد فروشگاه: {detail.code}</span>
            </div>

            <div className="rounded-xl border border-border px-3 py-1">
              {[
                ['شناسه فروشگاه (vendor)', detail.vendor_id],
                ['تعداد محصولات', formatNumber(detail.products_count)],
                ['تعداد سفارش‌ها', formatNumber(detail.orders_count)],
                ['آخرین ارتباط', detail.last_connection ? formatDateTime(detail.last_connection) : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-border/60 py-2 text-[11.5px] last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="num text-foreground">{value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-foreground">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                تنظیمات اختصاصی فروشگاه
              </p>
              <div className="space-y-2 rounded-xl border border-border p-3 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">منبع اصلی موجودی</span>
                  <span className="text-foreground">{detail.settings.stock_source === 'woocommerce' ? 'ووکامرس' : 'اسنپ‌شاپ'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">همگام‌سازی خودکار</span>
                  <Badge variant={detail.settings.auto_sync ? 'success' : 'neutral'}>{detail.settings.auto_sync ? 'فعال' : 'غیرفعال'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">فاصله همگام‌سازی</span>
                  <span className="num text-foreground">هر {formatNumber(detail.settings.sync_interval_minutes)} دقیقه</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">افزایش قیمت</span>
                  <span className="num text-foreground">{formatNumber(detail.settings.price_markup_percent)}٪</span>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                تنظیمات فروشگاه از API خوانده می‌شود؛ ویرایش آن‌ها از طریق صفحهٔ تنظیمات افزونه انجام می‌گیرد.
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
                <span>وضعیت همگام‌سازی</span>
                <span>{detail.sync_status === 'running' ? 'در حال اجرا' : detail.sync_status === 'error' ? 'خطا' : 'آماده'}</span>
              </div>
              <Progress value={detail.sync_status === 'running' ? 62 : detail.sync_status === 'error' ? 100 : 100} tone={detail.sync_status === 'error' ? 'danger' : detail.sync_status === 'running' ? 'info' : 'success'} />
              <Link to="/sync" className="mt-2 flex items-center gap-1 text-[10.5px] text-primary hover:underline">
                <Clock className="h-3 w-3" />
                مشاهده مرکز همگام‌سازی
              </Link>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        title="افزودن فروشگاه جدید"
        description="اتصال فروشگاه نیازمند تأیید اعتبار در بک‌اند افزونه است."
        footer={
          <>
            <Button variant="outline" onClick={() => setConnectOpen(false)}>
              بستن
            </Button>
            <Link to="/settings?tab=connection">
              <Button variant="primary">رفتن به تنظیمات اتصال</Button>
            </Link>
          </>
        }
      >
        <div className="space-y-3 text-[11.5px] leading-6 text-muted-foreground">
          <p>
            افزودن فروشگاه جدید با استفاده از شناسهٔ فروشنده و توکن دسترسی انجام می‌شود. به دلایل امنیتی، توکن فقط در بک‌اند افزونه
            ذخیره می‌شود و در رابط کاربری نگهداری یا نمایش داده نمی‌شود.
          </p>
          <div className="rounded-xl border border-warning/25 bg-warning-soft/50 px-3 py-2.5 text-[10.5px] leading-5">
            در مستندات فعلی، endpoint اتصال فروشگاه (POST /stores) ارائه نشده است؛ بنابراین فرم اتصال در این نسخه غیرفعال است و در گزارش
            Integration Gap ثبت شده است.
          </div>
          <p>برای اتصال، از صفحهٔ تنظیمات افزونه در وردپرس استفاده کنید یا مستندات API را برای فعال‌سازی این فرم در اختیار تیم فرانت‌اند قرار دهید.</p>
        </div>
      </Modal>
    </div>
  )
}
