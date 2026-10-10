import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeartPulse, faRotate, faPlay, faEnvelope, faDatabase, faServer, faHardDrive,
  faGaugeHigh, faBoxArchive, faArrowTrendUp, faMagnifyingGlassChart, faListCheck,
  faCircleCheck, faStopwatch,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toFa } from "@/components/yguard/ui";
import {
  DataPanel, FilterChips, HealthTag, KeyValue, LoadingPanel, MetricTile, PageHeader, ProgressBar,
  ScoreDial, SearchField, SeverityTag, StatePanel, StateSwitcher, StatusPill, StorageBar,
  healthStatusMeta, tdCls, thCls, useMockState, type SeverityKey,
} from "@/components/yguard/blocks";
import {
  emailTestResult, healthFilters, healthScore, healthSections, healthSummary, storage,
  type HealthFilterKey, type HealthItem, type HealthSection,
} from "@/data/health";

export const Route = createFileRoute("/site-health")({
  head: () => ({
    meta: [
      { title: "سلامت سایت — YGuard" },
      { name: "description", content: "بررسی سلامت هسته وردپرس، PHP، سرور، دیتابیس و سرویس‌های سایت در YGuard." },
      { property: "og:title", content: "سلامت سایت — YGuard" },
      { property: "og:description", content: "بررسی سلامت هسته وردپرس، PHP، سرور، دیتابیس و سرویس‌های سایت در YGuard." },
    ],
  }),
  component: SiteHealthPage,
});

const severityOf = (item: HealthItem): SeverityKey =>
  item.status === "ok" ? "success" : item.status === "critical" ? "critical" : item.status === "warning" ? "warning" : "review";

