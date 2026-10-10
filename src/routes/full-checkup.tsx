import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStethoscope, faGear, faPlay, faStop, faWindowMinimize, faSpinner, faCheck, faEyeSlash,
  faMagnifyingGlass, faDownload, faRotate, faLightbulb, faCircleCheck, faCircleXmark,
  faTriangleExclamation, faTerminal, faClock, faFileExport, faListCheck, faCheckDouble,
  faChevronLeft, faFilter, faStopwatch, faListOl, faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { toFa, StatCard } from "@/components/yguard/ui";
import {
  DataPanel, FilterChips, KeyValue, LoadingPanel, MetricTile, PageHeader, ProgressBar, ScoreDial,
  SeverityTag, StageTag, StatePanel, StateSwitcher, StatusPill,
  useMockState, type SeverityKey, type StageState, type StatusTone,
} from "@/components/yguard/blocks";
import { CheckupResultDrawer } from "@/components/yguard/CheckupResultDrawer";
import { checkItems, issueGroups, presets, scanEvents, scanStages, scanSummary, type CheckId, type Issue } from "@/data/checkup";

export const Route = createFileRoute("/full-checkup")({
  head: () => ({
    meta: [
      { title: "چکاپ کامل سایت — YGuard" },
      { name: "description", content: "بررسی جامع سلامت، عملکرد، امنیت و زیرساخت سایت وردپرسی در YGuard." },
      { property: "og:title", content: "چکاپ کامل سایت — YGuard" },
      { property: "og:description", content: "بررسی جامع سلامت، عملکرد، امنیت و زیرساخت سایت وردپرسی در YGuard." },
    ],
  }),
  component: FullCheckupPage,
});

const TOTAL_SECONDS = 150; // 02:30 — at 72% ⇒ 01:48 گذشته و 00:42 باقی‌مانده
const START_PROGRESS = 72;

const mmss = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const eventTone: Record<"success" | "warning" | "danger" | "info", { label: string; pill: StatusTone }> = {
  success: { label: "موفق", pill: "success" },
  warning: { label: "هشدار", pill: "warning" },
  danger: { label: "بحرانی", pill: "danger" },
  info: { label: "در حال بررسی", pill: "info" },
};

const severityFilters: { key: SeverityKey | "all" | "ignored"; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "critical", label: "بحرانی" },
  { key: "warning", label: "هشدار" },
  { key: "suggestion", label: "پیشنهاد" },
  { key: "success", label: "موفق" },
  { key: "ignored", label: "نادیده گرفته‌شده" },
];

