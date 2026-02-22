import * as webllm from '@mlc-ai/web-llm'
import { getRandomJoke, getTemplateContext, getJokeStats as getJokeStatsInternal } from './comedy/jokeLoader'
import type { JokeCategory, JokeBit } from './comedy/jokeLoader'

// ============================================================================
// PROFANITY LEVEL CONFIGURATION
// ============================================================================
// - 'PG'       : Family-friendly, no swearing
// - 'CASUAL'   : Light profanity (damn, hell)
// - 'GRITTY'   : Casual swearing (default)
// - 'UNCENSORED': Full language freedom
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

// Performance tracking configuration
const ENABLE_LATENCY_BREAKDOWN = true
const PERF_MEASUREMENT_WINDOW = 5 // Number of turns to average over

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
  content: string | Array<any>
}

/**
 * Performance metrics for a single generation
 */
export interface GenerationMetrics {
  agentId: string
  tokensGenerated: number
  prefillTokens: number
  prefillTokensPerSec: number
  decodeTokensPerSec: number
  totalTimeMs: number
  timestamp: number
}

/**
 * Optimized model configuration with 4-bit quantization support
 */
export interface OptimizedModelConfig {
  model_id: string
  model: string
  model_lib: string
  overrides: {
    context_window_size: number
    prefill_chunk_size?: number
    /** Enable speculative decoding when available */
    speculative_mode?: 'disabled' | 'small_draft' | 'medusa'
    /** Draft model for speculative decoding */
    draft_model?: string
  }
  vram_required_MB?: number
}

export class GroupChatManager {
  private engine: any = null
  private agents: Agent[]
  private currentAgentIndex = 0
  private conversationHistory: Message[] = []
  private isInitialized = false

  // Style instruction - can be changed at runtime via setProfanityLevel()
  private styleInstruction = PROFANITY_INSTRUCTIONS[PROFANITY_LEVEL]
  private currentProfanityLevel: ProfanityLevel = PROFANITY_LEVEL
  private languageInstruction: string = ''

  // Global context injected into system prompt
  private globalContext: string = '';
  private adjustmentsKey = 'jokesters-agent-adjustments';

  // ============================================================================
  // PERFORMANCE OPTIMIZATION: KV-Cache and Conversation State
  // ============================================================================
  
  /**
   * Note: WebLLM manages KV-cache automatically based on conversation matching.
   * We ensure cache-friendly patterns by maintaining consistent message structure.
  
  /**
   * Track the last agent that spoke for cache continuity
   */
  private lastSpeakingAgentId: string | null = null
  
  /**
   * Performance metrics history for benchmarking
   */
  private performanceMetrics: GenerationMetrics[] = []
  
  /**
   * Running performance statistics
   */
  private perfStats = {
    totalTokens: 0,
    totalTimeMs: 0,
    averageTokensPerSec: 0,
    lastMeasurement: 0,
  }

  // ============================================================================
  // OPTIMIZED MODEL CONFIGURATIONS
  // ============================================================================
  
  /**
   * Optimized 4-bit quantized models (q4f16_1: 4-bit weights, fp16 compute)
   * These models offer the best speed/memory tradeoff for mid-tier GPUs
   */
  public static readonly OPTIMIZED_MODELS: Record<string, OptimizedModelConfig> = {
    // Llama-3.1-8B with 4-bit quantization - target: 50 tok/sec on mid-tier GPU
    'Llama-3.1-8B-Instruct-q4f16_1-MLC': {
      model_id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
      model: 'https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC',
      model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm',
      overrides: {
        context_window_size: 4096,
        prefill_chunk_size: 1024,
        speculative_mode: 'disabled', // Enable when web-llm supports it
      },
      vram_required_MB: 5200,
    },
    // Smaller variant with 1k context for lower VRAM
    'Llama-3.1-8B-Instruct-q4f16_1-MLC-1k': {
      model_id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC-1k',
      model: 'https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC',
      model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm',
      overrides: {
        context_window_size: 1024,
        prefill_chunk_size: 1024,
        speculative_mode: 'disabled',
      },
      vram_required_MB: 4200,
    },
    // Hermes-3 8B with 4-bit quantization
    'Hermes-3-Llama-3.1-8B-q4f16_1-MLC': {
      model_id: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
      model: 'https://huggingface.co/mlc-ai/Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
      model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm',
      overrides: {
        context_window_size: 4096,
        prefill_chunk_size: 1024,
      },
      vram_required_MB: 5200,
    },
  }

