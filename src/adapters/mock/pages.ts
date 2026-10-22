/**
 * Demo page HTML that YAgent "generates" in the mock adapter.
 *
 * These documents stand in for pages produced by the WordPress backend. Each
 * editable section carries a stable `data-yagent-id`, which is how annotations
 * are bound to a section across revisions (see the message bridge in
 * `src/preview/bridge.ts`).
 */

const BASE_STYLE = `
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;background:#ffffff;color:#1b1b21;line-height:1.9;
    font-family:Vazirmatn,'Segoe UI',Tahoma,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  h1,h2,h3,p{margin:0}
  a{color:inherit;text-decoration:none}
  ul{margin:0;padding:0;list-style:none}
  .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
  .yg-header{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.92);
    border-bottom:1px solid #ececf1;backdrop-filter:blur(8px)}
  .yg-header .wrap{display:flex;align-items:center;justify-content:space-between;height:66px}
  .yg-logo{font-weight:700;font-size:17px;letter-spacing:-.2px}
  .yg-logo span{color:#4f46e5}
  .yg-nav{display:flex;gap:22px;font-size:14px;color:#5f5f6c}
  .yg-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#4f46e5;
    color:#fff;border-radius:11px;padding:12px 24px;font-weight:600;font-size:14px;
    box-shadow:0 8px 20px -10px rgba(79,70,229,.8)}
  .yg-btn--ghost{background:#f2f2f6;color:#2c2c36;box-shadow:none}
  .yg-section{padding:64px 0;border-top:1px solid #f1f1f5}
  .yg-eyebrow{font-size:13px;color:#4f46e5;font-weight:600;margin-bottom:10px}
  .yg-h2{font-size:26px;letter-spacing:-.4px;margin-bottom:10px}
  .yg-lead{color:#5f5f6c;font-size:15px;max-width:60ch}
  .yg-grid{display:grid;gap:18px;margin-top:32px}
  .yg-card{border:1px solid #ececf1;border-radius:16px;padding:22px;background:#fcfcfe}
  .yg-card h3{font-size:16px;margin-bottom:8px}
  .yg-card p{color:#63636f;font-size:14px}
  .yg-ico{width:38px;height:38px;border-radius:11px;background:#eef0fe;color:#4f46e5;
    display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:14px}
  .yg-price{border:1px solid #ececf1;border-radius:16px;padding:24px}
  .yg-price strong{display:block;font-size:24px;margin:10px 0 14px}
  .yg-price li{font-size:13.5px;color:#63636f;padding:5px 0}
  .yg-footer{background:#12121a;color:#b9b9c6;padding:44px 0;font-size:13.5px}
  .yg-footer .wrap{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between}
  @media(max-width:760px){
    .yg-nav{display:none}
    .yg-h2{font-size:22px}
    .yg-section{padding:46px 0}
  }
`

const LANDING_V1_STYLE = `
  .yg-hero{padding:104px 0 88px;background:linear-gradient(180deg,#f7f7fb,#ffffff)}
  .yg-hero h1{font-size:42px;line-height:1.35;letter-spacing:-1px;margin-bottom:18px;max-width:22ch}
  .yg-hero p{color:#5f5f6c;font-size:16px;max-width:54ch;margin-bottom:30px}
  .yg-hero-cta{display:inline-block}
  .yg-hero-meta{display:flex;gap:26px;margin-top:38px;font-size:13px;color:#7a7a88}
  #features .yg-grid{grid-template-columns:repeat(3,1fr)}
  #pricing .yg-grid{grid-template-columns:repeat(3,1fr)}
  @media(max-width:900px){
    #features .yg-grid,#pricing .yg-grid{grid-template-columns:1fr}
    .yg-hero{padding:76px 0 64px}
    .yg-hero h1{font-size:32px}
  }
  @media(max-width:560px){
    .yg-hero{padding:64px 0 54px}
    .yg-hero h1{font-size:27px}
    .yg-hero-cta{padding:14px 20px}
  }
`

