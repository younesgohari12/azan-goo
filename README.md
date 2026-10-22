# YAgent — رابط کاربری دستیار هوش مصنوعی وردپرس

رابط کاربری کامل، تیره و فارسی (RTL) برای دستیار ساخت سایت **YAgent**: گفتگو با هوش
مصنوعی، نمایش زندهٔ مراحل کار، پیش‌نمایش صفحه، علامت‌گذاری روی صفحه و درخواست اصلاح،
تأیید عملیات‌های حساس (انتشار صفحه، حذف افزونه) و تاریخچهٔ گفتگوها.

این نسخه **فقط فرانت‌اند** است و با یک **Mock Adapter** کامل کار می‌کند: نیازی به
دیتابیس، احراز هویت، سرویس هوش مصنوعی یا هیچ کلید API نیست. تمام ارتباط‌ها از یک
لایهٔ مستقل (`YAgentAdapter`) عبور می‌کنند تا اتصال بعدی به بک‌اند افزونهٔ وردپرس
بدون تغییر در کامپوننت‌ها انجام شود.

## اجرا

```bash
docker compose -f docker-compose.base44.yml up -d --build
# سپس: http://localhost:3000/
```

اجرای محلی بدون داکر:

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # بررسی نوع‌ها
npm run build      # بررسی ساخت پروژه
```

### دانلود کد پروژه (ZIP)

تا وقتی سرور توسعه در حال اجراست، آرشیو کامل کد از این مسیر ساخته و دانلود می‌شود:

```
/yagent-source.zip        # مثلاً http://localhost:3000/yagent-source.zip
```

آرشیو در حافظه و با `node:zlib` ساخته می‌شود (`scripts/make-source-zip.mjs`)، بدون
نیاز به دستور `zip` یا وابستگی اضافه. این مسیر در حالت development فعال است و در منوی
حساب کاربری (پایین سایدبار) هم دکمهٔ «دانلود کد پروژه» وجود دارد.

## ساختار پروژه

```
src/
  adapters/            لایهٔ سرویس (تنها نقطهٔ اتصال به بک‌اند)
    types.ts           قرارداد YAgentAdapter + رویدادهای AgentEvent
    index.ts           ساخت adapter (امروز: mock، فردا: REST وردپرس)
    mock/              پیاده‌سازی کامل نمایشی
      fixtures.ts      دادهٔ نمونه (گفتگوها، مراحل، تأییدها، نسخه‌ها، نظرها)
      scenarios.ts     سناریوهای اجرا (ترتیب و تعداد مراحل از داده می‌آید)
      mockAdapter.ts   موتور رویدادها، تایمرها، توقف، تأیید، نسخه‌سازی
      pages.ts         HTML صفحات تولیدشدهٔ نمونه با شناسهٔ پایدار data-yagent-id
  components/
    shell/YAgentApp.tsx        چیدمان سه‌ستونه + کشوهای موبایل
    sidebar/                   ChatSidebar, ConversationRow
    chat/                      ChatThread, MessageItem, ChatComposer, MarkdownContent, CodeBlock, AttachmentChips, ModelPicker, EmptyState
    activity/                  ActivityBlock, TaskPanel, TaskStepItem, status
    approval/                  ApprovalCard, ResultCard
    preview/                   PreviewWorkspace, PreviewToolbar, PreviewCanvas, AnnotationLayer, FeedbackPanel
    ui/                        اجزای پایه (Button, Dialog/Sheet, DropdownMenu, Tooltip, Segmented, Badge, …)
  preview/             پل پیام‌رسان iframe (bridge.ts) و سازندهٔ سند پیش‌نمایش
  state/               reducer + Provider (وضعیت رابط، جدا از منطق سرور)
  types/model.ts       مدل داده: Conversation, Message, Task, TaskStep, Approval, PreviewRevision, Annotation
  styles/globals.css   توکن‌های طراحی و ریست محدودشده به .yagent-root
