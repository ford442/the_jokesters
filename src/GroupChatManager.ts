import * as webllm from '@mlc-ai/web-llm'

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

export class GroupChatManager {
  private engine: any = null
  private agents: Agent[]
  private currentAgentIndex = 0
  private conversationHistory: Message[] = []
  private isInitialized = false

  // Style instruction - can be changed at runtime via setProfanityLevel()
  private styleInstruction = PROFANITY_INSTRUCTIONS[PROFANITY_LEVEL]
  private currentProfanityLevel: ProfanityLevel = PROFANITY_LEVEL

  constructor(agents: Agent[]) {
    this.agents = agents
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
   * MODIFIED: Accepts modelId to dynamically load the LLM.
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

    // Retry configuration
    const maxRetries = 3
    const baseDelay = 1000 // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`Retry attempt ${attempt}/${maxRetries} for loading model: ${modelId}`)
        } else {
          console.log(`Loading model: ${modelId}...`)
        }

        // Follow the official example format
        this.engine = await engineLib.CreateMLCEngine(
          modelId, // <-- Use the dynamic modelId
          {
            // appConfig: appConfig,
            initProgressCallback: onProgress
          }, // engineConfig
          {
            repetition_penalty: 1.15
          } // chatOpts (optional)
        )

        this.isInitialized = true
        console.log(`GroupChatManager initialized successfully with model: ${modelId}`)
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
          enhancedMessage += `\n\nThis appears to be a cache/network error. Suggestions:
  • Check your network connection and try again
  • Clear browser cache manually (Settings → Privacy → Clear browsing data)
  • Try a different, smaller model (e.g., SmolLM2-360M-Instruct-q4f32_1-MLC)
  • Verify model URLs are reachable: open browser DevTools → Network tab
  • If using Hugging Face, ensure URLs point to '/resolve/main/' not just repo root
  • Check that you have sufficient disk space for model caching (2-8GB needed)`
        } else {
          enhancedMessage += `\n\nCheck that the model is registered in the engine's prebuiltAppConfig.model_list and that required fields like 'model' and 'model_lib' are present and reachable.`
        }
        throw new Error(enhancedMessage)
      }
    }
  }

  async chat(
    userMessage: string,
    onSentence?: (sentence: string) => void,
    options: { maxTokens?: number; seed?: number } = {}
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

    // Build merged system prompt: agent persona + style guide
    const fullSystemPrompt = `${currentAgent.systemPrompt}\n\n${this.styleInstruction}`

    // Truncate history to MAX_HISTORY_MESSAGES to prevent VRAM exhaustion
    const recentHistory = this.conversationHistory.slice(-MAX_HISTORY_MESSAGES)
    const messages: Message[] = [
      { role: 'system', content: fullSystemPrompt },
      ...recentHistory,
    ]

    try {
      // Generate response with stricter sampling to prevent repetition
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
}
