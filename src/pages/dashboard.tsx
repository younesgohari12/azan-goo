import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Package,
  PackageX,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  XCircle,
} from 'lucide-react'
import { API_MODE } from '@/api/client'
import { useActivity, useDashboard } from '@/api/hooks'
import { usePreferences } from '@/app/preferences'
import { formatDate, formatDateShort, formatNumber, formatRelative, formatTomanCompact } from '@/lib/format'
import { jobStatusMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { ActivityList, Dismissible } from '@/components/activity-list'
import { ChartCard, ChartLegend, FaChartTooltip, axisProps, moneyTooltipValue } from '@/components/charts/charts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { ProductThumb } from '@/components/ui/product-thumb'
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { Segmented } from '@/components/ui/tabs'

export default function DashboardPage() {
  const { preferences, setPreference } = usePreferences()
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching, isError, error } = useDashboard({
    store_id: preferences.activeStoreId,
    range: preferences.dashboardRange,
  })
  const { data: activity, isLoading: activityLoading } = useActivity({ limit: 6 })

  const maxJobCount = Math.max(1, ...(data?.jobs_status.map((item) => item.count) ?? [1]))

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="داشبورد"
        description="نمای کلی وضعیت فروشگاه، همگام‌سازی و سفارش‌های اسنپ‌شاپ در یک نگاه."
        actions={
          <>
            <Segmented
              value={preferences.dashboardRange}
              onChange={(value) => setPreference('dashboardRange', value)}
              options={[
                { label: '۷ روز', value: '7d' },
                { label: '۳۰ روز', value: '30d' },
                { label: '۹۰ روز', value: '90d' },
              ]}
            />
            <Button
              variant="outline"
              startIcon={<RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />}
              onClick={() => queryClient.invalidateQueries()}
            >
              به‌روزرسانی
            </Button>
          </>
        }
      />

      {API_MODE === 'mock' && preferences.showDemoData && (
        <Dismissible onClose={() => setPreference('showDemoData', false)}>
          این پنل در <strong className="font-semibold">حالت نمایشی</strong> با دادهٔ نمونه کار می‌کند؛ اعداد و رویدادها واقعی نیستند. پس از
          اتصال افزونهٔ وردپرس، همین رابط با دادهٔ واقعی REST API تغذیه می‌شود.
        </Dismissible>
      )}

      {isError ? (
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => queryClient.invalidateQueries()} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="تعداد محصولات"
              value={formatNumber(data?.products.total)}
              icon={Package}
              accent="info"
              loading={isLoading}
              trend={data?.trends.products ?? null}
              hint="کل محصولات ثبت‌شده در ووکامرس که به این افزونه متصل‌اند."
            />
            <StatCard
              label="محصولات فعال"
              value={formatNumber(data?.products.active)}
              icon={CheckCircle2}
              accent="success"
              loading={isLoading}
              footer="آمادهٔ فروش در اسنپ‌شاپ"
            />
            <StatCard
              label="محصولات ناموجود"
              value={formatNumber(data?.products.out_of_stock)}
              icon={PackageX}
              accent="warning"
              loading={isLoading}
              footer="نیازمند تأمین موجودی"
            />
            <StatCard
              label="محصولات نیازمند بررسی"
              value={formatNumber(data?.products.needs_review)}
              icon={AlertTriangle}
              accent="danger"
              loading={isLoading}
              footer="خطای همگام‌سازی یا مغایرت قیمت"
              hint="محصولاتی که خطای همگام‌سازی دارند یا قیمت/موجودی آن‌ها با اسنپ‌شاپ مغایرت دارد."
            />

            <StatCard
              label="سفارش‌های جدید"
              value={formatNumber(data?.orders.new)}
              icon={ShoppingCart}
              accent="primary"
              loading={isLoading}
              trend={data?.trends.orders ?? null}
            />
            <StatCard
              label="سفارش‌های لغوشده"
              value={formatNumber(data?.orders.cancelled)}
              icon={XCircle}
              accent="danger"
              loading={isLoading}
              footer="در بازهٔ انتخابی"
            />
            <StatCard
              label="ارزش فروش"
              value={data ? formatTomanCompact(data.orders.sales_value) : '—'}
              icon={CircleDollarSign}
              accent="success"
              loading={isLoading}
              trend={data?.trends.sales ?? null}
              suffix="تومان"
              hint="مجموع مبلغ سفارش‌های غیرلغوشده در بازهٔ انتخابی. مبالغ به تومان هستند."
            />
            <StatCard
              label="عملیات ناموفق"
              value={formatNumber(data?.sync.failed)}
              icon={TrendingDown}
              accent="warning"
              loading={isLoading}
              trend={data?.trends.failures ?? null}
              footer={`${formatNumber(data?.sync.success)} مورد موفق`}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="روند سفارش‌ها"
              description={`تعداد سفارش‌های دریافتی در ${
                preferences.dashboardRange === '7d' ? '۷ روز' : preferences.dashboardRange === '90d' ? '۹۰ روز' : '۳۰ روز'
              } گذشته`}
              action={<Badge variant="outline">روزانه</Badge>}
            >
              {isLoading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <div className="h-[220px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.orders_series ?? []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" reversed tickFormatter={(value) => formatDateShort(String(value))} {...axisProps} />
                      <YAxis orientation="right" width={30} tickFormatter={(value) => formatNumber(Number(value))} {...axisProps} />
                      <RTooltip
                        cursor={{ stroke: 'hsl(var(--border))' }}
                        content={<FaChartTooltip labelFormatter={(label) => formatDate(String(label))} />}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="سفارش"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        fill="url(#ordersGradient)"
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard title="وضعیت موجودی" description="تفکیک محصولات بر اساس موجودی ووکامرس">
              {isLoading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <div className="flex h-[220px] flex-col">
                  <div className="relative flex-1">
                    <div className="h-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.inventory_breakdown ?? []}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={54}
                            outerRadius={78}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {(data?.inventory_breakdown ?? []).map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <RTooltip content={<FaChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="num text-xl font-semibold text-foreground">{formatNumber(data?.products.total)}</span>
                      <span className="text-[10px] text-muted-foreground">کل محصولات</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 px-1">
                    {data?.inventory_breakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
                          {item.name}
                        </span>
                        <span className="num font-medium text-foreground">{formatNumber(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="آمار فروش"
              description="مبلغ فروش روزانه به تومان"
              action={<Badge variant="outline">تومان</Badge>}
            >
              {isLoading ? (
                <Skeleton className="h-[210px] w-full" />
              ) : (
                <div className="h-[210px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.sales_series ?? []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" reversed tickFormatter={(value) => formatDateShort(String(value))} {...axisProps} />
                      <YAxis
                        orientation="right"
                        width={46}
                        tickFormatter={(value) => formatNumber(Number(value) / 1_000_000)}
                        {...axisProps}
                      />
                      <RTooltip
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                        content={
                          <FaChartTooltip labelFormatter={(label) => formatDate(String(label))} valueFormatter={moneyTooltipValue} />
                        }
                      />
                      <Bar dataKey="value" name="فروش" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>وضعیت Jobها</CardTitle>
                <Link to="/jobs" className="text-[10.5px] text-primary hover:underline">
                  مشاهده همه
                </Link>
              </CardHeader>
              <div className="flex-1 space-y-2.5 p-4">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-6 w-full" />)
                  : data?.jobs_status.map((item) => {
                      const meta = jobStatusMeta[item.status]
                      const width = Math.max(6, (item.count / maxJobCount) * 100)
                      const color =
                        item.status === 'running'
                          ? 'bg-info'
                          : item.status === 'completed'
                            ? 'bg-success'
                            : item.status === 'failed'
                              ? 'bg-danger'
                              : item.status === 'partially_completed'
                                ? 'bg-warning'
                                : 'bg-muted-foreground/40'
                      return (
                        <div key={item.status}>
                          <div className="mb-1 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{meta.label}</span>
                            <span className="num font-medium text-foreground">{formatNumber(item.count)}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      )
                    })}
              </div>
              <div className="border-t border-border px-4 py-2.5">
                <Link to="/jobs" className="flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground">
                  تاریخچهٔ کامل پردازش‌ها
                  <ArrowLeft className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="عملکرد همگام‌سازی"
              description="نتیجهٔ عملیات روزانهٔ همگام‌سازی"
              action={<ChartLegend items={[{ label: 'موفق', color: 'hsl(var(--chart-3))' }, { label: 'ناموفق', color: 'hsl(var(--chart-1))' }]} />}
            >
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <div className="h-[200px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.sync_series ?? []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" reversed tickFormatter={(value) => formatDateShort(String(value))} {...axisProps} />
                      <YAxis orientation="right" width={30} {...axisProps} />
                      <RTooltip
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                        content={<FaChartTooltip labelFormatter={(label) => formatDate(String(label))} />}
                      />
                      <Bar dataKey="success" name="موفق" stackId="sync" fill="hsl(var(--chart-3))" radius={[0, 0, 0, 0]} maxBarSize={26} />
                      <Bar dataKey="failed" name="ناموفق" stackId="sync" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <Card className="flex flex-col">
              <CardHeader>
                <div>
                  <CardTitle>محصولات نیازمند بررسی</CardTitle>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">اولویت‌دارترین خطاها و مغایرت‌ها</p>
                </div>
                <Link to="/products?only_errors=1" className="text-[10.5px] text-primary hover:underline">
                  مشاهده همه
                </Link>
              </CardHeader>
              <div className="flex-1 p-2">
                {isLoading ? (
                  <SkeletonTable rows={4} columns={2} />
                ) : data?.top_issues.length ? (
                  <ul className="space-y-0.5">
                    {data.top_issues.map((product) => (
                      <li key={product.id}>
                        <Link
                          to={`/products?search=${encodeURIComponent(product.sku)}`}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                        >
                          <ProductThumb id={product.id} name={product.name} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11.5px] font-medium text-foreground">{product.name}</span>
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {product.errors[0] ?? 'مغایرت قیمت با اسنپ‌شاپ'}
                            </span>
                          </span>
                          <Badge variant={product.sync_status === 'error' ? 'danger' : 'warning'}>
                            {product.sync_status === 'error' ? 'خطا' : 'مغایرت'}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <CheckCircle2 className="mb-2 h-6 w-6 text-success" />
                    <p className="text-[11.5px] text-muted-foreground">محصولی نیازمند بررسی نیست.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card className="mt-3">
            <CardHeader>
              <div>
                <CardTitle>فعالیت‌های اخیر</CardTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">آخرین رویدادهای سفارش، قیمت، موجودی و همگام‌سازی</p>
              </div>
              <div className="flex items-center gap-2">
                <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                <Link to="/activity" className="text-[10.5px] text-primary hover:underline">
                  تاریخچه کامل
                </Link>
              </div>
            </CardHeader>
            <div className="mt-2">
              <ActivityList items={activity} loading={activityLoading} columns={2} />
            </div>
            {activity && activity[0] && (
              <div className="border-t border-border px-4 py-2.5 text-[10px] text-muted-foreground">
                آخرین رویداد {formatRelative(activity[0].created_at)} ثبت شده است.
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
