import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved, faBolt, faServer, faCircleCheck, faTriangleExclamation, faCircleXmark,
  faDatabase, faClock, faPlug, faGlobe, faLock, faEnvelope, faLayerGroup, faCubes,
  faHeartPulse, faGaugeHigh, faFileCircleCheck, faStopwatch, faBan, faBug, faPlay,
  faMagnifyingGlass, faEye, faCheck, faCode,
} from "@fortawesome/free-solid-svg-icons";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel, StatCard, Pill, IconBadge, toFa, type Tone } from "@/components/yguard/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مرکز کنترل سایت — YGuard" },
      { name: "description", content: "نمای کلی سلامت، امنیت و عملکرد وب‌سایت وردپرسی در YGuard." },
      { property: "og:title", content: "مرکز کنترل سایت — YGuard" },
      { property: "og:description", content: "نمای کلی سلامت، امنیت و عملکرد وب‌سایت وردپرسی در YGuard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "Vazirmatn", fontSize: 12 };
const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

const hours = ["۰۰", "۰۲", "۰۴", "۰۶", "۰۸", "۱۰", "۱۲", "۱۴", "۱۶", "۱۸", "۲۰", "۲۲"];
const response = hours.map((h, i) => ({ h, ms: [390, 360, 340, 355, 420, 480, 520, 610, 470, 440, 455, 410][i], p95: [620, 590, 560, 600, 710, 820, 900, 1120, 830, 760, 780, 690][i] }));
const traffic = hours.map((h, i) => ({ h, req: [1200, 800, 600, 700, 2100, 3400, 3900, 4200, 3700, 3300, 2900, 1900][i] }));
const security = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"].map((d, i) => ({
  d, brute: [12, 18, 9, 24, 15, 31, 17][i], flood: [3, 5, 2, 11, 4, 6, 2][i], scan: [6, 4, 8, 5, 9, 7, 3][i],
}));
const statuses = [
  { name: "2xx", value: 94210, color: "var(--success)" },
  { name: "3xx", value: 3820, color: "var(--info)" },
  { name: "4xx", value: 1640, color: "var(--warning)" },
  { name: "5xx", value: 7, color: "var(--destructive)" },
];

const subScores = [
  { label: "سلامت سایت", value: 96, icon: faHeartPulse, tone: "success" as Tone },
  { label: "امنیت", value: 89, icon: faShieldHalved, tone: "primary" as Tone },
  { label: "Performance", value: 82, icon: faGaugeHigh, tone: "warning" as Tone },
];

type Alert = { id: number; tone: Tone; icon: typeof faServer; title: string; desc: string; time: string; state: "new" | "seen" | "done" };
const initialAlerts: Alert[] = [
  { id: 1, tone: "danger", icon: faCircleXmark, title: "صفحه اصلی پاسخ 503 می‌دهد", desc: "۳ بار در ۱۰ دقیقه گذشته — احتمال اتمام PHP Workers", time: "۴ دقیقه پیش", state: "new" },
  { id: 2, tone: "danger", icon: faBan, title: "حمله Request Flood از یک IP", desc: "۴٬۸۲۰ درخواست از 91.108.4.17 در ۲ دقیقه — به‌صورت موقت مسدود شد", time: "۱۲ دقیقه پیش", state: "new" },
  { id: 3, tone: "warning", icon: faBug, title: "فایل PHP جدید در uploads", desc: "wp-content/uploads/2026/10/cache-x.php شناسایی شد", time: "۳۸ دقیقه پیش", state: "new" },
  { id: 4, tone: "warning", icon: faClock, title: "WP Cron اجرا نشده", desc: "آخرین اجرای موفق ۲ ساعت و ۱۵ دقیقه پیش بوده است", time: "۱ ساعت پیش", state: "seen" },
];

const plugins = [
  { name: "WooCommerce", impact: 87, note: "۲۱۰ms · ۴۸ کوئری" },
  { name: "Elementor", impact: 74, note: "۱۶۵ms · ۳۱ کوئری" },
  { name: "Plugin A", impact: 61, note: "۱۱۰ms · ۱۹ کوئری" },
];

const health: { name: string; icon: typeof faServer; value: string; tone: Tone; status: string }[] = [
  { name: "WordPress", icon: faCode, value: "6.6.2", tone: "success", status: "به‌روز" },
  { name: "PHP", icon: faServer, value: "8.2.12", tone: "success", status: "سالم" },
  { name: "Database", icon: faDatabase, value: "MariaDB 10.11 · ۱۸۴MB", tone: "success", status: "سالم" },
  { name: "REST API", icon: faPlug, value: "۱۲۰ms", tone: "success", status: "در دسترس" },
  { name: "WP Cron", icon: faClock, value: "۲ ساعت تأخیر", tone: "danger", status: "مشکل" },
  { name: "SSL", icon: faLock, value: "۶۴ روز تا انقضا", tone: "success", status: "معتبر" },
  { name: "DNS", icon: faGlobe, value: "Cloudflare · ۱۸ms", tone: "success", status: "سالم" },
  { name: "Email", icon: faEnvelope, value: "SPF ✓ · DKIM ✗", tone: "warning", status: "هشدار" },
  { name: "Page Cache", icon: faLayerGroup, value: "Hit rate ۸۸٪", tone: "success", status: "فعال" },
  { name: "Object Cache", icon: faCubes, value: "غیرفعال", tone: "warning", status: "پیشنهادی" },
];

