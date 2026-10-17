import type { Agent, Message } from '../types/chat'
import {
  applyMemoryHint,
  clampMemoryDepth,
  loadMemoryDepthPreference,
  saveMemoryDepthPreference,
  type MemoryHint,
} from '../config/contextDepth'
import type {
  DynamicContextManager} from '../utils/contextBudget';
import {
  type ChatMessage as ContextChatMessage,
  type ContextWindowInfo,
} from '../utils/contextBudget'

/** After a block trim, keep this fraction of the token budget so the next trim is many turns away. */
export const BLOCK_TRIM_TARGET = 0.6

export interface WritersRoomWindow {
  messages: ContextChatMessage[]
  info: ContextWindowInfo
  /** True when this turn dropped a block of old turns (KV cache rebuilt once). */
  trimmed: boolean
  /** Older lines matching a `recall:` hint, for the speaker cue (history stays append-only). */
  recallSnippets: string[]
}

export interface PreparedHistory {
  history: Message[]
  depthLimit: number
  hintLabel?: string
}

/**
 * Conversation history, agent rotation, and message-depth / token-budget preparation.
 */
export class ConversationStore {
  private history: Message[] = []
  private agentIndex = 0
  private userMemoryDepth = loadMemoryDepthPreference()
  private sceneMemoryDepth: number | null = null
  private pendingMemoryHint: MemoryHint | null = null
  private recallThemeForTurn: string | null = null
  private lastContextInfo: ContextWindowInfo | null = null
  /** First history index in the engine window (writers' room layout, block-trimmed). */
  private windowStart = 0

  constructor(private readonly agents: Agent[]) {}

  // --- History ---

  getHistory(): Message[] {
    return this.history
  }

  getHistoryLength(): number {
    return this.history.length
  }

  reset(): void {
    this.history = []
    this.agentIndex = 0
    this.windowStart = 0
  }

  appendUser(content: string, engineContent?: string): void {
    this.history.push(engineContent ? { role: 'user', content, engineContent } : { role: 'user', content })
  }

  appendAssistant(content: string, engineContent?: string): void {
    this.history.push(
      engineContent && engineContent !== content
        ? { role: 'assistant', content, engineContent }
        : { role: 'assistant', content },
    )
  }

  /** Record the exact (cued) prompt the engine saw for the newest user message. */
  setLastUserEngineContent(engineContent: string): void {
    const last = this.history[this.history.length - 1]
    if (last?.role === 'user') last.engineContent = engineContent
  }