const LANDING_V2_STYLE = `
  .yg-hero{padding:58px 0 52px;background:linear-gradient(180deg,#f7f7fb,#ffffff)}
  .yg-hero h1{font-size:36px;line-height:1.4;letter-spacing:-.8px;margin-bottom:16px;max-width:24ch}
  .yg-hero p{color:#5f5f6c;font-size:15.5px;max-width:54ch;margin-bottom:26px}
  .yg-hero-cta{display:inline-block}
  .yg-hero-meta{display:flex;gap:22px;margin-top:26px;font-size:13px;color:#7a7a88}
  #features .yg-grid{grid-template-columns:repeat(3,1fr)}
  #pricing .yg-grid{grid-template-columns:repeat(3,1fr)}
  .yg-note{border:1px dashed #c9c9d6;border-radius:14px;padding:16px 18px;background:#fbfbfe;
    font-size:13.5px;color:#5f5f6c;margin-top:26px}
  @media(max-width:900px){
    #features .yg-grid,#pricing .yg-grid{grid-template-columns:1fr}
    .yg-hero h1{font-size:30px}
  }
  @media(max-width:560px){
    .yg-hero{padding:44px 0 40px;text-align:center}
    .yg-hero h1{font-size:26px;margin-inline:auto}
    .yg-hero p{margin-inline:auto}
    .yg-hero-cta{display:block;max-width:280px;margin:0 auto;padding:14px 20px}
    .yg-hero-meta{justify-content:center}
  }
`

const LANDING_HEAD = `<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
`

const LANDING_HEADER = `<header class="yg-header" data-yagent-id="site-header">
    <div class="wrap">
      <div class="yg-logo">استودیو <span>آرا</span></div>
      <nav class="yg-nav">
        <a href="#">خانه</a><a href="#">خدمات</a><a href="#">نمونه‌کارها</a><a href="#">تماس</a>
      </nav>
      <a class="yg-btn" href="#" data-yagent-id="header-cta">گفت‌وگوی رایگان</a>
    </div>
  </header>`

const LANDING_FEATURES_V1 = `<div class="yg-grid">
      <article class="yg-card" data-yagent-id="feature-design">
        <div class="yg-ico">۰۱</div>
        <h3>طراحی اختصاصی</h3>
        <p>هر صفحه بر اساس هویت برند شما طراحی می‌شود؛ بدون قالب آماده.</p>
      </article>
      <article class="yg-card" data-yagent-id="feature-speed">
        <div class="yg-ico">۰۲</div>
        <h3>سرعت بالا</h3>
        <p>بهینه‌سازی تصاویر و کش؛ بارگذاری زیر ۱.۵ ثانیه روی موبایل.</p>
      </article>
      <article class="yg-card" data-yagent-id="feature-support">
        <div class="yg-ico">۰۳</div>
        <h3>پشتیبانی سالانه</h3>
        <p>به‌روزرسانی امنیتی و پشتیبانی فنی در تمام طول سال.</p>
      </article>
    </div>`

const LANDING_FEATURES_V2 = `<div class="yg-grid">
      <article class="yg-card" data-yagent-id="feature-design">
        <div class="yg-ico">۰۱</div>
        <h3>طراحی اختصاصی</h3>
        <p>هر صفحه بر اساس هویت برند شما طراحی می‌شود؛ بدون قالب آماده.</p>
      </article>
      <article class="yg-card" data-yagent-id="feature-speed">
        <div class="yg-ico">۰۲</div>
        <h3>سرعت بالا</h3>
        <p>بهینه‌سازی تصاویر و کش؛ بارگذاری زیر ۱.۵ ثانیه روی موبایل.</p>
      </article>
      <article class="yg-card" data-yagent-id="feature-guarantee">
        <div class="yg-ico">۰۳</div>
        <h3>تضمین بازگشت وجه</h3>
        <p>تا ۱۴ روز پس از تحویل، اگر نتیجه را نپسندید، هزینه برمی‌گردد.</p>
      </article>
    </div>`

