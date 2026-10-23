import { DEFAULT_PREVIEW_WIDTH, draftAnnotationsOf } from './state.js';
function withComposer(state, conversationId, update) {
    const current = state.composerByConversation[conversationId] ?? { text: '', attachments: [] };
    return {
        ...state,
        composerByConversation: { ...state.composerByConversation, [conversationId]: update(current) },
    };
}
function mergeMessages(state, conversationId, update) {
    const current = state.messagesByConversation[conversationId] ?? [];
    return { ...state, messagesByConversation: { ...state.messagesByConversation, [conversationId]: update(current) } };
}
/**
 * Adds restored entities that state does not know yet. Existing entries are kept
 * untouched: a live event is always newer than a snapshot being loaded.
 */
function mergeMissing(current, items) {
    const next = { ...current };
    items.forEach((item) => {
        if (!next[item.id])
            next[item.id] = item;
    });
    return next;
}
function mergeAnnotation(state, annotation) {
    return { ...state, annotations: { ...state.annotations, [annotation.id]: annotation } };
}
/** Settings patch: the group objects merge, so a single checkbox never wipes its tab. */
function applySettings(state, patch = {}) {
    return {
        ...state,
        settings: {
            ...state.settings,
            ...patch,
            consumption: { ...state.settings.consumption, ...(patch.consumption || {}) },
            draft: { ...state.settings.draft, ...(patch.draft || {}) },
            appearance: { ...state.settings.appearance, ...(patch.appearance || {}) },
        },
    };
}
function closedPreview(preview) {
    return {
        ...preview, open: false, conversationId: undefined, pageId: undefined,
        revisionId: undefined, compareRevisionId: undefined, annotate: false,
        selectedAnnotationId: undefined, height: 0,
    };
}
function mergeRevision(state, revision) {
    const ids = state.revisionIdsByPage[revision.pageId] ?? [];
    const nextIds = ids.includes(revision.id)
        ? ids
        : [...ids, revision.id].sort((a, b) => (state.revisions[a]?.revision ?? 0) - (state.revisions[b]?.revision ?? 0));
    return {
        ...state,
        revisions: { ...state.revisions, [revision.id]: revision },
        revisionIdsByPage: { ...state.revisionIdsByPage, [revision.pageId]: nextIds },
    };
}
function applyEvent(state, event) {
    switch (event.type) {
        case 'conversation:changed': {
            const { conversation, reason } = event;
            if (reason === 'deleted') {
                const conversations = state.conversations.filter((item) => item.id !== conversation.id);
                const messagesByConversation = { ...state.messagesByConversation };
                delete messagesByConversation[conversation.id];
                return {
                    ...state,
                    conversations,
                    messagesByConversation,
                    activeConversationId: state.activeConversationId === conversation.id ? conversations[0]?.id ?? null : state.activeConversationId,
                    preview: state.preview.conversationId === conversation.id
                        ? closedPreview(state.preview)
                        : state.preview,
                };
            }
            const exists = state.conversations.some((item) => item.id === conversation.id);
            const conversations = exists
                ? state.conversations.map((item) => (item.id === conversation.id ? conversation : item))
                : [conversation, ...state.conversations];
            return { ...state, conversations };
        }
        case 'messages:loaded':
            if ((event.version || 0) < (state.conversationVersions?.[event.conversationId] || 0)) return state;
            return {
                ...state,
                conversationVersions: { ...state.conversationVersions, [event.conversationId]: event.version || 0 },
                messagesByConversation: { ...state.messagesByConversation, [event.conversationId]: event.messages },
            };
        case 'message:created': {
            const message = event.message;
            return mergeMessages(state, event.conversationId, (list) => list.some((item) => item.id === message.id) ? list : [...list, message]);
        }
        case 'message:delta':
            return mergeMessages(state, event.conversationId, (list) => list.map((item) => (item.id === event.messageId ? { ...item, text: (item.text ?? '') + event.delta } : item)));
        case 'message:updated':
            return mergeMessages(state, event.conversationId, (list) => list.map((item) => (item.id === event.messageId ? { ...item, ...event.patch } : item)));
        case 'task:created':
            return { ...state, tasks: { ...state.tasks, [event.task.id]: event.task } };
        case 'task:updated': {
            const task = state.tasks[event.taskId];
            if (!task)
                return state;
            return { ...state, tasks: { ...state.tasks, [event.taskId]: { ...task, ...event.patch } } };
        }
        case 'task:step': {
            const task = state.tasks[event.taskId];
            if (!task)
                return state;
            const steps = task.steps.map((step) => (step.id === event.step.id ? event.step : step));
            return { ...state, tasks: { ...state.tasks, [event.taskId]: { ...task, steps } } };
        }
        case 'approval:created':
            return { ...state, approvals: { ...state.approvals, [event.approval.id]: event.approval } };
        case 'approval:updated': {
            const approval = state.approvals[event.approvalId];
            if (!approval)
                return state;
            return {
                ...state,
                approvals: { ...state.approvals, [event.approvalId]: { ...approval, ...event.patch } },
            };
        }
        case 'result:created':
            return { ...state, results: { ...state.results, [event.result.id]: event.result } };
        case 'preview:ready': {
            const next = mergeRevision(state, event.revision);
            const viewing = state.preview;
            if (!viewing.open || viewing.conversationId !== event.conversationId || viewing.pageId !== event.revision.pageId)
                return next;
            const current = viewing.revisionId ? state.revisions[viewing.revisionId] : undefined;
            const shouldFollow = !current || event.revision.revision >= current.revision;
            return {
                ...next,
                preview: shouldFollow ? { ...next.preview, revisionId: event.revision.id, nonce: next.preview.nonce + 1 } : next.preview,
            };
        }
        case 'annotations:updated': {
            const annotations = { ...state.annotations };
            event.annotations.forEach((annotation) => {
                annotations[annotation.id] = annotation;
            });
            return { ...state, annotations };
        }
        default:
            return state;
    }
}
export function reducer(state, action) {
    switch (action.type) {
        case 'booted':
            return {
                ...state,
                booted: true,
                conversations: action.conversations,
                models: action.models,
                activeConversationId: action.conversations.some(c => c.id === state.activeConversationId) ? state.activeConversationId : action.conversations[0]?.id ?? 'draft',
                selectedModelId: action.models[0]?.id || '',
                executionMode: action.models[0]?.supportsTools ? 'agent' : 'chat',
                workspace: action.workspace || {},
            };
        case 'conversations:sync':
            return { ...state, conversations: action.conversations };
        case 'conversation:loaded':
            return {
                ...state,
                messagesByConversation: (action.conversationVersion || 0) < (state.conversationVersions?.[action.conversationId] || 0) ? state.messagesByConversation : { ...state.messagesByConversation, [action.conversationId]: action.messages },
                conversationVersions: { ...state.conversationVersions, [action.conversationId]: Math.max(action.conversationVersion || 0, state.conversationVersions?.[action.conversationId] || 0) },
                tasks: mergeMissing(state.tasks, action.tasks),
                approvals: mergeMissing(state.approvals, action.approvals),
                results: mergeMissing(state.results, action.results),
                annotations: mergeMissing(state.annotations, action.annotations),
            };
        case 'conversation:select':
            return state.activeConversationId === action.conversationId ? state : {
                ...state, activeConversationId: action.conversationId,
                preview: closedPreview(state.preview), panelTab: 'steps',
            };
        case 'search:set':
            return { ...state, searchQuery: action.query };
        case 'workspace:error':
            return { ...state, error: action.error };
        case 'workspace:sending':
            return { ...state, sending: action.sending };
        case 'workspace:options':
            return { ...state, ...action.options };
        case 'composer:restore':
            return { ...state, composerByConversation: action.composers };
        case 'composer:request':
            return withComposer(state, action.conversationId, composer => ({ ...composer, requestId: action.requestId, requestSignature: action.requestSignature }));
        case 'sidebar:toggle':
            return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
        case 'panel:set':
            // Visibility only changes through an explicit `open`. Switching tabs — or
            // any control inside the panel — must never close it.
            return {
                ...state,
                panelOpen: action.open ?? state.panelOpen,
                panelTab: action.tab ?? state.panelTab,
            };
        case 'model:select':
            return { ...state, selectedModelId: action.modelId };
        case 'settings:loaded':
            return { ...applySettings(state, action.settings), providers: action.providers ?? state.providers };
        case 'settings:patch':
            return applySettings(state, action.patch);
        case 'settings:open':
            return { ...state, settingsOpen: true, settingsTab: action.tab ?? state.settingsTab };
        case 'settings:close':
            return { ...state, settingsOpen: false, modelDialog: { open: false, editingId: null } };
        case 'settings:tab':
            return { ...state, settingsTab: action.tab };
        case 'models:sync':
            return {
                ...state,
                models: action.models,
                selectedModelId: action.models.some((model) => model.id === state.selectedModelId)
                    ? state.selectedModelId
                    : action.models[0]?.id ?? '',
            };
        case 'modelDialog:open':
            return { ...state, modelDialog: { open: true, editingId: action.modelId ?? null } };
        case 'modelDialog:close':
            return { ...state, modelDialog: { open: false, editingId: null } };
        case 'preview:open': {
            // A page switch drops everything that belonged to the previous page —
            // the comparison revision and the selected annotation above all.
            const samePage = state.preview.pageId === action.pageId && state.preview.conversationId === action.conversationId;
            return {
                ...state,
                preview: {
                    ...state.preview,
                    open: true,
                    conversationId: action.conversationId,
                    pageId: action.pageId,
                    revisionId: action.revisionId ?? (samePage ? state.preview.revisionId : undefined),
                    compareRevisionId: samePage ? state.preview.compareRevisionId : undefined,
                    selectedAnnotationId: samePage ? state.preview.selectedAnnotationId : undefined,
                    nonce: state.preview.nonce + 1,
                    height: 0,
                },
            };
        }
        case 'preview:close':
            return { ...state, preview: closedPreview(state.preview) };
        case 'preview:loaded': {
            let next = state;
            action.revisions.forEach((revision) => {
                next = mergeRevision(next, revision);
            });
            const annotations = { ...next.annotations };
            action.annotations.forEach((annotation) => {
                annotations[annotation.id] = annotation;
            });
            const newest = [...action.revisions].sort((a, b) => b.revision - a.revision)[0];
            return {
                ...next,
                annotations,
                preview: {
                    ...next.preview,
                    revisionId: next.preview.revisionId ?? newest?.id,
                },
            };
        }
        case 'preview:device':
            return {
                ...state,
                preview: {
                    ...state.preview,
                    device: action.device,
                    width: DEFAULT_PREVIEW_WIDTH[action.device],
                },
            };
        case 'preview:width':
            return { ...state, preview: { ...state.preview, width: Math.max(320, Math.min(1920, action.width)) } };
        case 'preview:zoom':
            return { ...state, preview: { ...state.preview, zoom: action.zoom } };
        case 'preview:annotate':
            return {
                ...state,
                preview: {
                    ...state.preview,
                    annotate: action.enabled,
                    selectedAnnotationId: action.enabled ? state.preview.selectedAnnotationId : undefined,
                },
            };
        case 'preview:revision':
            return {
                ...state,
                preview: { ...state.preview, revisionId: action.revisionId, annotate: false, nonce: state.preview.nonce + 1 },
            };
        case 'preview:compare':
            return { ...state, preview: { ...state.preview, compareRevisionId: action.revisionId } };
        case 'preview:reload':
            return { ...state, preview: { ...state.preview, nonce: state.preview.nonce + 1 } };
        case 'preview:height':
            return { ...state, preview: { ...state.preview, height: action.height } };
        case 'preview:selectAnnotation':
            return { ...state, preview: { ...state.preview, selectedAnnotationId: action.annotationId } };
        case 'annotation:add':
            return {
                ...mergeAnnotation(state, action.annotation),
                annotationOwners: { ...state.annotationOwners, [action.annotation.id]: action.conversationId },
            };
        case 'annotation:comment': {
            const annotation = state.annotations[action.annotationId];
            if (!annotation)
                return state;
            return mergeAnnotation(state, { ...annotation, comment: action.comment });
        }
        case 'annotation:remove': {
            const annotations = { ...state.annotations };
            const annotationOwners = { ...state.annotationOwners };
            delete annotations[action.annotationId];
            delete annotationOwners[action.annotationId];
            return {
                ...state,
                annotations,
                annotationOwners,
                preview: {
                    ...state.preview,
                    selectedAnnotationId: state.preview.selectedAnnotationId === action.annotationId ? undefined : state.preview.selectedAnnotationId,
                },
            };
        }
        case 'annotation:undo': {
            const drafts = draftAnnotationsOf(state).sort((a, b) => b.createdAt - a.createdAt);
            const last = drafts[0];
            if (!last)
                return state;
            const annotations = { ...state.annotations };
            const annotationOwners = { ...state.annotationOwners };
            delete annotations[last.id];
            delete annotationOwners[last.id];
            return { ...state, annotations, annotationOwners };
        }
        case 'annotations:merge': {
            const annotations = { ...state.annotations };
            action.annotations.forEach((annotation) => {
                annotations[annotation.id] = annotation;
            });
            return { ...state, annotations };
        }
        case 'composer:text':
            return withComposer(state, action.conversationId, (composer) => ({ ...composer, text: action.text }));
        case 'composer:attachments':
            return withComposer(state, action.conversationId, (composer) => ({
                ...composer,
                attachments: [...composer.attachments, ...action.attachments],
            }));
        case 'composer:attachmentPatch':
            return withComposer(state, action.conversationId, (composer) => ({
                ...composer,
                attachments: composer.attachments.map((attachment) => attachment.id === action.attachmentId ? { ...attachment, ...action.patch } : attachment),
            }));
        case 'composer:removeAttachment':
            return withComposer(state, action.conversationId, (composer) => ({
                ...composer,
                attachments: composer.attachments.filter((attachment) => attachment.id !== action.attachmentId),
            }));
        case 'composer:clear':
            return withComposer(state, action.conversationId, () => ({ text: '', attachments: [] }));
        case 'confirm:delete':
            return { ...state, confirmDeleteConversationId: action.conversationId };
        case 'agent:event':
            return applyEvent(state, action.event);
        default:
            return state;
    }
}
