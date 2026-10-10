# YGuard — 7 مرحله برای Base44

## قانون ثابت برای همه مراحل

- فایل `YGuard-Reference-Merged.zip` مرجع اصلی UI است.
- پروژه را از روی همین مرجع ادامه بده؛ Dashboard، Sidebar، Header و Design System موجود را از نو نساز و ظاهرشان را عوض نکن مگر برای رفع باگ.
- فقط **Frontend UI/UX** ساخته شود؛ هیچ PHP، WordPress backend، API واقعی، AJAX واقعی، Scanner، Firewall یا SMS واقعی پیاده‌سازی نشود.
- تمام داده‌ها Mock/Simulated باشند.
- زبان کاملاً فارسی، RTL کامل، فونت Vazirmatn و Font Awesome Free حفظ شود.
- Light/Dark mode، spacing، رنگ‌ها، radius، table، drawer، dialog، toast و typography دقیقاً با پروژه مرجع هماهنگ بمانند.
- مسیرها و نام آیتم‌های منوی موجود حفظ شوند.
- خروجی هر مرحله باید **کل پروژه‌ی به‌روزشده** باشد، نه فقط فایل‌های تغییرکرده.

---

## Prompt 1 — Full Checkup + Site Health + External Services

```text
Use the uploaded YGuard reference project as the source of truth and continue the existing UI.

FRONTEND UI ONLY. Use mock data. Do not create backend/API/PHP/AJAX.
Do not redesign the existing Dashboard, Sidebar, Header or design system.
Keep Persian RTL, Vazirmatn, Font Awesome, light/dark mode and current visual style.

Build real dedicated UI screens for these existing routes:
- full-checkup
- site-health
- external

FULL CHECKUP PAGE:
Create presets: چکاپ سریع، چکاپ استاندارد، چکاپ عمیق.
Allow selecting: Server, WordPress, PHP, Database, Plugins, Themes, Pages, Performance, REST API, Cron, Security, File Integrity, SSL, DNS, Email, Cache, Security Headers, Sitemap, robots.txt, External Services.

Create a simulated scan flow with:
- progress percentage
- current stage
- elapsed/remaining time
- Passed / Warning / Critical / Running / Waiting states
- live event log
- Stop and Run in background buttons
- final score and grouped results
- result details drawer with severity, evidence and recommended action

SITE HEALTH PAGE:
Create health score and sections for WordPress, PHP, server limits, database connection, REST API, loopback, WP-Cron, HTTPS, SSL, DNS, email, cache, filesystem permissions, updates and debug settings.
Show status, current value, recommended value and severity.

EXTERNAL SERVICES PAGE:
Create monitored external API/service table with service name, endpoint, status, response time, uptime, failures and last check.
Add a details drawer with 24h response-time history, recent failures and mock retry action.

Every screen needs loading, empty, success and error states.
Use realistic Persian mock data.

When finished, export/download the COMPLETE updated project as a ZIP file named:
YGuard-Base44-01-Health-Checkup.zip
Do not provide only code snippets.
```

---

## Prompt 2 — Performance + Database + Cron

```text
Continue the uploaded YGuard reference project. Keep the existing design exactly consistent.
Frontend UI only, mock data only, Persian RTL.
Do not modify the completed Dashboard except for shared-component bug fixes.

Build dedicated screens for:
- performance
- database
- cron

PERFORMANCE:
Create time range filters: 1 hour, 24 hours, 7 days, 30 days.
KPI cards: TTFB, PHP Time, Database Time, External HTTP, Peak Memory, Slow Queries, PHP Errors.
Create response breakdown charts.
Create a professional "10 افزونه با بیشترین Impact" table with:
Plugin, Impact Score, PHP Time, Database, Queries, HTTP Calls, Hooks, Errors, Assets, Status.
Never show fake CPU %. Use Impact Score only.
Clicking a plugin opens a side drawer with tabs:
Overview, Database, Hooks, HTTP, Assets, Errors, History.
Add a simulated Deep Profiling modal for selected pages and duration.

DATABASE:
Cards: database size, tables, autoload size, expired transients, revisions, slow queries.
Tables for largest tables and largest autoload options.
Diagnostic sections for orphan metadata, unused options, revisions and transients.
Add mock analysis actions only; no real optimization.

CRON & TASKS:
Cards: Total Jobs, Overdue, Failed, Long Running.
Table: Hook, Source, Schedule, Next Run, Last Run, Duration, Status.
Add WooCommerce Scheduled Actions mock section with Pending, Failed and Overdue.
Add job details drawer and history timeline.

Use the same reusable components, cards, filters, tables and drawers already in the project.

When finished, export/download the COMPLETE updated project as:
YGuard-Base44-02-Performance-Database-Cron.zip
Do not provide only code snippets.
```

---

## Prompt 3 — Pages Monitor + Critical URLs + Infrastructure Checks

