import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const toFa = (v: string | number) => String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹".charAt(+d));

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-bold">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const tones = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
  info: "bg-info/12 text-info",
};
export type Tone = keyof typeof tones;

export function IconBadge({ icon, tone = "primary", className }: { icon: IconDefinition; tone?: Tone; className?: string }) {
  return (
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tones[tone], className)}>
      <FontAwesomeIcon icon={icon} />
    </div>
  );
}

export function Pill({ tone = "primary", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}

export function StatCard({ icon, tone, label, value, delta, hint }: { icon: IconDefinition; tone: Tone; label: string; value: string; delta?: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between">
        <IconBadge icon={icon} tone={tone} />
        {delta && <Pill tone={tone}>{delta}</Pill>}
      </div>
      <div className="mt-4 text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-0.5 text-[12px] text-muted-foreground">{label}{hint && <span> · {hint}</span>}</div>
    </div>
  );
}
