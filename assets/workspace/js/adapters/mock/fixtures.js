import { uid } from '../../lib/utils.js';
import { PROVIDERS } from '../../lib/providers.js';

/**
 * Seed data for the standalone demo (mock adapter).
 *
 * Nothing here talks to WordPress or a model provider: it exists so the whole
 * interface — history, work plan, result cards, approvals, preview and the
 * settings/model manager — can be reviewed with realistic content. A reload
 * rebuilds this world from scratch.
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const LANDING_HTML = `
<section data-yagent-id="hero" style="padding:56px 28px;text-align:center">
  <h1 data-yagent-id="hero-title" style="margin:0 0 12px;font-size:30px">طراحی و پشتیبانی سایت شما</h1>
  <p data-yagent-id="hero-text" style="margin:0 0 22px;color:#4b4553">از طراحی صفحهٔ فرود تا نگهداری روزانه؛ همه‌چیز با یک تیم.</p>
  <a data-yagent-id="hero-cta" href="#contact" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#5c4d9e;color:#fff;text-decoration:none">درخواست مشاوره</a>
</section>
<section data-yagent-id="features" style="display:grid;gap:16px;padding:0 28px 40px;grid-template-columns:repeat(3,1fr)">
  <div data-yagent-id="feature-1" style="padding:18px;border:1px solid #e7e3ef;border-radius:14px"><h3 style="margin:0 0 8px">سرعت</h3><p style="margin:0;color:#4b4553">بارگذاری زیر دو ثانیه</p></div>
  <div data-yagent-id="feature-2" style="padding:18px;border:1px solid #e7e3ef;border-radius:14px"><h3 style="margin:0 0 8px">پشتیبانی</h3><p style="margin:0;color:#4b4553">پاسخ‌گویی در همان روز</p></div>
  <div data-yagent-id="feature-3" style="padding:18px;border:1px solid #e7e3ef;border-radius:14px"><h3 style="margin:0 0 8px">امنیت</h3><p style="margin:0;color:#4b4553">به‌روزرسانی دوره‌ای</p></div>
</section>
<section data-yagent-id="contact" style="padding:0 28px 48px">
  <h2 data-yagent-id="contact-title" style="margin:0 0 10px">شروع همکاری</h2>
  <p data-yagent-id="contact-text" style="margin:0;color:#4b4553">فرم تماس و شمارهٔ پشتیبانی در همین بخش قرار می‌گیرد.</p>
</section>`;

function conversation({ id, title, updatedAt, createdAt, previewPageId, pinned = false }) {
  return { id, title, pinned, createdAt: createdAt ?? updatedAt, updatedAt, previewPageId, serverVersion: 1 };
}

function step(id, title, status, summary) {
  return { id, title, status, summary };
}

export function createMockWorld(now = Date.now()) {
  const conversations = [
    conversation({ id: 'c-landing', title: 'بازطراحی صفحهٔ فرود', updatedAt: now - 12 * MINUTE, previewPageId: 'page-42' }),
    conversation({ id: 'c-plugin', title: 'افزونه و مدیریت آن', updatedAt: now - 3 * HOUR }),
    conversation({ id: 'c-backup', title: 'پشتیبان‌گیری محتوا', updatedAt: now - 26 * HOUR, pinned: true }),
    conversation({ id: 'c-error', title: 'فرم تماس با ما', updatedAt: now - 5 * HOUR }),
    // Untitled on purpose: the local titler has not named it yet.
    conversation({ id: 'c-untitled', title: '', updatedAt: now - 40 * MINUTE }),
    conversation({ id: 'c-speed', title: 'بهینه‌سازی سرعت سایت', updatedAt: now - 3 * DAY }),
  ];

  const tasks = {
    't-landing': {
      id: 't-landing',
      conversationId: 'c-landing',
      title: 'بازطراحی صفحهٔ فرود و اتصال فرم تماس',
      status: 'done',
      startedAt: now - 16 * MINUTE,
      endedAt: now - 12 * MINUTE,
      summary: 'کار تمام شد.',
      steps: [
        step('t-landing-s1', 'تحلیل درخواست', 'done', 'درخواست روشن است؛ صفحهٔ فرود با سه بخش ساخته می‌شود.'),
        step('t-landing-s2', 'آماده‌سازی زمینهٔ سایت', 'done', 'برگه‌ها و افزونه‌های فعال خوانده شد.'),
        step('t-landing-s3', 'فهرست محتوا', 'done', 'یازده برگه و چهار نوشته فهرست شد.'),
        step('t-landing-s4', 'ساخت پیشنهاد محتوا', 'done', 'پیشنهاد HTML با سه بخش آماده شد.'),
        step('t-landing-s5', 'مدیریت افزونه', 'done', 'وضعیت افزونه‌های فعال بررسی شد.'),
        step('t-landing-s6', 'تأیید انتشار برگه', 'done', 'انتشار با تأیید شما انجام شد.'),
        step('t-landing-s7', 'ثبت نتیجهٔ نهایی', 'done', 'رسید عملیات در سرور ثبت شد.'),
      ],
    },
    't-plugin': {
      id: 't-plugin',
      conversationId: 'c-plugin',
      title: 'نصب افزونهٔ گالری تصاویر از بستهٔ تولیدشده',
      status: 'waiting_approval',
      startedAt: now - 3 * HOUR - 4 * MINUTE,
      summary: 'ادامهٔ این عملیات به تصمیم شما نیاز دارد.',
      steps: [
        step('t-plugin-s1', 'تحلیل درخواست', 'done', 'افزونهٔ گالری سبک با شورت‌کد ساخته می‌شود.'),
        step('t-plugin-s2', 'ساخت افزونه', 'done', 'بستهٔ افزونه آماده و برای دانلود ثبت شد.'),
        step('t-plugin-s3', 'نصب افزونه', 'waiting_approval', 'نصب روی سایت نیازمند تأیید صریح است.'),
      ],
    },
    't-backup': {
      id: 't-backup',
      conversationId: 'c-backup',
      title: 'پشتیبان‌گیری از محتوا',
      status: 'done',
      startedAt: now - 27 * HOUR,
      endedAt: now - 26 * HOUR,
      summary: 'کار تمام شد.',
      steps: [
        step('t-backup-s1', 'تحلیل درخواست', 'done', 'فهرست محتوا برای پشتیبان آماده شد.'),
        step('t-backup-s2', 'فهرست محتوا', 'done', 'برگه‌ها و نوشته‌ها جمع‌آوری شد.'),
        step('t-backup-s3', 'ساخت بستهٔ افزونه', 'done', 'بستهٔ پشتیبان آمادهٔ دانلود است.'),
      ],
    },
    't-error': {
      id: 't-error',
      conversationId: 'c-error',
      title: 'افزودن فرم تماس به برگهٔ تماس',
      status: 'error',
      startedAt: now - 5 * HOUR - 2 * MINUTE,
      endedAt: now - 5 * HOUR,
      summary: 'کار نیاز به بررسی دارد.',
      error: 'برگهٔ «تماس با ما» پیدا نشد؛ نامک برگه را بررسی کنید.',
      steps: [
        step('t-error-s1', 'تحلیل درخواست', 'done', 'برگهٔ تماس با ما هدف این درخواست است.'),
        step('t-error-s2', 'خواندن برگه', 'error', 'برگه‌ای با این نامک در دسترس نیست.'),
        step('t-error-s3', 'ثبت نتیجه', 'skipped'),
      ],
    },
    't-speed': {
      id: 't-speed',
      conversationId: 'c-speed',
      title: 'بررسی سرعت و پیشنهاد بهینه‌سازی',
      status: 'done',
      startedAt: now - 3 * DAY - MINUTE,
      endedAt: now - 3 * DAY,
      summary: 'کار تمام شد.',
      steps: [
        step('t-speed-s1', 'تحلیل درخواست', 'done'),
        step('t-speed-s2', 'اطلاعات سایت', 'done', 'نسخهٔ وردپرس و قالب خوانده شد.'),
        step('t-speed-s3', 'فهرست افزونه‌ها', 'done', '۹ افزونهٔ فعال بررسی شد.'),
        step('t-speed-s4', 'جمع‌بندی', 'done'),
      ],
    },
  };

  const revisions = {
    'rev-landing-1': {
      id: 'rev-landing-1',
      pageId: 'page-42',
      pageTitle: 'صفحهٔ فرود — طرح پیشنهادی',
      revision: 1,
      status: 'draft',
      createdAt: now - 15 * MINUTE,
      html: LANDING_HTML,
      summary: 'نسخهٔ اول پیشنهاد محتوا.',
      elementIds: ['hero', 'hero-title', 'hero-text', 'hero-cta', 'features', 'feature-1', 'feature-2', 'feature-3', 'contact', 'contact-title', 'contact-text'],
      approvalId: 'a-publish',
    },
    'rev-landing-2': {
      id: 'rev-landing-2',
      pageId: 'page-42',
      pageTitle: 'صفحهٔ فرود — طرح پیشنهادی',
      revision: 2,
      status: 'draft',
      createdAt: now - 12 * MINUTE,
      html: LANDING_HTML.replace('56px 28px', '44px 28px'),
      summary: 'نسخهٔ دوم با فاصلهٔ کمتر بخش نخست.',
      elementIds: ['hero', 'hero-title', 'hero-text', 'hero-cta', 'features', 'feature-1', 'feature-2', 'feature-3', 'contact', 'contact-title', 'contact-text'],
      approvalId: 'a-publish',
    },
  };

  const approvals = {
    'a-publish': {
      id: 'a-publish',
      conversationId: 'c-landing',
      taskId: 't-landing',
      kind: 'publish_page',
      title: 'مدیریت برگه',
      target: 'صفحهٔ فرود',
      summary: 'عملیات: publish؛ تأیید، همین تغییر ثبت‌شده در سرور را اجرا می‌کند.',
      changes: ['status: publish', 'post_id: 42'],
      status: 'succeeded',
      createdAt: now - 13 * MINUTE,
      planHash: 'plan-landing',
      result: {
        message: 'عملیات تأییدشده در سرور ثبت شد.',
        technical: [{ label: 'شناسهٔ عملیات', value: 'a-publish' }],
      },
    },
    'a-install': {
      id: 'a-install',
      conversationId: 'c-plugin',
      taskId: 't-plugin',
      kind: 'install_plugin',
      title: 'مدیریت افزونه',
      target: 'yagent-gallery',
      summary: 'عملیات: install؛ تأیید، همین تغییر ثبت‌شده در سرور را اجرا می‌کند.',
      changes: ['plugin: yagent-gallery', 'action: install'],
      status: 'pending',
      createdAt: now - 3 * HOUR,
      planHash: 'plan-plugin',
    },
  };

  const results = {
    't-landing-result-0': {
      id: 't-landing-result-0',
      conversationId: 'c-landing',
      title: 'فهرست محتوا',
      status: 'success',
      message: 'یازده برگه و چهار نوشته در سرور ثبت شد.',
      createdAt: now - 14 * MINUTE,
      technical: [
        { label: 'رسید', value: 'rcpt_listing_42' },
        { label: 'خروجی سرور', value: '{\n  "pages": 11,\n  "posts": 4\n}' },
      ],
    },
    't-landing-result-1': {
      id: 't-landing-result-1',
      conversationId: 'c-landing',
      title: 'مدیریت افزونه',
      status: 'success',
      message: 'نتیجهٔ این ابزار در سرور ثبت شد.',
      createdAt: now - 13 * MINUTE,
      technical: [{ label: 'رسید', value: 'rcpt_plugin_43' }],
    },
    't-landing-result-2': {
      id: 't-landing-result-2',
      conversationId: 'c-landing',
      title: 'مدیریت برگه',
      status: 'success',
      message: 'پیشنهاد محتوا آماده است و می‌توانید پیش‌نمایش آن را ببینید.',
      link: '#',
      linkLabel: 'ویرایش در وردپرس',
      previewRevisionId: 'rev-landing-2',
      createdAt: now - 12 * MINUTE,
      technical: [
        { label: 'رسید', value: 'rcpt_page_44' },
        { label: 'شناسهٔ برگه', value: '42' },
      ],
    },
    't-backup-result-0': {
      id: 't-backup-result-0',
      conversationId: 'c-backup',
      title: 'بستهٔ پشتیبان',
      status: 'success',
      message: 'بستهٔ افزونه برای دانلود آماده است.',
      artifactId: 'art-backup',
      createdAt: now - 26 * HOUR,
      technical: [{ label: 'رسید', value: 'rcpt_backup_51' }],
    },
    't-backup-result-1': {
      id: 't-backup-result-1',
      conversationId: 'c-backup',
      title: 'فهرست محتوا',
      status: 'success',
      message: 'دوازده برگه برای پشتیبان فهرست شد.',
      createdAt: now - 26 * HOUR,
      technical: [{ label: 'رسید', value: 'rcpt_backup_52' }],
    },
    't-error-result-0': {
      id: 't-error-result-0',
      conversationId: 'c-error',
      title: 'خواندن برگه',
      status: 'error',
      message: 'برگه‌ای با نامک «contact» پیدا نشد.',
      createdAt: now - 5 * HOUR,
      technical: [{ label: 'خطا', value: 'rest_page_not_found' }],
    },
    't-speed-result-0': {
      id: 't-speed-result-0',
      conversationId: 'c-speed',
      title: 'اطلاعات سایت',
      status: 'success',
      message: 'نسخهٔ وردپرس ۶٫۸ و قالب «آسترا» گزارش شد.',
      createdAt: now - 3 * DAY,
      technical: [{ label: 'رسید', value: 'rcpt_site_61' }],
    },
  };

  const messagesByConversation = {
    'c-landing': [
      { id: 'm-landing-user', conversationId: 'c-landing', role: 'user', kind: 'text', text: 'یک صفحهٔ فرود برای معرفی خدمات بساز و فرم تماس را هم وصل کن.', createdAt: now - 17 * MINUTE, status: 'complete' },
      { id: 'm-landing-activity', conversationId: 'c-landing', role: 'assistant', kind: 'activity', taskId: 't-landing', createdAt: now - 16 * MINUTE, status: 'complete' },
      { id: 'm-landing-text', conversationId: 'c-landing', role: 'assistant', kind: 'text', text: 'صفحهٔ فرود در سه بخش آماده شد: معرفی، مزیت‌ها و تماس. پیشنهاد محتوا را در پیش‌نمایش ببینید و اگر باز است، آن را منتشر کنید.\n\n| بخش | وضعیت |\n| --- | --- |\n| معرفی | آماده |\n| مزیت‌ها | آماده |\n| تماس | نیازمند فرم |', createdAt: now - 15 * MINUTE, status: 'complete' },
      { id: 'm-landing-r0', conversationId: 'c-landing', role: 'assistant', kind: 'result', resultId: 't-landing-result-0', createdAt: now - 14 * MINUTE, status: 'complete' },
      { id: 'm-landing-r1', conversationId: 'c-landing', role: 'assistant', kind: 'result', resultId: 't-landing-result-1', createdAt: now - 13 * MINUTE, status: 'complete' },
      { id: 'm-landing-approval', conversationId: 'c-landing', role: 'assistant', kind: 'approval', approvalId: 'a-publish', createdAt: now - 13 * MINUTE, status: 'complete' },
      { id: 'm-landing-r2', conversationId: 'c-landing', role: 'assistant', kind: 'result', resultId: 't-landing-result-2', createdAt: now - 12 * MINUTE, status: 'complete' },
    ],
    'c-plugin': [
      { id: 'm-plugin-user', conversationId: 'c-plugin', role: 'user', kind: 'text', text: 'یک افزونهٔ سادهٔ گالری تصاویر بساز و نصبش کن.', createdAt: now - 3 * HOUR - 5 * MINUTE, status: 'complete' },
      { id: 'm-plugin-activity', conversationId: 'c-plugin', role: 'assistant', kind: 'activity', taskId: 't-plugin', createdAt: now - 3 * HOUR - 4 * MINUTE, status: 'streaming' },
      { id: 'm-plugin-approval', conversationId: 'c-plugin', role: 'assistant', kind: 'approval', approvalId: 'a-install', createdAt: now - 3 * HOUR, status: 'complete' },
    ],
    'c-backup': [
      { id: 'm-backup-user', conversationId: 'c-backup', role: 'user', kind: 'text', text: 'از محتوای سایت یک بستهٔ پشتیبان بساز.', createdAt: now - 27 * HOUR, status: 'complete' },
      { id: 'm-backup-activity', conversationId: 'c-backup', role: 'assistant', kind: 'activity', taskId: 't-backup', createdAt: now - 27 * HOUR, status: 'complete' },
      { id: 'm-backup-r0', conversationId: 'c-backup', role: 'assistant', kind: 'result', resultId: 't-backup-result-0', createdAt: now - 26 * HOUR, status: 'complete' },
      { id: 'm-backup-r1', conversationId: 'c-backup', role: 'assistant', kind: 'result', resultId: 't-backup-result-1', createdAt: now - 26 * HOUR, status: 'complete' },
    ],
    'c-error': [
      { id: 'm-error-user', conversationId: 'c-error', role: 'user', kind: 'text', text: 'به برگهٔ تماس با ما یک فرم اضافه کن.', createdAt: now - 5 * HOUR - 3 * MINUTE, status: 'complete' },
      { id: 'm-error-activity', conversationId: 'c-error', role: 'assistant', kind: 'activity', taskId: 't-error', createdAt: now - 5 * HOUR - 2 * MINUTE, status: 'complete' },
      { id: 'm-error-r0', conversationId: 'c-error', role: 'assistant', kind: 'result', resultId: 't-error-result-0', createdAt: now - 5 * HOUR, status: 'complete' },
    ],
    'c-untitled': [
      { id: 'm-untitled-user', conversationId: 'c-untitled', role: 'user', kind: 'text', text: 'سلام، سایت من کند شده؛ از کجا شروع کنم؟', createdAt: now - 41 * MINUTE, status: 'complete' },
      { id: 'm-untitled-text', conversationId: 'c-untitled', role: 'assistant', kind: 'text', text: 'برای شروع، فهرست افزونه‌های فعال و اندازهٔ تصاویر را بررسی می‌کنیم. بگو کدام بخش سایت کند است تا همان را اندازه بگیریم.', createdAt: now - 40 * MINUTE, status: 'complete' },
    ],
    'c-speed': [
      { id: 'm-speed-user', conversationId: 'c-speed', role: 'user', kind: 'text', text: 'سرعت سایت را بررسی کن و پیشنهاد بده.', createdAt: now - 3 * DAY - 2 * MINUTE, status: 'complete' },
      { id: 'm-speed-activity', conversationId: 'c-speed', role: 'assistant', kind: 'activity', taskId: 't-speed', createdAt: now - 3 * DAY - MINUTE, status: 'complete' },
      { id: 'm-speed-text', conversationId: 'c-speed', role: 'assistant', kind: 'text', text: 'سه افزونه زمان بارگذاری را بالا می‌برند:\n\n- کش تصاویر\n- اسلایدر سنگین\n- افزونهٔ آماری\n\nحذف یا جای‌گزینی دو مورد نخست بیشترین اثر را دارد.', createdAt: now - 3 * DAY, status: 'complete' },
      { id: 'm-speed-r0', conversationId: 'c-speed', role: 'assistant', kind: 'result', resultId: 't-speed-result-0', createdAt: now - 3 * DAY, status: 'complete' },
    ],
  };

  const annotations = {
    'an-1': {
      id: 'an-1',
      conversationId: 'c-landing',
      pageId: 'page-42',
      revisionId: 'rev-landing-1',
      kind: 'element',
      index: 1,
      comment: 'فاصلهٔ این بخش کمتر شود.',
      rect: { x: 28, y: 44, width: 320, height: 96 },
      viewport: { width: 1280, device: 'desktop' },
      elementId: 'hero',
      elementLabel: 'بخش معرفی',
      createdAt: now - 20 * MINUTE,
      status: 'sent',
    },
    'an-2': {
      id: 'an-2',
      conversationId: 'c-landing',
      pageId: 'page-42',
      revisionId: 'rev-landing-1',
      kind: 'element',
      index: 2,
      comment: 'متن دکمه واضح‌تر باشد.',
      rect: { x: 28, y: 180, width: 220, height: 48 },
      viewport: { width: 1280, device: 'desktop' },
      elementId: 'hero-cta',
      elementLabel: 'دکمهٔ درخواست مشاوره',
      createdAt: now - 19 * MINUTE,
      status: 'stale',
    },
  };

  const models = [
    { id: 'm-avalai-gemini', name: 'gemini-3.5-flash', hint: 'AvalAI – اول ای‌آی', supportsTools: true, provider: 'avalai' },
    { id: 'm-gapgpt-gpt4o', name: 'gpt-4o-mini', hint: 'GapGPT – گپ جی‌پی‌تی', supportsTools: true, provider: 'gapgpt' },
    { id: 'm-arvan-gemini', name: 'gemini-2.0-flash', hint: 'ArvanCloud – ابر آروان', supportsTools: false, provider: 'arvan' },
  ];

  const settings = {
    readOnly: false,
    autoInstall: false,
    activeProvider: 'avalai',
    activeModelId: 'm-avalai-gemini',
    consumption: {
      mode: 'capped',
      monthlyTokens: 2000000,
      requestTokens: 32000,
      stopOnLimit: true,
      notifyAtPercent: 80,
    },
    draft: {
      keepDrafts: true,
      keepAttachments: true,
      confirmDelete: true,
      titleGeneration: 'auto',
    },
    appearance: {
      density: 'comfortable',
      fontScale: 'md',
      showTimestamps: true,
      reduceMotion: false,
      accent: 'violet',
    },
  };

  return {
    providers: PROVIDERS,
    conversations,
    tasks,
    approvals,
    results,
    revisions,
    revisionIdsByPage: { 'page-42': ['rev-landing-1', 'rev-landing-2'] },
    annotations,
    messagesByConversation,
    models,
    settings,
    artifacts: {
      'art-backup': { id: 'art-backup', filename: 'yagent-backup-1402.zip', bytes: 2048 },
    },
    nextUid: () => uid('mock'),
  };
}