```text
Continue the YGuard reference UI. Frontend only with mock data.
Keep the same Persian RTL design system, sidebar and header.

Build the dedicated UI for the existing route:
- pages

Also add infrastructure diagnostic tabs/cards inside this monitoring experience without breaking the current navigation.

PAGES MONITOR:
Stats: total URLs, Healthy, Redirect, 4xx, 5xx, Timeout.
Filters: All, 200, 3xx, 403, 404, 429, 5xx, Timeout, page type, response time, last checked.
Table columns:
URL, Type, HTTP Status, Response Time, Redirect, Last Check, Monitoring, Actions.
Use realistic URLs such as /, /shop/, /contact/, /account/, /old-page/.

URL DETAILS DRAWER:
HTTP status, DNS time, connection time, TTFB, total response, page size, redirect chain, SSL, last 20 checks and response-time chart.

CRITICAL URLS:
Create management UI for Homepage, Shop, Cart, Checkout, My Account, REST API, wp-cron and custom URLs.
Per URL settings: monitoring enabled, interval, expected status, timeout, consecutive failure threshold, dashboard alert, SMS alert.

Add compact diagnostic sections/tabs for:
- Uptime history
- SSL certificate and days to expiry
- Domain expiry
- DNS records A/AAAA/CNAME/MX/TXT/NS and detected changes
- Page Cache / Object Cache / Redis / OPcache / CDN
- Email health / SMTP test mock
- Sitemap and robots.txt diagnostics

All checks are visual mockups only.
Include loading, empty and failure states.

When finished, export/download the COMPLETE updated project as:
YGuard-Base44-03-Pages-Infrastructure.zip
Do not provide only code snippets.
```

---

## Prompt 4 — Security Center + Traffic + Attacks + IPs

```text
Continue the YGuard reference project without redesigning existing completed screens.
Frontend UI only. No real firewall, blocking or security engine. Use mock interactions.

Build dedicated screens for existing routes:
- security
- traffic
- attacks
- ips

SECURITY CENTER:
Cards: Requests Today, Unique IPs, Blocked IPs, Suspicious Requests, Failed Logins, Security Incidents.
Charts: requests/minute, allowed vs blocked, attack categories.
Create an "تهدیدهای فعال" section.
Example: Request Flood from 185.xxx.xxx.xxx with 826 requests/minute, wp-login hits, xmlrpc hits and 404 probes.
Actions: Review, temporary block, 24h block, Allow List — UI simulation only.

TRAFFIC:
Table: IP, Requests, Blocked, 4xx, 5xx, Login Attempts, Country, First Seen, Last Seen, Risk.
Filters: All, Suspicious, Blocked, High Traffic, Bots.
Add live-style traffic chart and request-method distribution.

ATTACKS:
Create categorized incidents for Request Flood, Brute Force, XML-RPC abuse, 404 scanning, suspicious URL scanning, REST abuse and POST flood.
Show severity, source IP, target, request count, first/last seen and status.
Add incident investigation drawer with paths, user agent, methods, response codes and timeline.

IP MANAGEMENT:
Tabs: Observed, Blocked, Allow List.
Search/filter IPs.
Create IP details drawer with risk score, requests, top paths, user agent, first/last seen and event timeline.
Mock add/remove/block/allow actions with confirmation dialogs and toasts.

When finished, export/download the COMPLETE updated project as:
YGuard-Base44-04-Security-Traffic.zip
Do not provide only code snippets.
```

---

## Prompt 5 — Login Security + File Integrity + Vulnerabilities

```text
Continue the YGuard reference UI. Frontend only and mock data only.
Preserve Persian RTL, Vazirmatn, Font Awesome, dark mode and all existing shared components.

Build dedicated screens for existing routes:
- logins
- integrity
- vulnerabilities

LOGIN SECURITY:
Overview cards: successful logins, failed logins, targeted users, attacking IPs.
Create timeline/table for Admin login, login from new IP, failed password, administrator created, password changed, administrator deleted.
Filters: User, Role, Event, IP, Date.
Add Brute Force analysis card/chart and suspicious-login details drawer.

FILE INTEGRITY:
Cards: Modified, New, Deleted, Suspicious.
Tabs: WordPress Core, Plugins, Themes, Uploads.
Example critical item: new PHP file in wp-content/uploads/2026/10/x.php.
Drawer fields: Path, Size, Modified Date, Hash Change, First Detected, Risk, Reason.
Mock actions: Review, Ignore, Mark Safe.

VULNERABILITIES:
Tabs: WordPress Core, Plugins, Themes.
Table: Component, Installed Version, Latest Version, Risk, CVE placeholder, Fix Available.
Statuses: Up to date, Update recommended, Critical vulnerability.
Add vulnerability detail drawer with summary, affected versions, severity, references placeholder and recommended action.

Also add diagnostic sections for:
HTTPS, HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
Show overall security header grade.
Add WordPress exposure checks for XML-RPC, REST Users endpoint, directory listing, debug mode, display_errors, version exposure, readme and wp-config permissions.

When finished, export/download the COMPLETE updated project as:
YGuard-Base44-05-Integrity-Vulnerabilities.zip
Do not provide only code snippets.
```

