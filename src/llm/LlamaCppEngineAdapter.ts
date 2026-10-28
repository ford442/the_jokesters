/**
 * LlamaCpp Engine Adapter
 * 
 * Adapter for llama.cpp using @wllama/wllama.
 * Enables running GGUF models (like Vicuna) that aren't available in MLC format.
 */

import { Wllama } from '@wllama/wllama'
import type {

  ChatMessage,
  GenerationOptions,
  InitProgressReport,
  UnifiedModelConfig,
  EngineType,
  LLMEngine} from './LLMEngine';
import {
  type EngineContextInfo,
  DEFAULT_CONTEXT_WINDOW_SIZE
} from './LLMEngine'
import { normalizeOptions } from './LLMEngine'
import type { ChatStreamEvent } from './streamEvents'
import {
  WLLAMA_WASM_PATHS,
  rethrowWllamaRuntimeError,
  toWllamaMessages,
  wllamaHasMemory64Build,
  wllamaLoadTuning,
  wllamaModelSource,
} from './wllamaRuntime'
import { jsonSchemaToGbnf } from './structured/jsonSchemaToGbnf'

/** GBNF for the request `grammar` from the engine-neutral response format (#400 C). */
function grammarFor(options: GenerationOptions): { grammar?: string } {
  const format = options.response_format
  if (!format) return {}
  if (format.type === 'grammar') return { grammar: format.grammar }
  return { grammar: format.grammar ?? jsonSchemaToGbnf(format.schema) }
}

export class LlamaCppEngineAdapter implements LLMEngine {
  readonly id = 'llamacpp'
  readonly name = 'llama.cpp (WASM)'

  private wllama: Wllama | null = null
  private abortController: AbortController | null = null
  private modelFamily: string = 'llama2'
  private config: UnifiedModelConfig | null = null
  /** True once a loaded vision projector can take image parts (wllama `supportInputModality('image')`). */
  private imageInput = false
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

    // Bundled WASM from @wllama/wllama (via Vite ?url) — always matches JS glue version
    this.wllama = new Wllama(WLLAMA_WASM_PATHS)
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

    // The main wllama build needs JSPI + 64-bit memory; otherwise wllama quietly swaps in a 32-bit CDN build.
    if (llamaCppConfig.requiresMem64 && !wllamaHasMemory64Build()) {
      throw new Error(
        `${modelConfig.name} needs a browser with WebAssembly JSPI and 64-bit memory (recent Chrome/Edge); this one falls back to wllama's 32-bit build, which cannot hold the model.`
      )
    }
    const mmprojUrl = llamaCppConfig.mmprojUrl
    const modelSource = wllamaModelSource(ggufUrl, mmprojUrl)
    try {
      onProgress?.({
        progress: 0.1,
        timeElapsed: 0,
        text: 'Starting GGUF model download...',
      })

      const startTime = performance.now()

      // n_ctx follows the context budget (user / guided-launch choice), not a fixed 4096.
      const contextTokens = modelConfig.context_window_size || llamaCppConfig.context_size || DEFAULT_CONTEXT_WINDOW_SIZE
      const tuning = wllamaLoadTuning(contextTokens, { gpuLayers: llamaCppConfig.gpuLayers })
      console.log('[LlamaCppEngineAdapter] Load tuning', tuning)
      const loadConfig = {
        ...tuning,
        ...(llamaCppConfig.jinja ? { jinja: true } : {}),
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
          await this.wllama.loadModelFromHF({ repo: llamaCppConfig.hf_repo, file: llamaCppConfig.hf_file || ggufUrl }, loadConfig)
        } else {
          await this.wllama.loadModelFromUrl(modelSource, loadConfig)
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
          await this.wllama.loadModelFromUrl(modelSource, {
            ...loadConfig,
            useCache: false,
          })
        } else if (!isCacheCorrupted && (loadConfig.flash_attn || loadConfig.cache_type_k)) {
          // Older wasm builds may reject flash attention / quantized K; retry with defaults once.
          console.warn('[LlamaCppEngineAdapter] Tuned load failed, retrying with default KV settings:', errMsg)
          const { flash_attn: _fa, cache_type_k: _ck, ...plain } = loadConfig
          if (llamaCppConfig.hf_repo) {
            await this.wllama.loadModelFromHF({ repo: llamaCppConfig.hf_repo, file: llamaCppConfig.hf_file || ggufUrl }, plain)
          } else {
            await this.wllama.loadModelFromUrl(modelSource, plain)
          }
        } else {
          throw firstError
        }
      }

