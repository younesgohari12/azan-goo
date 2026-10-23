<?php if (!defined('ABSPATH')) { exit; } ?>
<div class="wrap ya-app" dir="rtl">
    <h1>YAgent AI <small>بتا <?php echo esc_html(YAGENT_AI_VERSION); ?></small></h1>
    <p>دستیار سایت؛ اجرای ابزار و ساخت ZIP افزونه از همین گفتگو. مدیریت صفحه و افزونه پس از تأیید پیش‌نمایش انجام می‌شود.</p>
    <div id="ya-notice" role="status" aria-live="polite"></div>
    <div class="ya-grid">
        <section class="ya-panel" aria-labelledby="ya-settings-title">
            <h2 id="ya-settings-title">تنظیمات اتصال</h2>
            <form id="ya-settings-form">
                <label for="ya-provider">سرویس</label>
                <select id="ya-provider" disabled>
                    <?php foreach (\YAgent\Providers\Catalog::all() as $id=>$p): ?>
                    <option value="<?php echo esc_attr($id); ?>"><?php echo esc_html($p['label']); ?></option>
                    <?php endforeach; ?>
                </select>
                <label for="ya-base-url">Base URL</label>
                <input id="ya-base-url" type="url" dir="ltr" autocomplete="off" required placeholder="https://…/v1" />
                <p class="description" id="ya-endpoint-hint">برای آروان، آدرس Endpoint حساب AIaaS خود را وارد کنید. مسیر chat/completions به Base URL افزوده می‌شود.</p>
                <label for="ya-model">شناسه دقیق مدل</label>
                <input list="ya-model-options" id="ya-model" type="text" dir="ltr" maxlength="128" autocomplete="off" required placeholder="شناسه مدل در پنل سرویس" />
                <datalist id="ya-model-options"></datalist><button id="ya-models" type="button" class="button">دریافت مدل‌های حساب</button><p id="ya-models-state" class="description">شناسه مدل را وارد کنید یا فهرست حساب را دریافت کنید.</p>
                <label for="ya-key">API Key</label>
                <input id="ya-key" type="password" dir="ltr" autocomplete="new-password" maxlength="4096" aria-describedby="ya-key-state" />
                <p id="ya-key-state" class="description">در حال دریافت تنظیمات…</p>
                <label class="ya-checkbox"><input type="checkbox" id="ya-remove-key" /> حذف کلید ذخیره‌شده این سرویس</label>
                <details><summary>تنظیمات تخصصی اتصال و سقف دستی</summary>
                <div class="ya-row">
                    <div><label for="ya-timeout">زمان انتظار (ثانیه)</label><input id="ya-timeout" type="number" min="10" max="90" value="45" required /></div>
                    <div><label for="ya-tokens">سقف توکن خروجی</label><input id="ya-tokens" type="number" min="64" max="1000000" value="2048" required /></div>
                </div>
                <label for="ya-token-parameter">پارامتر محدودیت خروجی</label>
                <select id="ya-token-parameter" dir="ltr"><option value="max_tokens">max_tokens</option><option value="max_completion_tokens">max_completion_tokens</option></select>
                </details>
                <label class="ya-checkbox"><input type="checkbox" id="ya-tools-enabled" checked /> استفاده از ابزار برای این مدل (نیازمند پشتیبانی Function Calling مدل)</label>
                <label class="ya-checkbox"><input type="checkbox" id="ya-allow-writes" /> اجازه تغییرات سایت؛ مدیریت صفحه و افزونه با تأیید شما</label>
                <label class="ya-checkbox"><input type="checkbox" id="ya-auto-install" /> ساخت، نصب و فعال‌سازی خودکار افزونه‌های تولیدشده</label>
                <p class="description">حالت خودکار یک‌بار از اینجا مجاز می‌شود و برای هر افزونه تأیید جداگانه نمی‌پرسد. به اجازه تغییر نیاز دارد. کد تولیدشده واقعاً روی سایت اجرا می‌شود؛ بررسی راه‌اندازی، تضمین عملکرد یا امنیت همه کدها نیست.</p>
                <p class="description">فعال‌کردن ابزار، اعلام قابلیت مدل توسط شماست؛ تست اتصال آن را تأیید نمی‌کند. گزینه اجازه تغییر، سیاست سراسری فقط‌خواندنی را هم تنظیم می‌کند.</p>
                <p class="description">سقف خروجی نمایش‌داده‌شده، سقف مؤثر چت است؛ ذخیره آن سقف خروجی سیاست مصرف را هم تنظیم می‌کند. ظرفیت زمینه در تنظیمات پیشرفته مصرف قرار دارد.</p>
                <p class="description">برای سرویس‌های سازگار با OpenAI طبق مستندات مدل انتخاب کنید. برای Gemini خودکار تبدیل می‌شود.</p>
                <p class="ya-actions"><button id="ya-save" type="submit" class="button button-primary" disabled>ذخیره و انتخاب سرویس</button><button id="ya-test" type="button" class="button" disabled>تست اتصال</button></p>
            </form>
            <div class="ya-consumption-card"><label class="ya-checkbox"><input type="checkbox" id="ya-open-consumption" /> مصرف بدون سقف داخلی YAgent</label><p id="ya-consumption-state" class="description"></p><p class="description">با تأیید یک‌باره، سقف هزینه، تعداد درخواست و مراحل داخلی برداشته می‌شود و خروجی را سرویس تعیین می‌کند. هزینه از حساب API شما کسر می‌شود. هر زمان می‌توانید خاموش کنید؛ مجوز تغییر سایت جداست.</p></div>
            <p class="description">ذخیره تنظیمات هزینه API ندارد. تست اتصال و ارسال پیام از اعتبار حساب سرویس استفاده می‌کنند. مدل‌ها و سرویس‌ها به‌صورت مستقل با حساب شما نیاز به تست دارند.</p>
        </section>
        <section class="ya-panel ya-chat-panel" aria-labelledby="ya-chat-title">
            <div class="ya-chat-head"><h2 id="ya-chat-title">گفت‌وگوی آزمایشی</h2><button type="button" id="ya-new-chat" class="button" disabled>گفت‌وگوی جدید</button></div>
            <p id="ya-active" class="description"></p>
            <label class="ya-checkbox"><input type="checkbox" id="ya-agent-mode" checked /> اجرای ابزار از گفتگو</label>
            <div class="ya-actions"><select id="ya-conversations" aria-label="گفتگوهای ذخیره‌شده"><option value="">گفت‌وگوی جدید</option></select><button id="ya-load-chat" type="button" class="button">باز کردن گفتگو</button></div>
            <div class="ya-workspace"><div class="ya-chat-main">
            <div id="ya-chat" role="log" aria-live="polite" tabindex="0"><p id="ya-empty">پس از ذخیره تنظیمات، یک پیام بفرستید.</p></div>
            <p id="ya-task-status" role="status" data-status=""></p>
            <div id="ya-approvals"></div><div id="ya-results"></div>
            <p class="ya-actions"><button id="ya-continue" type="button" class="button" disabled>ادامه کار</button><button id="ya-stop" type="button" class="button" disabled>توقف کار</button></p>
            <form id="ya-chat-form">
                <label for="ya-message">پیام شما</label><textarea id="ya-message" rows="3"  placeholder="سلام؛ برای شروع یک سؤال بپرس…"></textarea>
                <label for="ya-files">عکس یا فایل</label><input id="ya-files" type="file" multiple /><div id="ya-file-list" class="ya-file-list" aria-live="polite"></div><p class="description">عکس، PDF، متن و کد؛ صدا و ویدئو در صورت پشتیبانی سرویس. فایل فقط با ارسال پیام به مدل فرستاده می‌شود.</p>
                <p class="ya-actions"><button id="ya-send" class="button button-primary" type="submit" disabled>ارسال پیام</button><span id="ya-progress" role="status"></span></p>
            </form>
            </div>
            <aside id="ya-work-panel" class="ya-work-panel" data-state="idle" aria-labelledby="ya-work-heading" aria-busy="false">
                <div class="ya-work-heading"><span class="ya-work-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></span><div><h3 id="ya-work-heading">روند انجام کار</h3><span>همراهِ گفتگوی شما</span></div><span id="ya-work-badge" class="ya-work-badge">آماده</span></div>
                <div class="ya-work-status" role="status" aria-live="polite" aria-atomic="true"><span class="ya-work-status-dot" aria-hidden="true"></span><h4 id="ya-work-title">آماده گفتگو</h4><p id="ya-work-description">درخواستتان را بنویسید؛ مراحل اجرا اینجا نمایش داده می‌شوند.</p><div class="ya-work-track" aria-hidden="true"><span></span></div></div>
                <div class="ya-work-metrics"><div><span>زمان سپری‌شده</span><strong id="ya-work-elapsed" dir="ltr">۰۰:۰۰</strong></div><div><span>مرحله مدل</span><strong id="ya-work-models">۰</strong></div><div><span>ابزار</span><strong id="ya-work-tools">۰</strong></div></div>
                <div class="ya-work-log"><div class="ya-work-log-head"><span>مراحل و ابزارها</span><span id="ya-work-count">هنوز شروع نشده</span></div><ol id="ya-work-timeline" class="ya-work-timeline"></ol><div id="ya-work-empty" class="ya-work-empty"><span aria-hidden="true">✦</span><p>از اولین درخواست تا نتیجه نهایی، مسیر کار را دنبال کنید.</p></div></div>
                <p class="ya-work-footnote"><span aria-hidden="true"></span>خلاصه مراحل واقعی و نتیجه ابزارها</p>
            </aside></div>
            <p class="description">گفتگو روی سایت ذخیره می‌شود. هنگام اجرای ابزار، داده‌های مجاز ابزار به سرویس AI ارسال می‌شوند. بارگذاری مجدد فقط وضعیت را می‌خواند؛ برای کار ناتمام «ادامه» را بزنید. اگر نصب خودکار را فعال کرده باشید، افزونه تازه نصب و فعال می‌شود و راه‌اندازی آن بررسی می‌شود؛ آزمون کامل عملکرد و امنیت جداست.</p>
            <details open><summary>بسته‌های افزونه ساخته‌شده</summary><button id="ya-artifacts-refresh" type="button" class="button">به‌روزرسانی بسته‌ها</button><div id="ya-artifacts"></div></details>
        </section>
    </div>
    <details class="ya-panel ya-diagnostics"><summary>گزارش آخرین درخواست‌ها</summary><p class="description">فقط زمان، سرویس، نتیجه و مدت اجرا ثبت می‌شود. متن پیام‌ها و کلیدها در این گزارش ذخیره نمی‌شوند.</p><button id="ya-refresh" type="button" class="button">به‌روزرسانی گزارش</button><div id="ya-events"></div></details>
    <noscript><p>برای استفاده از این بخش JavaScript مرورگر را فعال کنید.</p></noscript>
</div>
