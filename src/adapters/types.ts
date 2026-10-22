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
  TaskStep,
} from '@/types/model'

/**
 * Everything the interface knows about the backend goes through this adapter.
 * The WordPress plugin will implement the same interface on top of its REST
 * endpoints (`/wp-json/yagent/v1/...`) and replace `createMockAdapter`.
 *
 * Contract notes:
 * - All state-changing calls are fire-and-forget: the resulting data arrives as
 *   events through `subscribe`, so streaming (tokens, steps, approvals) is uniform.
 * - `subscribe` returns an unsubscribe function and must be safe to call twice
 *   (React strict mode).
 */
export interface YAgentAdapter {
  readonly capabilities: AdapterCapabilities

  listConversations(): Promise<Conversation[]>
  createConversation(): Promise<Conversation>
  renameConversation(conversationId: string, title: string): Promise<void>
  setConversationPinned(conversationId: string, pinned: boolean): Promise<void>
  deleteConversation(conversationId: string): Promise<void>

  /**
   * Restores one conversation: its messages plus every entity those messages
   * reference (see `ConversationSnapshot`). Loading the messages alone is not
   * enough — the thread's activity, approval and result messages only carry ids.
   */
  getConversationSnapshot(conversationId: string): Promise<ConversationSnapshot>
  listModels(): Promise<AgentModel[]>

  sendMessage(input: SendMessageInput): Promise<void>
  stopTask(conversationId: string): Promise<void>
  resolveApproval(approvalId: string, decision: ApprovalDecision): Promise<void>

  getPagePreview(pageId: string): Promise<PagePreview>
  sendPageFeedback(input: SendPageFeedbackInput): Promise<void>
  /** Marks an annotation from an older revision as reviewed (`resolved`). */
  resolveAnnotation(annotationId: string): Promise<void>
  /** Publishes a draft revision (used by the preview toolbar's publish button). */
  publishRevision(revisionId: string): Promise<void>

  subscribe(listener: AgentEventListener): () => void
}

/**
 * Everything the interface needs to restore one conversation. A restored thread
 * renders its activity, approval and result cards only if the adapter also
 * returns the entities those messages point at — the messages carry ids alone.
 */
export interface ConversationSnapshot {
  messages: Message[]
  tasks: Task[]
  approvals: Approval[]
  results: ActionResult[]
  /** Annotations referenced by the conversation's feedback messages. */
  annotations: Annotation[]
}

export type ApprovalDecision = 'approve' | 'reject'

export interface SendMessageInput {
  conversationId: string
  text: string
  attachments: Attachment[]
  modelId: string
}

export interface SendPageFeedbackInput {
  conversationId: string
  pageId: string
  revisionId: string
  viewport: { width: number; device: PreviewDevice }
  /** Draft annotations created in the preview, in display order. */
  annotations: Annotation[]
}

export interface PagePreview {
  revisions: PreviewRevision[]
  annotations: Annotation[]
}

export type AgentEventListener = (event: AgentEvent) => void

export type AgentEvent =
  | { type: 'conversation:changed'; conversationId: string; conversation: Conversation; reason: 'created' | 'updated' | 'deleted' }
  | { type: 'messages:loaded'; conversationId: string; messages: Message[] }
  | { type: 'message:created'; conversationId: string; message: Message }
  | { type: 'message:delta'; conversationId: string; messageId: string; delta: string }
  | { type: 'message:updated'; conversationId: string; messageId: string; patch: Partial<Message> }
  | { type: 'task:created'; conversationId: string; task: Task }
  | { type: 'task:updated'; conversationId: string; taskId: string; patch: Partial<Task> }
  | { type: 'task:step'; conversationId: string; taskId: string; step: TaskStep }
  | { type: 'approval:created'; conversationId: string; approval: Approval }
  | { type: 'approval:updated'; conversationId: string; approvalId: string; patch: Partial<Approval> }
  | { type: 'preview:ready'; conversationId: string; revision: PreviewRevision }
  | { type: 'result:created'; conversationId: string; result: ActionResult }
  | { type: 'annotations:updated'; conversationId: string; annotations: Annotation[] }
