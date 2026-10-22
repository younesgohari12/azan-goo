import type { ApprovalKind, TaskStepDetail } from '@/types/model'

/**
 * Demo scenarios for the mock adapter.
 *
 * A scenario is a *plan*, not a script: the adapter walks the steps in order,
 * emits events for each state change and pauses where a decision is required.
 * Steps, their order and their count therefore come from data (they differ per
 * request), and the progress percentage shown in the UI is computed from the
 * real step states — never faked.
 */

export type ScenarioKind = 'build_page' | 'audit' | 'plugin' | 'quick' | 'page_feedback' | 'failure'

export interface StepApprovalPlan {
  kind: ApprovalKind
  title: string
  target: string
  summary: string
  changes: string[]
}

export interface StepPlan {
  title: string
  description?: string
  durationMs: number
  summary: string
  detail?: TaskStepDetail
  /** The task pauses here until the user approves or rejects the operation. */
  approval?: StepApprovalPlan
  /** The step fails with this message — demonstrates the error state. */
  fail?: string
  /** Completing this step produces a page revision and opens the preview card. */
  producesPreview?: boolean
}

export interface ScenarioPlan {
  kind: ScenarioKind
  taskTitle: string
  /** Assistant reply streamed before the steps start (markdown). */
  reply: string
  steps: StepPlan[]
  pageId?: string
  pageTitle?: string
  result?: { title: string; message: string; technical?: Array<{ label: string; value: string }> }
  failure?: { title: string; message: string; technical?: Array<{ label: string; value: string }> }
}

const PUBLISH_APPROVAL: StepApprovalPlan = {
  kind: 'publish_page',
  title: 'انتشار صفحه',
  target: 'صفحهٔ فرود — استودیو آرا',
  summary: 'نسخهٔ پیش‌نویس روی سایت منتشر می‌شود و برای بازدیدکنندگان قابل مشاهده است.',
  changes: [
    'محتوای صفحهٔ اصلی با نسخهٔ جدید جایگزین می‌شود',
    'تصویر شاخص و متادیتای سئو به‌روزرسانی می‌شود',
    'نسخهٔ قبلی در تاریخچه باقی می‌ماند و قابل بازگردانی است',
  ],
}

const INSTALL_APPROVAL: StepApprovalPlan = {
  kind: 'install_plugin',
  title: 'نصب افزونه',
  target: 'YAgent — رزرو نوبت',
  summary: 'افزونه روی سایت نصب و فعال می‌شود؛ یک جدول تازه در دیتابیس ساخته خواهد شد.',
  changes: [
    'افزونه از مخزن YAgent نصب می‌شود',
    'یک جدول دیتابیس برای نوبت‌ها ساخته می‌شود',
    'برگهٔ «رزرو نوبت» در پیشخوان وردپرس اضافه می‌شود',
  ],
}

