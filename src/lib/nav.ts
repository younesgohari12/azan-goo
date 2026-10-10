import {
  faGauge, faStethoscope, faHeartPulse, faFileLines, faBolt, faDatabase, faClock, faPlug,
  faShieldHalved, faChartLine, faSkullCrossbones, faRightToBracket, faFileShield, faBug, faNetworkWired,
  faBell, faListCheck, faPaperPlane, faFileExport, faClockRotateLeft, faCodeCompare, faScrewdriverWrench, faGear,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

export type NavItem = { slug: string; title: string; icon: IconDefinition; desc: string };
export type NavGroup = { title: string; icon: IconDefinition; items: NavItem[] };

export const dashboardItem: NavItem = { slug: "", title: "داشبورد", icon: faGauge, desc: "نمای کلی وضعیت سایت" };
export const settingsItem: NavItem = { slug: "settings", title: "تنظیمات", icon: faGear, desc: "پیکربندی YGuard" };

export const navGroups: NavGroup[] = [
  { title: "مانیتورینگ", icon: faHeartPulse, items: [
    { slug: "full-checkup", title: "چکاپ کامل", icon: faStethoscope, desc: "بررسی جامع همه بخش‌های سایت" },
    { slug: "site-health", title: "سلامت سایت", icon: faHeartPulse, desc: "وضعیت سلامت هسته و سرور" },
    { slug: "pages", title: "صفحات سایت", icon: faFileLines, desc: "پایش در دسترس بودن صفحات" },
    { slug: "performance", title: "Performance", icon: faBolt, desc: "سرعت و Core Web Vitals" },
    { slug: "database", title: "دیتابیس", icon: faDatabase, desc: "حجم جداول و کوئری‌های کند" },
    { slug: "cron", title: "Cron و Tasks", icon: faClock, desc: "وظایف زمان‌بندی‌شده" },
    { slug: "external", title: "سرویس‌های خارجی", icon: faPlug, desc: "وضعیت APIها و سرویس‌های متصل" },
  ]},
  { title: "امنیت", icon: faShieldHalved, items: [
    { slug: "security", title: "مرکز امنیت", icon: faShieldHalved, desc: "خلاصه وضعیت امنیتی" },
    { slug: "traffic", title: "ترافیک", icon: faChartLine, desc: "ترافیک زنده و درخواست‌ها" },
    { slug: "attacks", title: "حملات", icon: faSkullCrossbones, desc: "حملات شناسایی و مسدودشده" },
    { slug: "logins", title: "ورود کاربران", icon: faRightToBracket, desc: "تلاش‌های ورود موفق و ناموفق" },
    { slug: "integrity", title: "یکپارچگی فایل‌ها", icon: faFileShield, desc: "تغییرات فایل‌های هسته" },
    { slug: "vulnerabilities", title: "آسیب‌پذیری‌ها", icon: faBug, desc: "افزونه‌ها و قالب‌های آسیب‌پذیر" },
    { slug: "ips", title: "IP ها", icon: faNetworkWired, desc: "لیست سیاه و سفید IP" },
  ]},
  { title: "هشدارها", icon: faBell, items: [
    { slug: "alerts", title: "مرکز هشدارها", icon: faBell, desc: "همه هشدارهای فعال" },
    { slug: "alert-rules", title: "قوانین هشدار", icon: faListCheck, desc: "شرایط ارسال هشدار" },
    { slug: "channels", title: "کانال‌های اطلاع‌رسانی", icon: faPaperPlane, desc: "ایمیل، تلگرام، پیامک و..." },
  ]},
  { title: "ابزارها", icon: faScrewdriverWrench, items: [
    { slug: "reports", title: "گزارش‌ها", icon: faFileExport, desc: "گزارش‌های دوره‌ای" },
    { slug: "changelog", title: "تاریخچه تغییرات", icon: faClockRotateLeft, desc: "رویدادهای ثبت‌شده" },
    { slug: "compare", title: "مقایسه اسکن‌ها", icon: faCodeCompare, desc: "تفاوت بین دو اسکن" },
    { slug: "diagnostics", title: "ابزارهای تشخیصی", icon: faScrewdriverWrench, desc: "ابزارهای عیب‌یابی" },
  ]},
];

export const allItems: NavItem[] = [dashboardItem, ...navGroups.flatMap((g) => g.items), settingsItem];
export const findItem = (slug: string) => allItems.find((i) => i.slug === slug);
export const findGroup = (slug: string) => navGroups.find((g) => g.items.some((i) => i.slug === slug));
