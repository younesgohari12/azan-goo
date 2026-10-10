# YGuard UI Reference

مرجع رابط کاربری افزونه‌ی YGuard — سیستم مانیتورینگ، سلامت، امنیت، Performance و Uptime وردپرس.

**Creator:** Younes Gohari  
**Version:** 1.0.0 UI Reference  
**Language:** Persian / RTL  
**Font:** Vazirmatn  
**Icons:** Font Awesome Free  

## وضعیت این نسخه

این پروژه از دو خروجی `YGuard-ui.zip` و `YGuard-dashboard(1).zip` ادغام شده است. ساختار هر دو پروژه یکسان بود و تنها فایل اصلی داشبورد تفاوت داشت؛ نسخه‌ی کامل‌تر داشبورد به‌عنوان مرجع انتخاب شده است.

### ساخته شده
- Design system و تم روشن/تاریک
- RTL فارسی و Vazirmatn
- Sidebar کامل
- Header، Breadcrumb، Search و Ctrl+K Command Palette
- Notification popover و Quick Scan mock
- Dashboard اصلی کامل با KPI، نمودارها، هشدارها، Health، Plugin Impact و Activity
- مجموعه‌ی reusable UI components

### هنوز باید به‌صورت صفحه اختصاصی طراحی شود
تمام آیتم‌های زیر در منو وجود دارند اما فعلاً به صفحه‌ی عمومی/placeholder مشترک وصل‌اند:
- چکاپ کامل، سلامت سایت، صفحات سایت، Performance، دیتابیس، Cron و Tasks، سرویس‌های خارجی
- مرکز امنیت، ترافیک، حملات، ورود کاربران، یکپارچگی فایل‌ها، آسیب‌پذیری‌ها، IPها
- مرکز هشدارها، قوانین هشدار، کانال‌های اطلاع‌رسانی
- گزارش‌ها، تاریخچه تغییرات، مقایسه اسکن‌ها، ابزارهای تشخیصی، تنظیمات

برای تکمیل UI، فایل `BASE44_PROMPTS.md` را به ترتیب اجرا کنید.

## توسعه محلی

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

## نکته
این پروژه فقط مرجع UI/UX است و هیچ Scanner، Firewall، SMS API، AJAX یا backend واقعی پیاده‌سازی نمی‌کند. تمام داده‌های صفحات UI باید mock/simulated باشند تا زمانی که در مرحله‌ی توسعه‌ی افزونه وردپرس به backend واقعی متصل شوند.
