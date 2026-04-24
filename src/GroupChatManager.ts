import * as webllm from '@mlc-ai/web-llm'
import {
  loadModelWithDynamicContext,
  DynamicContextManager,
  type VRAMOptimizationConfig,
  type ContextWindowInfo,
  DEFAULT_VRAM_CONFIG,
} from './utils/dynamicContext'
import { 
  appConfig, 
  checkF16Support,
  getModelFallbackChain,
  getModelInfo,
  getUnifiedModelById,
  UNIFIED_MODELS,
} from './config/models'
import { parallelDownloadManager } from './services/ParallelDownloadManager'
import type { LLMEngine, ChatMessage } from './llm/LLMEngine'
import type { EngineType } from './llm/EngineFactory'
import { EngineFactory } from './llm/EngineFactory'
import { MlcEngineAdapter } from './llm/MlcEngineAdapter'

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

// Default max tokens per generation turn (user-adjustable via UI slider)
const DEFAULT_MAX_TOKENS = 96
// Absolute ceiling — never exceed this regardless of user setting
const ABSOLUTE_MAX_TOKENS = 512

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
  private engine: LLMEngine | null = null
  private engineType: EngineType = 'mlc'
  private agents: Agent[]
  private currentAgentIndex = 0
  private conversationHistory: Message[] = []
  private isInitialized = false
  private loadedModelId: string | null = null

  // Token-level context window manager
  private contextManager: DynamicContextManager
  private lastContextInfo: ContextWindowInfo | null = null

  // User-configurable max tokens per turn (exposed via UI slider)
  private maxTokensPerTurn: number = DEFAULT_MAX_TOKENS

  // VRAM optimization config
  private vramConfig: VRAMOptimizationConfig = { ...DEFAULT_VRAM_CONFIG }

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
    // Default context budget; updated after model loads with actual context_window_size
    this.contextManager = new DynamicContextManager(4096);
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

    // Out of memory — includes WebGPU buffer cascade errors (AbortError from mapAsync, device loss)
    if (msgLower.includes('oom') || msgLower.includes('memory') ||
        msgLower.includes('createbuffer') || msgLower.includes('allocation') ||
        msgLower.includes('mapasync') || msgLower.includes('buffer was unmapped') ||
        msgLower.includes('device is lost') || msgLower.includes('device lost')) {
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

  // =========================================================================
  // Token Budget / Max Output Capping
  // =========================================================================

  /**
   * Set the per-turn max token limit. Clamped to [16, ABSOLUTE_MAX_TOKENS].
   * The UI slider calls this. When OOM occurs during generation the value
   * is automatically reduced.
   */
  setMaxTokensPerTurn(tokens: number): void {
    this.maxTokensPerTurn = Math.max(16, Math.min(tokens, ABSOLUTE_MAX_TOKENS))
    console.log(`[TokenBudget] Max tokens per turn: ${this.maxTokensPerTurn}`)
  }

  getMaxTokensPerTurn(): number {
    return this.maxTokensPerTurn
  }

  // =========================================================================
  // VRAM Optimization Config
  // =========================================================================

  /** Update VRAM optimization overrides (called from advanced settings UI) */
  setVRAMConfig(config: Partial<VRAMOptimizationConfig>): void {
    this.vramConfig = { ...this.vramConfig, ...config }
    console.log('[VRAMConfig] Updated:', this.vramConfig)
  }

  getVRAMConfig(): VRAMOptimizationConfig {
    return { ...this.vramConfig }
  }

  // =========================================================================
  // Context Window Info
  // =========================================================================

  /** Get the last computed context window usage info (for UI display) */
  getContextWindowInfo(): ContextWindowInfo | null {
    return this.lastContextInfo
  }

  /** Get the DynamicContextManager instance */
  getContextManager(): DynamicContextManager {
    return this.contextManager
  }

  async initialize(
    onProgress?: (progress: webllm.InitProgressReport) => void,
    preferredModelId?: string,
    preferredContext?: number | 'auto',
    enginePreference: EngineType = 'auto'
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

    this.engineType = enginePreference

    // Probe GPU limits early so we can avoid engines that will fail
    const gpuLimits = await EngineFactory.detectWebGPULimits()
    const lowBufferLimit = gpuLimits.maxBufferSize > 0 && gpuLimits.maxBufferSize < 512_000_000
    if (lowBufferLimit) {
      console.warn(`[ModelLoader] maxBufferSize (${gpuLimits.maxBufferSize}) is below 512MB. MLC WebLLM models are likely to fail.`)
    }

    // Check if we're using legacy model IDs (MLC format) or unified model IDs
    const unifiedModel = preferredModelId ? getUnifiedModelById(preferredModelId) : null

    if (unifiedModel) {
      // If buffer limit is low and this model would auto-select MLC, force a CPU-safe engine
      if (lowBufferLimit) {
        const support = EngineFactory.getModelEngineSupport(unifiedModel)
        if (support.recommended === 'mlc' && (support.llamacpp || support.transformers)) {
          const forcedEngine: EngineType = support.llamacpp ? 'llamacpp' : 'transformers'
          console.warn(`[ModelLoader] Forcing ${forcedEngine} engine because maxBufferSize is too low for MLC`)
          await this.initializeUnified(unifiedModel, onProgress, preferredContext, forcedEngine)
          return
        } else if (support.recommended === 'mlc') {
          // MLC-only unified model — switch to tiny CPU fallback
          const fallbackModel = UNIFIED_MODELS.find(m => m.id === 'TinyLlama-1.1B-Chat-GGUF')
          if (fallbackModel) {
            console.warn(`[ModelLoader] Model ${unifiedModel.id} requires MLC but maxBufferSize is too low. Switching to ${fallbackModel.id}`)
            await this.initializeUnified(fallbackModel, onProgress, preferredContext, 'llamacpp')
            return
          }
        }
      }
      // Use the new dual-engine path
      await this.initializeUnified(unifiedModel, onProgress, preferredContext, enginePreference)
    } else {
      // Legacy path — if buffer limit is too low, skip MLC entirely
      if (lowBufferLimit) {
        console.warn(`[ModelLoader] maxBufferSize (${gpuLimits.maxBufferSize}) is too low for MLC legacy models. Switching to unified CPU fallback.`)
        const fallbackModel = UNIFIED_MODELS.find(m => m.id === 'TinyLlama-1.1B-Chat-GGUF')
        if (fallbackModel) {
          await this.initializeUnified(fallbackModel, onProgress, preferredContext, 'llamacpp')
          return
        }
      }
      // Use the legacy MLC-only path for backward compatibility
      await this.initializeLegacy(onProgress, preferredModelId, preferredContext)
    }
  }

  /**
   * Initialize using the new unified model configuration
   */
  private async initializeUnified(
    modelConfig: import('./llm/LLMEngine').UnifiedModelConfig,
    onProgress?: (progress: webllm.InitProgressReport) => void,
    preferredContext?: number | 'auto',
    enginePreference: EngineType = 'auto'
  ): Promise<void> {
    // Select and create the appropriate engine
    this.engine = await EngineFactory.selectEngine(modelConfig, enginePreference)
    this.engineType = this.engine.id as EngineType as import('./llm/EngineFactory').EngineType

    console.log(`[ModelLoader] Using ${this.engineType} engine for model: ${modelConfig.id}`)

    try {
      await this.engine.initialize(modelConfig, (report) => {
        onProgress?.({
          progress: report.progress,
          timeElapsed: report.timeElapsed,
          text: report.text,
        })
      })

      this.isInitialized = true
      this.loadedModelId = modelConfig.id

      // Set context window size, respecting user preference
      let contextSize: number
      if (preferredContext && preferredContext !== 'auto') {
        contextSize = preferredContext
        console.log(`[ModelLoader] Using user-selected context window: ${contextSize} tokens`)
      } else {
        contextSize = modelConfig.context_window_size || 4096
        console.log(`[ModelLoader] Using model default context window: ${contextSize} tokens`)
      }
      this.contextManager.setMaxContextTokens(contextSize)

      console.log(`GroupChatManager initialized successfully with unified model: ${modelConfig.id} (${this.engineType})`)
    } catch (error) {
      this.engine = null
      throw error
    }
  }

  /**
   * Legacy initialization path for MLC-only models
   */
  private async initializeLegacy(
    onProgress?: (progress: webllm.InitProgressReport) => void,
    preferredModelId?: string,
    preferredContext?: number | 'auto'
  ): Promise<void> {
    // Pre-check WebGPU availability before attempting model load
    const gpu = (navigator as unknown as { gpu?: unknown }).gpu
    if (!gpu) {
      throw new Error(
        'WebGPU is not supported in this browser. ' +
        'Please use Chrome 113+ or Edge 113+ with WebGPU enabled.'
      )
    }

    // Probe the GPU adapter to check for f16 shader support.
    const supportsF16 = await checkF16Support()
    console.log(`[ModelLoader] GPU adapter f16 support: ${supportsF16}`)

    if (!supportsF16) {
      console.log('[ModelLoader] WebGPU does not support shader-f16, using FP32 models only')
    }

    // Build fallback chain prioritizing VPS-hosted FP32 models
    const autoFallbacks = getModelFallbackChain()
    
    // Filter out f16 models if not supported
    const compatibleFallbacks = supportsF16 
      ? autoFallbacks
      : autoFallbacks.filter(id => {
          const info = getModelInfo(id)
          return !info?.requires_f16 && !id.includes('q4f16')
        })

    // If user explicitly chose a model, try it first, then fall back to chain
    // CRITICAL FIX: only prepend preferredModelId if it passed the compatibility filter
    const modelFallbacks = preferredModelId && compatibleFallbacks.includes(preferredModelId)
      ? [preferredModelId, ...compatibleFallbacks.filter(id => id !== preferredModelId)]
      : compatibleFallbacks

    console.log(`[ModelLoader] Model fallback chain (${supportsF16 ? 'f16 enabled' : 'f32 only'}):`, modelFallbacks)

    let lastError: unknown = null

    for (let i = 0; i < modelFallbacks.length; i++) {
      const modelId = modelFallbacks[i]
      // Skip duplicates
      if (i > 0 && modelId === modelFallbacks[i - 1]) continue

      console.log(`Loading model [${i + 1}/${modelFallbacks.length}]: ${modelId}`)

      try {
        const modelConfig = appConfig.model_list.find(m => m.model_id === modelId);

        if (!modelConfig) {
          throw new Error(`Model ${modelId} not found in config`);
        }

        // Use legacy load path
        const mlcEngine = await loadModelWithDynamicContext(
          modelConfig,
          preferredContext,
          onProgress,
          this.vramConfig,
        )

        // Wrap the MLC engine in our adapter
        const adapter = new MlcEngineAdapter()
        // Manually set up the adapter with the loaded engine
        ;(adapter as any).engine = mlcEngine
        ;(adapter as any).initialized = true
        ;(adapter as any).modelConfig = {
          id: modelId,
          name: modelId,
          description: 'Legacy MLC model',
          size: 'unknown',
          defaultQuantization: modelId.includes('q4f16') ? 'q4f16' : 'q4f32',
          mlc: {
            modelId: modelId,
            modelUrl: modelConfig.model,
            modelLibUrl: modelConfig.model_lib,
            contextWindowSize: modelConfig.overrides?.context_window_size || 4096,
            prefillChunkSize: modelConfig.overrides?.prefill_chunk_size || 1024,
            vramRequiredMB: modelConfig.vram_required_MB || 4000,
            requiresF16: modelId.includes('q4f16'),
          }
        }

        this.engine = adapter
        this.isInitialized = true
        this.loadedModelId = modelId
        this.engineType = 'mlc'

        const actualContext = (mlcEngine as any).chatOpts?.context_window_size ||
                              (mlcEngine as any).chatConfig?.context_window_size || 4096;
        // Sync the DynamicContextManager with the actual context window loaded
        if (typeof actualContext === 'number') {
          this.contextManager.setMaxContextTokens(actualContext);
        }
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
    // Final Hail Mary: if the failure was OOM/buffer-related, try a tiny CPU-safe unified model
    const lastMsg = lastError instanceof Error ? lastError.message : String(lastError)
    const isOOM = lastMsg.toLowerCase().includes('oom') ||
                  lastMsg.toLowerCase().includes('memory') ||
                  lastMsg.toLowerCase().includes('createbuffer') ||
                  lastMsg.toLowerCase().includes('buffer size')
    if (isOOM) {
      console.warn('[ModelLoader] All MLC fallbacks failed with OOM/buffer errors. Attempting unified CPU fallback.')
      const fallbackModel = UNIFIED_MODELS.find(m => m.id === 'TinyLlama-1.1B-Chat-GGUF')
      if (fallbackModel) {
        try {
          await this.initializeUnified(fallbackModel, onProgress, preferredContext, 'llamacpp')
          return
        } catch (fallbackError) {
          console.error('[ModelLoader] Unified CPU fallback also failed:', fallbackError)
        }
      }
    }

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
    let fullSystemPrompt = `${currentAgent.systemPrompt}\n\n${this.styleInstruction}`

    // If a hiddenInstruction was provided, append it to the system prompt
    if (options.hiddenInstruction && options.hiddenInstruction.trim()) {
      fullSystemPrompt += `\n\n### DIRECTOR\'S SECRET NOTE ###\n${options.hiddenInstruction}\n(You MUST incorporate this note immediately!)`
    }

    // Create messages array with single merged system prompt
    // Token-level truncation via DynamicContextManager (replaces old message-count cap)
    const effectiveMaxTokens = Math.min(
      options.maxTokens ?? ABSOLUTE_MAX_TOKENS,
      this.maxTokensPerTurn,
      ABSOLUTE_MAX_TOKENS,
    )
    const { messages, info: ctxInfo } = this.contextManager.truncate(
      fullSystemPrompt,
      this.conversationHistory,
      effectiveMaxTokens,
    )
    this.lastContextInfo = ctxInfo

    if (ctxInfo.droppedMessages > 0) {
      console.log(
        `[ContextTruncation] Dropped ${ctxInfo.droppedMessages} messages ` +
        `(${ctxInfo.usedTokens}/${ctxInfo.maxTokens} tokens used, ` +
        `summary: ${ctxInfo.hasSummary})`
      )
    }

    try {
      // Generate response using the LLMEngine abstraction
      const chatMessages: ChatMessage[] = messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }))

      const stream = await this.engine.chat(chatMessages, {
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

      // Iterate over the stream
      for await (const content of stream) {
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
            const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
            preStop = preStop.replace(namePrefixRegex, '').replace(/###/g, '').replace(/Director:\\s*/gi, '').replace(/User:\\s*/gi, '').trim()
            if (preStop) onSentence?.(preStop)
            buffer = ''
          }

          // Simple sentence splitting logic
          let match
          while ((match = buffer.match(/([.!?])\\s/))) {
            const endIdx = match.index! + 1
            let sentence = buffer.substring(0, endIdx).trim()

            // CLEANUP: Remove "Agent Name:" and structural role prefixes from the start of sentences
            const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
            sentence = sentence.replace(namePrefixRegex, '')
            // Remove explicit stop tokens if the model included them
            sentence = sentence.replace(/###/g, '').replace(/Director:\\s*/gi, '').replace(/User:\\s*/gi, '').trim()

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
        const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
        cleanBuffer = cleanBuffer.replace(namePrefixRegex, '')
        cleanBuffer = cleanBuffer.replace(/###/g, '').replace(/Director:\\s*/gi, '').replace(/User:\\s*/gi, '').trim()

        onSentence?.(cleanBuffer)
      }

      // CLEANUP: Ensure the history doesn't contain the name prefix either
      const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
      const cleanFullResponse = fullResponse.replace(namePrefixRegex, '').replace(/###/g, '').replace(/Director:\\s*/gi, '').replace(/User:\\s*/gi, '').trim()

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
      const msg = error instanceof Error ? error.message : String(error)

      // WebLLM throws ModelNotLoadedError when the GPU device was lost after init
      // appeared to succeed. Reset engine state so callers know re-init is required.
      if (msg.includes('Model not loaded') || msg.includes('not loaded before')) {
        this.isInitialized = false
        this.engine = null
        throw new Error(
          'The AI model was unloaded unexpectedly (GPU device lost). Please reload the page.'
        )
      }

      // On OOM during generation, automatically reduce max tokens for future turns
      const category = GroupChatManager.getErrorCategory(error)
      if (category === 'oom' && this.maxTokensPerTurn > 32) {
        const reduced = Math.max(32, Math.floor(this.maxTokensPerTurn * 0.6))
        console.warn(
          `[TokenBudget] OOM during generation — reducing maxTokensPerTurn from ${this.maxTokensPerTurn} to ${reduced}`
        )
        this.maxTokensPerTurn = reduced
      }
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
      const stream = await this.engine.chat([
        { role: 'system', content: directorSystemPrompt },
        { role: 'user', content: `RECENT DIALOGUE:\n${historyText}\n\nDIRECTOR DECISION:` }
      ], {
        temperature: 0.6,
        max_tokens: 60,
        stream: false,
      })

      // For non-streaming, collect the full response
      let response = ''
      for await (const chunk of stream) {
        response += chunk
      }
      
      return response.trim() || ""
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

        const effectiveMaxTokens = Math.min(
          options.maxTokens || this.maxTokensPerTurn,
          this.maxTokensPerTurn,
          ABSOLUTE_MAX_TOKENS,
        )

        // Token-level truncation for prerender context
        const historyWithPrompt: Message[] = [
          ...this.conversationHistory,
          { role: 'user', content: currentPrompt },
        ]
        const { messages } = this.contextManager.truncate(
          systemMessage,
          historyWithPrompt,
          effectiveMaxTokens,
        )

        // Convert to ChatMessage format
        const chatMessages: ChatMessage[] = messages.map(m => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        }))

        // Generate response (non-streaming for prerender)
        const stream = await this.engine.chat(chatMessages, {
          temperature: currentAgent.temperature,
          top_p: currentAgent.top_p,
          max_tokens: effectiveMaxTokens,
          stream: false,
          stop: ['###', 'Director:', 'User:'],
          seed: options.seed ? options.seed + i : undefined,
          repetition_penalty: this.REPETITION_PENALTY,
          presence_penalty: this.PRESENCE_PENALTY,
        })

        // Collect full response
        let fullResponse = ''
        for await (const chunk of stream) {
          fullResponse += chunk
        }
        
        // Clean the response
        const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
        const cleanResponse = fullResponse
          .replace(namePrefixRegex, '')
          .replace(/###/g, '')
          .replace(/Director:\\s*/gi, '')
          .replace(/User:\\s*/gi, '')
          .trim()

        // Split into sentences for TTS
        const sentences = cleanResponse
          .split(/([.!?])\\s+/)
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
    if (this.engine?.interrupt) {
      await this.engine.interrupt();
    }
  }

  public resetPerformanceMetrics() {}

  public getPerformanceReport() { return ""; }

  /**
   * Get the underlying completion interface (for backward compatibility)
   */
  public get completion() { 
    // For MLC engine, return the completions interface
    if (this.engine instanceof MlcEngineAdapter) {
      return (this.engine as any).engine?.chat?.completions;
    }
    return null;
  }

  public async terminate() { 
    if (this.engine) { 
      await this.engine.terminate();
    }
    this.isInitialized = false;
  }

  /**
   * Get the current engine type
   */
  public getEngineType(): EngineType {
    return this.engineType
  }
}