---

## Prompt 6 — Alerts + Rules + MeliPayamak SMS

```text
Continue the existing YGuard reference project. Frontend UI only.
Do not implement real SMS/API/backend. Use simulated connection and send states.
Keep the existing Persian RTL visual language exactly consistent.

Build dedicated screens for existing routes:
- alerts
- alert-rules
- channels

ALERT CENTER:
Tabs: Open, Acknowledged, Resolved, Ignored, All.
Severity levels: Critical, High, Medium, Low, Info.
Filters: severity, category, component, date, notification status.
Actions: Review, Acknowledge, Resolve, Ignore, Snooze.
Snooze choices: 30m, 1h, 6h, 24h, tomorrow, custom.
Create detailed alert drawer with Summary, Timeline, Evidence, Affected Resources, Notification History and Recommended Actions.

ALERT RULES:
Create categorized rule cards for HTTP, Security, Performance, Database, WordPress, Files, Cron, SSL, DNS, Disk, Email.
Build a visual rule builder.
Examples:
IF requests from one IP > 500 WITHIN 60 seconds THEN Critical Alert + SMS + Dashboard.
IF HTTP Status = 503 FOR 3 consecutive checks THEN Critical Alert + SMS.
Fields: enabled, severity, threshold, time window, channels, cooldown.

CHANNELS:
Cards for SMS, Email, Telegram, Webhook.
SMS should be fully designed for provider:
ملی پیامک — melipayamak.com
Fields: username, web-service password with show/hide, sender number.
Recipients repeater: name, mobile number, alert type.
Modes: normal SMS, service/pattern mode.
Buttons: Test Connection, Send Test SMS with simulated loading/success/auth error/provider error.

Create selectable SMS alert groups for Security, Availability, Infrastructure and Performance.
Add anti-spam settings: cooldown, max SMS/hour, duplicate grouping, persistent issue reminder, recovery SMS.
Add Quiet Hours with critical exceptions.
Add Maintenance Window suppression controls.

When finished, export/download the COMPLETE updated project as:
YGuard-Base44-06-Alerts-SMS.zip
Do not provide only code snippets.
```

---

## Prompt 7 — Reports + History + Compare + Diagnostics + Settings + Final Polish

```text
Finish the remaining YGuard frontend based on the uploaded reference project.
Frontend UI only. Mock data only. Do not create backend/API/PHP.
Do not redesign already completed pages; perform only consistency and responsive polish.

Build dedicated screens for existing routes:
- reports
- changelog
- compare
- diagnostics
- settings

REPORTS:
Presets: Site Health, Performance, Security, Uptime, HTTP Errors, Full Report.
Date range and section selectors.
Buttons: Preview, PDF, CSV, Print — visual only.
Add periodic report UI: Daily, Weekly, Monthly, recipients and sections.

CHANGE HISTORY:
Timeline/table for plugin installed/activated/deactivated/updated, theme changed, WordPress updated, administrator added/removed, settings changed, permalink changed, DNS changed.
Columns: Time, User, Change, Old Value, New Value, IP.

COMPARE SCANS:
Select Scan A and Scan B.
Comparison cards: Health, Security, Performance, Page Errors, Database.
States: Improved, Worse, Unchanged.
Create detailed differences table.
Also add Scan History table with date, duration, overall score, critical, warning, passed and triggered by.

DIAGNOSTICS:
Create system info sections for WordPress, Server, PHP, Database, Browser and YGuard.
Add mock tools for REST test, loopback test, email test, cron test, cache status, disk/storage status and diagnostic export.
Add Backup Status card and storage breakdown for Uploads, Plugins, Themes, Database and Logs.

SETTINGS:
Tabs: General, Monitoring, Performance, Security, Traffic, Alerts, Data Retention, Advanced.
Include monitoring modes Light / Balanced / Deep, intervals, performance thresholds, trusted proxy type, Allow List, Block List, retention days, debug toggle, export/import config, reset and delete data on uninstall.

Add an About/Product section inside Settings or Diagnostics:
YGuard
Version 1.0.0
سیستم جامع مانیتورینگ، سلامت و امنیت وردپرس
Designed & Developed by Younes Gohari

FINAL POLISH:
Verify all sidebar routes now open dedicated screens instead of the generic placeholder.
Keep responsive mobile behavior, loading/empty/error states, accessible focus states, tooltips, dialogs and toasts consistent.
Do not remove the existing dashboard or its content.

When finished, export/download the COMPLETE FINAL project as:
YGuard-Base44-07-FINAL.zip
Do not provide only code snippets.
```
