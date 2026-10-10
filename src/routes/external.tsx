import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlug, faRotate, faPlus, faCircleCheck, faTriangleExclamation, faCircleXmark, faGaugeHigh,
  faEllipsisVertical, faBan, faPenToSquare, faMagnifyingGlass, faArrowRotateRight, faClock,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toFa } from "@/components/yguard/ui";
import {
  DataPanel, FilterChips, LoadingPanel, MetricTile, PageHeader, SearchField, StatePanel, StateSwitcher,
  StatusPill, UptimeStrip, tdCls, thCls, useMockState,
} from "@/components/yguard/blocks";
import { ServiceDrawer } from "@/components/yguard/ServiceDrawer";
import { externalServices, externalSummary, serviceStatusMeta, type ExternalService, type ServiceStatus } from "@/data/external";

export const Route = createFileRoute("/external")({
  head: () => ({
    meta: [
      { title: "سرویس‌های خارجی — YGuard" },
      { name: "description", content: "مانیتورینگ APIها و سرویس‌های خارجی مورد استفاده سایت در YGuard." },
      { property: "og:title", content: "سرویس‌های خارجی — YGuard" },
      { property: "og:description", content: "مانیتورینگ APIها و سرویس‌های خارجی مورد استفاده سایت در YGuard." },
    ],
  }),
  component: ExternalServicesPage,
});

const statusIcon = { healthy: faCircleCheck, slow: faTriangleExclamation, error: faCircleXmark };
const filterOptions: { key: ServiceStatus | "all"; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "healthy", label: "سالم" },
  { key: "slow", label: "کند" },
  { key: "error", label: "خطادار" },
];

