/* Deterministic, realistic mock data for the preview build.
   This module is only loaded when the app runs in mock mode. */

let seed = 20241119;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pick(list) { return list[Math.floor(rnd() * list.length)]; }
function int(min, max) { return Math.floor(rnd() * (max - min + 1)) + min; }
function chance(p) { return rnd() < p; }
function daysAgo(days, jitterHours = 20) {
  const t = Date.now() - days * 86400000 - int(0, jitterHours) * 3600000;
  return new Date(t).toISOString();
}

const BASE_NAMES = [
  'هدفون بی‌سیم انکر Life Q30',
  'پاوربانک شیائومی ۲۰۰۰۰',
  'ساعت هوشمند اپل سری ۹',
  'کیبورد مکانیکال ردراگون K617',
  'ماوس لاجیتک MX Master 3S',
  'اسپیکر بلوتوثی JBL Charge 5',
  'شارژر ۶۵ وات GaN',
  'کابل USB-C به لایتنینگ',
  'هارد اکسترنال سامسونگ T7',
  'فلش مموری سن‌دیسک ۱۲۸ گیگ',
  'مانیتور ال‌جی ۲۷ اینچ',
  'وب‌کم لاجیتک C920',
  'میکروفون بویا BY-M1',
  'پایه لپ‌تاپ آلومینیومی',
  'کیف لپ‌تاپ ۱۵ اینچ',
  'روتر TP-Link AX23',
  'تبلت سامسونگ Galaxy S6 Lite',
  'قلم استایلوس اپل',
  'محافظ صفحه شیشه‌ای',
  'هندزفری سیمی سونی',
  'ساعت مچی کاسیو',
  'چراغ رینگی نور',
  'تریپاد مانفروتو',
  'کارت حافظه ۲۵۶ گیگ',
  'هاب ۷ پورت تایپ سی',
  'کولر لپ‌تاپ',
  'پرینتر لیبل‌زن',
  'اسکنر بارکد بی‌سیم',
  'مبدل HDMI به VGA',
  'پد موس گیمینگ',
];
const VARIANTS = ['مشکی', 'سفید', 'نقره‌ای', 'آبی', 'خاکستری', ''];
const CATEGORIES = ['لوازم جانبی موبایل', 'صوتی و تصویری', 'کامپیوتر و لپ‌تاپ', 'شبکه', 'لوازم اداری', 'گیمینگ'];

const ISSUES = {
  remote_stock_drop: {
    code: 'remote_stock_drop',
    title: 'کاهش موجودی از سمت اسنپ‌شاپ',
    detail: 'موجودی اسنپ‌شاپ کمتر از موجودی قابل تخصیص ووکامرس است؛ همگام‌سازی معکوس متوقف شده تا از فروش بیش از موجودی جلوگیری شود.',
  },
  shared_variation: {
    code: 'shared_variation',
    title: 'موجودی مشترک بین تنوع‌ها',
    detail: 'این تنوع موجودی خودکار ندارد و از موجودی محصول اصلی استفاده می‌کند. ویرایش موجودی روی همه تنوع‌ها اثر می‌گذارد.',
  },
  duplicate_sku: {
    code: 'duplicate_sku',
    title: 'SKU تکراری در ووکامرس',
    detail: 'بیش از یک محصول ووکامرس با همین SKU پیدا شد. نگاشت خودکار انجام نشد تا تطبیق اشتباه رخ ندهد.',
  },
  api_error: {
    code: 'api_error',
    title: 'خطای دریافت از اسنپ‌شاپ',
    detail: 'آخرین درخواست با خطای ۴۲۹ (محدودیت نرخ) پاسخ داده شد. عملیات در صف برای تلاش مجدد است.',
  },
  missing_sku: {
    code: 'missing_sku',
    title: 'SKU ثبت نشده',
    detail: 'برای نگاشت خودکار، SKU یکتا لازم است. SKU این محصول در ووکامرس خالی است.',
  },
};

function productName(i) {
  const base = BASE_NAMES[i % BASE_NAMES.length];
  const variant = VARIANTS[Math.floor(rnd() * VARIANTS.length)];
  return variant ? `${base} — ${variant}` : base;
}

