import type {
  Annotation,
  Approval,
  ActionResult,
  Conversation,
  Message,
  PreviewRevision,
  Task,
  TaskStep,
  TaskStepStatus,
} from '@/types/model'
import { extractElementIds, landingPageV1, landingPageV2 } from './pages'
import { AUDIT_STEPS, BUILD_PAGE_STEPS, FAILURE_STEPS, FEEDBACK_STEPS, PLUGIN_STEPS, type StepPlan } from './scenarios'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export interface MockSeed {
  conversations: Conversation[]
  messages: Message[]
  tasks: Task[]
  approvals: Approval[]
  results: ActionResult[]
  revisions: PreviewRevision[]
  annotations: Annotation[]
}

function stepsFromPlan(steps: StepPlan[], states: TaskStepStatus[], startedAt: number, idPrefix: string): TaskStep[] {
  let cursor = startedAt
  return steps.map((plan, index) => {
    const status = states[index] ?? 'pending'
    const started = cursor
    const finished = status === 'pending' ? undefined : started + plan.durationMs
    if (finished) cursor = finished + 250
    return {
      id: `${idPrefix}-s${index + 1}`,
      title: plan.title,
      description: plan.description,
      status,
      startedAt: status === 'pending' ? undefined : started,
      endedAt: finished,
      summary: status === 'pending' ? undefined : plan.summary,
      detail: status === 'pending' ? undefined : plan.detail,
    }
  })
}

function makeTask(args: {
  id: string
  conversationId: string
  title: string
  status: Task['status']
  startedAt: number
  endedAt?: number
  summary: string
  activeStepId?: string
  error?: string
  steps: TaskStep[]
}): Task {
  return { ...args }
}

const SPEED_REPLY = [
  '### نتیجهٔ بررسی',
  'سایت در مجموع سالم است، اما سه مورد اصلی سرعت را پایین می‌آورد:',
  '',
  '1. **تصاویر سنگین** — ۱۲ تصویر بالای ۵۰۰ کیلوبایت',
  '2. **افزونه‌های اضافه** — ۹ افزونهٔ فعال که ۳ موردشان روی سرعت اثر منفی دارند',
  '3. **کش مرورگر** — هدر `Cache-Control` برای فایل‌های استاتیک تنظیم نشده',
  '',
  '| مورد | وضعیت | اثر تقریبی |',
  '| --- | --- | --- |',
  '| تصاویر | نیازمند اصلاح | ۱.۸ ثانیه |',
  '| کش مرورگر | تنظیم نشده | ۰.۹ ثانیه |',
  '| اسکریپت‌های اضافه | نیازمند بررسی | ۰.۶ ثانیه |',
  '',
  'برای فعال‌کردن کش، این قطعه را به فایل `wp-config.php` اضافه کن:',
  '',
  '```php',
  "define('WP_CACHE', true);",
  '```',
  '',
  'گزارش کامل با ۷ پیشنهاد اولویت‌دار داخل کارت نتیجه است.',
].join('\n')

