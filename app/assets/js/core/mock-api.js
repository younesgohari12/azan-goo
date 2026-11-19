/* Mock REST implementation. Mirrors the real `/wp-json/snappshop-automation/v1`
   contract so swapping the transport to the live API needs no view changes. */

import { ACTIVITY } from './mock-data.js';

function paginate(items, params = {}) {
  const perPage = Number(params.per_page || 25);
  const page = Math.max(1, Number(params.page || 1));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total,
    page: Math.min(page, pages),
    per_page: perPage,
    pages,
  };
}

function sortItems(items, key, dir = 'asc') {
  if (!key) return items;
  const factor = dir === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
    return String(av ?? '').localeCompare(String(bv ?? ''), 'fa') * factor;
  });
}

function roundTo(value, step) {
  const s = Number(step);
  if (!s || s <= 0) return Math.round(value);
  return Math.round(value / s) * s;
}

/** Evaluate a tiny price formula: `price * 1.05 + 10000`. */
export function computePrice(base, rule = {}) {
  const price = Number(base);
  const value = Number(String(rule.value ?? '').replace(/,/g, '')) || 0;
  let next = price;
  let reason = '';

  switch (rule.type) {
    case 'percent':
      next = price + (price * value / 100) * (rule.direction === 'decrease' ? -1 : 1);
      break;
    case 'fixed':
      next = price + value * (rule.direction === 'decrease' ? -1 : 1);
      break;
    case 'set':
      next = value;
      break;
    case 'formula': {
      const expr = String(rule.value || 'price');
      if (!/^[\d\s+\-*/().price]+$/i.test(expr)) {
        return { next: price, valid: false, reason: 'فرمول نامعتبر است' };
      }
      try {
        // eslint-disable-next-line no-new-func
        next = Number(new Function('price', `return (${expr});`)(price));
      } catch (e) {
        return { next: price, valid: false, reason: 'فرمول قابل محاسبه نیست' };
      }
      break;
    }
    default:
      break;
  }

  next = roundTo(next, rule.rounding === 'none' ? 0 : rule.rounding || 0);

  const min = rule.min ? Number(rule.min) : null;
  const max = rule.max ? Number(rule.max) : null;
  if (min !== null && next < min) { next = min; reason = 'به حداقل مجاز محدود شد'; }
  if (max !== null && next > max) { next = max; reason = 'به حداکثر مجاز محدود شد'; }

  if (!Number.isFinite(next) || next <= 0) {
    return { next: price, valid: false, reason: 'قیمت حاصل نامعتبر است' };
  }
  return { next: Math.round(next), valid: true, reason };
}

const PRICE_FIELDS = ['sku', 'name', 'price', 'stock', 'status', 'mapping', 'sync', 'updatedAt', 'snappId', 'category'];