function makeProducts(count = 142) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const mappingRoll = rnd();
    let mapping = 'mapped';
    if (mappingRoll > 0.965) mapping = 'conflict';
    else if (mappingRoll > 0.925) mapping = 'ambiguous';
    else if (mappingRoll > 0.855) mapping = 'unmapped';

    const syncRoll = rnd();
    let sync = 'synced';
    if (mapping === 'conflict' || mapping === 'ambiguous') sync = 'stale';
    else if (syncRoll > 0.95) sync = 'failed';
    else if (syncRoll > 0.86) sync = 'stale';
    else if (syncRoll > 0.78) sync = 'pending';

    const wooStock = chance(0.07) ? 0 : int(1, 120);
    const snappStock = chance(0.18) ? Math.max(0, wooStock - int(3, 18)) : wooStock + int(0, 8);
    const reserved = chance(0.25) ? int(1, 6) : 0;
    const price = String(int(180, 9800) * 1000);
    const name = productName(i);
    const id = `prd_${String(i + 1).padStart(4, '0')}`;

    let issue = null;
    if (mapping === 'conflict') issue = chance(0.5) ? ISSUES.remote_stock_drop : ISSUES.shared_variation;
    else if (mapping === 'ambiguous') issue = ISSUES.duplicate_sku;
    else if (mapping === 'unmapped') issue = chance(0.4) ? ISSUES.missing_sku : null;
    else if (sync === 'failed') issue = ISSUES.api_error;

    list.push({
      id,
      name,
      sku: mapping === 'unmapped' && chance(0.5) ? '' : `SKU-${1200 + i}`,
      snappId: mapping === 'unmapped' ? null : `SP-${88400 + i}`,
      woo: mapping === 'unmapped'
        ? null
        : {
          id: 4800 + i,
          kind: chance(0.32) ? 'variation' : 'product',
          name,
          parentId: chance(0.32) ? 4200 + Math.floor(i / 3) : null,
          parentName: chance(0.32) ? `${BASE_NAMES[i % BASE_NAMES.length]} — گروه تنوع` : null,
        },
      price,
      snappPrice: chance(0.15) ? String(Number(price) + int(1, 12) * 10000) : price,
      stock: wooStock,
      snappStock,
      reserved,
      safety: chance(0.3) ? int(2, 10) : 0,
      status: wooStock === 0 ? 'out_of_stock' : (chance(0.06) ? 'inactive' : 'active'),
      mapping,
      sync,
      issue,
      category: CATEGORIES[i % CATEGORIES.length],
      updatedAt: daysAgo(int(0, 9)),
    });
  }
  return list;
}

