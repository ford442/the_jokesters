/**
 * MLC Engine Adapter
 * 
 * Adapter for the @mlc-ai/web-llm engine (WebGPU-based).
 * This is the primary engine for modern browsers with WebGPU support.
 *
 * By default the engine runs in a Web Worker (`worker/mlc.worker.ts`) so prefill and
 * decode never stall Three.js / lip-sync on the main thread. `?legacyLlm` keeps the
 * in-process `CreateMLCEngine` (also used automatically where `Worker` is unavailable).
 */

import * as webllm from '@mlc-ai/web-llm'
import {
  type ChatMessage,
  type GenerationOptions,
  type InitProgressReport,
  type UnifiedModelConfig,
  type EngineType,
  normalizeOptions,
} from './LLMEngine'
import {
  getMlcEngineContextWindow,
  loadModelWithDynamicContext,
  type MlcEngineHandle,
} from './mlcEngineCreate'
import { isWorkerMlcEngine, type MlcRuntime } from './worker/mlcWorkerEngine'
import type { VRAMOptimizationConfig } from '../utils/vramOverrides'

export interface MlcModelConfig extends UnifiedModelConfig {
  engineConfig?: {
    model_lib: string
    overrides?: Record<string, any>
  }
}

import type { LLMEngine } from './LLMEngine'
import type { ChatStreamEvent } from './streamEvents'

export class MlcEngineAdapter implements LLMEngine {
  readonly id = 'mlc'
  readonly name = 'WebLLM (MLC)'

  private engine: MlcEngineHandle | null = null
  private config: UnifiedModelConfig | null = null
  protected initialized = false
  private vramConfig: VRAMOptimizationConfig | null = null
  /** Force a runtime (tests / diagnostics); default resolves worker vs `?legacyLlm`. */
  private runtimeOverride: MlcRuntime | undefined

  constructor(options: { runtime?: MlcRuntime } = {}) {
    this.runtimeOverride = options.runtime
  }

  /**
   * Set VRAM optimization config before initialization.
   */
  setVRAMConfig(config: VRAMOptimizationConfig): void {
    this.vramConfig = config
  }

  async initialize(
    modelConfig: UnifiedModelConfig,
    onProgress?: (report: InitProgressReport) => void
  ): Promise<void> {
    if (this.engine) {
      await this.terminate()
    }

    this.config = modelConfig

    // Determine MLC config: use mlc property or engineConfig
    const mlcConfig = modelConfig.mlc || {
      model_url: modelConfig.source || '',
      model_lib_url: modelConfig.engineConfig?.model_lib || '',
      overrides: modelConfig.engineConfig?.overrides || {},
    }

    // Convert to the format expected by loadModelWithDynamicContext
    const dynamicConfig = {
      model_id: modelConfig.id,
      model: mlcConfig.model_url,
      model_lib: mlcConfig.model_lib_url,
      requestedModelId: modelConfig.id,
      hf_fallback_url: modelConfig.hf_fallback_url,
      overrides: mlcConfig.overrides || {},
      vram_required_MB: modelConfig.vram_required_MB,
    }

    // Use the dynamic context loader from utils/dynamicContext
    const preferredContext = modelConfig.context_window_size

    try {
      this.engine = await loadModelWithDynamicContext(
        dynamicConfig,
        preferredContext,
        onProgress,
        this.vramConfig || undefined,
        { runtime: this.runtimeOverride },
      )
      this.initialized = true
    } catch (error) {
      this.initialized = false
      this.engine = null
      throw error
    }
  }

  async *chat(
    messages: ChatMessage[],
    options: GenerationOptions
  ): AsyncGenerator<ChatStreamEvent> {
    if (!this.engine || !this.initialized) {
      throw new Error('MlcEngineAdapter not initialized. Call initialize() first.')
    }

    const normalizedOpts = normalizeOptions(options)

    const completion = await this.engine.chat.completions.create({
      messages: messages as webllm.ChatCompletionMessageParam[],
      temperature: normalizedOpts.temperature,
      top_p: normalizedOpts.top_p,
      max_tokens: normalizedOpts.max_tokens,
      stream: true,
      stop: normalizedOpts.stop,
      // @ts-ignore - WebLLM-specific options
      seed: normalizedOpts.seed,
      repetition_penalty: normalizedOpts.repetition_penalty,
      presence_penalty: normalizedOpts.presence_penalty,
    })

    const iterator = (completion as AsyncIterable<any>)[Symbol.asyncIterator]()
    let exhausted = false
    try {
      while (true) {
        const { value: chunk, done } = await iterator.next()
        if (done) {
          exhausted = true
          break
        }
        const delta = chunk?.choices?.[0]?.delta
        const content = delta?.content || ''
        if (!content) continue

        const sentenceBoundary = Boolean(
          (delta as { sentence_boundary?: boolean } | undefined)?.sentence_boundary,
        )
        if (sentenceBoundary) {
          yield { content, sentenceBoundary: true }
        } else {
          yield content
        }
      }
    } catch (error) {
      exhausted = true // engine-side failure already released its lock
      throw error
    } finally {
      if (!exhausted) {
        await this.drainAbandonedStream(iterator)
      }
    }
  }