export const BUILD_PAGE_STEPS: StepPlan[] = [
  {
    title: 'بررسی درخواست',
    description: 'تشخیص نوع صفحه، مخاطب و هدف تجاری',
    durationMs: 1100,
    summary: 'درخواست بررسی شد؛ ساخت صفحهٔ فرود با ساختار پیشنهادی.',
    detail: {
      output: 'هدف: معرفی خدمات، جذب سرنخ. مخاطب: کسب‌وکارهای کوچک.',
      logs: ['model: yagent-1', 'tone: حرفه‌ای و کوتاه', 'language: fa-IR'],
    },
  },
  {
    title: 'خواندن صفحهٔ فعلی',
    description: 'بررسی قالب، متغیرهای CSS و بخش‌های موجود',
    durationMs: 1300,
    summary: 'قالب و ۱۲ بخش صفحهٔ فعلی خوانده شد.',
    detail: {
      output: 'قالب فعال: Ara Child. بخش‌های قابل استفاده: هدر، فوتر، تعرفه‌ها.',
      logs: ['theme: ara-child', 'blocks: 12', 'menus: 2'],
    },
  },
  {
    title: 'طراحی ساختار جدید',
    description: 'چیدمان بخش‌ها و سلسله‌مراتب محتوا',
    durationMs: 1600,
    summary: 'ساختار صفحه آماده شد؛ در حال تنظیم نسخهٔ موبایل هستم.',
    detail: {
      output: 'ساختار: معرفی، سه مزیت، تعرفه‌ها، فراخوان پایانی.',
      logs: ['sections: 5', 'grid: 3 columns'],
    },
  },
  {
    title: 'تنظیم نمایش موبایل',
    description: 'نقاط شکست و اندازهٔ دکمه‌ها',
    durationMs: 1400,
    summary: 'نقاط شکست ۹۰۰ و ۵۶۰ پیکسل تنظیم شد؛ دکمهٔ اصلی در موبایل وسط‌چین شد.',
    detail: { output: 'بررسی روی عرض‌های ۱۴۴۰، ۱۰۲۴، ۷۶۸ و ۳۹۰ پیکسل انجام شد.' },
  },
  {
    title: 'آماده‌سازی پیش‌نمایش',
    description: 'ساخت نسخهٔ پیش‌نویس قابل بازبینی',
    producesPreview: true,
    durationMs: 1500,
    summary: 'پیش‌نمایش آماده است؛ می‌توانی روی بخش‌ها علامت بگذاری.',
    detail: {
      output: 'نسخهٔ پیش‌نویس ساخته شد و در کارگاه پیش‌نمایش باز می‌شود.',
      warning: 'عنوان اصلی صفحه هنوز متن جایگزین دارد.',
    },
  },
  {
    title: 'دریافت تأیید انتشار',
    description: 'منتظر تصمیم کاربر',
    durationMs: 600,
    summary: 'برای انتشار روی سایت به تأیید تو نیاز دارم.',
    approval: PUBLISH_APPROVAL,
  },
  {
    title: 'انتشار و بررسی نتیجه',
    description: 'انتشار نسخه و بررسی سلامت صفحه',
    durationMs: 1600,
    summary: 'صفحه منتشر شد و سلامت آن بررسی شد.',
    detail: {
      output: 'کد پاسخ سرور ۲۰۰ و زمان بارگذاری ۰.۹ ثانیه.',
      receipt: [
        { label: 'شناسهٔ انتشار', value: 'pub_8f31c2' },
        { label: 'نسخهٔ صفحه', value: 'v2' },
        { label: 'زمان', value: '۰.۹ ثانیه' },
      ],
    },
  },
]

export const AUDIT_STEPS: StepPlan[] = [
  {
    title: 'بررسی درخواست',
    durationMs: 800,
    summary: 'درخواست بررسی سرعت ثبت شد.',
  },
  {
    title: 'تحلیل تصاویر و فایل‌ها',
    durationMs: 1700,
    summary: '۱۲ تصویر سنگین و ۳ فایل CSS بدون فشرده‌سازی پیدا شد.',
    detail: {
      output: 'حجم کل صفحهٔ اصلی: ۴.۲ مگابایت',
      logs: ['images > 500KB: 12', 'css unminified: 3'],
    },
  },
  {
    title: 'بررسی افزونه‌ها',
    durationMs: 1400,
    summary: '۹ افزونه فعال است؛ ۳ مورد روی سرعت اثر منفی دارند.',
    detail: { output: 'پیشنهاد: غیرفعال‌کردن اسلایدر قدیمی و افزونهٔ آمار.' },
  },
  {
    title: 'تهیهٔ گزارش',
    durationMs: 1200,
    summary: 'گزارش با ۷ پیشنهاد اولویت‌دار آماده شد.',
    detail: {
      receipt: [
        { label: 'امتیاز فعلی', value: '۵۴ از ۱۰۰' },
        { label: 'امتیاز قابل دسترس', value: '۸۸ از ۱۰۰' },
        { label: 'تعداد پیشنهاد', value: '۷' },
      ],
    },
  },
]

export const PLUGIN_STEPS: StepPlan[] = [
  {
    title: 'بررسی نیاز',
    durationMs: 900,
    summary: 'نیازها مشخص شد: انتخاب تاریخ، ساعت و پیام تأیید.',
  },
  {
    title: 'بررسی افزونه‌های نصب‌شده',
    durationMs: 1200,
    summary: 'تداخل احتمالی با افزونهٔ فرم تماس بررسی شد؛ موردی نبود.',
    detail: { output: 'افزونه‌های فعال: ۹ — تداخل: بدون.' },
  },
  {
    title: 'آماده‌سازی کد افزونه',
    durationMs: 1900,
    summary: 'ساختار افزونه، جدول دیتابیس و صفحهٔ تنظیمات آماده شد.',
    detail: {
      output: 'فایل‌های تولیدشده: ۷',
      logs: ['yagent-booking.php', 'includes/rest.php', 'includes/table.php'],
    },
  },
  {
    title: 'نصب افزونه',
    description: 'نیازمند تأیید کاربر',
    durationMs: 700,
    summary: 'برای نصب روی سایت، تأیید تو لازم است.',
    approval: INSTALL_APPROVAL,
  },
  {
    title: 'فعال‌سازی و تنظیمات',
    durationMs: 1500,
    summary: 'افزونه فعال شد و برگهٔ رزرو نوبت اضافه شد.',
    detail: {
      output: 'برگهٔ «رزرو نوبت» در پیشخوان ساخته شد.',
      receipt: [
        { label: 'نسخهٔ افزونه', value: '1.0.0' },
        { label: 'شناسهٔ نصب', value: 'plg_c41a' },
      ],
    },
  },
]

