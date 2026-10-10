import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight, faBan, faPenToSquare, faClock, faCircleCheck, faTriangleExclamation,
  faCircleXmark, faGaugeHigh, faCalendarDays, faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DataPanel, KeyValue, StatusPill, Timeline, UptimeStrip, tdCls, thCls } from "@/components/yguard/blocks";
import { serviceStatusMeta, type ExternalService } from "@/data/external";
import { toFa } from "@/components/yguard/ui";

const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "Vazirmatn", fontSize: 12 };
const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

export function ServiceDrawer({
  service, open, onOpenChange, onRecheck, onToggleMonitoring, onEdit,
}: {
  service: ExternalService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecheck: (service: ExternalService) => void;
  onToggleMonitoring: (service: ExternalService) => void;
  onEdit: (service: ExternalService) => void;
}) {
  const meta = service ? serviceStatusMeta[service.status] : serviceStatusMeta.healthy;
  const statusIcon = service?.status === "healthy" ? faCircleCheck : service?.status === "slow" ? faTriangleExclamation : faCircleXmark;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {service && (
          <>
            <div className="border-b border-border px-6 py-5 pe-12">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={meta.tone} icon={statusIcon}>{meta.label}</StatusPill>
                <StatusPill tone="muted">{service.category}</StatusPill>
                <StatusPill tone={service.monitoring ? "info" : "muted"}>
                  {service.monitoring ? "مانیتورینگ فعال" : "مانیتورینگ غیرفعال"}
                </StatusPill>
              </div>
              <SheetTitle className="mt-2 flex items-center gap-2 text-right text-base font-extrabold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FontAwesomeIcon icon={service.icon} />
                </span>
                {service.name}
                <span className="text-[12px] font-medium text-muted-foreground">· {service.provider}</span>
              </SheetTitle>
              <SheetDescription className="mt-1 text-right font-mono text-[12px]" dir="ltr">{service.endpoint}</SheetDescription>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-2 flex items-center gap-2 text-[13px] font-bold">
                  <FontAwesomeIcon icon={faGaugeHigh} className="text-primary" /> وضعیت فعلی سرویس
                </h4>
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <KeyValue label="وضعیت فعلی" value={<StatusPill tone={meta.tone} icon={statusIcon}>{meta.label}</StatusPill>} />
                  <KeyValue label="HTTP Status" value={service.httpStatus} mono dir="ltr" />
                  <KeyValue label="زمان پاسخ" value={service.responseTime} mono dir="ltr" />
                  <KeyValue label="میانگین زمان پاسخ" value={service.avgResponse} mono dir="ltr" />
                  <KeyValue label="Uptime" value={service.uptime} />
                  <KeyValue label="تعداد خطا" value={`${toFa(service.failures)} خطا`} />
                  <KeyValue label="آخرین درخواست موفق" value={service.lastSuccess} />
                  <KeyValue label="آخرین درخواست ناموفق" value={service.lastFail} />
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-bold">
                  <FontAwesomeIcon icon={faChartLine} className="text-info" /> زمان پاسخ در ۲۴ ساعت گذشته
                </h4>
                <div className="h-48" dir="ltr">
                  <ResponsiveContainer>
                    <AreaChart data={service.series} margin={{ left: -14, right: 8 }}>
                      <defs>
                        <linearGradient id={`svc-${service.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="t" tick={axis} axisLine={false} tickLine={false} />
                      <YAxis tick={axis} axisLine={false} tickLine={false} unit="ms" />
                      <Tooltip contentStyle={tip} />
                      <Area type="monotone" dataKey="ms" name="زمان پاسخ" stroke="var(--chart-1)" strokeWidth={2} fill={`url(#svc-${service.id})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-2 flex items-center gap-2 text-[13px] font-bold">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-warning" /> خطاهای اخیر
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-[12px]">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className={thCls}>زمان</th>
                        <th className={thCls}>HTTP Status</th>
                        <th className={thCls}>زمان پاسخ</th>
                        <th className={thCls}>خطا</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {service.failureList.map((f, i) => (
                        <tr key={i}>
                          <td className={tdCls}>{f.time}</td>
                          <td className={tdCls}><span className="font-mono" dir="ltr">{f.code}</span></td>
                          <td className={tdCls}><span className="font-mono" dir="ltr">{f.ms}</span></td>
                          <td className={`${tdCls} text-muted-foreground`}>{f.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-bold">
                  <FontAwesomeIcon icon={faClock} className="text-muted-foreground" /> تاریخچه Uptime
                </h4>
                <UptimeStrip days={service.uptimeHistory} warnAt={service.uptimeHistory.map((d, i) => (d < 99 ? i : -1)).filter((i) => i >= 0)} label="۳۰ روز گذشته" />
                <div className="mt-4">
                  <Timeline
                    items={[
                      ...service.failureList.slice(0, 3).map((f) => ({
                        time: f.time,
                        title: `خطای ${f.code} — ${f.ms}`,
                        desc: f.error,
                        tone: "danger" as const,
                        icon: faCircleXmark,
                      })),
                      { time: service.lastSuccess, title: "آخرین پاسخ موفق", desc: `زمان پاسخ ${service.responseTime} · HTTP ${service.httpStatus}`, tone: "success" as const, icon: faCircleCheck },
                    ]}
                  />
                </div>
              </section>

              <DataPanel className="border-dashed" padded>
                <div className="text-[12px] text-muted-foreground">
                  این سرویس در {toFa(2880)} بررسی ۲۴ ساعت گذشته {toFa(service.failures)} خطا داشته است. اقدام‌های این بخش فقط شبیه‌سازی رابط کاربری است.
                </div>
              </DataPanel>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-4">
              <Button onClick={() => onRecheck(service)}>
                <FontAwesomeIcon icon={faArrowRotateRight} /> بررسی مجدد
              </Button>
              <Button variant="outline" onClick={() => onToggleMonitoring(service)}>
                <FontAwesomeIcon icon={faBan} /> {service.monitoring ? "غیرفعال کردن مانیتورینگ" : "فعال کردن مانیتورینگ"}
              </Button>
              <Button variant="ghost" onClick={() => onEdit(service)}>
                <FontAwesomeIcon icon={faPenToSquare} /> ویرایش
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