  /**
   * The consumer stopped early (break / throw). web-llm only releases its per-model
   * generation lock when the stream runs to completion, and in the worker the
   * generator lives on the other side of postMessage, so an abandoned stream would
   * deadlock the next request. Interrupt and pull the (now short) remainder.
   */
  private async drainAbandonedStream(iterator: AsyncIterator<unknown>): Promise<void> {
    try {
      await this.interrupt()
      for (let i = 0; i < 64; i++) {
        const { done } = await iterator.next()
        if (done) return
      }
      console.warn('[MlcEngineAdapter] Abandoned stream still producing after interrupt; giving up drain')
    } catch {
      // Engine terminated / device lost while draining — nothing left to release.
    }
  }

  /**
   * Non-streaming chat for prerendering.
   */
  async chatComplete(
    messages: ChatMessage[],
    options: GenerationOptions
  ): Promise<string> {
    if (!this.engine || !this.initialized) {
      throw new Error('MlcEngineAdapter not initialized. Call initialize() first.')
    }

    const normalizedOpts = normalizeOptions(options)

    const completion = await this.engine.chat.completions.create({
      messages: messages as webllm.ChatCompletionMessageParam[],
      temperature: normalizedOpts.temperature,
      top_p: normalizedOpts.top_p,
      max_tokens: normalizedOpts.max_tokens,
      stream: false,
      stop: normalizedOpts.stop,
      // @ts-ignore - WebLLM-specific options
      seed: normalizedOpts.seed,
      repetition_penalty: normalizedOpts.repetition_penalty,
      presence_penalty: normalizedOpts.presence_penalty,
    })

    return completion.choices[0]?.message?.content || ''
  }

  async interrupt(): Promise<void> {
    if (this.engine) {
      // Custom fork: interruptGenerate aborts without committing partial KV / assistant text.
      // Worker: posts `interruptGenerate`; the worker handles it between decode steps.
      await this.engine.interruptGenerate?.()
    }
  }

  async terminate(): Promise<void> {
    const engine = this.engine
    this.engine = null
    this.initialized = false
    this.config = null
    if (!engine) return
    if (isWorkerMlcEngine(engine)) {
      // interrupt → unload (bounded) → worker.terminate(): no second engine survives a hot-swap
      await engine.dispose()
    } else {
      await engine.unload()
    }
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getLoadedModelId(): string | null {
    return this.config?.id || null
  }

  getContextWindowSize(): number {
    if (this.config?.context_window_size) {
      return this.config.context_window_size
    }
    const engine = this.engine as {
      chatConfig?: { context_window_size?: number }
    } | null
    return (
      getMlcEngineContextWindow(engine) ??
      engine?.chatConfig?.context_window_size ??
      4096
    )
  }

  /** Where the loaded engine runs, or null when nothing is loaded. */
  getRuntime(): MlcRuntime | null {
    if (!this.engine) return null
    return isWorkerMlcEngine(this.engine) ? 'worker' : 'main'
  }

  getEngineType(): EngineType {
    return 'mlc'
  }

  /**
   * Get the underlying engine (in-process `MLCEngine` or the worker client).
   * For advanced use cases only.
   */
  getEngine(): MlcEngineHandle | null {
    return this.engine
  }

  /** Sync tokenizer access — main-thread engine only (the worker's tokenizer is async). */
  countTokens(text: string): number | null {
    if (!this.engine || !text || isWorkerMlcEngine(this.engine)) return null;
    try {
      const pipelineMap = (this.engine as unknown as {
        loadedModelIdToPipeline?: Map<string, { tokenizer?: { encode: (s: string) => { length: number } } }>;
      }).loadedModelIdToPipeline;
      const pipeline = pipelineMap?.values().next().value;
      const encoded = pipeline?.tokenizer?.encode(text);
      if (encoded && encoded.length > 0) {
        return encoded.length;
      }
    } catch {
      // Fall through to null — caller uses cached-ratio/heuristic
    }
    return null;
  }

  /** Worker path: tokenize inside the worker. Returns 0 when unavailable (heuristic fallback). */
  async countTokensAsync(text: string): Promise<number> {
    if (!this.engine || !text) return 0;
    if (isWorkerMlcEngine(this.engine)) {
      try {
        return await this.engine.countTokens(text);
      } catch {
        return 0;
      }
    }
    return this.countTokens(text) ?? 0;
  }

  getModelFamily(): string {
    const id = (this.config?.id ?? '').toLowerCase();
    if (id.includes('hermes')) return 'hermes';
    if (id.includes('llama-3') || id.includes('llama3')) return 'llama3';
    if (id.includes('llama-2') || id.includes('llama2')) return 'llama2';
    return 'default';
  }
}