function makeOrders(count = 86) {
  const statuses = ['new', 'processing', 'processing', 'shipped', 'shipped', 'delivered', 'delivered', 'canceled', 'returned'];
  const cities = ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج', 'اهواز', 'قم'];
  const firstNames = ['سارا', 'محمد', 'نگار', 'امیر', 'الهام', 'رضا', 'مریم', 'حسین', 'پریسا', 'کیان'];
  const lastNames = ['احمدی', 'رضایی', 'موسوی', 'کریمی', 'شریفی', 'نیک‌پور', 'صادقی', 'حیدری'];
  const products = makeProducts(30);
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const status = pick(statuses);
    const itemCount = int(1, 3);
    const items = [];
    let total = 0;
    for (let j = 0; j < itemCount; j += 1) {
      const p = products[(i * 3 + j * 7) % products.length];
      const qty = int(1, 2);
      const unit = Number(p.price);
      total += unit * qty;
      items.push({ name: p.name, sku: p.sku, qty, unitPrice: String(unit), snappId: p.snappId || `SP-${88400 + i}` });
    }
    const hasAmount = chance(0.62);
    const imported = chance(0.76) ? 'imported' : (chance(0.5) ? 'pending' : 'failed');
    const city = pick(cities);
    list.push({
      id: `ord_${String(i + 1).padStart(4, '0')}`,
      snappOrderId: `SP-${104500 + i}`,
      wooOrderId: imported === 'imported' ? 8300 + i : null,
      createdAt: daysAgo(int(0, 18)),
      amount: hasAmount ? String(total) : null,
      currency: hasAmount ? 'IRT' : null,
      status,
      imported,
      canceled: status === 'canceled',
      items,
      customer: {
        name: `${pick(firstNames)} ${pick(lastNames)}`,
        phone: `09${int(10, 39)}${int(1000000, 9999999)}`,
        city,
        addressMasked: `${city}، خیابان ${int(1, 90)} — جزئیات نشانی در دسترس نیست`,
      },
      timeline: [
        { title: 'دریافت سفارش از اسنپ‌شاپ', time: daysAgo(int(1, 18)), tone: 'brand' },
        ...(chance(0.7) ? [{ title: 'ورود به ووکامرس', time: daysAgo(int(0, 10)), tone: 'success' }] : []),
        ...(status === 'canceled' ? [{ title: 'لغو توسط مشتری', time: daysAgo(int(0, 5)), tone: 'danger' }] : []),
      ],
    });
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

const JOB_TYPES = [
  'همگام‌سازی محصولات', 'دریافت سفارش‌ها', 'اعمال قیمت‌گذاری',
  'به‌روزرسانی موجودی', 'خروجی CSV محصولات', 'بازیابی پشتیبان', 'نگاشت خودکار SKU',
];

function makeJobs(count = 22) {
  const statuses = ['running', 'running', 'pending', 'pending', 'completed', 'completed', 'completed', 'partial', 'failed', 'canceled'];
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const status = pick(statuses);
    const total = int(40, 480);
    const done = status === 'completed' ? total : status === 'pending' ? 0 : int(10, total - 4);
    const failed = status === 'failed' ? int(3, 22) : status === 'partial' ? int(1, 9) : 0;
    const progress = status === 'completed' ? 100 : Math.round((done / total) * 100);
    list.push({
      id: `job_${String(1024 + i)}`,
      type: pick(JOB_TYPES),
      store: pick(['فروشگاه اصلی', 'شعبه دیجیتال']),
      status,
      progress: Math.min(100, progress),
      total,
      success: status === 'pending' ? 0 : Math.max(0, done - failed),
      failed,
      createdAt: daysAgo(int(0, 6)),
      startedAt: status === 'pending' ? null : daysAgo(int(0, 5)),
      durationSec: status === 'pending' ? null : int(12, 640),
      error: status === 'failed' || status === 'partial'
        ? 'پاسخ ۴۲۹ از اسنپ‌شاپ — محدودیت نرخ درخواست؛ بخشی از موارد در تلاش بعدی پردازش می‌شود.'
        : null,
      cancelable: ['pending', 'running'].includes(status),
      retryable: ['failed', 'partial', 'canceled'].includes(status),
    });
  }
  return list;
}

const LOG_PATHS = [
  ['GET', '/products?page=2&per_page=25', 200],
  ['GET', '/orders?since=2026-11-12', 200],
  ['POST', '/products/prd_0042/refresh', 200],
  ['POST', '/pricing/apply', 201],
  ['GET', '/sync/status', 200],
  ['PATCH', '/inventory/prd_0018', 422],
  ['GET', '/orders/SP-104532', 404],
  ['POST', '/orders/SP-104532/import', 201],
  ['GET', '/products?search=', 200],
  ['POST', '/automation/rule_03/run', 202],
  ['GET', '/jobs/job_1027', 429],
  ['DELETE', '/mapping/prd_0077/link', 204],
  ['GET', '/reports/sales', 200],
  ['POST', '/connections/discover', 200],
  ['PUT', '/settings', 200],
];

