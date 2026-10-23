import { uid } from '../../lib/utils.js';
import { suggestTitle } from '../../lib/titles.js';
import { createMockWorld } from './fixtures.js';
import { DISCOVERABLE_MODELS, providerOf } from '../../lib/providers.js';
import { validateModelDraft } from '../../lib/modelDraft.js';

/**
 * In-memory service adapter for the standalone demo.
 *
 * It implements the same contract as the WordPress REST adapter
 * (`adapters/rest/restAdapter.js`), so every component above it stays
 * unchanged. Nothing here performs a network request, calls a model or touches
 * a real site: requests are simulated with timers and the data lives in memory
 * (a reload rebuilds the seed world from `fixtures.js`).
 */
const LATENCY = { read: 120, write: 260, discover: 900, test: 750, upload: 420 };
const STEP_DELAY = 1100;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulated work scripts: each step may produce a reply, a result card or an approval. */
function scriptFor(text, mode, readOnly) {
  const value = String(text || '');
  const wantsPlugin = /افزونه|پلاگین/.test(value);
  const wantsAudit = /سرعت|بهینه|بررسی|تحلیل|گزارش/.test(value);
  const toolMode = mode === 'agent' && !readOnly;
  if (wantsPlugin) {
    return [
      { title: 'تحلیل درخواست', summary: 'درخواست روشن است؛ افزونهٔ سبک با شورت‌کد ساخته می‌شود.' },
      { title: 'اطلاعات سایت', summary: 'نسخهٔ وردپرس و قالب خوانده شد.', effect: 'result-site', reply: 'افزونه در حال ساخت است؛ ابتدا وضعیت سایت خوانده شد.' },
      { title: 'ساخت افزونه', summary: 'بستهٔ افزونه آماده و برای دانلود ثبت شد.', effect: 'result-artifact' },
      { title: 'نصب افزونه', summary: 'نصب روی سایت نیازمند تأیید صریح است.', effect: toolMode ? 'approval-install' : 'note-permission' },
    ];
  }
  if (wantsAudit) {
    return [
      { title: 'تحلیل درخواست', summary: 'سه محور بررسی می‌شود: افزونه‌ها، تصاویر و پرس‌وجوها.' },
      { title: 'اطلاعات سایت', summary: 'نسخهٔ وردپرس و قالب خوانده شد.', effect: 'result-site' },
      { title: 'فهرست افزونه‌ها', summary: '۹ افزونهٔ فعال بررسی شد.', effect: 'result-listing' },
      { title: 'جمع‌بندی', summary: 'پیشنهاد بهینه‌سازی آماده شد.', effect: 'reply-audit' },
    ];
  }
  return [
    { title: 'تحلیل درخواست', summary: 'درخواست روشن است و به یک پیشنهاد محتوا نیاز دارد.' },
    { title: 'آماده‌سازی زمینهٔ سایت', summary: 'برگه‌ها و افزونه‌های فعال خوانده شد.' },
    { title: 'فهرست محتوا', summary: 'برگه‌ها و نوشته‌ها فهرست شد.', effect: 'result-listing' },
    { title: 'ساخت پیشنهاد محتوا', summary: 'پیشنهاد HTML آماده شد.', effect: 'revision' },
    { title: 'مدیریت برگه', summary: 'پیشنهاد محتوا برای بررسی ثبت شد.', effect: 'result-page' },
    { title: 'تأیید انتشار برگه', summary: 'انتشار روی سایت نیازمند تأیید صریح است.', effect: toolMode ? 'approval-publish' : 'note-permission' },
  ];
}

const REPLY_PROPOSAL = 'پیشنهاد محتوا آماده شد. سه بخش معرفی، مزیت‌ها و تماس ساخته شد؛ پیش‌نمایش را ببینید و اگر درست است انتشار را تأیید کنید.';
const REPLY_AUDIT = 'سه افزونه زمان بارگذاری را بالا می‌برند: کش تصاویر، اسلایدر سنگین و افزونهٔ آماری.\n\n| افزونه | اثر تقریبی |\n| --- | --- |\n| اسلایدر سنگین | ۱٫۲ ثانیه |\n| کش تصاویر | ۰٫۶ ثانیه |\n| افزونهٔ آماری | ۰٫۴ ثانیه |';
const REPLY_SITE = 'افزونه سبک است و در سه مرحله ساخته می‌شود: بسته‌سازی، بررسی سازگاری و فعال‌سازی.';

