<?php if (!defined('ABSPATH')) { exit; } ?>
<div class="wrap" id="yv2-app" dir="rtl">
    <h1>YAgent — مدیریت کارها</h1>
    <p>ایجاد کار و ادامه اجرای آن می‌تواند از اعتبار سرویس استفاده کند. باز کردن این صفحه و مشاهده سوابق، کاری را اجرا نمی‌کند.</p>
    <div id="yv2-errors" role="alert" aria-live="assertive" hidden></div>
    <button type="button" class="button" id="yv2-dismiss-errors" hidden>بستن پیام‌های خطا</button>
    <p id="yv2-notice" role="status" aria-live="polite"></p>

    <details>
        <summary>تنظیمات مصرف، مدل‌ها و سیاست اجرا</summary>
        <form id="yv2-config-form">
            <p><label for="yv2-config">تنظیمات JSON</label></p>
            <textarea id="yv2-config" rows="20" class="large-text code" dir="ltr" spellcheck="false" required></textarea>
            <p class="description">قیمت‌های نامعلوم را null نگه دارید. مدل‌ها، سطح‌های تفکر، مسیریابی، سقف مصرف و حالت فقط خواندنی در این تنظیمات تعیین می‌شوند.</p>
            <p><button type="submit" id="yv2-config-save" class="button button-primary">ذخیره تنظیمات</button> <button type="button" id="yv2-config-refresh" class="button">دریافت دوباره تنظیمات</button></p>
        </form>
    </details>

    <h2>مدل و آزمون اتصال</h2>
    <p><label for="yv2-profile">مدل</label> <select id="yv2-profile"><option value="">مسیریابی خودکار</option></select> <label for="yv2-thinking">تفکر</label> <select id="yv2-thinking"><option value="auto">auto</option></select> <button type="button" id="yv2-health" class="button">آزمون اتصال مدل انتخاب‌شده</button></p>
    <p class="description">آزمون اتصال هزینه API دارد. نتیجه اتصال به‌تنهایی، ابزارها یا سطح تفکر را تأیید نمی‌کند.</p>
    <pre id="yv2-health-result" dir="ltr"></pre>

    <h2>گفت‌وگوها</h2>
    <p><label for="yv2-conversation">گفت‌وگو</label> <select id="yv2-conversation"><option value="">گفت‌وگوی تازه هنگام ایجاد کار</option></select> <button type="button" id="yv2-conversations-refresh" class="button">به‌روزرسانی فهرست</button></p>
    <form id="yv2-conversation-form">
        <p><label for="yv2-conversation-title">عنوان</label> <input id="yv2-conversation-title" class="regular-text" type="text" maxlength="200" required> <button type="submit" id="yv2-conversation-create" class="button">ایجاد گفت‌وگو</button> <button type="button" id="yv2-conversation-rename" class="button">تغییر نام انتخاب‌شده</button></p>
    </form>
    <p><button type="button" id="yv2-conversation-clear" class="button">پاک کردن تاریخچه انتخاب‌شده</button> <button type="button" id="yv2-conversation-delete" class="button">حذف گفت‌وگوی انتخاب‌شده</button></p>
    <details><summary>تاریخچه و مصرف گفت‌وگو</summary><pre id="yv2-conversation-data" dir="ltr"></pre></details>

    <h2>قالب‌های پیام</h2>
    <p><label for="yv2-template">قالب</label> <select id="yv2-template"><option value="">قالب تازه</option></select> <button type="button" id="yv2-templates-refresh" class="button">به‌روزرسانی فهرست</button></p>
    <form id="yv2-template-form">
        <p><label for="yv2-template-title">عنوان قالب</label> <input id="yv2-template-title" class="regular-text" type="text" maxlength="200" required></p>
        <p><label for="yv2-template-prompt">متن قالب</label></p><textarea id="yv2-template-prompt" class="large-text" rows="4" required></textarea>
        <p><button type="submit" id="yv2-template-save" class="button">ذخیره قالب</button> <button type="button" id="yv2-template-new" class="button">قالب تازه</button> <button type="button" id="yv2-template-use" class="button">کپی متن به پیام کار</button> <button type="button" id="yv2-template-delete" class="button">حذف قالب انتخاب‌شده</button></p>
    </form>

    <h2>ایجاد کار</h2>
    <form id="yv2-task-form">
        <p><label for="yv2-prompt">پیام</label></p><textarea id="yv2-prompt" class="large-text" rows="5" required></textarea>
        <p><label for="yv2-mode">حالت</label> <select id="yv2-mode"><option value="agent">عامل</option><option value="chat">گفت‌وگو</option></select> <label><input type="checkbox" id="yv2-read-only" checked> فقط خواندنی</label> <label><input type="checkbox" id="yv2-allow-powerful">اجازه مدل قوی‌تر</label></p>
        <p><button type="submit" id="yv2-task-create" class="button button-primary">ایجاد و اجرای کار</button> <button type="button" id="yv2-task-new" class="button">پیام کار تازه</button></p>
    </form>
    <p class="description">اجرا مرحله‌به‌مرحله است؛ هر مرحله حداکثر یک فراخوانی هزینه‌دار دارد. خطا یا درخواست تأیید، پیگیری خودکار را متوقف می‌کند.</p>

    <h2>سوابق و نتیجه کار</h2>
    <p><label for="yv2-task">کار</label> <select id="yv2-task"><option value="">یک کار انتخاب کنید</option></select> <button type="button" id="yv2-tasks-refresh" class="button">به‌روزرسانی فهرست</button> <button type="button" id="yv2-task-refresh" class="button">دریافت وضعیت کار</button></p>
    <p><button type="button" id="yv2-task-resume" class="button button-primary">ادامه اجرای کار</button> <button type="button" id="yv2-task-pause" class="button">توقف پیگیری خودکار</button> <button type="button" id="yv2-task-cancel" class="button">لغو کار</button></p>
    <p id="yv2-task-status" role="status" aria-live="polite"></p>
    <div id="yv2-task-error" role="alert"></div>
    <p>خروجی</p><pre id="yv2-task-output"></pre>
    <details><summary>جزئیات کار و گزارش مصرف</summary><pre id="yv2-task-data" dir="ltr"></pre></details>
    <div id="yv2-receipts"></div>

    <h2>تأیید تغییرات</h2>
    <p>تأیید هر درخواست، همان تغییر پیش‌نمایش‌شده را بلافاصله اجرا می‌کند. پیش‌نمایش و هش زیر از سرور دریافت می‌شوند.</p>
    <p><button type="button" id="yv2-approvals-refresh" class="button">به‌روزرسانی درخواست‌ها</button></p>
    <div id="yv2-approvals"></div>

    <h2>مصرف و خروجی</h2>
    <p><button type="button" id="yv2-usage-refresh" class="button">به‌روزرسانی مصرف</button> <button type="button" id="yv2-export-json" class="button">دریافت JSON</button> <button type="button" id="yv2-export-csv" class="button">دریافت CSV</button></p>
    <p class="description">مقدار نامعلوم به معنی صفر نیست. قیمت، مصرف یا هزینه تأییدنشده با «نامعلوم» نمایش داده می‌شود.</p>
    <pre id="yv2-usage" dir="ltr"></pre>
    <noscript><p>برای استفاده از مدیریت کارها JavaScript را فعال کنید.</p></noscript>
</div>