const LANDING_PRICING = `<div class="yg-grid">
      <div class="yg-price" data-yagent-id="plan-basic">
        <div class="yg-eyebrow">پایه</div>
        <strong>۶ میلیون</strong>
        <ul><li>صفحهٔ فرود تک‌صفحه‌ای</li><li>طراحی موبایل</li><li>تحویل ۷ روزه</li></ul>
      </div>
      <div class="yg-price" data-yagent-id="plan-pro">
        <div class="yg-eyebrow">حرفه‌ای</div>
        <strong>۱۴ میلیون</strong>
        <ul><li>تا ۵ صفحه</li><li>سئوی فنی</li><li>پشتیبانی ۶ ماهه</li></ul>
      </div>
      <div class="yg-price" data-yagent-id="plan-business">
        <div class="yg-eyebrow">کسب‌وکار</div>
        <strong>۲۸ میلیون</strong>
        <ul><li>فروشگاه ووکامرس</li><li>آموزش محتوا</li><li>پشتیبانی سالانه</li></ul>
      </div>
    </div>`

const LANDING_FOOTER = `<footer class="yg-footer" data-yagent-id="site-footer">
    <div class="wrap">
      <div>© ۱۴۰۴ استودیو آرا — تمام حقوق محفوظ است.</div>
      <div>تهران، خیابان ولیعصر — ۰۲۱-۱۲۳۴۵۶۷۸</div>
    </div>
  </footer>`

export const landingPageV1 = `<!doctype html>
<html lang="fa" dir="rtl">
${LANDING_HEAD}
  <title>استودیو آرا — طراحی سایت حرفه‌ای</title>
  <style>${BASE_STYLE}${LANDING_V1_STYLE}</style>
</head>
<body>
  ${LANDING_HEADER}
  <section class="yg-hero" data-yagent-id="hero">
    <div class="wrap">
      <h1 data-yagent-id="hero-title">سایت حرفه‌ای برای کسب‌وکار شما، در کمتر از یک هفته</h1>
      <p data-yagent-id="hero-copy">
        طراحی اختصاصی، سرعت بالا و پشتیبانی واقعی. از ایده تا انتشار، همه چیز را با استودیو آرا
        پیش می‌برید.
      </p>
      <a class="yg-btn yg-hero-cta" href="#" data-yagent-id="hero-cta">شروع پروژه</a>
      <div class="yg-hero-meta">
        <span>+۱۲۰ پروژهٔ تحویل‌شده</span><span>میانگین امتیاز ۴.۹</span><span>تحویل از ۷ روز</span>
      </div>
    </div>
  </section>

  <section class="yg-section" id="features" data-yagent-id="features">
    <div class="wrap">
      <div class="yg-eyebrow">چرا ما</div>
      <h2 class="yg-h2">سه دلیل برای سپردن سایت به ما</h2>
      ${LANDING_FEATURES_V1}
    </div>
  </section>

  <section class="yg-section" id="pricing" data-yagent-id="pricing">
    <div class="wrap">
      <div class="yg-eyebrow">تعرفه‌ها</div>
      <h2 class="yg-h2">بستهٔ مناسب کسب‌وکارتان را انتخاب کنید</h2>
      ${LANDING_PRICING}
    </div>
  </section>

  <section class="yg-section" data-yagent-id="final-cta">
    <div class="wrap" style="text-align:center">
      <h2 class="yg-h2">آماده‌اید شروع کنیم؟</h2>
      <p class="yg-lead" style="margin:0 auto 22px">
        یک گفت‌وگوی ۱۵ دقیقه‌ای رایگان رزرو کنید و نقشهٔ راه پروژه را بگیرید.
      </p>
      <a class="yg-btn" href="#" data-yagent-id="final-cta-button">رزرو گفت‌وگو</a>
    </div>
  </section>

  ${LANDING_FOOTER}
</body>
</html>`

