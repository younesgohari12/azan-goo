import type {
  ActionResult,
  AdapterCapabilities,
  AgentModel,
  Annotation,
  Approval,
  Attachment,
  Conversation,
  Message,
  PreviewDevice,
  PreviewRevision,
  Task,
} from '@/types/model'

/**
 * `fit` shrinks the device frame so the whole page is visible inside the
 * workspace; `actual` shows it at 100% and lets the canvas scroll. This is a
 * presentation-only scale — the device width stays what the user selected, so
 * annotations keep matching the viewport they were drawn on.
 */
export type PreviewZoom = 'fit' | 'actual'

export interface PreviewState {
  open: boolean
  pageId?: string
  /** Revision currently rendered in the workspace. */
  revisionId?: string
  /** Older/newer revision selected for comparison. */
  compareRevisionId?: string
  device: PreviewDevice
  width: number
  zoom: PreviewZoom
  annotate: boolean
  selectedAnnotationId?: string
  /** Bumped to force the iframe to reload the document. */
  nonce: number
  /** Document height reported by the preview bridge. */
  height: number
}

export interface ComposerState {
  text: string
  attachments: Attachment[]
}

export interface YAgentState {
  booted: boolean
  capabilities: AdapterCapabilities
  models: AgentModel[]
  selectedModelId: string

  conversations: Conversation[]
  activeConversationId: string | null
  messagesByConversation: Record<string, Message[]>

  tasks: Record<string, Task>
  approvals: Record<string, Approval>
  results: Record<string, ActionResult>
  revisions: Record<string, PreviewRevision>
  revisionIdsByPage: Record<string, string[]>
  annotations: Record<string, Annotation>

  searchQuery: string
  sidebarCollapsed: boolean
  panelOpen: boolean
  panelTab: 'steps' | 'feedback'

  preview: PreviewState
  composerByConversation: Record<string, ComposerState>
  confirmDeleteConversationId: string | null
}

export const DEFAULT_PREVIEW_WIDTH: Record<PreviewDevice, number> = {
  desktop: 1280,
  tablet: 820,
  mobile: 390,
}

export function createInitialState(capabilities: AdapterCapabilities): YAgentState {
  return {
    booted: false,
    capabilities,
    models: [],
    selectedModelId: 'yagent-1',

    conversations: [],
    activeConversationId: null,
    messagesByConversation: {},

    tasks: {},
    approvals: {},
    results: {},
    revisions: {},
    revisionIdsByPage: {},
    annotations: {},

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
  }
}

export const EMPTY_COMPOSER: ComposerState = { text: '', attachments: [] }

export function composerOf(state: YAgentState, conversationId: string | null): ComposerState {
  if (!conversationId) return EMPTY_COMPOSER
  return state.composerByConversation[conversationId] ?? EMPTY_COMPOSER
}

export function messagesOf(state: YAgentState, conversationId: string | null): Message[] {
  if (!conversationId) return []
  return state.messagesByConversation[conversationId] ?? []
}

/**
 * The conversation that owns the page currently shown in the preview workspace.
 * A preview belongs to exactly one conversation, and feedback may only travel to
 * that one — otherwise notes drawn on one page could be filed under an unrelated
 * chat.
 */
export function conversationOwningPage(state: YAgentState, pageId?: string): Conversation | undefined {
  if (!pageId) return undefined
  return state.conversations.find((conversation) => conversation.previewPageId === pageId)
}

export function revisionsOfPage(state: YAgentState, pageId?: string): PreviewRevision[] {
  if (!pageId) return []
  const ids = state.revisionIdsByPage[pageId] ?? []
  return ids.map((id) => state.revisions[id]).filter(Boolean)
}

export function currentTaskOf(state: YAgentState, conversationId: string | null): Task | undefined {
  if (!conversationId) return undefined
  const list = Object.values(state.tasks)
    .filter((task) => task.conversationId === conversationId)
    .sort((a, b) => a.startedAt - b.startedAt)
  return list.at(-1)
}

export function draftAnnotationsOf(state: YAgentState): Annotation[] {
  const { revisionId } = state.preview
  if (!revisionId) return []
  return Object.values(state.annotations)
    .filter((annotation) => annotation.revisionId === revisionId && annotation.status === 'draft')
    .sort((a, b) => a.index - b.index)
}

export function pageAnnotationsOf(state: YAgentState, pageId?: string): Annotation[] {
  if (!pageId) return []
  return Object.values(state.annotations)
    .filter((annotation) => annotation.pageId === pageId)
    .sort((a, b) => b.createdAt - a.createdAt)
}
