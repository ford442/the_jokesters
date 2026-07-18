/**
 * API Engine Adapter
 *
 * Streams chat completions from a server-side OpenAI-compatible API endpoint.
 * Used for server-hosted models like Kimi-VL running via llama-server.
 */

import type {
  LLMEngine,
  ChatMessage,
  GenerationOptions,
  InitProgressReport,
  UnifiedModelConfig,
  EngineType,
  ContentPart,
} from './LLMEngine'
import { normalizeOptions } from './LLMEngine'
import type { ChatStreamEvent } from './streamEvents'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

interface OpenAIRequestBody {
  model: string
  messages: OpenAIMessage[]
  stream: boolean
  temperature?: number
  top_p?: number
  max_tokens?: number
  seed?: number
  stop?: string[]
}

export class ApiEngineAdapter implements LLMEngine {
  readonly id = 'api'
  readonly name = 'API Server (OpenAI-compatible)'

  private config: UnifiedModelConfig | null = null
  private abortController: AbortController | null = null
  protected initialized = false

  async initialize(
    modelConfig: UnifiedModelConfig,
    onProgress?: (report: InitProgressReport) => void
  ): Promise<void> {
    if (!modelConfig.api) {
      throw new Error(`Model ${modelConfig.id} does not have API configuration`)
    }

    this.config = modelConfig
    this.abortController = new AbortController()

    onProgress?.({
      progress: 0.5,
      timeElapsed: 0,
      text: `Connecting to API server for ${modelConfig.name}...`,
    })

    // Lightweight probe: try a HEAD or GET to verify endpoint is reachable
    try {
      await fetch(modelConfig.api.endpoint, {
        method: 'OPTIONS',
        signal: this.abortController.signal,
      }).catch(() => null)

      // Even if OPTIONS fails (e.g. 404 or method not allowed), the host is up
      onProgress?.({
        progress: 1.0,
        timeElapsed: 0,
        text: 'API server connected',
      })

      this.initialized = true
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('API engine initialization was cancelled')
      }
      // Don't hard-fail on probe errors; the actual chat request will surface real issues
      onProgress?.({
        progress: 1.0,
        timeElapsed: 0,
        text: 'API server ready (probe skipped)',
      })
      this.initialized = true
    }
  }

  async *chat(
    messages: ChatMessage[],
    options: GenerationOptions
  ): AsyncGenerator<ChatStreamEvent> {
    if (!this.config?.api || !this.initialized) {
      throw new Error('ApiEngineAdapter not initialized. Call initialize() first.')
    }

    const normalizedOpts = normalizeOptions(options)
    const apiConfig = this.config.api

    const body: OpenAIRequestBody = {
      model: apiConfig.model_id,
      messages: messages as OpenAIMessage[],
      stream: true,
      temperature: normalizedOpts.temperature,
      top_p: normalizedOpts.top_p,
      max_tokens: normalizedOpts.max_tokens,
      seed: normalizedOpts.seed,
      stop: normalizedOpts.stop.length > 0 ? normalizedOpts.stop : undefined,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiConfig.api_key) {
      headers['Authorization'] = `Bearer ${apiConfig.api_key}`
    }

    this.abortController = new AbortController()

    const response = await fetch(apiConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      throw new Error(`API request failed (${response.status}): ${errText}`)
    }

    if (!response.body) {
      throw new Error('API response has no readable body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process SSE lines
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta
            const content = delta?.content ?? ''
            if (content) {
              yield content
            }
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6)
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta
              const content = delta?.content ?? ''
              if (content) yield content
            } catch {
              // Ignore
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async interrupt(): Promise<void> {
    this.abortController?.abort()
  }

  async terminate(): Promise<void> {
    this.abortController?.abort()
    this.abortController = null
    this.config = null
    this.initialized = false
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getLoadedModelId(): string | null {
    return this.config?.id || null
  }

  getContextWindowSize(): number {
    return this.config?.context_window_size ?? 4096
  }

  getEngineType(): EngineType {
    return 'api'
  }

  /**
   * Get the API endpoint URL.
   */
  getEndpoint(): string | null {
    return this.config?.api?.endpoint || null
  }
}
