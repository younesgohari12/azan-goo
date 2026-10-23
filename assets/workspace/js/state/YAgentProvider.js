import { el, Fragment } from '../native/dom.js';
import { makeContext, contextValue, afterRender, memoValue, reducerCell, reference, } from '../native/dom.js';
import { createYAgentAdapter } from '../adapters/index.js';
import { percentOf, uid } from '../lib/utils.js';
import { composerOf, createInitialState, currentTaskOf, draftAnnotationsOf, messagesOf, pageAnnotationsOf, revisionsOfPage, } from './state.js';
import { reducer } from './reducer.js';
const YAgentContext = makeContext(null);
function toAttachment(file) {
    const isImage = file.type.startsWith('image/');
    return {
        id: uid('att'),
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        status: 'uploading',
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    };
}
export function YAgentProvider({ children, adapter: injectedAdapter, }) {
    const adapter = memoValue(() => injectedAdapter ?? createYAgentAdapter(), [injectedAdapter]);
    const [state, dispatch] = reducerCell(reducer, adapter.capabilities, createInitialState);
    const stateRef = reference(state);
    const sending = reference(false);
    stateRef.current = state;
    const draftKey = `yagent:${encodeURIComponent(window.YAgentUI?.rest || location.origin)}:${window.YAgentUI?.userId || 0}:drafts`;
    afterRender(() => {
        try { const saved = JSON.parse(sessionStorage.getItem(draftKey) || '{}'); dispatch({ type: 'composer:restore', composers: saved }); const notes = JSON.parse(sessionStorage.getItem(draftKey + ':notes') || '{}'); if (notes.annotations && notes.annotationOwners) dispatch({ type: 'workspace:options', options: notes }); } catch {}
    }, []);
    afterRender(() => {
        try { sessionStorage.setItem(draftKey, JSON.stringify(Object.fromEntries(Object.entries(state.composerByConversation).map(([id, composer]) => [id, { text: composer.text, requestId: composer.requestId, requestSignature: composer.requestSignature, attachments: composer.attachments.filter(a => a.status === 'ready').map(({ previewUrl, ...a }) => a) }])))); } catch {}
    }, [state.composerByConversation]);
    afterRender(() => { try { sessionStorage.setItem(draftKey + ':notes', JSON.stringify({ annotations: state.annotations, annotationOwners: state.annotationOwners })); } catch {} }, [state.annotations, state.annotationOwners]);
    afterRender(() => {
        let cancelled = false;
        void (async () => {
            const [conversations, models] = await Promise.all([adapter.listConversations(), adapter.listModels()]);
            if (cancelled)
                return;
            dispatch({ type: 'booted', conversations, models, workspace: adapter.workspace });
            // Connection settings, permissions and preferences (settings view).
            if (typeof adapter.getSettings !== 'function')
                return;
            const payload = await adapter.getSettings();
            if (cancelled)
                return;
            const { providers, models: savedModels, selectedModelId, ...settings } = payload;
            dispatch({ type: 'settings:loaded', providers: providers ?? [], settings });
            if (savedModels?.length)
                dispatch({ type: 'models:sync', models: savedModels });
        })().catch(error => { if (!cancelled) dispatch({ type: 'workspace:error', error: error.message }); });
        return () => {
            cancelled = true;
        };
    }, [adapter]);
    afterRender(() => adapter.subscribe((event) => dispatch({ type: 'agent:event', event })), [adapter]);
    const activeConversationId = state.activeConversationId;
    afterRender(() => {
        if (!activeConversationId || activeConversationId === 'draft')
            return;
        let cancelled = false;
        void (async () => {
            const snapshot = await adapter.getConversationSnapshot(activeConversationId);
            if (cancelled)
                return;
            dispatch({ type: 'conversation:loaded', conversationId: activeConversationId, ...snapshot });
        })().catch(error => { if (!cancelled) dispatch({ type: 'workspace:error', error: error.message }); });
        return () => {
            cancelled = true;
        };
    }, [adapter, activeConversationId]);
    const actions = memoValue(() => {
        const activeId = () => stateRef.current.activeConversationId;
        let previewRequestId = 0;
        /** Opens (or follows) a page in the workspace: registers the page, loads its
         *  revisions and annotations, then points the canvas at the requested one. */
        async function openPage(pageId, revisionId, conversationId = activeId()) {
            if (!conversationId)
                return;
            const requestId = ++previewRequestId;
            dispatch({ type: 'preview:open', conversationId, pageId, revisionId });
            const preview = await adapter.getPagePreview(pageId);
            if (requestId !== previewRequestId || activeId() !== conversationId)
                return;
            dispatch({ type: 'preview:loaded', revisions: preview.revisions, annotations: preview.annotations });
            if (revisionId)
                dispatch({ type: 'preview:revision', revisionId });
        }
        async function selectConversation(conversationId) {
            if (conversationId === activeId())
                return;
            const { preview, conversations } = stateRef.current;
            ++previewRequestId;
            dispatch({ type: 'conversation:select', conversationId });
            const pageId = conversations.find((item) => item.id === conversationId)?.previewPageId;
            if (preview.open && pageId)
                await openPage(pageId, undefined, conversationId);
        }
        const report = error => dispatch({ type: 'workspace:error', error: error.message || 'درخواست انجام نشد.' });
        const launch = id => { if (id) void adapter.runTask(id).catch(report); };
        const exposed = {
            dismissError() { dispatch({ type: 'workspace:error', error: null }); },
            setOptions(options) { dispatch({ type: 'workspace:options', options }); },
            async refresh() {
                const models = await adapter.listModels();
                const selectedModelId = models.some(m => m.id === stateRef.current.selectedModelId) ? stateRef.current.selectedModelId : models[0]?.id || '';
                dispatch({ type: 'workspace:options', options: { booted: true, models, selectedModelId, workspace: adapter.workspace } });
                const id = activeId();
                if (id && id !== 'draft') { const snapshot = await adapter.getConversationSnapshot(id); dispatch({ type: 'conversation:loaded', conversationId: id, ...snapshot }); }
                dispatch({ type: 'conversations:sync', conversations: await adapter.listConversations() });
                dispatch({ type: 'workspace:error', error: null });
            },
            async resume() { const task = currentTaskOf(stateRef.current, activeId()); if (task) await adapter.resumeTask(task.id); },
            async downloadArtifact(id) { await adapter.downloadArtifact(id); },
            selectConversation,
            async newConversation() {
                // A local draft is available immediately. Persist the conversation
                // when sending, so typing/uploading cannot race a navigation.
                const draft = composerOf(stateRef.current, 'draft');
                draft.attachments.forEach(a => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
                dispatch({ type: 'composer:clear', conversationId: 'draft' });
                await selectConversation('draft');
            },
            async renameConversation(conversationId, title) {
                await adapter.renameConversation(conversationId, title);
            },
            async togglePin(conversationId) {
                const conversation = stateRef.current.conversations.find((item) => item.id === conversationId);
                if (!conversation)
                    return;
                await adapter.setConversationPinned(conversationId, !conversation.pinned);
            },
            requestDelete(conversationId) {
                dispatch({ type: 'confirm:delete', conversationId });
            },
            async confirmDelete() {
                const conversationId = stateRef.current.confirmDeleteConversationId;
                if (!conversationId)
                    return;
                dispatch({ type: 'confirm:delete', conversationId: null });
                await adapter.deleteConversation(conversationId);
            },
            dismissDelete() {
                dispatch({ type: 'confirm:delete', conversationId: null });
            },
            setSearch(query) {
                dispatch({ type: 'search:set', query });
            },
            toggleSidebar() {
                dispatch({ type: 'sidebar:toggle' });
            },
            setPanel(options) {
                dispatch({ type: 'panel:set', open: options.open, tab: options.tab });
            },
            setModel(modelId) {
                dispatch({ type: 'model:select', modelId });
                const model = stateRef.current.models.find(m => m.id === modelId);
                if (!model?.supportsTools) dispatch({ type: 'workspace:options', options: { executionMode: 'chat' } });
            },
            async refreshModels() {
                dispatch({ type: 'models:sync', models: await adapter.listModels() });
            },
            async removeModel(modelId) {
                if (typeof adapter.removeModel !== 'function')
                    return;
                await adapter.removeModel(modelId);
                dispatch({ type: 'models:sync', models: await adapter.listModels() });
            },
            openModelDialog(modelId) {
                dispatch({ type: 'modelDialog:open', modelId });
            },
            closeModelDialog() {
                dispatch({ type: 'modelDialog:close' });
            },
            openSettings(tab) {
                dispatch({ type: 'settings:open', tab });
            },
            closeSettings() {
                dispatch({ type: 'settings:close' });
            },
            setSettingsTab(tab) {
                dispatch({ type: 'settings:tab', tab });
            },
            updateSettings(patch) {
                dispatch({ type: 'settings:patch', patch });
                if (typeof adapter.saveSettings !== 'function')
                    return;
                void adapter.saveSettings(patch)
                    .then(() => dispatch({ type: 'workspace:options', options: { workspace: adapter.workspace } }))
                    .catch(report);
            },
            setComposerText(text) {
                const conversationId = activeId();
                if (!conversationId)
                    return;
                dispatch({ type: 'composer:text', conversationId, text });
            },
            addAttachments(files) {
                const conversationId = activeId();
                if (!conversationId || files.length === 0)
                    return;
                if (composerOf(stateRef.current, conversationId).attachments.length + files.length > 20) { report(new Error('در هر پیام حداکثر ۲۰ فایل می‌توانید بفرستید.')); return; }
                const attachments = files.map(toAttachment);
                dispatch({ type: 'composer:attachments', conversationId, attachments });
                attachments.forEach((attachment, index) => {
                    void adapter.uploadAttachment(files[index]).then(upload => dispatch({ type: 'composer:attachmentPatch', conversationId, attachmentId: attachment.id, patch: { status: 'ready', serverId: upload.id, mime: upload.mime } })).catch(error => { dispatch({ type: 'composer:attachmentPatch', conversationId, attachmentId: attachment.id, patch: { status: 'error' } }); report(error); });
                });
            },
            removeAttachment(attachmentId) {
                const conversationId = activeId();
                if (!conversationId)
                    return;
                const composer = composerOf(stateRef.current, conversationId);
                const attachment = composer.attachments.find((item) => item.id === attachmentId);
                if (attachment?.previewUrl)
                    URL.revokeObjectURL(attachment.previewUrl);
                dispatch({ type: 'composer:removeAttachment', conversationId, attachmentId });
            },
            async send() {
                let conversationId = activeId();
                if (!conversationId || sending.current)
                    return;
                const composer = composerOf(stateRef.current, conversationId);
                const text = composer.text.trim();
                if ((!text && composer.attachments.length === 0) || composer.attachments.some(a => a.status !== 'ready'))
                    return;
                const attachments = composer.attachments.map((attachment) => ({ ...attachment }));
                const requestSignature = JSON.stringify([text, attachments.map(a => a.serverId || a.id), stateRef.current.selectedModelId, stateRef.current.executionMode, stateRef.current.readOnly]);
                const requestId = composer.requestSignature === requestSignature && composer.requestId ? composer.requestId : crypto.randomUUID();
                dispatch({ type: 'composer:request', conversationId, requestId, requestSignature });
                sending.current = true;
                dispatch({ type: 'workspace:sending', sending: true });
                const originalId = conversationId;
                try {
                if (conversationId === 'draft') { const c = await adapter.createConversation(); conversationId = c.id; dispatch({ type: 'conversation:select', conversationId }); dispatch({ type: 'composer:text', conversationId, text: composer.text }); dispatch({ type: 'composer:attachments', conversationId, attachments }); dispatch({ type: 'composer:request', conversationId, requestId, requestSignature }); }
                const id = await adapter.sendMessage({
                    conversationId,
                    text: text || 'این فایل را بررسی کن.',
                    attachments,
                    modelId: stateRef.current.selectedModelId,
                    mode: stateRef.current.executionMode,
                    readOnly: stateRef.current.readOnly,
                    requestId,
                });
                dispatch({ type: 'composer:clear', conversationId });
                if (originalId !== conversationId) dispatch({ type: 'composer:clear', conversationId: originalId });
                dispatch({ type: 'workspace:error', error: null });
                attachments.forEach(a => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
                launch(id);
                } finally { sending.current = false; dispatch({ type: 'workspace:sending', sending: false }); }
            },
            async stop() {
                const conversationId = activeId();
                if (!conversationId)
                    return;
                await adapter.stopTask(conversationId);
            },
            async sendPrompt(text) {
                const conversationId = activeId();
                if (!conversationId || !text.trim())
                    return;
                dispatch({ type: 'composer:text', conversationId, text });
                setTimeout(() => document.querySelector('textarea[aria-label="پیام شما"]')?.focus(), 0);
            },
            async resolveApproval(approvalId, decision) {
                await adapter.resolveApproval(approvalId, decision);
                void adapter.continueAfterApproval(approvalId).catch(report);
            },
            async publishRevision(revisionId) {
                await adapter.publishRevision(revisionId);
            },
            openPreview: openPage,
            closePreview() {
                ++previewRequestId;
                dispatch({ type: 'preview:close' });
            },
            setDevice(device) {
                dispatch({ type: 'preview:device', device });
            },
            setPreviewWidth(width) {
                dispatch({ type: 'preview:width', width });
            },
            setZoom(zoom) {
                dispatch({ type: 'preview:zoom', zoom });
            },
            setAnnotate(enabled) {
                const { preview, activeConversationId } = stateRef.current;
                if (!preview.open || preview.conversationId !== activeConversationId)
                    return;
                dispatch({ type: 'preview:annotate', enabled });
                if (enabled)
                    dispatch({ type: 'panel:set', open: true, tab: 'feedback' });
            },
            selectRevision(revisionId) {
                dispatch({ type: 'preview:revision', revisionId });
            },
            setCompareRevision(revisionId) {
                dispatch({ type: 'preview:compare', revisionId });
            },
            reloadPreview() {
                dispatch({ type: 'preview:reload' });
            },
            reportPreviewHeight(height) {
                dispatch({ type: 'preview:height', height });
            },
            selectAnnotation(annotationId) {
                dispatch({ type: 'preview:selectAnnotation', annotationId });
            },
            addBridgeAnnotation(draft) {
                const { preview, annotations, activeConversationId } = stateRef.current;
                if (!preview.open || !activeConversationId || preview.conversationId !== activeConversationId || !preview.pageId || !preview.revisionId)
                    return;
                const sameRevision = Object.values(annotations).filter((annotation) => annotation.revisionId === preview.revisionId);
                const nextIndex = sameRevision.reduce((max, annotation) => Math.max(max, annotation.index), 0) + 1;
                const annotation = {
                    id: uid('an'),
                    pageId: preview.pageId,
                    revisionId: preview.revisionId,
                    kind: draft.kind,
                    index: nextIndex,
                    comment: '',
                    rect: draft.rect,
                    viewport: { width: preview.width, device: preview.device },
                    elementId: draft.elementId,
                    elementLabel: draft.elementLabel,
                    createdAt: Date.now(),
                    status: 'draft',
                };
                dispatch({ type: 'annotation:add', annotation, conversationId: activeConversationId });
                dispatch({ type: 'preview:selectAnnotation', annotationId: annotation.id });
            },
            updateAnnotationComment(annotationId, comment) {
                if (stateRef.current.annotationOwners[annotationId] !== activeId())
                    return;
                dispatch({ type: 'annotation:comment', annotationId, comment });
            },
            removeAnnotation(annotationId) {
                const annotation = stateRef.current.annotations[annotationId];
                if (annotation?.status === 'draft' && stateRef.current.annotationOwners[annotationId] === activeId())
                    dispatch({ type: 'annotation:remove', annotationId });
            },
            undoAnnotation() {
                dispatch({ type: 'annotation:undo' });
            },
            async resolveAnnotation(annotationId) {
                await adapter.resolveAnnotation(annotationId);
            },
            async sendFeedback() {
                if (sending.current) return;
                const { preview, conversations } = stateRef.current;
                const conversationId = activeId();
                const drafts = draftAnnotationsOf(stateRef.current);
                if (!conversationId || !preview.open || preview.conversationId !== conversationId || !preview.pageId || !preview.revisionId || drafts.length === 0)
                    return;
                // Notes written on a page must never land in a conversation that works
                // on a different page.
                const conversation = conversations.find((item) => item.id === conversationId);
                if (conversation?.previewPageId !== preview.pageId)
                    return;
                const payload = drafts.map((draft) => ({ ...draft }));
                sending.current = true;
                dispatch({ type: 'workspace:sending', sending: true });
                try {
                dispatch({ type: 'preview:annotate', enabled: false });
                dispatch({ type: 'panel:set', open: true, tab: 'feedback' });
                const id = await adapter.sendPageFeedback({
                    conversationId,
                    pageId: preview.pageId,
                    revisionId: preview.revisionId,
                    viewport: { width: preview.width, device: preview.device },
                    annotations: payload,
                    modelId: stateRef.current.selectedModelId,
                    mode: stateRef.current.executionMode,
                    readOnly: stateRef.current.readOnly,
                });
                launch(id);
                } finally { sending.current = false; dispatch({ type: 'workspace:sending', sending: false }); }
            },
        };
        return Object.fromEntries(Object.entries(exposed).map(([key, fn]) => [key, fn.constructor.name === 'AsyncFunction' ? async (...args) => { try { return await fn(...args); } catch (error) { report(error); } } : fn]));
    }, [adapter]);
    const derived = memoValue(() => {
        const activeConversation = state.conversations.find((item) => item.id === state.activeConversationId);
        const messages = messagesOf(state, state.activeConversationId);
        const currentTask = currentTaskOf(state, state.activeConversationId);
        const steps = currentTask?.steps ?? [];
        const done = steps.filter((step) => step.status === 'done').length;
        const failed = steps.filter((step) => step.status === 'error').length;
        const waiting = steps.filter((step) => step.status === 'waiting_approval').length;
        const running = currentTask
            ? currentTask.status === 'running' || currentTask.status === 'waiting_approval' || currentTask.status === 'queued'
            : false;
        const draftAnnotations = draftAnnotationsOf(state);
        const pageAnnotations = pageAnnotationsOf(state, state.preview.pageId);
        const revisions = revisionsOfPage(state, state.preview.pageId);
        const currentRevision = state.preview.revisionId ? state.revisions[state.preview.revisionId] : undefined;
        const pendingApproval = Object.values(state.approvals)
            .filter((approval) => approval.status === 'pending' && approval.conversationId === state.activeConversationId)
            .sort((a, b) => a.createdAt - b.createdAt)[0];
        const composer = composerOf(state, state.activeConversationId);
        const canSend = state.booted && state.models.length > 0 && !state.sending && composer.attachments.every(a => a.status === 'ready') && (composer.text.trim().length > 0 || composer.attachments.length > 0);
        return {
            activeConversation,
            messages,
            currentTask,
            taskProgress: { done, total: steps.length, percent: percentOf(done, steps.length), failed, waiting },
            running,
            draftAnnotations,
            pageAnnotations,
            revisions,
            currentRevision,
            pendingApproval,
            canSend,
        };
    }, [state]);
    const value = memoValue(() => ({ state, adapter, actions, derived }), [state, adapter, actions, derived]);
    return el(YAgentContext.Provider, { value: value }, children);
}
export function useYAgent() {
    const context = contextValue(YAgentContext);
    if (!context)
        throw new Error('useYAgent must be used inside <YAgentProvider>');
    return context;
}
export function useYAgentActions() {
    return useYAgent().actions;
}
export const useYAgentState = () => useYAgent().state;
