import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'

import { createYAgentAdapter } from '@/adapters'
import type { ApprovalDecision, YAgentAdapter } from '@/adapters/types'
import type { Annotation, Attachment, PreviewDevice } from '@/types/model'
import { percentOf, uid } from '@/lib/utils'
import {
  composerOf,
  createInitialState,
  currentTaskOf,
  draftAnnotationsOf,
  messagesOf,
  pageAnnotationsOf,
  revisionsOfPage,
  type YAgentState,
} from './state'
import { reducer } from './reducer'

export interface BridgeAnnotationDraft {
  kind: Annotation['kind']
  rect: Annotation['rect']
  elementId?: string
  elementLabel?: string
}

export interface YAgentActions {
  selectConversation: (conversationId: string) => void
  newConversation: () => Promise<void>
  renameConversation: (conversationId: string, title: string) => Promise<void>
  togglePin: (conversationId: string) => Promise<void>
  requestDelete: (conversationId: string) => void
  confirmDelete: () => Promise<void>
  dismissDelete: () => void
  setSearch: (query: string) => void
  toggleSidebar: () => void
  setPanel: (options: { open?: boolean; tab?: 'steps' | 'feedback' }) => void
  setModel: (modelId: string) => void
  setComposerText: (text: string) => void
  addAttachments: (files: File[]) => void
  removeAttachment: (attachmentId: string) => void
  send: () => Promise<void>
  sendPrompt: (text: string) => Promise<void>
  stop: () => Promise<void>
  resolveApproval: (approvalId: string, decision: ApprovalDecision) => Promise<void>
  publishRevision: (revisionId: string) => Promise<void>
  openPreview: (pageId: string, revisionId?: string) => Promise<void>
  closePreview: () => void
  setDevice: (device: PreviewDevice) => void
  setPreviewWidth: (width: number) => void
  setFit: (fit: boolean) => void
  setAnnotate: (enabled: boolean) => void
  selectRevision: (revisionId: string) => void
  setCompareRevision: (revisionId?: string) => void
  reloadPreview: () => void
  reportPreviewHeight: (height: number) => void
  selectAnnotation: (annotationId?: string) => void
  addBridgeAnnotation: (draft: BridgeAnnotationDraft) => void
  updateAnnotationComment: (annotationId: string, comment: string) => void
  removeAnnotation: (annotationId: string) => void
  undoAnnotation: () => void
  resolveAnnotation: (annotationId: string) => Promise<void>
  sendFeedback: () => Promise<void>
}

interface YAgentContextValue {
  state: YAgentState
  adapter: YAgentAdapter
  actions: YAgentActions
  derived: {
    activeConversation: YAgentState['conversations'][number] | undefined
    messages: ReturnType<typeof messagesOf>
    currentTask: ReturnType<typeof currentTaskOf>
    taskProgress: { done: number; total: number; percent: number; failed: number; waiting: number }
    running: boolean
    draftAnnotations: Annotation[]
    pageAnnotations: Annotation[]
    revisions: ReturnType<typeof revisionsOfPage>
    currentRevision: YAgentState['revisions'][string] | undefined
    pendingApproval: YAgentState['approvals'][string] | undefined
    canSend: boolean
  }
}

const YAgentContext = createContext<YAgentContextValue | null>(null)

function toAttachment(file: File): Attachment {
  const isImage = file.type.startsWith('image/')
  return {
    id: uid('att'),
    name: file.name,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    status: 'uploading',
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
  }
}

