/**
 * Mock LLM engine for unit tests — tracks interrupt and context window semantics.
 */
import type {
  ChatMessage,
  ChatStreamEvent,
  EngineType,
  GenerationOptions,
  InitProgressReport,
  LLMEngine,
  UnifiedModelConfig,
} from './LLMEngine'

export interface MockChatCall {
  messages: ChatMessage[]
  options: GenerationOptions
}

export class MockLLMEngine implements LLMEngine {
  readonly id: string
  readonly name: string
  private config: UnifiedModelConfig | null = null
  private initialized = false
  private contextWindowSize = 4096
  private abortController: AbortController | null = null
  private interruptCount = 0
  private responses: string[] = []
  private responseIndex = 0
  readonly chatCalls: MockChatCall[] = []

  constructor(id = 'mock', name = 'Mock Engine') {
    this.id = id
    this.name = name
  }

  queueResponses(...chunks: string[]): void {
    this.responses = chunks
    this.responseIndex = 0
  }

  getInterruptCount(): number {
    return this.interruptCount
  }

  async initialize(
    modelConfig: UnifiedModelConfig,
    onProgress?: (report: InitProgressReport) => void,
  ): Promise<void> {
    this.config = modelConfig
    this.contextWindowSize = modelConfig.context_window_size ?? 4096
    this.initialized = true
    this.abortController = new AbortController()
    onProgress?.({ progress: 1, text: 'mock ready', timeElapsed: 0 })
  }

  async terminate(): Promise<void> {
    await this.interrupt()
    this.initialized = false
    this.config = null
    this.abortController = null
  }

  async *chat(messages: ChatMessage[], options: GenerationOptions): AsyncGenerator<ChatStreamEvent> {
    if (!this.initialized) {
      throw new Error('MockLLMEngine not initialized')
    }
    this.chatCalls.push({ messages, options })
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    const text = this.responses[this.responseIndex++] ?? 'Mock response.'
    for (const word of text.split(' ')) {
      if (signal.aborted) return
      yield word + ' '
    }
  }

  async interrupt(): Promise<void> {
    this.interruptCount += 1
    this.abortController?.abort()
  }

  getEngineType(): EngineType {
    return 'api'
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getLoadedModelId(): string | null {
    return this.config?.id ?? null
  }

  getContextWindowSize(): number {
    return this.contextWindowSize
  }

  setContextWindowSize(tokens: number): void {
    this.contextWindowSize = tokens
  }
}
