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
import type * as webllm from '@mlc-ai/web-llm'
import type { VRAMOptimizationConfig } from './utils/vramOverrides'
import type { ContextWindowInfo, DynamicContextManager } from './utils/contextBudget'
import type { ChatMessage, ContentPart, GenerationOptions, GenerationUsage, LLMEngine } from './llm/LLMEngine'
import type { EngineType } from './llm/EngineFactory'
import { isMlcEngine } from './llm/engineGuards'
import type { ProfanityLevel, Agent, Message, ErrorCategory } from './types/chat'
import { PROFANITY_LEVEL, PROFANITY_INSTRUCTIONS, DEFAULT_MAX_TOKENS, ABSOLUTE_MAX_TOKENS } from './config/chatConfig'
import { buildSystemMessage } from './llm/helpers/PromptCompiler'
import { getDirectorCritiqueDepth, parseMemoryHint, type MemoryHint } from './config/contextDepth'
import { ConversationStore } from './chat/ConversationStore'
import { buildSpeakerCue, buildWritersRoomSystemPrompt, composeCuedUserMessage } from './chat/writersRoom'
import type { z } from 'zod'
import type { StructuredResult } from './llm/structured/completeStructured'

/** zod + the schema/grammar helpers load on the first structured call, outside the initial bundle. */
const loadStructured = () =>
  Promise.all([import('./llm/structured/completeStructured'), import('./llm/structured/schemas')]).then(
    ([complete, schemas]) => ({ ...complete, ...schemas }),
  )
import { ModelSession } from './chat/ModelSession'
import { PersonalityStore } from './chat/PersonalityStore'
import { personaFor } from './cast/profanity'
import { categorizeChatError } from './chat/chatErrors'
import { getStreamContent, isSentenceBoundaryEvent } from './llm/streamEvents'
import {
  EMPTY_TURN_RETRY_SUFFIX,
  isSpeakableText,
  hasStageTokens,
  logTurnText,
  retryMaxTokens,
} from './chat/speakableText'


/** Optional per-turn sampling overrides layered on the agent's defaults. */
export interface ChatSamplingOverrides {
  temperatureDelta?: number
  top_p?: number
  presence_penalty?: number
  stop?: string[]
}

export type { ProfanityLevel, Agent, Message, ErrorCategory }
export { PROFANITY_LEVEL }

/** `writers-room`: shared prefix for KV reuse (#400 B). `per-speaker`: legacy layout (`?legacyPrompt`). */
export type PromptLayout = 'writers-room' | 'per-speaker'

export function resolvePromptLayout(search?: string): PromptLayout {
  let query = search
  if (query === undefined) {
    try {
      query = typeof location !== 'undefined' ? location.search : ''
    } catch {
      query = ''
    }
  }
  return new URLSearchParams(query).has('legacyPrompt') ? 'per-speaker' : 'writers-room'
}

export interface TurnMetrics extends GenerationUsage {
  agentId: string
  at: number
  /** Why the KV prefix was rebuilt before this turn, if known. */
  chainBreak: 'trim' | 'critique' | null
}

