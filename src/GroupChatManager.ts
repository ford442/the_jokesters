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
      // Initialize the MLC engine with Llama-3 model
      // Using a smaller quantized model for faster loading
      this.engine = await webllm.CreateMLCEngine('Llama-3.1-8B-Instruct-q4f32_1-MLC', {
        initProgressCallback: onProgress,
      })
      this.isInitialized = true
      console.log('GroupChatManager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize GroupChatManager:', error)
      throw error
    }
  }

  async chat(userMessage: string): Promise<{ agentId: string; response: string }> {
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
      const response = await this.engine.chat.completions.create({
        messages: messages as webllm.ChatCompletionMessageParam[],
        temperature: currentAgent.temperature,
        top_p: currentAgent.top_p,
        max_tokens: 256,
      })

      const agentResponse = response.choices[0]?.message?.content || ''

      // Add agent response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: agentResponse,
      })

      // Move to next agent for next turn
      this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length

      return {
        agentId: currentAgent.id,
        response: agentResponse,
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
