import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  Boxes,
  CircleDollarSign,
  Cpu,
  Database,
  Globe,
  KeyRound,
  Plug,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Store,
  Workflow,
} from 'lucide-react'
import type { SettingsPayload } from '@/api/types'
import { useCheckStore, useSaveSettings, useSettings, useStores } from '@/api/hooks'
import { usePreferences } from '@/app/preferences'
import { formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox, Switch } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/empty-state'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'

type Group = keyof SettingsPayload

const tabs = [
  { value: 'general', label: 'عمومی', icon: Settings2 },
  { value: 'connection', label: 'اتصال', icon: Plug },
  { value: 'stores', label: 'فروشگاه‌ها', icon: Store },
  { value: 'sync', label: 'همگام‌سازی', icon: Database },
  { value: 'products', label: 'محصولات', icon: Boxes },
  { value: 'inventory', label: 'موجودی', icon: Boxes },
  { value: 'pricing', label: 'قیمت‌گذاری', icon: CircleDollarSign },
  { value: 'automation', label: 'اتوماسیون', icon: Workflow },
  { value: 'jobs', label: 'Jobها', icon: Cpu },
  { value: 'notifications', label: 'اعلان‌ها', icon: Bell },
  { value: 'security', label: 'امنیت', icon: ShieldCheck },
  { value: 'advanced', label: 'پیشرفته', icon: KeyRound },
]