  constructor(agents: Agent[]) {
    this.agents = agents
    this.loadPersonalityAdjustments();
  }

  private loadPersonalityAdjustments() {
      try {
          const stored = localStorage.getItem(this.adjustmentsKey);
          if (stored) {
              const adjustments = JSON.parse(stored);
              this.agents.forEach(agent => {
                  if (adjustments[agent.id]) {
                      agent.temperature = adjustments[agent.id].temperature;
                      agent.top_p = adjustments[agent.id].top_p;
                  }
              });
          }
      } catch (e) {
          console.warn('Failed to load personality adjustments', e);
      }
  }

  private savePersonalityAdjustments() {
      const data: Record<string, { temperature: number, top_p: number }> = {};
      this.agents.forEach(a => {
          data[a.id] = { temperature: a.temperature, top_p: a.top_p };
      });
      localStorage.setItem(this.adjustmentsKey, JSON.stringify(data));
  }

  public adjustAgentPersonality(agentId: string, feedback: 'positive' | 'negative') {
      const agent = this.agents.find(a => a.id === agentId);
      if (!agent) return;

      if (feedback === 'positive') {
          // Increase chaos slightly
          agent.temperature = Math.min(1.2, agent.temperature + 0.05);
          agent.top_p = Math.min(1.0, agent.top_p + 0.02);
      } else {
          // Decrease chaos
          agent.temperature = Math.max(0.1, agent.temperature - 0.05);
          agent.top_p = Math.max(0.1, agent.top_p - 0.02);
      }
      this.savePersonalityAdjustments();
  }

  /**
   * Set global context (e.g. previous episode summary)
   */
  setGlobalContext(context: string): void {
    this.globalContext = context;
  }