function makeLogs(count = 168) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const [method, path, status] = pick(LOG_PATHS);
    const level = status >= 500 ? 'error' : status >= 400 ? 'warning' : 'info';
    list.push({
      id: `log_${String(9000 + i)}`,
      time: daysAgo(int(0, 7), 23),
      level,
      method,
      path,
      status,
      durationMs: int(38, 2400),
      message: status === 429
        ? 'Rate limit reached — retry scheduled'
        : status === 422
          ? 'Validation failed: stock value out of range'
          : status === 404
            ? 'Order not found on SnappShop'
            : status >= 500
              ? 'Upstream error'
              : 'OK',
      request: {
        method,
        path,
        headers: { 'User-Agent': 'SnappShop-Automation/2.4.1', 'X-WP-Nonce': '••••••••' },
        body: method === 'POST' || method === 'PATCH' || method === 'PUT'
          ? { product_id: 4812, price: '2450000', note: 'demo payload' }
          : null,
      },
      response: status < 400
        ? { status, data: { ok: true } }
        : { status, code: status === 429 ? 'rate_limited' : 'validation_error', message: 'درخواست پذیرفته نشد' },
    });
  }
  return list.sort((a, b) => new Date(b.time) - new Date(a.time));
}

function makePriceHistory() {
  return [
    { id: 'ph_01', at: daysAgo(1), rule: 'افزایش ۵٪ گروهی', products: 120, applied: 96, failed: 24, status: 'partial', user: 'مدیر کل' },
    { id: 'ph_02', at: daysAgo(2), rule: 'گرد کردن به ۱۰٬۰۰۰ تومان', products: 142, applied: 142, failed: 0, status: 'completed', user: 'مدیر کل' },
    { id: 'ph_03', at: daysAgo(4), rule: 'کاهش ۳٪ دسته صوتی', products: 38, applied: 38, failed: 0, status: 'completed', user: 'اپراتور فروشگاه' },
    { id: 'ph_04', at: daysAgo(6), rule: 'تعیین قیمت ثابت ۲٬۴۹۰٬۰۰۰', products: 12, applied: 0, failed: 12, status: 'failed', user: 'مدیر کل' },
    { id: 'ph_05', at: daysAgo(9), rule: 'افزایش ۲٪ هفتگی', products: 142, applied: 142, failed: 0, status: 'completed', user: 'زمان‌بندی خودکار' },
    { id: 'ph_06', at: daysAgo(12), rule: 'حداقل قیمت ۳۵۰٬۰۰۰ تومان', products: 64, applied: 64, failed: 0, status: 'completed', user: 'مدیر کل' },
    { id: 'ph_07', at: daysAgo(15), rule: 'کاهش ۱۰٪ محصولات ناموجود', products: 18, applied: 18, failed: 0, status: 'completed', user: 'اپراتور فروشگاه' },
    { id: 'ph_08', at: daysAgo(19), rule: 'افزایش ۴٪ گروهی', products: 138, applied: 130, failed: 8, status: 'partial', user: 'مدیر کل' },
  ];
}

function makeDiscounts() {
  const products = makeProducts(14);
  return products.map((p, i) => {
    const percent = chance(0.55);
    const status = i === 0 ? 'sent' : i === 1 ? 'scheduled' : i === 2 ? 'sent' : i === 3 ? 'draft' : pick(['scheduled', 'sent', 'draft', 'sent']);
    return {
      id: `dsc_${100 + i}`,
      productId: p.id,
      product: p.name,
      sku: p.sku,
      type: percent ? 'percent' : 'amount',
      value: percent ? String(int(5, 35)) : String(int(2, 30) * 10000),
      specialPrice: String(Math.round(Number(p.price) * (percent ? 1 - int(5, 35) / 100 : 0.9))),
      basePrice: p.price,
      startsAt: daysAgo(int(0, 3) - 2),
      endsAt: daysAgo(-int(2, 20)),
      allocatedStock: int(4, 40),
      soldStock: int(0, 12),
      status,
      editable: status !== 'sent',
    };
  });
}