export function YAgentProvider({
  children,
  adapter: injectedAdapter,
}: {
  children: ReactNode
  adapter?: YAgentAdapter
}) {
  const adapter = useMemo(() => injectedAdapter ?? createYAgentAdapter(), [injectedAdapter])
  const [state, dispatch] = useReducer(reducer, adapter.capabilities, createInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [conversations, models] = await Promise.all([adapter.listConversations(), adapter.listModels()])
      if (cancelled) return
      dispatch({ type: 'booted', conversations, models })
    })()
    return () => {
      cancelled = true
    }
  }, [adapter])

  useEffect(() => adapter.subscribe((event) => dispatch({ type: 'agent:event', event })), [adapter])

  const activeConversationId = state.activeConversationId
  useEffect(() => {
    if (!activeConversationId) return
    let cancelled = false
    void (async () => {
      const snapshot = await adapter.getConversationSnapshot(activeConversationId)
      if (cancelled) return
      dispatch({ type: 'conversation:loaded', conversationId: activeConversationId, ...snapshot })
    })()
    return () => {
      cancelled = true
    }
  }, [adapter, activeConversationId])

  const actions = useMemo<YAgentActions>(() => {
    const activeId = () => stateRef.current.activeConversationId

    return {
      selectConversation(conversationId) {
        dispatch({ type: 'conversation:select', conversationId })
      },
      async newConversation() {
        const conversation = await adapter.createConversation()
        dispatch({ type: 'conversation:select', conversationId: conversation.id })
      },
      async renameConversation(conversationId, title) {
        await adapter.renameConversation(conversationId, title)
      },
      async togglePin(conversationId) {
        const conversation = stateRef.current.conversations.find((item) => item.id === conversationId)
        if (!conversation) return
        await adapter.setConversationPinned(conversationId, !conversation.pinned)
      },
      requestDelete(conversationId) {
        dispatch({ type: 'confirm:delete', conversationId })
      },
      async confirmDelete() {
        const conversationId = stateRef.current.confirmDeleteConversationId
        if (!conversationId) return
        dispatch({ type: 'confirm:delete', conversationId: null })
        await adapter.deleteConversation(conversationId)
      },
      dismissDelete() {
        dispatch({ type: 'confirm:delete', conversationId: null })
      },
      setSearch(query) {
        dispatch({ type: 'search:set', query })
      },
      toggleSidebar() {
        dispatch({ type: 'sidebar:toggle' })
      },
      setPanel(options) {
        dispatch({ type: 'panel:set', open: options.open, tab: options.tab })
      },
      setModel(modelId) {
        dispatch({ type: 'model:select', modelId })
      },
      setComposerText(text) {
        const conversationId = activeId()
        if (!conversationId) return
        dispatch({ type: 'composer:text', conversationId, text })
      },
      addAttachments(files) {
        const conversationId = activeId()
        if (!conversationId || files.length === 0) return
        const attachments = files.map(toAttachment)
        dispatch({ type: 'composer:attachments', conversationId, attachments })
        attachments.forEach((attachment, index) => {
          window.setTimeout(
            () => dispatch({ type: 'composer:attachmentPatch', conversationId, attachmentId: attachment.id, patch: { status: 'ready' } }),
            500 + index * 260,
          )
        })
      },
      removeAttachment(attachmentId) {
        const conversationId = activeId()
        if (!conversationId) return
        const composer = composerOf(stateRef.current, conversationId)
        const attachment = composer.attachments.find((item) => item.id === attachmentId)
        if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
        dispatch({ type: 'composer:removeAttachment', conversationId, attachmentId })
      },
      async send() {
        const conversationId = activeId()
        if (!conversationId) return
        const composer = composerOf(stateRef.current, conversationId)
        const text = composer.text.trim()
        if (!text && composer.attachments.length === 0) return
        const attachments = composer.attachments.map((attachment) => ({ ...attachment }))
        dispatch({ type: 'composer:clear', conversationId })
        await adapter.sendMessage({
          conversationId,
          text: text || 'این فایل را بررسی کن.',
          attachments,
          modelId: stateRef.current.selectedModelId,
        })
      },
      async stop() {
        const conversationId = activeId()
        if (!conversationId) return
        await adapter.stopTask(conversationId)
      },
      async sendPrompt(text) {
        const conversationId = activeId()
        if (!conversationId || !text.trim()) return
        dispatch({ type: 'composer:clear', conversationId })
        await adapter.sendMessage({
          conversationId,
          text,
          attachments: [],
          modelId: stateRef.current.selectedModelId,
        })
      },
      async resolveApproval(approvalId, decision) {
        await adapter.resolveApproval(approvalId, decision)
      },
      async publishRevision(revisionId) {
        await adapter.publishRevision(revisionId)
      },
      async openPreview(pageId, revisionId) {
        const current = stateRef.current.preview
        dispatch({
          type: 'preview:open',
          pageId,
          revisionId: current.pageId === pageId ? current.revisionId : revisionId,
        })
        dispatch({ type: 'panel:set', open: false })
        const preview = await adapter.getPagePreview(pageId)
        dispatch({ type: 'preview:loaded', revisions: preview.revisions, annotations: preview.annotations })
        if (revisionId) dispatch({ type: 'preview:revision', revisionId })
      },
      closePreview() {
        dispatch({ type: 'preview:close' })
      },
      setDevice(device) {
        dispatch({ type: 'preview:device', device })
      },
      setPreviewWidth(width) {
        dispatch({ type: 'preview:width', width })
      },
      setFit(fit) {
        dispatch({ type: 'preview:fit', fit })
      },
      setAnnotate(enabled) {
        dispatch({ type: 'preview:annotate', enabled })
        if (enabled) dispatch({ type: 'panel:set', open: true, tab: 'feedback' })
      },
      selectRevision(revisionId) {
        dispatch({ type: 'preview:revision', revisionId })
      },
      setCompareRevision(revisionId) {
        dispatch({ type: 'preview:compare', revisionId })
      },
      reloadPreview() {
        dispatch({ type: 'preview:reload' })
      },
      reportPreviewHeight(height) {
        dispatch({ type: 'preview:height', height })
      },
      selectAnnotation(annotationId) {
        dispatch({ type: 'preview:selectAnnotation', annotationId })
      },
      addBridgeAnnotation(draft) {
        const { preview, annotations } = stateRef.current
        if (!preview.pageId || !preview.revisionId) return
        const sameRevision = Object.values(annotations).filter(
          (annotation) => annotation.revisionId === preview.revisionId,
        )
        const nextIndex = sameRevision.reduce((max, annotation) => Math.max(max, annotation.index), 0) + 1
        const annotation: Annotation = {
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
        }
        dispatch({ type: 'annotation:add', annotation })
        dispatch({ type: 'preview:selectAnnotation', annotationId: annotation.id })
        /* The note is written right after the mark is placed: make sure the
           feedback surface is reachable (it is a drawer below 1280px). */
        if (!stateRef.current.panelOpen) dispatch({ type: 'panel:set', open: true, tab: 'feedback' })
      },
      updateAnnotationComment(annotationId, comment) {
        dispatch({ type: 'annotation:comment', annotationId, comment })
      },
      removeAnnotation(annotationId) {
        const annotation = stateRef.current.annotations[annotationId]
        if (annotation?.status === 'draft') dispatch({ type: 'annotation:remove', annotationId })
      },
      undoAnnotation() {
        dispatch({ type: 'annotation:undo' })
      },
      async resolveAnnotation(annotationId) {
        await adapter.resolveAnnotation(annotationId)
      },
      async sendFeedback() {
        const { preview } = stateRef.current
        const conversationId = activeId()
        const drafts = draftAnnotationsOf(stateRef.current)
        if (!conversationId || !preview.pageId || !preview.revisionId || drafts.length === 0) return
        const payload = drafts.map((draft) => ({ ...draft }))
        dispatch({ type: 'preview:annotate', enabled: false })
        dispatch({ type: 'panel:set', open: true, tab: 'feedback' })
        await adapter.sendPageFeedback({
          conversationId,
          pageId: preview.pageId,
          revisionId: preview.revisionId,
          viewport: { width: preview.width, device: preview.device },
          annotations: payload,
        })
      },
    }
  }, [adapter])

  const derived = useMemo(() => {
    const activeConversation = state.conversations.find((item) => item.id === state.activeConversationId)
    const messages = messagesOf(state, state.activeConversationId)
    const currentTask = currentTaskOf(state, state.activeConversationId)
    const steps = currentTask?.steps ?? []
    const done = steps.filter((step) => step.status === 'done').length
    const failed = steps.filter((step) => step.status === 'error').length
    const waiting = steps.filter((step) => step.status === 'waiting_approval').length
    const running = currentTask
      ? currentTask.status === 'running' || currentTask.status === 'waiting_approval' || currentTask.status === 'queued'
      : false
    const draftAnnotations = draftAnnotationsOf(state)
    const pageAnnotations = pageAnnotationsOf(state, state.preview.pageId)
    const revisions = revisionsOfPage(state, state.preview.pageId)
    const currentRevision = state.preview.revisionId ? state.revisions[state.preview.revisionId] : undefined
    const pendingApproval = Object.values(state.approvals)
      .filter((approval) => approval.status === 'pending' && approval.conversationId === state.activeConversationId)
      .sort((a, b) => a.createdAt - b.createdAt)[0]
    const composer = composerOf(state, state.activeConversationId)
    const canSend = composer.text.trim().length > 0 || composer.attachments.length > 0

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
    }
  }, [state])

  const value = useMemo<YAgentContextValue>(() => ({ state, adapter, actions, derived }), [state, adapter, actions, derived])

  return <YAgentContext.Provider value={value}>{children}</YAgentContext.Provider>
}

export function useYAgent(): YAgentContextValue {
  const context = useContext(YAgentContext)
  if (!context) throw new Error('useYAgent must be used inside <YAgentProvider>')
  return context
}

export function useYAgentActions(): YAgentActions {
  return useYAgent().actions
}

export const useYAgentState = (): YAgentState => useYAgent().state