```

## اتصال به بک‌اند YAgent (افزونهٔ وردپرس)

همهٔ ارتباط‌ها در `src/adapters/types.ts` تعریف شده‌اند:

```ts
listConversations() / createConversation() / renameConversation() / setConversationPinned() / deleteConversation()
getConversationSnapshot(conversationId)  // پیام‌ها + وظیفه، تأییدیه، نتیجه و علامت‌های ارجاع‌شده
listModels()
sendMessage({ conversationId, text, attachments, modelId })
stopTask(conversationId)
resolveApproval(approvalId, 'approve' | 'reject')
getPagePreview(pageId) / sendPageFeedback(input) / resolveAnnotation(id) / publishRevision(revisionId)
subscribe(listener)   // رویدادها: پیام‌ها، مراحل، تأییدها، نسخه‌ها، نظرها
```

برای اتصال، فقط `createYAgentAdapter()` در `src/adapters/index.ts` را به یک adapter
مبتنی بر REST تبدیل کنید (نمونهٔ نگاشت پیشنهادی):

| عملیات رابط | نقطهٔ پایانی پیشنهادی |
| --- | --- |
| فهرست/ساخت/تغییر نام/سنجاق/حذف گفتگو | `GET/POST/PATCH/DELETE /wp-json/yagent/v1/conversations` |
| پیام‌های یک گفتگو | `GET /wp-json/yagent/v1/conversations/:id/messages` |
| ارسال پیام | `POST /wp-json/yagent/v1/conversations/:id/messages` |
| رویدادهای زندهٔ کار | `GET /wp-json/yagent/v1/conversations/:id/events` (SSE) |
| توقف کار | `POST /wp-json/yagent/v1/tasks/:id/stop` |
| تأیید/رد عملیات | `POST /wp-json/yagent/v1/approvals/:id/decision` |
| پیش‌نمایش صفحه | `GET /wp-json/yagent/v1/pages/:id/revisions` |
| بازخورد صفحه | `POST /wp-json/yagent/v1/pages/:id/feedback` |
| انتشار نسخه | `POST /wp-json/yagent/v1/pages/:id/publish` |

نکته‌ها برای انتقال:

- استایل‌ها زیر `.yagent-root` محدود شده‌اند؛ هیچ ریست سراسری روی `body`، `button` یا
  `input` اعمال نمی‌شود (preflight تیلویند خاموش است و به‌جایش یک ریست اسکوپ‌شده در
  `globals.css` وجود دارد). کافی است `<YAgentApp />` را داخل `.yagent-root` در صفحهٔ
  پیشخوان وردپرس مانت کنید.
- رنگ، فاصله، شعاع و تایپوگرافی از متغیرهای CSS در همان فایل می‌آیند؛ تغییر تم = تغییر توکن‌ها.
- پل پیش‌نمایش فقط با `postMessage` کار می‌کند (`src/preview/bridge.ts`): پوسته هیچ‌وقت
  `contentDocument` را نمی‌خواند، پس همان کد برای صفحه‌ای با مبدأ متفاوت (فرانت سایت
  وردپرس) هم کار می‌کند. برای پیش‌نمایش cross-origin کافی است `allow-same-origin` را
  از `sandbox` بردارید.
- برای اتصال علامت‌ها به بخش‌های صفحه، هر بخش قابل ویرایش یک `data-yagent-id` پایدار
  دارد؛ موقعیت هر علامت به‌صورت نسبی (۰ تا ۱) ذخیره می‌شود و با شناسهٔ عنصر گره می‌خورد.

## سناریوی نمایشی

۱. در گفتگوی تازه بنویسید: «یک صفحهٔ فرود با المنتور برای معرفی خدمات استودیو آرا بساز.»
۲. پاسخ استریم می‌شود، بلوک فعالیت با زمان سپری‌شدهٔ واقعی و مراحل زنده ظاهر می‌شود.
۳. در پایان مرحلهٔ «آماده‌سازی پیش‌نمایش»، کارت نتیجه با دکمهٔ «مشاهدهٔ پیش‌نمایش» می‌آید.
۴. مرحلهٔ ۶ منتظر تأیید می‌ماند؛ کارت تأیید در چت، «تأیید و اجرا» یا «رد».
۵. در کارگاه پیش‌نمایش: «علامت‌گذاری» را روشن کنید، روی بخش معرفی کلیک (پین) یا با موس
   یک ناحیه بکشید، توضیح را در پنل بنویسید و «ارسال اصلاحات به دستیار» را بزنید.
۶. نسخهٔ ۲ ساخته می‌شود؛ نظرهای نسخهٔ قبلی با وضعیت «نیازمند بررسی» یا «عنصر پیدا نشد»
   علامت می‌خورند و در پنل بازخورد قابل بررسی هستند.

## حالت‌های قابل آزمایش

| حالت | مسیر نمایش |
| --- | --- |
| گفتگوی خالی | گفتگوی «صفحهٔ تماس با ما» یا «گفتگوی جدید» |
| تاریخچهٔ گفتگوها | سایدبار: سنجاق‌شده، امروز، دیروز، ۷ روز گذشته، قدیمی‌تر |
| پاسخ در حال دریافت | ارسال هر پیام تازه (استریم کلمه‌به‌کلمه) |
| اجرای چندمرحله‌ای | بلوک فعالیت + پنل «مراحل انجام کار» |
| انتظار تأیید | گفتگوی «افزونهٔ رزرو نوبت» (کارت نصب) و «حذف افزونهٔ فرم تماس قدیمی» |
| کار تکمیل‌شده | گفتگوی «بررسی سرعت سایت» |
| خطا | گفتگوی «اصلاح هدر قالب» |
| توقف | دکمهٔ «توقف» در حین اجرای مراحل |
| پیش‌نمایش صفحه | گفتگوی «صفحهٔ فرود استودیو آرا» → مشاهدهٔ پیش‌نمایش |
| علامت‌گذاری و ارسال اصلاحات | کارگاه پیش‌نمایش → حالت علامت‌گذاری |

## نکات فنی

- **RTL**: کل رابط `dir="rtl"` است؛ متن انگلیسی، URL، کد و شناسه‌ها با کلاس
  `yagent-ltr` جهت مستقل LTR دارند.
- **فونت**: Vazirmatn Variable (بستهٔ `@fontsource-variable/vazirmatn`) با fallback
  سیستم؛ بدون وابستگی به شبکهٔ بیرونی.
- **حرکت**: انیمیشن‌ها ۱۵۰ تا ۲۲۰ میلی‌ثانیه و سبک هستند؛ حالت کاهش حرکت سیستم‌عامل
  هم در CSS (`prefers-reduced-motion`) و هم در Motion (`MotionConfig reducedMotion="user"`)
  رعایت می‌شود.
- **موبایل**: سایدبار و پنل مراحل به کشو تبدیل می‌شوند، چت و پیش‌نمایش با تب جابه‌جا
  می‌شوند، ورودی چت با `100dvh` و `safe-area` همیشه در دسترس می‌ماند.
- **ورودی صوتی**: بر اساس قابلیت اعلام‌شده توسط adapter نمایش داده می‌شود
  (`capabilities.voiceInput`)، در این نسخه غیرفعال است و موفق‌نمایی نمی‌کند.
- **پیشرفت کار**: از وضعیت واقعی مراحل محاسبه می‌شود؛ درصد ساختگی وجود ندارد.
- **نمایشی بودن**: فایل‌های ضمیمه فقط در رابط مدیریت می‌شوند و جایی آپلود نمی‌شوند؛
  داده‌ها در حافظه‌اند و با رفرش صفحه به حالت اولیه برمی‌گردند.