export const FAILURE_STEPS: StepPlan[] = [
  {
    title: 'بررسی درخواست',
    durationMs: 900,
    summary: 'درخواست اصلاح قالب ثبت شد.',
  },
  {
    title: 'دسترسی به فایل‌های قالب',
    durationMs: 1300,
    summary: 'دسترسی به فایل قالب ممکن نشد.',
    fail: 'سرور با خطای ۴۰۳ پاسخ داد؛ فایل `header.php` قابل نوشتن نیست.',
    detail: {
      warning: 'مجوز فایل روی سرور باید توسط میزبان اصلاح شود.',
      logs: ['PUT /wp-content/themes/ara-child/header.php → 403', 'retry: 2/2'],
    },
  },
  {
    title: 'اعمال تغییرات',
    durationMs: 900,
    summary: 'بدون دسترسی به فایل انجام نمی‌شود.',
  },
]

export const FEEDBACK_STEPS: StepPlan[] = [
  {
    title: 'بررسی بازخورد',
    durationMs: 900,
    summary: 'علامت‌ها و بخش‌های هدف بررسی شد.',
    detail: { output: 'در بازخورد ارسالی، هر علامت به یک بخش پایدار وصل شده است.' },
  },
  {
    title: 'اعمال تغییرات طراحی',
    durationMs: 1900,
    summary: 'تغییرها روی ساختار صفحه اعمال شد.',
    detail: {
      output: 'ارتفاع بخش معرفی کم شد و دکمهٔ اصلی در موبایل وسط‌چین شد.',
      logs: ['hero: padding ۱۰۴px → ۵۸px', 'cta: display block + margin auto @560px'],
    },
  },
  {
    title: 'ساخت نسخهٔ جدید و پیش‌نمایش',
    producesPreview: true,
    durationMs: 1400,
    summary: 'نسخهٔ جدید آماده است؛ اختلاف‌ها را در پیش‌نمایش ببین.',
    detail: { output: 'نسخهٔ تازه به عنوان پیش‌نویس ثبت شد.' },
  },
]

export const QUICK_STEPS: StepPlan[] = [
  { title: 'بررسی درخواست', durationMs: 800, summary: 'درخواست ثبت شد.' },
  { title: 'تهیهٔ پاسخ', durationMs: 1200, summary: 'پاسخ آماده شد.' },
]

export interface ScenarioContext {
  /** Existing page of the conversation, if any (used by the feedback scenario). */
  pageId?: string
  pageTitle?: string
}

