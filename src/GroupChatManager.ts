import * as webllm from '@mlc-ai/web-llm'
import { loadModelWithDynamicContext } from './utils/dynamicContext'
import { appConfig, defaultModelId, OPTIMIZED_MODELS } from './config/models'
import { parallelDownloadManager } from './services/ParallelDownloadManager'

// ============================================================================
// PROFANITY LEVEL CONFIGURATION
// ============================================================================
// Adjust this to control how the AI uses profanity:
// - 'PG'       : Family-friendly, no swearing at all
// - 'CASUAL'   : Light profanity (damn, hell, crap)  
// - 'GRITTY'   : Realistic casual swearing (shit, f*ck, etc.)
// - 'UNCENSORED': Full uncensored language (use with caution)
// ============================================================================
export const PROFANITY_LEVEL: 'PG' | 'CASUAL' | 'GRITTY' | 'UNCENSORED' = 'GRITTY'

export type ProfanityLevel = 'PG' | 'CASUAL' | 'GRITTY' | 'UNCENSORED'

// Shortened style guides to reduce token usage
const PROFANITY_INSTRUCTIONS: Record<ProfanityLevel, string> = {
  PG: `Keep it family-friendly. No swearing.`,
  CASUAL: `Mild language OK (damn, hell). No strong profanity.`,
  GRITTY: `Casual swearing OK (shit, f*ck). No sexual/violent content.`,
  UNCENSORED: `Full language freedom. No sexual/violent content.`,
}

// Max conversation history to keep (prevents VRAM exhaustion)
const MAX_HISTORY_MESSAGES = 8

export interface Agent {
  id: string
  name: string
  systemPrompt: string
  temperature: number
  top_p: number
  color: string
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ErrorCategory = 'webgpu' | 'oom' | 'network' | 'unknown'

export class GroupChatManager {
  private engine: webllm.MLCEngine | null = null
  private agents: Agent[]
  private currentAgentIndex = 0
  private conversationHistory: Message[] = []
  private isInitialized = false
  private loadedModelId: string | null = null

  // Style instruction - can be changed at runtime via setProfanityLevel()
  private styleInstruction = PROFANITY_INSTRUCTIONS[PROFANITY_LEVEL]
  private currentProfanityLevel: ProfanityLevel = PROFANITY_LEVEL

  // Sampling parameters for reducing repetition
  private readonly REPETITION_PENALTY = 0.955;
  private readonly PRESENCE_PENALTY = 0.556;

  // Default prerender configuration
  private readonly DEFAULT_PRERENDER_TURNS = 3;

  constructor(agents: Agent[]) {
    this.agents = agents;
    this.loadEvolvedPersonalities();
  }

  /**
   * Loads evolved personalities from local storage.
   */
  private loadEvolvedPersonalities(): void {
    try {
      this.agents.forEach(agent => {
        const evolvedPrompt = localStorage.getItem(`jokesters-evolved-prompt-${agent.id}`);
        if (evolvedPrompt) {
          agent.systemPrompt = evolvedPrompt;
          console.log(`Loaded evolved personality for ${agent.name}`);
        }
      });
    } catch (e) {
      console.warn('Could not load evolved personalities', e);
    }
  }

  /**
   * Adjusts an agent's personality based on user feedback.
   */
  public evolvePersonality(agentId: string, feedback: 'positive' | 'negative'): void {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return;

    let adjustment = '';
    if (feedback === 'positive') {
      adjustment = ' (You received positive feedback: lean more into your current traits and be more confident.)';
    } else {
      adjustment = ' (You received negative feedback: dial back your extreme traits and try to be more agreeable.)';
    }

    if (!agent.systemPrompt.includes(adjustment)) {
        agent.systemPrompt += adjustment;
    }

    try {
        localStorage.setItem(`jokesters-evolved-prompt-${agent.id}`, agent.systemPrompt);
        console.log(`Evolved personality for ${agent.name} saved to local storage.`);
    } catch (e) {
        console.warn('Could not save evolved personality', e);
    }
  }