const activity: { tone: Tone; icon: typeof faServer; title: string; by: string; time: string }[] = [
  { tone: "primary", icon: faPlay, title: "چکاپ سریع انجام شد — امتیاز ۹۴", by: "سیستم", time: "۸ دقیقه پیش" },
  { tone: "danger", icon: faBan, title: "IP 91.108.4.17 مسدود شد", by: "فایروال", time: "۱۲ دقیقه پیش" },
  { tone: "info", icon: faShieldHalved, title: "ورود موفق مدیر از تهران", by: "admin@example.com", time: "۴۰ دقیقه پیش" },
  { tone: "success", icon: faDatabase, title: "بکاپ روزانه دیتابیس ایجاد شد", by: "سیستم", time: "۲ ساعت پیش" },
  { tone: "warning", icon: faPlug, title: "افزونه Elementor به نسخه 3.24 به‌روزرسانی شد", by: "سارا محمدی", time: "۵ ساعت پیش" },
  { tone: "success", icon: faCircleCheck, title: "هشدار «مصرف بالای CPU» حل شد", by: "علی رضایی", time: "دیروز" },
];

function Dashboard() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const setState = (id: number, state: Alert["state"]) => {
    setAlerts((a) => (state === "done" ? a.filter((x) => x.id !== id) : a.map((x) => (x.id === id ? { ...x, state } : x))));
    toast.success(state === "done" ? "هشدار حل‌شده علامت خورد" : "هشدار مشاهده شد");
  };
  const score = 94;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">مرکز کنترل سایت</h1>
          <p className="text-[13px] text-muted-foreground">نمای کلی سلامت، امنیت و عملکرد وب‌سایت</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast("چکاپ سریع شروع شد…")}>
            <FontAwesomeIcon icon={faBolt} /> چکاپ سریع
          </Button>
          <Button onClick={() => toast("چکاپ کامل در صف اجرا قرار گرفت")}>
            <FontAwesomeIcon icon={faPlay} /> شروع چکاپ کامل
          </Button>
        </div>
      </div>

      {/* Site strip */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card px-5 py-3 text-[13px] shadow-card">
        <span className="flex items-center gap-2 font-bold"><FontAwesomeIcon icon={faGlobe} className="text-primary" /><span dir="ltr">example.com</span></span>
        <Pill tone="info"><FontAwesomeIcon icon={faCode} /> WordPress 6.x</Pill>
        <Pill tone="primary"><FontAwesomeIcon icon={faServer} /> PHP 8.x</Pill>
        <Pill tone="success"><FontAwesomeIcon icon={faLock} /> HTTPS فعال</Pill>
        <span className="ms-auto text-muted-foreground"><FontAwesomeIcon icon={faClock} className="me-1" /> آخرین چکاپ: ۸ دقیقه پیش</span>
      </div>

      {/* Overall score */}
      <Panel title="وضعیت کلی سایت">
        <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-5">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="9" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--success)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(score / 100) * 264} 264`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold">{toFa(score)}</span>
                <span className="text-[11px] text-muted-foreground">از ۱۰۰</span>
              </div>
            </div>
            <div>
              <div className="text-[12px] text-muted-foreground">وضعیت</div>
              <div className="mt-1"><Pill tone="success"><FontAwesomeIcon icon={faCircleCheck} /> خوب</Pill></div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {subScores.map((s) => (
              <div key={s.label} className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">{s.label}</span>
                  <IconBadge icon={s.icon} tone={s.tone} className="h-8 w-8 text-xs" />
                </div>
                <div className="mt-1 text-xl font-extrabold">{toFa(s.value)}</div>
                <div className="mt-2 h-1.5 rounded-full bg-border">
                  <div className={`h-full rounded-full ${s.tone === "success" ? "bg-success" : s.tone === "warning" ? "bg-warning" : "bg-primary"}`} style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Uptime</span>
                <IconBadge icon={faServer} tone="info" className="h-8 w-8 text-xs" />
              </div>
              <div className="mt-1 text-xl font-extrabold">۹۹.۹۸٪</div>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i === 17 ? "bg-warning" : "bg-success"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={faFileCircleCheck} tone="success" label="صفحات سالم" value={"\u2066۴۹۲ / ۵۰۰\u2069"} />
        <StatCard icon={faTriangleExclamation} tone="danger" label="هشدارهای بحرانی" value="۳" delta="+۱" />
        <StatCard icon={faStopwatch} tone="info" label="میانگین پاسخ" value="۴۳۸ms" delta="-۸٪" />
        <StatCard icon={faShieldHalved} tone="primary" label="حملات مسدودشده" value="۱۲۶" hint="۲۴ ساعت" />
        <StatCard icon={faCircleXmark} tone="warning" label="خطاهای 5xx" value="۷" hint="۲۴ ساعت" />
        <StatCard icon={faPlug} tone="warning" label="افزونه‌های پرمصرف" value="۴" />
      </div>

      {/* Alerts */}
      <Panel title="نیازمند توجه شما" action={<Pill tone="danger">{toFa(alerts.length)} مورد</Pill>}>
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground"><FontAwesomeIcon icon={faCircleCheck} className="text-success" /> همه موارد رسیدگی شده‌اند</div>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((a) => (
              <div key={a.id} className={`flex flex-wrap items-center gap-3 py-3 ${a.state === "seen" ? "opacity-70" : ""}`}>
                <IconBadge icon={a.icon} tone={a.tone} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {a.title}
                    {a.state === "seen" && <Pill tone="info">مشاهده‌شده</Pill>}
                  </div>
                  <div className="text-[12px] text-muted-foreground">{a.desc} · {a.time}</div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => toast("در حال باز کردن جزئیات…")}><FontAwesomeIcon icon={faMagnifyingGlass} /> بررسی</Button>
                  {a.state !== "seen" && <Button size="sm" variant="ghost" onClick={() => setState(a.id, "seen")}><FontAwesomeIcon icon={faEye} /> تأیید مشاهده</Button>}
                  <Button size="sm" variant="secondary" onClick={() => setState(a.id, "done")}><FontAwesomeIcon icon={faCheck} /> حل شد</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Charts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="زمان پاسخ" action={<Pill>۲۴ ساعت</Pill>}>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer>
              <LineChart data={response} margin={{ left: -15, right: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="h" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip contentStyle={tip} />
                <Line type="monotone" dataKey="ms" name="میانگین" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" name="P95" stroke="var(--chart-4)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="ترافیک درخواست‌ها" action={<Pill>۲۴ ساعت</Pill>}>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={traffic} margin={{ left: -15, right: 8 }}>
                <defs>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="h" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} />
                <Area type="monotone" dataKey="req" name="درخواست" stroke="var(--chart-5)" strokeWidth={2} fill="url(#gr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="رویدادهای امنیتی" action={<Pill>۷ روز</Pill>}>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={security} margin={{ left: -15, right: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="brute" name="Brute Force" stackId="a" fill="var(--chart-3)" />
                <Bar dataKey="flood" name="Request Flood" stackId="a" fill="var(--chart-4)" />
                <Bar dataKey="scan" name="اسکن آسیب‌پذیری" stackId="a" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="HTTP Status Codes" action={<Pill>۲۴ ساعت</Pill>}>
          <div className="flex h-60 items-center gap-4">
            <div className="h-full flex-1" dir="ltr">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip contentStyle={tip} />
                  <Pie data={statuses} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                    {statuses.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-36 space-y-2 text-[13px]">
              {statuses.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /><span dir="ltr">{s.name}</span></span>
                  <span className="font-bold">{toFa(s.value.toLocaleString("en"))}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Plugins + Health */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="افزونه‌های با بیشترین Impact">
          <div className="space-y-4">
            {plugins.map((p) => {
              const tone = p.impact >= 80 ? "bg-destructive" : p.impact >= 70 ? "bg-warning" : "bg-info";
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold" dir="ltr">{p.name}</span>
                    <span className="font-extrabold">{toFa(p.impact)}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-muted"><div className={`h-full rounded-full ${tone}`} style={{ width: `${p.impact}%` }} /></div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{p.note}</div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="سلامت سیستم" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-right text-[12px] text-muted-foreground">
                  <th className="pb-2 font-medium">سرویس</th>
                  <th className="pb-2 font-medium">جزئیات</th>
                  <th className="pb-2 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {health.map((h) => (
                  <tr key={h.name}>
                    <td className="py-2.5"><span className="flex items-center gap-2 font-semibold"><FontAwesomeIcon icon={h.icon} className="w-4 text-muted-foreground" />{h.name}</span></td>
                    <td className="py-2.5 text-muted-foreground">{h.value}</td>
                    <td className="py-2.5"><Pill tone={h.tone}><FontAwesomeIcon icon={h.tone === "success" ? faCircleCheck : h.tone === "warning" ? faTriangleExclamation : faCircleXmark} /> {h.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Activity */}
      <Panel title="فعالیت‌های اخیر">
        <ol className="relative space-y-4 border-s border-border ps-6">
          {activity.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -start-[37px] top-0"><IconBadge icon={e.icon} tone={e.tone} className="h-7 w-7 rounded-full text-[11px]" /></span>
              <div className="text-sm font-semibold">{e.title}</div>
              <div className="text-[12px] text-muted-foreground">{e.by} · {e.time}</div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
