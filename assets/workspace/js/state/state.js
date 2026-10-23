export const DEFAULT_PREVIEW_WIDTH = {
    desktop: 1280,
    tablet: 820,
    mobile: 390,
};
export const SETTINGS_TABS = ['models', 'run', 'consumption', 'chat'];
/** Defaults for the settings view; the adapter replaces them once it boots. */
export function createDefaultSettings() {
    return {
        readOnly: false,
        autoInstall: false,
        activeProvider: '',
        activeModelId: '',
        consumption: { mode: 'capped', monthlyTokens: 2000000, requestTokens: 32000, stopOnLimit: true, notifyAtPercent: 80 },
        draft: { keepDrafts: true, keepAttachments: true, confirmDelete: true, titleGeneration: 'auto' },
        appearance: { density: 'comfortable', fontScale: 'md', showTimestamps: true, reduceMotion: false, accent: 'violet' },
    };
}
export function createInitialState(capabilities) {
    return {
        booted: false,
        capabilities,
        models: [],
        selectedModelId: 'yagent-1',
        conversations: [],
        activeConversationId: 'draft',
        error: null,
        sending: false,
        executionMode: 'chat',
        readOnly: true,
        workspace: {},
        providers: [],
        settings: createDefaultSettings(),
        settingsOpen: false,
        settingsTab: 'models',
        modelDialog: { open: false, editingId: null },
        messagesByConversation: {},
        conversationVersions: {},
        tasks: {},
        approvals: {},
        results: {},
        revisions: {},
        revisionIdsByPage: {},
        annotations: {},
        annotationOwners: {},
        searchQuery: '',
        sidebarCollapsed: false,
        panelOpen: true,
        panelTab: 'steps',
        preview: {
            open: false,
            device: 'desktop',
            width: DEFAULT_PREVIEW_WIDTH.desktop,
            zoom: 'fit',
            annotate: false,
            nonce: 0,
            height: 0,
        },
        composerByConversation: {},
        confirmDeleteConversationId: null,
    };
}
export const EMPTY_COMPOSER = { text: '', attachments: [] };
export function composerOf(state, conversationId) {
    if (!conversationId)
        return EMPTY_COMPOSER;
    return state.composerByConversation[conversationId] ?? EMPTY_COMPOSER;
}
export function messagesOf(state, conversationId) {
    if (!conversationId)
        return [];
    return state.messagesByConversation[conversationId] ?? [];
}
export function revisionsOfPage(state, pageId) {
    if (!pageId)
        return [];
    const ids = state.revisionIdsByPage[pageId] ?? [];
    return ids.map((id) => state.revisions[id]).filter(Boolean);
}
export function currentTaskOf(state, conversationId) {
    if (!conversationId)
        return undefined;
    const list = Object.values(state.tasks)
        .filter((task) => task.conversationId === conversationId)
        .sort((a, b) => a.startedAt - b.startedAt);
    return list.at(-1);
}
export function draftAnnotationsOf(state) {
    const { revisionId, open, conversationId } = state.preview;
    if (!open || !revisionId || !conversationId || conversationId !== state.activeConversationId)
        return [];
    return Object.values(state.annotations)
        .filter((annotation) => annotation.revisionId === revisionId && annotation.status === 'draft'
        && state.annotationOwners[annotation.id] === conversationId)
        .sort((a, b) => a.index - b.index);
}
export function pageAnnotationsOf(state, pageId) {
    if (!pageId)
        return [];
    return Object.values(state.annotations)
        .filter((annotation) => annotation.pageId === pageId)
        .sort((a, b) => b.createdAt - a.createdAt);
}