export const landingPageV2 = `<!doctype html>
<html lang="fa" dir="rtl">
${LANDING_HEAD}
  <title>استودیو آرا — طراحی سایت حرفه‌ای</title>
  <style>${BASE_STYLE}${LANDING_V2_STYLE}</style>
</head>
<body>
  ${LANDING_HEADER}
  <section class="yg-hero" data-yagent-id="hero">
    <div class="wrap">
      <h1 data-yagent-id="hero-title">سایت حرفه‌ای برای کسب‌وکار شما، در کمتر از یک هفته</h1>
      <p data-yagent-id="hero-copy">
        طراحی اختصاصی، سرعت بالا و پشتیبانی واقعی. از ایده تا انتشار، همه چیز را با استودیو آرا
        پیش می‌برید.
      </p>
      <a class="yg-btn yg-hero-cta" href="#" data-yagent-id="hero-cta">شروع پروژه</a>
      <div class="yg-hero-meta">
        <span>+۱۲۰ پروژهٔ تحویل‌شده</span><span>میانگین امتیاز ۴.۹</span><span>تحویل از ۷ روز</span>
      </div>
      <div class="yg-note" data-yagent-id="revision-note">
        نسخهٔ ۲ — ارتفاع بخش معرفی کم شد و دکمهٔ اصلی در موبایل وسط‌چین شد.
      </div>
    </div>
  </section>

  <section class="yg-section" id="features" data-yagent-id="features">
    <div class="wrap">
      <div class="yg-eyebrow">چرا ما</div>
      <h2 class="yg-h2">سه دلیل برای سپردن سایت به ما</h2>
      ${LANDING_FEATURES_V2}
    </div>
  </section>

  <section class="yg-section" id="pricing" data-yagent-id="pricing">
    <div class="wrap">
      <div class="yg-eyebrow">تعرفه‌ها</div>
      <h2 class="yg-h2">بستهٔ مناسب کسب‌وکارتان را انتخاب کنید</h2>
      ${LANDING_PRICING}
    </div>
  </section>

  <section class="yg-section" data-yagent-id="final-cta">
    <div class="wrap" style="text-align:center">
      <h2 class="yg-h2">آماده‌اید شروع کنیم؟</h2>
      <p class="yg-lead" style="margin:0 auto 22px">
        یک گفت‌وگوی ۱۵ دقیقه‌ای رایگان رزرو کنید و نقشهٔ راه پروژه را بگیرید.
      </p>
      <a class="yg-btn" href="#" data-yagent-id="final-cta-button">رزرو گفت‌وگو</a>
    </div>
  </section>

  ${LANDING_FOOTER}
</body>
</html>`

const ABOUT_V1_STYLE = `
  .yg-about-hero{padding:90px 0 70px;background:linear-gradient(180deg,#f7f7fb,#ffffff)}
  .yg-about-hero h1{font-size:38px;letter-spacing:-.8px;margin-bottom:16px}
  .yg-about-hero p{color:#5f5f6c;max-width:58ch}
  #team .yg-grid{grid-template-columns:repeat(3,1fr)}
  .yg-avatar{width:56px;height:56px;border-radius:50%;background:#eef0fe;color:#4f46e5;
    display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px}
  .yg-time li{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #f1f1f5;font-size:14px}
  .yg-time b{color:#4f46e5;min-width:64px}
  .yg-form{display:grid;gap:12px;max-width:520px;margin-top:24px}
  .yg-form input,.yg-form textarea{border:1px solid #e4e4ec;border-radius:11px;padding:12px 14px;
    font:inherit;background:#fbfbfe;width:100%}
  @media(max-width:900px){#team .yg-grid{grid-template-columns:1fr}}
`

const ABOUT_V2_STYLE = `
  .yg-about-hero{padding:54px 0 44px;background:linear-gradient(180deg,#f7f7fb,#ffffff)}
  .yg-about-hero h1{font-size:32px;letter-spacing:-.6px;margin-bottom:14px}
  .yg-about-hero p{color:#5f5f6c;max-width:58ch}
  #team .yg-grid{grid-template-columns:repeat(3,1fr)}
  .yg-avatar{width:56px;height:56px;border-radius:50%;background:#eef0fe;color:#4f46e5;
    display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px}
  .yg-mile li{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #f1f1f5;font-size:14px}
  .yg-mile b{color:#4f46e5;min-width:64px}
  .yg-form{display:grid;gap:12px;max-width:520px;margin-top:24px}
  .yg-form input,.yg-form textarea{border:1px solid #e4e4ec;border-radius:11px;padding:12px 14px;
    font:inherit;background:#fbfbfe;width:100%}
  @media(max-width:900px){#team .yg-grid{grid-template-columns:1fr}}
  @media(max-width:560px){
    .yg-about-hero{text-align:center}
    .yg-about-hero p{margin-inline:auto}
  }
`