function makeRules() {
  return [
    {
      id: 'rule_01', name: 'کاهش قیمت محصولات کم‌فروش', enabled: true, lastRun: daysAgo(1),
      trigger: { type: 'schedule', value: 'هر روز ساعت ۰۲:۰۰' },
      conditions: [
        { field: 'stock', op: '>', value: '20' },
        { field: 'sync', op: '=', value: 'synced' },
      ],
      conditionLogic: 'AND',
      actions: [
        { type: 'pricing', value: 'کاهش ۳٪' },
        { type: 'notify', value: 'ارسال خلاصه به مدیر' },
      ],
      runs: 42,
    },
    {
      id: 'rule_02', name: 'همگام‌سازی موجودی پس از سفارش', enabled: true, lastRun: daysAgo(0),
      trigger: { type: 'event', value: 'سفارش جدید در اسنپ‌شاپ' },
      conditions: [{ field: 'mapping', op: '=', value: 'mapped' }],
      conditionLogic: 'AND',
      actions: [{ type: 'sync', value: 'همگام‌سازی موجودی محصول' }],
      runs: 318,
    },
    {
      id: 'rule_03', name: 'هشدار تداخل موجودی', enabled: true, lastRun: daysAgo(2),
      trigger: { type: 'cron', value: 'هر ۶ ساعت' },
      conditions: [{ field: 'snappStock', op: '<', value: 'stock' }],
      conditionLogic: 'AND',
      actions: [{ type: 'notify', value: 'اعلان به اپراتور' }],
      runs: 96,
    },
    {
      id: 'rule_04', name: 'افزایش قیمت پایان هفته', enabled: false, lastRun: daysAgo(9),
      trigger: { type: 'schedule', value: 'پنجشنبه ساعت ۱۸:۰۰' },
      conditions: [{ field: 'status', op: '=', value: 'active' }],
      conditionLogic: 'AND',
      actions: [{ type: 'pricing', value: 'افزایش ۲٪' }],
      runs: 6,
    },
    {
      id: 'rule_05', name: 'قرنطینه محصولات بدون نگاشت', enabled: true, lastRun: daysAgo(3),
      trigger: { type: 'cron', value: 'هر ۱۲ ساعت' },
      conditions: [
        { field: 'mapping', op: '=', value: 'unmapped' },
        { field: 'stock', op: '>', value: '0' },
      ],
      conditionLogic: 'OR',
      actions: [
        { type: 'sync', value: 'توقف همگام‌سازی قیمت' },
        { type: 'notify', value: 'اعلان به مدیر' },
      ],
      runs: 18,
    },
  ];
}

function makeFiles() {
  return [
    { id: 'file_01', name: 'products-export-2026-11-19.csv', kind: 'csv', size: 482114, rows: 142, createdAt: daysAgo(0), status: 'ready' },
    { id: 'file_02', name: 'products-export-2026-11-18.json', kind: 'json', size: 918402, rows: 142, createdAt: daysAgo(1), status: 'ready' },
    { id: 'file_03', name: 'orders-2026-11.csv', kind: 'csv', size: 231904, rows: 86, createdAt: daysAgo(2), status: 'ready' },
    { id: 'file_04', name: 'import-price-batch-04.csv', kind: 'csv', size: 20481, rows: 38, createdAt: daysAgo(4), status: 'ready' },
    { id: 'file_05', name: 'backup-encrypted-2026-11-18.snap', kind: 'backup', size: 4404019, rows: null, createdAt: daysAgo(1), status: 'ready' },
  ];
}