  /**
   * Categorize an error to provide user-friendly messaging
   */
  static getErrorCategory(error: unknown): ErrorCategory {
    const msg = error instanceof Error ? error.message : String(error)
    const msgLower = msg.toLowerCase()

    // WebGPU not available
    if (msgLower.includes('webgpu') || msgLower.includes('gpu') && msgLower.includes('not supported')) {
      return 'webgpu'
    }

    // Out of memory
    if (msgLower.includes('oom') || msgLower.includes('memory') ||
        msgLower.includes('createbuffer') || msgLower.includes('allocation')) {
      return 'oom'
    }

    // Network errors
    if (msgLower.includes('fetch') || msgLower.includes('network') ||
        msgLower.includes('err_') || msgLower.includes('cache') ||
        msgLower.includes('cdn') || msgLower.includes('timeout')) {
      return 'network'
    }

    return 'unknown'
  }

  /**
   * Set the profanity level at runtime
   */
  setProfanityLevel(level: ProfanityLevel): void {
    this.currentProfanityLevel = level
    this.styleInstruction = PROFANITY_INSTRUCTIONS[level]
    console.log(`Profanity level set to: ${level}`)
  }

  /**
   * Get the current profanity level
   */
  getProfanityLevel(): ProfanityLevel {
    return this.currentProfanityLevel
  }

  getLoadedModelId(): string | null {
    return this.loadedModelId
  }

  async initialize(
    onProgress?: (progress: webllm.InitProgressReport) => void,
    preferredModelId?: string,
    preferredContext?: number | 'auto'
  ): Promise<void> {
    if (this.isInitialized) return

    // Initialize parallel download manager for faster model loading
    try {
      await parallelDownloadManager.initialize()
      console.log('[ModelLoader] Parallel download manager initialized')
    } catch (error) {
      console.warn('[ModelLoader] Could not initialize parallel download manager:', error)
      // Continue anyway - parallel downloads are optional optimization
    }

    // Pre-check WebGPU availability before attempting model load
    const gpu = (navigator as unknown as { gpu?: unknown }).gpu
    if (!gpu) {
      throw new Error(
        'WebGPU is not supported in this browser. ' +
        'Please use Chrome 113+ or Edge 113+ with WebGPU enabled.'
      )
    }

    // Probe the GPU adapter to check for f16 shader support.
    // q4f16_1 models require the 'shader-f16' feature; without it they crash
    // with "extension 'f16' is not allowed in the current environment".
    let supportsF16 = false
    try {
      const nav = navigator as unknown as { gpu: { requestAdapter(): Promise<{ features: Set<string> } | null> } }
      const adapter = await nav.gpu.requestAdapter()
      supportsF16 = adapter?.features.has('shader-f16') ?? false
      console.log(`[ModelLoader] GPU adapter f16 support: ${supportsF16}`)
    } catch {
      console.warn('[ModelLoader] Could not query GPU adapter features; assuming no f16 support')
    }

    // Build fallback chain based on f16 capability.
    // q4f16_1 = faster/less VRAM but needs f16 shader extension.
    // q4f32_1 = universally compatible fallback.
    const autoFallbacks = supportsF16
      ? [
          defaultModelId,                                   // Hermes-3-3B-q4f16 (primary)
          OPTIMIZED_MODELS.LLAMA_3_2_3B_Q4F16.model_id,   // Llama-3.2-3B-q4f16 (fallback)
        ]
      : [
          'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',            // Hermes-3-3B-q4f32 (compatible primary)
          'Llama-3.2-3B-Instruct-q4f32_1-MLC',            // Llama-3.2-3B-q4f32 (compatible fallback)
        ]

    // If user explicitly chose a model, try it first, then fall back to auto chain
    const modelFallbacks = preferredModelId
      ? [preferredModelId, ...autoFallbacks.filter(id => id !== preferredModelId)]
      : autoFallbacks

    console.log(`[ModelLoader] Using ${supportsF16 ? 'f16 (optimized)' : 'f32 (compatible)'} model chain:`, modelFallbacks)

    let lastError: unknown = null

    for (let i = 0; i < modelFallbacks.length; i++) {
      const modelId = modelFallbacks[i]
      // Skip duplicates (e.g. if defaultModelId already matches a fallback entry)
      if (i > 0 && modelId === modelFallbacks[i - 1]) continue

      console.log(`Loading model [${i + 1}/${modelFallbacks.length}]: ${modelId}`)

      try {
        const modelConfig = appConfig.model_list.find(m => m.model_id === modelId);

        if (!modelConfig) {
          throw new Error(`Model ${modelId} not found in config`);
        }

        this.engine = await loadModelWithDynamicContext(
          modelConfig,
          preferredContext,
          onProgress
        )

        // Add repetition penalty separately if possible, or assume handled by webllm defaults
        // (dynamicContext loader currently doesn't pass repetition_penalty in chatOpts directly)

        this.isInitialized = true
        this.loadedModelId = modelId

        const actualContext = (this.engine as any).chatOpts?.context_window_size ||
                              (this.engine as any).chatConfig?.context_window_size || 'unknown';
        console.log(`GroupChatManager initialized successfully with model: ${modelId} and context: ${actualContext}`)
        return

      } catch (error) {
        lastError = error
        const msg = error instanceof Error ? error.message : String(error)

        // Categorize the failure for better diagnostics
        if (msg.includes('exit(1)') || msg.includes('ExitStatus')) {
          console.warn(
            `[ModelLoader] Model ${modelId} failed with WASM exit — likely GPU OOM or WASM mismatch.`,
            error
          )
        } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('ERR_')) {
          console.warn(
            `[ModelLoader] Model ${modelId} failed with network error — CDN or cache issue.`,
            error
          )
        } else {
          console.warn(`[ModelLoader] Model ${modelId} failed:`, error)
        }

        // Try next fallback, unless this is the last one
        if (i < modelFallbacks.length - 1) {
          const nextModel = modelFallbacks[i + 1]
          if (nextModel !== modelId) {
            onProgress?.({
              progress: 0,
              timeElapsed: 0,
              text: `Model load failed, trying fallback: ${nextModel}…`,
            })
          }
        }
      }
    }

