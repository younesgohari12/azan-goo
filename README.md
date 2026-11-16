# اسنپ‌شاپ اتومیشن — پنل مدیریت

فرانت‌اند اختصاصی افزونهٔ وردپرسی **SnappShop Automation**؛ یک داشبورد Premium SaaS فارسی و RTL
برای مدیریت محصولات، قیمت، موجودی، سفارش‌ها و همگام‌سازی بین ووکامرس و اسنپ‌شاپ.

- رابط کامل فارسی و RTL با فونت Vazirmatn و آیکون‌های Lucide
- تم روشن و تاریک، رنگ اصلی قابل تغییر از Design Token ها
- تمام صفحات: داشبورد، فروشگاه‌ها، محصولات، موجودی، قیمت‌گذاری، تخفیف‌ها، سفارش‌ها و جزئیات،
  مرکز همگام‌سازی، اتوماسیون، Jobها، گزارش‌ها، اعلان‌ها، تاریخچه فعالیت‌ها، تنظیمات
- نمایش مبالغ به **تومان** با اعداد فارسی و تاریخ **شمسی** (تبادل داده با API همیشه ISO میلادی است)
- داده‌های نمونه از رابط واقعی جدا هستند: `src/api/mock/` فقط در حالت نمایشی بارگذاری می‌شود

## اجرا

```bash
# با داکر (محیط توسعهٔ سندباکس)
docker compose -f docker-compose.base44.yml up -d --build

# یا مستقیم
npm install
npm run dev
```

سپس `http://localhost:3000`.

## Build برای افزونهٔ وردپرس

```bash
npm run build:plugin
```

خروجی در `dist/` ساخته می‌شود و باید در پوشهٔ asset های افزونه کپی شود. این build:

- `VITE_API_MODE=live` را از `.env.plugin` می‌خواند تا به REST API واقعی وصل شود
- `VITE_ROUTER=hash` را فعال می‌کند تا مسیرها در `wp-admin` بدون rewrite کار کنند
- `base: './'` است تا asset ها با مسیر نسبی بارگذاری شوند

نمونهٔ تزریق تنظیمات از سمت افزونه:

```php
wp_localize_script( 'snappshop-automation-app', 'snappShopAutomation', [
    'restUrl' => esc_url_raw( rest_url( 'snappshop-automation/v1' ) ),
    'nonce'   => wp_create_nonce( 'wp_rest' ),
    'apiMode' => 'live',
] );
```

اگر این مقادیر تزریق نشوند، پنل در حالت نمایشی (دادهٔ نمونه) اجرا می‌شود؛ این وضعیت با نشان
«حالت نمایشی» در سایدبار مشخص است.

## متغیرهای محیطی

| متغیر | پیش‌فرض | توضیح |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` | `live` برای اتصال واقعی به افزونه |
| `VITE_API_BASE` | `/wp-json/snappshop-automation/v1` | آدرس REST |
| `VITE_ROUTER` | `browser` | `hash` برای اجرا داخل wp-admin |

## ساختار

```
src/
  api/            کلاینت مرکزی، endpointها، تایپ‌ها، هوک‌های TanStack Query، دادهٔ نمونه
  app/            تنظیمات ظاهری، ناوبری
  components/     Design System (ui)، چیدمان (layout)، نمودارها
  lib/            فرمت اعداد/تومان/تاریخ شمسی، وضعیت‌ها، محاسبات قیمت
  pages/          صفحات پنل
  index.css       Design Token ها (رنگ، گردی، سایه)
```

## گزارش اتصال به API

فهرست endpointهای استفاده‌شده و قابلیت‌هایی که هنوز endpoint معتبر ندارند در
[`docs/INTEGRATION.md`](docs/INTEGRATION.md) آمده است.

## بررسی کیفیت

```bash
npm run build     # tsc + vite build
```
