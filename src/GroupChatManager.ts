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
          repetition_penalty: 1.01
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
    onSentence?: (sentence: string) => void
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

    // Create messages array with current agent's system prompt
    const messages: Message[] = [
      { role: 'system', content: currentAgent.systemPrompt },
      ...this.conversationHistory,
    ]

    try {
      // Generate response with stricter sampling to prevent repetition
      const completion = await this.engine.chat.completions.create({
        messages: messages as webllm.ChatCompletionMessageParam[],
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        max_tokens: 256,
        stream: true,
        // @ts-ignore - WebLLM supports this even if types might complain
        repetition_penalty: 1.15, // Increased from 1.01 to stop loops
        presence_penalty: 0.6, // Encourage new topics
      })

      let fullResponse = ''
      let buffer = ''

      // Iterate over the stream
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          buffer += content

          // Simple sentence splitting logic
          // Split by [.!?] followed by space or end of string
          // We keep the delimiter with the sentence
          let match
          while ((match = buffer.match(/([.!?])\s/))) {
            const endIdx = match.index! + 1
            let sentence = buffer.substring(0, endIdx).trim()

            // CLEANUP: Remove "Agent Name:" from the start of sentences
            // This fixes the issue where they say their own name
            const namePrefixRegex = new RegExp(`^${currentAgent.name}:\\s*`, 'i')
            sentence = sentence.replace(namePrefixRegex, '')

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
        const namePrefixRegex = new RegExp(`^${currentAgent.name}:\\s*`, 'i')
        cleanBuffer = cleanBuffer.replace(namePrefixRegex, '')

        onSentence?.(cleanBuffer)
      }

      // CLEANUP: Ensure the history doesn't contain the name prefix either
      // (This prevents the model from learning to copy the pattern in the next turn)
      const namePrefixRegex = new RegExp(`^${currentAgent.name}:\\s*`, 'i')
      const cleanFullResponse = fullResponse.replace(namePrefixRegex, '')

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

  resetConversation(): void {
    this.conversationHistory = []
    this.currentAgentIndex = 0
  }

  getAgents(): Agent[] {
    return this.agents
  }
}
