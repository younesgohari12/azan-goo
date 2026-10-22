import type { AgentEvent } from '@/adapters/types'
import type {
  ActionResult,
  Annotation,
  Approval,
  Attachment,
  Conversation,
  Message,
  PreviewDevice,
  PreviewRevision,
  Task,
  TaskStep,
} from '@/types/model'
import { DEFAULT_PREVIEW_WIDTH, type ComposerState, type PreviewZoom, type YAgentState } from './state'

export type YAgentAction =
  | { type: 'booted'; conversations: Conversation[]; models: YAgentState['models'] }
  | { type: 'conversations:sync'; conversations: Conversation[] }
  | {
      type: 'conversation:loaded'
      conversationId: string
      messages: Message[]
      tasks: Task[]
      approvals: Approval[]
      results: ActionResult[]
      annotations: Annotation[]
      revisions: PreviewRevision[]
    }
  | { type: 'conversation:select'; conversationId: string }
  | { type: 'search:set'; query: string }
  | { type: 'sidebar:toggle' }
  | { type: 'panel:set'; open?: boolean; tab?: 'steps' | 'feedback' }
  | { type: 'model:select'; modelId: string }
  | { type: 'preview:open'; pageId: string; revisionId?: string }
  | { type: 'preview:close' }
  | { type: 'preview:loaded'; revisions: PreviewRevision[]; annotations: Annotation[] }
  | { type: 'preview:device'; device: PreviewDevice }
  | { type: 'preview:width'; width: number }
  | { type: 'preview:zoom'; zoom: PreviewZoom }
  | { type: 'preview:annotate'; enabled: boolean }
  | { type: 'preview:revision'; revisionId: string }
  | { type: 'preview:compare'; revisionId?: string }
  | { type: 'preview:reload' }
  | { type: 'preview:height'; height: number }
  | { type: 'preview:selectAnnotation'; annotationId?: string }
  | { type: 'annotation:add'; annotation: Annotation }
  | { type: 'annotation:comment'; annotationId: string; comment: string }
  | { type: 'annotation:remove'; annotationId: string }
  | { type: 'annotation:undo' }
  | { type: 'annotations:merge'; annotations: Annotation[] }
  | { type: 'composer:text'; conversationId: string; text: string }
  | { type: 'composer:attachments'; conversationId: string; attachments: Attachment[] }
  | { type: 'composer:attachmentPatch'; conversationId: string; attachmentId: string; patch: Partial<Attachment> }
  | { type: 'composer:removeAttachment'; conversationId: string; attachmentId: string }
  | { type: 'composer:clear'; conversationId: string }
  | { type: 'confirm:delete'; conversationId: string | null }
  | { type: 'agent:event'; event: AgentEvent }

function withComposer(
  state: YAgentState,
  conversationId: string,
  update: (composer: ComposerState) => ComposerState,
): YAgentState {
  const current = state.composerByConversation[conversationId] ?? { text: '', attachments: [] }
  return {
    ...state,
    composerByConversation: { ...state.composerByConversation, [conversationId]: update(current) },
  }
}

function mergeMessages(state: YAgentState, conversationId: string, update: (list: Message[]) => Message[]): YAgentState {
  const current = state.messagesByConversation[conversationId] ?? []
  return { ...state, messagesByConversation: { ...state.messagesByConversation, [conversationId]: update(current) } }
}

/**
 * Adds restored entities that state does not know yet. Existing entries are kept
 * untouched: a live event is always newer than a snapshot being loaded.
 */
function mergeMissing<T extends { id: string }>(current: Record<string, T>, items: T[]): Record<string, T> {
  const next = { ...current }
  items.forEach((item) => {
    if (!next[item.id]) next[item.id] = item
  })
  return next
}

function mergeAnnotation(state: YAgentState, annotation: Annotation): YAgentState {
  return { ...state, annotations: { ...state.annotations, [annotation.id]: annotation } }
}

function mergeRevision(state: YAgentState, revision: PreviewRevision): YAgentState {
  const ids = state.revisionIdsByPage[revision.pageId] ?? []
  const nextIds = ids.includes(revision.id)
    ? ids
    : [...ids, revision.id].sort(
        (a, b) => (state.revisions[a]?.revision ?? 0) - (state.revisions[b]?.revision ?? 0),
      )
  return {
    ...state,
    revisions: { ...state.revisions, [revision.id]: revision },
    revisionIdsByPage: { ...state.revisionIdsByPage, [revision.pageId]: nextIds },
  }
}