      this.imageInput = this.wllama.supportInputModality('image')
      if (mmprojUrl && !this.imageInput) {
        console.warn(`[LlamaCppEngineAdapter] ${modelConfig.id}: mmproj loaded but model reports no image input; text only`)
      }

      onProgress?.({
        progress: 1.0,
        timeElapsed: performance.now() - startTime,
        text: 'Model loaded successfully',
      })

      this.initialized = true
    } catch (error) {
      this.initialized = false
      this.imageInput = false
      this.wllama = null
      this.abortController = null

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Model loading was cancelled')
      }
      rethrowWllamaRuntimeError(error)
    }
  }

  /** wllama 3.x takes sampling params per request, alongside the OAI chat fields. */
  private async completionParams(messages: ChatMessage[], options: GenerationOptions) {
    const opts = normalizeOptions(options)
    return {
      messages: await toWllamaMessages(messages, { imageInput: this.imageInput }),
      max_tokens: opts.max_tokens,
      temperature: opts.temperature,
      top_p: opts.top_p,
      penalty_repeat: opts.repetition_penalty ?? 1.1,
      penalty_present: opts.presence_penalty,
      ...grammarFor(options),
      // Keep the KV cache between turns: only the new suffix of an append-only chat is evaluated.
      cache_prompt: true,
    }
  }

  async *chat(
    messages: ChatMessage[],
    options: GenerationOptions
  ): AsyncGenerator<ChatStreamEvent> {
    if (!this.wllama || !this.initialized) {
      throw new Error('LlamaCppEngineAdapter not initialized. Call initialize() first.')
    }

    // Create abort controller for this generation
    this.abortController = new AbortController()

    try {
      const params = await this.completionParams(messages, options)
      const startedAt = performance.now()
      const stream = await this.wllama.createChatCompletion({
        ...params,
        stream: true,
        abortSignal: this.abortController.signal,
      })

      // OAI chunks carry deltas.
      let chunks = 0
      let firstTokenAt: number | null = null
      let usage: { prompt_tokens: number; completion_tokens: number } | null | undefined
      for await (const chunk of stream) {
        usage = chunk.usage ?? usage
        const delta = chunk.choices[0]?.delta.content
        if (!delta) continue
        chunks++
        firstTokenAt ??= performance.now()
        yield delta
      }
      if (firstTokenAt != null) {
        const tokens = usage?.completion_tokens ?? chunks
        const decodeMs = performance.now() - firstTokenAt
        options.onUsage?.({
          prefillTokens: usage?.prompt_tokens ?? -1,
          completionTokens: tokens,
          ttftMs: firstTokenAt - startedAt,
          decodeTokPerSec: decodeMs > 0 && tokens > 1 ? ((tokens - 1) * 1000) / decodeMs : undefined,
        })
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

    const result = await this.wllama.createChatCompletion({
      ...(await this.completionParams(messages, options)),
      stream: false,
    })

    return result.choices[0]?.message.content ?? ''
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
    this.imageInput = false
    this.config = null
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getLoadedModelId(): string | null {
    return this.config?.id || null
  }

  getContextInfo(): EngineContextInfo {
    const requested = this.config?.context_window_size ?? this.config?.llamaCpp?.context_size ?? DEFAULT_CONTEXT_WINDOW_SIZE
    return {
      requested,
      effective: requested,
      source: (this.config?.context_window_size || this.config?.llamaCpp?.context_size) ? 'config' : 'adapter_default'
    }
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

  // wllama 3.x removed tokenize/detokenize: no countTokens/countTokensAsync, so the token
  // estimator falls back to its calibrated chars-per-token ratio for this engine.
}