export function createSeed(): MockSeed {
  const now = Date.now()

  const conversations: Conversation[] = [
    {
      id: 'c-landing',
      title: 'صفحهٔ فرود استودیو آرا',
      pinned: true,
      createdAt: now - 3 * DAY,
      updatedAt: now - 48 * MINUTE,
      previewPageId: 'page-landing',
    },
    {
      id: 'c-plugin',
      title: 'افزونهٔ رزرو نوبت',
      pinned: true,
      createdAt: now - 5 * HOUR,
      updatedAt: now - 2 * HOUR,
    },
    {
      id: 'c-speed',
      title: 'بررسی سرعت سایت',
      pinned: false,
      createdAt: now - 7 * HOUR,
      updatedAt: now - 6 * HOUR,
    },
    {
      id: 'c-empty',
      title: 'صفحهٔ تماس با ما',
      pinned: false,
      createdAt: now - 9 * HOUR,
      updatedAt: now - 9 * HOUR,
    },
    {
      id: 'c-contact',
      title: 'حذف افزونهٔ فرم تماس قدیمی',
      pinned: false,
      createdAt: now - 28 * HOUR,
      updatedAt: now - 26 * HOUR,
    },
    {
      id: 'c-error',
      title: 'اصلاح هدر قالب',
      pinned: false,
      createdAt: now - 32 * HOUR,
      updatedAt: now - 31 * HOUR,
    },
    {
      id: 'c-gallery',
      title: 'گالری تصاویر محصولات',
      pinned: false,
      createdAt: now - 5 * DAY,
      updatedAt: now - 5 * DAY,
    },
    {
      id: 'c-legal',
      title: 'بازنویسی متن قوانین',
      pinned: false,
      createdAt: now - 9 * DAY,
      updatedAt: now - 9 * DAY,
    },
  ]

  const revisions: PreviewRevision[] = [
    {
      id: 'rev-landing-1',
      pageId: 'page-landing',
      pageTitle: 'صفحهٔ فرود استودیو آرا',
      revision: 1,
      status: 'published',
      createdAt: now - 3 * DAY,
      html: landingPageV1,
      summary: 'نسخهٔ اولیهٔ صفحهٔ فرود',
      elementIds: extractElementIds(landingPageV1),
    },
    {
      id: 'rev-landing-2',
      pageId: 'page-landing',
      pageTitle: 'صفحهٔ فرود استودیو آرا',
      revision: 2,
      status: 'draft',
      createdAt: now - 48 * MINUTE,
      html: landingPageV2,
      summary: 'ارتفاع بخش معرفی کم شد و دکمهٔ اصلی در موبایل وسط‌چین شد',
      basedOnRevisionId: 'rev-landing-1',
      elementIds: extractElementIds(landingPageV2),
    },
  ]

  const annotations: Annotation[] = [
    {
      id: 'a-landing-1',
      pageId: 'page-landing',
      revisionId: 'rev-landing-1',
      kind: 'region',
      index: 1,
      comment: 'فاصلهٔ بالای بخش معرفی زیاد است؛ کوتاه‌ترش کن.',
      rect: { x: 0.08, y: 0.09, width: 0.84, height: 0.16 },
      viewport: { width: 1440, device: 'desktop' },
      elementId: 'hero',
      elementLabel: 'سایت حرفه‌ای برای کسب‌وکار شما…',
      createdAt: now - 2 * DAY,
      status: 'stale',
      staleInfo: { newerRevisionId: 'rev-landing-2', elementExists: true },
    },
    {
      id: 'a-landing-2',
      pageId: 'page-landing',
      revisionId: 'rev-landing-1',
      kind: 'pin',
      index: 2,
      comment: 'این بخش جای خودش را به «تضمین بازگشت وجه» داده؛ متن جدید را تأیید کن.',
      rect: { x: 0.72, y: 0.47, width: 0, height: 0 },
      viewport: { width: 1440, device: 'desktop' },
      elementId: 'feature-support',
      elementLabel: 'پشتیبانی سالانه',
      createdAt: now - 2 * DAY,
      status: 'unmatched',
      staleInfo: { newerRevisionId: 'rev-landing-2', elementExists: false },
    },
  ]

  const landingReply =
    'صفحهٔ فرود ساخته شد: بخش معرفی، سه مزیت، تعرفه‌ها و فراخوان پایانی.\n\nپیش‌نمایش را باز کن و اگر نکته‌ای روی بخش‌ها داشتی، همان‌جا علامت بگذار و بنویس.'

  const landingTaskStart = now - 3 * DAY
  const tLanding = makeTask({
    id: 't-landing',
    conversationId: 'c-landing',
    title: 'ساخت صفحهٔ فرود',
    status: 'done',
    startedAt: landingTaskStart,
    endedAt: landingTaskStart + 12_000,
    summary: 'صفحهٔ فرود منتشر شد.',
    steps: stepsFromPlan(BUILD_PAGE_STEPS, BUILD_PAGE_STEPS.map(() => 'done'), landingTaskStart, 't-landing'),
  })

  const feedbackTaskStart = now - 49 * MINUTE
  const tFeedback = makeTask({
    id: 't-feedback-landing',
    conversationId: 'c-landing',
    title: 'اعمال اصلاحات صفحه',
    status: 'done',
    startedAt: feedbackTaskStart,
    endedAt: feedbackTaskStart + 5_600,
    summary: 'نسخهٔ تازه ساخته شد.',
    steps: stepsFromPlan(FEEDBACK_STEPS, FEEDBACK_STEPS.map(() => 'done'), feedbackTaskStart, 't-feedback-landing'),
  })

  const pluginTaskStart = now - 3 * HOUR
  const pluginSteps = stepsFromPlan(PLUGIN_STEPS, ['done', 'done', 'done', 'waiting_approval', 'pending'], pluginTaskStart, 't-plugin')
  const tPlugin = makeTask({
    id: 't-plugin',
    conversationId: 'c-plugin',
    title: 'ساخت افزونهٔ رزرو نوبت',
    status: 'waiting_approval',
    startedAt: pluginTaskStart,
    summary: 'برای نصب افزونه روی سایت منتظر تأیید تو هستم.',
    activeStepId: pluginSteps[3].id,
    steps: pluginSteps,
  })

  const auditTaskStart = now - 6 * HOUR - 6_000
  const tAudit = makeTask({
    id: 't-audit',
    conversationId: 'c-speed',
    title: 'بررسی سرعت سایت',
    status: 'done',
    startedAt: auditTaskStart,
    endedAt: auditTaskStart + 5_600,
    summary: 'گزارش بررسی سرعت آماده شد.',
    steps: stepsFromPlan(AUDIT_STEPS, AUDIT_STEPS.map(() => 'done'), auditTaskStart, 't-audit'),
  })

  const errorTaskStart = now - 31 * HOUR
  const tError = makeTask({
    id: 't-theme-fix',
    conversationId: 'c-error',
    title: 'اصلاح هدر قالب',
    status: 'error',
    startedAt: errorTaskStart,
    endedAt: errorTaskStart + 3_000,
    summary: 'سرور اجازهٔ نوشتن روی فایل قالب را نداد.',
    error: 'HTTP 403 هنگام نوشتن روی فایل header.php',
    steps: stepsFromPlan(FAILURE_STEPS, ['done', 'error', 'skipped'], errorTaskStart, 't-theme-fix'),
  })

  const approvals: Approval[] = [
    {
      id: 'apr-install-booking',
      conversationId: 'c-plugin',
      kind: 'install_plugin',
      title: 'نصب افزونهٔ رزرو نوبت',
      target: 'YAgent — رزرو نوبت',
      summary: 'افزونه روی سایت نصب و فعال می‌شود و یک جدول تازه در دیتابیس ساخته خواهد شد.',
      changes: [
        'افزونه از مخزن YAgent نصب می‌شود',
        'جدول نوبت‌ها در دیتابیس ساخته می‌شود',
        'برگهٔ «رزرو نوبت» به پیشخوان اضافه می‌شود',
      ],
      status: 'pending',
      createdAt: pluginTaskStart + 5_200,
      taskId: 't-plugin',
      stepId: pluginSteps[3].id,
    },
    {
      id: 'apr-delete-cf7',
      conversationId: 'c-contact',
      kind: 'delete_plugin',
      title: 'حذف افزونهٔ فرم تماس',
      target: 'Contact Form 7 نسخهٔ ۵.۸',
      summary: 'افزونه حذف می‌شود؛ جدول‌ها و تنظیمات مربوط به آن هم پاک خواهند شد.',
      changes: [
        'افزونه غیرفعال و حذف می‌شود',
        '۳ جدول دیتابیس مربوط به فرم‌ها پاک می‌شود',
        'یک نسخهٔ پشتیبان از تنظیمات پیش از حذف گرفته می‌شود',
      ],
      status: 'pending',
      createdAt: now - 26 * HOUR,
    },
  ]

  const results: ActionResult[] = [
    {
      id: 'res-landing-publish',
      conversationId: 'c-landing',
      title: 'صفحهٔ فرود منتشر شد',
      status: 'success',
      message: 'صفحهٔ فرود استودیو آرا روی سایت منتشر شد و نسخهٔ قبلی در تاریخچه ماند.',
      link: '#',
      technical: [
        { label: 'شناسهٔ انتشار', value: 'pub_8f31c2' },
        { label: 'زمان پاسخ سرور', value: '۰.۹ ثانیه' },
      ],
      createdAt: landingTaskStart + 12_000,
    },
    {
      id: 'res-landing-v2',
      conversationId: 'c-landing',
      title: 'نسخهٔ ۲ آمادهٔ بازبینی است',
      status: 'success',
      message: 'تغییرهای خواسته‌شده اعمال شد و نسخهٔ تازه به عنوان پیش‌نویس ثبت شد.',
      link: '#',
      technical: [
        { label: 'نسخهٔ مبنا', value: 'v1' },
        { label: 'نسخهٔ جدید', value: 'v2' },
      ],
      createdAt: feedbackTaskStart + 5_600,
    },
    {
      id: 'res-audit',
      conversationId: 'c-speed',
      title: 'گزارش بررسی سرعت آماده شد',
      status: 'success',
      message: '۷ پیشنهاد اولویت‌دار برای رساندن امتیاز از ۵۴ به ۸۸ آماده است.',
      link: '#',
      technical: [
        { label: 'ابزار', value: 'yagent-audit 0.9' },
        { label: 'زمان بررسی', value: '۵.۱ ثانیه' },
      ],
      createdAt: auditTaskStart + 5_600,
    },
    {
      id: 'res-theme-fix',
      conversationId: 'c-error',
      title: 'اصلاح هدر قالب انجام نشد',
      status: 'error',
      message: 'سرور اجازهٔ نوشتن روی فایل قالب را نداد؛ تا اصلاح مجوز فایل‌ها امکان تغییر نیست.',
      technical: [
        { label: 'فایل', value: 'wp-content/themes/ara-child/header.php' },
        { label: 'خطا', value: 'HTTP 403 (Forbidden)' },
        { label: 'کد پیگیری', value: 'yagent_err_4c19' },
      ],
      createdAt: errorTaskStart + 3_000,
    },
  ]

  const messages: Message[] = [
    // ---- c-landing: built, published, then revised after visual feedback ----
    {
      id: 'm-landing-1',
      conversationId: 'c-landing',
      role: 'user',
      kind: 'text',
      text: 'یک صفحهٔ فرود برای معرفی خدمات استودیو آرا بساز و بعد از تأیید من منتشر کن.',
      createdAt: now - 3 * DAY,
      status: 'complete',
    },
    {
      id: 'm-landing-2',
      conversationId: 'c-landing',
      role: 'assistant',
      kind: 'text',
      text: landingReply,
      createdAt: now - 3 * DAY + 40_000,
      status: 'complete',
    },
    {
      id: 'm-landing-3',
      conversationId: 'c-landing',
      role: 'assistant',
      kind: 'activity',
      taskId: tLanding.id,
      createdAt: now - 3 * DAY + 41_000,
      status: 'complete',
    },
    {
      id: 'm-landing-4',
      conversationId: 'c-landing',
      role: 'assistant',
      kind: 'result',
      resultId: 'res-landing-publish',
      createdAt: landingTaskStart + 12_000,
      status: 'complete',
    },
    {
      id: 'm-landing-5',
      conversationId: 'c-landing',
      role: 'user',
      kind: 'feedback',
      text: 'دو مورد را روی پیش‌نمایش علامت زدم؛ لطفاً اعمال کن.',
      annotationIds: ['a-landing-1', 'a-landing-2'],
      createdAt: now - 50 * MINUTE,
      status: 'complete',
    },
    {
      id: 'm-landing-6',
      conversationId: 'c-landing',
      role: 'assistant',
      kind: 'text',
      text: 'علامت‌ها را دیدم. ارتفاع بخش معرفی کم شد و دکمهٔ اصلی در موبایل وسط‌چین شد. نسخهٔ ۲ برای بازبینی آماده است.',
      createdAt: now - 49 * MINUTE,
      status: 'complete',
    },
    {
      id: 'm-landing-7',
      conversationId: 'c-landing',
      role: 'assistant',
      kind: 'activity',
      taskId: tFeedback.id,
      createdAt: now - 49 * MINUTE,
      status: 'complete',
    },
    {
      id: 'm-landing-8',
      conversationId: 'c-landing',
      role: 'assistant',
      kind: 'result',
      resultId: 'res-landing-v2',
      createdAt: now - 48 * MINUTE,
      status: 'complete',
    },

    // ---- c-plugin: waiting for the install approval ----
    {
      id: 'm-plugin-1',
      conversationId: 'c-plugin',
      role: 'user',
      kind: 'text',
      text: 'یک افزونهٔ رزرو نوبت برای سایت بساز و نصب کن.',
      createdAt: pluginTaskStart - 60_000,
      status: 'complete',
    },
    {
      id: 'm-plugin-2',
      conversationId: 'c-plugin',
      role: 'assistant',
      kind: 'text',
      text: 'افزونه را ساختم: فرم کوتاه‌کد، جدول نوبت‌ها و برگهٔ تنظیمات.\n\nبرای نصب روی سایت از تو تأیید می‌گیرم.',
      createdAt: pluginTaskStart - 30_000,
      status: 'complete',
    },
    {
      id: 'm-plugin-3',
      conversationId: 'c-plugin',
      role: 'assistant',
      kind: 'activity',
      taskId: tPlugin.id,
      createdAt: pluginTaskStart,
      status: 'streaming',
    },
    {
      id: 'm-plugin-4',
      conversationId: 'c-plugin',
      role: 'assistant',
      kind: 'approval',
      approvalId: 'apr-install-booking',
      createdAt: pluginTaskStart + 5_200,
      status: 'pending',
    },

    // ---- c-speed: a finished audit with rich markdown ----
    {
      id: 'm-speed-1',
      conversationId: 'c-speed',
      role: 'user',
      kind: 'text',
      text: 'سرعت سایت را بررسی کن و بگو چه چیزی را باید اصلاح کنم.',
      createdAt: auditTaskStart - 90_000,
      status: 'complete',
    },
    {
      id: 'm-speed-2',
      conversationId: 'c-speed',
      role: 'assistant',
      kind: 'text',
      text: SPEED_REPLY,
      createdAt: auditTaskStart - 60_000,
      status: 'complete',
    },
    {
      id: 'm-speed-3',
      conversationId: 'c-speed',
      role: 'assistant',
      kind: 'activity',
      taskId: tAudit.id,
      createdAt: auditTaskStart,
      status: 'complete',
    },
    {
      id: 'm-speed-4',
      conversationId: 'c-speed',
      role: 'assistant',
      kind: 'result',
      resultId: 'res-audit',
      createdAt: auditTaskStart + 5_600,
      status: 'complete',
    },

    // ---- c-contact: waiting for the delete approval ----
    {
      id: 'm-contact-1',
      conversationId: 'c-contact',
      role: 'user',
      kind: 'text',
      text: 'افزونهٔ فرم تماس قدیمی را حذف کن؛ دیگر استفاده نمی‌کنیم.',
      createdAt: now - 28 * HOUR,
      status: 'complete',
    },
    {
      id: 'm-contact-2',
      conversationId: 'c-contact',
      role: 'assistant',
      kind: 'text',
      text: 'قبل از حذف یک نسخهٔ پشتیبان از تنظیمات می‌گیرم. حذف کردن افزونه برگشت‌پذیر نیست، پس منتظر تأیید تو می‌مانم.',
      createdAt: now - 27 * HOUR,
      status: 'complete',
    },
    {
      id: 'm-contact-3',
      conversationId: 'c-contact',
      role: 'assistant',
      kind: 'approval',
      approvalId: 'apr-delete-cf7',
      createdAt: now - 26 * HOUR,
      status: 'pending',
    },

    // ---- c-error: a failed run ----
    {
      id: 'm-error-1',
      conversationId: 'c-error',
      role: 'user',
      kind: 'text',
      text: 'هدر قالب را اصلاح کن؛ در موبایل لوگو جابه‌جا می‌شود.',
      createdAt: now - 32 * HOUR,
      status: 'complete',
    },
    {
      id: 'm-error-2',
      conversationId: 'c-error',
      role: 'assistant',
      kind: 'text',
      text: 'برای اصلاح، فایل `header.php` قالب را تغییر می‌دهم. اول دسترسی نوشتن را بررسی می‌کنم.',
      createdAt: now - 31.5 * HOUR,
      status: 'complete',
    },
    {
      id: 'm-error-3',
      conversationId: 'c-error',
      role: 'assistant',
      kind: 'activity',
      taskId: tError.id,
      createdAt: errorTaskStart,
      status: 'error',
    },
    {
      id: 'm-error-4',
      conversationId: 'c-error',
      role: 'assistant',
      kind: 'result',
      resultId: 'res-theme-fix',
      createdAt: errorTaskStart + 3_000,
      status: 'error',
    },

    // ---- light history: plain exchanges ----
    {
      id: 'm-gallery-1',
      conversationId: 'c-gallery',
      role: 'user',
      kind: 'text',
      text: 'برای گالری تصاویر محصولات یک چیدمان سه‌ستونه پیشنهاد بده.',
      createdAt: now - 5 * DAY,
      status: 'complete',
    },
    {
      id: 'm-gallery-2',
      conversationId: 'c-gallery',
      role: 'assistant',
      kind: 'text',
      text: 'برای ۹ تصویر، چیدمان سه‌ستونه با نسبت ۴:۳ و فاصلهٔ ۱۸ پیکسل بهترین تعادل را می‌دهد؛ در موبایل دو ستون و در عرض زیر ۴۸۰ پیکسل یک ستون.',
      createdAt: now - 5 * DAY + 30_000,
      status: 'complete',
    },
    {
      id: 'm-legal-1',
      conversationId: 'c-legal',
      role: 'user',
      kind: 'text',
      text: 'متن صفحهٔ قوانین را ساده‌تر و کوتاه‌تر بازنویسی کن.',
      createdAt: now - 9 * DAY,
      status: 'complete',
    },
    {
      id: 'm-legal-2',
      conversationId: 'c-legal',
      role: 'assistant',
      kind: 'text',
      text: 'متن را به چهار بخش کوتاه تقسیم کردم: بازگشت کالا، حریم خصوصی، شرایط پرداخت و پشتیبانی. برای هر بخش هم یک عنوان کوتاه فارسی گذاشتم.',
      createdAt: now - 9 * DAY + 45_000,
      status: 'complete',
    },
  ]

  return {
    conversations,
    messages,
    tasks: [tLanding, tPlugin, tAudit, tError, tFeedback],
    approvals,
    results,
    revisions,
    annotations,
  }
}
