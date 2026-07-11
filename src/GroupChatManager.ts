/**
 * GroupChatManager — facade for Director / UI.
 *
 * Delegates to:
 * - ConversationStore (history, rotation, memory depth, truncation prep)
 * - ModelSession (engine lifecycle, context budget, interrupt)
 * - PersonalityStore (structured evolution adjustments)
 *
 * @see docs/GROUP_CHAT_FACADE.md
 */
import * as webllm from '@mlc-ai/web-llm'
import type { VRAMOptimizationConfig, ContextWindowInfo } from './utils/dynamicContext'
import type { DynamicContextManager } from './utils/dynamicContext'
import type { ChatMessage, ContentPart } from './llm/LLMEngine'
import type { EngineType } from './llm/EngineFactory'
import { MlcEngineAdapter } from './llm/MlcEngineAdapter'
import type { ProfanityLevel, Agent, Message, ErrorCategory } from './types/chat'
import { PROFANITY_LEVEL, PROFANITY_INSTRUCTIONS, DEFAULT_MAX_TOKENS, ABSOLUTE_MAX_TOKENS } from './config/chatConfig'
import { buildSystemMessage } from './llm/helpers/PromptCompiler'
import { getDirectorCritiqueDepth, parseMemoryHint, type MemoryHint } from './config/contextDepth'
import { ConversationStore } from './chat/ConversationStore'
import { ModelSession } from './chat/ModelSession'
import { PersonalityStore } from './chat/PersonalityStore'
import { categorizeChatError } from './chat/chatErrors'

export type { ProfanityLevel, Agent, Message, ErrorCategory }
export { PROFANITY_LEVEL }

export interface DirectorCritiqueResult {
  instruction: string
  status: 'flowing' | 'stagnant' | 'unknown'
  memoryHint: MemoryHint | null
  raw: string
}

export class GroupChatManager {
  private readonly conversation: ConversationStore
  private readonly session: ModelSession
  private readonly personality: PersonalityStore

  private maxTokensPerTurn: number = DEFAULT_MAX_TOKENS
  private styleInstruction = PROFANITY_INSTRUCTIONS[PROFANITY_LEVEL]
  private currentProfanityLevel: ProfanityLevel = PROFANITY_LEVEL
  private readonly REPETITION_PENALTY = 0.955
  private readonly PRESENCE_PENALTY = 0.556
  private readonly DEFAULT_PRERENDER_TURNS = 3

  constructor(agents: Agent[]) {
    this.conversation = new ConversationStore(agents)
    this.session = new ModelSession()
    this.personality = new PersonalityStore(agents)
    this.personality.loadIntoAgents()
  }

  /** @deprecated Use categorizeChatError from chat/chatErrors */
  static getErrorCategory(error: unknown): ErrorCategory {
    return categorizeChatError(error)
  }

  evolvePersonality(agentId: string, feedback: 'positive' | 'negative'): void {
    this.personality.evolve(agentId, feedback)
  }

  setProfanityLevel(level: ProfanityLevel): void {
    this.currentProfanityLevel = level
    this.styleInstruction = PROFANITY_INSTRUCTIONS[level]
    console.log(`Profanity level set to: ${level}`)
  }

  getProfanityLevel(): ProfanityLevel {
    return this.currentProfanityLevel
  }

  getLoadedModelId(): string | null {
    return this.session.getLoadedModelId()
  }

  setMaxTokensPerTurn(tokens: number): void {
    this.maxTokensPerTurn = Math.max(16, Math.min(tokens, ABSOLUTE_MAX_TOKENS))
    console.log(`[TokenBudget] Max tokens per turn: ${this.maxTokensPerTurn}`)
  }

  getMaxTokensPerTurn(): number {
    return this.maxTokensPerTurn
  }

  setVRAMConfig(config: Partial<VRAMOptimizationConfig>): void {
    this.session.setVRAMConfig(config)
  }