function Section({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{description}</p>}
        </div>
      </CardHeader>
      <div className="space-y-4 p-4">{children}</div>
      {footer && <div className="border-t border-border px-4 py-2.5">{footer}</div>}
    </Card>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
      <div>
        <p className="text-[11.5px] font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-[10px] leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  )
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const { preferences, setPreference } = usePreferences()
  const { data, isLoading, isError, error, refetch } = useSettings()
  const { data: stores } = useStores()
  const save = useSaveSettings()
  const check = useCheckStore()
  const { toast } = useToast()
  const [draft, setDraft] = useState<SettingsPayload | null>(null)
  const [confirmRisky, setConfirmRisky] = useState(false)

  const tab = params.get('tab') ?? 'general'

  useEffect(() => {
    if (data) setDraft(data ? structuredClone(data) : null)
  }, [data])

  const setField = (group: Group, key: string, value: unknown) => {
    setDraft((prev) => (prev ? ({ ...prev, [group]: { ...prev[group], [key]: value } } as SettingsPayload) : prev))
  }

  const errors = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {}
    if (!draft) return result
    if (!draft.general.business_name.trim()) result['general.business_name'] = 'نام کسب‌وکار الزامی است.'
    if (draft.connection.api_base_url && !/^https?:\/\/.+/.test(draft.connection.api_base_url)) {
      result['connection.api_base_url'] = 'آدرس باید با http:// یا https:// شروع شود.'
    }
    if (draft.sync.interval_minutes < 5) result['sync.interval_minutes'] = 'حداقل ۵ دقیقه.'
    if (draft.sync.batch_size < 1 || draft.sync.batch_size > 200) result['sync.batch_size'] = 'بین ۱ تا ۲۰۰.'
    if (draft.jobs.concurrency < 1 || draft.jobs.concurrency > 10) result['jobs.concurrency'] = 'بین ۱ تا ۱۰.'
    if (draft.jobs.retry_attempts < 0 || draft.jobs.retry_attempts > 10) result['jobs.retry_attempts'] = 'بین ۰ تا ۱۰.'
    if (draft.jobs.retry_delay_seconds < 10) result['jobs.retry_delay_seconds'] = 'حداقل ۱۰ ثانیه.'
    if (draft.jobs.log_retention_days < 1 || draft.jobs.log_retention_days > 365) result['jobs.log_retention_days'] = 'بین ۱ تا ۳۶۵ روز.'
    if (draft.pricing.round_to < 1) result['pricing.round_to'] = 'باید بزرگ‌تر از صفر باشد.'
    if (draft.pricing.max_markup_percent < 0 || draft.pricing.max_markup_percent > 100) result['pricing.max_markup_percent'] = 'بین ۰ تا ۱۰۰ درصد.'
    if (draft.inventory.low_stock_threshold < 0) result['inventory.low_stock_threshold'] = 'نباید منفی باشد.'
    if (draft.automation.max_daily_runs < 1 || draft.automation.max_daily_runs > 1000) result['automation.max_daily_runs'] = 'بین ۱ تا ۱۰۰۰.'
    if (draft.notifications.email_enabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.notifications.email_address)) {
      result['notifications.email_address'] = 'ایمیل معتبر نیست.'
    }
    return result
  }, [draft])

  const dirty = useMemo(() => Boolean(draft && data && JSON.stringify(draft) !== JSON.stringify(data)), [draft, data])
  const hasErrors = Object.keys(errors).length > 0

  const riskyChanges = useMemo(() => {
    if (!draft || !data) return [] as string[]
    const items: string[] = []
    if (data.sync.auto_sync && !draft.sync.auto_sync) items.push('خاموش کردن همگام‌سازی خودکار')
    if (!data.advanced.debug_mode && draft.advanced.debug_mode) items.push('فعال کردن حالت دیباگ')
    if (!data.advanced.clear_logs_on_deactivate && draft.advanced.clear_logs_on_deactivate)
      items.push('پاک کردن لاگ‌ها هنگام غیرفعال‌سازی افزونه')
    if (data.security.log_ip_address && !draft.security.log_ip_address) items.push('غیرفعال کردن ثبت IP')
    return items
  }, [draft, data])

  const performSave = () => {
    if (!draft) return
    save.mutate(draft, {
      onSuccess: () => {
        toast({ title: 'تنظیمات ذخیره شد', description: 'تغییرات با موفقیت در افزونه ثبت شد.', variant: 'success' })
        setConfirmRisky(false)
        if (draft.general.date_display !== preferences.dateDisplay) setPreference('dateDisplay', draft.general.date_display)
        if (draft.general.number_display !== preferences.numberDisplay) setPreference('numberDisplay', draft.general.number_display)
      },
      onError: (mutationError) => {
        setConfirmRisky(false)
        toast({ title: 'ذخیره ناموفق بود', description: (mutationError as Error).message, variant: 'error' })
      },
    })
  }

  const requestSave = () => {
    if (!dirty || hasErrors) return
    if (riskyChanges.length > 0) setConfirmRisky(true)
    else performSave()
  }

  if (isError) {
    return (
      <Card>
        <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
      </Card>
    )
  }

  if (isLoading || !draft) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up pb-20">
      <PageHeader
        title="تنظیمات"
        description="پیکربندی اتصال، همگام‌سازی، قیمت‌گذاری، اتوماسیون و امنیت افزونه. همهٔ مقادیر از API خوانده و ذخیره می‌شوند."
        badge={dirty ? <Badge variant="warning" dot>تغییرات ذخیره‌نشده</Badge> : <Badge variant="success" dot>همگام با سرور</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" startIcon={<RotateCcw className="h-3.5 w-3.5" />} disabled={!dirty} onClick={() => setDraft(data ? structuredClone(data) : null)}>
              بازنشانی تغییرات
            </Button>
            <Button variant="primary" size="sm" startIcon={<Save className="h-3.5 w-3.5" />} disabled={!dirty || hasErrors} loading={save.isPending} onClick={requestSave}>
              ذخیره تنظیمات
            </Button>
          </>
        }
      />

      <div className="mb-3 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={(value) => {
            const next = new URLSearchParams(params)
            next.set('tab', value)
            setParams(next, { replace: true })
          }}
          tabs={tabs.map((item) => ({ label: item.label, value: item.value }))}
        />
      </div>

      {hasErrors && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[11px] text-danger">
          <AlertTriangle className="h-3.5 w-3.5" />
          {formatNumber(Object.keys(errors).length)} مقدار نامعتبر است؛ تا اصلاح آن‌ها ذخیره ممکن نیست.
        </div>
      )}

      {tab === 'general' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Section title="اطلاعات کسب‌وکار" description="این اطلاعات در سربرگ گزارش‌ها و اعلان‌ها استفاده می‌شود.">
            <Field label="نام کسب‌وکار" required error={errors['general.business_name']}>
              <Input value={draft.general.business_name} onChange={(event) => setField('general', 'business_name', event.target.value)} />
            </Field>
            <Field label="واحد پول" hint="قیمت‌ها همیشه به تومان نمایش داده می‌شوند؛ تبدیل ریال فقط در بک‌اند انجام می‌شود.">
              <Select value={draft.general.currency_unit} disabled>
                <option value="toman">تومان</option>
              </Select>
            </Field>
            <Field label="فروشگاه پیش‌فرض" hint="با باز شدن پنل، این فروشگاه انتخاب می‌شود.">
              <Select
                value={String(draft.general.default_store_id)}
                onChange={(event) => setField('general', 'default_store_id', Number(event.target.value))}
              >
                {(stores ?? []).map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </Select>
            </Field>
          </Section>

          <Section title="نمایش تاریخ و اعداد" description="این تنظیمات در سمت کاربر نیز قابل تغییر است و روی نمایش تأثیر می‌گذارد.">
            <Field label="تقویم نمایش" hint="تاریخ ارسالی به API همیشه استاندارد میلادی (ISO) است.">
              <Select value={draft.general.date_display} onChange={(event) => setField('general', 'date_display', event.target.value)}>
                <option value="jalali">شمسی</option>
                <option value="gregorian">میلادی</option>
              </Select>
            </Field>
            <Field label="نمایش اعداد">
              <Select value={draft.general.number_display} onChange={(event) => setField('general', 'number_display', event.target.value)}>
                <option value="fa">فارسی (۱۲۳)</option>
                <option value="en">لاتین (123)</option>
              </Select>
            </Field>
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-[10px] leading-5 text-muted-foreground">
              مقادیر پولی به صورت عدد صحیح تومان ذخیره می‌شوند و هیچ تبدیل واحدی در فرانت‌اند انجام نمی‌شود.
            </div>
          </Section>
        </div>
      )}

      {tab === 'connection' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Section
            title="اتصال به اسنپ‌شاپ"
            description="تنظیمات پایهٔ ارتباط با API اسنپ‌شاپ که توسط افزونه استفاده می‌شود."
            footer={
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  آخرین بررسی: {draft.connection.last_checked_at ? formatDateTime(draft.connection.last_checked_at) : '—'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  loading={check.isPending}
                  onClick={() =>
                    check.mutate(preferences.activeStoreId, {
                      onSuccess: (result) =>
                        toast({ title: result.ok ? 'اتصال برقرار است' : 'اتصال برقرار نشد', description: result.message, variant: result.ok ? 'success' : 'error' }),
                      onError: (mutationError) => toast({ title: 'بررسی ناموفق بود', description: (mutationError as Error).message, variant: 'error' }),
                    })
                  }
                >
                  بررسی اتصال
                </Button>
              </div>
            }
          >
            <Field label="آدرس پایه API" error={errors['connection.api_base_url']} hint="آدرس باید با HTTPS باشد.">
              <Input dir="ltr" value={draft.connection.api_base_url} onChange={(event) => setField('connection', 'api_base_url', event.target.value)} />
            </Field>
            <Field label="زمان انتظار درخواست (ثانیه)" hint="بین ۵ تا ۱۲۰ ثانیه.">
              <Input
                type="number"
                min={5}
                max={120}
                value={draft.connection.timeout_seconds}
                onChange={(event) => setField('connection', 'timeout_seconds', Number(event.target.value))}
                className="num"
              />
            </Field>
            <ToggleRow
              label="بررسی گواهی SSL"
              description="در محیط تولید باید فعال بماند. غیرفعال کردن آن امنیت ارتباط را کاهش می‌دهد."
              checked={draft.connection.verify_ssl}
              onChange={(value) => setField('connection', 'verify_ssl', value)}
            />
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[10px] leading-5 text-muted-foreground">
              توکن دسترسی اسنپ‌شاپ در فرانت‌اند ذخیره نمی‌شود؛ فقط افزونه آن را می‌خواند و درخواست‌های این پنل با Nonce وردپرس تأیید
              می‌شوند.
            </div>
          </Section>

          <Section title="دسترسی وردپرس" description="مبنای احراز هویت، نشست وردپرس و REST Nonce است.">
            <div className="space-y-2 rounded-lg border border-border/70 px-3 py-2.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">مسیر REST</span>
                <span dir="ltr" className="font-mono text-[10px] text-foreground">
                  /wp-json/snappshop-automation/v1/
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">احراز هویت</span>
                <span className="text-foreground">کوکی وردپرس + X-WP-Nonce</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">نقش‌های مجاز</span>
                <span className="text-foreground">{draft.security.allowed_roles.join('، ')}</span>
              </div>
            </div>
            <p className="text-[10px] leading-5 text-muted-foreground">
              دسترسی کاربران توسط افزونه بررسی می‌شود؛ این پنل درخواستی خارج از مجوزهای کاربر ارسال نمی‌کند.
            </p>
          </Section>
        </div>
      )}

      {tab === 'stores' && (
        <Section title="تنظیمات فروشگاه‌ها" description="هر فروشگاه تنظیمات مستقل خود را دارد: منبع موجودی، همگام‌سازی خودکار و افزایش قیمت.">
          <div className="grid gap-2 sm:grid-cols-2">
            {(stores ?? []).map((store) => (
              <div key={store.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11.5px] font-medium text-foreground">{store.name}</p>
                  <Badge variant={store.status === 'connected' ? 'success' : store.status === 'error' ? 'danger' : 'neutral'} dot>
                    {store.status === 'connected' ? 'متصل' : store.status === 'error' ? 'خطا' : 'قطع'}
                  </Badge>
                </div>
                <p className="num mt-1 text-[10px] text-muted-foreground">شناسه: {store.vendor_id}</p>
                <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                  <p>منبع موجودی: {store.settings.stock_source === 'woocommerce' ? 'ووکامرس' : 'اسنپ‌شاپ'}</p>
                  <p>همگام‌سازی: {store.settings.auto_sync ? `هر ${formatNumber(store.settings.sync_interval_minutes)} دقیقه` : 'غیرفعال'}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/stores" className="inline-flex text-[11px] text-primary hover:underline">
            مدیریت و بررسی اتصال فروشگاه‌ها
          </Link>
          <p className="text-[10px] leading-5 text-muted-foreground">
            ویرایش تنظیمات هر فروشگاه از طریق صفحهٔ فروشگاه‌ها و endpoint اختصاصی آن انجام می‌شود؛ در این نسخه فرم ویرایش فروشگاه
            در مستندات API موجود نیست.
          </p>
        </Section>
      )}

      {tab === 'sync' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Section title="زمان‌بندی همگام‌سازی" description="کنترل اجرای خودکار و حجم دسته‌های ارسالی.">
            <ToggleRow
              label="همگام‌سازی خودکار"
              description="اجرای منظم همگام‌سازی بر اساس بازهٔ تعیین‌شده."
              checked={draft.sync.auto_sync}
              onChange={(value) => setField('sync', 'auto_sync', value)}
            />
            <Field label="فاصلهٔ همگام‌سازی (دقیقه)" error={errors['sync.interval_minutes']} hint="حداقل ۵ دقیقه.">
              <Input
                type="number"
                min={5}
                value={draft.sync.interval_minutes}
                onChange={(event) => setField('sync', 'interval_minutes', Number(event.target.value))}
                className="num"
              />
            </Field>
            <Field label="اندازهٔ دسته (Batch)" error={errors['sync.batch_size']} hint="بین ۱ تا ۲۰۰ آیتم در هر درخواست.">
              <Input
                type="number"
                min={1}
                max={200}
                value={draft.sync.batch_size}
                onChange={(event) => setField('sync', 'batch_size', Number(event.target.value))}
                className="num"
              />
            </Field>
          </Section>

          <Section title="دامنهٔ همگام‌سازی" description="انتخاب اینکه چه داده‌هایی همگام شوند.">
            <ToggleRow
              label="محصولات"
              description="ایجاد و به‌روزرسانی محصولات در اسنپ‌شاپ."
              checked={draft.sync.sync_products}
              onChange={(value) => setField('sync', 'sync_products', value)}
            />
            <ToggleRow
              label="قیمت‌ها"
              description="ارسال قیمت‌های ووکامرس به اسنپ‌شاپ."
              checked={draft.sync.sync_prices}
              onChange={(value) => setField('sync', 'sync_prices', value)}
            />
            <ToggleRow
              label="موجودی"
              description="به‌روزرسانی موجودی بر اساس منبع تعیین‌شده."
              checked={draft.sync.sync_stock}
              onChange={(value) => setField('sync', 'sync_stock', value)}
            />
            <ToggleRow
              label="سفارش‌ها"
              description="دریافت سفارش‌های جدید از اسنپ‌شاپ."
              checked={draft.sync.sync_orders}
              onChange={(value) => setField('sync', 'sync_orders', value)}
            />
            <Field label="سیاست حل تعارض" hint="در صورت اختلاف مقدار بین دو سیستم، کدام منبع معتبر است.">
              <Select value={draft.sync.conflict_policy} onChange={(event) => setField('sync', 'conflict_policy', event.target.value)}>
                <option value="woocommerce">ووکامرس معتبر باشد</option>
                <option value="snappshop">اسنپ‌شاپ معتبر باشد</option>
                <option value="newest">جدیدترین تغییر معتبر باشد</option>
              </Select>
            </Field>
          </Section>
        </div>
      )}

      {tab === 'products' && (
        <Section title="تنظیمات محصولات" description="رفتار پیش‌فرض ایجاد و همگام‌سازی محصولات.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="دسته‌بندی پیش‌فرض">
              <Input value={draft.products.default_category} onChange={(event) => setField('products', 'default_category', event.target.value)} />
            </Field>
          </div>
          <ToggleRow
            label="انتشار خودکار محصولات جدید"
            description="محصولات جدید پس از ساخت، بلافاصله در اسنپ‌شاپ منتشر شوند."
            checked={draft.products.auto_publish}
            onChange={(value) => setField('products', 'auto_publish', value)}
          />
          <ToggleRow
            label="رد کردن محصولات بدون SKU"
            description="از ارسال محصولاتی که SKU ندارند جلوگیری می‌کند."
            checked={draft.products.skip_missing_sku}
            onChange={(value) => setField('products', 'skip_missing_sku', value)}
          />
          <ToggleRow
            label="همگام‌سازی تصاویر"
            description="تصاویر محصولات نیز به اسنپ‌شاپ ارسال شوند."
            checked={draft.products.image_sync}
            onChange={(value) => setField('products', 'image_sync', value)}
          />
        </Section>
      )}

      {tab === 'inventory' && (
        <Section title="تنظیمات موجودی" description="منبع معتبر موجودی و آستانه‌های هشدار.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="منبع اصلی موجودی" hint="مقدار موجودی همیشه از این منبع بازنویسی می‌شود.">
              <Select value={draft.inventory.stock_source} onChange={(event) => setField('inventory', 'stock_source', event.target.value)}>
                <option value="woocommerce">ووکامرس</option>
                <option value="snappshop">اسنپ‌شاپ</option>
              </Select>
            </Field>
            <Field label="آستانهٔ موجودی کم" error={errors['inventory.low_stock_threshold']}>
              <Input
                type="number"
                min={0}
                value={draft.inventory.low_stock_threshold}
                onChange={(event) => setField('inventory', 'low_stock_threshold', Number(event.target.value))}
                className="num"
              />
            </Field>
          </div>
          <ToggleRow
            label="مسدودسازی فروش موجودی صفر"
            description="محصولات با موجودی صفر در اسنپ‌شاپ ناموجود شوند."
            checked={draft.inventory.block_zero_stock}
            onChange={(value) => setField('inventory', 'block_zero_stock', value)}
          />
        </Section>
      )}

      {tab === 'pricing' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Section title="قواعد قیمت‌گذاری" description="گرد کردن و محدودیت‌های قیمت که در همهٔ عملیات گروهی اعمال می‌شوند.">
            <Field label="رند کردن به (تومان)" error={errors['pricing.round_to']} hint="قیمت نهایی به مضربی از این عدد گرد می‌شود.">
              <Input
                type="number"
                min={1}
                value={draft.pricing.round_to}
                onChange={(event) => setField('pricing', 'round_to', Number(event.target.value))}
                className="num"
              />
            </Field>
            <Field label="حداقل قیمت مجاز (تومان)" hint="قیمت کم‌تر از این مقدار ارسال نمی‌شود.">
              <Input
                type="number"
                min={0}
                value={draft.pricing.min_price}
                onChange={(event) => setField('pricing', 'min_price', Number(event.target.value))}
                className="num"
              />
            </Field>
            <Field label="حداکثر افزایش مجاز (درصد)" error={errors['pricing.max_markup_percent']}>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.pricing.max_markup_percent}
                onChange={(event) => setField('pricing', 'max_markup_percent', Number(event.target.value))}
                className="num"
              />
            </Field>
          </Section>
          <Section title="همگام‌سازی قیمت" description="ارسال قیمت‌ها پس از هر تغییر.">
            <ToggleRow
              label="ارسال خودکار قیمت‌ها"
              description="پس از هر ویرایش قیمت، تغییر به اسنپ‌شاپ ارسال شود."
              checked={draft.pricing.price_sync_enabled}
              onChange={(value) => setField('pricing', 'price_sync_enabled', value)}
            />
            <div className="rounded-lg border border-info/20 bg-info-soft/40 px-3 py-2 text-[10px] leading-5 text-muted-foreground">
              مبالغ در پنل به تومان نمایش داده می‌شوند. اگر API ووکامرس مبلغ را IRR گزارش کند، تبدیل واحد فقط در بک‌اند انجام می‌شود.
            </div>
          </Section>
        </div>
      )}

      {tab === 'automation' && (
        <Section
          title="تنظیمات اتوماسیون"
          description="محدودیت اجرای قوانین خودکار"
          footer={
            <Link to="/automation" className="text-[11px] text-primary hover:underline">
              مدیریت قوانین اتوماسیون
            </Link>
          }
        >
          <ToggleRow
            label="فعال بودن موتور اتوماسیون"
            description="در صورت غیرفعال بودن، هیچ قانونی اجرا نمی‌شود."
            checked={draft.automation.enabled}
            onChange={(value) => setField('automation', 'enabled', value)}
          />
          <ToggleRow
            label="اعلان در صورت شکست"
            description="وقتی اجرای یک قانون ناموفق باشد اعلان ارسال شود."
            checked={draft.automation.notify_on_failure}
            onChange={(value) => setField('automation', 'notify_on_failure', value)}
          />
          <Field label="حداکثر اجرا در روز" error={errors['automation.max_daily_runs']} hint="برای جلوگیری از حلقهٔ اجرای بی‌پایان.">
            <Input
              type="number"
              min={1}
              max={1000}
              value={draft.automation.max_daily_runs}
              onChange={(event) => setField('automation', 'max_daily_runs', Number(event.target.value))}
              className="num"
            />
          </Field>
        </Section>
      )}

      {tab === 'jobs' && (
        <Section title="تنظیمات پردازش‌های پس‌زمینه" description="هم‌زمانی، تلاش مجدد و نگهداری لاگ‌ها.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="تعداد Job هم‌زمان" error={errors['jobs.concurrency']} hint="بین ۱ تا ۱۰.">
              <Input
                type="number"
                min={1}
                max={10}
                value={draft.jobs.concurrency}
                onChange={(event) => setField('jobs', 'concurrency', Number(event.target.value))}
                className="num"
              />
            </Field>
            <Field label="تعداد تلاش مجدد" error={errors['jobs.retry_attempts']}>
              <Input
                type="number"
                min={0}
                max={10}
                value={draft.jobs.retry_attempts}
                onChange={(event) => setField('jobs', 'retry_attempts', Number(event.target.value))}
                className="num"
              />
            </Field>
            <Field label="فاصلهٔ تلاش مجدد (ثانیه)" error={errors['jobs.retry_delay_seconds']}>
              <Input
                type="number"
                min={10}
                value={draft.jobs.retry_delay_seconds}
                onChange={(event) => setField('jobs', 'retry_delay_seconds', Number(event.target.value))}
                className="num"
              />
            </Field>
            <Field label="نگهداری لاگ (روز)" error={errors['jobs.log_retention_days']}>
              <Input
                type="number"
                min={1}
                max={365}
                value={draft.jobs.log_retention_days}
                onChange={(event) => setField('jobs', 'log_retention_days', Number(event.target.value))}
                className="num"
              />
            </Field>
          </div>
        </Section>
      )}

      {tab === 'notifications' && (
        <Section title="تنظیمات اعلان‌ها" description="کانال‌های اطلاع‌رسانی رویدادهای مهم.">
          <ToggleRow
            label="اعلان ایمیلی"
            description="ارسال اعلان‌ها به آدرس ایمیل مدیر."
            checked={draft.notifications.email_enabled}
            onChange={(value) => setField('notifications', 'email_enabled', value)}
          />
          <Field label="آدرس ایمیل" error={errors['notifications.email_address']}>
            <Input
              dir="ltr"
              value={draft.notifications.email_address}
              onChange={(event) => setField('notifications', 'email_address', event.target.value)}
              disabled={!draft.notifications.email_enabled}
            />
          </Field>
          <ToggleRow
            label="اعلان خطای همگام‌سازی"
            description="در صورت ناموفق بودن همگام‌سازی اطلاع داده شود."
            checked={draft.notifications.on_sync_failure}
            onChange={(value) => setField('notifications', 'on_sync_failure', value)}
          />
          <ToggleRow
            label="اعلان همگام‌سازی موفق"
            description="پس از هر اجرای موفق نیز اعلان ارسال شود."
            checked={draft.notifications.on_sync_success}
            onChange={(value) => setField('notifications', 'on_sync_success', value)}
          />
          <ToggleRow
            label="اعلان تغییر موجودی"
            description="هشدار هنگام کاهش موجودی محصولات."
            checked={draft.notifications.on_stock_change}
            onChange={(value) => setField('notifications', 'on_stock_change', value)}
          />
        </Section>
      )}

      {tab === 'security' && (
        <Section title="تنظیمات امنیتی" description="دسترسی نقش‌ها و تأیید درخواست‌های REST.">
          <ToggleRow
            label="الزام WordPress REST Nonce"
            description="همهٔ درخواست‌های این پنل با Nonce تأیید می‌شوند؛ غیرفعال کردن آن امنیت را کاهش می‌دهد."
            checked={draft.security.rest_nonce_enabled}
            onChange={(value) => setField('security', 'rest_nonce_enabled', value)}
          />
          <div>
            <p className="mb-1.5 text-xs font-medium text-foreground">نقش‌های دارای دسترسی</p>
            <div className="space-y-1.5 rounded-lg border border-border/70 px-3 py-2.5">
              {[
                { role: 'administrator', label: 'مدیر کل (administrator)' },
                { role: 'shop_manager', label: 'مدیر فروشگاه (shop_manager)' },
                { role: 'editor', label: 'ویرایشگر (editor)' },
              ].map((item) => (
                <Checkbox
                  key={item.role}
                  checked={draft.security.allowed_roles.includes(item.role)}
                  label={item.label}
                  onChange={(checked) =>
                    setField(
                      'security',
                      'allowed_roles',
                      checked ? [...draft.security.allowed_roles, item.role] : draft.security.allowed_roles.filter((role) => role !== item.role),
                    )
                  }
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">این فهرست از API خوانده می‌شود؛ مجوز نهایی در بک‌اند بررسی می‌گردد.</p>
          </div>
          <ToggleRow
            label="ثبت آدرس IP"
            description="برای پیگیری فعالیت‌های حساس، IP درخواست‌ها ذخیره شود."
            checked={draft.security.log_ip_address}
            onChange={(value) => setField('security', 'log_ip_address', value)}
          />
        </Section>
      )}

      {tab === 'advanced' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Section title="تنظیمات پیشرفته" description="برای عیب‌یابی و توسعه.">
            <ToggleRow
              label="حالت دیباگ"
              description="لاگ‌های تفصیلی درخواست‌ها ثبت می‌شود؛ در محیط تولید خاموش بماند."
              checked={draft.advanced.debug_mode}
              onChange={(value) => setField('advanced', 'debug_mode', value)}
            />
            <ToggleRow
              label="پاک کردن لاگ‌ها هنگام غیرفعال‌سازی"
              description="با غیرفعال شدن افزونه، لاگ‌ها حذف می‌شوند. این عمل بازگشت‌پذیر نیست."
              checked={draft.advanced.clear_logs_on_deactivate}
              onChange={(value) => setField('advanced', 'clear_logs_on_deactivate', value)}
            />
            <Field label="نسخه API" hint="نسخهٔ فعلی افزونه؛ در صورت نیاز توسط توسعه‌دهنده تغییر می‌کند.">
              <Input value={draft.advanced.api_version} disabled className="font-mono" />
            </Field>
          </Section>

          <Section title="منطقهٔ خطر" description="عملیات بازگشت‌ناپذیر">
            <div className="rounded-lg border border-danger/25 bg-danger-soft/40 p-3">
              <p className="text-[11.5px] font-medium text-foreground">بازگشت به مقادیر ذخیره‌شده</p>
              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                تمام تغییرات ذخیره‌نشدهٔ این صفحه کنار گذاشته می‌شود. تنظیمات ذخیره‌شده در سرور تغییری نمی‌کند.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-danger/30 text-danger hover:bg-danger-soft"
                disabled={!dirty}
                onClick={() => {
                  setDraft(data ? structuredClone(data) : null)
                  toast({ title: 'تغییرات ذخیره‌نشده بازنشانی شد', variant: 'info' })
                }}
                startIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                بازنشانی فرم
              </Button>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-[10px] leading-5 text-muted-foreground">
              <Globe className="mb-1 inline h-3 w-3" /> این پنل هیچ داده‌ای را خارج از REST API افزونه ذخیره نمی‌کند.
            </div>
          </Section>
        </div>
      )}

      {dirty && (
        <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-2xl animate-fade-up flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/95 px-3 py-2.5 shadow-pop backdrop-blur">
          <span className={cn('text-[11px]', hasErrors ? 'text-danger' : 'text-muted-foreground')}>
            {hasErrors ? 'مقادیر نامعتبری وجود دارد.' : 'تغییرات ذخیره‌نشده دارید.'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDraft(data ? structuredClone(data) : null)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              startIcon={<Save className="h-3.5 w-3.5" />}
              disabled={hasErrors}
              loading={save.isPending}
              onClick={requestSave}
            >
              ذخیره تنظیمات
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRisky}
        onClose={() => setConfirmRisky(false)}
        onConfirm={performSave}
        loading={save.isPending}
        title="تأیید تغییرات حساس"
        confirmLabel="ذخیره با تغییرات حساس"
        description={
          <div className="space-y-2">
            <p>تغییرات زیر ممکن است بر عملکرد افزونه اثر بگذارد:</p>
            <ul className="list-inside list-disc space-y-1 text-foreground/80">
              {riskyChanges.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-[11px]">آیا از ذخیرهٔ این تغییرات مطمئن هستید؟</p>
          </div>
        }
      />
    </div>
  )
}
