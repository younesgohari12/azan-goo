import {
  faCode, faServer, faTerminal, faDatabase, faPlug, faClock, faLock, faGlobe, faEnvelope,
  faLayerGroup, faRotate, type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import type { HealthStatus } from "@/components/yguard/blocks";

export type HealthItem = {
  id: string;
  title: string;
  status: HealthStatus;
  current: string;
  recommended: string;
  currentDir?: "ltr";
  note?: string;
};

export type HealthExtraRow = { label: string; value: string; dir?: "ltr" };

export type HealthSection = {
  id: string;
  title: string;
  desc: string;
  icon: IconDefinition;
  items: HealthItem[];
  extra?: HealthExtraRow[];
  actions?: "email-test";
};

export const healthScore = { score: 96, status: "خوب", checkedCount: 127, lastCheck: "۸ دقیقه پیش", trend: "+۲ نسبت به هفته گذشته" };

export const healthSummary: { title: string; icon: IconDefinition; score: number; status: HealthStatus; hint: string }[] = [
  { title: "WordPress", icon: faCode, score: 94, status: "ok", hint: "6.6.2 · ۴ افزونه نیازمند بروزرسانی" },
  { title: "Server", icon: faServer, score: 88, status: "warning", hint: "دیسک ۸۲٪ · پاسخ ۲۱۴ms" },
  { title: "PHP", icon: faTerminal, score: 92, status: "ok", hint: "8.2.12 · OPcache فعال" },
  { title: "Database", icon: faDatabase, score: 85, status: "warning", hint: "Autoload ۴.۸MB" },
  { title: "REST API", icon: faPlug, score: 100, status: "ok", hint: "/wp-json/ · ۱۱۸ms" },
  { title: "Cron", icon: faClock, score: 72, status: "critical", hint: "۷ وظیفه معوق" },
  { title: "SSL", icon: faLock, score: 100, status: "ok", hint: "۸۷ روز تا انقضا" },
  { title: "DNS", icon: faGlobe, score: 98, status: "ok", hint: "Cloudflare · ۱۸ms" },
];

export const healthSections: HealthSection[] = [
  {
    id: "wordpress", title: "سلامت WordPress", desc: "نسخه هسته، بروزرسانی‌ها، تنظیمات پایه و مجوزهای فایل‌سیستم",
    icon: faCode,
    items: [
      { id: "wp-version", title: "نسخه وردپرس", status: "ok", current: "6.6.2", recommended: "6.6.2 یا بالاتر" },
      { id: "wp-updates", title: "بروزرسانی وردپرس", status: "ok", current: "آخرین نسخه نصب است", recommended: "بروزرسانی خودکار فعال" },
      { id: "wp-plugin-updates", title: "بروزرسانی افزونه‌ها", status: "warning", current: "۴ افزونه نیازمند بروزرسانی", recommended: "۰ افزونه" },
      { id: "wp-theme-updates", title: "بروزرسانی قالب‌ها", status: "warning", current: "۲ قالب نیازمند بروزرسانی", recommended: "۰ قالب" },
      { id: "wp-debug", title: "حالت Debug", status: "ok", current: "خاموش", recommended: "خاموش در محیط تولید" },
      { id: "wp-debug-flag", title: "WP_DEBUG", status: "ok", current: "false", recommended: "false", currentDir: "ltr" },
      { id: "wp-debug-log", title: "WP_DEBUG_LOG", status: "review", current: "false", recommended: "فقط در جلسات عیب‌یابی", currentDir: "ltr" },
      { id: "wp-debug-display", title: "WP_DEBUG_DISPLAY", status: "critical", current: "true", recommended: "false", currentDir: "ltr" },
      { id: "wp-siteurl", title: "Site URL", status: "ok", current: "https://example.com", recommended: "دامنه اصلی با HTTPS", currentDir: "ltr" },
      { id: "wp-homeurl", title: "Home URL", status: "ok", current: "https://example.com", recommended: "دامنه اصلی با HTTPS", currentDir: "ltr" },
      { id: "wp-permalinks", title: "Permalinks", status: "ok", current: "/%postname%/", recommended: "ساختار سئوپسند و پایدار", currentDir: "ltr" },
      { id: "wp-timezone", title: "Timezone", status: "ok", current: "Asia/Tehran · UTC+3:30", recommended: "هم‌تراز با منطقه کاربران", currentDir: "ltr" },
      { id: "wp-https", title: "HTTPS", status: "ok", current: "فعال · TLS 1.3", recommended: "فعال" },
      { id: "wp-fs", title: "مجوزهای فایل‌سیستم", status: "warning", current: "wp-content قابل نوشتن · مجوز ۷۵۵", recommended: "فقط uploads با مجوز ۷۵۵" },
    ],
    extra: [
      { label: "قالب فعال", value: "Twenty Twenty-Four · قالب فرزند فعال" },
      { label: "تعداد افزونه نصب‌شده", value: "۲۴ · فعال ۱۸" },
    ],
  },
  {
    id: "php", title: "سلامت PHP", desc: "نسخه، محدودیت‌های اجرا، OPcache و نمایش خطاها",
    icon: faTerminal,
    items: [
      { id: "php-version", title: "PHP Version", status: "ok", current: "8.2.12", recommended: "8.2 یا بالاتر", currentDir: "ltr" },
      { id: "php-memory", title: "memory_limit", status: "ok", current: "256M", recommended: "256M یا بیشتر", currentDir: "ltr" },
      { id: "php-time", title: "max_execution_time", status: "ok", current: "120", recommended: "۹۰ تا ۱۲۰ ثانیه", currentDir: "ltr" },
      { id: "php-upload", title: "upload_max_filesize", status: "warning", current: "8M", recommended: "۳۲M یا بیشتر", currentDir: "ltr" },
      { id: "php-post", title: "post_max_size", status: "warning", current: "8M", recommended: "۳۲M یا بیشتر", currentDir: "ltr" },
      { id: "php-input-vars", title: "max_input_vars", status: "warning", current: "1000", recommended: "۳٬۰۰۰ یا بیشتر", currentDir: "ltr" },
      { id: "php-opcache", title: "OPcache", status: "ok", current: "فعال · Hit Rate ۹۴٪", recommended: "فعال با حافظه کافی" },
      { id: "php-display", title: "display_errors", status: "critical", current: "On", recommended: "Off", currentDir: "ltr" },
    ],
    extra: [
      { label: "PHP SAPI", value: "FPM/FastCGI" },
      { label: "حداکثر حافظه مصرفی چکاپ", value: "۱۱۲MB از ۲۵۶MB" },
    ],
  },
  {
    id: "server", title: "سلامت سرور", desc: "وب‌سرور، زمان پاسخ، فضای دیسک، فشرده‌سازی و پروتکل‌ها",
    icon: faServer,
    items: [
      { id: "srv-web", title: "Web Server", status: "ok", current: "nginx/1.26.1", recommended: "نسخه پایدار و بروزرسانی‌شده", currentDir: "ltr" },
      { id: "srv-response", title: "Server response time", status: "ok", current: "۲۱۴ms", recommended: "زیر ۳۰۰ms" },
      { id: "srv-disk", title: "Disk usage", status: "warning", current: "۴۱.۲GB از ۵۰GB (۸۲٪)", recommended: "زیر ۷۰٪" },
      { id: "srv-free", title: "Disk free space", status: "warning", current: "۸.۸GB", recommended: "بیش از ۱۵GB" },
      { id: "srv-tz", title: "Server timezone", status: "review", current: "UTC", recommended: "هم‌تراز با منطقه سایت", currentDir: "ltr" },
      { id: "srv-https", title: "HTTPS", status: "ok", current: "فعال · TLS 1.3", recommended: "فعال با ریدایرکت اجباری" },
      { id: "srv-compression", title: "Compression", status: "ok", current: "Brotli · ۷۲٪", recommended: "Brotli یا Gzip فعال" },
      { id: "srv-http2", title: "HTTP/2 یا HTTP/3", status: "review", current: "HTTP/2", recommended: "HTTP/2 + HTTP/3", currentDir: "ltr" },
    ],
    extra: [
      { label: "Load Average", value: "۱.۲ / ۱.۴ / ۱.۱" },
      { label: "کشور سرور", value: "آلمان · فرانکفورت" },
    ],
  },
  {
    id: "database", title: "سلامت دیتابیس", desc: "اتصال، حجم، Autoload، کوئری‌های کند و داده‌های اضافه",
    icon: faDatabase,
    items: [
      { id: "db-connection", title: "Database connection", status: "ok", current: "برقرار · ۱۲ms", recommended: "برقرار و پایدار" },
      { id: "db-version", title: "Database version", status: "ok", current: "MariaDB 10.11.6", recommended: "10.11 یا بالاتر", currentDir: "ltr" },
      { id: "db-size", title: "Database size", status: "ok", current: "۱۸۴MB", recommended: "زیر ۵۰۰MB" },
      { id: "db-tables", title: "Table count", status: "ok", current: "۳۸ جدول", recommended: "بدون جدول اضافه" },
      { id: "db-autoload", title: "Autoload size", status: "warning", current: "۴.۸MB", recommended: "زیر ۱MB" },
      { id: "db-slow", title: "Slow queries", status: "warning", current: "۲ کوئری بالای ۵۰۰ms", recommended: "۰ کوئری کند" },
      { id: "db-transients", title: "Expired transients", status: "warning", current: "۱٬۲۴۰ رکورد · ۱۸MB", recommended: "۰ رکورد منقضی" },
      { id: "db-revisions", title: "Revisions", status: "review", current: "۲۱۰ نسخه", recommended: "حداکثر ۵ نسخه برای هر نوشته" },
    ],
    extra: [
      { label: "بزرگ‌ترین جدول", value: "wp_postmeta · ۴۸MB" },
      { label: "Engine", value: "InnoDB" },
    ],
  },
  {
    id: "rest", title: "REST API", desc: "در دسترس بودن، زمان پاسخ و کد وضعیت /wp-json/",
    icon: faPlug,
    items: [
      { id: "rest-status", title: "REST API Status", status: "ok", current: "در دسترس", recommended: "در دسترس" },
      { id: "rest-time", title: "Response Time", status: "ok", current: "۱۱۸ms", recommended: "زیر ۳۰۰ms" },
      { id: "rest-code", title: "Status Code", status: "ok", current: "200", recommended: "200", currentDir: "ltr" },
      { id: "rest-last", title: "Last Check", status: "ok", current: "۲ دقیقه پیش", recommended: "بررسی منظم هر ۵ دقیقه" },
    ],
    extra: [
      { label: "Endpoint", value: "/wp-json/", dir: "ltr" },
      { label: "Namespace پیش‌فرض", value: "wp/v2", dir: "ltr" },
    ],
  },
  {
    id: "loopback", title: "Loopback Request", desc: "بررسی درخواست داخلی سرور به خودش (پیش‌نیاز WP-Cron و بروزرسانی‌ها)",
    icon: faRotate,
    items: [
      { id: "lb-status", title: "Loopback Request", status: "ok", current: "موفق", recommended: "موفق" },
      { id: "lb-time", title: "Response Time", status: "ok", current: "۲۴۶ms", recommended: "زیر ۵۰۰ms" },
      { id: "lb-last", title: "Last Check", status: "ok", current: "۲ دقیقه پیش", recommended: "بررسی همراه هر چکاپ" },
    ],
  },
  {
    id: "cron", title: "WP Cron", desc: "اجرای زمان‌بندی‌شده، وظایف معوق و رویداد بعدی",
    icon: faClock,
    items: [
      { id: "cron-status", title: "Cron status", status: "critical", current: "دارای تأخیر", recommended: "اجرای به‌موقع هر ۵ دقیقه" },
      { id: "cron-last", title: "Last successful run", status: "warning", current: "۲ ساعت و ۱۵ دقیقه پیش", recommended: "کمتر از ۱۵ دقیقه پیش" },
      { id: "cron-delayed", title: "Delayed jobs", status: "warning", current: "۷ وظیفه", recommended: "۰ وظیفه معوق" },
      { id: "cron-failed", title: "Failed jobs", status: "warning", current: "۲ وظیفه", recommended: "۰ وظیفه ناموفق" },
      { id: "cron-next", title: "Next scheduled event", status: "review", current: "woocommerce_cleanup_sessions · ۱۴:۳۰", recommended: "اجرای دقیق در زمان مقرر" },
    ],
    extra: [
      { label: "تعداد کل وظایف", value: "۱۸ وظیفه" },
      { label: "DISABLE_WP_CRON", value: "false", dir: "ltr" },
    ],
  },
  {
    id: "ssl", title: "SSL", desc: "اعتبار گواهی، صادرکننده و روزهای باقی‌مانده",
    icon: faLock,
    items: [
      { id: "ssl-status", title: "SSL Status", status: "ok", current: "معتبر", recommended: "معتبر و بدون خطای زنجیره" },
      { id: "ssl-issuer", title: "Issuer", status: "ok", current: "Let's Encrypt (R11)", recommended: "صادرکننده معتبر", currentDir: "ltr" },
      { id: "ssl-from", title: "Valid From", status: "ok", current: "۱۴۰۵/۰۷/۲۹", recommended: "—" },
      { id: "ssl-expires", title: "Expires", status: "ok", current: "۱۴۰۵/۱۰/۲۸", recommended: "تمدید پیش از انقضا" },
      { id: "ssl-days", title: "Days Remaining", status: "ok", current: "۸۷ روز", recommended: "بیش از ۳۰ روز" },
    ],
  },
  {
    id: "dns", title: "DNS", desc: "رکوردهای A، AAAA، MX، NS و آخرین تغییر",
    icon: faGlobe,
    items: [
      { id: "dns-status", title: "DNS Status", status: "ok", current: "سالم", recommended: "سالم و پایدار" },
      { id: "dns-a", title: "A Record", status: "ok", current: "104.21.x.x", recommended: "اشاره به سرور اصلی", currentDir: "ltr" },
      { id: "dns-aaaa", title: "AAAA", status: "ok", current: "2606:4700:x::1", recommended: "IPv6 در صورت پشتیبانی", currentDir: "ltr" },
      { id: "dns-mx", title: "MX", status: "ok", current: "mail.example.com (۱۰)", recommended: "سرور ایمیل فعال", currentDir: "ltr" },
      { id: "dns-ns", title: "NS", status: "review", current: "Cloudflare (dana.ns...)", recommended: "نام‌سرورهای پایدار", currentDir: "ltr" },
      { id: "dns-change", title: "Last Change", status: "ok", current: "۹۲ روز پیش", recommended: "بدون تغییر ناگهانی" },
    ],
    extra: [{ label: "TTL", value: "۳۰۰ ثانیه", dir: "ltr" }, { label: "زمان پاسخ DNS", value: "۱۸ms" }],
  },
  {
    id: "email", title: "سلامت ایمیل", desc: "ارسال ایمیل وردپرس، SMTP و آخرین ایمیل‌های ارسالی",
    icon: faEnvelope,
    items: [
      { id: "mail-wp", title: "WordPress Mail", status: "warning", current: "غیرفعال (wp_mail غیرفعال شده)", recommended: "استفاده از SMTP واقعی" },
      { id: "mail-smtp", title: "SMTP", status: "ok", current: "فعال · smtp.example.com:587", recommended: "فعال با احراز هویت", currentDir: "ltr" },
      { id: "mail-last-ok", title: "Last successful email", status: "ok", current: "۳۲ ثانیه پیش · ارسال آزمایشی", recommended: "—" },
      { id: "mail-last-fail", title: "Last failed email", status: "warning", current: "۲ ساعت پیش · رد شده توسط سرور مقصد", recommended: "بدون ایمیل ناموفق" },
    ],
    extra: [{ label: "رکوردهای اعتبارسنجی", value: "SPF ✓ · DKIM ✗ · DMARC ✗" }],
    actions: "email-test",
  },
  {
    id: "cache", title: "Cache", desc: "کش صفحه، کش آبجکت، Redis، OPcache و CDN",
    icon: faLayerGroup,
    items: [
      { id: "cache-page", title: "Page Cache", status: "ok", current: "فعال · Hit Rate ۸۸٪", recommended: "فعال با Hit Rate بالای ۸۰٪" },
      { id: "cache-object", title: "Object Cache", status: "warning", current: "غیرفعال", recommended: "فعال (Redis)" },
      { id: "cache-redis", title: "Redis", status: "warning", current: "در دسترس · بدون اتصال", recommended: "متصل به Object Cache" },
      { id: "cache-opcache", title: "OPcache", status: "ok", current: "فعال · ۹۴٪ Hit Rate", recommended: "فعال" },
      { id: "cache-browser", title: "Browser Cache", status: "warning", current: "۷ روز برای استاتیک", recommended: "حداقل ۳۰ روز" },
      { id: "cache-cdn", title: "CDN", status: "ok", current: "فعال · Cloudflare", recommended: "فعال برای استاتیک‌ها" },
    ],
  },
];

export const healthFilters = [
  { key: "all", label: "همه" },
  { key: "critical", label: "بحرانی" },
  { key: "warning", label: "هشدار" },
  { key: "ok", label: "موفق" },
  { key: "review", label: "نیازمند بررسی" },
] as const;

export type HealthFilterKey = (typeof healthFilters)[number]["key"];

export const storage = { total: 50, used: 41.2, free: 8.8, unit: "GB" };

export const emailTestResult = {
  success: true,
  to: "admin@example.com",
  subject: "YGuard — ایمیل آزمایشی",
  duration: "۳۲ ثانیه",
  smtp: "smtp.example.com:587",
  at: "اکنون",
};
