import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck, faCircleInfo, faCircleNotch, faCircleXmark, faInbox, faLightbulb,
  faMagnifyingGlass, faPlugCircleXmark, faRotate, faSpinner, faTriangleExclamation,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toFa } from "@/components/yguard/ui";

/* ------------------------------------------------------------------ *
 * Status & severity tokens — same visual language as the dashboard.
 * ------------------------------------------------------------------ */

export type StatusTone = "success" | "warning" | "danger" | "info" | "primary" | "muted";

const toneClass: Record<StatusTone, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
  info: "bg-info/12 text-info",
  primary: "bg-primary-soft text-primary",
  muted: "bg-muted text-muted-foreground",
};

export function StatusPill({ tone = "muted", icon, children, className }: { tone?: StatusTone; icon?: IconDefinition; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", toneClass[tone], className)}>
      {icon && <FontAwesomeIcon icon={icon} className="text-[10px]" />}
      {children}
    </span>
  );
}

export type SeverityKey = "critical" | "warning" | "suggestion" | "success" | "review";

export const severityMeta: Record<SeverityKey, { label: string; tone: StatusTone; icon: IconDefinition }> = {
  critical: { label: "بحرانی", tone: "danger", icon: faCircleXmark },
  warning: { label: "هشدار", tone: "warning", icon: faTriangleExclamation },
  suggestion: { label: "پیشنهاد", tone: "info", icon: faLightbulb },
  success: { label: "موفق", tone: "success", icon: faCircleCheck },
  review: { label: "نیازمند بررسی", tone: "primary", icon: faCircleInfo },
};

export function SeverityTag({ severity, className }: { severity: SeverityKey; className?: string }) {
  const m = severityMeta[severity];
  return <StatusPill tone={m.tone} icon={m.icon} className={className}>{m.label}</StatusPill>;
}

export type StageState = "waiting" | "running" | "passed" | "warning" | "critical";

export const stageMeta: Record<StageState, { label: string; tone: StatusTone; icon: IconDefinition }> = {
  waiting: { label: "در انتظار", tone: "muted", icon: faCircleNotch },
  running: { label: "در حال بررسی", tone: "info", icon: faSpinner },
  passed: { label: "موفق", tone: "success", icon: faCircleCheck },
  warning: { label: "هشدار", tone: "warning", icon: faTriangleExclamation },
  critical: { label: "بحرانی", tone: "danger", icon: faCircleXmark },
};

export function StageTag({ state, className }: { state: StageState; className?: string }) {
  const m = stageMeta[state];
  return (
    <StatusPill tone={m.tone} icon={m.icon} className={className}>
      <span className={state === "running" ? "animate-pulse" : undefined}>{m.label}</span>
    </StatusPill>
  );
}

export type HealthStatus = "ok" | "warning" | "critical" | "review";

export const healthStatusMeta: Record<HealthStatus, { label: string; tone: StatusTone; icon: IconDefinition }> = {
  ok: { label: "موفق", tone: "success", icon: faCircleCheck },
  warning: { label: "هشدار", tone: "warning", icon: faTriangleExclamation },
  critical: { label: "بحرانی", tone: "danger", icon: faCircleXmark },
  review: { label: "نیازمند بررسی", tone: "info", icon: faCircleInfo },
};

export function HealthTag({ status, className }: { status: HealthStatus; className?: string }) {
  const m = healthStatusMeta[status];
  return <StatusPill tone={m.tone} icon={m.icon} className={className}>{m.label}</StatusPill>;
}

/* ------------------------------------------------------------------ *
 * Layout helpers
 * ------------------------------------------------------------------ */

export const thCls = "px-5 py-2.5 text-right text-[11px] font-semibold text-muted-foreground whitespace-nowrap";
export const tdCls = "px-5 py-3 text-[13px] align-middle";

