/**
 * LlamaCpp Engine Adapter
 * 
 * Adapter for llama.cpp using @wllama/wllama.
 * Enables running GGUF models (like Vicuna) that aren't available in MLC format.
 */

import { Wllama, type WllamaChatMessage, type SamplingConfig } from '@wllama/wllama'
import type {
  ChatMessage,
  GenerationOptions,
  InitProgressReport,
  UnifiedModelConfig,
  EngineType,
  LLMEngine,
} from './LLMEngine'
import { normalizeOptions } from './LLMEngine'

// WASM binary URLs for wllama — self-hosted on VPS
const WASM_FROM_VPS = {
  'single-thread/wllama.wasm': 'https://storage.noahcohn.com/models/wllama-wasm/single-thread.wasm',
  'multi-thread/wllama.wasm': 'https://storage.noahcohn.com/models/wllama-wasm/multi-thread.wasm',
}

export class LlamaCppEngineAdapter implements LLMEngine {
  readonly id = 'llamacpp'
  readonly name = 'llama.cpp (WASM)'

  private wllama: Wllama | null = null
  private abortController: AbortController | null = null
  private modelFamily: string = 'llama2'
  private config: UnifiedModelConfig | null = null
  protected initialized = false

  async initialize(
    modelConfig: UnifiedModelConfig,
    onProgress?: (report: InitProgressReport) => void
  ): Promise<void> {
    if (this.wllama) {
      await this.terminate()
    }

    this.config = modelConfig
    this.modelFamily = modelConfig.llamaCpp?.hf_repo?.includes('vicuna') ? 'vicuna' :
                       modelConfig.id.toLowerCase().includes('hermes') ? 'hermes' :
                       modelConfig.id.toLowerCase().includes('llama-3') ? 'llama3' : 'llama2'

    // Create wllama instance with VPS-hosted WASM
    this.wllama = new Wllama(WASM_FROM_VPS)
    this.abortController = new AbortController()

    // Determine GGUF URL
    const llamaCppConfig = modelConfig.llamaCpp
    if (!llamaCppConfig) {
      throw new Error(`Model ${modelConfig.id} does not have llama.cpp configuration`)
    }

    const ggufUrl = llamaCppConfig.gguf_url || llamaCppConfig.hf_file
    if (!ggufUrl) {
      throw new Error('Missing GGUF URL in modelConfig')
    }

    try {
      onProgress?.({
        progress: 0.1,
        timeElapsed: 0,
        text: 'Starting GGUF model download...',
      })

      const startTime = performance.now()

      const loadConfig = {
        n_ctx: llamaCppConfig.context_size || 4096,
        progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
          const progress = total > 0 ? loaded / total : 0
          onProgress?.({
            progress: 0.1 + (progress * 0.9),
            timeElapsed: performance.now() - startTime,
            text: `Downloading model... ${(progress * 100).toFixed(1)}%`,
          })
        },
      }

      try {
        // Load the model from URL with progress tracking
        if (llamaCppConfig.hf_repo) {
          await this.wllama.loadModelFromHF(llamaCppConfig.hf_repo, llamaCppConfig.hf_file || ggufUrl, loadConfig)
        } else {
          await this.wllama.loadModelFromUrl(ggufUrl, loadConfig)
        }
      } catch (firstError) {
        const errMsg = firstError instanceof Error ? firstError.message : String(firstError)
        // wllama caches models in OPFS; a previous failed download may have stored
        // a JSON error response, which later loads as a corrupted GGUF.
        const isCacheCorrupted =
          errMsg.includes('invalid magic') ||
          errMsg.includes('Invalid typed array length') ||
          errMsg.includes('failed to load model')

        if (isCacheCorrupted && !llamaCppConfig.hf_repo) {
          console.warn('[LlamaCppEngineAdapter] Corrupted model cache detected, re-downloading...')
          onProgress?.({
            progress: 0.05,
            timeElapsed: 0,
            text: 'Corrupted cache detected. Re-downloading...',
          })
          await this.wllama.loadModelFromUrl(ggufUrl, {
            ...loadConfig,
            useCache: false,
          })
        } else {
          throw firstError
        }
      }

      onProgress?.({
        progress: 1.0,
        timeElapsed: performance.now() - startTime,
        text: 'Model loaded successfully',
      })

      this.initialized = true
    } catch (error) {
      this.initialized = false
      this.wllama = null
      this.abortController = null
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Model loading was cancelled')
      }
      throw error
    }
  }

  async *chat(
    messages: ChatMessage[],
    options: GenerationOptions
  ): AsyncGenerator<string> {
    if (!this.wllama || !this.initialized) {
      throw new Error('LlamaCppEngineAdapter not initialized. Call initialize() first.')
    }

    const normalizedOpts = normalizeOptions(options)
    
    // Convert to wllama message format
    const wllamaMessages: WllamaChatMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    // Create abort controller for this generation
    this.abortController = new AbortController()

    // Build sampling config
    const samplingConfig: SamplingConfig = {
      temp: normalizedOpts.temperature,
      top_p: normalizedOpts.top_p,
      penalty_repeat: normalizedOpts.repetition_penalty,
      penalty_present: normalizedOpts.presence_penalty,
    }

    try {
      // Use wllama's native streaming support
      const stream = await this.wllama.createChatCompletion(wllamaMessages, {
        nPredict: normalizedOpts.max_tokens,
        sampling: samplingConfig,
        stream: true,
        abortSignal: this.abortController.signal,
      })

      for await (const chunk of stream) {
        const text = chunk.currentText || ''
        if (text) {
          yield text
        }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Generation was interrupted, this is expected
        return
      }
      throw error
    }
  }

  /**
   * Non-streaming chat for prerendering.
   */
  async chatComplete(
    messages: ChatMessage[],
    options: GenerationOptions
  ): Promise<string> {
    if (!this.wllama || !this.initialized) {
      throw new Error('LlamaCppEngineAdapter not initialized. Call initialize() first.')
    }

    const normalizedOpts = normalizeOptions(options)

    // Convert to wllama message format
    const wllamaMessages: WllamaChatMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    // Build sampling config
    const samplingConfig: SamplingConfig = {
      temp: normalizedOpts.temperature,
      top_p: normalizedOpts.top_p,
      penalty_repeat: normalizedOpts.repetition_penalty,
      penalty_present: normalizedOpts.presence_penalty,
    }

    const result = await this.wllama.createChatCompletion(wllamaMessages, {
      nPredict: normalizedOpts.max_tokens,
      sampling: samplingConfig,
      stream: false,
    })

    return result
  }

  async interrupt(): Promise<void> {
    this.abortController?.abort()
  }

  async terminate(): Promise<void> {
    if (this.wllama) {
      this.abortController?.abort()
      await this.wllama.exit()
      this.wllama = null
    }
    this.abortController = null
    this.initialized = false
    this.config = null
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getLoadedModelId(): string | null {
    return this.config?.id || null
  }

  getEngineType(): EngineType {
    return 'llamacpp'
  }

  /**
   * Get the model family detected for the loaded model.
   */
  getModelFamily(): string {
    return this.modelFamily
  }

  /**
   * Get the underlying Wllama instance.
   * For advanced use cases only.
   */
  getWllama(): Wllama | null {
    return this.wllama
  }
}