  /** Replace the most recent user prompt (used for empty-turn retry). */
  replaceLastUser(content: string): boolean {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].role === 'user') {
        this.history[i] = { role: 'user', content }
        return true
      }
    }
    return false
  }

  /** Drop an unanswered user prompt so empty/emoji replies never enter history. */
  popLastIfUser(): boolean {
    const last = this.history[this.history.length - 1]
    if (last?.role === 'user') {
      this.history.pop()
      return true
    }
    return false
  }

  addTurn(
    userMessage: string,
    assistantResponse: string,
    engine?: { user: string; assistant: string },
  ): void {
    this.appendUser(userMessage, engine?.user)
    this.appendAssistant(assistantResponse, engine?.assistant)
    this.advanceAgent()
  }

  /** Independent copy (prerender runs ahead on a fork without touching live history). */
  fork(): ConversationStore {
    const copy = new ConversationStore(this.agents)
    copy.history = this.history.map((m) => ({ ...m }))
    copy.agentIndex = this.agentIndex
    copy.windowStart = this.windowStart
    copy.userMemoryDepth = this.userMemoryDepth
    copy.sceneMemoryDepth = this.sceneMemoryDepth
    return copy
  }

  snapshot(): { history: Message[]; agentIndex: number } {
    return { history: [...this.history], agentIndex: this.agentIndex }
  }

  restore(snapshot: { history: Message[]; agentIndex: number }): void {
    this.history = [...snapshot.history]
    this.agentIndex = snapshot.agentIndex
    this.windowStart = Math.min(this.windowStart, this.history.length)
  }

  /**
   * After model/context shrink (hot-swap), trim stored history to what fits the new token budget.
   */
  reconcileHistoryAfterContextChange(
    contextManager: DynamicContextManager,
    reserveTokens: number,
  ): void {
    if (this.history.length === 0) return

    const { messages, info } = contextManager.truncate(
      'Scene context.',
      this.history as ContextChatMessage[],
      reserveTokens,
    )
    const kept = messages.filter((m) => m.role !== 'system') as Message[]
    if (kept.length < this.history.length) {
      console.log(
        `[ConversationStore] Post-swap history trim: ${this.history.length} → ${kept.length} messages ` +
          `(${info.droppedMessages} dropped by token budget)`,
      )
      this.history = kept
    }
    this.windowStart = 0
  }

  // --- Agent rotation ---

  getCurrentAgent(): Agent {
    return this.agents[this.agentIndex]
  }

  getNextAgent(): Agent {
    return this.agents[(this.agentIndex + 1) % this.agents.length]
  }

  getAgentIndex(): number {
    return this.agentIndex
  }

  setAgentIndex(index: number): void {
    if (index >= 0 && index < this.agents.length) {
      this.agentIndex = index
    }
  }

  advanceAgent(): void {
    this.agentIndex = (this.agentIndex + 1) % this.agents.length
  }

  getAgents(): Agent[] {
    return this.agents
  }

  // --- Memory depth ---

  setMemoryDepth(messages: number): void {
    this.userMemoryDepth = clampMemoryDepth(messages)
    saveMemoryDepthPreference(this.userMemoryDepth)
    console.log(`[MemoryDepth] User depth: ${this.userMemoryDepth} messages`)
  }

  getMemoryDepth(): number {
    return this.userMemoryDepth
  }

  setSceneMemoryDepth(depth: number | null): void {
    this.sceneMemoryDepth = depth == null ? null : clampMemoryDepth(depth)
    if (this.sceneMemoryDepth != null) {
      console.log(`[MemoryDepth] Scene depth: ${this.sceneMemoryDepth} messages`)
    }
  }

  clearSceneMemoryDepth(): void {
    this.sceneMemoryDepth = null
  }

  getEffectiveMemoryDepth(): number {
    return this.sceneMemoryDepth ?? this.userMemoryDepth
  }

  applyMemoryHint(hint: MemoryHint): void {
    this.pendingMemoryHint = hint
    console.log(`[MemoryDepth] Pending hint: ${hint}`)
  }

  private consumeMemoryHint(): MemoryHint | null {
    const hint = this.pendingMemoryHint
    this.pendingMemoryHint = null
    return hint
  }

  private resolveTurnMemoryDepth(): { depth: number; hintLabel?: string; recallTheme?: string } {
    const base = this.getEffectiveMemoryDepth()
    const hint = this.consumeMemoryHint()
    if (!hint) {
      return { depth: base }
    }

    const depth = applyMemoryHint(base, hint)
    if (hint.startsWith('recall:')) {
      const theme = hint.slice('recall:'.length)
      this.recallThemeForTurn = theme
      return { depth, hintLabel: hint, recallTheme: theme }
    }

    return { depth, hintLabel: hint }
  }

  sliceHistoryByDepth(history: Message[], depthLimit: number, recallTheme?: string): Message[] {
    if (history.length <= depthLimit) {
      return history
    }

    const recent = history.slice(-depthLimit)

    if (!recallTheme) {
      return recent
    }

    const theme = recallTheme.toLowerCase()
    const older = history.slice(0, -depthLimit)
    const recalled = older.filter((m) => m.content.toLowerCase().includes(theme)).slice(-2)
    if (recalled.length === 0) {
      return recent
    }

    const combined = [...recalled, ...recent]
    const overflow = combined.length - depthLimit
    if (overflow <= 0) {
      return combined
    }

    return [...recalled, ...recent.slice(overflow)]
  }

  prepareHistoryForContext(
    includePendingUser = false,
    pendingUserContent?: string,
  ): PreparedHistory {
    const { depth, hintLabel, recallTheme } = this.resolveTurnMemoryDepth()
    if (recallTheme) {
      this.recallThemeForTurn = recallTheme
    }

    let working = [...this.history]
    if (includePendingUser && pendingUserContent) {
      working.push({ role: 'user', content: pendingUserContent })
    }

    const sliced = this.sliceHistoryByDepth(
      working,
      depth,
      this.recallThemeForTurn ?? recallTheme,
    )
    this.recallThemeForTurn = null

    return { history: sliced, depthLimit: depth, hintLabel }
  }

  truncateForTurn(
    contextManager: DynamicContextManager,
    systemPrompt: string,
    depthSlicedHistory: Message[],
    reserveTokens: number,
    depthLimit: number,
    hintLabel?: string,
  ): { messages: ContextChatMessage[]; info: ContextWindowInfo } {
    const { messages, info } = contextManager.truncate(
      systemPrompt,
      depthSlicedHistory as ContextChatMessage[],
      reserveTokens,
    )
    this.lastContextInfo = {
      ...info,
      messageDepthLimit: depthLimit,
      messagesInWindow: depthSlicedHistory.length,
      memoryHintApplied: hintLabel,
    }
    return { messages, info }
  }

  /**
   * Engine window for the writers' room layout (#400 B). The history must end with the pending
   * user message; `cuedUser` replaces it. Unlike `truncateForTurn` this never slides one turn
   * at a time: when the memory depth or token budget is exceeded it drops a whole block of the
   * oldest turns (down to BLOCK_TRIM_TARGET) and folds a summary into the system prompt, so the
   * prefix — and the engine's KV cache — stays identical for many turns between rebuilds.
   */
  prepareWritersRoomWindow(
    contextManager: DynamicContextManager,
    buildSystem: (summary: string | null) => string,
    cuedUser: string,
    reserveTokens: number,
  ): WritersRoomWindow {
    const { depth, hintLabel, recallTheme } = this.resolveTurnMemoryDepth()
    this.recallThemeForTurn = null
    const pendingIdx = this.history.length - 1
    const tokens = (m: Message) => contextManager.estimateTokens(m.engineContent ?? m.content)
    const alignToUser = () => {
      while (this.windowStart < pendingIdx && this.history[this.windowStart]?.role !== 'user') this.windowStart++
    }
    this.windowStart = Math.min(Math.max(0, this.windowStart), Math.max(0, pendingIdx))
    alignToUser()
    const startBefore = this.windowStart

    // Message-depth budget (pending prompt included), trimmed in blocks.
    if (pendingIdx + 1 - this.windowStart > depth) {
      const keep = Math.max(1, Math.floor(depth * BLOCK_TRIM_TARGET))
      this.windowStart = Math.max(this.windowStart, pendingIdx + 1 - keep)
      alignToUser()
    }

    const summaryFor = (start: number) =>
      start > 0 ? contextManager.buildSummaryStub(this.history.slice(0, start) as ContextChatMessage[]) : null
    const windowTokens = (start: number) => {
      let sum = contextManager.estimateTokens(cuedUser)
      for (let i = start; i < pendingIdx; i++) sum += tokens(this.history[i])
      return sum
    }
    const maxTokens = contextManager.getMaxContextTokens()
    const total = (start: number) =>
      contextManager.estimateTokens(buildSystem(summaryFor(start))) + windowTokens(start) + reserveTokens

    if (total(this.windowStart) > maxTokens) {
      // Shrink the history part (not the fixed system / cue / reserve part) to the target share
      // of what is left for it, so many turns fit before the next rebuild.
      const cueTokens = contextManager.estimateTokens(cuedUser)
      const historyTokens = (start: number) => windowTokens(start) - cueTokens
      const historyBudget = (start: number) =>
        maxTokens - reserveTokens - cueTokens - contextManager.estimateTokens(buildSystem(summaryFor(start)))
      while (
        this.windowStart < pendingIdx &&
        historyTokens(this.windowStart) > Math.floor(historyBudget(this.windowStart) * BLOCK_TRIM_TARGET)
      ) {
        this.windowStart++
        alignToUser()
      }
    }

    const summary = summaryFor(this.windowStart)
    const system = buildSystem(summary)
    const messages: ContextChatMessage[] = [{ role: 'system', content: system }]
    for (let i = this.windowStart; i < pendingIdx; i++) {
      const m = this.history[i]
      messages.push({ role: m.role, content: m.engineContent ?? m.content })
    }
    messages.push({ role: 'user', content: cuedUser })

    let recallSnippets: string[] = []
    if (recallTheme) {
      const theme = recallTheme.toLowerCase()
      recallSnippets = this.history
        .slice(0, this.windowStart)
        .filter((m) => m.role === 'assistant' && m.content.toLowerCase().includes(theme))
        .slice(-2)
        .map((m) => m.content.slice(0, 120))
    }

    const usedTokens = total(this.windowStart) - reserveTokens
    const inWindow = pendingIdx + 1 - this.windowStart
    const info: ContextWindowInfo = {
      maxTokens,
      usedTokens,
      reserveTokens,
      messageCount: messages.length,
      droppedMessages: this.windowStart,
      hasSummary: summary != null,
      summaryStub: summary ?? undefined,
      estimationSource: contextManager.getTokenEstimator().getSource(),
      messageDepthLimit: depth,
      messagesInWindow: inWindow,
      memoryHintApplied: hintLabel,
    }
    this.lastContextInfo = info
    return { messages, info, trimmed: this.windowStart !== startBefore, recallSnippets }
  }

  getLastContextInfo(): ContextWindowInfo | null {
    return this.lastContextInfo
  }
}
