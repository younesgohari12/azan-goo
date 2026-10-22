/**
 * YAgent domain model.
 *
 * This file is the shared contract between the interface and the (future)
 * WordPress/YAgent backend. The UI only ever receives these shapes through the
 * service adapter, so the same components can be reused unchanged once the mock
 * adapter is replaced by real REST calls.
 */

export type Timestamp = number

export interface Conversation {
  id: string
  title: string
  pinned: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  /** Optional page the conversation is working on (links a chat to a preview). */
  previewPageId?: string
}

export type MessageRole = 'user' | 'assistant'
export type MessageKind = 'text' | 'activity' | 'approval' | 'result' | 'feedback'
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error' | 'stopped'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  kind: MessageKind
  text?: string
  createdAt: Timestamp
  status: MessageStatus
  /** kind: 'activity' — the running task rendered inside the thread. */
  taskId?: string
  /** kind: 'approval' — an operation waiting for a decision. */
  approvalId?: string
  /** kind: 'result' — a finished operation's compact result card. */
  resultId?: string
  /** kind: 'feedback' — annotations sent from the preview. */
  annotationIds?: string[]
  attachments?: Attachment[]
}

export type AttachmentStatus = 'uploading' | 'ready' | 'error'

export interface Attachment {
  id: string
  name: string
  mime: string
  size: number
  status: AttachmentStatus
  /** Object URL for image thumbnails (local preview only). */
  previewUrl?: string
  error?: string
}

export type TaskStatus = 'queued' | 'running' | 'waiting_approval' | 'done' | 'error' | 'stopped'

export interface Task {
  id: string
  conversationId: string
  title: string
  status: TaskStatus
  startedAt: Timestamp
  endedAt?: Timestamp
  /** One-line summary of what is happening right now (adapter-provided). */
  summary: string
  activeStepId?: string
  error?: string
  steps: TaskStep[]
}

export type TaskStepStatus = 'pending' | 'active' | 'done' | 'waiting_approval' | 'error' | 'skipped'

export interface TaskStep {
  id: string
  title: string
  description?: string
  status: TaskStepStatus
  startedAt?: Timestamp
  endedAt?: Timestamp
  /** Short, user-facing summary shown next to the step and in the activity block. */
  summary?: string
  detail?: TaskStepDetail
}

export interface TaskStepDetail {
  /** Result of the step (what changed / what was produced). */
  output?: string
  /** Non-blocking warning that needs the user's attention. */
  warning?: string
  /** Link to the revision produced by this step. */
  previewRevisionId?: string
  /** Extra technical lines, kept behind the collapsible details. */
  logs?: string[]
  /** Operation receipt shown in the expanded details. */
  receipt?: Array<{ label: string; value: string }>
}

export type ApprovalKind = 'publish_page' | 'install_plugin' | 'delete_plugin' | 'update_content'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'running' | 'succeeded' | 'failed'

export interface Approval {
  id: string
  conversationId: string
  kind: ApprovalKind
  title: string
  /** Page, plugin or post the operation applies to. */
  target: string
  summary: string
  changes: string[]
  status: ApprovalStatus
  createdAt: Timestamp
  resolvedAt?: Timestamp
  taskId?: string
  stepId?: string
  error?: string
  result?: {
    status: 'success' | 'error'
    message: string
    link?: string
    technical?: Array<{ label: string; value: string }>
  }
}

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

export interface PreviewRevision {
  id: string
  pageId: string
  pageTitle: string
  revision: number
  status: 'draft' | 'published'
  createdAt: Timestamp
  /** Full HTML document, rendered inside an isolated iframe. */
  html: string
  /** Short label of what changed in this revision. */
  summary: string
  basedOnRevisionId?: string
  /** `data-yagent-id` values present in this revision. */
  elementIds: string[]
}

export type AnnotationKind = 'pin' | 'region'
export type AnnotationStatus = 'draft' | 'sent' | 'stale' | 'unmatched' | 'resolved'

export interface Annotation {
  id: string
  pageId: string
  revisionId: string
  kind: AnnotationKind
  /** 1-based number shown on the pin and in the feedback panel. */
  index: number
  comment: string
  /** Geometry normalised to the page box (0..1), so it survives device resizes. */
  rect: { x: number; y: number; width: number; height: number }
  viewport: { width: number; device: PreviewDevice }
  /** Stable section id from `data-yagent-id`, when the annotation hit one. */
  elementId?: string
  elementLabel?: string
  createdAt: Timestamp
  status: AnnotationStatus
  /** Set when a newer revision exists: is the target element still there? */
  staleInfo?: { newerRevisionId: string; elementExists: boolean }
}

export interface ActionResult {
  id: string
  conversationId: string
  title: string
  status: 'success' | 'error'
  message: string
  /** External link (the published page on the site). */
  link?: string
  linkLabel?: string
  /** When set, the card offers "مشاهدهٔ پیش‌نمایش" and opens the workspace. */
  previewRevisionId?: string
  technical?: Array<{ label: string; value: string }>
  createdAt: Timestamp
}

export interface AgentModel {
  id: string
  name: string
  hint?: string
}

export interface AdapterCapabilities {
  /** The adapter declares whether voice capture is available; the UI must not fake it. */
  voiceInput: boolean
  fileAttachments: boolean
  pagePreview: boolean
  publish: boolean
}