export interface PrerenderedTurnText {
  agentId: string
  agentName: string
  response: string
  sentences: string[]
  /** Writers' room: exact cued prompt + raw output, for addToHistory (keeps the KV chain). */
  engineUser?: string
  engineResponse?: string
}

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
  private readonly REPETITION_PENALTY = 1.05
  private readonly PRESENCE_PENALTY = 0.556
  private readonly DEFAULT_PRERENDER_TURNS = 3
  private promptLayout: PromptLayout = resolvePromptLayout()
  private turnMetrics: TurnMetrics[] = []
  private pendingChainBreak: TurnMetrics['chainBreak'] = null
  /** Optional second engine (e.g. llama.cpp) for Director critiques, keeping the main KV chain intact. */
  private auxiliaryEngine: LLMEngine | null = null
  /** Minimum assistant turns between critiques on the main engine (each one rebuilds the KV prefix). */
  private critiqueMinTurns = 3
  private turnsSinceCritique = Number.POSITIVE_INFINITY

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
      /** Per-turn comedy sampling tweaks (see src/comedy/comedySamplingPlan.ts). */
      sampling?: ChatSamplingOverrides
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
    this.turnsSinceCritique++

    await this.primeTokenCounts()

    const MAX_AGENT_ATTEMPTS = 3
    let lastAgentId = this.conversation.getCurrentAgent().id
    let success = false
    let activeUserContent = historyContent

    try {
      for (let attempt = 0; attempt < MAX_AGENT_ATTEMPTS; attempt++) {
        const currentAgent = this.conversation.getCurrentAgent()
        lastAgentId = currentAgent.id

        const effectiveMaxTokens = Math.min(
          options.maxTokens ?? ABSOLUTE_MAX_TOKENS,
          this.maxTokensPerTurn,
          ABSOLUTE_MAX_TOKENS,
        )

        const turn = this.buildTurnMessages(
          this.conversation,
          currentAgent,
          activeUserContent,
          originalContent,
          options.hiddenInstruction,
          effectiveMaxTokens,
        )
        const ctxInfo = turn.info

        if (ctxInfo.droppedMessages > 0 && attempt === 0 && (turn.trimmed || !this.isWritersRoom())) {
          console.log(
            `[ContextTruncation] Dropped ${ctxInfo.droppedMessages} messages ` +
              `(${ctxInfo.usedTokens}/${ctxInfo.maxTokens} tokens used, summary: ${ctxInfo.hasSummary})`,
          )
        }

        try {
          const chatMessages = turn.chatMessages
          let sentUser = turn.lastUser

          const sampling = options.sampling
          const genOpts = {
            max_tokens: effectiveMaxTokens,
            temperature: sampling?.temperatureDelta
              ? Math.min(1.5, Math.max(0.1, currentAgent.temperature + sampling.temperatureDelta))
              : currentAgent.temperature,
            top_p: sampling?.top_p ?? currentAgent.top_p,
            seed: options.seed,
            repetition_penalty: this.REPETITION_PENALTY,
            presence_penalty: sampling?.presence_penalty ?? this.PRESENCE_PENALTY,
            stop: ['###', 'Director:', 'User:', ...(sampling?.stop ?? [])] as string[],
            stream: true as const,
            onUsage: (usage: GenerationUsage) =>
              this.recordTurnUsage(currentAgent.id, usage, turn.trimmed ? 'trim' : this.pendingChainBreak),
          }

          let { raw, cleaned } = await this.streamAssistant(
            engine,
            chatMessages,
            currentAgent,
            genOpts,
            onSentence,
          )
          logTurnText(raw, cleaned)

          if (!isSpeakableText(cleaned) && !hasStageTokens(cleaned)) {
            activeUserContent = `${historyContent}${EMPTY_TURN_RETRY_SUFFIX}`
            sentUser = turn.cue(activeUserContent)
            this.patchLastUserMessage(chatMessages, sentUser)
            const retryTokens = retryMaxTokens(
              effectiveMaxTokens,
              this.maxTokensPerTurn,
              ABSOLUTE_MAX_TOKENS,
            )
            console.warn(
              `[EmptyTurn] Unspeakable reply from ${currentAgent.id}; retrying once (max_tokens=${retryTokens})`,
            )
            ;({ raw, cleaned } = await this.streamAssistant(
              engine,
              chatMessages,
              currentAgent,
              { ...genOpts, max_tokens: retryTokens },
              onSentence,
            ))
            logTurnText(raw, cleaned)
            activeUserContent = historyContent
          }

          if (!isSpeakableText(cleaned) && !hasStageTokens(cleaned)) {
            console.warn(`[EmptyTurn] Skipping turn for ${currentAgent.id} after retry`)
            this.conversation.popLastIfUser()
            this.conversation.appendUser(historyContent)
            this.conversation.advanceAgent()
            // Reset activeUserContent so we don't poison follow-up turns
            activeUserContent = historyContent
            continue
          }

          if (this.isWritersRoom()) {
            // Raw output + the cued prompt as sent: the next request extends this one exactly.
            this.conversation.setLastUserEngineContent(turn.cue(historyContent))
            this.conversation.appendAssistant(cleaned, raw)
          } else {
            this.conversation.appendAssistant(cleaned)
          }
          this.conversation.advanceAgent()
          success = true
          return { agentId: currentAgent.id, response: cleaned }
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
    } finally {
      if (!success) {
        this.conversation.popLastIfUser()
      }
    }

    return { agentId: lastAgentId, response: '' }
  }


  /** Prompt layout: shared writers'-room prefix (default) or legacy per-speaker system prompts. */
  setPromptLayout(layout: PromptLayout): void {
    this.promptLayout = layout
  }

  getPromptLayout(): PromptLayout {
    return this.promptLayout
  }

  private isWritersRoom(): boolean {
    return this.promptLayout === 'writers-room'
  }

  private writersRoomSystemPrompt(summary: string | null): string {
    const ctx = this.session.getContextManager()
    return buildWritersRoomSystemPrompt(this.conversation.getAgents(), this.styleInstruction, {
      // Default chars/token on purpose: the prefix must not shift when the estimator recalibrates.
      contextTokens: ctx.getMaxContextTokens(),
      summary,
      profanity: this.currentProfanityLevel,
    })
  }

  /**
   * Messages for one turn. `store` must already end with the pending user message.
   * Writers' room: shared system prompt + append-only engine history + cued last user message.
   * Legacy: per-speaker system prompt (+ Director note) + depth-sliced, token-truncated history.
   */
  private buildTurnMessages(
    store: ConversationStore,
    agent: Agent,
    userContent: string,
    originalContent: string | ContentPart[],
    directorNote: string | undefined,
    reserveTokens: number,
  ): {
    chatMessages: ChatMessage[]
    lastUser: string
    info: ContextWindowInfo
    trimmed: boolean
    cue: (content: string) => string
  } {
    const contextManager = this.session.getContextManager()

    if (this.isWritersRoom()) {
      let note = directorNote?.trim() || undefined
      let cue = (content: string) => composeCuedUserMessage(content, agent, note)
      const win = store.prepareWritersRoomWindow(
        contextManager,
        (summary) => this.writersRoomSystemPrompt(summary),
        cue(userContent),
        reserveTokens,
      )
      if (win.recallSnippets.length > 0) {
        const callback = `Call back to earlier: "${win.recallSnippets.join('" / "')}"`
        note = note ? `${note} ${callback}` : callback
        cue = (content: string) => composeCuedUserMessage(content, agent, note)
      }
      const chatMessages: ChatMessage[] = win.messages.map((m) => ({ role: m.role, content: m.content }))
      const lastUser = cue(userContent)
      chatMessages[chatMessages.length - 1] = typeof originalContent !== 'string'
        ? { role: 'user', content: [...originalContent, { type: 'text', text: `\n\n${buildSpeakerCue(agent, note)}` }] }
        : { role: 'user', content: lastUser }
      return { chatMessages, lastUser, info: win.info, trimmed: win.trimmed, cue }
    }

    let fullSystemPrompt = `${personaFor(agent, this.currentProfanityLevel)}\n\n${this.styleInstruction}`
    if (directorNote?.trim()) {
      fullSystemPrompt += `\n\n### DIRECTOR'S SECRET NOTE ###\n${directorNote}\n(You MUST incorporate this note immediately!)`
    }
    const { history: depthSlicedHistory, depthLimit, hintLabel } = store.prepareHistoryForContext(false)
    const { messages, info } = store.truncateForTurn(
      contextManager,
      fullSystemPrompt,
      depthSlicedHistory,
      reserveTokens,
      depthLimit,
      hintLabel,
    )
    const chatMessages: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }))
    if (typeof originalContent !== 'string') {
      for (let i = chatMessages.length - 1; i >= 0; i--) {
        if (chatMessages[i].role === 'user') {
          chatMessages[i] = { role: 'user', content: originalContent }
          break
        }
      }
    } else {
      this.patchLastUserMessage(chatMessages, userContent)
    }
    return { chatMessages, lastUser: userContent, info, trimmed: false, cue: (content) => content }
  }

  /** Real tokenizer counts for the budget pass (async tokenizers: wllama, MLC worker). */
  private async primeTokenCounts(): Promise<void> {
    const estimator = this.session.getContextManager().getTokenEstimator()
    if (!estimator.prime) return
    const texts = this.conversation.getHistory().map((m) => m.engineContent ?? m.content)
    if (this.isWritersRoom()) texts.push(this.writersRoomSystemPrompt(null))
    try {
      await estimator.prime(texts)
    } catch {
      // Heuristic estimate is fine for this turn.
    }
  }

  private recordTurnUsage(agentId: string, usage: GenerationUsage, chainBreak: TurnMetrics['chainBreak']): void {
    const metrics: TurnMetrics = { agentId, at: Date.now(), chainBreak, ...usage }
    this.turnMetrics.push(metrics)
    if (this.turnMetrics.length > 500) this.turnMetrics.shift()
    this.pendingChainBreak = null
    console.log(
      `[TurnPerf] ${agentId} prefill=${usage.prefillTokens} ttft=${usage.ttftMs?.toFixed(0) ?? '?'}ms ` +
        `decode=${usage.decodeTokPerSec?.toFixed(1) ?? '?'} tok/s${chainBreak ? ` (chain break: ${chainBreak})` : ''}`,
    )
  }

  /** Per-turn prefill / TTFT / decode metrics (perf harness, #400 B). */
  getTurnMetrics(): readonly TurnMetrics[] {
    return this.turnMetrics
  }

  private patchLastUserMessage(chatMessages: ChatMessage[], content: string): void {
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].role === 'user') {
        chatMessages[i] = { role: 'user', content }
        return
      }
    }
  }

  private stripAssistantDecorations(text: string, agent: Agent): string {
    const namePrefixRegex = new RegExp(`^(${agent.name}|${agent.id}):\\s*`, 'i')
    return text
      .replace(namePrefixRegex, '')
      .replace(/###/g, '')
      .replace(/Director:\s*/gi, '')
      .replace(/User:\s*/gi, '')
      .trim()
  }

  private async streamAssistant(
    engine: LLMEngine,
    chatMessages: ChatMessage[],
    currentAgent: Agent,
    genOpts: GenerationOptions,
    onSentence?: (sentence: string) => void,
  ): Promise<{ raw: string; cleaned: string }> {
    const stream = await engine.chat(chatMessages, genOpts)
    let fullResponse = ''
    let buffer = ''

    const emitIfSpeakable = (sentence: string) => {
      if (!sentence) return
      if (isSpeakableText(sentence) || hasStageTokens(sentence)) onSentence?.(sentence)
    }

    for await (const event of stream) {
      const content = getStreamContent(event)
      if (!content) continue

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
        const preStop = this.stripAssistantDecorations(buffer.substring(0, earliestIdx).trim(), currentAgent)
        emitIfSpeakable(preStop)
        buffer = ''
      }

      let match
      while ((match = buffer.match(/([.!?])\s/))) {
        const endIdx = match.index! + 1
        const sentence = this.stripAssistantDecorations(buffer.substring(0, endIdx).trim(), currentAgent)
        emitIfSpeakable(sentence)
        buffer = buffer.substring(endIdx + 1)
      }

      if (isSentenceBoundaryEvent(event) && buffer.trim()) {
        const sentence = this.stripAssistantDecorations(buffer.trim(), currentAgent)
        emitIfSpeakable(sentence)
        buffer = ''
      }
    }

    if (buffer.trim()) {
      emitIfSpeakable(this.stripAssistantDecorations(buffer.trim(), currentAgent))
    }

    return {
      raw: fullResponse,
      cleaned: this.stripAssistantDecorations(fullResponse, currentAgent),
    }
  }

  /**
   * Schema-constrained call on the loaded engine (grammar on MLC / llama.cpp, validated
   * extraction + one retry elsewhere). Like a critique, it resets the main engine's KV chain.
   */
  async completeStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodType<T>,
    options: GenerationOptions & { retries?: number } = {},
  ): Promise<StructuredResult<T>> {
    const engine = this.session.getEngine()
    if (!engine || !this.session.isReady()) {
      throw new Error('GroupChatManager not initialized. Call initialize() first.')
    }
    this.pendingChainBreak = 'critique'
    const { completeStructured } = await loadStructured()
    return completeStructured(engine, messages, schema, options)
  }

  /** Route Director critiques to a second loaded engine so they never break the main KV chain. */
  setAuxiliaryEngine(engine: LLMEngine | null): void {
    this.auxiliaryEngine = engine
  }

  /** Minimum turns between main-engine critiques (0 = every call). Ignored with an auxiliary engine. */
  setCritiqueMinTurns(turns: number): void {
    this.critiqueMinTurns = Math.max(0, Math.floor(turns))
  }

  /**
   * Director critique as a schema-constrained JSON decision (#400 C) — no `split(':')` parsing.
   * On the main engine the critique replaces the conversation, so the next turn re-prefills the
   * whole prompt; calls are rate-limited to one per `critiqueMinTurns` turns unless an auxiliary
   * engine is attached.
   */
  async getDirectorCritique(): Promise<DirectorCritiqueResult> {
    const empty: DirectorCritiqueResult = {
      instruction: '',
      status: 'unknown',
      memoryHint: null,
      raw: '',
    }
    const aux = this.auxiliaryEngine?.isInitialized() ? this.auxiliaryEngine : null
    const engine = aux ?? this.session.getEngine()
    if (!engine || (!aux && !this.session.isReady())) return empty
    if (!aux && this.turnsSinceCritique < this.critiqueMinTurns) return empty

    const critiqueDepth = getDirectorCritiqueDepth(this.conversation.getEffectiveMemoryDepth())
    const recentHistory = this.conversation.getHistory().slice(-critiqueDepth)
    if (recentHistory.length === 0) return empty

    const historyText = recentHistory
      .map((m) => `${m.role === 'user' ? 'Prompt' : 'Actor'}: ${m.content}`)
      .join('\n')

    const directorSystemPrompt =
      `You are an expert Improv Director. Watch the scene below.\n` +
      `Judge it: "FLOWING" (funny, good chemistry) or "STAGNANT" (boring, repetitive).\n` +
      `Give a ONE-SENTENCE "instruction" to the NEXT actor.\n` +
      `Optionally set "memory" to zoom_in, zoom_out or recall:TOPIC when the scene needs ` +
      `tighter focus or a callback.\n` +
      `Rules:\n` +
      `- If STAGNANT: Intervene! Raise the stakes, add a disaster, or force a topic change.\n` +
      `- If FLOWING: Coach silently. Give a subtle note (e.g. "Be more suspicious," "Whisper this line").\n` +
      `Output JSON: {"status": "FLOWING" | "STAGNANT", "instruction": "...", "memory": "..."}`

    try {
      if (!aux) {
        this.turnsSinceCritique = 0
        this.pendingChainBreak = 'critique'
      }
      const { completeStructured, DirectorDecisionSchema } = await loadStructured()
      const result = await completeStructured(
        engine,
        [
          { role: 'system', content: directorSystemPrompt },
          { role: 'user', content: `RECENT DIALOGUE:\n${historyText}\n\nDIRECTOR DECISION:` },
        ],
        DirectorDecisionSchema,
        { temperature: 0.6, max_tokens: 120, stream: false },
      )
      if (!result.ok) {
        console.warn(`[Director] Critique did not match schema after ${result.attempts} attempt(s): ${result.error}`)
        return { ...empty, raw: result.raw }
      }

      const decision = result.data
      const memoryHint = decision.memory ? parseMemoryHint(decision.memory) : null
      if (memoryHint) {
        this.conversation.applyMemoryHint(memoryHint)
      }
      return {
        instruction: decision.instruction?.trim() ?? '',
        status: decision.status === 'FLOWING' ? 'flowing' : 'stagnant',
        memoryHint,
        raw: result.raw,
      }
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

  /**
   * Commit a turn generated elsewhere (prerender). Pass the prerendered `engineUser` /
   * `engineResponse` so the stored engine history matches what the model actually saw.
   */
  addToHistory(
    userMessage: string,
    assistantResponse: string,
    agentId?: string,
    engine?: { user?: string; assistant?: string },
  ): void {
    if (agentId) {
      const agentIndex = this.getAgents().findIndex(a => a.id === agentId)
      if (agentIndex !== -1) this.conversation.setAgentIndex(agentIndex)
    }
    const engineTurn =
      this.isWritersRoom() && engine?.user && engine.assistant
        ? { user: engine.user, assistant: engine.assistant }
        : undefined
    this.conversation.addTurn(userMessage, assistantResponse, engineTurn)
    this.turnsSinceCritique++
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
  ): Promise<PrerenderedTurnText[]> {
    const engine = this.session.getEngine()
    if (!engine || !this.session.isReady()) {
      throw new Error('GroupChatManager not initialized. Call initialize() first.')
    }


    // Prerender runs ahead on a fork of the live conversation: same prompt layout, so the
    // engine's KV chain extends through prerendered turns and into the live ones that follow.
    const store = this.conversation.fork()

    const prerenderedTurns: PrerenderedTurnText[] = []

    let currentPrompt = initialPrompt
    let produced = 0
    let attempts = 0
    const maxAttempts = Math.max(turnCount * 5, turnCount + store.getAgents().length)

    while (produced < turnCount && attempts < maxAttempts) {
      attempts++
      const currentAgent = store.getCurrentAgent()

      const effectiveMaxTokens = Math.min(
        options.maxTokens || this.maxTokensPerTurn,
        this.maxTokensPerTurn,
        ABSOLUTE_MAX_TOKENS,
      )

      store.appendUser(currentPrompt)
      let turn
      if (this.isWritersRoom()) {
        turn = this.buildTurnMessages(
          store,
          currentAgent,
          currentPrompt,
          currentPrompt,
          options.hiddenInstruction,
          effectiveMaxTokens,
        )
      } else {
        // Legacy prerender prompt: compiled per-agent system message, depth-sliced history.
        const systemMessage = buildSystemMessage(
          currentAgent,
          undefined,
          this.currentProfanityLevel,
          options.hiddenInstruction,
        )
        const depthSliced = store.sliceHistoryByDepth(store.getHistory(), store.getEffectiveMemoryDepth())
        const { messages, info } = this.session.getContextManager().truncate(
          systemMessage,
          depthSliced,
          effectiveMaxTokens,
        )
        turn = {
          chatMessages: messages.map((m) => ({ role: m.role, content: m.content })) as ChatMessage[],
          lastUser: currentPrompt,
          info,
          trimmed: false,
          cue: (content: string) => content,
        }
      }
      const chatMessages = turn.chatMessages
      let sentUser = turn.lastUser

      const genOpts: GenerationOptions = {
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        max_tokens: effectiveMaxTokens,
        stream: false,
        stop: ['###', 'Director:', 'User:'],
        seed: options.seed ? options.seed + attempts : undefined,
        repetition_penalty: this.REPETITION_PENALTY,
        presence_penalty: this.PRESENCE_PENALTY,
        onUsage: (usage) => this.recordTurnUsage(currentAgent.id, usage, turn.trimmed ? 'trim' : this.pendingChainBreak),
      }

      let { raw, cleaned } = await this.streamAssistant(engine, chatMessages, currentAgent, genOpts)
      logTurnText(raw, cleaned)

      if (!isSpeakableText(cleaned) && !hasStageTokens(cleaned)) {
        sentUser = turn.cue(`${currentPrompt}${EMPTY_TURN_RETRY_SUFFIX}`)
        this.patchLastUserMessage(chatMessages, sentUser)
        const retryTokens = retryMaxTokens(
          effectiveMaxTokens,
          this.maxTokensPerTurn,
          ABSOLUTE_MAX_TOKENS,
        )
        console.warn(
          `[EmptyTurn] Unspeakable prerender from ${currentAgent.id}; retrying once (max_tokens=${retryTokens})`,
        )
        ;({ raw, cleaned } = await this.streamAssistant(engine, chatMessages, currentAgent, {
          ...genOpts,
          max_tokens: retryTokens,
        }))
        logTurnText(raw, cleaned)
      }

      if (!isSpeakableText(cleaned) && !hasStageTokens(cleaned)) {
        console.warn(`[EmptyTurn] Skipping prerender slot for ${currentAgent.id}`)
        store.popLastIfUser()
        // Do not append "…"; keep the prompt so the next agent can answer it.
        store.appendUser(currentPrompt)
        store.advanceAgent()
        continue
      }

      const sentences = cleaned
        .split(/([.!?])\s+/)
        .reduce((acc: string[], part: string, idx: number, arr: string[]) => {
          if (idx % 2 === 0 && part.trim()) {
            acc.push((part + (arr[idx + 1] || '')).trim())
          }
          return acc
        }, [])
        .filter((s: string) => s.length > 0)

      const writersRoom = this.isWritersRoom()
      prerenderedTurns.push({
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        response: cleaned,
        sentences,
        ...(writersRoom ? { engineUser: sentUser, engineResponse: raw } : {}),
      })

      if (writersRoom) store.setLastUserEngineContent(turn.cue(currentPrompt))
      store.appendAssistant(cleaned, writersRoom ? raw : undefined)
      store.advanceAgent()
      currentPrompt = '(Reply naturally to the last thing said)'
      produced++
    }

    return prerenderedTurns
  }

  async chatForAgent(
    agentId: string,
    prompt: string,
    onSentence?: (sentence: string) => void,
    options: { maxTokens?: number; seed?: number; hiddenInstruction?: string; sampling?: ChatSamplingOverrides } = {},
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
    if (isMlcEngine(engine)) {
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
  attachSessionForTests(engine: LLMEngine, modelId: string): void {
    this.session.attachEngine(engine, modelId)
    this.conversation.reconcileHistoryAfterContextChange(
      this.session.getContextManager(),
      this.maxTokensPerTurn,
    )
  }
}