    // All fallbacks exhausted
    console.error('Failed to initialize GroupChatManager after all fallbacks:', lastError)
    throw lastError
  }

  private buildSystemMessage(
    agentSystemPrompt: string,
    hiddenInstruction?: string
  ): string {
    let systemMessage = agentSystemPrompt + '\n\n' + this.styleInstruction;
    
    if (hiddenInstruction && hiddenInstruction.trim()) {
      systemMessage += '\n\n### DIRECTOR\'S SECRET NOTE ###\n' + hiddenInstruction + '\n(You MUST incorporate this note immediately!)';
    }
    
    return systemMessage;
  }

  async chat(
    userMessage: string,
    onSentence?: (sentence: string) => void,
    options: { maxTokens?: number; seed?: number; hiddenInstruction?: string; enablePerfTracking?: boolean } = {}
  ): Promise<{ agentId: string; response: string }> {
    if (!this.engine || !this.isInitialized) {
      throw new Error('GroupChatManager not initialized. Call initialize() first.')
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    })

    // Get current agent
    const currentAgent = this.agents[this.currentAgentIndex]

    // Build the full system prompt: agent persona + style guide + optional director note
    // web-llm requires exactly ONE system message as the first entry
    let fullSystemPrompt = `${currentAgent.systemPrompt}\n\n${this.styleInstruction}`

    // If a hiddenInstruction was provided, append it to the system prompt
    if (options.hiddenInstruction && options.hiddenInstruction.trim()) {
      fullSystemPrompt += `\n\n### DIRECTOR\'S SECRET NOTE ###\n${options.hiddenInstruction}\n(You MUST incorporate this note immediately!)`
    }