export function createDb() {
  seed = 20241119;
  const products = makeProducts(142);
  return {
    products,
    orders: makeOrders(86),
    jobs: makeJobs(22),
    logs: makeLogs(168),
    priceHistory: makePriceHistory(),
    discounts: makeDiscounts(),
    rules: makeRules(),
    files: makeFiles(),
    connections: [
      {
        id: 'conn_01', name: 'اتصال اصلی — فروشگاه تهران', status: 'connected',
        tokenMasked: '••••••••••••7f2a', userAgent: 'SnappShop-Automation/2.4.1 (+woocommerce)',
        createdAt: daysAgo(64), lastCheck: daysAgo(0),
        stores: [
          { id: 'store_1', name: 'فروشگاه اصلی', code: 'SNAP-8841', role: 'owner', access: true },
          { id: 'store_2', name: 'شعبه دیجیتال', code: 'SNAP-9127', role: 'manager', access: true },
          { id: 'store_3', name: 'انبار شمال', code: 'SNAP-7742', role: 'viewer', access: false },
        ],
      },
      {
        id: 'conn_02', name: 'اتصال آزمایشی', status: 'error',
        tokenMasked: '••••••••••••1c90', userAgent: 'SnappShop-Automation/2.4.1',
        createdAt: daysAgo(12), lastCheck: daysAgo(1),
        stores: [],
      },
    ],
    wooProducts: products.filter((p) => p.woo).slice(0, 48).map((p) => ({
      id: p.woo.id, name: p.name, sku: p.sku, kind: p.woo.kind, price: p.price, stock: p.stock,
      parentName: p.woo.parentName,
    })),
    sync: {
      mirror: true,
      autoSync: true,
      intervalMinutes: 15,
      lastProductSync: daysAgo(0, 1),
      lastOrderSync: daysAgo(0, 1),
      matching: 'sku',
      currencyUnit: null,
      productsTotal: 142,
      productsSynced: 118,
      ordersTotal: 86,
      ordersSynced: 67,
      checkpoints: [
        { id: 'cp_1', label: 'محصولات — صفحه ۶ از ۶', at: daysAgo(0, 1), status: 'completed' },
        { id: 'cp_2', label: 'سفارش‌ها — تا SP-104586', at: daysAgo(0, 1), status: 'completed' },
        { id: 'cp_3', label: 'موجودی — دسته صوتی', at: daysAgo(0, 3), status: 'partial' },
      ],
    },
    backups: [
      { id: 'bk_01', name: 'backup-encrypted-2026-11-18.snap', size: 4404019, createdAt: daysAgo(1), status: 'verified', encrypted: true, includes: ['محصولات', 'نگاشت‌ها', 'قوانین قیمت', 'تنظیمات'] },
      { id: 'bk_02', name: 'backup-encrypted-2026-11-11.snap', size: 4102221, createdAt: daysAgo(8), status: 'verified', encrypted: true, includes: ['محصولات', 'نگاشت‌ها', 'قوانین قیمت', 'تنظیمات'] },
      { id: 'bk_03', name: 'backup-encrypted-2026-11-04.snap', size: 3902114, createdAt: daysAgo(15), status: 'verified', encrypted: true, includes: ['محصولات', 'نگاشت‌ها'] },
    ],
    settings: {
      general: { storeName: 'فروشگاه اصلی', adminLanguage: 'fa', timezone: 'Asia/Tehran', dateFormat: 'jYYYY/jMM/jDD' },
      sync: { interval: '15', mirror: true, matchBy: 'sku', autoRetry: true },
      pricing: { rounding: '10000', minPrice: '150000', maxPrice: '50000000', currency: 'IRT' },
      inventory: { source: 'min', safety: '3', reserveOnOrder: true },
      orders: { currencyUnit: null, autoImport: true, customerMasking: true },
      limits: { requestsPerMinute: '60', concurrency: '4', backoff: 'exponential' },
      security: { requireNonce: true, logRetentionDays: '30', maskTokens: true },
      modules: { pricing: true, automation: true, discounts: true, reports: true, mirror: true },
      retention: { logsDays: '30', jobsDays: '14', filesDays: '7' },
    },
  };
}

export const ACTIVITY = [
  { tone: 'success', text: 'همگام‌سازی محصولات کامل شد — <b>۱۱۸</b> محصول به‌روزرسانی شد', time: daysAgo(0, 1) },
  { tone: 'warning', text: 'تداخل موجودی برای <b>۳</b> محصول شناسایی شد', time: daysAgo(0, 2) },
  { tone: 'brand', text: 'قانون «همگام‌سازی موجودی پس از سفارش» اجرا شد', time: daysAgo(0, 4) },
  { tone: 'danger', text: 'عملیات «تعیین قیمت ثابت» ناموفق ماند — <b>۱۲</b> خطا', time: daysAgo(1, 2) },
  { tone: 'success', text: '<b>۳۸</b> سفارش جدید از اسنپ‌شاپ دریافت شد', time: daysAgo(1, 5) },
  { tone: 'neutral', text: 'اپراتور فروشگاه نگاشت <b>۴</b> محصول را دستی اصلاح کرد', time: daysAgo(2, 1) },
];