/** Maps a user request to one of the demo plans (the real backend does this with the model). */
export function scenarioFor(text: string, context: ScenarioContext = {}): ScenarioPlan {
  const value = text.trim()
  const mentionsAbout = /درباره|about/i.test(value)
  const pageId = context.pageId ?? (mentionsAbout ? 'page-about' : 'page-landing')
  const pageTitle = context.pageTitle ?? (mentionsAbout ? 'صفحهٔ دربارهٔ ما' : 'صفحهٔ فرود استودیو آرا')

  if (/خطا|نشد|قفل|error/i.test(value) && !/بررسی کن|چک کن/.test(value)) {
    return {
      kind: 'failure',
      taskTitle: 'اصلاح قالب',
      reply:
        'درخواست را ثبت کردم. برای اصلاح فایل قالب، مجوز نوشتن روی پوشهٔ قالب لازم است؛ اول بررسی می‌کنم.',
      steps: FAILURE_STEPS,
      failure: {
        title: 'اصلاح قالب انجام نشد',
        message: 'دسترسی نوشتن به فایل‌های قالب وجود ندارد؛ تا اصلاح مجوزها نمی‌توانم تغییر بدهم.',
        technical: [
          { label: 'فایل', value: 'wp-content/themes/ara-child/header.php' },
          { label: 'خطا', value: 'HTTP 403 (Forbidden)' },
          { label: 'کد پیگیری', value: 'yagent_err_4c19' },
        ],
      },
    }
  }

  if (/افزونه|plugin/i.test(value)) {
    return {
      kind: 'plugin',
      taskTitle: 'ساخت افزونهٔ رزرو نوبت',
      reply:
        'برای رزرو نوبت یک افزونهٔ سبک و سازگار با وردپرس می‌سازم: جدول اختصاصی دیتابیس، فرم کوتاه‌کد و برگهٔ تنظیمات.\n\nقبل از نصب روی سایت، از تو تأیید می‌گیرم.',
      steps: PLUGIN_STEPS,
      result: {
        title: 'افزونه نصب و فعال شد',
        message: 'کد کوتاه `[yagent_booking]` را در هر برگه‌ای که می‌خواهی قرار بده.',
        technical: [
          { label: 'افزونه', value: 'yagent-booking 1.0.0' },
          { label: 'شناسهٔ نصب', value: 'plg_c41a' },
        ],
      },
    }
  }

  if (/سرعت|عملکرد|بهینه|امتیاز|audit|performance/i.test(value)) {
    return {
      kind: 'audit',
      taskTitle: 'بررسی سرعت سایت',
      reply:
        'باشه. سرعت صفحهٔ اصلی را در چهار مرحله بررسی می‌کنم: تصاویر، فایل‌های CSS و JS، افزونه‌ها و تنظیمات کش.\n\nنتیجه را با اولویت اجرایی می‌دهم.',
      steps: AUDIT_STEPS,
      result: {
        title: 'گزارش بررسی سرعت آماده شد',
        message: '۷ پیشنهاد اولویت‌دار برای رساندن امتیاز از ۵۴ به ۸۸ ثبت شد.',
        technical: [
          { label: 'ابزار', value: 'yagent-audit 0.9' },
          { label: 'مدت بررسی', value: '۵.۱ ثانیه' },
        ],
      },
    }
  }

  if (/صفحه|لندینگ|landing|page|فرود|المنتور|elementor|بازطراحی|بساز/i.test(value)) {
    return {
      kind: 'build_page',
      taskTitle: mentionsAbout ? 'ساخت صفحهٔ دربارهٔ ما' : 'ساخت صفحهٔ فرود',
      reply:
        `صفحهٔ «${pageTitle}» را می‌سازم و قبل از انتشار، پیش‌نمایش را برای بازبینی می‌آورم.\n\nاگر نکته‌ای روی بخش‌های صفحه داشتی، همان‌جا می‌توانی علامت بگذاری و بنویسی.`,
      steps: BUILD_PAGE_STEPS,
      pageId,
      pageTitle,
      result: {
        title: 'صفحه منتشر شد',
        message: `«${pageTitle}» روی سایت منتشر شد و نسخهٔ قبلی در تاریخچه باقی ماند.`,
        technical: [
          { label: 'شناسهٔ انتشار', value: 'pub_8f31c2' },
          { label: 'زمان پاسخ', value: '۰.۹ ثانیه' },
        ],
      },
    }
  }

  if (/اصلاح|بازخورد|فیدبک|تغییر/i.test(value)) {
    return feedbackPlan(pageId, pageTitle)
  }

  return {
    kind: 'quick',
    taskTitle: 'پاسخ به درخواست',
    reply:
      'درخواست را بررسی کردم. برای اینکه دقیق‌تر عمل کنم، بگو منظور از «بهبود» کدام بخش سایت است: صفحهٔ اصلی، سرعت، یا افزونه‌ها؟\n\nیک پیشنهاد سریع: اگر تمرکزت روی نتیجهٔ تجاری است، شروع از صفحهٔ فرود سریع‌ترین اثر را دارد.',
    steps: QUICK_STEPS,
  }
}

export function feedbackPlan(pageId: string, pageTitle: string): ScenarioPlan {
  return {
    kind: 'page_feedback',
    taskTitle: 'اعمال اصلاحات صفحه',
    reply:
      'علامت‌ها را دیدم. تغییرها را روی همان بخش‌ها اعمال می‌کنم و نسخهٔ تازه‌ای می‌سازم تا مقایسه کنی.',
    steps: FEEDBACK_STEPS,
    pageId,
    pageTitle,
    result: {
      title: 'نسخهٔ جدید آماده شد',
      message: 'نسخهٔ تازه ساخته شد؛ می‌توانی آن را با نسخهٔ قبلی مقایسه کنی یا منتشرش کنی.',
      technical: [{ label: 'نسخهٔ مبنا', value: 'نسخهٔ قبلی همین صفحه' }],
    },
  }
}