function FullCheckupPage() {
  const view = useMockState(650);
  const [presetId, setPresetId] = useState<string>("standard");
  const [selected, setSelected] = useState<CheckId[]>(presets[1]?.ids ?? []);
  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [progress, setProgress] = useState(START_PROGRESS);
  const [background, setBackground] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Issue["status"]>>({});
  const [drawerIssue, setDrawerIssue] = useState<Issue | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resultFilter, setResultFilter] = useState<SeverityKey | "all" | "ignored">("all");
  const logRef = useRef<HTMLDivElement>(null);

  const preset = presets.find((p) => p.id === presetId) ?? presets[1]!;
  const totalChecks = useMemo(
    () => checkItems.filter((c) => selected.includes(c.id)).reduce((sum, c) => sum + c.checks, 0),
    [selected],
  );

  /* ---------------- simulated scan loop ---------------- */
  useEffect(() => {
    if (phase !== "running") return;
    const t = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 0.9;
        if (next >= 100) {
          window.clearInterval(t);
          window.setTimeout(() => {
            setPhase("done");
            setBackground(false);
            toast.success("چکاپ کامل شد — امتیاز ۸۹ از ۱۰۰");
          }, 700);
          return 100;
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(t);
  }, [phase]);

  const stageIndex = Math.min(scanStages.length - 1, Math.floor((progress / 100) * scanStages.length));
  const stageState = (i: number): StageState => {
    const stage = scanStages[i]!;
    if (phase === "done") return stage.outcome;
    if (i < stageIndex) return stage.outcome;
    if (i === stageIndex) return "running";
    return "waiting";
  };
  const currentStage = scanStages[stageIndex]!;
  const elapsed = (progress / 100) * TOTAL_SECONDS;
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
  const visibleEvents = phase === "done"
    ? scanEvents
    : scanEvents.filter((_, i) => progress >= ((i + 1) / scanEvents.length) * 100);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [visibleEvents.length, phase]);

  /* ---------------- actions ---------------- */
  const start = (mode: string) => {
    const label = presets.find((p) => p.id === mode)?.title ?? preset.title;
    setPhase("running");
    setProgress(START_PROGRESS);
    setBackground(false);
    toast.success(`${label} آغاز شد — ${toFa(totalChecks)} بررسی در صف اجرا`);
  };

  const setStatus = (issue: Issue, status: Issue["status"]) => {
    setOverrides((o) => ({ ...o, [issue.id]: status }));
    setDrawerOpen(false);
    toast.success(status === "حل‌شده" ? "مورد به‌عنوان حل‌شده علامت خورد" : "این مورد نادیده گرفته شد");
  };

  const toggleItem = (id: CheckId, on: boolean) => {
    setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  };

  const groupedResults = issueGroups.map((g) => ({
    ...g,
    issues: g.issues
      .map((i) => (overrides[i.id] ? { ...i, status: overrides[i.id]! } : i))
      .filter((i) => {
        if (resultFilter === "all") return true;
        if (resultFilter === "ignored") return i.status === "نادیده گرفته‌شده";
        return i.severity === resultFilter && i.status !== "نادیده گرفته‌شده";
      }),
  }));
  const visibleResultCount = groupedResults.reduce((sum, g) => sum + g.issues.length, 0);

  const headerActions = (
    <>
      <StateSwitcher value={view.state} onChange={view.setState} />
      <Button variant="outline" onClick={() => setSettingsOpen(true)}>
        <FontAwesomeIcon icon={faGear} /> تنظیمات چکاپ
      </Button>
    </>
  );

  if (view.state === "loading") {
    return (
      <div className="space-y-5">
        <PageHeader icon={faStethoscope} title="چکاپ کامل سایت" subtitle="بررسی جامع سلامت، عملکرد، امنیت و زیرساخت سایت" actions={headerActions} />
        <LoadingPanel label="در حال آماده‌سازی بخش‌های چکاپ…" rows={6} />
      </div>
    );
  }

  if (view.state === "empty" || view.state === "error") {
    return (
      <div className="space-y-5">
        <PageHeader icon={faStethoscope} title="چکاپ کامل سایت" subtitle="بررسی جامع سلامت، عملکرد، امنیت و زیرساخت سایت" actions={headerActions} />
        <DataPanel>
          <StatePanel state={view.state === "empty" ? "empty" : "error"} title={view.state === "empty" ? "هنوز چکاپی ثبت نشده است" : undefined} onRetry={() => view.setState("ready")} />
        </DataPanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={faStethoscope}
        title="چکاپ کامل سایت"
        subtitle="بررسی جامع سلامت، عملکرد، امنیت و زیرساخت سایت"
        actions={headerActions}
        extra={
          <span className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
            <StatusPill tone="info">WordPress 6.6.2 · PHP 8.2.12</StatusPill>
            <span className="flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> آخرین چکاپ: {scanSummary.lastRun}</span>
            <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCircleCheck} className="text-success" /> امتیاز قبلی: {toFa(94)}</span>
          </span>
        }
      />

      {/* ================= SETUP ================= */}
      {phase === "setup" && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {presets.map((p) => {
              const active = p.id === presetId;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setPresetId(p.id);
                    setSelected(p.ids);
                  }}
                  className={`rounded-xl border p-4 text-right shadow-card transition-colors ${active ? "border-primary/50 bg-primary-soft" : "border-border bg-card hover:border-primary/30"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? "bg-card text-primary" : "bg-muted text-muted-foreground"}`}>
                      <FontAwesomeIcon icon={p.icon} />
                    </span>
                    {active ? <StatusPill tone="primary" icon={faCheck}>انتخاب‌شده</StatusPill> : <StatusPill tone="muted">زمان: {p.duration}</StatusPill>}
                  </div>
                  <div className="mt-3 text-sm font-extrabold">{p.title}</div>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{p.desc}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><FontAwesomeIcon icon={faListOl} /> {toFa(p.checks)} بررسی</span>
                    <span className="flex items-center gap-1"><FontAwesomeIcon icon={faStopwatch} /> {p.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <DataPanel
            title="بخش‌های چکاپ"
            desc="بخش‌هایی که می‌خواهید در این چکاپ بررسی شوند را انتخاب کنید."
            action={
              <>
                <StatusPill tone="primary">{toFa(selected.length)} از {toFa(checkItems.length)} بخش · {toFa(totalChecks)} بررسی</StatusPill>
                <Button size="sm" variant="ghost" onClick={() => setSelected(checkItems.map((c) => c.id))}>
                  <FontAwesomeIcon icon={faCheckDouble} /> انتخاب همه
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                  <FontAwesomeIcon icon={faEyeSlash} /> پاک کردن
                </Button>
              </>
            }
          >
            <div className="grid gap-x-6 border-b border-border md:grid-cols-2">
              {checkItems.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 border-b border-border/60 py-2.5 last:border-b-0">
                    <Checkbox checked={on} onCheckedChange={(v) => toggleItem(c.id, v === true)} />
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] ${on ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}>
                      <FontAwesomeIcon icon={c.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">{c.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{c.desc}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{toFa(c.checks)} بررسی</span>
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Button onClick={() => start(presetId)} disabled={selected.length === 0}>
                <FontAwesomeIcon icon={faPlay} /> شروع چکاپ کامل
              </Button>
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                <FontAwesomeIcon icon={faGear} /> تنظیمات چکاپ
              </Button>
              {selected.length === 0 && <span className="text-[12px] text-warning">حداقل یک بخش را انتخاب کنید.</span>}
              <span className="ms-auto text-[12px] text-muted-foreground">زمان تقریبی: {preset.duration} · اجرا در سرور سایت</span>
            </div>
          </DataPanel>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="مدت چکاپ قبلی" value={scanSummary.duration} hint="چکاپ استاندارد" tone="info" icon={faStopwatch} />
            <MetricTile label="تعداد بررسی‌ها" value={toFa(scanSummary.checks)} hint="آخرین اجرا" tone="primary" icon={faListOl} />
            <MetricTile label="زمان آخرین چکاپ" value={scanSummary.lastRun} hint={`پایان: ${scanSummary.finishedAt}`} tone="success" icon={faCalendarDays} />
            <MetricTile label="مورد نیازمند اقدام" value={`${toFa(scanSummary.critical)} بحرانی`} hint={`${toFa(scanSummary.warning)} هشدار باز`} tone="warning" icon={faTriangleExclamation} />
          </div>
        </>
      )}

      {/* ================= RUNNING ================= */}
      {phase === "running" && (
        <>
          {background ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-primary" />
              <span className="text-[13px] font-bold">چکاپ در پس‌زمینه در حال اجراست</span>
              <span className="text-[12px] text-muted-foreground">مرحله: {currentStage.title} · {toFa(Math.round(progress))}٪ · باقی‌مانده {mmss(remaining)}</span>
              <div className="w-40"><ProgressBar value={progress} /></div>
              <Button size="sm" variant="outline" className="ms-auto" onClick={() => setBackground(false)}>
                نمایش کامل
              </Button>
            </div>
          ) : (
            <>
              <DataPanel>
                <div className="grid gap-6 px-5 py-5 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="info" icon={faSpinner}>در حال اجرا</StatusPill>
                      <span className="text-[12px] text-muted-foreground">{preset.title} · {toFa(scanStages.length)} مرحله</span>
                    </div>
                    <h2 className="mt-2 text-lg font-extrabold tracking-tight">در حال بررسی سایت...</h2>
                    <p className="text-[12px] text-muted-foreground">مرحله فعلی: {currentStage.title} — بررسی {toFa(totalChecks)} مورد</p>

                    <div className="mt-4 flex items-end justify-between">
                      <div className="text-4xl font-extrabold tracking-tight">{toFa(Math.round(progress))}٪</div>
                      <span className="text-[12px] text-muted-foreground">پیشرفت چکاپ</span>
                    </div>
                    <ProgressBar value={progress} className="mt-2 h-2.5" striped />

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MetricTile label="زمان سپری‌شده" value={<span dir="ltr" className="font-mono">{mmss(elapsed)}</span>} hint="Elapsed Time" tone="info" icon={faStopwatch} />
                      <MetricTile label="زمان باقی‌مانده" value={<span dir="ltr" className="font-mono">{mmss(remaining)}</span>} hint="Estimated Remaining" tone="warning" icon={faClock} />
                      <MetricTile label="موارد بررسی‌شده" value={`${toFa(Math.round((progress / 100) * scanSummary.checks))} / ${toFa(scanSummary.checks)}`} hint="از کل بررسی‌ها" tone="primary" icon={faListCheck} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-card text-primary">
                        <FontAwesomeIcon icon={currentStage.icon} />
                      </span>
                      <div>
                        <div className="text-[12px] text-muted-foreground">مرحله جاری</div>
                        <div className="text-sm font-bold">{currentStage.title}</div>
                      </div>
                      <StageTag state="running" className="ms-auto" />
                    </div>
                    <div className="mt-3 space-y-2 text-[12px] text-muted-foreground">
                      <KeyValue label="شاخص پیشرفت" value={`${toFa(stageIndex + 1)} از ${toFa(scanStages.length)}`} />
                      <KeyValue label="آخرین رویداد" value={visibleEvents[visibleEvents.length - 1]?.message ?? "—"} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setStopOpen(true)}>
                        <FontAwesomeIcon icon={faStop} /> توقف چکاپ
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setBackground(true);
                          toast("چکاپ در پس‌زمینه ادامه می‌یابد");
                        }}
                      >
                        <FontAwesomeIcon icon={faWindowMinimize} /> اجرا در پس‌زمینه
                      </Button>
                    </div>
                  </div>
                </div>
              </DataPanel>

              <DataPanel title="مراحل چکاپ" desc="وضعیت هر مرحله به‌صورت زنده به‌روزرسانی می‌شود." action={<StatusPill tone="info">{toFa(scanStages.filter((_, i) => i < stageIndex).length)} مرحله انجام‌شده</StatusPill>}>
                <div className="grid gap-x-6 px-5 py-2 md:grid-cols-2 xl:grid-cols-3">
                  {scanStages.map((s, i) => {
                    const st = stageState(i);
                    return (
                      <div key={s.id} className={`flex items-center gap-3 border-b border-border/60 py-2.5 last:border-b-0 ${st === "waiting" ? "opacity-60" : ""}`}>
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] ${
                          st === "passed" ? "bg-success/12 text-success"
                            : st === "warning" ? "bg-warning/15 text-warning"
                              : st === "critical" ? "bg-destructive/12 text-destructive"
                                : st === "running" ? "bg-info/12 text-info"
                                  : "bg-muted text-muted-foreground"
                        }`}>
                          <FontAwesomeIcon icon={s.icon} />
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] font-semibold">{s.title}</span>
                        <StageTag state={st} />
                      </div>
                    );
                  })}
                </div>
              </DataPanel>
            </>
          )}

          <DataPanel
            title="رویدادهای چکاپ"
            desc="گزارش زنده رویدادهای ثبت‌شده در این اجرا."
            action={
              <>
                <StatusPill tone="info" icon={faSpinner}>زنده</StatusPill>
                <StatusPill tone="muted">{toFa(visibleEvents.length)} رویداد</StatusPill>
                {background && (
                  <Button size="sm" variant="outline" onClick={() => setStopOpen(true)}>
                    <FontAwesomeIcon icon={faStop} /> توقف چکاپ
                  </Button>
                )}
              </>
            }
          >
            <div ref={logRef} className="max-h-80 divide-y divide-border overflow-y-auto border-t border-border">
              {visibleEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-5 py-2.5">
                  <span className="pt-0.5 font-mono text-[11px] text-muted-foreground" dir="ltr">{e.time}</span>
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] ${
                    e.tone === "success" ? "bg-success/12 text-success" : e.tone === "warning" ? "bg-warning/15 text-warning" : e.tone === "danger" ? "bg-destructive/12 text-destructive" : "bg-info/12 text-info"
                  }`}>
                    <FontAwesomeIcon icon={e.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold">{e.title}</span>
                    <span className="block text-[12px] text-muted-foreground">{e.message}</span>
                  </span>
                  <StatusPill tone={eventTone[e.tone].pill} className="mt-0.5">{eventTone[e.tone].label}</StatusPill>
                </div>
              ))}
            </div>
          </DataPanel>
        </>
      )}

      {/* ================= DONE ================= */}
      {phase === "done" && (
        <>
          <DataPanel
            title="چکاپ کامل شد"
            desc={`پایان چکاپ: ${scanSummary.finishedAt} · ${preset.title}`}
            action={
              <>
                <Button variant="outline" onClick={() => toast("گزارش کامل در حال آماده‌سازی است…")}>
                  <FontAwesomeIcon icon={faFileExport} /> مشاهده گزارش کامل
                </Button>
                <Button variant="outline" onClick={() => toast.success("گزارش PDF در صف دانلود قرار گرفت")}>
                  <FontAwesomeIcon icon={faDownload} /> دانلود گزارش
                </Button>
                <Button onClick={() => { setPhase("setup"); setProgress(START_PROGRESS); setOverrides({}); setResultFilter("all"); }}>
                  <FontAwesomeIcon icon={faRotate} /> چکاپ جدید
                </Button>
              </>
            }
          >
            <div className="grid items-center gap-6 px-5 py-5 lg:grid-cols-[auto_1fr]">
              <ScoreDial
                value={scanSummary.score}
                tone="success"
                caption={<StatusPill tone="success" icon={faCircleCheck}>وضعیت: خوب</StatusPill>}
              />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricTile label="مدت زمان چکاپ" value={<span dir="ltr" className="font-mono">{scanSummary.duration}</span>} hint="از شروع تا گزارش نهایی" tone="info" icon={faStopwatch} />
                <MetricTile label="تعداد بررسی‌ها" value={toFa(scanSummary.checks)} hint="در ۲۰ بخش" tone="primary" icon={faListOl} />
                <MetricTile label="زمان آخرین چکاپ" value={scanSummary.lastRun} hint={scanSummary.finishedAt} tone="success" icon={faCalendarDays} />
                <MetricTile label="مقایسه با اسکن قبلی" value="+۲ امتیاز" hint="۵ مورد بهبود یافته" tone="success" icon={faCircleCheck} />
              </div>
            </div>
          </DataPanel>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={faCircleXmark} tone="danger" label="بحرانی" value={toFa(scanSummary.critical)} hint="نیازمند اقدام فوری" />
            <StatCard icon={faTriangleExclamation} tone="warning" label="هشدار" value={toFa(scanSummary.warning)} hint="نیازمند بررسی" />
            <StatCard icon={faLightbulb} tone="info" label="پیشنهاد" value={toFa(scanSummary.suggestion)} hint="بهبود اختیاری" />
            <StatCard icon={faCircleCheck} tone="success" label="موفق" value={toFa(scanSummary.success)} hint="بدون مشکل" />
          </div>

          <DataPanel
            title="نتایج دسته‌بندی‌شده چکاپ"
            desc="نتایج به تفکیک حوزه؛ برای مشاهده جزئیات، شواهد و پیشنهاد YGuard روی «مشاهده جزئیات» بزنید."
            action={
              <FilterChips
                options={severityFilters.map((f) => {
                  const count = issueGroups.reduce(
                    (sum, g) => sum + g.issues.filter((i) => {
                      if (f.key === "all") return true;
                      if (f.key === "ignored") return (overrides[i.id] ?? i.status) === "نادیده گرفته‌شده";
                      return i.severity === f.key && (overrides[i.id] ?? i.status) !== "نادیده گرفته‌شده";
                    }).length,
                    0,
                  );
                  return { key: f.key, label: f.label, count };
                })}
                value={resultFilter}
                onChange={setResultFilter}
              />
            }
          >
            {visibleResultCount === 0 ? (
              <StatePanel
                state={resultFilter === "all" ? "empty" : "no-results"}
                title={resultFilter === "all" ? "نتیجه‌ای برای نمایش نیست" : "موردی با این وضعیت یافت نشد"}
                hint="فیلتر دیگری را انتخاب کنید."
              />
            ) : (
              <div className="divide-y divide-border border-t border-border">
                {groupedResults.map((g) => (
                  <section key={g.id}>
                    <div className="flex items-center justify-between gap-3 bg-muted/40 px-5 py-2.5">
                      <span className="flex items-center gap-2 text-[13px] font-bold">
                        <FontAwesomeIcon icon={g.icon} className="text-muted-foreground" /> {g.title}
                      </span>
                      <StatusPill tone="muted">{toFa(g.issues.length)} مورد</StatusPill>
                    </div>
                    {g.issues.length === 0 ? (
                      <div className="px-5 py-3 text-[12px] text-muted-foreground">موردی در این دسته با فیلتر فعلی وجود ندارد.</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {g.issues.map((i) => {
                          const ignored = i.status === "نادیده گرفته‌شده";
                          const solved = i.status === "حل‌شده";
                          return (
                            <div key={i.id} className={`flex flex-wrap items-start gap-3 px-5 py-3.5 ${ignored ? "opacity-55" : ""}`}>
                              <SeverityTag severity={i.severity} className="mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
                                  {i.title}
                                  <StatusPill tone={solved ? "success" : ignored ? "muted" : "primary"}>{i.status}</StatusPill>
                                </div>
                                <p className="mt-0.5 text-[12px] text-muted-foreground">{i.desc}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><FontAwesomeIcon icon={faTerminal} /> کامپوننت: {i.component}</span>
                                  {i.currentValue && <span>مقدار فعلی: <span className="font-mono" dir="ltr">{i.currentValue}</span></span>}
                                  <span className="flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> شناسایی: {i.detectedAt}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Button size="sm" variant="outline" onClick={() => { setDrawerIssue(i); setDrawerOpen(true); }}>
                                  <FontAwesomeIcon icon={faMagnifyingGlass} /> مشاهده جزئیات
                                </Button>
                                <Button size="sm" variant="ghost" disabled={ignored} onClick={() => setStatus(i, "نادیده گرفته‌شده")}>
                                  <FontAwesomeIcon icon={faEyeSlash} /> نادیده گرفتن
                                </Button>
                                <Button size="sm" variant="secondary" disabled={solved} onClick={() => setStatus(i, "حل‌شده")}>
                                  <FontAwesomeIcon icon={faCheck} /> حل شد
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </DataPanel>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-5 py-4 text-[12px] text-muted-foreground shadow-card">
            <FontAwesomeIcon icon={faFilter} className="text-primary" />
            برای محاسبه مجدد امتیاز پس از رفع موارد، چکاپ جدید را اجرا کنید.
            <Button size="sm" variant="outline" className="ms-auto" onClick={() => { setPhase("setup"); setProgress(START_PROGRESS); setOverrides({}); }}>
              <FontAwesomeIcon icon={faChevronLeft} /> بازگشت به تنظیمات چکاپ
            </Button>
          </div>
        </>
      )}

      {/* ================= DIALOGS & DRAWERS ================= */}
      <AlertDialog open={stopOpen} onOpenChange={setStopOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>چکاپ متوقف شود؟</AlertDialogTitle>
            <AlertDialogDescription>
              با توقف چکاپ، نتایج تا همین مرحله ذخیره می‌شود و امتیاز کامل محاسبه نمی‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ادامه چکاپ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPhase("setup");
                setBackground(false);
                setProgress(START_PROGRESS);
                toast("چکاپ متوقف شد — نتایج جزئی ذخیره شد");
              }}
            >
              توقف چکاپ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="left" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-6 py-5">
            <SheetTitle className="text-right text-base font-extrabold">تنظیمات چکاپ</SheetTitle>
            <SheetDescription className="text-right text-[12px]">
              پیکربندی پیش‌فرض چکاپ‌ها. این تنظیمات فقط رابط کاربری است و اسکنی اجرا نمی‌کند.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold">زمان‌بندی چکاپ خودکار</label>
              <Select defaultValue="daily">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="manual">فقط دستی</SelectItem>
                  <SelectItem value="6h">هر ۶ ساعت</SelectItem>
                  <SelectItem value="daily">روزانه · ساعت ۰۳:۰۰</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {[
              { label: "ارسال گزارش پس از پایان چکاپ", hint: "ایمیل به admin@example.com", on: true },
              { label: "هشدار پیامکی برای موارد بحرانی", hint: "ارسال پیام به شماره مدیر", on: true },
              { label: "بررسی سرویس‌های خارجی", hint: "درگاه پرداخت، پیامک و APIها", on: true },
              { label: "بررسی عمیق فایل‌های هسته", hint: "مقایسه هش فایل‌ها در چکاپ عمیق", on: false },
              { label: "مقایسه خودکار با اسکن قبلی", hint: "نمایش تغییرات در گزارش نهایی", on: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <div>
                  <div className="text-[13px] font-semibold">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground">{s.hint}</div>
                </div>
                <Switch defaultChecked={s.on} />
              </div>
            ))}
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
              آستانه هشدار زمان پاسخ: <span className="font-mono" dir="ltr">600ms</span> · آستانه هشدار Autoload: <span className="font-mono" dir="ltr">1MB</span>
            </div>
          </div>
          <SheetFooter className="border-t border-border px-6 py-4">
            <Button onClick={() => { setSettingsOpen(false); toast.success("تنظیمات چکاپ ذخیره شد"); }}>
              <FontAwesomeIcon icon={faCheck} /> ذخیره تنظیمات
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CheckupResultDrawer
        issue={drawerIssue}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onResolve={(i) => setStatus(i, "حل‌شده")}
        onIgnore={(i) => setStatus(i, "نادیده گرفته‌شده")}
      />
    </div>
  );
}