function ExternalServicesPage() {
  const view = useMockState(700);
  const [filter, setFilter] = useState<ServiceStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<ExternalService[]>(externalServices);
  const [rechecking, setRechecking] = useState<string[]>([]);
  const [drawerService, setDrawerService] = useState<ExternalService | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<ExternalService | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      const okFilter = filter === "all" || s.status === filter;
      const okQuery = q.length === 0 || `${s.name} ${s.provider} ${s.endpoint} ${s.category}`.toLowerCase().includes(q);
      return okFilter && okQuery;
    });
  }, [services, filter, query]);

  const counts = {
    all: services.length,
    healthy: services.filter((s) => s.status === "healthy").length,
    slow: services.filter((s) => s.status === "slow").length,
    error: services.filter((s) => s.status === "error").length,
  };

  const refresh = () => {
    view.setState("loading");
    window.setTimeout(() => {
      view.setState("ready");
      toast.success("وضعیت سرویس‌های خارجی بروزرسانی شد");
    }, 900);
  };

  const recheck = (service: ExternalService) => {
    setRechecking((r) => [...r, service.id]);
    toast(`در حال بررسی ${service.name}…`);
    window.setTimeout(() => {
      setRechecking((r) => r.filter((x) => x !== service.id));
      setServices((list) => list.map((s) => (s.id === service.id ? { ...s, lastCheck: "اکنون" } : s)));
      if (service.status === "healthy") toast.success(`${service.name} پاسخ سالم داد · ${service.responseTime}`);
      else if (service.status === "slow") toast.warning(`${service.name} کند پاسخ داد · ${service.responseTime}`);
      else toast.error(`${service.name} پاسخ نداد · HTTP ${service.httpStatus}`);
    }, 1100);
  };

  const toggleMonitoring = (service: ExternalService, monitoring: boolean) => {
    setServices((list) => list.map((s) => (s.id === service.id ? { ...s, monitoring } : s)));
    setDrawerService((d) => (d && d.id === service.id ? { ...d, monitoring } : d));
    toast.success(monitoring ? `مانیتورینگ ${service.name} فعال شد` : `مانیتورینگ ${service.name} غیرفعال شد`);
  };

  const headerActions = (
    <>
      <StateSwitcher value={view.state} onChange={view.setState} />
      <Button variant="outline" onClick={refresh}>
        <FontAwesomeIcon icon={faRotate} /> بروزرسانی
      </Button>
      <Button onClick={() => toast("افزودن سرویس خارجی در نسخه بعدی فعال می‌شود")}>
        <FontAwesomeIcon icon={faPlus} /> افزودن سرویس
      </Button>
    </>
  );

  const Header = (
    <PageHeader
      icon={faPlug}
      title="سرویس‌های خارجی"
      subtitle="مانیتورینگ APIها و سرویس‌های خارجی مورد استفاده سایت"
      actions={headerActions}
      extra={
        <span className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> آخرین بررسی خودکار: ۱ دقیقه پیش</span>
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCircleInfo} /> {toFa(externalSummary.checks24h)} بررسی در ۲۴ ساعت</span>
        </span>
      }
    />
  );

  if (view.state === "loading") {
    return (
      <div className="space-y-5">
        {Header}
        <LoadingPanel label="در حال دریافت وضعیت سرویس‌های خارجی…" rows={6} />
      </div>
    );
  }

  if (view.state === "empty" || view.state === "error") {
    return (
      <div className="space-y-5">
        {Header}
        <DataPanel>
          <StatePanel
            state={view.state === "empty" ? "empty" : "error"}
            title={view.state === "empty" ? "سرویس خارجی ثبت نشده است" : undefined}
            hint={view.state === "empty" ? "با افزودن APIها و سرویس‌ها، وضعیت آن‌ها در همین جدول پایش می‌شود." : undefined}
            onRetry={refresh}
          />
        </DataPanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Header}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricTile label="کل سرویس‌ها" value={toFa(externalSummary.total)} hint="سرویس متصل" tone="primary" icon={faPlug} />
        <MetricTile label="سالم" value={toFa(counts.healthy)} hint="پاسخ پایدار و سریع" tone="success" icon={faCircleCheck} />
        <MetricTile label="کند" value={toFa(counts.slow)} hint="زمان پاسخ بالای ۸۰۰ms" tone="warning" icon={faTriangleExclamation} />
        <MetricTile label="خطادار" value={toFa(counts.error)} hint="نیازمند بررسی فوری" tone="danger" icon={faCircleXmark} />
        <MetricTile label="میانگین Response Time" value={externalSummary.avgResponse} hint="در ۲۴ ساعت گذشته" tone="info" icon={faGaugeHigh} />
      </div>

      <DataPanel
        title="فهرست سرویس‌ها"
        desc="وضعیت، زمان پاسخ، Uptime و خطاهای هر سرویس خارجی."
        action={
          <SearchField value={query} onChange={setQuery} placeholder="جستجو در سرویس، Endpoint یا Provider…" className="w-full sm:w-80" />
        }
      >
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <FilterChips
            options={filterOptions.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] }))}
            value={filter}
            onChange={setFilter}
          />
          <StatusPill tone="primary" className="ms-auto">{toFa(visible.length)} از {toFa(services.length)} سرویس</StatusPill>
        </div>

        {visible.length === 0 ? (
          <StatePanel state="no-results" title="سرویسی با این شرایط یافت نشد" hint="فیلتر وضعیت را تغییر دهید یا عبارت جستجو را کوتاه‌تر کنید." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-[13px]">
              <thead className="bg-muted/60">
                <tr>
                  <th className={thCls}>سرویس</th>
                  <th className={thCls}>Endpoint</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Response Time</th>
                  <th className={thCls}>Uptime</th>
                  <th className={thCls}>Failures</th>
                  <th className={thCls}>آخرین بررسی</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((s) => {
                  const meta = serviceStatusMeta[s.status];
                  const busy = rechecking.includes(s.id);
                  return (
                    <tr key={s.id} className={`hover:bg-muted/40 ${s.monitoring ? "" : "opacity-60"}`}>
                      <td className={tdCls}>
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.status === "error" ? "bg-destructive/12 text-destructive" : s.status === "slow" ? "bg-warning/15 text-warning" : "bg-success/12 text-success"}`}>
                            <FontAwesomeIcon icon={s.icon} />
                          </span>
                          <span>
                            <span className="block font-semibold">{s.name}</span>
                            <span className="block text-[11px] text-muted-foreground">{s.provider}</span>
                          </span>
                        </div>
                      </td>
                      <td className={tdCls}>
                        <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">{s.endpoint}</span>
                      </td>
                      <td className={tdCls}>
                        <StatusPill tone={meta.tone} icon={statusIcon[s.status]}>{meta.label}</StatusPill>
                      </td>
                      <td className={tdCls}><span className="font-mono text-[12px]" dir="ltr">{s.responseTime}</span></td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{s.uptime}</span>
                          <span className="hidden xl:block"><UptimeStrip days={s.uptimeHistory.slice(-14)} /></span>
                        </div>
                      </td>
                      <td className={tdCls}>
                        <StatusPill tone={s.failures >= 10 ? "danger" : s.failures >= 3 ? "warning" : "muted"}>
                          {toFa(s.failures)} خطا
                        </StatusPill>
                      </td>
                      <td className={`${tdCls} text-muted-foreground`}>{s.lastCheck}</td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-1.5">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => recheck(s)}>
                                  <FontAwesomeIcon icon={faArrowRotateRight} className={busy ? "animate-spin" : undefined} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent dir="rtl" className="text-[11px]">بررسی مجدد سرویس</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button size="sm" variant="outline" onClick={() => { setDrawerService(s); setDrawerOpen(true); }}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} /> جزئیات
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost"><FontAwesomeIcon icon={faEllipsisVertical} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" dir="rtl">
                              <DropdownMenuItem onClick={() => toast(`ویرایش ${s.name} — فقط رابط کاربری`)}>
                                <FontAwesomeIcon icon={faPenToSquare} /> ویرایش سرویس
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (s.monitoring) setPendingDisable(s);
                                  else toggleMonitoring(s, true);
                                }}
                              >
                                <FontAwesomeIcon icon={faBan} /> {s.monitoring ? "غیرفعال کردن مانیتورینگ" : "فعال کردن مانیتورینگ"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataPanel>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-[12px] text-muted-foreground shadow-card">
        <FontAwesomeIcon icon={faCircleInfo} className="text-primary" />
        همه بررسی‌ها شبیه‌سازی رابط کاربری است؛ هیچ درخواست واقعی به سرویس‌های خارجی ارسال نمی‌شود.
        <Button size="sm" variant="outline" className="ms-auto" onClick={() => toast("تنظیمات بازه بررسی در «تنظیمات چکاپ» قابل تغییر است")}>
          <FontAwesomeIcon icon={faClock} /> تنظیم بازه بررسی
        </Button>
      </div>

      <AlertDialog open={pendingDisable !== null} onOpenChange={(o) => !o && setPendingDisable(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>مانیتورینگ غیرفعال شود؟</AlertDialogTitle>
            <AlertDialogDescription>
              با غیرفعال کردن مانیتورینگ {pendingDisable?.name}، هشدارهای این سرویس ارسال نمی‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDisable) toggleMonitoring(pendingDisable, false);
                setPendingDisable(null);
              }}
            >
              غیرفعال کردن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ServiceDrawer
        service={drawerService}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onRecheck={(s) => recheck(s)}
        onToggleMonitoring={(s) => (s.monitoring ? setPendingDisable(s) : toggleMonitoring(s, true))}
        onEdit={(s) => toast(`ویرایش ${s.name} — فقط رابط کاربری`)}
      />
    </div>
  );
}
