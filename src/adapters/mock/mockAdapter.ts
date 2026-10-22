import type {
  AgentEvent,
  AgentEventListener,
  ApprovalDecision,
  PagePreview,
  SendMessageInput,
  SendPageFeedbackInput,
  YAgentAdapter,
} from '../types'
import type {
  ActionResult,
  AdapterCapabilities,
  Annotation,
  Approval,
  Conversation,
  Message,
  PreviewRevision,
  Task,
  TaskStep,
} from '@/types/model'
import { createSeed } from './fixtures'
import { aboutPageV1, aboutPageV2, extractElementIds, landingPageV1, landingPageV2 } from './pages'
import { feedbackPlan, scenarioFor, type ScenarioPlan } from './scenarios'

/**
 * Mock adapter — a complete, self-contained simulation of the YAgent backend.
 *
 * It needs no database, no authentication and no API key: all state lives in
 * memory for the demo session, and every UI-visible value is produced here and
 * delivered through `subscribe`, exactly like the real WordPress REST adapter
 * will do.
 */

export interface MockAdapterOptions {
  /** Demo timing multiplier: 1 = real time, 0.2 = five times faster. */
  speed?: number
}

const CAPABILITIES: AdapterCapabilities = {
  voiceInput: false,
  fileAttachments: true,
  pagePreview: true,
  publish: true,
}

