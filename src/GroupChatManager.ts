import * as webllm from '@mlc-ai/web-llm'

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

  // CONFIG: The "Gritty but Safe" Style Guide
  // This allows swearing for realism but strictly bans sexual/violent content.
  private readonly STYLE_INSTRUCTION = 
    `STYLE GUIDE: "Gritty & Real". \n` +
    `You are encouraged to use casual profanity (shit, hell, damn, f*ck) to sound like a real person expressing genuine emotion.\n` +
    `HOWEVER: You must strictly AVOID sexual violence, graphic gore, or hate speech. Be cool and edgy, not gross or abusive.`;

  // Sampling parameters for reducing repetition
  private readonly REPETITION_PENALTY = 0.955;
  private readonly PRESENCE_PENALTY = 0.556;

  // Default prerender configuration
  private readonly DEFAULT_PRERENDER_TURNS = 3;

  constructor(agents: Agent[]) {
    this.agents = agents
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

  private buildSystemMessage(
    agentSystemPrompt: string,
    hiddenInstruction?: string
  ): string {
    let systemMessage = agentSystemPrompt + '\n\n' + this.STYLE_INSTRUCTION;
    
    if (hiddenInstruction && hiddenInstruction.trim()) {
      systemMessage += '\n\n### DIRECTOR\'S SECRET NOTE ###\n' + hiddenInstruction + '\n(You MUST incorporate this note immediately!)';
    }
    
    return systemMessage;
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

    // Build combined system message
    const systemMessage = this.buildSystemMessage(
      currentAgent.systemPrompt,
      options.hiddenInstruction
    )

    const messages: Message[] = [
      { role: 'system', content: systemMessage },
      ...this.conversationHistory,
    ]

    try {
      // Generate response with stricter sampling to prevent repetition
      const completion = await this.engine.chat.completions.create({
        messages: messages as webllm.ChatCompletionMessageParam[],
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        // Use the override if provided, otherwise default to 96
        max_tokens: options.maxTokens || 96,
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
    options: { maxTokens?: number; seed?: number; hiddenInstruction?: string } = {}
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
        const namePrefixRegex = new RegExp(`^(${currentAgent.name}|${currentAgent.id}):\\s*`, 'i')
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
}