function applyEvent(state: YAgentState, event: AgentEvent): YAgentState {
  switch (event.type) {
    case 'conversation:changed': {
      const { conversation, reason } = event
      if (reason === 'deleted') {
        const conversations = state.conversations.filter((item) => item.id !== conversation.id)
        const messagesByConversation = { ...state.messagesByConversation }
        delete messagesByConversation[conversation.id]
        return {
          ...state,
          conversations,
          messagesByConversation,
          activeConversationId: state.activeConversationId === conversation.id ? conversations[0]?.id ?? null : state.activeConversationId,
          preview:
            state.preview.open && state.conversations.find((item) => item.id === conversation.id)?.previewPageId === state.preview.pageId
              ? { ...state.preview, open: false, annotate: false }
              : state.preview,
        }
      }
      const exists = state.conversations.some((item) => item.id === conversation.id)
      const conversations = exists
        ? state.conversations.map((item) => (item.id === conversation.id ? conversation : item))
        : [conversation, ...state.conversations]
      return { ...state, conversations }
    }

    case 'messages:loaded':
      return {
        ...state,
        messagesByConversation: { ...state.messagesByConversation, [event.conversationId]: event.messages },
      }

    case 'message:created': {
      const message = event.message
      return mergeMessages(state, event.conversationId, (list) =>
        list.some((item) => item.id === message.id) ? list : [...list, message],
      )
    }

    case 'message:delta':
      return mergeMessages(state, event.conversationId, (list) =>
        list.map((item) => (item.id === event.messageId ? { ...item, text: (item.text ?? '') + event.delta } : item)),
      )

    case 'message:updated':
      return mergeMessages(state, event.conversationId, (list) =>
        list.map((item) => (item.id === event.messageId ? { ...item, ...event.patch } : item)),
      )

    case 'task:created':
      return { ...state, tasks: { ...state.tasks, [event.task.id]: event.task } }

    case 'task:updated': {
      const task = state.tasks[event.taskId]
      if (!task) return state
      return { ...state, tasks: { ...state.tasks, [event.taskId]: { ...task, ...event.patch } } }
    }

    case 'task:step': {
      const task = state.tasks[event.taskId]
      if (!task) return state
      const steps: TaskStep[] = task.steps.map((step) => (step.id === event.step.id ? event.step : step))
      return { ...state, tasks: { ...state.tasks, [event.taskId]: { ...task, steps } } }
    }

    case 'approval:created':
      return { ...state, approvals: { ...state.approvals, [event.approval.id]: event.approval } }

    case 'approval:updated': {
      const approval = state.approvals[event.approvalId]
      if (!approval) return state
      return {
        ...state,
        approvals: { ...state.approvals, [event.approvalId]: { ...approval, ...event.patch } },
      }
    }

    case 'result:created':
      return { ...state, results: { ...state.results, [event.result.id]: event.result } }

    case 'preview:ready': {
      const next = mergeRevision(state, event.revision)
      const viewing = state.preview
      if (!viewing.open || viewing.pageId !== event.revision.pageId) return next
      const current = viewing.revisionId ? state.revisions[viewing.revisionId] : undefined
      const shouldFollow = !current || event.revision.revision >= current.revision
      return {
        ...next,
        preview: shouldFollow ? { ...next.preview, revisionId: event.revision.id, nonce: next.preview.nonce + 1 } : next.preview,
      }
    }

    case 'annotations:updated': {
      const annotations = { ...state.annotations }
      event.annotations.forEach((annotation) => {
        annotations[annotation.id] = annotation
      })
      return { ...state, annotations }
    }

    default:
      return state
  }
}