  getVRAMConfig(): VRAMOptimizationConfig {
    return this.session.getVRAMConfig()
  }

  setMemoryDepth(messages: number): void {
    this.conversation.setMemoryDepth(messages)
  }

  getMemoryDepth(): number {
    return this.conversation.getMemoryDepth()
  }

  setSceneMemoryDepth(depth: number | null): void {
    this.conversation.setSceneMemoryDepth(depth)
  }

  clearSceneMemoryDepth(): void {
    this.conversation.clearSceneMemoryDepth()
  }

  getEffectiveMemoryDepth(): number {
    return this.conversation.getEffectiveMemoryDepth()
  }

  applyMemoryHint(hint: MemoryHint): void {
    this.conversation.applyMemoryHint(hint)
  }

  getContextWindowInfo(): ContextWindowInfo | null {
    return this.conversation.getLastContextInfo()
  }

  getContextManager(): DynamicContextManager {
    return this.session.getContextManager()
  }

  async initialize(
    onProgress?: (progress: webllm.InitProgressReport) => void,
    preferredModelId?: string,
    preferredContext?: number | 'auto',
    enginePreference: EngineType = 'auto',
  ): Promise<void> {
    await this.session.initialize(onProgress, preferredModelId, preferredContext, enginePreference)
    this.session.syncContextFromEngine()
    this.conversation.reconcileHistoryAfterContextChange(
      this.session.getContextManager(),
      this.maxTokensPerTurn,
    )
  }

