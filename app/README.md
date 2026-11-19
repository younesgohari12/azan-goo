# SnappShop Automation — Admin UI

رابط کاربری مدیریت افزونه وردپرس **SnappShop Automation** (اتصال ووکامرس به اسنپ‌شاپ).
این پوشه یک فرانت‌اند مستقل با HTML، CSS و JavaScript خالص است؛ بدون بیلد، بدون فریم‌ورک و بدون وابستگی به بک‌اند اختصاصی.

## اجرا

```bash
python3 -m http.server 3000 --directory .
# یا در ریشه مخزن:
docker compose -f docker-compose.base44.yml up -d
```

سپس `http://localhost:3000` را باز کنید. فایل قابل دانلود در `download/snappshop-automation-ui.zip` ساخته می‌شود.

> این رابط از ES Module استفاده می‌کند؛ باز کردن مستقیم `index.html` با `file://` کار نمی‌کند. آن را روی یک سرور ساده (python/nginx) یا داخل `wp-admin` سرو کنید.

## ساختار

```
index.html                 پوستهٔ HTML و بارگذاری دارایی‌ها
assets/css/                توکن‌های طراحی، لایه‌بندی، کامپوننت‌ها، استایل صفحات
assets/js/core/            api (لایه سرویس)، mock، store، router، ui، utils
assets/js/components/      پوسته (سایدبار/تاپ‌بار/Palette) و بلوک‌های مشترک
assets/js/pages/           یک فایل برای هر صفحه
assets/fonts/              Vazirmatn (وزن متغیر، محلی)
assets/vendor/             Lucide (آیکون‌ها، محلی)
scripts/build-zip.py       ساخت خروجی ZIP در زمان اجرا
```

## حالت نمایشی و اتصال به API واقعی

به‌صورت پیش‌فرض رابط در حالت **mock** اجرا می‌شود و داده‌های واقع‌گرایانه از `assets/js/core/mock-data.js` می‌خواند.
برای اتصال به بک‌اند موجود افزونه، پیش از بارگذاری `app.js` این پیکربندی را از سمت وردپرس تزریق کنید:

```php
wp_enqueue_script( 'snappshop-admin', $url . '/assets/js/app.js', [], $ver, true );
wp_localize_script( 'snappshop-admin', 'SNAPP_AUTOMATION', [
    'mode'    => 'live',
    'apiBase' => esc_url_raw( rest_url( 'snappshop-automation/v1' ) ),
    'nonce'   => wp_create_nonce( 'wp_rest' ),
] );
```

- احراز هویت با Session وردپرس و هدر `X-WP-Nonce` انجام می‌شود (`credentials: 'same-origin'`).
- هیچ توکن یا Secret در JavaScript یا LocalStorage ذخیره نمی‌شود.
- اگر `mode` مقدار `live` نداشته باشد، همان قرارداد REST با داده‌های نمونه شبیه‌سازی می‌شود.

## قرارداد API استفاده‌شده

| متد | مسیر | کاربرد |
| --- | --- | --- |
| GET | `/overview` | آمار داشبورد |
| GET | `/products` | فهرست با `page`, `per_page`, `search`, `status`, `mapping`, `sync`, `sort`, `dir` |
| GET | `/products/{id}` | جزئیات محصول |
| POST | `/products/{id}/refresh` | دریافت مجدد محصول |
| POST | `/products/bulk-update` | ویرایش گروهی قیمت/موجودی |
| GET | `/mapping` | فهرست نگاشت‌ها + شمارش وضعیت‌ها |
| POST | `/mapping/auto` | نگاشت خودکار بر اساس SKU |
| POST/DELETE | `/mapping/{id}/link` | ایجاد/حذف نگاشت |
| GET | `/woo-products` | جست‌وجوی محصول ووکامرس |
| POST | `/pricing/preview` , `/pricing/apply` | پیش‌نمایش و اعمال قانون قیمت |
| GET | `/pricing/history` | تاریخچه تغییرات قیمت |
| GET | `/inventory` , POST `/inventory/{id}/reserve` | موجودی و رزرو |
| GET | `/orders` , `/orders/{id}` , POST `/orders/{id}/import` | سفارش‌ها |
| GET/POST | `/discounts` | برنامه‌های تخفیف |
| GET/PATCH | `/sync/status` , `/sync/settings` | وضعیت و تنظیمات همگام‌سازی |
| POST | `/sync/scan` | اسکن دستی |
| GET/POST/PATCH | `/automation` | قوانین اتوماسیون |
| GET | `/jobs` , POST `/jobs/{id}/cancel|retry` | صف عملیات |
| GET | `/logs` , `/logs/{id}` | لاگ‌ها |
| GET/POST | `/connections` , `/connections/{id}/discover` | اتصالات و فروشگاه‌ها |
| GET/POST | `/files` , `/files/export` , `/files/import` | ورود/خروج داده |
| GET/POST | `/backups` , `/backups/{id}/restore` | پشتیبان‌گیری |
| GET/PUT | `/settings` | تنظیمات |

## نکات پیاده‌سازی

- رابط کاملاً RTL و فارسی، فونت Vazirmatn محلی، پشتیبانی Light/Dark.
- مبالغ به‌صورت رشتهٔ اعشاری نگه‌داری می‌شوند؛ قیمت پایه تومان است و بر ۱۰ تقسیم نمی‌شود.
- مبلغ نامشخص (واحد پول سفارش تعیین نشده) با «نامشخص» نمایش داده می‌شود و در جمع فروش فقط سفارش‌های دارای مبلغ مشخص محاسبه می‌شوند.
- پیشرفت عملیات از دادهٔ Job API خوانده می‌شود.
- دسترسی‌ها با نقش نمایشی قابل بررسی است (منوی حساب → نقش نمایشی).
- میانبر `Ctrl+K` پالت فرمان را باز می‌کند.