export const aboutPageV1 = `<!doctype html>
<html lang="fa" dir="rtl">
${LANDING_HEAD}
  <title>دربارهٔ ما — استودیو آرا</title>
  <style>${BASE_STYLE}${ABOUT_V1_STYLE}</style>
</head>
<body>
  ${LANDING_HEADER}
  <section class="yg-about-hero" data-yagent-id="about-hero">
    <div class="wrap">
      <div class="yg-eyebrow">دربارهٔ ما</div>
      <h1 data-yagent-id="about-title">تیمی کوچک، پروژه‌هایی که کار می‌کنند</h1>
      <p data-yagent-id="about-copy">
        از سال ۱۳۹۶ برای کسب‌وکارهای کوچک و متوسط وب‌سایت می‌سازیم؛ با تمرکز روی سرعت،
        خوانایی و نتیجهٔ تجاری.
      </p>
    </div>
  </section>

  <section class="yg-section" data-yagent-id="story">
    <div class="wrap">
      <h2 class="yg-h2">داستان ما</h2>
      <p class="yg-lead">
        با سه نفر و یک میز مشترک شروع کردیم. امروز تیم ۱۱ نفرهٔ ما روی طراحی، توسعه و رشد
        سایت‌های فارسی کار می‌کند و بیش از ۱۲۰ پروژه تحویل داده است.
      </p>
    </div>
  </section>

  <section class="yg-section" id="team" data-yagent-id="team">
    <div class="wrap">
      <div class="yg-eyebrow">تیم</div>
      <h2 class="yg-h2">آدم‌هایی که پروژه را جلو می‌برند</h2>
      <div class="yg-grid">
        <article class="yg-card" data-yagent-id="team-1">
          <div class="yg-avatar">ن.ک</div>
          <h3>نگار کاظمی</h3>
          <p>مدیر طراحی — مسئول هویت بصری و تجربهٔ کاربری.</p>
        </article>
        <article class="yg-card" data-yagent-id="team-2">
          <div class="yg-avatar">س.ر</div>
          <h3>سعید رستمی</h3>
          <p>توسعه‌دهندهٔ ارشد وردپرس و افزونه‌های اختصاصی.</p>
        </article>
        <article class="yg-card" data-yagent-id="team-3">
          <div class="yg-avatar">م.ح</div>
          <h3>مریم حسینی</h3>
          <p>استراتژیست محتوا و سئوی فنی.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="yg-section" data-yagent-id="timeline">
    <div class="wrap">
      <div class="yg-eyebrow">مسیر ما</div>
      <h2 class="yg-h2">نقاط عطف</h2>
      <ul class="yg-time">
        <li><b>۱۳۹۶</b><span>شروع کار با اولین مشتری، یک فروشگاه صنایع دستی.</span></li>
        <li><b>۱۳۹۹</b><span>تمرکز کامل روی سرعت و بهینه‌سازی هستهٔ وردپرس.</span></li>
        <li><b>۱۴۰۲</b><span>راه‌اندازی سرویس پشتیبانی سالانه.</span></li>
      </ul>
    </div>
  </section>

  <section class="yg-section" data-yagent-id="contact">
    <div class="wrap">
      <h2 class="yg-h2">با ما حرف بزنید</h2>
      <p class="yg-lead">فرم زیر را پر کنید؛ در کمتر از یک روز کاری پاسخ می‌دهیم.</p>
      <form class="yg-form" data-yagent-id="contact-form">
        <input type="text" placeholder="نام و نام خانوادگی" />
        <input type="email" placeholder="ایمیل" />
        <textarea rows="4" placeholder="دربارهٔ پروژه بنویسید…"></textarea>
        <button class="yg-btn" type="button" data-yagent-id="contact-submit">ارسال پیام</button>
      </form>
    </div>
  </section>

  ${LANDING_FOOTER}
</body>
</html>`

