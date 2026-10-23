(() => {
    'use strict';
    const app = document.getElementById('yv2-app');
    if (!app) return;
    const $ = id => document.getElementById('yv2-' + id);
    const state = { config: { models: {} }, conversations: [], templates: [], tasks: [], approvals: [], task: null, timer: null, epoch: 0, auto: false, draft: null, errors: [], busy: new Set() };
    const terminal = new Set(['completed', 'failed', 'cancelled', 'needs_review']);
    const unknown = 'نامعلوم';
    const has = value => value !== null && value !== undefined;
    const raw = value => has(value) ? (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) : unknown;
    const displayJSON = value => JSON.stringify(value, (_key, item) => item === null ? unknown : item, 2) ?? unknown;
    const data = record => record && typeof record.data === 'object' && record.data !== null ? record.data : {};
    const idOf = record => String(record?.id ?? '');
    const errorText = error => error instanceof Error ? error.message : raw(error);
    const notice = message => { $('notice').textContent = message; };
    function fail(error) {
        const message = errorText(error);
        if (!state.errors.includes(message)) state.errors.push(message);
        $('errors').textContent = state.errors.join('\n');
        $('errors').hidden = false;
        $('dismiss-errors').hidden = false;
    }
    function element(tag, text) {
        const node = document.createElement(tag);
        if (has(text)) node.textContent = String(text);
        return node;
    }
    function action(label, callback) {
        const button = element('button', label);
        button.type = 'button';
        button.className = 'button';
        button.addEventListener('click', callback);
        return button;
    }
    function url(path, query = {}) {
        const target = new URL(window.YAgentUI.rest, window.location.href);
        if (target.searchParams.has('rest_route')) {
            target.searchParams.set('rest_route', target.searchParams.get('rest_route').replace(/\/+$/, '') + '/v2/' + path);
        } else {
            target.pathname = target.pathname.replace(/\/+$/, '') + '/v2/' + path;
        }
        Object.entries(query).forEach(([key, value]) => target.searchParams.set(key, String(value)));
        return target.href;
    }
    async function api(path, method = 'GET', body, query) {
        const headers = { 'X-WP-Nonce': window.YAgentUI.nonce, 'Accept': 'application/json' };
        const options = { method, credentials: 'same-origin', headers, cache: 'no-store' };
        if (method !== 'GET') {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body ?? {});
        }
        const response = await fetch(url(path, query), options);
        let result;
        try { result = await response.json(); } catch (_error) { throw new Error('پاسخ JSON معتبر دریافت نشد (HTTP ' + response.status + ').'); }
        if (!response.ok) throw new Error(result?.message || ('خطای HTTP ' + response.status));
        return result;
    }
    async function guard(key, controls, work) {
        if (state.busy.has(key)) return;
        state.busy.add(key);
        const nodes = controls.map(control => typeof control === 'string' ? $(control) : control).filter(Boolean);
        nodes.forEach(node => { node.disabled = true; });
        try { return await work(); } catch (error) { fail(error); return undefined; }
        finally {
            state.busy.delete(key);
            nodes.forEach(node => { node.disabled = false; });
            updateTaskButtons();
        }
    }
    function items(response) {
        if (!response || !Array.isArray(response.items)) throw new Error('فهرست دریافتی معتبر نیست.');
        return response.items;
    }
    function populate(select, records, empty, selected = select.value) {
        select.replaceChildren(new Option(empty, ''));
        records.forEach(record => {
            const value = data(record);
            const title = value.title || value.prompt || value.status || record.id;
            const suffix = value.status ? ' [' + value.status + ']' : '';
            select.add(new Option(String(title).slice(0, 90) + suffix + ' — ' + record.id, idOf(record)));
        });
        if (records.some(record => idOf(record) === selected)) select.value = selected;
    }
    function selectedConversation() { return $('conversation').value; }
    function selectedTask() { return idOf(state.task); }
    function requireSelected(id, description) {
        if (!id) throw new Error(description);
        return encodeURIComponent(id);
    }
    function requestId() {
        if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 15) | 64;
        bytes[8] = (bytes[8] & 63) | 128;
        const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
    }
    function profiles() {
        const selected = $('profile').value;
        $('profile').replaceChildren(new Option('مسیریابی خودکار', ''));
        Object.entries(state.config.models || {}).forEach(([id, model]) => $('profile').add(new Option(id + ' — ' + (model.model || unknown), id)));
        if (Object.prototype.hasOwnProperty.call(state.config.models || {}, selected)) $('profile').value = selected;
        thinking();
    }
    function thinking() {
        const previous = $('thinking').value;
        const profile = state.config.models?.[$('profile').value];
        $('thinking').replaceChildren(new Option('auto', 'auto'));
        Object.keys(profile?.thinking_levels || {}).filter(level => level !== 'auto').forEach(level => $('thinking').add(new Option(level, level)));
        if (Array.from($('thinking').options).some(option => option.value === previous)) $('thinking').value = previous;
    }
    async function loadConfig() {
        const config = await api('config');
        if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('تنظیمات دریافتی معتبر نیست.');
        state.config = config;
        $('config').value = JSON.stringify(config, null, 2);
        profiles();
    }
    async function loadConversations(selected) {
        state.conversations = items(await api('conversations'));
        populate($('conversation'), state.conversations, 'گفت‌وگوی تازه هنگام ایجاد کار', selected);
    }
    async function showConversation() {
        const id = selectedConversation();
        if (!id) { $('conversation-data').textContent = ''; $('conversation-title').value = ''; return; }
        const record = await api('conversations/' + encodeURIComponent(id));
        if (selectedConversation() !== id) return;
        $('conversation-title').value = data(record).title || '';
        $('conversation-data').textContent = displayJSON(record);
    }
    async function loadTemplates(selected) {
        state.templates = items(await api('templates'));
        populate($('template'), state.templates, 'قالب تازه', selected);
    }
    function showTemplate() {
        const record = state.templates.find(item => idOf(item) === $('template').value);
        $('template-title').value = data(record).title || '';
        $('template-prompt').value = data(record).prompt || '';
    }
    async function loadTasks(selected) {
        state.tasks = items(await api('tasks'));
        populate($('task'), state.tasks, 'یک کار انتخاب کنید', selected);
    }
    function pause() {
        state.auto = false;
        state.epoch++;
        clearTimeout(state.timer);
        state.timer = null;
        updateTaskButtons();
    }
    function updateTaskButtons() {
        const value = data(state.task), active = !!selectedTask(), running = state.busy.has('step') || state.busy.has('task-create') || state.busy.has('task-cancel') || state.busy.has('task-read');
        $('task-resume').disabled = !active || running || (terminal.has(value.status) && !value.history_sync_error);
        $('task-cancel').disabled = !active || running || terminal.has(value.status);
        $('task-refresh').disabled = !active || running;
        $('task-pause').disabled = !state.auto;
        $('task').disabled = running;
    }
    function nextDelay(value) {
        if (!value.retry_at) return 1000;
        const numeric = Number(value.retry_at);
        const timestamp = Number.isFinite(numeric) ? (numeric < 1e12 ? numeric * 1000 : numeric) : Date.parse(value.retry_at);
        return Number.isFinite(timestamp) ? Math.max(1000, timestamp - Date.now()) : 1000;
    }
    function shouldPause(value) {
        return terminal.has(value.status) || value.status === 'awaiting_approval' || !!value.error || !!value.history_sync_error;
    }
    function schedule() {
        clearTimeout(state.timer);
        const value = data(state.task);
        if (!state.auto || shouldPause(value)) {
            state.auto = false;
            updateTaskButtons();
            return;
        }
        const epoch = state.epoch;
        state.timer = setTimeout(() => { if (state.auto && state.epoch === epoch) void stepTask(); }, Math.min(nextDelay(value), 2147483647));
        updateTaskButtons();
    }
    function renderTask(record) {
        state.task = record;
        const value = data(record);
        const status = value.status || unknown;
        const tracking = state.auto && !shouldPause(value) ? ' — پیگیری خودکار فعال' : ' — پیگیری خودکار متوقف';
        $('task-status').textContent = 'وضعیت: ' + status + ' | مرحله: ' + (value.phase || unknown) + tracking + (value.retry_at ? ' | زمان تلاش بعدی: ' + raw(value.retry_at) : '');
        const errors = [];
        if (value.error) errors.push('خطای کار: ' + raw(value.error));
        if (value.history_sync_error) errors.push('خطای ذخیره تاریخچه: ' + raw(value.history_sync_error) + '\nبرای تلاش دوباره، ادامه اجرای کار را انتخاب کنید.');
        $('task-error').textContent = errors.join('\n');
        if (errors.length) fail(errors.join('\n'));
        $('task-output').textContent = raw(value.output);
        $('task-data').textContent = displayJSON(record);
        renderReceipts(Array.isArray(value.results) ? value.results : []);
        updateTaskButtons();
    }
    function renderReceipts(receipts) {
        const host = $('receipts');
        host.replaceChildren();
        if (!receipts.length) return;
        host.append(element('h3', 'رسید اجرای تغییرات'));
        receipts.forEach(receipt => {
            const section = element('div');
            section.dataset.yv2Record = 'receipt';
            section.append(element('pre', displayJSON(receipt)));
            if (receipt.receipt_id && receipt.status === 'executed') {
                const rollback = action('بازگردانی این تغییر', () => {
                    if (!window.confirm('این تغییر با استفاده از نسخه پیشین ثبت‌شده بازگردانی شود؟')) return;
                    void guard('rollback-' + receipt.receipt_id, [rollback], async () => {
                        const result = await api('receipts/' + encodeURIComponent(receipt.receipt_id) + '/rollback', 'POST', { confirm: true });
                        section.append(element('pre', displayJSON(result)));
                        rollback.disabled = true;
                        rollback.dataset.yv2Done = 'true';
                        notice('پاسخ بازگردانی دریافت شد.');
                        await refreshCurrentTask();
                        await loadUsage();
                    }).then(() => { if (rollback.dataset.yv2Done) rollback.disabled = true; });
                });
                section.append(rollback);
            }
            host.append(section);
        });
    }
    async function refreshCurrentTask() {
        const id = selectedTask();
        if (!id) return;
        const record = await api('tasks/' + encodeURIComponent(id));
        if (selectedTask() === id) renderTask(record);
    }
    async function openTask(id) {
        pause();
        if (!id) {
            state.task = null;
            $('task-status').textContent = '';
            $('task-output').textContent = '';
            $('task-error').textContent = '';
            $('task-data').textContent = '';
            $('receipts').replaceChildren();
            updateTaskButtons();
            return;
        }
        const epoch = state.epoch;
        const record = await api('tasks/' + encodeURIComponent(id));
        if (epoch !== state.epoch) return;
        renderTask(record);
    }
    async function stepTask() {
        if (!selectedTask() || state.busy.has('step')) return;
        const id = selectedTask(), epoch = state.epoch;
        await guard('step', ['task-resume', 'task-cancel', 'task-refresh', 'task'], async () => {
            try {
                const record = await api('tasks/' + encodeURIComponent(id) + '/step', 'POST', {});
                if (state.epoch !== epoch || selectedTask() !== id) return;
                renderTask(record);
                await Promise.all([loadTasks(id), loadApprovals(), loadUsage()]);
                schedule();
            } catch (error) { pause(); throw error; }
        });
    }
    async function resumeTask() {
        pause();
        if (!selectedTask()) return;
        state.auto = true;
        const delay = nextDelay(data(state.task));
        if (delay > 1000) {
            const epoch = state.epoch;
            state.timer = setTimeout(() => { if (state.auto && state.epoch === epoch) void stepTask(); }, Math.min(delay, 2147483647));
            notice('ادامه اجرا برای زمان تلاش بعدی زمان‌بندی شد.');
            updateTaskButtons();
        } else await stepTask();
    }
    async function loadApprovals() {
        state.approvals = items(await api('approvals'));
        renderApprovals();
    }
    function renderApprovals() {
        const host = $('approvals');
        host.replaceChildren();
        if (!state.approvals.length) { host.append(element('p', 'درخواستی ثبت نشده است.')); return; }
        state.approvals.forEach(record => {
            const value = data(record), section = element('div');
            section.dataset.yv2Record = 'approval';
            section.append(element('h3', (value.tool || unknown) + ' — ' + (value.status || unknown)));
            section.append(element('p', 'شناسه: ' + idOf(record) + ' | کار: ' + (value.task_id || unknown)));
            const timestamp = Number(value.expires_at);
            section.append(element('p', 'انقضا: ' + (Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000).toLocaleString('fa-IR') : unknown)));
            section.append(element('p', 'پیش‌نمایش دریافتی از سرور:'));
            section.append(element('pre', displayJSON(value.preview)));
            section.append(element('p', 'هش طرح: ' + (value.plan_hash || unknown)));
            if (value.result) section.append(element('pre', displayJSON(value.result)));
            if (value.error) section.append(element('pre', raw(value.error)));
            if (value.status === 'pending' && typeof value.plan_hash === 'string' && value.plan_hash) {
                const buttons = [];
                [['approve', 'تأیید و اجرای فوری تغییر'], ['reject', 'رد درخواست'], ['cancel', 'لغو درخواست']].forEach(([decision, title]) => {
                    const button = action(title, () => void guard('decision-' + record.id, buttons, async () => {
                        await api('approvals/' + encodeURIComponent(record.id) + '/decision', 'POST', { decision, plan_hash: value.plan_hash });
                        notice('پاسخ تصمیم ثبت شد.');
                        await Promise.all([loadApprovals(), loadTasks(), loadUsage()]);
                        if (value.task_id) {
                            await openTask(String(value.task_id));
                            $('task').value = String(value.task_id);
                            await resumeTask();
                        }
                    }));
                    buttons.push(button);
                    section.append(button, document.createTextNode(' '));
                });
            }
            host.append(section);
        });
    }
    async function loadUsage() { $('usage').textContent = displayJSON(await api('usage')); }
    async function download(format) {
        const result = await api('export', 'GET', undefined, { format });
        if (!result || typeof result.content !== 'string' || typeof result.filename !== 'string') throw new Error('خروجی دریافتی معتبر نیست.');
        const blob = new Blob([result.content], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8' });
        const objectURL = URL.createObjectURL(blob), anchor = element('a');
        anchor.href = objectURL;
        anchor.download = result.filename;
        app.append(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    }
    function click(id, key, work) { $(id).addEventListener('click', () => void guard(key || id, [id], work)); }
    $('dismiss-errors').addEventListener('click', () => { state.errors = []; $('errors').textContent = ''; $('errors').hidden = true; $('dismiss-errors').hidden = true; });
    $('profile').addEventListener('change', thinking);
    $('config-form').addEventListener('submit', event => {
        event.preventDefault();
        void guard('config', ['config-save', 'config-refresh'], async () => {
            const config = JSON.parse($('config').value);
            if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('تنظیمات باید یک شیء JSON باشد.');
            state.config = await api('config', 'POST', config);
            $('config').value = JSON.stringify(state.config, null, 2);
            profiles();
            notice('تنظیمات ذخیره شد.');
        });
    });
    click('config-refresh', 'config', loadConfig);
    click('health', 'health', async () => {
        const profile = $('profile').value;
        if (!profile) throw new Error('برای آزمون اتصال، یک مدل را انتخاب کنید.');
        $('health-result').textContent = displayJSON(await api('health', 'POST', { profile_id: profile, thinking: $('thinking').value }));
        await loadUsage();
    });
    click('conversations-refresh', 'conversations', async () => { await loadConversations(); await showConversation(); });
    $('conversation').addEventListener('change', () => void guard('conversation-read', [], showConversation));
    $('conversation-form').addEventListener('submit', event => {
        event.preventDefault();
        void guard('conversations', ['conversation-create', 'conversation-rename', 'conversation-clear', 'conversation-delete'], async () => {
            const record = await api('conversations', 'POST', { title: $('conversation-title').value });
            await loadConversations(idOf(record));
            await showConversation();
            notice('گفت‌وگو ایجاد شد.');
        });
    });
    click('conversation-rename', 'conversations', async () => {
        const id = requireSelected(selectedConversation(), 'یک گفت‌وگو انتخاب کنید.');
        await api('conversations/' + id, 'POST', { title: $('conversation-title').value });
        await loadConversations(); await showConversation(); notice('عنوان گفت‌وگو ذخیره شد.');
    });
    click('conversation-clear', 'conversations', async () => {
        const id = requireSelected(selectedConversation(), 'یک گفت‌وگو انتخاب کنید.');
        if (!window.confirm('تاریخچه این گفت‌وگو پاک شود؟')) return;
        await api('conversations/' + id + '/clear', 'POST', {});
        await showConversation(); notice('تاریخچه پاک شد.');
    });
    click('conversation-delete', 'conversations', async () => {
        const id = requireSelected(selectedConversation(), 'یک گفت‌وگو انتخاب کنید.');
        if (!window.confirm('این گفت‌وگو حذف شود؟')) return;
        await api('conversations/' + id, 'DELETE', {});
        await loadConversations(''); await showConversation(); notice('گفت‌وگو حذف شد.');
    });
    click('templates-refresh', 'templates', async () => { await loadTemplates(); showTemplate(); });
    $('template').addEventListener('change', showTemplate);
    $('template-form').addEventListener('submit', event => {
        event.preventDefault();
        void guard('templates', ['template-save', 'template-delete', 'template-new'], async () => {
            const id = $('template').value;
            const record = await api('templates' + (id ? '/' + encodeURIComponent(id) : ''), 'POST', { title: $('template-title').value, prompt: $('template-prompt').value });
            await loadTemplates(idOf(record)); showTemplate(); notice('قالب ذخیره شد.');
        });
    });
    click('template-new', 'templates', async () => { $('template').value = ''; showTemplate(); });
    click('template-use', 'template-use', async () => { $('prompt').value = $('template-prompt').value; $('prompt').focus(); notice('متن قالب در پیام کپی شد.'); });
    click('template-delete', 'templates', async () => {
        const id = requireSelected($('template').value, 'یک قالب انتخاب کنید.');
        if (!window.confirm('این قالب حذف شود؟')) return;
        await api('templates/' + id, 'DELETE', {});
        await loadTemplates(''); showTemplate(); notice('قالب حذف شد.');
    });
    $('task-form').addEventListener('submit', event => {
        event.preventDefault();
        void guard('task-create', ['task-create', 'task-new', 'task-resume', 'task-cancel', 'task'], async () => {
            const payload = { prompt: $('prompt').value, mode: $('mode').value, thinking: $('thinking').value, read_only: $('read-only').checked, allow_powerful: $('allow-powerful').checked };
            if (selectedConversation()) payload.conversation_id = selectedConversation();
            if ($('profile').value) payload.profile_id = $('profile').value;
            const signature = JSON.stringify(payload);
            if (!state.draft || state.draft.signature !== signature) state.draft = { signature, id: requestId() };
            payload.request_id = state.draft.id;
            pause();
            const record = await api('tasks', 'POST', payload);
            renderTask(record);
            await Promise.all([loadTasks(idOf(record)), loadConversations()]);
            notice('کار ثبت شد.');
            await resumeTask();
        });
    });
    click('task-new', 'task-new', async () => { state.draft = null; $('prompt').value = ''; $('prompt').focus(); notice('پیام تازه آماده است.'); });
    click('tasks-refresh', 'tasks-read', async () => { await loadTasks(); });
    $('task').addEventListener('change', () => void guard('task-read', ['task-refresh', 'task'], async () => openTask($('task').value)));
    click('task-refresh', 'task-read', refreshCurrentTask);
    $('task-resume').addEventListener('click', () => { void resumeTask().catch(fail); });
    $('task-pause').addEventListener('click', () => { pause(); if (state.task) renderTask(state.task); notice('پیگیری خودکار متوقف شد. درخواست در حال اجرا، در صورت وجود، ممکن است پایان یابد.'); });
    click('task-cancel', 'task-cancel', async () => {
        const id = requireSelected(selectedTask(), 'یک کار انتخاب کنید.');
        pause();
        renderTask(await api('tasks/' + id + '/cancel', 'POST', {}));
        await loadTasks(selectedTask()); notice('پاسخ لغو کار دریافت شد.');
    });
    click('approvals-refresh', 'approvals-read', loadApprovals);
    click('usage-refresh', 'usage-read', loadUsage);
    click('export-json', 'export', async () => download('json'));
    click('export-csv', 'export', async () => download('csv'));
    window.addEventListener('pagehide', pause);
    updateTaskButtons();
    void Promise.allSettled([loadConfig(), loadConversations(), loadTemplates(), loadTasks(), loadApprovals(), loadUsage()]).then(results => {
        results.forEach(result => { if (result.status === 'rejected') fail(result.reason); });
        notice('دریافت اطلاعات پایان یافت. برای اجرای کار، دکمه ایجاد یا ادامه اجرا را انتخاب کنید.');
    });
})();
