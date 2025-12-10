import * as webllm from '@mlc-ai/web-llm'

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
const PROFANITY_INSTRUCTIONS: Record<ProfanityLevel, string> = {
  PG: `STYLE GUIDE: Keep language family-friendly. No swearing or crude language.`,
  CASUAL: `STYLE GUIDE: You may use mild expressions (damn, hell, crap) but avoid strong profanity.`,
  GRITTY: `STYLE GUIDE: "Gritty & Real". You are encouraged to use casual profanity (shit, hell, damn, f*ck) to sound like a real person expressing genuine emotion. HOWEVER: You must strictly AVOID sexual violence, graphic gore, or hate speech. Be cool and edgy, not gross or abusive.`,
  UNCENSORED: `STYLE GUIDE: Speak naturally with no language restrictions. Full creative freedom with profanity. HOWEVER: You must still AVOID sexual violence, graphic gore, or hate speech.`,
}

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
  private engine: webllm.MLCEngine | null = null
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

  async initialize(
    onProgress?: (progress: webllm.InitProgressReport) => void
  ): Promise<void> {
    if (this.isInitialized) return

    try {
      /*
      // Define custom Vicuna model configuration
      const customModel = {
        model_id: "ford442/vicuna-7b-q4f32-webllm",
        model: "https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/",
        model_lib: "./Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
        vram_required_MB: 4096,
        low_resource_required: false,
      };

      const appConfig = {
        model_list: [customModel],
        use_indexed_db: true,
      };
      */

      console.log('Loading Hermes-3-Llama-3.2-3B model...');

      // Follow the official example format
      this.engine = await webllm.CreateMLCEngine(
        "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
        {
          // appConfig: appConfig,
          initProgressCallback: onProgress
        }, // engineConfig
        {
          repetition_penalty: 1.15
        } // chatOpts (optional)
      );

      this.isInitialized = true
      console.log('GroupChatManager initialized successfully with custom Vicuna model')
    } catch (error) {
      console.error('Failed to initialize GroupChatManager:', error)
      throw error
    }
  }

  async chat(
    userMessage: string,
    onSentence?: (sentence: string) => void,
    options: { maxTokens?: number; seed?: number; hiddenInstruction?: string } = {}
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
      fullSystemPrompt += `\n\n### DIRECTOR'S SECRET NOTE ###\n${options.hiddenInstruction}\n(You MUST incorporate this note immediately!)`
    }

    // Create messages array with single merged system prompt
    const messages: Message[] = [
      { role: 'system', content: fullSystemPrompt },
      ...this.conversationHistory,
    ]

    try {
      // Generate response with stricter sampling to prevent repetition
      const completion = await this.engine.chat.completions.create({
        messages: messages as webllm.ChatCompletionMessageParam[],
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        // Use the override if provided, otherwise default to 144
        max_tokens: options.maxTokens || 96,
        stream: true,
        // Use a stop token plus fallbacks to catch structural shifts
        stop: ["###", "Director:", "User:"],
        // @ts-ignore - optional seed not on all runtime types
        seed: options.seed,
        // @ts-ignore - WebLLM supports this even if types might complain
        repetition_penalty: 0.955, // Increased from 1.01 to stop loops
        presence_penalty: 0.556, // Encourage new topics
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
}
