import type { Agent, Message } from '../types/chat'
import {
  applyMemoryHint,
  clampMemoryDepth,
  loadMemoryDepthPreference,
  saveMemoryDepthPreference,
  type MemoryHint,
} from '../config/contextDepth'
import {
  DynamicContextManager,
  type ChatMessage as ContextChatMessage,
  type ContextWindowInfo,
} from '../utils/dynamicContext'

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
  }

  appendUser(content: string): void {
    this.history.push({ role: 'user', content })
  }

  appendAssistant(content: string): void {
    this.history.push({ role: 'assistant', content })
  }

  addTurn(userMessage: string, assistantResponse: string): void {
    this.appendUser(userMessage)
    this.appendAssistant(assistantResponse)
    this.advanceAgent()
  }

  snapshot(): { history: Message[]; agentIndex: number } {
    return { history: [...this.history], agentIndex: this.agentIndex }
  }

  restore(snapshot: { history: Message[]; agentIndex: number }): void {
    this.history = [...snapshot.history]
    this.agentIndex = snapshot.agentIndex
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

  getLastContextInfo(): ContextWindowInfo | null {
    return this.lastContextInfo
  }
}