export function createMockAdapter() {
  const world = createMockWorld();
  const listeners = new Set();
  const runs = new Map();
  const scripts = new Map();
  let selectedModelId = world.settings.activeModelId;

  const emit = (event) => listeners.forEach((listener) => listener(event));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const conversationById = (id) => world.conversations.find((item) => item.id === id);
  const modelById = (id) => world.models.find((item) => item.id === id);

  function messagesOf(conversationId) {
    return (world.messagesByConversation[conversationId] ?? []).slice().sort((a, b) => a.createdAt - b.createdAt);
  }
  function tasksOf(conversationId) {
    return Object.values(world.tasks).filter((task) => task.conversationId === conversationId);
  }
  function approvalsOf(conversationId) {
    return Object.values(world.approvals).filter((approval) => approval.conversationId === conversationId);
  }
  function resultsOf(conversationId) {
    return Object.values(world.results).filter((result) => result.conversationId === conversationId);
  }
  function annotationsOf(conversationId) {
    return Object.values(world.annotations).filter((annotation) => annotation.conversationId === conversationId);
  }

  function addMessage(conversationId, message) {
    const item = { createdAt: Date.now(), status: 'complete', role: 'assistant', kind: 'text', ...message };
    (world.messagesByConversation[conversationId] ??= []).push(item);
    emit({ type: 'message:created', conversationId, message: clone(item) });
    return item;
  }

  function addResult(conversationId, result) {
    const item = { status: 'success', createdAt: Date.now(), technical: [], ...result };
    world.results[item.id] = item;
    emit({ type: 'result:created', conversationId, result: clone(item) });
    addMessage(conversationId, { id: `${item.id}-message`, kind: 'result', resultId: item.id, status: item.status === 'error' ? 'error' : 'complete' });
    return item;
  }

  function addApproval(conversationId, taskId, approval) {
    const item = { status: 'pending', createdAt: Date.now(), ...approval };
    world.approvals[item.id] = item;
    emit({ type: 'approval:created', conversationId, approval: clone(item) });
    addMessage(conversationId, { id: `${item.id}-message`, kind: 'approval', approvalId: item.id });
    return item;
  }

  function touchConversation(conversation, patch = {}, reason = 'updated') {
    Object.assign(conversation, patch, { updatedAt: Date.now(), serverVersion: conversation.serverVersion + 1 });
    emit({ type: 'conversation:changed', conversationId: conversation.id, conversation: clone(conversation), reason });
    return conversation;
  }

  function setStep(task, id, status, summary) {
    const step = task.steps.find((item) => item.id === id);
    if (!step)
      return;
    step.status = status;
    if (summary)
      step.summary = summary;
    emit({ type: 'task:step', taskId: task.id, step: clone(step) });
  }

  function setTask(task, patch) {
    Object.assign(task, patch);
    emit({ type: 'task:updated', taskId: task.id, patch: clone(patch) });
  }

  /** Streams an assistant reply into an existing (streaming) message. */
  async function stream(message, text, run) {
    const chunks = text.match(/[^\s]+\s*/g) ?? [];
    for (const chunk of chunks) {
      if (run.cancelled)
        return;
      message.text = (message.text ?? '') + chunk;
      emit({ type: 'message:delta', conversationId: message.conversationId, messageId: message.id, delta: chunk });
      await wait(28);
    }
  }

  async function drive(taskId) {
    if (runs.has(taskId))
      return;
    const task = world.tasks[taskId];
    if (!task)
      return;
    const run = { cancelled: false };
    runs.set(taskId, run);
    const script = scripts.get(taskId) ?? [];
    setTask(task, { status: 'running' });
    try {
      for (let index = 0; index < task.steps.length; index += 1) {
        if (run.cancelled)
          return;
        const step = task.steps[index];
        setStep(task, step.id, 'active');
        await wait(STEP_DELAY);
        if (run.cancelled)
          return;
        const effect = script[index]?.effect;
        if (effect === 'approval-publish' || effect === 'approval-install') {
          setStep(task, step.id, 'waiting_approval');
          setTask(task, { status: 'waiting_approval' });
          addApproval(task.conversationId, task.id, effect === 'approval-publish'
            ? { id: uid('approval'), conversationId: task.conversationId, taskId: task.id, kind: 'publish_page', title: 'مدیریت برگه', target: 'پیشنهاد محتوا', summary: 'عملیات: publish؛ تأیید، همین تغییر ثبت‌شده در سرور را اجرا می‌کند.', changes: ['status: publish', 'post_id: 42'], planHash: 'plan-' + task.id }
            : { id: uid('approval'), conversationId: task.conversationId, taskId: task.id, kind: 'install_plugin', title: 'مدیریت افزونه', target: 'yagent-gallery', summary: 'عملیات: install؛ تأیید، همین تغییر ثبت‌شده در سرور را اجرا می‌کند.', changes: ['plugin: yagent-gallery', 'action: install'], planHash: 'plan-' + task.id });
          return;
        }
        if (effect === 'note-permission') {
          step.summary = 'حالت فقط خواندنی روشن است؛ برای نصب یا انتشار، اجازهٔ تغییر را روشن کنید.';
          setStep(task, step.id, 'done');
          continue;
        }
        if (effect === 'result-listing')
          addResult(task.conversationId, { id: uid('result'), conversationId: task.conversationId, title: 'فهرست محتوا', message: 'نتیجهٔ این ابزار در سرور ثبت شد.', technical: [{ label: 'رسید', value: uid('rcpt') }] });
        if (effect === 'result-site')
          addResult(task.conversationId, { id: uid('result'), conversationId: task.conversationId, title: 'اطلاعات سایت', message: 'نسخهٔ وردپرس و قالب فعال گزارش شد.', technical: [{ label: 'رسید', value: uid('rcpt') }] });
        if (effect === 'result-artifact')
          addResult(task.conversationId, { id: uid('result'), conversationId: task.conversationId, title: 'مدیریت افزونه', message: 'بستهٔ افزونه برای دانلود آماده است.', artifactId: uid('artifact'), technical: [{ label: 'رسید', value: uid('rcpt') }] });
        if (effect === 'revision') {
          const revision = createRevision(task, 1);
          if (run.cancelled)
            return;
          if (task.replyMessage)
            await stream(task.replyMessage, REPLY_PROPOSAL, run);
          if (run.cancelled)
            return;
          if (task.replyMessage)
            emit({ type: 'message:updated', conversationId: task.conversationId, messageId: task.replyMessage.id, patch: { status: 'complete' } });
          setStep(task, step.id, 'done');
          continue;
        }
        if (effect === 'result-page') {
          const revision = latestRevisionOfTask(task);
          addResult(task.conversationId, { id: uid('result'), conversationId: task.conversationId, title: 'مدیریت برگه', message: 'پیشنهاد محتوا آماده است و می‌توانید پیش‌نمایش آن را ببینید.', link: '#', linkLabel: 'ویرایش در وردپرس', previewRevisionId: revision?.id, technical: [{ label: 'رسید', value: uid('rcpt') }] });
        }
        if (effect === 'reply-audit' && task.replyMessage) {
          await stream(task.replyMessage, REPLY_AUDIT, run);
          if (run.cancelled)
            return;
          emit({ type: 'message:updated', conversationId: task.conversationId, messageId: task.replyMessage.id, patch: { status: 'complete' } });
        }
        if (index === 1 && task.replyMessage && !task.replyMessage.text)
          await stream(task.replyMessage, REPLY_SITE, run);
        setStep(task, step.id, 'done');
      }
      setTask(task, { status: 'done', endedAt: Date.now(), summary: 'کار تمام شد.' });
    } finally {
      runs.delete(taskId);
    }
  }

  function createRevision(task, revision) {
    const pageId = 'page-' + task.id;
    const id = `${pageId}-rev-${revision}`;
    const item = {
      id,
      pageId,
      pageTitle: 'پیشنهاد محتوا — ' + task.title,
      revision,
      status: 'draft',
      createdAt: Date.now(),
      html: '<section data-yagent-id="hero" style="padding:44px 28px;text-align:center"><h1 data-yagent-id="hero-title" style="margin:0 0 12px;font-size:28px">پیشنهاد YAgent</h1><p data-yagent-id="hero-text" style="margin:0;color:#4b4553">این پیش‌نمایش از همان HTML پیشنهادی ساخته شده است.</p></section>',
      summary: 'محتوای پیشنهادی عملیات؛ نمایش قالب و ابزارک‌ها در سایت ممکن است متفاوت باشد.',
      elementIds: ['hero', 'hero-title', 'hero-text'],
    };
    world.revisions[id] = item;
    (world.revisionIdsByPage[pageId] ??= []).push(id);
    const conversation = conversationById(task.conversationId);
    if (conversation)
      touchConversation(conversation, { previewPageId: pageId });
    emit({ type: 'preview:ready', conversationId: task.conversationId, revision: clone(item) });
    return item;
  }

  function latestRevisionOfTask(task) {
    const ids = world.revisionIdsByPage['page-' + task.id] ?? [];
    const id = ids.at(-1);
    return id ? world.revisions[id] : undefined;
  }

  function snapshotOf(conversation) {
    const tasks = tasksOf(conversation.id);
    const taskIds = new Set(tasks.map((task) => task.id));
    return {
      conversationVersion: conversation.serverVersion,
      messages: messagesOf(conversation.id),
      tasks,
      approvals: approvalsOf(conversation.id).filter((approval) => taskIds.has(approval.taskId)),
      results: resultsOf(conversation.id),
      annotations: annotationsOf(conversation.id),
    };
  }

  function requireModel(id) {
    const model = modelById(id ?? selectedModelId);
    if (!model)
      throw new Error('ابتدا یک مدل در «مدل‌ها و اتصال» اضافه کنید.');
    return model;
  }

  const adapter = {
    capabilities: { voiceInput: false, fileAttachments: true, pagePreview: true, publish: false },
    workspace: { configured: true, readOnly: world.settings.readOnly, autoInstall: world.settings.autoInstall, provider: providerOf(world.settings.activeProvider)?.label ?? 'AvalAI' },

    async listConversations() {
      await wait(LATENCY.read);
      return world.conversations.slice().sort((a, b) => b.updatedAt - a.updatedAt).map(clone);
    },

    async createConversation() {
      await wait(LATENCY.write);
      const item = { id: uid('c'), title: '', pinned: false, createdAt: Date.now(), updatedAt: Date.now(), serverVersion: 1 };
      world.conversations.unshift(item);
      world.messagesByConversation[item.id] = [];
      emit({ type: 'conversation:changed', conversationId: item.id, conversation: clone(item), reason: 'created' });
      return clone(item);
    },

    async renameConversation(id, title) {
      await wait(LATENCY.write);
      const conversation = conversationById(id);
      if (!conversation)
        throw new Error('این گفتگو پیدا نشد.');
      return clone(touchConversation(conversation, { title }));
    },

    async setConversationPinned(id, pinned) {
      await wait(LATENCY.read);
      const conversation = conversationById(id);
      if (conversation)
        touchConversation(conversation, { pinned });
    },

    async deleteConversation(id) {
      await wait(LATENCY.write);
      const conversation = conversationById(id);
      if (!conversation)
        return;
      world.conversations = world.conversations.filter((item) => item.id !== id);
      delete world.messagesByConversation[id];
      emit({ type: 'conversation:changed', conversationId: id, conversation: clone(conversation), reason: 'deleted' });
    },

    async listModels() {
      await wait(LATENCY.read);
      adapter.workspace = { ...adapter.workspace, provider: providerOf(world.settings.activeProvider)?.label ?? 'AvalAI' };
      return world.models.map(clone);
    },

    async getConversationSnapshot(id) {
      await wait(LATENCY.read);
      const conversation = conversationById(id);
      if (!conversation)
        throw new Error('این گفتگو پیدا نشد.');
      const snapshot = snapshotOf(conversation);
      snapshot.tasks.forEach((task) => emit({ type: 'task:created', conversationId: id, task: clone(task) }));
      snapshot.approvals.forEach((approval) => emit({ type: 'approval:created', conversationId: id, approval: clone(approval) }));
      snapshot.results.forEach((result) => emit({ type: 'result:created', conversationId: id, result: clone(result) }));
      snapshot.annotations.forEach((annotation) => emit({ type: 'annotations:updated', conversationId: id, annotations: [clone(annotation)] }));
      emit({ type: 'messages:loaded', conversationId: id, version: conversation.serverVersion, messages: clone(snapshot.messages) });
      return snapshot;
    },

    async uploadAttachment(file) {
      await wait(LATENCY.upload);
      if (file.size > 8 * 1024 * 1024)
        throw new Error('حجم فایل بیش از ۸ مگابایت است.');
      return { id: uid('upload'), mime: file.type || 'application/octet-stream', name: file.name };
    },

    async sendMessage(input) {
      await wait(LATENCY.write);
      const conversation = conversationById(input.conversationId);
      if (!conversation)
        throw new Error('این گفتگو پیدا نشد.');
      requireModel(input.modelId);
      const taskId = uid('task');
      const script = scriptFor(input.text, input.mode, input.readOnly ?? true);
      const task = {
        id: taskId,
        conversationId: conversation.id,
        title: suggestTitle(input.text, 'درخواست تازه'),
        status: 'queued',
        startedAt: Date.now(),
        summary: 'در حال اجرای درخواست شما…',
        steps: script.map((entry, index) => ({ id: `${taskId}-s${index + 1}`, title: entry.title, status: 'pending', summary: entry.summary })),
      };
      world.tasks[taskId] = task;
      scripts.set(taskId, script);
      addMessage(conversation.id, { id: `${taskId}-user`, role: 'user', kind: 'text', text: input.text, status: 'complete' });
      const reply = addMessage(conversation.id, { id: `${taskId}-reply`, role: 'assistant', kind: 'text', text: '', status: 'streaming' });
      task.replyMessage = reply;
      addMessage(conversation.id, { id: `${taskId}-activity`, role: 'assistant', kind: 'activity', taskId, status: 'streaming' });
      // The local titler names an untitled conversation; a title the user set by
      // hand is never overwritten, and the preference can turn naming off.
      if (!conversation.title && world.settings.draft.titleGeneration === 'auto')
        touchConversation(conversation, { title: suggestTitle(input.text) });
      emit({ type: 'task:created', conversationId: conversation.id, task: clone(task) });
      return taskId;
    },

    async runTask(id) {
      await drive(id);
    },

    async resumeTask(id) {
      await drive(id);
    },

    async stopTask(conversationId) {
      const task = tasksOf(conversationId).find((item) => item.status === 'running' || item.status === 'queued');
      if (!task)
        return;
      const run = runs.get(task.id);
      if (run)
        run.cancelled = true;
      task.steps.forEach((step) => { if (step.status === 'active' || step.status === 'pending') step.status = 'skipped'; });
      setTask(task, { status: 'stopped', endedAt: Date.now(), summary: 'کار متوقف شد.', paused: true });
      if (task.replyMessage)
        emit({ type: 'message:updated', conversationId, messageId: task.replyMessage.id, patch: { status: 'stopped' } });
    },

    async resolveApproval(id, decision) {
      await wait(LATENCY.write);
      const approval = world.approvals[id];
      if (!approval)
        throw new Error('این تأییدیه پیدا نشد.');
      if (decision === 'approve') {
        approval.status = 'running';
        emit({ type: 'approval:updated', conversationId: approval.conversationId, approvalId: id, patch: { status: 'running' } });
        return;
      }
      approval.status = 'rejected';
      emit({ type: 'approval:updated', conversationId: approval.conversationId, approvalId: id, patch: { status: 'rejected' } });
      const task = world.tasks[approval.taskId];
      if (task)
        setTask(task, { status: 'done', endedAt: Date.now(), summary: 'عملیات تأیید نشد و تغییری روی سایت انجام نشد.' });
    },

    async continueAfterApproval(id) {
      const approval = world.approvals[id];
      if (!approval || approval.status !== 'running')
        return;
      await wait(LATENCY.test);
      approval.status = 'succeeded';
      approval.result = { message: 'عملیات تأییدشده در سرور ثبت شد.', technical: [{ label: 'شناسهٔ عملیات', value: approval.id }] };
      emit({ type: 'approval:updated', conversationId: approval.conversationId, approvalId: id, patch: { status: 'succeeded', result: approval.result } });
      const task = world.tasks[approval.taskId];
      if (!task)
        return;
      const waiting = task.steps.find((step) => step.status === 'waiting_approval');
      if (waiting)
        setStep(task, waiting.id, 'done', 'عملیات با تأیید شما انجام شد.');
      addResult(task.conversationId, { id: uid('result'), conversationId: task.conversationId, title: approval.kind === 'install_plugin' ? 'مدیریت افزونه' : 'مدیریت برگه', message: approval.kind === 'install_plugin' ? 'افزونه با تأیید شما فعال شد.' : 'محتوا با تأیید شما روی سایت ثبت شد.', link: '#', linkLabel: 'مشاهده در سایت', technical: [{ label: 'رسید', value: uid('rcpt') }] });
      setTask(task, { status: 'done', endedAt: Date.now(), summary: 'کار تمام شد.' });
    },

    async getPagePreview(pageId) {
      await wait(LATENCY.read);
      const ids = world.revisionIdsByPage[pageId] ?? [];
      return {
        revisions: ids.map((id) => clone(world.revisions[id])).filter(Boolean),
        annotations: Object.values(world.annotations).filter((annotation) => annotation.pageId === pageId).map(clone),
      };
    },

    async publishRevision() {
      throw new Error('انتشار از کارت تأیید عملیات در گفتگو انجام می‌شود.');
    },

    async sendPageFeedback(input) {
      const annotations = input.annotations.map((annotation, index) => ({
        ...annotation,
        status: 'sent',
        index: index + 1,
        conversationId: input.conversationId,
      }));
      annotations.forEach((annotation) => { world.annotations[annotation.id] = annotation; });
      emit({ type: 'annotations:updated', conversationId: input.conversationId, annotations: clone(annotations) });
      const summary = 'بازخورد روی محتوای پیشنهادی «' + (world.revisions[input.revisionId]?.pageTitle || input.pageId) + '»: ' + annotations.map((annotation) => `${annotation.elementLabel || annotation.elementId || 'ناحیه'}: ${annotation.comment}`).join(' · ');
      return adapter.sendMessage({ ...input, text: summary, attachments: [], requestId: 'feedback-' + annotations[0].id });
    },

    async resolveAnnotation(id) {
      const annotation = world.annotations[id];
      if (!annotation)
        return;
      annotation.status = 'resolved';
      emit({ type: 'annotations:updated', conversationId: annotation.conversationId, annotations: [clone(annotation)] });
    },

    async downloadArtifact(id) {
      await wait(LATENCY.read);
      const artifact = world.artifacts[id] ?? { filename: 'yagent-package.zip' };
      // A valid (empty) ZIP container: enough to prove the download path.
      const bytes = new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = artifact.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    // ---- settings and model management (frontend simulation) ----

    async getSettings() {
      await wait(LATENCY.read);
      return clone({
        providers: world.providers,
        models: world.models,
        selectedModelId,
        ...world.settings,
      });
    },

    async saveSettings(patch) {
      await wait(LATENCY.write);
      Object.assign(world.settings, patch);
      adapter.workspace = { ...adapter.workspace, readOnly: world.settings.readOnly, autoInstall: world.settings.autoInstall };
      if (patch.consumption)
        world.settings.consumption = { ...world.settings.consumption, ...patch.consumption };
      if (patch.draft)
        world.settings.draft = { ...world.settings.draft, ...patch.draft };
      if (patch.appearance)
        world.settings.appearance = { ...world.settings.appearance, ...patch.appearance };
      if (patch.activeModelId)
        selectedModelId = patch.activeModelId;
      return clone({ providers: world.providers, models: world.models, selectedModelId, ...world.settings });
    },

    /** Validates the draft the way a real endpoint would, without any network call. */
    validateModelDraft(draft) {
      return validateModelDraft(draft);
    },

    async discoverModels(input) {
      await wait(LATENCY.discover);
      if (!String(input.apiKey || '').trim())
        throw new Error('برای دریافت مدل‌ها ابتدا کلید API را وارد کنید.');
      return { models: (DISCOVERABLE_MODELS[input.provider] ?? []).slice() };
    },

    async testConnection(draft) {
      await wait(LATENCY.test);
      const errors = adapter.validateModelDraft(draft);
      if (errors.apiKey || errors.baseUrl || errors.modelId) {
        const first = errors.apiKey || errors.baseUrl || errors.modelId;
        throw new Error(first);
      }
      if (/\s/.test(String(draft.modelId)))
        throw new Error('شناسهٔ مدل نباید فاصله داشته باشد.');
      const provider = providerOf(draft.provider);
      return {
        ok: true,
        message: `اتصال به ${provider?.label ?? draft.provider} با مدل ${String(draft.modelId).trim()} برقرار شد.`,
        latencyMs: 380,
      };
    },

    async addModel(draft) {
      await wait(LATENCY.write);
      const errors = adapter.validateModelDraft(draft);
      const failure = errors.name || errors.provider || errors.modelId || errors.baseUrl || errors.apiKey;
      if (failure)
        throw new Error(failure);
      const provider = providerOf(draft.provider);
      const model = {
        id: uid('model'),
        name: String(draft.modelId).trim(),
        displayName: String(draft.name).trim(),
        hint: `${provider?.label ?? draft.provider} – ${provider?.hint ?? ''}`.trim(),
        supportsTools: Boolean(draft.supportsTools),
        provider: draft.provider,
        advanced: {
          timeoutMs: draft.timeoutMs,
          outputTokens: draft.outputTokens,
          contextTokens: draft.contextTokens,
          thinking: draft.thinking,
        },
      };
      world.models.push(model);
      return clone(model);
    },

    async updateModel(id, draft) {
      await wait(LATENCY.write);
      const model = modelById(id);
      if (!model)
        throw new Error('این مدل پیدا نشد.');
      const errors = adapter.validateModelDraft(draft);
      const failure = errors.name || errors.provider || errors.modelId || errors.baseUrl || errors.apiKey;
      if (failure)
        throw new Error(failure);
      const provider = providerOf(draft.provider);
      Object.assign(model, {
        name: String(draft.modelId).trim(),
        displayName: String(draft.name).trim(),
        hint: `${provider?.label ?? draft.provider} – ${provider?.hint ?? ''}`.trim(),
        supportsTools: Boolean(draft.supportsTools),
        provider: draft.provider,
        advanced: {
          timeoutMs: draft.timeoutMs,
          outputTokens: draft.outputTokens,
          contextTokens: draft.contextTokens,
          thinking: draft.thinking,
        },
      });
      return clone(model);
    },

    async removeModel(id) {
      await wait(LATENCY.write);
      world.models = world.models.filter((model) => model.id !== id);
      if (selectedModelId === id)
        selectedModelId = world.models[0]?.id ?? '';
      return { removed: id, selectedModelId };
    },
  };

  return adapter;
}