  async chat(
    userMessage: string | ContentPart[],
    onSentence?: (sentence: string) => void,
    options: {
      maxTokens?: number
      seed?: number
      hiddenInstruction?: string
      enablePerfTracking?: boolean
    } = {},
  ): Promise<{ agentId: string; response: string }> {
    const engine = this.session.getEngine()
    if (!engine || !this.session.isReady()) {
      throw new Error('GroupChatManager not initialized. Call initialize() first.')
    }

    const originalContent = userMessage
    const historyContent =
      typeof userMessage === 'string'
        ? userMessage
        : userMessage
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('\n')

    this.conversation.appendUser(historyContent)
    const currentAgent = this.conversation.getCurrentAgent()

    let fullSystemPrompt = `${currentAgent.systemPrompt}\n\n${this.styleInstruction}`
    if (options.hiddenInstruction?.trim()) {
      fullSystemPrompt += `\n\n### DIRECTOR'S SECRET NOTE ###\n${options.hiddenInstruction}\n(You MUST incorporate this note immediately!)`
    }

    const { history: depthSlicedHistory, depthLimit, hintLabel } =
      this.conversation.prepareHistoryForContext(false)

    const effectiveMaxTokens = Math.min(
      options.maxTokens ?? ABSOLUTE_MAX_TOKENS,
      this.maxTokensPerTurn,
      ABSOLUTE_MAX_TOKENS,
    )

    const { messages, info: ctxInfo } = this.conversation.truncateForTurn(
      this.session.getContextManager(),
      fullSystemPrompt,
      depthSlicedHistory,
      effectiveMaxTokens,
      depthLimit,
      hintLabel,
    )

    if (ctxInfo.droppedMessages > 0) {
      console.log(
        `[ContextTruncation] Dropped ${ctxInfo.droppedMessages} messages ` +
          `(${ctxInfo.usedTokens}/${ctxInfo.maxTokens} tokens used, summary: ${ctxInfo.hasSummary})`,
      )
    }

    try {
      const chatMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }))

      if (typeof originalContent !== 'string') {
        let lastUserIdx = -1
        for (let i = chatMessages.length - 1; i >= 0; i--) {
          if (chatMessages[i].role === 'user') {
            lastUserIdx = i
            break
          }
        }
        if (lastUserIdx >= 0) {
          chatMessages[lastUserIdx] = { role: 'user', content: originalContent }
        }
      }

      const stream = await engine.chat(chatMessages, {
        max_tokens: effectiveMaxTokens,
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        seed: options.seed,
        repetition_penalty: this.REPETITION_PENALTY,
        presence_penalty: this.PRESENCE_PENALTY,
        stop: ['###', 'Director:', 'User:'],
        stream: true,
      })

      let fullResponse = ''
      let buffer = ''

      for await (const content of stream) {
        if (content) {
          fullResponse += content
          buffer += content

          const stopTokens = ['###', 'Director:', 'User:']
          let earliestIdx = -1
          let matchedToken: string | null = null
          for (const token of stopTokens) {
            const idx = buffer.indexOf(token)
            if (idx >= 0 && (earliestIdx === -1 || idx < earliestIdx)) {
              earliestIdx = idx
              matchedToken = token
            }
          }
          if (earliestIdx >= 0 && matchedToken) {
            const preStop = buffer
              .substring(0, earliestIdx)
              .trim()
              .replace(new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i'), '')
              .replace(/###/g, '')
              .replace(/Director:\s*/gi, '')
              .replace(/User:\s*/gi, '')
              .trim()
            if (preStop) onSentence?.(preStop)
            buffer = ''
          }

          let match
          while ((match = buffer.match(/([.!?])\s/))) {
            const endIdx = match.index! + 1
            let sentence = buffer.substring(0, endIdx).trim()
            const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
            sentence = sentence
              .replace(namePrefixRegex, '')
              .replace(/###/g, '')
              .replace(/Director:\s*/gi, '')
              .replace(/User:\s*/gi, '')
              .trim()
            if (sentence) onSentence?.(sentence)
            buffer = buffer.substring(endIdx + 1)
          }
        }
      }

      if (buffer.trim()) {
        let cleanBuffer = buffer.trim()
        const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
        cleanBuffer = cleanBuffer
          .replace(namePrefixRegex, '')
          .replace(/###/g, '')
          .replace(/Director:\s*/gi, '')
          .replace(/User:\s*/gi, '')
          .trim()
        onSentence?.(cleanBuffer)
      }

      const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
      const cleanFullResponse = fullResponse
        .replace(namePrefixRegex, '')
        .replace(/###/g, '')
        .replace(/Director:\s*/gi, '')
        .replace(/User:\s*/gi, '')
        .trim()

      this.conversation.appendAssistant(cleanFullResponse)
      this.conversation.advanceAgent()

      return { agentId: currentAgent.id, response: fullResponse }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('Model not loaded') || msg.includes('not loaded before')) {
        await this.session.terminate()
        throw new Error(
          'The AI model was unloaded unexpectedly (GPU device lost). Please reload the page.',
        )
      }

      if (categorizeChatError(error) === 'oom' && this.maxTokensPerTurn > 32) {
        const reduced = Math.max(32, Math.floor(this.maxTokensPerTurn * 0.6))
        console.warn(
          `[TokenBudget] OOM during generation — reducing maxTokensPerTurn from ${this.maxTokensPerTurn} to ${reduced}`,
        )
        this.maxTokensPerTurn = reduced
      }
      console.error('Error generating response:', error)
      throw error
    }
  }

  async getDirectorCritique(): Promise<DirectorCritiqueResult> {
    const empty: DirectorCritiqueResult = {
      instruction: '',
      status: 'unknown',
      memoryHint: null,
      raw: '',
    }
    const engine = this.session.getEngine()
    if (!engine || !this.session.isReady()) return empty

    const critiqueDepth = getDirectorCritiqueDepth(this.conversation.getEffectiveMemoryDepth())
    const recentHistory = this.conversation.getHistory().slice(-critiqueDepth)
    if (recentHistory.length === 0) return empty

    const historyText = recentHistory
      .map((m) => `${m.role === 'user' ? 'Prompt' : 'Actor'}: ${m.content}`)
      .join('\n')

    const directorSystemPrompt =
      `You are an expert Improv Director. Watch the scene below.\n` +
      `First, judge the scene: is it "FLOWING" (funny, good chemistry) or "STAGNANT" (boring, repetitive)?\n` +
      `Then, provide a ONE-SENTENCE direction to the NEXT actor.\n` +
      `Optionally add a memory hint on its own line when the scene needs tighter focus or callback recall:\n` +
      `MEMORY: zoom_in | zoom_out | recall:TOPIC\n` +
      `Rules:\n` +
      `- If STAGNANT: Intervene! Raise the stakes, add a disaster, or force a topic change.\n` +
      `- If FLOWING: Coach silently. Give a subtle note (e.g. "Be more suspicious," "Whisper this line").\n` +
      `Output format:\n` +
      `[STATUS]: [INSTRUCTION]\n` +
      `MEMORY: [hint] (optional)`

    try {
      const stream = await engine.chat(
        [
          { role: 'system', content: directorSystemPrompt },
          { role: 'user', content: `RECENT DIALOGUE:\n${historyText}\n\nDIRECTOR DECISION:` },
        ],
        { temperature: 0.6, max_tokens: 80, stream: false },
      )

      let response = ''
      for await (const chunk of stream) {
        response += chunk
      }

      const raw = response.trim()
      if (!raw) return empty

      let memoryHint: MemoryHint | null = null
      const memoryLine = raw.split('\n').find((line) => line.trim().toUpperCase().startsWith('MEMORY:'))
      if (memoryLine) {
        memoryHint = parseMemoryHint(memoryLine.split(':').slice(1).join(':'))
      }

      const critiqueLine =
        raw.split('\n').find((line) => line.includes(':') && !line.trim().toUpperCase().startsWith('MEMORY:')) ??
        raw
      const parts = critiqueLine.split(':')
      const statusRaw = parts[0].trim().toUpperCase()
      const instruction = parts.slice(1).join(':').trim()

      let status: DirectorCritiqueResult['status'] = 'unknown'
      if (statusRaw.includes('FLOWING')) status = 'flowing'
      else if (statusRaw.includes('STAGNANT')) status = 'stagnant'

      if (memoryHint) {
        this.conversation.applyMemoryHint(memoryHint)
      }

      return { instruction: instruction || raw, status, memoryHint, raw }
    } catch (e) {
      console.warn('Director failed to think:', e)
      return empty
    }
  }

  getCurrentAgent(): Agent {
    return this.conversation.getCurrentAgent()
  }

  getNextAgent(): Agent {
    return this.conversation.getNextAgent()
  }

  getHistoryLength(): number {
    return this.conversation.getHistoryLength()
  }

  resetConversation(): void {
    this.conversation.reset()
  }

  getAgents(): Agent[] {
    return this.conversation.getAgents()
  }

  addToHistory(userMessage: string, assistantResponse: string): void {
    this.conversation.addTurn(userMessage, assistantResponse)
  }

  async prerenderTurns(
    initialPrompt: string,
    turnCount: number = this.DEFAULT_PRERENDER_TURNS,
    options: {
      maxTokens?: number
      seed?: number
      hiddenInstruction?: string
      enablePerfTracking?: boolean
    } = {},
  ): Promise<Array<{ agentId: string; agentName: string; response: string; sentences: string[] }>> {
    const engine = this.session.getEngine()
    if (!engine || !this.session.isReady()) {
      throw new Error('GroupChatManager not initialized. Call initialize() first.')
    }

    const prerenderedTurns: Array<{
      agentId: string
      agentName: string
      response: string
      sentences: string[]
    }> = []

    const snapshot = this.conversation.snapshot()

    try {
      let currentPrompt = initialPrompt

      for (let i = 0; i < turnCount; i++) {
        const currentAgent = this.conversation.getCurrentAgent()
        const systemMessage = buildSystemMessage(
          currentAgent,
          undefined,
          this.currentProfanityLevel,
          options.hiddenInstruction,
        )

        const effectiveMaxTokens = Math.min(
          options.maxTokens || this.maxTokensPerTurn,
          this.maxTokensPerTurn,
          ABSOLUTE_MAX_TOKENS,
        )

        const depth = this.conversation.getEffectiveMemoryDepth()
        const historyWithPrompt: Message[] = [
          ...this.conversation.getHistory(),
          { role: 'user', content: currentPrompt },
        ]
        const depthSliced = this.conversation.sliceHistoryByDepth(historyWithPrompt, depth)

        const { messages } = this.session.getContextManager().truncate(
          systemMessage,
          depthSliced,
          effectiveMaxTokens,
        )

        const chatMessages: ChatMessage[] = messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        }))

        const stream = await engine.chat(chatMessages, {
          temperature: currentAgent.temperature,
          top_p: currentAgent.top_p,
          max_tokens: effectiveMaxTokens,
          stream: false,
          stop: ['###', 'Director:', 'User:'],
          seed: options.seed ? options.seed + i : undefined,
          repetition_penalty: this.REPETITION_PENALTY,
          presence_penalty: this.PRESENCE_PENALTY,
        })

        let fullResponse = ''
        for await (const chunk of stream) {
          fullResponse += chunk
        }

        const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
        const cleanResponse = fullResponse
          .replace(namePrefixRegex, '')
          .replace(/###/g, '')
          .replace(/Director:\s*/gi, '')
          .replace(/User:\s*/gi, '')
          .trim()

        const sentences = cleanResponse
          .split(/([.!?])\s+/)
          .reduce((acc: string[], part: string, idx: number, arr: string[]) => {
            if (idx % 2 === 0 && part.trim()) {
              acc.push((part + (arr[idx + 1] || '')).trim())
            }
            return acc
          }, [])
          .filter((s: string) => s.length > 0)

        prerenderedTurns.push({
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          response: cleanResponse,
          sentences,
        })

        this.conversation.addTurn(currentPrompt, cleanResponse)
        currentPrompt = '(Reply naturally to the last thing said)'
      }

      return prerenderedTurns
    } finally {
      this.conversation.restore(snapshot)
    }
  }

  async chatForAgent(
    agentId: string,
    prompt: string,
    onSentence?: (sentence: string) => void,
    options: { maxTokens?: number; seed?: number; hiddenInstruction?: string } = {},
  ): Promise<{ agentId: string; response: string }> {
    const originalIndex = this.conversation.getAgentIndex()
    const agentIndex = this.conversation.getAgents().findIndex((a) => a.id === agentId)
    if (agentIndex === -1) {
      throw new Error(`Agent with id ${agentId} not found`)
    }

    this.conversation.setAgentIndex(agentIndex)
    try {
      return await this.chat(prompt, onSentence, options)
    } finally {
      this.conversation.setAgentIndex(originalIndex)
    }
  }

  getHistory(): Message[] {
    return this.conversation.getHistory()
  }

  async interrupt(): Promise<void> {
    await this.session.interrupt()
  }

  resetPerformanceMetrics(): void {}

  getPerformanceReport(): string {
    return ''
  }

  get completion() {
    const engine = this.session.getEngine()
    if (engine instanceof MlcEngineAdapter) {
      return (engine as unknown as { engine?: { chat?: { completions: unknown } } }).engine?.chat?.completions
    }
    return null
  }

  async terminate(): Promise<void> {
    await this.session.terminate()
  }

  getEngineType(): EngineType {
    return this.session.getEngineType()
  }

  /** Test hook: attach mock engine without full model load. */
  attachSessionForTests(engine: import('./llm/LLMEngine').LLMEngine, modelId: string): void {
    this.session.attachEngine(engine, modelId)
    this.conversation.reconcileHistoryAfterContextChange(
      this.session.getContextManager(),
      this.maxTokensPerTurn,
    )
  }
}