export function DataPanel({ title, desc, action, children, className, padded = false }: { title?: ReactNode; desc?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-bold">{title}</h3>}
            {desc && <p className="mt-0.5 text-[12px] text-muted-foreground">{desc}</p>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function KeyValue({ label, value, mono, dir, valueClassName }: { label: ReactNode; value: ReactNode; mono?: boolean; dir?: "ltr" | "rtl"; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span dir={dir} className={cn("text-[13px] font-semibold", mono && "font-mono text-[12px]", valueClassName)}>{value}</span>
    </div>
  );
}

export function MetricTile({ label, value, hint, tone = "primary", icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: StatusTone; icon?: IconDefinition }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        {icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-md text-[11px]", toneClass[tone])}>
            <FontAwesomeIcon icon={icon} />
          </span>
        )}
      </div>
      <div className="mt-1 text-lg font-extrabold tracking-tight" dir="auto">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function ScoreDial({ value, size = 136, tone = "success", label = "از ۱۰۰", caption }: { value: number; size?: number; tone?: "success" | "warning" | "danger" | "primary"; label?: string; caption?: ReactNode }) {
  const color = tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : tone === "danger" ? "var(--destructive)" : "var(--primary)";
  const r = 42;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(value / 100) * circumference} ${circumference}`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight">{toFa(value)}</span>
          <span className="text-[11px] text-muted-foreground">{label}</span>
        </div>
      </div>
      {caption}
    </div>
  );
}

export function ProgressBar({ value, tone = "primary", striped, className }: { value: number; tone?: StatusTone; striped?: boolean; className?: string }) {
  const bg = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : tone === "danger" ? "bg-destructive" : tone === "info" ? "bg-info" : "bg-primary";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", bg, striped && "bg-brand bg-[length:200%_100%]")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function StorageBar({ total, used, free, unit = "GB" }: { total: number; used: number; free: number; unit?: string }) {
  const usedPct = Math.round((used / total) * 100);
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" dir="ltr">
        <div className="bg-primary" style={{ width: `${usedPct}%` }} />
        <div className="bg-info/50" style={{ width: `${Math.round((free / total) * 100)}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
        <div><div className="text-muted-foreground">کل فضا</div><div className="mt-0.5 font-bold" dir="ltr">{toFa(total)} {unit}</div></div>
        <div><div className="text-muted-foreground">استفاده‌شده</div><div className="mt-0.5 font-bold text-primary" dir="ltr">{toFa(used)} {unit} · {toFa(usedPct)}٪</div></div>
        <div><div className="text-muted-foreground">فضای آزاد</div><div className="mt-0.5 font-bold text-info" dir="ltr">{toFa(free)} {unit}</div></div>
      </div>
    </div>
  );
}

export function UptimeStrip({ days, warnAt = [], label }: { days: number[]; warnAt?: number[]; label?: string }) {
  return (
    <div>
      {label && <div className="mb-1 text-[11px] text-muted-foreground">{label}</div>}
      <div className="flex items-end gap-[3px]" dir="ltr">
        {days.map((d, i) => (
          <TooltipProvider key={i} delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn("h-4 w-1.5 rounded-sm", warnAt.includes(i) ? "bg-warning" : "bg-success/70")} />
              </TooltipTrigger>
              <TooltipContent dir="rtl" className="text-[11px]">{toFa(d)}٪ در روز {toFa(i + 1)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

export function Timeline({ items }: { items: { time: string; title: string; desc?: string; tone?: StatusTone; icon?: IconDefinition }[] }) {
  return (
    <ol className="relative space-y-4 border-s border-border ps-5">
      {items.map((e, i) => (
        <li key={i} className="relative">
          <span className={cn("absolute -start-[30px] top-0 flex h-5 w-5 items-center justify-center rounded-full text-[9px]", toneClass[e.tone ?? "primary"])}>
            <FontAwesomeIcon icon={e.icon ?? faCircleNotch} />
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
            {e.title}
            <span className="text-[11px] font-normal text-muted-foreground">{e.time}</span>
          </div>
          {e.desc && <div className="text-[12px] text-muted-foreground">{e.desc}</div>}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ *
 * Filters
 * ------------------------------------------------------------------ */

export function FilterChips<T extends string>({ options, value, onChange }: { options: { key: T; label: string; count?: number; tone?: StatusTone }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "flex h-8 items-center gap-2 rounded-lg border px-3 text-[12px] font-medium transition-colors",
              active ? "border-primary/40 bg-primary-soft text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", active ? "bg-card text-primary" : "bg-muted text-muted-foreground")}>{toFa(o.count)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = "جستجو…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] focus-within:border-primary/40", className)}>
      <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
      {value && (
        <button onClick={() => onChange("")} className="text-[11px] text-muted-foreground hover:text-foreground">پاک کردن</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * States
 * ------------------------------------------------------------------ */

export type ViewState = "loading" | "ready" | "empty" | "error";

export function useMockState(delay = 700) {
  const [state, setState] = useState<ViewState>("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setState("ready"), delay);
    return () => window.clearTimeout(t);
  }, [delay]);
  return { state, setState } as const;
}

export function StateSwitcher({ value, onChange }: { value: ViewState; onChange: (v: ViewState) => void }) {
  const opts: { key: ViewState; label: string }[] = [
    { key: "ready", label: "داده کامل" },
    { key: "loading", label: "بارگذاری" },
    { key: "empty", label: "خالی" },
    { key: "error", label: "خطا" },
  ];
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
            {opts.map((o) => (
              <button
                key={o.key}
                onClick={() => onChange(o.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  value === o.key ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent dir="rtl" className="max-w-64 text-[11px] leading-5">
          پیش‌نمایش حالت‌های رابط: بارگذاری، اسکلتون، خالی، بدون نتیجه، خطا و موفق.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function StatePanel({ state, title, hint, onRetry, className }: { state: "empty" | "error" | "no-results" | "success"; title?: string; hint?: string; onRetry?: () => void; className?: string }) {
  const preset = {
    empty: { icon: faInbox, tone: "muted" as StatusTone, title: "داده‌ای برای نمایش نیست", hint: "پس از اجرای اولین چکاپ، نتایج در همین بخش نمایش داده می‌شود." },
    "no-results": { icon: faMagnifyingGlass, tone: "muted" as StatusTone, title: "نتیجه‌ای یافت نشد", hint: "فیلترها یا عبارت جستجو را تغییر دهید." },
    error: { icon: faPlugCircleXmark, tone: "danger" as StatusTone, title: "دریافت داده با خطا مواجه شد", hint: "اتصال به سرویس پایش برقرار نشد. دوباره تلاش کنید." },
    success: { icon: faCircleCheck, tone: "success" as StatusTone, title: "همه‌چیز مرتب است", hint: "موردی نیازمند توجه پیدا نشد." },
  }[state];
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-full text-lg", toneClass[preset.tone])}>
        <FontAwesomeIcon icon={preset.icon} />
      </span>
      <div>
        <div className="text-sm font-bold">{title ?? preset.title}</div>
        <div className="mt-1 text-[12px] text-muted-foreground">{hint ?? preset.hint}</div>
      </div>
      {state === "error" && onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <FontAwesomeIcon icon={faRotate} /> تلاش دوباره
        </Button>
      )}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-lg", className)} />;
}

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3 px-5 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, c) => (
            <SkeletonBlock key={c} className={cn("h-4", c === 0 ? "w-32" : "w-full")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingPanel({ label = "در حال دریافت داده…", rows }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-5">
      <DataPanel>
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 text-[13px] text-muted-foreground">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-primary" /> {label}
        </div>
        <SkeletonRows rows={rows ?? 5} cols={4} />
      </DataPanel>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <SkeletonBlock className="h-9 w-9" />
            <SkeletonBlock className="h-6 w-20" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page header
 * ------------------------------------------------------------------ */

export function PageHeader({ icon, title, subtitle, actions, extra }: { icon: IconDefinition; title: string; subtitle: string; actions?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <FontAwesomeIcon icon={icon} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-[13px] text-muted-foreground">{subtitle}</p>
          {extra && <div className="mt-1.5">{extra}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