export const aboutPageV2 = `<!doctype html>
<html lang="fa" dir="rtl">
${LANDING_HEAD}
  <title>دربارهٔ ما — استودیو آرا</title>
  <style>${BASE_STYLE}${ABOUT_V2_STYLE}</style>
</head>
<body>
  ${LANDING_HEADER}
  <section class="yg-about-hero" data-yagent-id="about-hero">
    <div class="wrap">
      <div class="yg-eyebrow">دربارهٔ ما</div>
      <h1 data-yagent-id="about-title">تیمی کوچک، پروژه‌هایی که کار می‌کنند</h1>
      <p data-yagent-id="about-copy">
        از سال ۱۳۹۶ برای کسب‌وکارهای کوچک و متوسط وب‌سایت می‌سازیم؛ با تمرکز روی سرعت،
        خوانایی و نتیجهٔ تجاری.
      </p>
    </div>
  </section>

  <section class="yg-section" data-yagent-id="story">
    <div class="wrap">
      <h2 class="yg-h2">داستان ما</h2>
      <p class="yg-lead">
        با سه نفر و یک میز مشترک شروع کردیم. امروز تیم ۱۱ نفرهٔ ما روی طراحی، توسعه و رشد
        سایت‌های فارسی کار می‌کند و بیش از ۱۲۰ پروژه تحویل داده است.
      </p>
    </div>
  </section>

  <section class="yg-section" id="team" data-yagent-id="team">
    <div class="wrap">
      <div class="yg-eyebrow">تیم</div>
      <h2 class="yg-h2">آدم‌هایی که پروژه را جلو می‌برند</h2>
      <div class="yg-grid">
        <article class="yg-card" data-yagent-id="team-1">
          <div class="yg-avatar">ن.ک</div>
          <h3>نگار کاظمی</h3>
          <p>مدیر طراحی — مسئول هویت بصری و تجربهٔ کاربری.</p>
        </article>
        <article class="yg-card" data-yagent-id="team-2">
          <div class="yg-avatar">س.ر</div>
          <h3>سعید رستمی</h3>
          <p>توسعه‌دهندهٔ ارشد وردپرس و افزونه‌های اختصاصی.</p>
        </article>
        <article class="yg-card" data-yagent-id="team-3">
          <div class="yg-avatar">م.ح</div>
          <h3>مریم حسینی</h3>
          <p>استراتژیست محتوا و سئوی فنی.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="yg-section" data-yagent-id="milestones">
    <div class="wrap">
      <div class="yg-eyebrow">مسیر ما</div>
      <h2 class="yg-h2">نقاط عطف</h2>
      <ul class="yg-mile">
        <li><b>۱۳۹۶</b><span>شروع کار با اولین مشتری، یک فروشگاه صنایع دستی.</span></li>
        <li><b>۱۳۹۹</b><span>تمرکز کامل روی سرعت و بهینه‌سازی هستهٔ وردپرس.</span></li>
        <li><b>۱۴۰۲</b><span>راه‌اندازی سرویس پشتیبانی سالانه.</span></li>
      </ul>
    </div>
  </section>

  <section class="yg-section" data-yagent-id="contact">
    <div class="wrap">
      <h2 class="yg-h2">با ما حرف بزنید</h2>
      <p class="yg-lead">فرم زیر را پر کنید؛ در کمتر از یک روز کاری پاسخ می‌دهیم.</p>
      <form class="yg-form" data-yagent-id="contact-form">
        <input type="text" placeholder="نام و نام خانوادگی" />
        <input type="email" placeholder="ایمیل" />
        <textarea rows="4" placeholder="دربارهٔ پروژه بنویسید…"></textarea>
        <button class="yg-btn" type="button" data-yagent-id="contact-submit">ارسال پیام</button>
      </form>
    </div>
  </section>

  ${LANDING_FOOTER}
</body>
</html>`

/** Element ids available in a generated document (stable section markers). */
export function extractElementIds(html: string): string[] {
  const ids = new Set<string>()
  const pattern = /data-yagent-id="([^"]+)"/g
  let match = pattern.exec(html)
  while (match) {
    ids.add(match[1])
    match = pattern.exec(html)
  }
  return [...ids]
}
