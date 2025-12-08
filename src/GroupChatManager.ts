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
      // Define custom Vicuna model configuration
      const customModel = {
        model_id: "vicuna-7b-q4f32-custom",
        model: "https://huggingface.co/ford442/vicuna-7b-q4f32-web/resolve/main/",
        model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0.2.46/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
        vram_required_MB: 4096,
        low_resource_required: false,
      };

      const appConfig = {
        model_list: [customModel],
        use_indexed_db: true,
      };

      this.engine = new webllm.MLCEngine();

      this.engine.setInitProgressCallback(onProgress || ((report) => {
        console.log(`[${report.text}] ${Math.round(report.progress * 100)}%`);
      }));

      console.log('Loading custom Vicuna model...');
      // Pass appConfig directly as the second argument as requested
      await this.engine.reload("vicuna-7b-q4f32-custom", appConfig);

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
      // Generate response with agent-specific sampling parameters
      const completion = await this.engine.chat.completions.create({
        messages: messages as webllm.ChatCompletionMessageParam[],
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        max_tokens: 256,
        stream: true, // Enable streaming
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
            const sentence = buffer.substring(0, endIdx).trim()
            if (sentence) {
              onSentence?.(sentence)
            }
            buffer = buffer.substring(endIdx + 1) // +1 for the space we matched
          }
        }
      }

      // Emit remaining buffer as sentence if any
      if (buffer.trim()) {
        onSentence?.(buffer.trim())
      }

      // Add agent response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
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