export function createMockApi(db) {
  const state = { recovery: null, lastScan: null, discovered: null };

  function findProduct(id) {
    return db.products.find((p) => p.id === id);
  }

  function productList(params = {}) {
    let items = db.products;
    if (params.search) {
      const q = String(params.search).toLowerCase();
      items = items.filter((p) => `${p.name} ${p.sku} ${p.snappId || ''}`.toLowerCase().includes(q));
    }
    ['status', 'mapping', 'sync', 'category'].forEach((key) => {
      if (params[key] && params[key] !== 'all') items = items.filter((p) => p[key] === params[key]);
    });
    if (params.issue === '1') items = items.filter((p) => p.issue);
    const sorted = sortItems(items, PRICE_FIELDS.includes(params.sort) ? params.sort : 'updatedAt', params.dir || 'desc');
    return {
      ...paginate(sorted, params),
      facets: {
        status: {
          all: db.products.length,
          active: db.products.filter((p) => p.status === 'active').length,
          inactive: db.products.filter((p) => p.status === 'inactive').length,
          out_of_stock: db.products.filter((p) => p.status === 'out_of_stock').length,
        },
        mapping: {
          all: db.products.length,
          mapped: db.products.filter((p) => p.mapping === 'mapped').length,
          unmapped: db.products.filter((p) => p.mapping === 'unmapped').length,
          ambiguous: db.products.filter((p) => p.mapping === 'ambiguous').length,
          conflict: db.products.filter((p) => p.mapping === 'conflict').length,
        },
      },
    };
  }

  const routes = [
    ['GET', /^\/overview$/, () => {
      const lowStock = db.products.filter((p) => p.stock <= 3).length;
      return {
        stats: {
          products: db.products.length,
          active: db.products.filter((p) => p.status === 'active').length,
          outOfStock: db.products.filter((p) => p.status === 'out_of_stock').length,
          orders: db.orders.length,
          sales: db.orders.reduce((sum, o) => (o.amount ? sum + Number(o.amount) : sum), 0),
          salesKnown: db.orders.filter((o) => o.amount).length,
          salesUnknown: db.orders.filter((o) => !o.amount).length,
          failedJobs: db.jobs.filter((j) => j.status === 'failed' || j.status === 'partial').length,
          lowStock,
        },
        health: {
          woocommerce: { status: 'connected', label: 'ووکامرس', detail: 'WooCommerce 9.3 — REST API فعال' },
          snapp: { status: 'connected', label: 'اسنپ‌شاپ', detail: 'SNAP-8841 — توکن معتبر تا ۱۲ روز دیگر' },
          mirror: { enabled: db.sync.mirror, lastProductSync: db.sync.lastProductSync, lastOrderSync: db.sync.lastOrderSync },
          autoSync: db.sync.autoSync,
          interval: db.sync.intervalMinutes,
        },
        recentOrders: db.orders.slice(0, 5),
        activity: ACTIVITY,
        runningJobs: db.jobs.filter((j) => ['running', 'pending'].includes(j.status)).slice(0, 3),
        issues: db.products.filter((p) => p.issue).slice(0, 4),
        counts: {
          unmapped: db.products.filter((p) => p.mapping === 'unmapped').length,
          conflicts: db.products.filter((p) => p.mapping === 'conflict').length,
          failedJobs: db.jobs.filter((j) => ['failed', 'partial'].includes(j.status)).length,
        },
      };
    }],

    ['GET', /^\/products$/, (_, __, params) => productList(params)],
    ['GET', /^\/products\/([\w-]+)$/, (id) => {
      const product = findProduct(id);
      if (!product) throw { status: 404, message: 'محصول پیدا نشد' };
      return product;
    }],
    ['POST', /^\/products\/([\w-]+)\/refresh$/, (id) => {
      const product = findProduct(id);
      if (!product) throw { status: 404, message: 'محصول پیدا نشد' };
      product.updatedAt = new Date().toISOString();
      product.sync = 'synced';
      return { ok: true, product };
    }],
    ['POST', /^\/products\/bulk-update$/, (_, body) => {
      const ids = body.ids || [];
      let updated = 0;
      ids.forEach((id) => {
        const p = findProduct(id);
        if (!p) return;
        if (body.price !== undefined && body.price !== null && body.price !== '') {
          p.price = String(Math.round(Number(body.price)));
          p.sync = 'pending';
        }
        if (body.stock !== undefined && body.stock !== null && body.stock !== '') {
          p.stock = Number(body.stock);
          p.status = p.stock === 0 ? 'out_of_stock' : 'active';
          p.sync = 'pending';
        }
        p.updatedAt = new Date().toISOString();
        updated += 1;
      });
      return { updated };
    }],

    ['GET', /^\/mapping$/, (_, __, params) => {
      const counts = {
        all: db.products.length,
        unmapped: db.products.filter((p) => p.mapping === 'unmapped').length,
        ambiguous: db.products.filter((p) => p.mapping === 'ambiguous').length,
        conflict: db.products.filter((p) => p.mapping === 'conflict').length,
        mapped: db.products.filter((p) => p.mapping === 'mapped').length,
      };
      let items = db.products;
      if (params.tab && params.tab !== 'all') items = items.filter((p) => p.mapping === params.tab);
      if (params.search) {
        const q = String(params.search).toLowerCase();
        items = items.filter((p) => `${p.name} ${p.sku} ${p.snappId || ''} ${p.woo?.name || ''}`.toLowerCase().includes(q));
      }
      return { ...paginate(items, { ...params, per_page: params.per_page || 20 }), counts };
    }],
    ['POST', /^\/mapping\/auto$/, () => {
      const candidates = db.products.filter((p) => p.mapping === 'unmapped' && p.sku);
      let linked = 0;
      candidates.forEach((p) => {
        const match = db.wooProducts.find((w) => w.sku === p.sku);
        if (match) {
          p.woo = { id: match.id, kind: match.kind, name: match.name, parentId: null, parentName: match.parentName || null };
          p.mapping = 'mapped';
          p.sync = 'pending';
          linked += 1;
        }
      });
      return { linked, skipped: candidates.length - linked };
    }],
    ['POST', /^\/mapping\/([\w-]+)\/link$/, (id, body) => {
      const product = findProduct(id);
      const woo = db.wooProducts.find((w) => String(w.id) === String(body.wooId));
      if (!product || !woo) throw { status: 422, message: 'محصول انتخابی معتبر نیست' };
      product.woo = { id: woo.id, kind: woo.kind, name: woo.name, parentId: null, parentName: woo.parentName || null };
      product.mapping = 'mapped';
      product.sync = 'pending';
      product.issue = null;
      return { ok: true, product };
    }],
    ['DELETE', /^\/mapping\/([\w-]+)\/link$/, (id) => {
      const product = findProduct(id);
      if (!product) throw { status: 404, message: 'محصول پیدا نشد' };
      product.woo = null;
      product.mapping = 'unmapped';
      product.sync = 'stale';
      return { ok: true, product };
    }],
    ['GET', /^\/woo-products$/, (_, __, params) => {
      let items = db.wooProducts;
      if (params.search) {
        const q = String(params.search).toLowerCase();
        items = items.filter((w) => `${w.name} ${w.sku}`.toLowerCase().includes(q));
      }
      return { items: items.slice(0, 12) };
    }],

    ['GET', /^\/pricing\/history$/, () => ({ items: db.priceHistory })],
    ['POST', /^\/pricing\/preview$/, (_, body) => {
      const ids = body.productIds?.length ? body.productIds : db.products.slice(0, 12).map((p) => p.id);
      const rows = ids.map((id) => {
        const p = findProduct(id);
        const result = computePrice(p.price, body.rule);
        const diff = result.next - Number(p.price);
        return {
          id: p.id, name: p.name, sku: p.sku, oldPrice: p.price, newPrice: String(result.next),
          diff: String(diff), diffPercent: Number(p.price) ? (diff / Number(p.price)) * 100 : 0,
          valid: result.valid, reason: result.reason,
        };
      });
      return {
        rows,
        summary: {
          total: rows.length,
          changed: rows.filter((r) => r.valid && Number(r.newPrice) !== Number(r.oldPrice)).length,
          invalid: rows.filter((r) => !r.valid).length,
        },
      };
    }],
    ['POST', /^\/pricing\/apply$/, (_, body) => {
      const ids = body.productIds?.length ? body.productIds : [];
      const rows = ids.map((id) => {
        const p = findProduct(id);
        const result = computePrice(p.price, body.rule);
        return { p, result };
      });
      const applied = rows.filter((r) => r.result.valid);
      const snapshot = rows.map(({ p }) => ({ id: p.id, previous: p.price }));
      applied.forEach(({ p, result }) => {
        p.price = String(result.next);
        p.sync = 'pending';
        p.updatedAt = new Date().toISOString();
      });
      const record = {
        id: `ph_${Date.now()}`, at: new Date().toISOString(), rule: body.ruleLabel || 'قانون قیمت‌گذاری',
        products: rows.length, applied: applied.length, failed: rows.length - applied.length,
        status: applied.length === rows.length ? 'completed' : applied.length ? 'partial' : 'failed',
        user: 'مدیر کل', snapshot, revertable: true,
      };
      db.priceHistory.unshift(record);
      return { record };
    }],
    ['POST', /^\/pricing\/history\/([\w-]+)\/revert$/, (id) => {
      const record = db.priceHistory.find((h) => h.id === id);
      if (!record?.snapshot) throw { status: 422, message: 'برای این عملیات امکان بازگردانی وجود ندارد' };
      return {
        preview: record.snapshot.slice(0, 20).map((s) => ({
          id: s.id, name: findProduct(s.id)?.name || s.id, current: findProduct(s.id)?.price || s.previous, restored: s.previous,
        })),
      };
    }],

    ['GET', /^\/inventory$/, (_, __, params) => {
      let items = db.products.map((p) => ({
        id: p.id, name: p.name, sku: p.sku, image: p.name,
        wooStock: p.stock, snappStock: p.snappStock, reserved: p.reserved,
        allocatable: Math.max(0, p.snappStock - p.reserved), safety: p.safety,
        conflict: p.issue && ['remote_stock_drop', 'shared_variation'].includes(p.issue.code) ? p.issue.code : null,
        sharedVariation: p.woo?.kind === 'variation' && p.issue?.code === 'shared_variation',
        updatedAt: p.updatedAt,
      }));
      if (params.search) {
        const q = String(params.search).toLowerCase();
        items = items.filter((i) => `${i.name} ${i.sku}`.toLowerCase().includes(q));
      }
      if (params.conflict === '1') items = items.filter((i) => i.conflict);
      return paginate(items, { ...params, per_page: params.per_page || 20 });
    }],
    ['POST', /^\/inventory\/([\w-]+)\/reserve$/, (id, body) => {
      const p = findProduct(id);
      if (!p) throw { status: 404, message: 'محصول پیدا نشد' };
      const qty = Number(body.qty || 0);
      if (!qty || qty <= 0) throw { status: 422, message: 'تعداد رزرو معتبر نیست' };
      if (qty > p.snappStock - p.reserved) throw { status: 422, message: 'موجودی قابل تخصیص کافی نیست' };
      p.reserved += qty;
      return { ok: true, reserved: p.reserved, allocatable: p.snappStock - p.reserved };
    }],
    ['POST', /^\/inventory\/([\w-]+)\/release$/, (id) => {
      const p = findProduct(id);
      if (!p) throw { status: 404, message: 'محصول پیدا نشد' };
      p.reserved = 0;
      return { ok: true, reserved: 0, allocatable: p.snappStock };
    }],

    ['GET', /^\/orders$/, (_, __, params) => {
      let items = db.orders;
      if (params.search) {
        const q = String(params.search).toLowerCase();
        items = items.filter((o) => `${o.snappOrderId} ${o.wooOrderId || ''} ${o.customer.name}`.toLowerCase().includes(q));
      }
      ['status', 'imported'].forEach((k) => {
        if (params[k] && params[k] !== 'all') items = items.filter((o) => o[k] === params[k]);
      });
      if (params.from) items = items.filter((o) => new Date(o.createdAt) >= new Date(params.from));
      if (params.to) items = items.filter((o) => new Date(o.createdAt) <= new Date(params.to));
      return paginate(items, { ...params, per_page: params.per_page || 20 });
    }],
    ['GET', /^\/orders\/([\w-]+)$/, (id) => {
      const order = db.orders.find((o) => o.id === id || o.snappOrderId === id);
      if (!order) throw { status: 404, message: 'سفارش پیدا نشد' };
      return order;
    }],
    ['POST', /^\/orders\/([\w-]+)\/import$/, (id) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw { status: 404, message: 'سفارش پیدا نشد' };
      order.imported = 'imported';
      order.wooOrderId = order.wooOrderId || 8300 + Math.floor(Math.random() * 900);
      return { ok: true, order };
    }],
    ['POST', /^\/orders\/([\w-]+)\/refetch$/, (id) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw { status: 404, message: 'سفارش پیدا نشد' };
      order.timeline = [...order.timeline, { title: 'دریافت مجدد اطلاعات سفارش', time: new Date().toISOString(), tone: 'brand' }];
      return { ok: true, order };
    }],

    ['GET', /^\/discounts$/, () => ({ items: db.discounts })],
    ['POST', /^\/discounts$/, (_, body) => {
      const product = findProduct(body.productId);
      if (!product) throw { status: 422, message: 'محصول انتخاب نشده است' };
      const record = {
        id: `dsc_${Date.now()}`, productId: product.id, product: product.name, sku: product.sku,
        type: body.type || 'percent', value: String(body.value || 0),
        specialPrice: String(body.specialPrice || product.price), basePrice: product.price,
        startsAt: body.startsAt || new Date().toISOString(), endsAt: body.endsAt || new Date().toISOString(),
        allocatedStock: Number(body.allocatedStock || 0), soldStock: 0, status: 'draft', editable: true,
      };
      db.discounts.unshift(record);
      return record;
    }],
    ['PATCH', /^\/discounts\/([\w-]+)$/, (id, body) => {
      const record = db.discounts.find((d) => d.id === id);
      if (!record) throw { status: 404, message: 'برنامه تخفیف پیدا نشد' };
      if (record.status === 'sent') throw { status: 422, message: 'برنامه ارسال‌شده قابل ویرایش نیست' };
      Object.assign(record, body);
      return record;
    }],
    ['DELETE', /^\/discounts\/([\w-]+)$/, (id) => {
      const record = db.discounts.find((d) => d.id === id);
      if (!record) throw { status: 404, message: 'برنامه تخفیف پیدا نشد' };
      if (record.status === 'sent') throw { status: 422, message: 'برنامه ارسال‌شده قابل لغو نیست' };
      db.discounts = db.discounts.filter((d) => d.id !== id);
      return { ok: true };
    }],

    ['GET', /^\/sync\/status$/, () => ({
      ...db.sync,
      conflicts: db.products.filter((p) => p.mapping === 'conflict').length,
      ambiguous: db.products.filter((p) => p.mapping === 'ambiguous').length,
      unmapped: db.products.filter((p) => p.mapping === 'unmapped').length,
    })],
    ['PATCH', /^\/sync\/settings$/, (_, body) => {
      Object.assign(db.sync, body);
      return db.sync;
    }],
    ['POST', /^\/sync\/scan$/, () => {
      state.lastScan = new Date().toISOString();
      const job = {
        id: `job_${Date.now()}`, type: 'اسکن دستی همگام‌سازی', store: 'فروشگاه اصلی', status: 'running',
        progress: 4, total: db.products.length, success: 0, failed: 0,
        createdAt: state.lastScan, startedAt: state.lastScan, durationSec: null, error: null,
        cancelable: true, retryable: false,
      };
      db.jobs.unshift(job);
      return { job };
    }],

    ['GET', /^\/automation$/, () => ({ items: db.rules })],
    ['POST', /^\/automation$/, (_, body) => {
      const rule = {
        id: `rule_${Date.now()}`, name: body.name || 'قانون بدون نام', enabled: body.enabled ?? true,
        lastRun: null, trigger: body.trigger || { type: 'schedule', value: 'هر روز' },
        conditions: body.conditions || [], conditionLogic: body.conditionLogic || 'AND',
        actions: body.actions || [], runs: 0,
      };
      db.rules.unshift(rule);
      return rule;
    }],
    ['PATCH', /^\/automation\/([\w-]+)$/, (id, body) => {
      const rule = db.rules.find((r) => r.id === id);
      if (!rule) throw { status: 404, message: 'قانون پیدا نشد' };
      Object.assign(rule, body);
      return rule;
    }],
    ['DELETE', /^\/automation\/([\w-]+)$/, (id) => {
      db.rules = db.rules.filter((r) => r.id !== id);
      return { ok: true };
    }],
    ['POST', /^\/automation\/([\w-]+)\/run$/, (id) => {
      const rule = db.rules.find((r) => r.id === id);
      if (!rule) throw { status: 404, message: 'قانون پیدا نشد' };
      rule.lastRun = new Date().toISOString();
      rule.runs += 1;
      return { ok: true, rule };
    }],

    ['GET', /^\/jobs$/, (_, __, params) => {
      let items = db.jobs;
      if (params.status && params.status !== 'all') items = items.filter((j) => j.status === params.status);
      if (params.search) {
        const q = String(params.search).toLowerCase();
        items = items.filter((j) => `${j.id} ${j.type}`.toLowerCase().includes(q));
      }
      return paginate(items, { ...params, per_page: params.per_page || 15 });
    }],
    ['POST', /^\/jobs\/([\w-]+)\/cancel$/, (id) => {
      const job = db.jobs.find((j) => j.id === id);
      if (!job) throw { status: 404, message: 'عملیات پیدا نشد' };
      if (!job.cancelable) throw { status: 422, message: 'این عملیات قابل لغو نیست' };
      job.status = 'canceled';
      job.cancelable = false;
      job.retryable = true;
      return job;
    }],
    ['POST', /^\/jobs\/([\w-]+)\/retry$/, (id) => {
      const job = db.jobs.find((j) => j.id === id);
      if (!job) throw { status: 404, message: 'عملیات پیدا نشد' };
      if (!job.retryable) throw { status: 422, message: 'تلاش مجدد برای این عملیات مجاز نیست' };
      job.status = 'pending';
      job.progress = 0;
      job.success = 0;
      job.failed = 0;
      job.error = null;
      job.retryable = false;
      job.cancelable = true;
      return job;
    }],

    ['GET', /^\/logs$/, (_, __, params) => {
      let items = db.logs;
      if (params.level && params.level !== 'all') items = items.filter((l) => l.level === params.level);
      if (params.method && params.method !== 'all') items = items.filter((l) => l.method === params.method);
      if (params.search) {
        const q = String(params.search).toLowerCase();
        items = items.filter((l) => `${l.path} ${l.message} ${l.status}`.toLowerCase().includes(q));
      }
      return paginate(items, { ...params, per_page: params.per_page || 20 });
    }],
    ['GET', /^\/logs\/([\w-]+)$/, (id) => {
      const log = db.logs.find((l) => l.id === id);
      if (!log) throw { status: 404, message: 'لاگ پیدا نشد' };
      return log;
    }],

    ['GET', /^\/reports$/, () => {
      const byStatus = ['new', 'processing', 'shipped', 'delivered', 'canceled', 'returned'].map((s) => ({
        key: s, count: db.orders.filter((o) => o.status === s).length,
      }));
      const syncBuckets = ['synced', 'pending', 'stale', 'failed'].map((s) => ({
        key: s, count: db.products.filter((p) => p.sync === s).length,
      }));
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        const dayOrders = db.orders.filter((o) => new Date(o.createdAt).toDateString() === d.toDateString());
        return { label: new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(d), count: dayOrders.length };
      });
      return {
        byStatus,
        syncBuckets,
        days,
        totals: {
          orders: db.orders.length,
          imported: db.orders.filter((o) => o.imported === 'imported').length,
          knownAmounts: db.orders.filter((o) => o.amount).length,
          unknownAmounts: db.orders.filter((o) => !o.amount).length,
          products: db.products.length,
          mapped: db.products.filter((p) => p.mapping === 'mapped').length,
          jobs: db.jobs.length,
          successRate: Math.round((db.jobs.filter((j) => j.status === 'completed').length / db.jobs.length) * 100),
        },
      };
    }],

    ['GET', /^\/connections$/, () => ({ items: db.connections })],
    ['POST', /^\/connections$/, (_, body) => {
      if (!body.token) throw { status: 422, message: 'توکن API الزامی است' };
      const conn = {
        id: `conn_${Date.now()}`, name: body.name || 'اتصال جدید', status: 'connected',
        tokenMasked: `••••••••••••${String(body.token).slice(-4)}`,
        userAgent: body.userAgent || 'SnappShop-Automation/2.4.1',
        createdAt: new Date().toISOString(), lastCheck: new Date().toISOString(), stores: [],
      };
      db.connections.push(conn);
      return conn;
    }],
    ['POST', /^\/connections\/([\w-]+)\/discover$/, (id) => {
      const conn = db.connections.find((c) => c.id === id);
      if (!conn) throw { status: 404, message: 'اتصال پیدا نشد' };
      conn.stores = [
        { id: 'store_1', name: 'فروشگاه اصلی', code: 'SNAP-8841', role: 'owner', access: true },
        { id: 'store_2', name: 'شعبه دیجیتال', code: 'SNAP-9127', role: 'manager', access: true },
        { id: 'store_3', name: 'انبار شمال', code: 'SNAP-7742', role: 'viewer', access: false },
      ];
      conn.status = 'connected';
      conn.lastCheck = new Date().toISOString();
      return conn;
    }],
    ['PATCH', /^\/connections\/([\w-]+)\/stores\/([\w-]+)$/, (id, body, params, storeId) => {
      const conn = db.connections.find((c) => c.id === id);
      const store = conn?.stores.find((s) => s.id === storeId);
      if (!store) throw { status: 404, message: 'فروشگاه پیدا نشد' };
      store.access = Boolean(body.access);
      return store;
    }],

    ['GET', /^\/files$/, () => ({ items: db.files })],
    ['POST', /^\/files\/export$/, (_, body) => {
      const file = {
        id: `file_${Date.now()}`,
        name: `products-export-${new Date().toISOString().slice(0, 10)}.${body.format || 'csv'}`,
        kind: body.format || 'csv',
        size: Math.round(db.products.length * 3200 + Math.random() * 40000),
        rows: db.products.length,
        createdAt: new Date().toISOString(),
        status: 'ready',
      };
      db.files.unshift(file);
      return file;
    }],
    ['POST', /^\/files\/import$/, (_, body) => {
      const rows = Number(body.rows || 0);
      const skipped = rows > 4 ? 1 : 0;
      return {
        imported: Math.max(0, rows - skipped),
        skipped,
        errors: skipped ? [{ row: 3, message: 'SKU تکراری — ردیف نادیده گرفته شد' }] : [],
      };
    }],
    ['DELETE', /^\/files\/([\w-]+)$/, (id) => {
      db.files = db.files.filter((f) => f.id !== id);
      return { ok: true };
    }],

    ['GET', /^\/backups$/, () => ({ items: db.backups, recovery: state.recovery })],
    ['POST', /^\/backups$/, (_, body) => {
      if (!body.password || String(body.password).length < 8) throw { status: 422, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' };
      const backup = {
        id: `bk_${Date.now()}`, name: `backup-encrypted-${new Date().toISOString().slice(0, 10)}.snap`,
        size: 4404019, createdAt: new Date().toISOString(), status: 'verified', encrypted: true,
        includes: ['محصولات', 'نگاشت‌ها', 'قوانین قیمت', 'تنظیمات'],
      };
      db.backups.unshift(backup);
      return backup;
    }],
    ['POST', /^\/backups\/([\w-]+)\/restore$/, (id) => {
      const backup = db.backups.find((b) => b.id === id);
      if (!backup) throw { status: 404, message: 'پشتیبان پیدا نشد' };
      state.recovery = { backupId: id, startedAt: new Date().toISOString(), status: 'running', progress: 32, step: 'بازیابی نگاشت محصولات' };
      setTimeout(() => {
        if (state.recovery) {
          state.recovery = { ...state.recovery, status: 'completed', progress: 100, step: 'بازیابی کامل شد', finishedAt: new Date().toISOString() };
        }
      }, 2600);
      return state.recovery;
    }],
    ['GET', /^\/backups\/recovery$/, () => state.recovery],

    ['GET', /^\/settings$/, () => db.settings],
    ['PUT', /^\/settings$/, (_, body) => {
      Object.keys(body).forEach((group) => {
        db.settings[group] = { ...(db.settings[group] || {}), ...body[group] };
      });
      return db.settings;
    }],
  ];

  return async function handleMock(method, path, params = {}, body = null) {
    const clean = `/${String(path).replace(/^\/+|\/+$/g, '')}`;
    for (const [routeMethod, pattern, handler] of routes) {
      if (routeMethod !== method) continue;
      const m = clean.match(pattern);
      if (!m) continue;
      const result = await handler(m[1], body, params, m[2]);
      return result;
    }
    throw { status: 404, message: `مسیر یافت نشد: ${method} /${clean}` };
  };
}