    // Create messages array with single merged system prompt
    // Truncate history to MAX_HISTORY_MESSAGES to prevent VRAM exhaustion
    const recentHistory = this.conversationHistory.slice(-MAX_HISTORY_MESSAGES)
    const messages: Message[] = [
      { role: 'system', content: fullSystemPrompt },
      ...recentHistory,
    ]

    try {
      // Generate response with stricter sampling to prevent repetition
      const completion = await this.engine.chat.completions.create({
        messages: messages as webllm.ChatCompletionMessageParam[],
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        // Hard cap at 96 tokens to reduce VRAM usage
        max_tokens: Math.min(options.maxTokens || 96, 96),
        stream: true,
        // Use a stop token plus fallbacks to catch structural shifts
        stop: ["###", "Director:", "User:"],
        // @ts-ignore - optional seed not on all runtime types
        seed: options.seed,
        // @ts-ignore - WebLLM supports this even if types might complain
        repetition_penalty: this.REPETITION_PENALTY, // Reduces repetitive patterns
        presence_penalty: this.PRESENCE_PENALTY, // Encourages new topics
      })

      let fullResponse = ''
      let buffer = ''

      // Iterate over the stream
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          buffer += content

          // If any stop token was injected, extract and emit remaining buffer
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
            const stopIdx = earliestIdx
            let preStop = buffer.substring(0, stopIdx).trim()
            // Aggressively clean name and stop token
            const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\s*`, 'i')
            preStop = preStop.replace(namePrefixRegex, '').replace(/###/g, '').replace(/Director:\s*/gi, '').replace(/User:\s*/gi, '').trim()
            if (preStop) onSentence?.(preStop)
            buffer = ''
          }

          // Simple sentence splitting logic
          // Split by [.!?] followed by space or end of string
          // We keep the delimiter with the sentence
          let match
          while ((match = buffer.match(/([.!?])\s/))) {
            const endIdx = match.index! + 1
            let sentence = buffer.substring(0, endIdx).trim()

            // CLEANUP: Remove "Agent Name:" and structural role prefixes from the start of sentences
            // This fixes the issue where they say their own name
            const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\s*`, 'i')
            sentence = sentence.replace(namePrefixRegex, '')
            // Remove explicit stop tokens if the model included them
            sentence = sentence.replace(/###/g, '').replace(/Director:\s*/gi, '').replace(/User:\s*/gi, '').trim()

            if (sentence) {
              onSentence?.(sentence)
            }
            buffer = buffer.substring(endIdx + 1) // +1 for the space we matched
          }
        }
      }

      // Emit remaining buffer as sentence if any
      if (buffer.trim()) {
        let cleanBuffer = buffer.trim()
        // Clean name from the final chunk too
        const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\s*`, 'i')
        cleanBuffer = cleanBuffer.replace(namePrefixRegex, '')
        cleanBuffer = cleanBuffer.replace(/###/g, '').replace(/Director:\s*/gi, '').replace(/User:\s*/gi, '').trim()

        onSentence?.(cleanBuffer)
      }

      // CLEANUP: Ensure the history doesn't contain the name prefix either
      // (This prevents the model from learning to copy the pattern in the next turn)
      const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\s*`, 'i')
      const cleanFullResponse = fullResponse.replace(namePrefixRegex, '').replace(/###/g, '').replace(/Director:\s*/gi, '').replace(/User:\s*/gi, '').trim()

      // Add cleaned response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: cleanFullResponse,
      })

      // Move to next agent for next turn
      this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length

      return {
        agentId: currentAgent.id,
        response: fullResponse,
      }
    } catch (error) {
      console.error('Error generating response:', error)
      throw error
    }
  }

  /**
   * DIRECTOR BRAIN: Analyzes the scene to see if it's boring or good.
   * Returns a critique string like "STAGNANT: Explosion!" or "FLOWING: Whisper."
   */
  async getDirectorCritique(): Promise<string> {
    if (!this.engine || !this.isInitialized) return ""

    // 1. Context: Only look at the last 6 lines to judge current momentum
    const recentHistory = this.conversationHistory.slice(-6)
    if (recentHistory.length === 0) return ""

    const historyText = recentHistory
      .map(m => `${m.role === 'user' ? 'Prompt' : 'Actor'}: ${m.content}`)
      .join('\n')

    // 2. The Judgment Prompt
    const directorSystemPrompt =
      `You are an expert Improv Director. Watch the scene below.\n` +
      `First, judge the scene: is it "FLOWING" (funny, good chemistry) or "STAGNANT" (boring, repetitive)?\n` +
      `Then, provide a ONE-SENTENCE direction to the NEXT actor.\n` +
      `Rules:\n` +
      `- If STAGNANT: Intervene! Raise the stakes, add a disaster, or force a topic change.\n` +
      `- If FLOWING: Coach silently. Give a subtle note (e.g. "Be more suspicious," "Whisper this line").\n` +
      `Output format: [STATUS]: [INSTRUCTION]`

    try {
      const completion = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: directorSystemPrompt },
          { role: "user", content: `RECENT DIALOGUE:\n${historyText}\n\nDIRECTOR DECISION:` }
        ],
        temperature: 0.6,
        max_tokens: 60,
      })

      return completion.choices[0]?.message?.content?.trim() || ""
    } catch (e) {
      console.warn("Director failed to think:", e)
      return ""
    }
  }

  getCurrentAgent(): Agent {
    return this.agents[this.currentAgentIndex]
  }

  getNextAgent(): Agent {
    const nextIndex = (this.currentAgentIndex + 1) % this.agents.length
    return this.agents[nextIndex]
  }

  getHistoryLength(): number {
    return this.conversationHistory.length
  }

  resetConversation(): void {
    this.conversationHistory = []
    this.currentAgentIndex = 0
  }

  getAgents(): Agent[] {
    return this.agents
  }

  /**
   * Add a user message and assistant response to the conversation history.
   * Used when playing back prerendered turns to keep history in sync.
   */
  addToHistory(userMessage: string, assistantResponse: string): void {
    this.conversationHistory.push({ role: 'user', content: userMessage })
    this.conversationHistory.push({ role: 'assistant', content: assistantResponse })
    // Move to next agent
    this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length
  }

  /**
   * Prerender multiple conversation turns ahead of time to avoid gaps.
   * This generates LLM responses for upcoming turns in the background.
   * @param initialPrompt The starting prompt for the conversation
   * @param turnCount Number of turns to prerender (default: 3)
   * @param options Options for each turn (maxTokens, seed)
   * @returns Array of prerendered responses with agent info
   */
  async prerenderTurns(
    initialPrompt: string,
    turnCount: number = this.DEFAULT_PRERENDER_TURNS,
    options: { maxTokens?: number; seed?: number; hiddenInstruction?: string; enablePerfTracking?: boolean } = {}
  ): Promise<Array<{ agentId: string; agentName: string; response: string; sentences: string[] }>> {
    if (!this.engine || !this.isInitialized) {
      throw new Error('GroupChatManager not initialized. Call initialize() first.')
    }

    console.log(`[Prerender] Starting prerender of ${turnCount} conversation turns`)
    
    const prerenderedTurns: Array<{ agentId: string; agentName: string; response: string; sentences: string[] }> = []
    
    // Save current state to restore later
    const originalHistory = [...this.conversationHistory]
    const originalAgentIndex = this.currentAgentIndex
    
    try {
      // Start with initial prompt
      let currentPrompt = initialPrompt

      for (let i = 0; i < turnCount; i++) {
        const currentAgent = this.agents[this.currentAgentIndex]
        
        // Build combined system message
        const systemMessage = this.buildSystemMessage(
          currentAgent.systemPrompt,
          options.hiddenInstruction
        )

        const messages: Message[] = [
          { role: 'system', content: systemMessage },
          ...this.conversationHistory,
          { role: 'user', content: currentPrompt }
        ]

        // Generate response (non-streaming for prerender)
        const completion = await this.engine.chat.completions.create({
          messages: messages as webllm.ChatCompletionMessageParam[],
          temperature: currentAgent.temperature,
          top_p: currentAgent.top_p,
          max_tokens: options.maxTokens || 96,
          stream: false,
          stop: ["###", "Director:", "User:"],
          // @ts-ignore - seed is supported by WebLLM but not in base OpenAI types
          seed: options.seed ? options.seed + i : undefined,
          // @ts-ignore - repetition_penalty is WebLLM-specific extension
          repetition_penalty: this.REPETITION_PENALTY,
          presence_penalty: this.PRESENCE_PENALTY,
        })

        const fullResponse = completion.choices[0]?.message?.content || ''
        
        // Clean the response
        const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\s*`, 'i')
        const cleanResponse = fullResponse
          .replace(namePrefixRegex, '')
          .replace(/###/g, '')
          .replace(/Director:\s*/gi, '')
          .replace(/User:\s*/gi, '')
          .trim()

        // Split into sentences for TTS
        const sentences = cleanResponse
          .split(/([.!?])\s+/)
          .reduce((acc: string[], part: string, idx: number, arr: string[]) => {
            if (idx % 2 === 0 && part.trim()) {
              const sentence = part + (arr[idx + 1] || '')
              acc.push(sentence.trim())
            }
            return acc
          }, [])
          .filter((s: string) => s.length > 0)

        console.log(`[Prerender] Turn ${i + 1}/${turnCount}: ${currentAgent.name} - ${sentences.length} sentences`)

        prerenderedTurns.push({
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          response: cleanResponse,
          sentences: sentences
        })

        // Update conversation history for next turn
        this.conversationHistory.push({ role: 'user', content: currentPrompt })
        this.conversationHistory.push({ role: 'assistant', content: cleanResponse })

        // Move to next agent
        this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length

        // For next iteration, use a continuation prompt
        currentPrompt = '(Reply naturally to the last thing said)'
      }

      return prerenderedTurns

    } finally {
      // Restore original state - prerendering shouldn't affect actual conversation
      this.conversationHistory = originalHistory
      this.currentAgentIndex = originalAgentIndex
    }
  }

  /**
   * Note: This method was missing and was added back to allow specialized Director modes
   * to dictate which agent speaks without automatically advancing the round-robin turn order.
   */
  async chatForAgent(
    agentId: string,
    prompt: string,
    onSentence?: (sentence: string) => void,
    options: { maxTokens?: number; seed?: number; hiddenInstruction?: string } = {}
  ): Promise<{ agentId: string; response: string }> {
    const originalIndex = this.currentAgentIndex;

    const agentIndex = this.agents.findIndex(a => a.id === agentId);
    if (agentIndex === -1) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    this.currentAgentIndex = agentIndex;

    try {
      const result = await this.chat(prompt, onSentence, options);
      this.currentAgentIndex = originalIndex;
      return result;
    } catch (error) {
      this.currentAgentIndex = originalIndex;
      throw error;
    }
  }

  /**
   * Get the conversation history.
   * Note: Added because it was missing.
   */
  getHistory(): Message[] {
    return this.conversationHistory;
  }


  /**
   * Stops the current LLM generation stream.
   * Note: Added back as it was missing.
   */
  async interrupt(): Promise<void> {
    if (this.engine) {
      // @ts-ignore - interruptGenerate might not be in the type definitions for this version of WebLLM
      await this.engine.interruptGenerate?.();
    }
  }

  public resetPerformanceMetrics() {}

  public getPerformanceReport() { return ""; }

  public get completion() { return this.engine?.chat.completions; }

  public terminate() { if (this.engine) { this.engine.unload(); } this.isInitialized = false; }
}