  /**
   * Set the language instruction
   */
  setLanguage(language: string): void {
    if (!language || language === 'English') {
      this.languageInstruction = '';
    } else {
      this.languageInstruction = `(SYSTEM: You MUST speak in ${language}.)`;
    }
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

  /**
   * NEW: Gracefully unloads the engine to free up VRAM.
   * This is crucial for switching models.
   */
  async terminate(): Promise<void> {
    if (this.engine) {
      console.log("Terminating current LLM engine...")
      try {
        // Use the official unload method for cleanup
        await this.engine.unload()
      } catch (error) {
        console.warn("Error unloading MLCEngine, proceeding with termination:", error)
      }
      this.engine = null
      this.isInitialized = false
      this.resetConversation()
    }
  }

  /**
   * Helper function to detect if an error is a cache-related network error
   */
  private isCacheNetworkError(error: any): boolean {
    const errMsg = (error instanceof Error ? error.message : String(error)).toLowerCase()
    return (
      errMsg.includes('cache.add') ||
      errMsg.includes("failed to execute 'add' on 'cache'") ||
      errMsg.includes('networkerror') ||
      errMsg.includes('net::err') ||
      errMsg.includes('failed to fetch') ||
      errMsg.includes('network error')
    )
  }

  /**
   * Attempt to clear the cache storage to recover from cache errors
   */
  private async clearModelCache(): Promise<void> {
    try {
      // Use globalThis for better compatibility across browser/worker contexts
      if ('caches' in globalThis) {
        const cacheNames = await caches.keys()
        console.log(`Clearing ${cacheNames.length} cache(s) to recover from error...`)
        for (const name of cacheNames) {
          await caches.delete(name)
          console.log(`Deleted cache: ${name}`)
        }
      }
    } catch (err) {
      console.warn('Failed to clear cache storage:', err)
    }
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get optimized model configuration for 4-bit quantization
   */
  getOptimizedModelConfig(modelId: string): OptimizedModelConfig | null {
    return GroupChatManager.OPTIMIZED_MODELS[modelId] || null
  }

  /**
   * MODIFIED: Accepts modelId to dynamically load the LLM.
   * Includes optimizations for 4-bit quantization and performance.
   */
  async initialize(
    modelId: string, // <-- New parameter for dynamic model loading
    onProgress?: (progress: any) => void,
    engineModule?: any
  ): Promise<void> {

    // We will rely on main.ts to call terminate() on the old instance 
    // before creating a new GroupChatManager instance, but if this is called 
    // again without creating a new instance, we should terminate the existing engine.
    if (this.engine) {
      await this.terminate()
    }

    // Basic validation to provide clearer diagnostics when things go wrong
    if (!modelId || typeof modelId !== 'string') {
      throw new Error('Invalid modelId passed to GroupChatManager.initialize')
    }

    // Use provided engine module or fallback to the bundled webllm import
    const engineLib = engineModule || (webllm as any)

    // Check if we have an optimized config for this model
    const optimizedConfig = this.getOptimizedModelConfig(modelId)
    
    // If the modelId is registered in the prebuilt list, warn if key metadata is missing
    const modelInfo = (engineLib as any).prebuiltAppConfig?.model_list?.find((m: any) => m.model_id === modelId)
    if (modelInfo) {
      if (!modelInfo.model) {
        console.warn(`Model '${modelId}' registered but missing 'model' URL field. This may cause initialization errors.`)
      }
      if (!modelInfo.model_lib) {
        // We don't require model_lib for all runtimes, but warn if it's missing for known WASM models
        console.warn(`Model '${modelId}' registered but missing 'model_lib' (WASM library) - if this model requires a specific lib, include it on the model entry.`)
      }
    } else {
      // If it's not a registered model id, it might be an explicit URL; warn otherwise
      if (!/^https?:\/\//i.test(modelId)) {
        console.warn(`Model id '${modelId}' is not registered in the engine's prebuiltAppConfig.model_list and does not look like a URL.`)
      }
    }

    // Register optimized models if not already present
    if (optimizedConfig && engineLib?.prebuiltAppConfig) {
      const existingIdx = engineLib.prebuiltAppConfig.model_list.findIndex(
        (m: any) => m.model_id === optimizedConfig.model_id
      )
      if (existingIdx === -1) {
        engineLib.prebuiltAppConfig.model_list.push({
          model: optimizedConfig.model,
          model_id: optimizedConfig.model_id,
          model_lib: optimizedConfig.model_lib,
          overrides: optimizedConfig.overrides,
          vram_required_MB: optimizedConfig.vram_required_MB,
        })
        console.log(`[Perf] Registered optimized 4-bit model: ${optimizedConfig.model_id}`)
      }
    }

    // Retry configuration
    const maxRetries = 3
    const baseDelay = 1000 // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`Retry attempt ${attempt}/${maxRetries} for loading model: ${modelId}`)
        } else {
          console.log(`Loading model: ${modelId}...`)
          if (optimizedConfig) {
            console.log(`[Perf] Using 4-bit quantization (q4f16_1), VRAM required: ~${optimizedConfig.vram_required_MB}MB`)
          }
        }

        // Build chat options with optimizations
        const chatOpts: any = {
          repetition_penalty: 1.15,
        }
        
        // Apply optimized overrides if available
        if (optimizedConfig?.overrides) {
          Object.assign(chatOpts, optimizedConfig.overrides)
        }

        // Follow the official example format
        this.engine = await engineLib.CreateMLCEngine(
          modelId, // <-- Use the dynamic modelId
          {
            // appConfig: appConfig,
            initProgressCallback: onProgress
          }, // engineConfig
          chatOpts // chatOpts (optional) - includes 4-bit quantization settings
        )

        this.isInitialized = true
        console.log(`GroupChatManager initialized successfully with model: ${modelId}`)
        
        // Reset performance stats on new initialization
        this.performanceMetrics = []
        this.perfStats = { totalTokens: 0, totalTimeMs: 0, averageTokensPerSec: 0, lastMeasurement: 0 }
        
        return // Success! Exit the function
      } catch (error) {
        console.error(`Failed to initialize GroupChatManager (attempt ${attempt}/${maxRetries}):`, error)

        // Check if this is a cache/network error
        const isCacheError = this.isCacheNetworkError(error)

        if (isCacheError && attempt < maxRetries) {
          // On cache errors, clear cache and retry
          console.log('Detected cache/network error. Clearing cache before retry...')
          await this.clearModelCache()

          // Exponential backoff: wait before retrying (delays before retry 2, 3 would be: 1s, 2s)
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.log(`Waiting ${delay}ms before retry...`)
          await this.sleep(delay)
          continue
        } else if (attempt < maxRetries) {
          // For non-cache errors, still retry but with linear delay (delays before retry 2, 3: 1s, 2s)
          const delay = baseDelay * attempt
          console.log(`Waiting ${delay}ms before retry...`)
          await this.sleep(delay)
          continue
        }

        // If we've exhausted retries, throw enhanced error
        const base = error instanceof Error ? error.message : String(error)
        let enhancedMessage = `${base} (while initializing model '${modelId}' after ${maxRetries} attempts).`

        if (isCacheError) {
          enhancedMessage += `\n\nNetwork error while fetching model assets. This commonly happens when the browser cannot fetch model files from the host (CORS, network/firewall, or blocked Host). \n \nSuggestions: \n  • Check your network connection and any firewall/proxy settings. \n  • Try a different model in the selector. \n  • If using Hugging Face/cas-bridge, ensure the model URL is reachable from your browser (open DevTools → Network to inspect failing GETs). \n  • As a fallback, download the model locally and point the app to a local URL or static server.`
        } else {
          enhancedMessage += `\n\nCheck that the model is registered in the engine's prebuiltAppConfig.model_list and that required fields like 'model' and 'model_lib' are present and reachable.`
        }
        throw new Error(enhancedMessage)
      }
    }
  }

  async chat(
    userMessage: string | Array<any>,
    onSentence?: (sentence: string) => void,
    options: { maxTokens?: number; seed?: number; enablePerfTracking?: boolean } = {}
  ): Promise<{ agentId: string; response: string; metrics?: GenerationMetrics }> {
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

    // Build merged system prompt: agent persona + style guide + language
    const fullSystemPrompt = `${currentAgent.systemPrompt}\n\n${this.styleInstruction}\n\n${this.languageInstruction}\n\n${this.globalContext}`

    // Truncate history to MAX_HISTORY_MESSAGES to prevent VRAM exhaustion
    const recentHistory = this.conversationHistory.slice(-MAX_HISTORY_MESSAGES)
    
    // ============================================================================
    // PERFORMANCE OPTIMIZATION: KV-Cache Reuse Strategy
    // ============================================================================
    // WebLLM automatically preserves KV cache when the conversation matches.
    // To maximize cache hits:
    // 1. Maintain consistent message structure
    // 2. Use the same system prompt format between turns
    // 3. Avoid unnecessary conversation resets
    
    const messages: Message[] = [
      { role: 'system', content: fullSystemPrompt },
      ...recentHistory,
    ]
    
    // Performance tracking start time
    const startTime = performance.now()
    let tokenCount = 0

    try {
      // Generate response with optimized settings
      const completion = await this.engine.chat.completions.create({
        messages: messages as any[],
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        // Hard cap at 96 tokens to reduce VRAM usage
        max_tokens: Math.min(options.maxTokens || 96, 96),
        stream: true,
        // Use a stop token plus fallbacks to catch structural shifts
        stop: ["###", "Director:", "User:"],
        // @ts-ignore - optional seed not on all runtime types
        seed: options.seed,
        // @ts-ignore - runtime may support this even if types might complain
        presence_penalty: 0.6,
        // @ts-ignore - enable latency breakdown for performance monitoring
        enable_latency_breakdown: ENABLE_LATENCY_BREAKDOWN && (options.enablePerfTracking !== false),
      })

      let fullResponse = ''
      let buffer = ''

      // Iterate over the stream
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          buffer += content
          tokenCount++

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
            const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
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
        const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
        cleanBuffer = cleanBuffer.replace(namePrefixRegex, '')
        cleanBuffer = cleanBuffer.replace(/###/g, '').replace(/Director:\s*/gi, '').replace(/User:\s*/gi, '').trim()

        onSentence?.(cleanBuffer)
      }

      // CLEANUP: Ensure the history doesn't contain the name prefix either
      // (This prevents the model from learning to copy the pattern in the next turn)
      const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
      const cleanFullResponse = fullResponse.replace(namePrefixRegex, '').replace(/###/g, '').replace(/Director:\s*/gi, '').replace(/User:\s*/gi, '').trim()

      // Add cleaned response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: cleanFullResponse,
      })

      // Update KV-cache tracking
      this.lastSpeakingAgentId = currentAgent.id

      // Move to next agent for next turn
      this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length

      // ============================================================================
      // PERFORMANCE METRICS COLLECTION
      // ============================================================================
      const endTime = performance.now()
      const totalTimeMs = endTime - startTime
      
      // Try to get detailed stats from engine
      let prefillTokens = 0
      
      try {
        if (this.engine && typeof this.engine.runtimeStatsText === 'function') {
          const statsText = await this.engine.runtimeStatsText()
          // Parse stats if available
          console.log('[Perf] Runtime stats:', statsText)
        }
      } catch (e) {
        // Stats may not be available, ignore
      }
      
      // Calculate tokens/sec
      const tokensPerSec = tokenCount > 0 ? (tokenCount / (totalTimeMs / 1000)) : 0
      
      // Update running stats
      this.perfStats.totalTokens += tokenCount
      this.perfStats.totalTimeMs += totalTimeMs
      this.perfStats.averageTokensPerSec = this.perfStats.totalTokens / (this.perfStats.totalTimeMs / 1000)
      
      const metrics: GenerationMetrics = {
        agentId: currentAgent.id,
        tokensGenerated: tokenCount,
        prefillTokens,
        prefillTokensPerSec: 0,  // Reserved for future engine API
        decodeTokensPerSec: tokensPerSec,
        totalTimeMs,
        timestamp: Date.now(),
      }
      
      this.performanceMetrics.push(metrics)
      
      // Keep only last N measurements
      if (this.performanceMetrics.length > PERF_MEASUREMENT_WINDOW * this.agents.length) {
        this.performanceMetrics.shift()
      }
      
      // Log performance summary periodically
      if (this.performanceMetrics.length % this.agents.length === 0) {
        this.logPerformanceSummary()
      }

      return {
        agentId: currentAgent.id,
        response: fullResponse,
        metrics: options.enablePerfTracking !== false ? metrics : undefined,
      }
    } catch (error) {
      console.error('Error generating response:', error)
      throw error
    }
  }

  /**
   * Chat forcing a specific agent (for scripted modes)
   * NOTE: This breaks KV-cache continuity since we're switching agents
   */
  async chatForAgent(
    agentId: string,
    userMessage: string | Array<any>,
    onSentence?: (sentence: string) => void,
    options: { maxTokens?: number; seed?: number; enablePerfTracking?: boolean } = {}
  ): Promise<{ agentId: string; response: string; metrics?: GenerationMetrics }> {
    const savedIndex = this.currentAgentIndex;

    // Find and set target agent index
    const targetIndex = this.agents.findIndex(agent => agent.id === agentId);
    if (targetIndex === -1) {
      throw new Error(`Agent ${agentId} not found`);
    }
    this.currentAgentIndex = targetIndex;
    
    // Reset last speaking agent to break cache continuity for forced switches
    // This ensures the system prompt is properly loaded for the new agent
    this.lastSpeakingAgentId = null;

    try {
      return await this.chat(userMessage, onSentence, options);
    } finally {
      // Restore original index after chat (don't advance for script)
      this.currentAgentIndex = savedIndex;
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING API
  // ============================================================================
  
  /**
   * Get current performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.perfStats,
      recentMetrics: this.performanceMetrics.slice(-10),
    }
  }
  
  /**
   * Get detailed performance report for benchmarking
   */
  getPerformanceReport(): string {
    if (this.performanceMetrics.length === 0) {
      return 'No performance data collected yet.'
    }
    
    const recent = this.performanceMetrics.slice(-PERF_MEASUREMENT_WINDOW * this.agents.length)
    const avgTokensPerSec = recent.reduce((sum, m) => sum + m.decodeTokensPerSec, 0) / recent.length
    const avgLatency = recent.reduce((sum, m) => sum + m.totalTimeMs, 0) / recent.length
    const totalTokens = recent.reduce((sum, m) => sum + m.tokensGenerated, 0)
    
    const byAgent: Record<string, { count: number; avgTokensPerSec: number; avgLatency: number }> = {}
    for (const m of recent) {
      if (!byAgent[m.agentId]) {
        byAgent[m.agentId] = { count: 0, avgTokensPerSec: 0, avgLatency: 0 }
      }
      byAgent[m.agentId].count++
      byAgent[m.agentId].avgTokensPerSec += m.decodeTokensPerSec
      byAgent[m.agentId].avgLatency += m.totalTimeMs
    }
    
    for (const agentId in byAgent) {
      byAgent[agentId].avgTokensPerSec /= byAgent[agentId].count
      byAgent[agentId].avgLatency /= byAgent[agentId].count
    }
    
    return `
=== LLM Performance Report ===
Total turns measured: ${recent.length}
Total tokens generated: ${totalTokens}
Average tokens/sec: ${avgTokensPerSec.toFixed(2)}
Average latency: ${avgLatency.toFixed(0)}ms

Per-Agent Performance:
${Object.entries(byAgent).map(([id, stats]) => 
  `  ${id}: ${stats.avgTokensPerSec.toFixed(2)} tok/sec (${stats.count} turns)`
).join('\n')}

Model: ${this.getCurrentModelId() || 'Unknown'}
4-bit quantization: Enabled (q4f16_1)
KV-cache optimization: ${this.lastSpeakingAgentId ? 'Active' : 'Reset'}
===============================
    `.trim()
  }
  
  /**
   * Log performance summary to console
   */
  private logPerformanceSummary(): void {
    const report = this.getPerformanceReport()
    console.log('[Perf]\n' + report)
  }
  
  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = []
    this.perfStats = { totalTokens: 0, totalTimeMs: 0, averageTokensPerSec: 0, lastMeasurement: 0 }
  }
  
  /**
   * Get the currently loaded model ID
   */
  private getCurrentModelId(): string | null {
    // Access internal engine state if available
    if (this.engine && (this.engine as any).loadedModelIdToPipeline) {
      const modelIds = Array.from((this.engine as any).loadedModelIdToPipeline.keys())
      return (modelIds[0] as string) || null
    }
    return null
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

  getHistory(): Message[] {
    return this.conversationHistory
  }

  resetConversation(): void {
    this.conversationHistory = []
    this.currentAgentIndex = 0
    this.lastSpeakingAgentId = null
    console.log('[Perf] Conversation reset - KV cache cleared')
  }

  /**
   * Interrupts the current generation if the engine supports it.
   */
  async interrupt(): Promise<void> {
    if (this.engine && typeof this.engine.interruptGenerate === 'function') {
      try {
        await this.engine.interruptGenerate()
      } catch (e) {
        console.warn('Failed to interrupt engine:', e)
      }
    }
  }

  getAgents(): Agent[] {
    return this.agents
  }

  /**
   * One-off completion that bypasses the conversation history.
   * Useful for generating scripts, summaries, or other tasks.
   */
  async completion(
    messages: Message[],
    options: { maxTokens?: number; temperature?: number; jsonMode?: boolean; enablePerfTracking?: boolean } = {}
  ): Promise<string> {
    if (!this.engine || !this.isInitialized) {
      throw new Error('GroupChatManager not initialized. Call initialize() first.')
    }

    const startTime = performance.now()

    try {
      const completion = await this.engine.chat.completions.create({
        messages: messages as any[],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1024,
        response_format: options.jsonMode ? { type: "json_object" } : undefined,
        // @ts-ignore - enable latency breakdown for performance monitoring
        enable_latency_breakdown: ENABLE_LATENCY_BREAKDOWN && (options.enablePerfTracking !== false),
      });

      const endTime = performance.now()
      
      if (options.enablePerfTracking !== false) {
        console.log(`[Perf] Completion took ${(endTime - startTime).toFixed(0)}ms`)
      }

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Completion error:', error);
      throw error;
    }
  }

  // ============================================================================
  // SPONTANEOUS JOKE INTEGRATION
  // ============================================================================

  /**
   * Get a random joke from the joke database.
   * Used when agents need "spontaneous" comedy content.
   * 
   * @param category Optional category filter ('absurdist', 'dark_tech', 'crowd_work')
   * @returns JokeBit with joke data
   */
  async getSpontaneousJoke(category?: JokeCategory): Promise<JokeBit> {
    return getRandomJoke(category)
  }

  /**
   * Inject a spontaneous joke into the conversation context.
   * The next agent will incorporate this joke into their response.
   * 
   * @param category Optional joke category
   * @returns The injected joke for reference
   */
  async injectSpontaneousJoke(category?: JokeCategory): Promise<JokeBit> {
    const joke = await getRandomJoke(category)
    
    // Create a system message that suggests the joke topic
    let prompt: string
    if (joke.category === 'dark_tech' && joke.agentLines) {
      // For multi-agent bits, let current agent deliver their line
      const currentAgent = this.getCurrentAgent()
      prompt = joke.agentLines[currentAgent.id] || joke.setup
    } else if (joke.punchline) {
      prompt = `(SYSTEM: Work this bit into the conversation naturally. Setup: "${joke.setup}" Punchline: "${joke.punchline}")`
    } else {
      prompt = `(SYSTEM: Reference this: "${joke.setup}")`
    }
    
    // Add to conversation history as a "user" directive
    this.conversationHistory.push({
      role: 'user',
      content: prompt,
    })
    
    console.log('[GroupChatManager] Injected spontaneous joke:', joke.id || 'unknown', '-', joke.tags.join(', '))
    
    return joke
  }

  /**
   * Get crowd work content with current browser/time context substituted.
   * Useful for interactive audience engagement moments.
   * 
   * @returns Crowd work prompt with templates filled in
   */
  async getCrowdWorkPrompt(): Promise<string> {
    const joke = await getRandomJoke('crowd_work')
    return joke.content || joke.setup
  }

  /**
   * Get the current template context (browser, time, location).
   * Exposed for external systems that need browser detection info.
   */
  getTemplateContext() {
    return getTemplateContext()
  }

  /**
   * Get joke database statistics.
   * Useful for UI display or debugging.
   */
  async getJokeStats() {
    return getJokeStatsInternal()
  }
}
