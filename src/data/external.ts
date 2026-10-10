import {
  faCreditCard, faCommentSms, faTruckFast, faMapLocationDot, faKey, faCodeBranch,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

export type ServiceStatus = "healthy" | "slow" | "error";

export type ServiceFailure = { time: string; code: string; ms: string; error: string };
export type ServicePoint = { t: string; ms: number };

export type ExternalService = {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  icon: IconDefinition;
  category: string;
  status: ServiceStatus;
  httpStatus: string;
  responseTime: string;
  avgResponse: string;
  uptime: string;
  failures: number;
  lastCheck: string;
  lastSuccess: string;
  lastFail: string;
  monitoring: boolean;
  series: ServicePoint[];
  failureList: ServiceFailure[];
  uptimeHistory: number[];
};

const hours = ["۰۰", "۰۲", "۰۴", "۰۶", "۰۸", "۱۰", "۱۲", "۱۴", "۱۶", "۱۸", "۲۰", "۲۲"];

const series = (values: number[]): ServicePoint[] => hours.map((t, i) => ({ t, ms: values[i] ?? 0 }));

export const externalServices: ExternalService[] = [
  {
    id: "payment", name: "درگاه پرداخت", provider: "زرین‌پال", category: "Payment", icon: faCreditCard,
    endpoint: "api.zarinpal.com/pg/v4/payment/request.json",
    status: "healthy", httpStatus: "200", responseTime: "۴۱۲ms", avgResponse: "۴۴۸ms", uptime: "۹۹.۹۴٪", failures: 3,
    lastCheck: "۱ دقیقه پیش", lastSuccess: "۱ دقیقه پیش", lastFail: "دیروز ۰۳:۱۲", monitoring: true,
    series: series([398, 402, 388, 470, 512, 486, 440, 428, 452, 470, 438, 412]),
    failureList: [
      { time: "دیروز ۰۳:۱۲", code: "503", ms: "۵٬۰۰۰ms", error: "upstream timeout — درخواست پرداخت ناموفق" },
      { time: "۳ روز پیش ۰۱:۴۰", code: "429", ms: "۳۲۰ms", error: "Rate limit exceeded" },
      { time: "۵ روز پیش ۲۲:۰۵", code: "500", ms: "۱٬۲۴۰ms", error: "Internal server error در پاسخ درگاه" },
    ],
    uptimeHistory: [100, 100, 99.9, 100, 100, 99.8, 100, 100, 100, 99.9, 100, 100, 100, 99.7, 100, 100, 100, 100, 99.9, 100, 100, 100, 100, 100, 99.9, 100, 100, 100, 99.94, 100],
  },
  {
    id: "sms", name: "SMS Provider", provider: "ملی پیامک", category: "Communication", icon: faCommentSms,
    endpoint: "api.melipayamak.com/api/send/simple",
    status: "healthy", httpStatus: "200", responseTime: "۲۸۰ms", avgResponse: "۲۹۶ms", uptime: "۹۹.۹۸٪", failures: 2,
    lastCheck: "۲ دقیقه پیش", lastSuccess: "۲ دقیقه پیش", lastFail: "۴ روز پیش ۱۶:۳۰", monitoring: true,
    series: series([264, 258, 272, 288, 296, 284, 274, 268, 290, 302, 286, 280]),
    failureList: [
      { time: "۴ روز پیش ۱۶:۳۰", code: "401", ms: "۱۸۴ms", error: "کلید API موقتاً نامعتبر بود" },
      { time: "۱۱ روز پیش ۰۹:۱۲", code: "502", ms: "۸۲۰ms", error: "Bad gateway از سمت سرویس پیامک" },
    ],
    uptimeHistory: [100, 100, 100, 100, 99.9, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 99.9, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 99.98, 100, 100],
  },
  {
    id: "shipping", name: "Shipping API", provider: "پست ایران", category: "Logistics", icon: faTruckFast,
    endpoint: "api.post.ir/v1/shipments/track",
    status: "slow", httpStatus: "200", responseTime: "۱٬۲۴۰ms", avgResponse: "۱٬۱۸۰ms", uptime: "۹۸.۷۲٪", failures: 14,
    lastCheck: "۳ دقیقه پیش", lastSuccess: "۳ دقیقه پیش", lastFail: "امروز ۱۱:۰۴", monitoring: true,
    series: series([1040, 980, 1120, 1180, 1310, 1240, 1160, 1290, 1340, 1210, 1180, 1240]),
    failureList: [
      { time: "امروز ۱۱:۰۴", code: "504", ms: "۱۰٬۰۰۰ms", error: "Gateway timeout در استعلام مرسوله" },
      { time: "امروز ۰۸:۲۲", code: "200", ms: "۴٬۸۲۰ms", error: "پاسخ بسیار کند (بالای ۳ ثانیه)" },
      { time: "دیروز ۱۹:۳۰", code: "503", ms: "۶٬۱۰۰ms", error: "سرویس موقتاً در دسترس نبود" },
      { time: "۲ روز پیش ۱۰:۱۵", code: "200", ms: "۳٬۹۴۰ms", error: "پاسخ بسیار کند (بالای ۳ ثانیه)" },
    ],
    uptimeHistory: [99.4, 99.1, 98.8, 99.0, 98.4, 98.9, 99.2, 98.1, 98.6, 99.0, 98.7, 98.2, 97.9, 98.4, 99.1, 98.8, 98.6, 98.2, 98.9, 99.2, 98.4, 98.1, 98.7, 98.9, 98.3, 98.6, 98.8, 98.72, 98.9, 99.0],
  },
  {
    id: "google", name: "Google API", provider: "Google Maps Geocoding", category: "Maps", icon: faMapLocationDot,
    endpoint: "maps.googleapis.com/maps/api/geocode/json",
    status: "healthy", httpStatus: "200", responseTime: "۱۹۶ms", avgResponse: "۲۰۸ms", uptime: "۹۹.۹۹٪", failures: 1,
    lastCheck: "۱ دقیقه پیش", lastSuccess: "۱ دقیقه پیش", lastFail: "۹ روز پیش ۱۴:۵۰", monitoring: true,
    series: series([188, 192, 186, 204, 216, 210, 198, 194, 202, 214, 206, 196]),
    failureList: [
      { time: "۹ روز پیش ۱۴:۵۰", code: "403", ms: "۱۴۰ms", error: "سهمیه روزانه API به پایان رسید" },
    ],
    uptimeHistory: Array.from({ length: 30 }, () => 100),
  },
  {
    id: "license", name: "License Server", provider: "YGuard License", category: "Licensing", icon: faKey,
    endpoint: "license.yguard.ir/api/v1/verify",
    status: "error", httpStatus: "522", responseTime: "—", avgResponse: "۳٬۰۱۰ms", uptime: "۹۲.۱۴٪", failures: 47,
    lastCheck: "۱ دقیقه پیش", lastSuccess: "۴۵ دقیقه پیش", lastFail: "۱ دقیقه پیش", monitoring: true,
    series: series([0, 0, 840, 0, 0, 1260, 0, 0, 0, 2140, 0, 0]),
    failureList: [
      { time: "۱ دقیقه پیش", code: "522", ms: "۳۰٬۰۰۰ms", error: "Connection timed out — سرور فعال‌سازی پاسخ نداد" },
      { time: "۸ دقیقه پیش", code: "522", ms: "۳۰٬۰۰۰ms", error: "Connection timed out" },
      { time: "۲۲ دقیقه پیش", code: "504", ms: "۱۵٬۰۰۰ms", error: "Gateway timeout" },
      { time: "۴۵ دقیقه پیش", code: "200", ms: "۱٬۲۴۰ms", error: "پاسخ کند ولی موفق" },
      { time: "۲ ساعت پیش", code: "522", ms: "۳۰٬۰۰۰ms", error: "Connection timed out" },
    ],
    uptimeHistory: [96, 94, 92, 90, 88, 91, 93, 89, 86, 84, 88, 90, 92, 91, 87, 85, 83, 86, 89, 91, 88, 84, 82, 85, 87, 90, 88, 86, 84, 92],
  },
  {
    id: "inventory", name: "Custom API", provider: "انبار داخلی", category: "Internal", icon: faCodeBranch,
    endpoint: "inventory.example.com/api/v2/stock",
    status: "slow", httpStatus: "200", responseTime: "۸۶۰ms", avgResponse: "۸۱۵ms", uptime: "۹۹.۲۰٪", failures: 9,
    lastCheck: "۲ دقیقه پیش", lastSuccess: "۲ دقیقه پیش", lastFail: "امروز ۱۳:۴۰", monitoring: true,
    series: series([760, 780, 820, 810, 880, 910, 840, 820, 790, 860, 880, 860]),
    failureList: [
      { time: "امروز ۱۳:۴۰", code: "500", ms: "۲٬۴۰۰ms", error: "Internal server error در سرویس انبار" },
      { time: "امروز ۰۹:۰۵", code: "200", ms: "۲٬۱۰۰ms", error: "پاسخ کند در زمان اوج کوئری موجودی" },
      { time: "دیروز ۱۵:۲۰", code: "502", ms: "۱٬۸۰۰ms", error: "Bad gateway" },
    ],
    uptimeHistory: [99.6, 99.4, 99.2, 99.5, 99.1, 99.3, 99.0, 99.4, 99.6, 99.2, 98.9, 99.1, 99.3, 99.5, 99.2, 99.0, 98.8, 99.1, 99.4, 99.6, 99.3, 99.1, 98.9, 99.2, 99.4, 99.2, 99.0, 99.2, 99.3, 99.2],
  },
];

export const externalSummary = {
  total: externalServices.length,
  healthy: externalServices.filter((s) => s.status === "healthy").length,
  slow: externalServices.filter((s) => s.status === "slow").length,
  error: externalServices.filter((s) => s.status === "error").length,
  avgResponse: "۴۹۷ms",
  checks24h: 2880,
};

export const serviceStatusMeta: Record<ServiceStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  healthy: { label: "سالم", tone: "success" },
  slow: { label: "کند", tone: "warning" },
  error: { label: "خطادار", tone: "danger" },
};
