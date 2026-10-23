/** WordPress transport and translation of durable records to the supplied UI. */
const TERMINAL = new Set(['completed', 'failed', 'cancelled', 'needs_review']);
const FAILURE = new Set(['failed', 'needs_review', 'failed_deactivated']);
const TOOL_NAMES = { site_info: 'اطلاعات سایت', list_plugins: 'فهرست افزونه‌ها', list_content: 'فهرست محتوا', read_page: 'خواندن برگه', manage_page: 'مدیریت برگه', manage_plugin: 'مدیریت افزونه', build_plugin: 'ساخت افزونه', create_draft: 'ساخت پیش‌نویس', update_draft: 'ویرایش پیش‌نویس', elementor_schema: 'ابزارک‌های المنتور' };
const stamp = value => typeof value === 'number' ? value * 1000 : Date.parse(String(value || '').replace(' ', 'T').replace(/(?<!Z|[+-]\d\d:\d\d)$/, 'Z')) || Date.now();
const messageOf = value => typeof value === 'string' ? value : value?.message || '';
const detail = value => JSON.stringify(value, null, 2);
export function displayMessageText(content) {
  return content.startsWith('بازخورد روی محتوای پیشنهادی «') ? content.replace(/\nمختصات: \{[^}]*\}/g, '') : content;
}
export function restURL(base, path, query = {}) {
  const url = new URL(base, globalThis.location?.href || 'http://localhost/');
  if (url.searchParams.has('rest_route')) url.searchParams.set('rest_route', url.searchParams.get('rest_route').replace(/\/+$/, '') + '/' + path.replace(/^\/+/, ''));
  else url.pathname = url.pathname.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, String(value));
  return url.href;
}
export function createRestClient(options) {
  let nonce = options.nonce;
  return async (path, method = 'GET', body, query) => {
    const headers = { 'X-WP-Nonce': nonce, Accept: 'application/json' };
    const init = { method, credentials: 'same-origin', cache: 'no-store', headers };
    if (body instanceof FormData) init.body = body;
    else if (method !== 'GET') { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body ?? {}); }
    let response;
    try { response = await (options.fetch || globalThis.fetch)(restURL(options.rest, path, query), init); }
    catch { throw new Error(method === 'GET' ? 'ارتباط با سایت برقرار نشد. اتصال اینترنت را بررسی کنید.' : 'ارتباط قطع شد؛ ممکن است درخواست ثبت شده باشد. ابتدا وضعیت گفتگو را تازه‌سازی کنید.'); }
    const refreshed = response.headers.get('X-WP-Nonce');
    if (refreshed) nonce = refreshed;
    let data;
    try { data = await response.json(); } catch { throw new Error('پاسخ سایت معتبر نیست. گزارش خطای PHP یا محدودیت هاست را بررسی کنید.'); }
    if (!response.ok) {
      const error = new Error(data?.code === 'rest_cookie_invalid_nonce' || response.status === 401 ? 'نشست شما منقضی شده است. صفحهٔ وردپرس را دوباره بارگذاری کنید.' : data?.message || `خطای سرور (${response.status})`);
      error.code = data?.code; error.status = response.status; throw error;
    }
    return data;
  };
}
export function mapTask(record, live = false) {
  const d = record.data;
  const finished = TERMINAL.has(d.status);
  const status = d.status === 'completed' ? 'done' : FAILURE.has(d.status) ? 'error' : d.status === 'cancelled' ? 'stopped' : d.status === 'awaiting_approval' ? 'waiting_approval' : live ? 'running' : 'queued';
  const steps = [{ id: record.id + '-context', title: 'آماده‌سازی زمینهٔ گفتگو', status: d.phase === 'context' ? (finished ? 'error' : live ? 'active' : 'pending') : 'done' }];
  if (d.model_calls > 0 || d.phase === 'model' || d.phase === 'model_inflight') steps.push({ id: record.id + '-model', title: `پردازش مدل${d.model_calls ? ' · ' + d.model_calls + ' فراخوانی' : ''}`, status: finished ? (status === 'error' ? 'error' : status === 'stopped' ? 'skipped' : 'done') : d.phase === 'model' || d.phase === 'model_inflight' ? (live ? 'active' : 'pending') : 'done', summary: d.recovery?.message });
  (d.results || []).forEach((result, index) => {
    const value = result.result || result;
    const failed = FAILURE.has(result.status) || FAILURE.has(value.status) || Boolean(result.error);
    steps.push({ id: record.id + '-result-' + index, title: TOOL_NAMES[result.tool] || result.tool || 'نتیجهٔ ابزار', status: failed ? 'error' : 'done', summary: messageOf(result.error) || value.message || value.deployment?.events?.at(-1)?.message || 'نتیجهٔ ابزار در سرور ثبت شد.', detail: { logs: [detail(result)] } });
  });
  if (!finished && d.phase === 'tools') {
    const call = d.pending_tools?.[d.tool_cursor || 0];
    if (call) steps.push({ id: record.id + '-current', title: TOOL_NAMES[call.name] || call.name, status: status === 'waiting_approval' ? 'waiting_approval' : live ? 'active' : 'pending', summary: d.deployment_progress?.events?.at(-1)?.message, detail: { logs: [detail(call.arguments)] } });
  }
  return { id: record.id, conversationId: d.conversation_id, title: d.prompt?.slice(0, 90) || 'کار', status, paused: !finished && !live && d.status !== 'awaiting_approval', startedAt: stamp(d.started_at || record.created_at), endedAt: finished ? stamp(record.updated_at) : undefined, summary: messageOf(d.error) || ({ done: 'کار تمام شد.', stopped: 'کار لغو شد.', error: 'کار نیاز به بررسی دارد.', waiting_approval: 'ادامهٔ این عملیات به تصمیم شما نیاز دارد.', queued: 'کار ناتمام است؛ برای اجرای آن «ادامهٔ کار» را بزنید.', running: 'در حال اجرای درخواست شما…' })[status], error: messageOf(d.error), steps, rawStatus: d.status };
}
export function createRestAdapter(options = globalThis.YAgentUI) {
  const api = createRestClient(options);
  const listeners = new Set(), conversations = new Map(), records = new Map(), approvals = new Map(), revisions = new Map(), annotations = new Map(), runs = new Map(), deciding = new Set();
  let models = [], config = {}, settings = {};
  // Live requests and history snapshots can complete in either order.
  function remember(map, row) {
    if (!map.has(row.id) || row.version >= map.get(row.id).version) map.set(row.id, row);
    return map.get(row.id);
  }
  const storageKey = `yagent:${encodeURIComponent(options.rest)}:${options.userId}:pins`;
  const storage = options.storage || globalThis.localStorage;
  const readPins = () => { try { return JSON.parse(storage?.getItem(storageKey) || '[]'); } catch { return []; } };
  const emit = event => listeners.forEach(listener => listener(event));
  function conversation(record, reason = 'updated', notify = false) {
    const previous = conversations.get(record.id);
    if (previous && previous.serverVersion > record.version) return previous;
    const d = record.data;
    const item = { ...conversations.get(record.id), id: record.id, serverVersion: record.version, title: d.title, pinned: readPins().includes(record.id), createdAt: stamp(record.created_at), updatedAt: stamp(record.updated_at) };
    conversations.set(item.id, item);
    if (notify) emit({ type: 'conversation:changed', conversationId: item.id, conversation: item, reason });
    return item;
  }
  function addPreview(approval, conversationId) {
    const d = approval.data, args = d.args || {}, before = d.preview?.before?.post || d.preview?.before || {};
    const html = args.content ?? d.preview?.after?.post_content;
    if (typeof html !== 'string' || !html.trim() || !['manage_page', 'create_draft', 'update_draft'].includes(d.tool)) return;
    const pageId = args.post_id ? 'page-' + args.post_id : 'proposal-' + approval.id;
    const id = 'revision-' + approval.id;
    const revision = { id, pageId, pageTitle: args.title || before.post_title || 'پیش‌نمایش محتوا', revision: 1, status: d.status === 'executed' && (args.status === 'publish' || args.action === 'publish') ? 'published' : 'draft', createdAt: stamp(approval.created_at), html, summary: 'محتوای پیشنهادی عملیات؛ نمایش قالب و ابزارک‌ها در سایت ممکن است متفاوت باشد.', elementIds: [], approvalId: approval.id };
    revisions.set(id, revision);
    const c = conversations.get(conversationId);
    if (c) { c.previewPageId = pageId; emit({ type: 'conversation:changed', conversationId, conversation: { ...c }, reason: 'updated' }); }
    emit({ type: 'preview:ready', conversationId, revision });
  }
  function mappedApproval(record, conversationId) {
    const d = record.data, a = d.args || {}, p = d.preview || {};
    const status = ({ pending: 'pending', approved: 'running', executing: 'running', executed: 'succeeded', rejected: 'rejected', cancelled: 'rejected', expired: 'failed', failed: 'failed', needs_review: 'failed' })[d.status] || 'failed';
    return { id: record.id, conversationId, taskId: d.task_id, kind: d.tool === 'manage_plugin' ? (a.action === 'delete' ? 'delete_plugin' : 'install_plugin') : a.action === 'publish' || a.status === 'publish' ? 'publish_page' : 'update_content', title: TOOL_NAMES[d.tool] || d.tool, target: a.title || a.plugin || p.before?.post?.post_title || p.before?.post_title || String(a.post_id || 'محتوای جدید'), summary: `عملیات: ${a.action || d.tool}؛ تأیید، همین تغییر ثبت‌شده در سرور را اجرا می‌کند.`, changes: Object.entries(a).filter(([key]) => !['content', 'elementor_data', 'elementor_settings'].includes(key)).map(([key, value]) => `${key}: ${String(value)}`), status, createdAt: stamp(record.created_at), planHash: d.plan_hash, preview: p, error: messageOf(d.error) || (status === 'failed' ? 'این تأیید دیگر قابل اجرا نیست؛ وضعیت کار را بررسی کنید.' : undefined), result: status === 'succeeded' ? { message: 'عملیات تأییدشده در سرور ثبت شد.', technical: [{ label: 'شناسهٔ عملیات', value: record.id }] } : undefined };
  }
  function resultCards(record) {
    return (record.data.results || []).map((receipt, index) => {
      const value = receipt.result || receipt, failed = FAILURE.has(receipt.status) || FAILURE.has(value.status) || Boolean(receipt.error);
      // Only a receipt that produced a page proposal gets a preview button: the
      // task's revision belongs to one page, not to every receipt of that task.
      const preview = ['manage_page', 'create_draft', 'update_draft'].includes(receipt.tool) ? [...revisions.values()].find(r => approvals.get(r.approvalId)?.data.task_id === record.id) : undefined;
      return { id: record.id + '-result-' + index, conversationId: record.data.conversation_id, title: TOOL_NAMES[receipt.tool] || receipt.tool || 'نتیجهٔ ابزار', status: failed ? 'error' : 'success', message: messageOf(receipt.error) || value.message || value.deployment?.events?.at(-1)?.message || (value.artifact_id ? 'بستهٔ افزونه برای دانلود آماده است.' : 'نتیجهٔ این ابزار در سرور ثبت شد.'), link: safeLink(value.edit_url || value.url), linkLabel: value.edit_url ? 'ویرایش در وردپرس' : 'مشاهده در سایت', artifactId: value.artifact_id, previewRevisionId: preview?.id, createdAt: stamp(record.updated_at), technical: [{ label: 'رسید', value: receipt.receipt_id || '—' }, { label: 'خروجی سرور', value: detail(receipt) }] };
    });
  }
  function safeLink(value) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; } }
  function messages(record, tasks, taskApprovals, results) {
    const list = (record.data.messages || []).map(m => ({ id: m.id, conversationId: record.id, role: m.role, kind: 'text', text: displayMessageText(m.content), createdAt: stamp(m.created_at), status: m.status === 'failed' ? 'error' : m.status === 'cancelled' ? 'stopped' : 'complete', attachments: (m.attachments || []).map(id => ({ id, name: 'فایل پیوست', status: 'ready', size: 0, mime: '' })) }));
    for (const t of tasks) {
      const at = list.findIndex(m => m.id === t.id + '_user');
      const extras = [{ id: t.id + '-activity', conversationId: record.id, role: 'assistant', kind: 'activity', taskId: t.id, status: TERMINAL.has(t.data.status) ? 'complete' : 'streaming', createdAt: stamp(t.created_at) }];
      taskApprovals.filter(a => a.taskId === t.id).forEach(a => extras.push({ id: a.id + '-message', conversationId: record.id, role: 'assistant', kind: 'approval', approvalId: a.id, status: 'complete', createdAt: a.createdAt }));
      results.filter(r => r.id.startsWith(t.id + '-result-')).forEach(r => extras.push({ id: r.id + '-message', conversationId: record.id, role: 'assistant', kind: 'result', resultId: r.id, status: r.status === 'error' ? 'error' : 'complete', createdAt: r.createdAt }));
      if (at >= 0) list.splice(at + 1, 0, ...extras); else list.push(...extras);
    }
    return list;
  }
  async function syncConversation(id, supplied) {
    const record = supplied || await api('v2/conversations/' + encodeURIComponent(id));
    conversation(record, 'updated', true);
    const own = [...records.values()].filter(r => r.data.conversation_id === id).sort((a, b) => stamp(a.created_at) - stamp(b.created_at));
    const taskIds = new Set(own.map(t => t.id));
    const ownApprovals = [...approvals.values()].filter(a => taskIds.has(a.data.task_id));
    for (const a of ownApprovals) addPreview(a, id);
    const cards = ownApprovals.map(a => mappedApproval(a, id)), results = own.flatMap(resultCards);
    const snapshot = { conversationVersion: record.version, messages: messages(record, own, cards, results), tasks: own.map(r => mapTask(r, runs.has(r.id))), approvals: cards, results, annotations: [...annotations.values()].filter(a => a.conversationId === id) };
    snapshot.tasks.forEach(task => emit({ type: 'task:created', conversationId: id, task }));
    cards.forEach(approval => emit({ type: 'approval:created', conversationId: id, approval }));
    results.forEach(result => emit({ type: 'result:created', conversationId: id, result }));
    emit({ type: 'messages:loaded', conversationId: id, version: record.version, messages: snapshot.messages });
    return snapshot;
  }
  async function ingest(record) {
    remember(records, record);
    for (const id of record.data.approval_ids || []) remember(approvals, await api('v2/approvals/' + encodeURIComponent(id)));
    return syncConversation(record.data.conversation_id);
  }
  async function drive(id) {
    if (runs.has(id)) return;
    const run = { cancelled: false }; runs.set(id, run);
    try {
      while (!run.cancelled) {
        const record = records.get(id);
        if (!record || TERMINAL.has(record.data.status)) break;
        if (record.data.status === 'awaiting_approval' && (record.data.approval_ids || []).some(aid => ['pending', 'approved'].includes(approvals.get(aid)?.data.status))) break;
        const retryAt = Number(record.data.retry_at || 0) * 1000;
        if (retryAt > Date.now()) await new Promise(resolve => setTimeout(resolve, Math.min(retryAt - Date.now(), 60000)));
        if (run.cancelled) break;
        await ingest(await api('v2/tasks/' + encodeURIComponent(id) + '/step', 'POST'));
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } finally {
      runs.delete(id);
      const record = records.get(id);
      if (record) emit({ type: 'task:created', conversationId: record.data.conversation_id, task: mapTask(record) });
    }
  }
  const adapter = {
    capabilities: { voiceInput: false, fileAttachments: true, pagePreview: true, publish: false },
    api,
    workspace: {},
    async listConversations() { const response = await api('v2/conversations'); return response.items.map(r => conversation(r)).sort((a, b) => b.updatedAt - a.updatedAt); },
    async createConversation() { return conversation(await api('v2/conversations', 'POST', { title: 'گفتگوی جدید' }), 'created', true); },
    async renameConversation(id, title) { return conversation(await api('v2/conversations/' + encodeURIComponent(id), 'POST', { title }), 'updated', true); },
    async setConversationPinned(id, pinned) { const pins = new Set(readPins()); pinned ? pins.add(id) : pins.delete(id); try { storage?.setItem(storageKey, JSON.stringify([...pins])); } catch {} const c = conversations.get(id); if (c) { c.pinned = pinned; emit({ type: 'conversation:changed', conversationId: id, conversation: { ...c }, reason: 'updated' }); } },
    async deleteConversation(id) { await api('v2/conversations/' + encodeURIComponent(id), 'DELETE'); const c = conversations.get(id); conversations.delete(id); emit({ type: 'conversation:changed', conversationId: id, conversation: c, reason: 'deleted' }); },
    async listModels() {
      [config, settings] = await Promise.all([api('v2/config'), api('settings')]);
      models = Object.entries(config.models || {}).filter(([, p]) => settings.providers?.[p.provider]?.has_key).map(([id, p]) => ({ id, name: p.model, hint: settings.providers[p.provider]?.label || p.provider, supportsTools: p.supports_tools, provider: p.provider }));
      const active = settings.providers?.[settings.active_provider];
      if (active?.has_key && active.model && !models.some(p => p.provider === settings.active_provider && p.name === active.model)) models.unshift({ id: 'active', name: active.model, hint: active.label, supportsTools: false, provider: settings.active_provider });
      adapter.workspace = { configured: Boolean(active?.has_key && active.model), readOnly: config.read_only, autoInstall: config.auto_install_plugins, provider: active?.label || settings.active_provider };
      return models;
    },
    async getConversationSnapshot(id) {
      const [record, taskList, approvalList] = await Promise.all([api('v2/conversations/' + encodeURIComponent(id)), api('v2/tasks'), api('v2/approvals')]);
      taskList.items.forEach(t => remember(records, t)); approvalList.items.forEach(a => remember(approvals, a));
      // Fetch the active task explicitly even if it falls outside the history window.
      const active = record.data.active_task_id;
      if (active && !records.has(active)) remember(records, await api('v2/tasks/' + encodeURIComponent(active)));
      for (const task of records.values()) if (task.data.conversation_id === id) for (const aid of task.data.approval_ids || []) if (!approvals.has(aid)) remember(approvals, await api('v2/approvals/' + encodeURIComponent(aid)));
      return syncConversation(id, record);
    },
    async uploadAttachment(file) { const body = new FormData(); body.append('file', file); return api('v2/uploads', 'POST', body); },
    async sendMessage(input) {
      const selected = models.find(m => m.id === input.modelId);
      if (!selected) throw new Error('ابتدا سرویس و مدل را در تنظیمات اتصال ذخیره کنید.');
      const body = { prompt: input.text, conversation_id: input.conversationId, attachments: input.attachments.map(a => a.serverId || a.id), request_id: input.requestId || crypto.randomUUID(), mode: input.mode || (selected.supportsTools ? 'agent' : 'chat'), read_only: input.readOnly ?? true, thinking: input.thinking || 'auto', ...(selected.id === 'active' ? { provider: selected.provider } : { profile_id: selected.id }) };
      if (body.mode === 'agent' && !selected.supportsTools) throw new Error('این مدل برای اجرای ابزار تنظیم نشده است؛ حالت گفتگو را انتخاب کنید یا پشتیبانی ابزار را در تنظیمات فعال کنید.');
      let record;
      try { record = await api('v2/tasks', 'POST', body); }
      catch (error) {
        // Recover an uncertain creation by its idempotency key, never a second POST.
        if (!error.status) { try { record = await api('v2/requests/' + body.request_id); } catch {} }
        if (!record) throw error;
      }
      // Creation is already durable. A failed history refresh must not offer a duplicate send.
      remember(records, record);
      try { await ingest(record); } catch { emit({ type: 'task:created', conversationId: record.data.conversation_id, task: mapTask(record) }); }
      const c = conversations.get(input.conversationId);
      if (c?.title === 'گفتگوی جدید') { try { await adapter.renameConversation(c.id, input.text.slice(0, 70)); } catch {} }
      return record.id;
    },
    async runTask(id) { await drive(id); },
    async resumeTask(id) { remember(records, await api('v2/tasks/' + encodeURIComponent(id))); await drive(id); },
    async stopTask(conversationId) {
      const task = [...records.values()].filter(r => r.data.conversation_id === conversationId && !TERMINAL.has(r.data.status)).at(-1);
      if (!task) return;
      const run = runs.get(task.id); if (run) run.cancelled = true;
      await ingest(await api('v2/tasks/' + encodeURIComponent(task.id) + '/cancel', 'POST'));
    },
    async resolveApproval(id, decision) {
      if (deciding.has(id)) return;
      deciding.add(id);
      try {
        const record = await api('v2/approvals/' + encodeURIComponent(id));
        const taskId = record.data.task_id;
        const task = records.get(taskId) || await api('v2/tasks/' + encodeURIComponent(taskId)); remember(records, task);
        const updated = await api('v2/approvals/' + encodeURIComponent(id) + '/decision', 'POST', { decision, plan_hash: record.data.plan_hash });
        remember(approvals, updated); await syncConversation(task.data.conversation_id);
      } finally { deciding.delete(id); }
    },
    async continueAfterApproval(id) { const a = approvals.get(id); if (a) { remember(records, await api('v2/tasks/' + a.data.task_id)); await drive(a.data.task_id); } },
    async getPagePreview(pageId) { return { revisions: [...revisions.values()].filter(r => r.pageId === pageId), annotations: [...annotations.values()].filter(a => a.pageId === pageId) }; },
    async publishRevision() { throw new Error('انتشار از کارت تأیید عملیات در گفتگو انجام می‌شود.'); },
    async sendPageFeedback(input) {
      const text = 'بازخورد روی محتوای پیشنهادی «' + (revisions.get(input.revisionId)?.pageTitle || input.pageId) + '» در نمای ' + input.viewport.device + ' (' + input.viewport.width + 'px):\n' + input.annotations.map((a, i) => `${i + 1}. ${a.elementLabel || a.elementId || 'ناحیهٔ انتخاب‌شده'}: ${a.comment}\nمختصات: ${detail(a.rect)}`).join('\n');
      const taskId = await adapter.sendMessage({ ...input, text, attachments: [], modelId: input.modelId, mode: input.mode, readOnly: input.readOnly, requestId: 'feedback-' + input.annotations[0].id.slice(0, 55) });
      const sent = input.annotations.map(a => ({ ...a, conversationId: input.conversationId, status: 'sent' }));
      sent.forEach(a => annotations.set(a.id, a)); emit({ type: 'annotations:updated', conversationId: input.conversationId, annotations: sent });
      return taskId;
    },
    async resolveAnnotation(id) { const a = annotations.get(id); if (a) { a.status = 'resolved'; emit({ type: 'annotations:updated', conversationId: a.conversationId, annotations: [{ ...a }] }); } },
    async downloadArtifact(id) {
      const file = await api('v2/artifacts/' + encodeURIComponent(id) + '/download');
      const bytes = Uint8Array.from(atob(file.content_base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
      const link = document.createElement('a'); link.href = url; link.download = file.filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
  return adapter;
}