let sequence = 0
function uid(prefix: string): string {
  sequence += 1
  return `${prefix}_${sequence.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

interface RunState {
  conversationId: string
  plan: ScenarioPlan
  taskId: string
  stopped: boolean
  streamingMessageId?: string
  pendingApprovalId?: string
  waiters: Array<(decision: ApprovalDecision | 'stopped') => void>
  lastRevisionId?: string
}

export function createMockAdapter(options: MockAdapterOptions = {}): YAgentAdapter {
  const speed = options.speed ?? 1
  const seed = createSeed()

  const conversations = new Map(seed.conversations.map((item) => [item.id, item]))
  const messages = new Map(seed.messages.map((item) => [item.id, item]))
  const tasks = new Map(seed.tasks.map((item) => [item.id, item]))
  const approvals = new Map(seed.approvals.map((item) => [item.id, item]))
  const results = new Map(seed.results.map((item) => [item.id, item]))
  const revisions = new Map(seed.revisions.map((item) => [item.id, item]))
  const annotations = new Map(seed.annotations.map((item) => [item.id, item]))

  const listeners = new Set<AgentEventListener>()
  const runs = new Map<string, RunState>()

  function emit(event: AgentEvent): void {
    listeners.forEach((listener) => listener(event))
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.max(10, Math.round(ms * speed))))
  }

  function touchConversation(conversationId: string): void {
    const conversation = conversations.get(conversationId)
    if (!conversation) return
    conversation.updatedAt = Date.now()
    emit({ type: 'conversation:changed', conversationId, conversation: clone(conversation), reason: 'updated' })
  }

  function emitMessage(message: Message): void {
    emit({ type: 'message:created', conversationId: message.conversationId, message: clone(message) })
  }

  function addAssistantMessage(conversationId: string, patch: Partial<Message>): Message {
    const message: Message = {
      id: uid('m'),
      conversationId,
      role: 'assistant',
      kind: 'text',
      text: '',
      createdAt: Date.now(),
      status: 'complete',
      ...patch,
    }
    messages.set(message.id, message)
    emitMessage(message)
    return message
  }

  function addUserMessage(conversationId: string, patch: Partial<Message>): Message {
    const message: Message = {
      id: uid('m'),
      conversationId,
      role: 'user',
      kind: 'text',
      text: '',
      createdAt: Date.now(),
      status: 'complete',
      ...patch,
    }
    messages.set(message.id, message)
    emitMessage(message)
    return message
  }

  function addResult(conversationId: string, result: Omit<ActionResult, 'id' | 'createdAt' | 'conversationId'>): ActionResult {
    const created: ActionResult = { ...result, id: uid('res'), conversationId, createdAt: Date.now() }
    results.set(created.id, created)
    emit({ type: 'result:created', conversationId, result: clone(created) })
    addAssistantMessage(conversationId, { kind: 'result', resultId: created.id, status: created.status === 'error' ? 'error' : 'complete' })
    return created
  }

  // ---------------------------------------------------------------- page model

  function pageRevisions(pageId: string): PreviewRevision[] {
    return [...revisions.values()]
      .filter((item) => item.pageId === pageId)
      .sort((a, b) => a.revision - b.revision)
  }

  function pageTitleOf(pageId: string, fallback: string): string {
    return pageRevisions(pageId).at(-1)?.pageTitle ?? fallback
  }

  function baseOf(pageId: string): 'landing' | 'about' {
    return pageId.includes('about') ? 'about' : 'landing'
  }

  function nextHtml(pageId: string): { html: string; variant: 'v1' | 'v2' } {
    const base = baseOf(pageId)
    const latest = pageRevisions(pageId).at(-1)
    const currentVariant: 'v1' | 'v2' = latest && latest.html === (base === 'about' ? aboutPageV2 : landingPageV2) ? 'v2' : 'v1'
    const next: 'v1' | 'v2' = currentVariant === 'v1' ? 'v2' : 'v1'
    const html = base === 'about' ? (next === 'v2' ? aboutPageV2 : aboutPageV1) : next === 'v2' ? landingPageV2 : landingPageV1
    return { html, variant: next }
  }

  function createRevision(args: {
    conversationId: string
    pageId: string
    pageTitle: string
    summary: string
    html: string
    status: 'draft' | 'published'
    basedOnRevisionId?: string
  }): PreviewRevision {
    const existing = pageRevisions(args.pageId)
    const revision: PreviewRevision = {
      id: uid('rev'),
      pageId: args.pageId,
      pageTitle: args.pageTitle,
      revision: (existing.at(-1)?.revision ?? 0) + 1,
      status: args.status,
      createdAt: Date.now(),
      html: args.html,
      summary: args.summary,
      basedOnRevisionId: args.basedOnRevisionId ?? existing.at(-1)?.id,
      elementIds: extractElementIds(args.html),
    }
    revisions.set(revision.id, revision)
    emit({ type: 'preview:ready', conversationId: args.conversationId, revision: clone(revision) })
    refreshAnnotationFreshness(args.conversationId, revision)
    return revision
  }

  /**
   * After a new revision, annotations written on older revisions are flagged:
   * `stale` when their target section still exists (confirm it still applies),
   * `unmatched` when the section is gone (the interface asks for a review).
   */
  function refreshAnnotationFreshness(conversationId: string, revision: PreviewRevision): void {
    const updated: Annotation[] = []
    annotations.forEach((annotation) => {
      if (annotation.pageId !== revision.pageId || annotation.revisionId === revision.id) return
      const elementExists = annotation.elementId ? revision.elementIds.includes(annotation.elementId) : true
      const status: Annotation['status'] = elementExists ? 'stale' : 'unmatched'
      if (annotation.status === status && annotation.staleInfo?.newerRevisionId === revision.id) return
      annotation.status = status
      annotation.staleInfo = { newerRevisionId: revision.id, elementExists }
      updated.push(clone(annotation))
    })
    if (updated.length > 0) {
      emit({ type: 'annotations:updated', conversationId, annotations: updated })
    }
  }

  // ------------------------------------------------------------------- tasks

  function createTask(conversationId: string, plan: ScenarioPlan): Task {
    const taskId = uid('t')
    const steps: TaskStep[] = plan.steps.map((step, index) => ({
      id: `${taskId}-s${index + 1}`,
      title: step.title,
      description: step.description,
      status: 'pending',
    }))
    const task: Task = {
      id: taskId,
      conversationId,
      title: plan.taskTitle,
      status: 'running',
      startedAt: Date.now(),
      summary: 'شروع کار…',
      steps,
    }
    tasks.set(taskId, task)
    emit({ type: 'task:created', conversationId, task: clone(task) })
    addAssistantMessage(conversationId, { kind: 'activity', taskId, status: 'streaming' })
    return task
  }

  function updateTask(conversationId: string, taskId: string, patch: Partial<Task>): void {
    const task = tasks.get(taskId)
    if (!task) return
    Object.assign(task, patch)
    emit({ type: 'task:updated', conversationId, taskId, patch: clone(patch) })
  }

  function updateStep(conversationId: string, taskId: string, step: TaskStep): void {
    emit({ type: 'task:step', conversationId, taskId, step: clone(step) })
  }

  function waitForDecision(run: RunState, approvalId: string): Promise<ApprovalDecision | 'stopped'> {
    run.pendingApprovalId = approvalId
    return new Promise<ApprovalDecision | 'stopped'>((resolve) => {
      run.waiters.push(resolve)
    })
  }

  async function streamText(run: RunState, messageId: string, text: string): Promise<void> {
    const message = messages.get(messageId)
    if (!message) return
    run.streamingMessageId = messageId
    const parts = text.split(/(\s+)/)
    let buffer = ''
    for (const part of parts) {
      if (run.stopped) break
      buffer += part
      message.text = buffer
      emit({ type: 'message:delta', conversationId: run.conversationId, messageId, delta: part })
      if (part.trim().length > 0) await sleep(22)
    }
    run.streamingMessageId = undefined
    if (run.stopped) {
      message.status = 'stopped'
      emit({ type: 'message:updated', conversationId: run.conversationId, messageId, patch: { status: 'stopped', text: buffer } })
      return
    }
    message.status = 'complete'
    emit({ type: 'message:updated', conversationId: run.conversationId, messageId, patch: { status: 'complete', text } })
  }

  async function runPlan(run: RunState): Promise<void> {
    const { conversationId, plan } = run
    const task = tasks.get(run.taskId)
    if (!task) return

    const conversation = conversations.get(conversationId)
    const pageId = plan.pageId ? conversation?.previewPageId ?? `page:${conversationId}` : conversation?.previewPageId
    const pageTitle = plan.pageTitle ?? (pageId ? pageTitleOf(pageId, plan.taskTitle) : plan.taskTitle)

    if (plan.pageId && pageId && conversation && conversation.previewPageId !== pageId) {
      conversation.previewPageId = pageId
      conversation.updatedAt = Date.now()
      emit({ type: 'conversation:changed', conversationId, conversation: clone(conversation), reason: 'updated' })
    }

    for (let index = 0; index < plan.steps.length; index += 1) {
      if (run.stopped) return
      const stepPlan = plan.steps[index]
      const step = task.steps[index]

      step.status = 'active'
      step.startedAt = Date.now()
      updateStep(conversationId, task.id, step)
      updateTask(conversationId, task.id, { activeStepId: step.id, status: 'running' })

      await sleep(stepPlan.durationMs)
      if (run.stopped) return

      step.summary = stepPlan.summary
      step.detail = stepPlan.detail

      if (stepPlan.fail) {
        step.status = 'error'
        step.endedAt = Date.now()
        updateStep(conversationId, task.id, step)
        updateTask(conversationId, task.id, {
          status: 'error',
          summary: stepPlan.summary,
          endedAt: Date.now(),
          error: stepPlan.fail,
          activeStepId: undefined,
        })
        task.steps.slice(index + 1).forEach((pending) => {
          pending.status = 'skipped'
          pending.summary = 'به دلیل خطای مرحلهٔ قبل اجرا نشد.'
          updateStep(conversationId, task.id, pending)
        })
        if (plan.failure) {
          addResult(conversationId, {
            title: plan.failure.title,
            status: 'error',
            message: plan.failure.message,
            technical: plan.failure.technical,
          })
        }
        return
      }

      if (stepPlan.producesPreview && pageId) {
        const { html, variant } = nextHtml(pageId)
        const revision = createRevision({
          conversationId,
          pageId,
          pageTitle,
          summary: variant === 'v2' ? 'نسخهٔ اصلاحشده با تغییرهای درخواستی' : 'نسخهٔ اولیهٔ صفحه',
          html,
          status: 'draft',
        })
        run.lastRevisionId = revision.id
        step.detail = { ...step.detail, previewRevisionId: revision.id }
        addResult(conversationId, {
          title: `پیش‌نمایش «${pageTitle}» آماده است`,
          status: 'success',
          message: `نسخهٔ ${revision.revision} آمادهٔ بازبینی است؛ می‌توانی روی بخش‌ها علامت بگذاری و نظر بنویسی.`,
          previewRevisionId: revision.id,
          technical: [
            { label: 'نسخه', value: `v${revision.revision}` },
            { label: 'بخش‌های قابل علامت‌گذاری', value: String(revision.elementIds.length) },
          ],
        })
      }

      if (stepPlan.approval) {
        step.status = 'waiting_approval'
        updateStep(conversationId, task.id, step)

        const approval: Approval = {
          id: uid('apr'),
          conversationId,
          kind: stepPlan.approval.kind,
          title: stepPlan.approval.title,
          target: stepPlan.approval.target,
          summary: stepPlan.approval.summary,
          changes: stepPlan.approval.changes,
          status: 'pending',
          createdAt: Date.now(),
          taskId: task.id,
          stepId: step.id,
        }
        approvals.set(approval.id, approval)
        updateTask(conversationId, task.id, { status: 'waiting_approval', summary: stepPlan.summary })
        emit({ type: 'approval:created', conversationId, approval: clone(approval) })
        addAssistantMessage(conversationId, { kind: 'approval', approvalId: approval.id, status: 'pending' })

        const decision = await waitForDecision(run, approval.id)
        run.pendingApprovalId = undefined

        if (decision === 'stopped' || run.stopped) return

        if (decision === 'reject') {
          approval.status = 'rejected'
          approval.resolvedAt = Date.now()
          emit({ type: 'approval:updated', conversationId, approvalId: approval.id, patch: { status: 'rejected', resolvedAt: approval.resolvedAt } })
          step.status = 'skipped'
          step.summary = 'عملیات را رد کردی؛ خطای مرحلهٔ بعد'
          updateStep(conversationId, task.id, step)
          task.steps.slice(index + 1).forEach((pending) => {
            pending.status = 'skipped'
            pending.summary = 'به دلیل ردشدن تأیید اجرا نشد.'
            updateStep(conversationId, task.id, pending)
          })
          updateTask(conversationId, task.id, {
            status: 'done',
            endedAt: Date.now(),
            summary: 'کار بدون انتشار تمام شد.',
            activeStepId: undefined,
          })
          addAssistantMessage(conversationId, {
            text: 'تأیید را رد کردی، پس چیزی روی سایت تغییر نکرد. اگر خواستی، نسخه را اصلاح می‌کنم و دوباره می‌فرستم.',
          })
          return
        }

        approval.status = 'running'
        emit({ type: 'approval:updated', conversationId, approvalId: approval.id, patch: { status: 'running' } })
        step.status = 'done'
        step.endedAt = Date.now()
        step.detail = {
          ...step.detail,
          receipt: [
            { label: 'تصمیم', value: 'تأییدشده توسط کاربر' },
            ...(step.detail?.receipt ?? []),
          ],
        }
        updateStep(conversationId, task.id, step)
        updateTask(conversationId, task.id, { status: 'running' })

        await sleep(700)
        if (run.stopped) return

        if (run.lastRevisionId && stepPlan.approval.kind === 'publish_page') {
          const revision = revisions.get(run.lastRevisionId)
          if (revision) {
            revision.status = 'published'
            emit({ type: 'preview:ready', conversationId, revision: clone(revision) })
          }
        }

        approval.status = 'succeeded'
        approval.resolvedAt = Date.now()
        approval.result = {
          status: 'success',
          message: `${approval.title} با موفقیت انجام شد.`,
          technical: [
            { label: 'هدف', value: approval.target },
            { label: 'زمان', value: new Date(approval.resolvedAt).toLocaleTimeString('fa-IR') },
          ],
        }
        emit({
          type: 'approval:updated',
          conversationId,
          approvalId: approval.id,
          patch: { status: 'succeeded', resolvedAt: approval.resolvedAt, result: clone(approval.result) },
        })
      } else {
        step.status = 'done'
        step.endedAt = Date.now()
        updateStep(conversationId, task.id, step)
      }

      updateTask(conversationId, task.id, { summary: stepPlan.summary })
    }

    if (run.stopped) return

    updateTask(conversationId, task.id, {
      status: 'done',
      endedAt: Date.now(),
      summary: 'کار تمام شد.',
      activeStepId: undefined,
    })

    if (plan.result) {
      addResult(conversationId, {
        title: plan.result.title,
        status: 'success',
        message: plan.result.message,
        link: plan.result.linkLabel && plan.kind !== 'page_feedback' ? '#' : undefined,
        linkLabel: plan.result.linkLabel,
        previewRevisionId: plan.kind === 'page_feedback' ? run.lastRevisionId : undefined,
        technical: plan.result.technical,
      })
    }

    touchConversation(conversationId)
  }

  async function performStandaloneApproval(approval: Approval, decision: ApprovalDecision): Promise<void> {
    const conversationId = approval.conversationId
    if (decision === 'reject') {
      approval.status = 'rejected'
      approval.resolvedAt = Date.now()
      emit({ type: 'approval:updated', conversationId, approvalId: approval.id, patch: { status: 'rejected', resolvedAt: approval.resolvedAt } })
      addAssistantMessage(conversationId, { text: `«${approval.title}» را لغو کردم؛ هیچ تغییری روی سایت اعمال نشد.` })
      touchConversation(conversationId)
      return
    }

    approval.status = 'running'
    emit({ type: 'approval:updated', conversationId, approvalId: approval.id, patch: { status: 'running' } })
    await sleep(1500)

    approval.status = 'succeeded'
    approval.resolvedAt = Date.now()
    approval.result = {
      status: 'success',
      message: `${approval.title} با موفقیت انجام شد.`,
      technical: [
        { label: 'هدف', value: approval.target },
        { label: 'شناسهٔ عملیات', value: uid('op') },
      ],
    }
    emit({
      type: 'approval:updated',
      conversationId,
      approvalId: approval.id,
      patch: { status: 'succeeded', resolvedAt: approval.resolvedAt, result: clone(approval.result) },
    })

    addResult(conversationId, {
      title: `${approval.title} انجام شد`,
      status: 'success',
      message: approval.kind === 'delete_plugin' ? 'افزونه حذف شد و جدول‌های مربوط به آن پاک شدند.' : approval.result.message,
      technical: approval.result.technical,
    })
    touchConversation(conversationId)
  }

  // ------------------------------------------------------------------ adapter

  return {
    capabilities: CAPABILITIES,

    async listConversations() {
      await sleep(0)
      return clone(
        [...conversations.values()].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return b.updatedAt - a.updatedAt
        }),
      )
    },

    async createConversation() {
      await sleep(120)
      const conversation: Conversation = {
        id: uid('c'),
        title: 'گفتگوی جدید',
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      conversations.set(conversation.id, conversation)
      emit({ type: 'conversation:changed', conversationId: conversation.id, conversation: clone(conversation), reason: 'created' })
      return clone(conversation)
    },

    async renameConversation(conversationId, title) {
      const conversation = conversations.get(conversationId)
      if (!conversation) return
      conversation.title = title.trim() || conversation.title
      conversation.updatedAt = Date.now()
      emit({ type: 'conversation:changed', conversationId, conversation: clone(conversation), reason: 'updated' })
    },

    async setConversationPinned(conversationId, pinned) {
      const conversation = conversations.get(conversationId)
      if (!conversation) return
      conversation.pinned = pinned
      emit({ type: 'conversation:changed', conversationId, conversation: clone(conversation), reason: 'updated' })
    },

    async deleteConversation(conversationId) {
      const conversation = conversations.get(conversationId)
      if (!conversation) return
      conversations.delete(conversationId)
      messages.forEach((message) => {
        if (message.conversationId === conversationId) messages.delete(message.id)
      })
      tasks.forEach((task) => {
        if (task.conversationId === conversationId) tasks.delete(task.id)
      })
      approvals.forEach((approval) => {
        if (approval.conversationId === conversationId) approvals.delete(approval.id)
      })
      const run = runs.get(conversationId)
      if (run) {
        run.stopped = true
        run.waiters.forEach((waiter) => waiter('stopped'))
        runs.delete(conversationId)
      }
      emit({ type: 'conversation:changed', conversationId, conversation: clone(conversation), reason: 'deleted' })
    },

    async getMessages(conversationId) {
      await sleep(60)
      return clone(
        [...messages.values()]
          .filter((message) => message.conversationId === conversationId)
          .sort((a, b) => a.createdAt - b.createdAt),
      )
    },

    async getTasks(conversationId) {
      await sleep(0)
      return clone([...tasks.values()].filter((task) => task.conversationId === conversationId))
    },

    async listModels() {
      await sleep(0)
      return [
        { id: 'yagent-1', name: 'YAgent 1', hint: 'سریع، مناسب کارهای روزمره' },
        { id: 'yagent-1-pro', name: 'YAgent Pro', hint: 'دقیق‌تر، مناسب پروژه‌های بزرگ' },
      ]
    },

    async sendMessage(input: SendMessageInput) {
      const conversation = conversations.get(input.conversationId)
      if (!conversation) return

      const existingRun = runs.get(input.conversationId)
      if (existingRun) {
        existingRun.stopped = true
        existingRun.waiters.forEach((waiter) => waiter('stopped'))
        runs.delete(input.conversationId)
      }

      addUserMessage(input.conversationId, {
        kind: 'text',
        text: input.text,
        attachments: input.attachments.map((attachment) => ({
          ...attachment,
          status: attachment.status === 'error' ? 'error' : 'ready',
        })),
      })
      if (conversation.title === 'گفتگوی جدید') {
        conversation.title = input.text.trim().slice(0, 42) || 'گفتگوی جدید'
      }
      conversation.updatedAt = Date.now()
      emit({ type: 'conversation:changed', conversationId: conversation.id, conversation: clone(conversation), reason: 'updated' })

      const plan = scenarioFor(input.text, {
        pageId: conversation.previewPageId,
        pageTitle: conversation.previewPageId ? pageTitleOf(conversation.previewPageId, 'صفحه') : undefined,
      })

      const assistant: Message = {
        id: uid('m'),
        conversationId: input.conversationId,
        role: 'assistant',
        kind: 'text',
        text: '',
        createdAt: Date.now(),
        status: 'streaming',
      }
      messages.set(assistant.id, assistant)
      emitMessage(assistant)

      await sleep(320)

      const task = createTask(input.conversationId, plan)
      const run: RunState = {
        conversationId: input.conversationId,
        plan,
        taskId: task.id,
        stopped: false,
        waiters: [],
      }
      runs.set(input.conversationId, run)

      await streamText(run, assistant.id, plan.reply)
      if (run.stopped) return

      await runPlan(run)
      runs.delete(input.conversationId)
    },

    async stopTask(conversationId) {
      const run = runs.get(conversationId)
      if (!run) return
      run.stopped = true
      run.waiters.forEach((waiter) => waiter('stopped'))
      run.waiters = []

      if (run.streamingMessageId) {
        const message = messages.get(run.streamingMessageId)
        if (message) {
          message.status = 'stopped'
          emit({
            type: 'message:updated',
            conversationId,
            messageId: message.id,
            patch: { status: 'stopped', text: message.text },
          })
        }
      }

      const task = tasks.get(run.taskId)
      if (task) {
        const active = task.steps.find((step) => step.status === 'active' || step.status === 'waiting_approval')
        if (active) {
          active.status = 'skipped'
          active.summary = 'توسط تو متوقف شد.'
          active.endedAt = Date.now()
          updateStep(conversationId, task.id, active)
        }
        updateTask(conversationId, task.id, {
          status: 'stopped',
          summary: 'کار متوقف شد.',
          endedAt: Date.now(),
          activeStepId: undefined,
        })
      }

      const pendingApproval = [...approvals.values()].find(
        (approval) => approval.conversationId === conversationId && approval.status === 'pending',
      )
      if (pendingApproval) {
        pendingApproval.status = 'rejected'
        pendingApproval.resolvedAt = Date.now()
        emit({
          type: 'approval:updated',
          conversationId,
          approvalId: pendingApproval.id,
          patch: { status: 'rejected', resolvedAt: pendingApproval.resolvedAt },
        })
      }

      runs.delete(conversationId)
    },

    async resolveApproval(approvalId: string, decision: ApprovalDecision) {
      const approval = approvals.get(approvalId)
      if (!approval || approval.status !== 'pending') return
      const run = runs.get(approval.conversationId)
      if (run && run.pendingApprovalId === approvalId) {
        run.waiters.forEach((waiter) => waiter(decision))
        run.waiters = []
        return
      }
      await performStandaloneApproval(approval, decision)
    },

    async resolveAnnotation(annotationId: string) {
      const annotation = annotations.get(annotationId)
      if (!annotation) return
      annotation.status = 'resolved'
      annotation.staleInfo = undefined
      emit({
        type: 'annotations:updated',
        conversationId: [...conversations.values()].find((item) => item.previewPageId === annotation.pageId)?.id ?? '',
        annotations: [clone(annotation)],
      })
    },

    async publishRevision(revisionId: string) {
      const revision = revisions.get(revisionId)
      if (!revision || revision.status !== 'draft') return
      const conversationId =
        [...conversations.values()].find((item) => item.previewPageId === revision.pageId)?.id ?? revision.pageId

      revision.status = 'published'
      emit({ type: 'preview:ready', conversationId, revision: clone(revision) })

      addResult(conversationId, {
        title: `«${revision.pageTitle}» منتشر شد`,
        status: 'success',
        message: `نسخهٔ ${revision.revision} روی سایت منتشر شد و نسخهٔ قبلی در تاریخچه باقی ماند.`,
        link: '#',
        linkLabel: 'مشاهدهٔ صفحه در سایت',
        technical: [
          { label: 'نسخه', value: `v${revision.revision}` },
          { label: 'شناسهٔ انتشار', value: uid('pub') },
        ],
      })
      addAssistantMessage(conversationId, {
        text: `نسخهٔ ${revision.revision} را منتشر کردم. اگر بعداً تغییری لازم شد، از تاریخچهٔ نسخه‌ها می‌توانی برگردانی.`,
      })
      touchConversation(conversationId)
    },

    async getPagePreview(pageId: string): Promise<PagePreview> {
      await sleep(80)
      return {
        revisions: clone(pageRevisions(pageId)),
        annotations: clone([...annotations.values()].filter((annotation) => annotation.pageId === pageId)),
      }
    },

    async sendPageFeedback(input: SendPageFeedbackInput) {
      const conversation = conversations.get(input.conversationId)
      if (!conversation) return
      const conversationId = input.conversationId

      const sent = input.annotations.map((annotation) => {
        const stored: Annotation = {
          ...annotation,
          pageId: input.pageId,
          revisionId: input.revisionId,
          viewport: input.viewport,
          status: 'sent',
          staleInfo: undefined,
        }
        annotations.set(stored.id, stored)
        return stored
      })

      const summary =
        `اصلاحات روی «${pageTitleOf(input.pageId, 'صفحه')}» — ${sent.length} مورد ` +
        `(نسخهٔ ${pageRevisions(input.pageId).at(-1)?.revision ?? 1}، عرض ${input.viewport.width} پیکسل)`
      addUserMessage(conversationId, {
        kind: 'feedback',
        text: summary,
        annotationIds: sent.map((annotation) => annotation.id),
      })
      emit({ type: 'annotations:updated', conversationId, annotations: clone(sent) })

      conversation.updatedAt = Date.now()
      emit({ type: 'conversation:changed', conversationId, conversation: clone(conversation), reason: 'updated' })

      const plan = feedbackPlan(input.pageId, pageTitleOf(input.pageId, 'صفحه'))
      const assistant: Message = {
        id: uid('m'),
        conversationId,
        role: 'assistant',
        kind: 'text',
        text: '',
        createdAt: Date.now(),
        status: 'streaming',
      }
      messages.set(assistant.id, assistant)
      emitMessage(assistant)

      await sleep(300)

      const task = createTask(conversationId, plan)
      const run: RunState = { conversationId, plan, taskId: task.id, stopped: false, waiters: [] }
      runs.set(conversationId, run)

      await streamText(run, assistant.id, plan.reply)
      if (run.stopped) return
      await runPlan(run)
      runs.delete(conversationId)
    },

    subscribe(listener: AgentEventListener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