function SiteHealthPage() {
  const view = useMockState(700);
  const [filter, setFilter] = useState<HealthFilterKey>("all");
  const [query, setQuery] = useState("");
  const [mailOpen, setMailOpen] = useState(false);
  const [mailSending, setMailSending] = useState(false);
  const [mailSent, setMailSent] = useState(false);

  const allItems = useMemo(() => healthSections.flatMap((s) => s.items), []);

  const matches = (item: HealthItem) => {
    const okFilter = filter === "all" || item.status === filter;
    const q = query.trim();
    const okQuery = q.length === 0 || `${item.title} ${item.current} ${item.recommended}`.toLowerCase().includes(q.toLowerCase());
    return okFilter && okQuery;
  };

  const filterCounts = healthFilters.map((f) => ({
    key: f.key,
    label: f.label,
    count: f.key === "all" ? allItems.length : allItems.filter((i) => i.status === f.key).length,
  }));

  const visibleSections = healthSections
    .map((s) => ({ ...s, items: s.items.filter(matches) }))
    .filter((s) => s.items.length > 0);
  const visibleCount = visibleSections.reduce((sum, s) => sum + s.items.length, 0);

  const refresh = () => {
    view.setState("loading");
    window.setTimeout(() => {
      view.setState("ready");
      toast.success("داده‌های سلامت سایت بروزرسانی شد");
    }, 900);
  };

  const sendTestEmail = () => {
    setMailOpen(false);
    setMailSending(true);
    window.setTimeout(() => {
      setMailSending(false);
      setMailSent(true);
      toast.success("ایمیل آزمایشی با موفقیت ارسال شد");
    }, 1200);
  };

  const headerActions = (
    <>
      <StateSwitcher value={view.state} onChange={view.setState} />
      <Button variant="outline" onClick={refresh}>
        <FontAwesomeIcon icon={faRotate} /> بروزرسانی
      </Button>
      <Button onClick={() => toast("چکاپ کامل از صفحه «چکاپ کامل» قابل اجراست")}>
        <FontAwesomeIcon icon={faPlay} /> اجرای چکاپ
      </Button>
    </>
  );

  const Header = (
    <PageHeader
      icon={faHeartPulse}
      title="سلامت سایت"
      subtitle="بررسی سلامت هسته وردپرس، PHP، سرور، دیتابیس و سرویس‌های سایت"
      actions={headerActions}
      extra={
        <span className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <StatusPill tone="success" icon={faCircleCheck}>{healthScore.status}</StatusPill>
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faArrowTrendUp} className="text-success" /> {healthScore.trend}</span>
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faStopwatch} /> آخرین بررسی: {healthScore.lastCheck}</span>
        </span>
      }
    />
  );

  const summaryCards = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {healthSummary.map((s) => (
        <div key={s.title} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-bold">
              <FontAwesomeIcon icon={s.icon} className="text-muted-foreground" /> {s.title}
            </span>
            <HealthTag status={s.status} />
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-2xl font-extrabold tracking-tight">{toFa(s.score)}</span>
            <span className="text-[11px] text-muted-foreground">از ۱۰۰</span>
          </div>
          <ProgressBar value={s.score} tone={s.status === "ok" ? "success" : s.status === "critical" ? "danger" : "warning"} className="mt-2 h-1.5" />
          <div className="mt-2 text-[11px] text-muted-foreground">{s.hint}</div>
        </div>
      ))}
    </div>
  );

  const sectionPanel = (section: HealthSection) => (
    <DataPanel
      key={section.id}
      title={<span className="flex items-center gap-2"><FontAwesomeIcon icon={section.icon} className="text-muted-foreground" /> {section.title}</span>}
      desc={section.desc}
      action={
        <>
          <StatusPill tone="muted">{toFa(section.items.length)} مورد</StatusPill>
          {section.actions === "email-test" && (
            <Button size="sm" variant="outline" disabled={mailSending} onClick={() => setMailOpen(true)}>
              <FontAwesomeIcon icon={faEnvelope} className={mailSending ? "animate-pulse" : undefined} />
              {mailSending ? "در حال ارسال…" : "ارسال ایمیل آزمایشی"}
            </Button>
          )}
        </>
      }
    >
      {section.id === "server" && (
        <div className="border-b border-border px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-bold">
            <FontAwesomeIcon icon={faHardDrive} className="text-muted-foreground" /> وضعیت فضای ذخیره‌سازی
          </div>
          <StorageBar total={storage.total} used={storage.used} free={storage.free} unit={storage.unit} />
        </div>
      )}

      {section.id === "database" && (
        <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="حجم Autoload" value="۴.۸ MB" hint="حد مطلوب: زیر ۱MB" tone="warning" icon={faDatabase} />
          <MetricTile label="کوئری‌های کند" value="۲" hint="بالای ۵۰۰ms" tone="warning" icon={faGaugeHigh} />
          <MetricTile label="Transient منقضی" value="۱٬۲۴۰" hint="۱۸MB داده اضافه" tone="warning" icon={faBoxArchive} />
          <MetricTile label="نسخه‌های بازبینی" value="۲۱۰" hint="پیشنهاد: حداکثر ۵" tone="info" icon={faListCheck} />
        </div>
      )}

      {section.actions === "email-test" && mailSent && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-success/8 px-5 py-3 text-[12px]">
          <FontAwesomeIcon icon={faCircleCheck} className="text-success" />
          <span className="font-semibold">ایمیل آزمایشی ارسال شد</span>
          <span className="text-muted-foreground">
            گیرنده: <span dir="ltr" className="font-mono">{emailTestResult.to}</span> · SMTP: <span dir="ltr" className="font-mono">{emailTestResult.smtp}</span> · زمان: {emailTestResult.duration}
          </span>
          <StatusPill tone="success" className="ms-auto">موفق</StatusPill>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-muted/60">
            <tr>
              <th className={thCls}>مورد</th>
              <th className={thCls}>وضعیت</th>
              <th className={thCls}>مقدار فعلی</th>
              <th className={thCls}>مقدار پیشنهادی</th>
              <th className={thCls}>سطح</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {section.items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/40">
                <td className={tdCls}>
                  <div className="font-semibold">{item.title}</div>
                  {item.note && <div className="text-[11px] text-muted-foreground">{item.note}</div>}
                </td>
                <td className={tdCls}><HealthTag status={item.status} /></td>
                <td className={tdCls}>
                  <span className={item.currentDir === "ltr" ? "font-mono text-[12px]" : "font-semibold"} dir={item.currentDir}>{item.current}</span>
                </td>
                <td className={`${tdCls} text-muted-foreground`}>{item.recommended}</td>
                <td className={tdCls}><SeverityTag severity={severityOf(item)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {section.extra && (
        <div className="grid gap-x-6 border-t border-border px-5 py-3 sm:grid-cols-2">
          {section.extra.map((row) => (
            <KeyValue key={row.label} label={row.label} value={row.value} dir={row.dir} mono={row.dir === "ltr"} />
          ))}
        </div>
      )}
    </DataPanel>
  );

  if (view.state === "loading") {
    return (
      <div className="space-y-5">
        {Header}
        <LoadingPanel label="در حال بررسی سلامت سایت…" rows={7} />
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
            title={view.state === "empty" ? "داده سلامت سایتی موجود نیست" : undefined}
            hint={view.state === "empty" ? "پس از اجرای چکاپ، نتایج سلامت سایت در همین صفحه نمایش داده می‌شود." : undefined}
            onRetry={refresh}
          />
        </DataPanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Header}

      <DataPanel
        title="امتیاز سلامت سایت"
        action={<StatusPill tone="success" icon={faCircleCheck}>وضعیت: {healthScore.status}</StatusPill>}
      >
        <div className="grid items-center gap-6 px-5 py-5 lg:grid-cols-[auto_1fr]">
          <ScoreDial value={healthScore.score} tone="success" caption={<span className="text-[11px] text-muted-foreground">{toFa(healthScore.checkedCount)} بررسی در ۱۱ بخش</span>} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="امتیاز کلی" value={`${toFa(healthScore.score)} / ۱۰۰`} hint={healthScore.status} tone="success" icon={faHeartPulse} />
            <MetricTile label="تعداد بررسی‌ها" value={toFa(healthScore.checkedCount)} hint="در همه بخش‌ها" tone="primary" icon={faListCheck} />
            <MetricTile label="آخرین بررسی" value={healthScore.lastCheck} hint="بروزرسانی خودکار هر ۶ ساعت" tone="info" icon={faStopwatch} />
            <MetricTile label="روند هفتگی" value="+۲ امتیاز" hint="۹ مورد بهبود یافته" tone="success" icon={faArrowTrendUp} />
          </div>
        </div>
      </DataPanel>

      {summaryCards}

      <DataPanel
        title="فیلتر و جستجوی عیب‌یاب‌ها"
        desc="نمایش موارد براساس وضعیت یا جستجو در نام و مقدار."
        action={
          <SearchField value={query} onChange={setQuery} placeholder="جستجو در عیب‌یاب‌ها… مانند Autoload یا memory_limit" className="w-full sm:w-80" />
        }
      >
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <FilterChips options={filterCounts} value={filter} onChange={setFilter} />
          <StatusPill tone="primary" className="ms-auto">{toFa(visibleCount)} از {toFa(allItems.length)} مورد</StatusPill>
        </div>
      </DataPanel>

      {visibleSections.length === 0 ? (
        <DataPanel>
          <StatePanel state="no-results" title="عیب‌یابی با این شرایط یافت نشد" hint="فیلتر وضعیت را تغییر دهید یا عبارت جستجو را کوتاه‌تر کنید." />
        </DataPanel>
      ) : (
        visibleSections.map(sectionPanel)
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-[12px] text-muted-foreground shadow-card">
        <FontAwesomeIcon icon={faMagnifyingGlassChart} className="text-primary" />
        همه مقادیر این صفحه از داده‌های نمونه ساخته شده‌اند و با اجرای چکاپ کامل بروزرسانی می‌شوند.
        <Button size="sm" variant="outline" className="ms-auto" onClick={refresh}>
          <FontAwesomeIcon icon={faServer} /> بررسی مجدد سرور
        </Button>
      </div>

      <AlertDialog open={mailOpen} onOpenChange={setMailOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>ارسال ایمیل آزمایشی؟</AlertDialogTitle>
            <AlertDialogDescription>
              یک ایمیل آزمایشی به <span dir="ltr" className="font-mono">admin@example.com</span> ارسال می‌شود تا وضعیت SMTP بررسی شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={sendTestEmail}>ارسال ایمیل</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
