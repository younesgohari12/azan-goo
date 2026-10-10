import {
  faBolt, faCode, faCubes, faDatabase, faEnvelope, faFileCircleCheck, faFileShield,
  faFont, faGaugeHigh, faGlobe, faLayerGroup, faListCheck, faLock, faMagnifyingGlassChart,
  faPuzzlePiece, faServer, faShieldHalved, faSitemap, faClock, faPlug, faRobot,
  faCircleXmark, faPlay, faNetworkWired, faTerminal,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import type { SeverityKey, StageState } from "@/components/yguard/blocks";

export type CheckId =
  | "server" | "wordpress" | "php" | "database" | "plugins" | "themes" | "pages" | "performance"
  | "rest" | "cron" | "security" | "integrity" | "ssl" | "dns" | "email" | "cache"
  | "headers" | "sitemap" | "robots" | "external";

export type CheckItem = { id: CheckId; title: string; desc: string; icon: IconDefinition; checks: number };

export const checkItems: CheckItem[] = [
  { id: "server", title: "سرور", desc: "پاسخ‌دهی، منابع و پیکربندی وب‌سرور", icon: faServer, checks: 8 },
  { id: "wordpress", title: "WordPress", desc: "نسخه هسته، بروزرسانی‌ها و تنظیمات پایه", icon: faCode, checks: 12 },
  { id: "php", title: "PHP", desc: "نسخه، محدودیت‌ها و OPcache", icon: faTerminal, checks: 7 },
  { id: "database", title: "Database", desc: "اتصال، حجم، Autoload و کوئری‌های کند", icon: faDatabase, checks: 10 },
  { id: "plugins", title: "افزونه‌ها", desc: "بروزرسانی، سازگاری و تأثیر بر عملکرد", icon: faPuzzlePiece, checks: 12 },
  { id: "themes", title: "قالب‌ها", desc: "قالب فعال، قالب فرزند و بروزرسانی", icon: faFont, checks: 5 },
  { id: "pages", title: "صفحات", desc: "بررسی در دسترس بودن و کد وضعیت صفحات", icon: faFileCircleCheck, checks: 20 },
  { id: "performance", title: "Performance", desc: "TTFB، کوئری‌ها و منابع سنگین", icon: faGaugeHigh, checks: 6 },
  { id: "rest", title: "REST API", desc: "در دسترس بودن و زمان پاسخ /wp-json/", icon: faPlug, checks: 4 },
  { id: "cron", title: "Cron", desc: "اجرای زمان‌بندی‌شده و وظایف معوق", icon: faClock, checks: 5 },
  { id: "security", title: "امنیت", desc: "XML-RPC، Brute Force و ورود مدیر", icon: faShieldHalved, checks: 9 },
  { id: "integrity", title: "یکپارچگی فایل‌ها", desc: "تغییر فایل‌های هسته و فایل‌های ناشناس", icon: faFileShield, checks: 5 },
  { id: "ssl", title: "SSL", desc: "اعتبار گواهی و زنجیره اتصال", icon: faLock, checks: 3 },
  { id: "dns", title: "DNS", desc: "رکوردهای A، AAAA، MX و NS", icon: faGlobe, checks: 4 },
  { id: "email", title: "Email", desc: "ارسال ایمیل و رکوردهای SPF/DKIM", icon: faEnvelope, checks: 3 },
  { id: "cache", title: "Cache", desc: "Page Cache، Object Cache و Redis", icon: faLayerGroup, checks: 5 },
  { id: "headers", title: "Security Headers", desc: "HSTS، CSP، X-Frame-Options و...", icon: faNetworkWired, checks: 3 },
  { id: "sitemap", title: "Sitemap", desc: "دسترس‌پذیری و اعتبار نقشه سایت", icon: faSitemap, checks: 2 },
  { id: "robots", title: "robots.txt", desc: "قوانین ایندکس و دسترسی ربات‌ها", icon: faRobot, checks: 2 },
  { id: "external", title: "سرویس‌های خارجی", desc: "درگاه پرداخت، پیامک و APIهای متصل", icon: faCubes, checks: 2 },
];

export type Preset = { id: "quick" | "standard" | "deep"; title: string; duration: string; checks: number; desc: string; icon: IconDefinition; ids: CheckId[] };

const allIds = checkItems.map((c) => c.id);

export const presets: Preset[] = [
  {
    id: "quick", title: "چکاپ سریع", duration: "≈ ۲ دقیقه", checks: 42,
    desc: "بررسی موارد حیاتی: سرور، SSL، REST API، صفحات کلیدی و امنیت پایه",
    icon: faBolt,
    ids: ["server", "pages", "rest", "ssl", "security", "performance"],
  },
  {
    id: "standard", title: "چکاپ استاندارد", duration: "≈ ۵ دقیقه", checks: 127,
    desc: "بررسی کامل ۲۰ بخش اصلی سایت همراه با گزارش تفصیلی و پیشنهادها",
    icon: faListCheck,
    ids: allIds,
  },
  {
    id: "deep", title: "چکاپ عمیق", duration: "≈ ۱۲ دقیقه", checks: 127,
    desc: "بررسی عمیق فایل‌ها، دیتابیس، لاگ‌ها، سرویس‌های خارجی و مقایسه با اسکن قبلی",
    icon: faMagnifyingGlassChart,
    ids: allIds,
  },
];

export type ScanStage = { id: string; title: string; icon: IconDefinition; outcome: Exclude<StageState, "waiting" | "running">; weight: number };

export const scanStages: ScanStage[] = [
  { id: "server", title: "سرور", icon: faServer, outcome: "passed", weight: 6 },
  { id: "wordpress", title: "WordPress", icon: faCode, outcome: "warning", weight: 7 },
  { id: "php", title: "PHP", icon: faTerminal, outcome: "passed", weight: 5 },
  { id: "database", title: "Database", icon: faDatabase, outcome: "warning", weight: 8 },
  { id: "plugins", title: "افزونه‌ها", icon: faPuzzlePiece, outcome: "warning", weight: 9 },
  { id: "themes", title: "قالب‌ها", icon: faFont, outcome: "passed", weight: 4 },
  { id: "pages", title: "صفحات", icon: faFileCircleCheck, outcome: "critical", weight: 12 },
  { id: "performance", title: "Performance", icon: faGaugeHigh, outcome: "warning", weight: 8 },
  { id: "rest", title: "REST API", icon: faPlug, outcome: "passed", weight: 4 },
  { id: "cron", title: "Cron", icon: faClock, outcome: "critical", weight: 5 },
  { id: "security", title: "امنیت", icon: faShieldHalved, outcome: "warning", weight: 8 },
  { id: "files", title: "فایل‌ها", icon: faFileShield, outcome: "warning", weight: 6 },
  { id: "ssl", title: "SSL", icon: faLock, outcome: "passed", weight: 3 },
  { id: "dns", title: "DNS", icon: faGlobe, outcome: "passed", weight: 3 },
  { id: "email", title: "Email", icon: faEnvelope, outcome: "warning", weight: 4 },
  { id: "cache", title: "Cache", icon: faLayerGroup, outcome: "warning", weight: 5 },
  { id: "report", title: "گزارش نهایی", icon: faFileCircleCheck, outcome: "passed", weight: 3 },
];

export type ScanEvent = { id: number; time: string; title: string; message: string; tone: "success" | "warning" | "danger" | "info"; icon: IconDefinition };

export const scanEvents: ScanEvent[] = [
  { id: 1, time: "۱۴:۲۲:۰۱", title: "شروع چکاپ", message: "چکاپ استاندارد با ۲۰ بخش فعال آغاز شد.", tone: "info", icon: faPlay },
  { id: 2, time: "۱۴:۲۲:۰۴", title: "سرور", message: "اتصال به سرور برقرار شد — زمان پاسخ ۲۱۴ms.", tone: "success", icon: faServer },
  { id: 3, time: "۱۴:۲۲:۱۱", title: "WordPress", message: "نسخه هسته وردپرس بررسی شد: 6.6.2 (به‌روز).", tone: "success", icon: faCode },
  { id: 4, time: "۱۴:۲۲:۱۸", title: "PHP", message: "نسخه PHP بررسی شد: 8.2.12.", tone: "success", icon: faTerminal },
  { id: 5, time: "۱۴:۲۲:۲۶", title: "Database", message: "wp_options دارای Autoload بالا است (۴.۸MB).", tone: "warning", icon: faDatabase },
  { id: 6, time: "۱۴:۲۲:۳۴", title: "افزونه‌ها", message: "فهرست ۲۴ افزونه دریافت شد — ۴ افزونه نیازمند بروزرسانی.", tone: "warning", icon: faPuzzlePiece },
  { id: 7, time: "۱۴:۲۲:۴۰", title: "قالب‌ها", message: "قالب فعال Twenty Twenty-Four همراه با قالب فرزند شناسایی شد.", tone: "success", icon: faFont },
  { id: 8, time: "۱۴:۲۲:۴۵", title: "صفحات", message: "بررسی ۲۰ صفحه آغاز شد.", tone: "info", icon: faFileCircleCheck },
  { id: 9, time: "۱۴:۲۳:۰۲", title: "صفحات", message: "/contact/ پاسخ HTTP 503 داد.", tone: "danger", icon: faCircleXmark },
  { id: 10, time: "۱۴:۲۳:۰۹", title: "صفحات", message: "صفحه اصلی پاسخ HTTP 503 داد (۳ بار در ۱۰ دقیقه).", tone: "danger", icon: faCircleXmark },
  { id: 11, time: "۱۴:۲۳:۱۸", title: "Performance", message: "TTFB سایت ۶۱۲ms اندازه‌گیری شد (حد مطلوب ۴۰۰ms).", tone: "warning", icon: faGaugeHigh },
  { id: 12, time: "۱۴:۲۳:۲۵", title: "REST API", message: "REST API پاسخ صحیح داد.", tone: "success", icon: faPlug },
  { id: 13, time: "۱۴:۲۳:۳۱", title: "Cron", message: "WP Cron دارای تأخیر است — آخرین اجرا ۲ ساعت پیش.", tone: "danger", icon: faClock },
  { id: 14, time: "۱۴:۲۳:۳۸", title: "امنیت", message: "بررسی XML-RPC و تلاش‌های ورود ناموفق انجام شد.", tone: "warning", icon: faShieldHalved },
  { id: 15, time: "۱۴:۲۳:۴۵", title: "فایل‌ها", message: "یک فایل ناشناس در wp-content/uploads شناسایی شد.", tone: "warning", icon: faFileShield },
  { id: 16, time: "۱۴:۲۳:۵۱", title: "SSL", message: "SSL معتبر است — ۸۷ روز تا انقضا.", tone: "success", icon: faLock },
  { id: 17, time: "۱۴:۲۳:۵۶", title: "DNS", message: "DNS بدون تغییر شناسایی شد.", tone: "success", icon: faGlobe },
  { id: 18, time: "۱۴:۲۴:۰۳", title: "Email", message: "ارسال آزمایشی SMTP موفق بود — رکورد DKIM ناقص است.", tone: "warning", icon: faEnvelope },
  { id: 19, time: "۱۴:۲۴:۱۰", title: "Cache", message: "Page Cache فعال · Object Cache غیرفعال.", tone: "warning", icon: faLayerGroup },
  { id: 20, time: "۱۴:۲۴:۱۶", title: "گزارش نهایی", message: "تولید گزارش نهایی و محاسبه امتیاز ۸۹ از ۱۰۰.", tone: "success", icon: faFileCircleCheck },
];

export type Issue = {
  id: string;
  severity: SeverityKey;
  title: string;
  desc: string;
  component: string;
  detectedAt: string;
  status: "باز" | "در حال بررسی" | "حل‌شده" | "نادیده گرفته‌شده";
  currentValue?: string;
  expectedValue?: string;
  evidence: { label: string; value: string }[];
  technical: { label: string; value: string }[];
  recommendation: string;
};

export type IssueGroup = { id: string; title: string; icon: IconDefinition; issues: Issue[] };

export const issueGroups: IssueGroup[] = [
  {
    id: "security", title: "امنیت", icon: faShieldHalved,
    issues: [
      {
        id: "sec-xmlrpc", severity: "critical", title: "XML-RPC فعال و در دسترس عموم است",
        desc: "درِ پشتی رایج برای حمله Brute Force و ارسال درخواست‌های سنگین است.", component: "xmlrpc.php",
        detectedAt: "۱۴:۲۳:۳۸", status: "باز", currentValue: "فعال", expectedValue: "غیرفعال",
        evidence: [
          { label: "کد وضعیت پاسخ", value: "200 OK" },
          { label: "درخواست‌های ۲۴ ساعت", value: "۱٬۲۴۰ درخواست از ۳۷ IP" },
          { label: "تلاش ورود با xmlrpc", value: "۸۶ تلاش" },
        ],
        technical: [
          { label: "Endpoint", value: "https://example.com/xmlrpc.php" },
          { label: "System List Methods", value: "در دسترس" },
          { label: "Content-Type", value: "text/xml" },
        ],
        recommendation: "دسترسی به xmlrpc.php را مسدود کنید یا فقط برای سرویس‌های موردنیاز (مثل Jetpack) باز بگذارید.",
      },
      {
        id: "sec-debug", severity: "warning", title: "WP_DEBUG_DISPLAY در محیط تولید فعال است",
        desc: "نمایش خطاها به کاربر نهایی می‌تواند مسیر فایل‌ها و اطلاعات دیتابیس را افشا کند.", component: "wp-config.php",
        detectedAt: "۱۴:۲۲:۱۱", status: "باز", currentValue: "true", expectedValue: "false",
        evidence: [
          { label: "خطای نمونه در پاسخ HTML", value: "Warning: Undefined array key در line 412" },
          { label: "مسیر افشاشده", value: "/home/user/public_html/wp-content/..." },
        ],
        technical: [
          { label: "WP_DEBUG", value: "true" },
          { label: "WP_DEBUG_LOG", value: "true" },
          { label: "WP_DEBUG_DISPLAY", value: "true" },
        ],
        recommendation: "WP_DEBUG_DISPLAY را false کنید و خطاها را فقط در debug.log ثبت کنید.",
      },
      {
        id: "sec-brute", severity: "success", title: "محافظت Brute Force فعال است",
        desc: "تلاش‌های ورود ناموفق محدود و IP مهاجم موقتاً مسدود می‌شود.", component: "wp-login.php",
        detectedAt: "۱۴:۲۳:۳۹", status: "حل‌شده", currentValue: "۱۲ IP مسدودشده", expectedValue: "فعال",
        evidence: [{ label: "تلاش ناموفق ۲۴ ساعت", value: "۱۴۸ تلاش" }, { label: "IP مسدودشده", value: "۱۲" }],
        technical: [{ label: "آستانه مسدودسازی", value: "۵ تلاش در ۵ دقیقه" }, { label: "مدت مسدودی", value: "۶۰ دقیقه" }],
        recommendation: "وضعیت فعلی مناسب است؛ در صورت افزایش حملات، احراز هویت دو مرحله‌ای را فعال کنید.",
      },
      {
        id: "sec-csp", severity: "suggestion", title: "هدر Content-Security-Policy تنظیم نشده است",
        desc: "نبود CSP ریسک تزریق اسکریپت (XSS) را افزایش می‌دهد.", component: "Security Headers",
        detectedAt: "۱۴:۲۳:۳۹", status: "باز", currentValue: "تنظیم نشده", expectedValue: "default-src 'self'",
        evidence: [{ label: "هدرهای دریافتی", value: "HSTS ✓ · X-Frame-Options ✓ · CSP ✗" }],
        technical: [{ label: "پاسخ سرور", value: "200 OK · بدون CSP" }],
        recommendation: "یک سیاست پایه CSP اضافه کنید و به‌تدریج منابع مجاز را کامل کنید.",
      },
    ],
  },
  {
    id: "performance", title: "Performance", icon: faGaugeHigh,
    issues: [
      {
        id: "perf-ttfb", severity: "warning", title: "زمان پاسخ سرور (TTFB) بالاتر از حد مطلوب است",
        desc: "میانگین TTFB صفحه اصلی ۶۱۲ms اندازه‌گیری شد.", component: "صفحه اصلی",
        detectedAt: "۱۴:۲۳:۱۸", status: "در حال بررسی", currentValue: "۶۱۲ms", expectedValue: "زیر ۴۰۰ms",
        evidence: [
          { label: "۵ نمونه اندازه‌گیری", value: "۵۸۸ms · ۶۰۴ms · ۶۲۱ms · ۶۳۰ms · ۶۱۸ms" },
          { label: "کوئری‌های صفحه اصلی", value: "۴۸ کوئری" },
        ],
        technical: [
          { label: "PHP Time", value: "۲۸۴ms" },
          { label: "Database Time", value: "۱۹۲ms" },
          { label: "External HTTP", value: "۱۱۸ms" },
        ],
        recommendation: "Object Cache را فعال کنید و کوئری‌های سنگین صفحه اصلی را بازبینی کنید.",
      },
      {
        id: "perf-objectcache", severity: "suggestion", title: "Object Cache غیرفعال است",
        desc: "بدون Object Cache، کوئری‌های تکراری در هر درخواست دوباره اجرا می‌شوند.", component: "wp-config.php",
        detectedAt: "۱۴:۲۳:۲۰", status: "باز", currentValue: "غیرفعال", expectedValue: "Redis یا Memcached",
        evidence: [{ label: "کوئری تکراری در ۱۰۰ درخواست", value: "۲٬۱۴۰ کوئری" }],
        technical: [{ label: "Redis در دسترس", value: "بله (پورت 6379)" }, { label: "drop-in object-cache.php", value: "موجود نیست" }],
        recommendation: "با فعال‌سازی Redis به‌عنوان Object Cache، بار دیتابیس تا ۳۵٪ کاهش می‌یابد.",
      },
      {
        id: "perf-gzip", severity: "success", title: "فشرده‌سازی Gzip/Brotli فعال است",
        desc: "منابع متنی با نسبت فشرده‌سازی مناسب ارسال می‌شوند.", component: "وب‌سرور",
        detectedAt: "۱۴:۲۳:۲۱", status: "حل‌شده", currentValue: "Brotli · ۷۲٪", expectedValue: "فعال",
        evidence: [{ label: "حجم HTML قبل/بعد", value: "۱۸۴KB → ۵۱KB" }],
        technical: [{ label: "Accept-Encoding", value: "br, gzip" }],
        recommendation: "وضعیت فعلی بهینه است.",
      },
    ],
  },
  {
    id: "database", title: "Database", icon: faDatabase,
    issues: [
      {
        id: "db-autoload", severity: "warning", title: "Autoload دیتابیس بالا است",
        desc: "گزینه‌های autoload در هر درخواست بارگذاری می‌شوند و مصرف حافظه را بالا می‌برند.", component: "wp_options",
        detectedAt: "۱۴:۲۲:۲۶", status: "باز", currentValue: "۴.۸ MB", expectedValue: "زیر ۱ MB",
        evidence: [
          { label: "تعداد گزینه‌های autoload", value: "۱٬۲۴۸ گزینه" },
          { label: "سنگین‌ترین گزینه", value: "_transient_feed_... ۴۱۲KB" },
          { label: "مصرف حافظه هر درخواست", value: "≈ ۱۲MB" },
        ],
        technical: [
          { label: "جدول", value: "wp_options" },
          { label: "کوئری بررسی", value: "SELECT SUM(LENGTH(option_value)) WHERE autoload='yes'" },
          { label: "موتور", value: "InnoDB" },
        ],
        recommendation: "حجم Autoload بهتر است کمتر از 1MB باشد. گزینه‌های autoload غیرضروری و transientهای منقضی را پاک کنید.",
      },
      {
        id: "db-transients", severity: "warning", title: "۱٬۲۴۰ transient منقضی‌شده در دیتابیس",
        desc: "transientهای منقضی‌شده حجم دیتابیس و زمان کوئری‌ها را افزایش می‌دهند.", component: "wp_options",
        detectedAt: "۱۴:۲۲:۲۷", status: "باز", currentValue: "۱٬۲۴۰ رکورد · ۱۸MB", expectedValue: "۰ رکورد",
        evidence: [{ label: "قدیمی‌ترین transient منقضی", value: "۹۲ روز پیش" }],
        technical: [{ label: "کوئری بررسی", value: "SELECT COUNT(*) FROM wp_options WHERE option_name LIKE '_transient_%'" }],
        recommendation: "پاک‌سازی زمان‌بندی‌شده transientهای منقضی را فعال کنید.",
      },
      {
        id: "db-revisions", severity: "suggestion", title: "۲۱۰ نسخه بازبینی قدیمی نگه‌داری می‌شود",
        desc: "بازبینی‌های قدیمی می‌توانند حجم جدول posts را به‌طور غیرضروری افزایش دهند.", component: "wp_posts",
        detectedAt: "۱۴:۲۲:۲۸", status: "باز", currentValue: "۲۱۰ نسخه", expectedValue: "حداکثر ۵ نسخه",
        evidence: [{ label: "حجم بازبینی‌ها", value: "۲۴MB" }],
        technical: [{ label: "post_type", value: "revision" }],
        recommendation: "محدودیت بازبینی را روی ۳ تا ۵ تنظیم کنید و نسخه‌های قدیمی را حذف کنید.",
      },
    ],
  },
  {
    id: "pages", title: "Pages", icon: faFileCircleCheck,
    issues: [
      {
        id: "pages-home-503", severity: "critical", title: "صفحه اصلی پاسخ ۵۰۳ می‌دهد",
        desc: "در ۱۰ دقیقه گذشته ۳ بار پاسخ ۵۰۳ ثبت شده است؛ احتمال اتمام PHP Workers یا خطای افزونه.", component: "Homepage · /",
        detectedAt: "۱۴:۲۳:۰۹", status: "باز", currentValue: "HTTP 503", expectedValue: "HTTP 200",
        evidence: [
          { label: "تعداد خطا در ۱۰ دقیقه", value: "۳ بار" },
          { label: "زمان‌های ثبت‌شده", value: "۱۴:۱۹ · ۱۴:۲۱ · ۱۴:۲۳" },
          { label: "پاسخ سرور", value: "Service Unavailable · Retry-After: 60" },
        ],
        technical: [
          { label: "زمان پاسخ در خطا", value: "۹٬۸۲۰ms (timeout)" },
          { label: "کد وضعیت", value: "503" },
          { label: "لاگ سرور", value: "[error] upstream prematurely closed connection" },
        ],
        recommendation: "پاسخ ۵۰۳ را با بررسی لاگ PHP و مصرف منابع سرور ریشه‌یابی کنید و هشدار فوری برای این URL فعال بماند.",
      },
      {
        id: "pages-contact-503", severity: "warning", title: "/contact/ پاسخ HTTP 503 داد",
        desc: "صفحه تماس در بررسی اول ناموفق بود و در تلاش دوم پاسخ صحیح داد.", component: "/contact/",
        detectedAt: "۱۴:۲۳:۰۲", status: "در حال بررسی", currentValue: "HTTP 503 · تلاش ۱ از ۲", expectedValue: "HTTP 200",
        evidence: [{ label: "زمان پاسخ", value: "۵٬۰۱۰ms (timeout)" }, { label: "تلاش دوم", value: "۳۸۴ms · 200 OK" }],
        technical: [{ label: "افزونه درگیر", value: "Contact Form 7" }],
        recommendation: "افزونه فرم تماس را بروزرسانی کنید و زمان پاسخ صفحه را در بازه‌های اوج ترافیک پایش کنید.",
      },
      {
        id: "pages-ok", severity: "success", title: "۴۹۷ صفحه از ۵۰۰ صفحه پاسخ ۲۰۰ دادند",
        desc: "وضعیت عمومی صفحات سایت سالم است.", component: "۲۰ صفحه کلیدی · ۵۰۰ URL",
        detectedAt: "۱۴:۲۳:۱۵", status: "حل‌شده", currentValue: "۴۹۷ Healthy", expectedValue: "≥ ۹۸٪",
        evidence: [{ label: "میانگین زمان پاسخ", value: "۴۳۸ms" }, { label: "تعداد Redirect", value: "۱۸" }],
        technical: [{ label: "روش بررسی", value: "HEAD Request · ۱۰ ثانیه timeout" }],
        recommendation: "وضعیت فعلی قابل قبول است.",
      },
    ],
  },
  {
    id: "wordpress", title: "WordPress", icon: faCode,
    issues: [
      {
        id: "wp-plugins-update", severity: "warning", title: "۴ افزونه نیازمند بروزرسانی هستند",
        desc: "بروزرسانی‌نشدن افزونه‌ها می‌تواند منشأ آسیب‌پذیری و ناسازگاری باشد.", component: "افزونه‌ها",
        detectedAt: "۱۴:۲۲:۳۴", status: "باز", currentValue: "۴ افزونه", expectedValue: "۰ افزونه",
        evidence: [
          { label: "افزونه‌های قدیمی", value: "Contact Form 7 · WooCommerce · Elementor · Yoast SEO" },
          { label: "بیشترین تأخیر", value: "WooCommerce — ۳ نسخه عقب‌تر" },
        ],
        technical: [{ label: "تعداد کل افزونه‌ها", value: "۲۴ (فعال: ۱۸)" }],
        recommendation: "ابتدا از سایت بکاپ بگیرید، سپس افزونه‌ها را در محیط تست بروزرسانی و بعد روی سایت اصلی اعمال کنید.",
      },
      {
        id: "wp-core", severity: "success", title: "هسته وردپرس به‌روز است",
        desc: "نسخه نصب‌شده آخرین نسخه پایدار است.", component: "WordPress Core",
        detectedAt: "۱۴:۲۲:۱۱", status: "حل‌شده", currentValue: "6.6.2", expectedValue: "6.6.2",
        evidence: [{ label: "آخرین بررسی بروزرسانی", value: "۵ دقیقه پیش" }],
        technical: [{ label: "قابل بروزرسانی خودکار", value: "فعال برای نسخه‌های امنیتی" }],
        recommendation: "نیازی به اقدام نیست.",
      },
      {
        id: "wp-inactive", severity: "suggestion", title: "۳ افزونه غیرفعال روی سرور نصب است",
        desc: "افزونه‌های غیرفعال ولی نصب‌شده سطح حمله را افزایش می‌دهند.", component: "افزونه‌ها",
        detectedAt: "۱۴:۲۲:۳۵", status: "باز", currentValue: "۳ افزونه", expectedValue: "حذف افزونه‌های بلااستفاده",
        evidence: [{ label: "افزونه‌های غیرفعال", value: "Hello Dolly · Akismet · UpdraftPlus" }],
        technical: [{ label: "حجم اشغال‌شده", value: "۳۱MB" }],
        recommendation: "افزونه‌هایی که استفاده نمی‌شوند را کامل حذف کنید.",
      },
    ],
  },
  {
    id: "server", title: "Server", icon: faServer,
    issues: [
      {
        id: "srv-disk", severity: "warning", title: "فضای دیسک سرور ۸۲٪ استفاده شده است",
        desc: "با ادامه این روند، فضای دیسک در ۳۰ روز آینده پر می‌شود.", component: "دیسک سرور",
        detectedAt: "۱۴:۲۲:۰۴", status: "در حال بررسی", currentValue: "۴۱.۲GB از ۵۰GB", expectedValue: "زیر ۷۰٪",
        evidence: [{ label: "رشد روزانه", value: "۲۴۰MB" }, { label: "بزرگ‌ترین پوشه", value: "wp-content/uploads · ۱۲.۴GB" }],
        technical: [{ label: "فایل‌سیستم", value: "/dev/vda1 (ext4)" }, { label: "inode مصرفی", value: "۳۸٪" }],
        recommendation: "لاگ‌های قدیمی و بکاپ‌های محلی را پاک کنید یا فضای دیسک را افزایش دهید.",
      },
      {
        id: "srv-response", severity: "success", title: "زمان پاسخ سرور در محدوده نرمال است",
        desc: "میانگین زمان پاسخ سرور ۲۱۴ms است.", component: "وب‌سرور",
        detectedAt: "۱۴:۲۲:۰۴", status: "حل‌شده", currentValue: "۲۱۴ms", expectedValue: "زیر ۳۰۰ms",
        evidence: [{ label: "۵ نمونه", value: "۱۹۸ms · ۲۰۴ms · ۲۱۸ms · ۲۲۶ms · ۲۲۴ms" }],
        technical: [{ label: "Load Average", value: "۱.۲ / ۱.۴ / ۱.۱" }],
        recommendation: "وضعیت فعلی مناسب است.",
      },
      {
        id: "srv-http3", severity: "suggestion", title: "پروتکل HTTP/3 فعال نیست",
        desc: "بررسی‌ها نشان می‌دهد سایت فقط از HTTP/2 استفاده می‌کند.", component: "وب‌سرور · CDN",
        detectedAt: "۱۴:۲۲:۰۵", status: "باز", currentValue: "HTTP/2", expectedValue: "HTTP/2 + HTTP/3",
        evidence: [{ label: "Alt-Svc header", value: "ارسال نشده" }],
        technical: [{ label: "Server", value: "nginx/1.26.1" }, { label: "TLS", value: "TLS 1.3" }],
        recommendation: "در صورت پشتیبانی CDN، HTTP/3 را فعال کنید؛ برای کاربران موبایل بهبود محسوس دارد.",
      },
    ],
  },
  {
    id: "infrastructure", title: "Infrastructure", icon: faGlobe,
    issues: [
      {
        id: "infra-cron", severity: "critical", title: "WP Cron بیش از ۲ ساعت تأخیر دارد",
        desc: "وظایف زمان‌بندی‌شده اجرا نشده‌اند؛ احتمالاً WP-Cron روی ترافیک واقعی وابسته است.", component: "wp-cron.php",
        detectedAt: "۱۴:۲۳:۳۱", status: "باز", currentValue: "۷ وظیفه معوق", expectedValue: "تأخیر زیر ۵ دقیقه",
        evidence: [
          { label: "قدیمی‌ترین وظیفه معوق", value: "woocommerce_cleanup_sessions · ۱۲۰ دقیقه" },
          { label: "وظایف ناموفق", value: "۲ مورد" },
        ],
        technical: [
          { label: "DISABLE_WP_CRON", value: "false" },
          { label: "وظایف زمان‌بندی‌شده", value: "۱۸ وظیفه" },
          { label: "درخواست wp-cron در ۲۴ ساعت", value: "۴۲" },
        ],
        recommendation: "WP-Cron را غیرفعال کنید و از Cron واقعی سرور با اجرای هر ۵ دقیقه استفاده کنید.",
      },
      {
        id: "infra-ssl", severity: "success", title: "SSL معتبر است",
        desc: "گواهی TLS معتبر و زنجیره آن کامل است.", component: "example.com",
        detectedAt: "۱۴:۲۳:۵۱", status: "حل‌شده", currentValue: "۸۷ روز", expectedValue: "بیش از ۳۰ روز",
        evidence: [
          { label: "صادرکننده", value: "Let's Encrypt (R11)" },
          { label: "تاریخ انقضا", value: "۱۴۰۵/۱۰/۲۸" },
        ],
        technical: [{ label: "TLS", value: "TLSv1.3" }, { label: "Redirect HTTP→HTTPS", value: "فعال" }],
        recommendation: "تمدید خودکار گواهی فعال است؛ نیازی به اقدام نیست.",
      },
      {
        id: "infra-email", severity: "warning", title: "رکورد DKIM برای دامنه تنظیم نشده است",
        desc: "نبود DKIM احتمال ورود ایمیل‌های سایت به پوشه اسپم را افزایش می‌دهد.", component: "DNS · Email",
        detectedAt: "۱۴:۲۴:۰۳", status: "باز", currentValue: "SPF ✓ · DKIM ✗ · DMARC ✗", expectedValue: "SPF + DKIM + DMARC",
        evidence: [{ label: "آخرین ایمیل آزمایشی", value: "۳۲ ثانیه پیش — موفق" }],
        technical: [{ label: "ارسال‌کننده", value: "wordpress@example.com" }, { label: "SMTP", value: "فعال" }],
        recommendation: "رکوردهای DKIM و DMARC را در DNS اضافه کنید تا اعتبار ارسال ایمیل بالا برود.",
      },
      {
        id: "infra-dns", severity: "success", title: "رکوردهای DNS بدون تغییر شناسایی شدند",
        desc: "در مقایسه با اسکن قبلی هیچ تغییری در رکوردها ثبت نشده است.", component: "DNS · Cloudflare",
        detectedAt: "۱۴:۲۳:۵۶", status: "حل‌شده", currentValue: "بدون تغییر", expectedValue: "بدون تغییر",
        evidence: [{ label: "A Record", value: "104.21.x.x" }, { label: "NS", value: "Cloudflare" }],
        technical: [{ label: "TTL", value: "۳۰۰ ثانیه" }],
        recommendation: "نیازی به اقدام نیست.",
      },
    ],
  },
];

export const scanSummary = {
  score: 89,
  critical: 3,
  warning: 11,
  suggestion: 17,
  success: 96,
  checks: 127,
  duration: "۰۴:۳۲",
  lastRun: "۵ دقیقه پیش",
  finishedAt: "۱۴:۲۶:۳۳",
};