export function reducer(state: YAgentState, action: YAgentAction): YAgentState {
  switch (action.type) {
    case 'booted':
      return {
        ...state,
        booted: true,
        conversations: action.conversations,
        models: action.models,
        activeConversationId: state.activeConversationId ?? action.conversations[0]?.id ?? null,
      }

    case 'conversations:sync':
      return { ...state, conversations: action.conversations }

    case 'conversation:loaded': {
      let next: YAgentState = {
        ...state,
        messagesByConversation: { ...state.messagesByConversation, [action.conversationId]: action.messages },
        tasks: mergeMissing(state.tasks, action.tasks),
        approvals: mergeMissing(state.approvals, action.approvals),
        results: mergeMissing(state.results, action.results),
        annotations: mergeMissing(state.annotations, action.annotations),
      }
      // Restored revisions let a result card resolve its page and reopen the
      // preview, even after a reload.
      action.revisions.forEach((revision) => {
        next = mergeRevision(next, revision)
      })
      return next
    }

    case 'conversation:select': {
      if (action.conversationId === state.activeConversationId) return state
      const target = state.conversations.find((item) => item.id === action.conversationId)
      // A preview (and the notes written on it) belongs to one conversation.
      // Switching to a conversation that does not own the open page closes the
      // workspace instead of leaving the previous page's notes attached to an
      // unrelated chat. Drafts stay stored — they reappear with their own page.
      const keepPreview = Boolean(
        state.preview.open && target?.previewPageId && target.previewPageId === state.preview.pageId,
      )
      return {
        ...state,
        activeConversationId: action.conversationId,
        preview: keepPreview
          ? state.preview
          : { ...state.preview, open: false, annotate: false, selectedAnnotationId: undefined },
      }
    }

    case 'search:set':
      return { ...state, searchQuery: action.query }

    case 'sidebar:toggle':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }

    case 'panel:set':
      return {
        ...state,
        panelOpen: action.open ?? !state.panelOpen,
        panelTab: action.tab ?? state.panelTab,
      }

    case 'model:select':
      return { ...state, selectedModelId: action.modelId }

    case 'preview:open': {
      // Opening page B must not inherit page A's revision: the workspace would
      // render the wrong page until something else replaced it. The revision is
      // only carried over when the same page is reopened.
      const samePage = state.preview.pageId === action.pageId
      return {
        ...state,
        preview: {
          ...state.preview,
          open: true,
          pageId: action.pageId,
          revisionId: samePage ? (action.revisionId ?? state.preview.revisionId) : action.revisionId,
          nonce: state.preview.nonce + 1,
          height: 0,
        },
      }
    }

    case 'preview:close':
      return { ...state, preview: { ...state.preview, open: false, annotate: false, selectedAnnotationId: undefined } }

    case 'preview:loaded': {
      let next = state
      action.revisions.forEach((revision) => {
        next = mergeRevision(next, revision)
      })
      const annotations = { ...next.annotations }
      action.annotations.forEach((annotation) => {
        annotations[annotation.id] = annotation
      })
      const newest = [...action.revisions].sort((a, b) => b.revision - a.revision)[0]
      const current = next.preview.revisionId ? next.revisions[next.preview.revisionId] : undefined
      const belongsToOpenPage = current && current.pageId === next.preview.pageId
      return {
        ...next,
        annotations,
        preview: {
          ...next.preview,
          revisionId: belongsToOpenPage ? next.preview.revisionId : newest?.id,
        },
      }
    }

    case 'preview:device':
      return {
        ...state,
        preview: {
          ...state.preview,
          device: action.device,
          width: DEFAULT_PREVIEW_WIDTH[action.device],
        },
      }

    case 'preview:width':
      return { ...state, preview: { ...state.preview, width: Math.max(320, Math.min(1920, action.width)) } }

    case 'preview:zoom':
      return { ...state, preview: { ...state.preview, zoom: action.zoom } }

    case 'preview:annotate':
      return {
        ...state,
        preview: {
          ...state.preview,
          annotate: action.enabled,
          selectedAnnotationId: action.enabled ? state.preview.selectedAnnotationId : undefined,
        },
      }

    case 'preview:revision':
      return {
        ...state,
        preview: { ...state.preview, revisionId: action.revisionId, annotate: false, nonce: state.preview.nonce + 1 },
      }

    case 'preview:compare':
      return { ...state, preview: { ...state.preview, compareRevisionId: action.revisionId } }

    case 'preview:reload':
      return { ...state, preview: { ...state.preview, nonce: state.preview.nonce + 1 } }

    case 'preview:height':
      return { ...state, preview: { ...state.preview, height: action.height } }

    case 'preview:selectAnnotation':
      return { ...state, preview: { ...state.preview, selectedAnnotationId: action.annotationId } }

    case 'annotation:add':
      return mergeAnnotation(state, action.annotation)

    case 'annotation:comment': {
      const annotation = state.annotations[action.annotationId]
      if (!annotation) return state
      return mergeAnnotation(state, { ...annotation, comment: action.comment })
    }

    case 'annotation:remove': {
      const annotations = { ...state.annotations }
      delete annotations[action.annotationId]
      return {
        ...state,
        annotations,
        preview: {
          ...state.preview,
          selectedAnnotationId:
            state.preview.selectedAnnotationId === action.annotationId ? undefined : state.preview.selectedAnnotationId,
        },
      }
    }

    case 'annotation:undo': {
      const drafts = Object.values(state.annotations)
        .filter((annotation) => annotation.status === 'draft')
        .sort((a, b) => b.createdAt - a.createdAt)
      const last = drafts[0]
      if (!last) return state
      const annotations = { ...state.annotations }
      delete annotations[last.id]
      return { ...state, annotations }
    }

    case 'annotations:merge': {
      const annotations = { ...state.annotations }
      action.annotations.forEach((annotation) => {
        annotations[annotation.id] = annotation
      })
      return { ...state, annotations }
    }

    case 'composer:text':
      return withComposer(state, action.conversationId, (composer) => ({ ...composer, text: action.text }))

    case 'composer:attachments':
      return withComposer(state, action.conversationId, (composer) => ({
        ...composer,
        attachments: [...composer.attachments, ...action.attachments],
      }))

    case 'composer:attachmentPatch':
      return withComposer(state, action.conversationId, (composer) => ({
        ...composer,
        attachments: composer.attachments.map((attachment) =>
          attachment.id === action.attachmentId ? { ...attachment, ...action.patch } : attachment,
        ),
      }))

    case 'composer:removeAttachment':
      return withComposer(state, action.conversationId, (composer) => ({
        ...composer,
        attachments: composer.attachments.filter((attachment) => attachment.id !== action.attachmentId),
      }))

    case 'composer:clear':
      return withComposer(state, action.conversationId, () => ({ text: '', attachments: [] }))

    case 'confirm:delete':
      return { ...state, confirmDeleteConversationId: action.conversationId }

    case 'agent:event':
      return applyEvent(state, action.event)

    default:
      return state
  }
}
