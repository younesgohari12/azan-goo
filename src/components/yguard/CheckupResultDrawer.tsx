import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck, faEyeSlash, faLightbulb, faClock, faCircleCheck, faCircleInfo, faFileLines,
  faMagnifyingGlassChart,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { KeyValue, SeverityTag, StatusPill, severityMeta } from "@/components/yguard/blocks";
import type { Issue } from "@/data/checkup";

export function CheckupResultDrawer({
  issue, open, onOpenChange, onResolve, onIgnore,
}: {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (issue: Issue) => void;
  onIgnore: (issue: Issue) => void;
}) {
  const severity = issue ? severityMeta[issue.severity] : severityMeta.review;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {issue && (
          <>
            <div className="border-b border-border px-6 py-5 pe-12">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityTag severity={issue.severity} />
                <StatusPill tone={issue.status === "حل‌شده" ? "success" : issue.status === "نادیده گرفته‌شده" ? "muted" : "primary"}>
                  وضعیت: {issue.status}
                </StatusPill>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <FontAwesomeIcon icon={faClock} /> شناسایی: {issue.detectedAt}
                </span>
              </div>
              <SheetTitle className="mt-2 text-right text-base font-extrabold leading-6">{issue.title}</SheetTitle>
              <SheetDescription className="mt-1 text-right text-[12px] leading-6">{issue.desc}</SheetDescription>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-2 flex items-center gap-2 text-[13px] font-bold">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-primary" /> اطلاعات کلی
                </h4>
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <KeyValue label="عنوان مشکل" value={issue.title} />
                  <KeyValue label="سطح شدت" value={severity.label} />
                  <KeyValue label="کامپوننت درگیر" value={issue.component} dir="auto" />
                  <KeyValue label="زمان شناسایی" value={issue.detectedAt} />
                  <KeyValue label="مقدار فعلی" value={issue.currentValue ?? "—"} mono dir="ltr" />
                  <KeyValue label="مقدار مورد انتظار" value={issue.expectedValue ?? "—"} mono dir="ltr" />
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-2 flex items-center gap-2 text-[13px] font-bold">
                  <FontAwesomeIcon icon={faMagnifyingGlassChart} className="text-info" /> شواهد (Evidence)
                </h4>
                <div className="divide-y divide-border">
                  {issue.evidence.map((e, i) => (
                    <KeyValue key={i} label={e.label} value={e.value} dir="auto" />
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-2 flex items-center gap-2 text-[13px] font-bold">
                  <FontAwesomeIcon icon={faFileLines} className="text-muted-foreground" /> جزئیات فنی
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <tbody className="divide-y divide-border">
                      {issue.technical.map((t, i) => (
                        <tr key={i}>
                          <td className="py-2 pe-6 text-muted-foreground">{t.label}</td>
                          <td className="py-2 font-mono text-[11px]" dir="auto">{t.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-info/30 bg-info/8 p-4">
                <h4 className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-info">
                  <FontAwesomeIcon icon={faLightbulb} /> پیشنهاد YGuard
                </h4>
                <p className="text-[12px] leading-6 text-foreground/90">{issue.recommendation}</p>
              </section>

              <section className="rounded-xl border border-border bg-muted/50 p-4 text-[12px] text-muted-foreground">
                این مورد بخشی از چکاپ استاندارد است. اعمال تغییرات به‌صورت خودکار انجام نمی‌شود و پس از
                بررسی شما علامت‌گذاری می‌شود.
              </section>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-4">
              <Button onClick={() => onResolve(issue)}>
                <FontAwesomeIcon icon={faCircleCheck} /> علامت‌گذاری به‌عنوان حل‌شده
              </Button>
              <Button variant="outline" onClick={() => onIgnore(issue)}>
                <FontAwesomeIcon icon={faEyeSlash} /> نادیده گرفتن
              </Button>
              <Button variant="ghost" className="ms-auto" onClick={() => onOpenChange(false)}>
                <FontAwesomeIcon icon={faCheck} /> بستن
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
