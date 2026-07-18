/**
 * MLC Engine Adapter
 * 
 * Adapter for the @mlc-ai/web-llm engine (WebGPU-based).
 * This is the primary engine for modern browsers with WebGPU support.
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
import { loadModelWithDynamicContext, type VRAMOptimizationConfig } from '../utils/dynamicContext'

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

  private engine: webllm.MLCEngine | null = null
  private config: UnifiedModelConfig | null = null
  protected initialized = false
  private vramConfig: VRAMOptimizationConfig | null = null

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
      model_lib_fallback: (modelConfig as MlcModelConfig & { model_lib_fallback?: string }).model_lib_fallback
        ?? (modelConfig.mlc as { model_lib_fallback?: string } | undefined)?.model_lib_fallback,
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
        this.vramConfig || undefined
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

    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta
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
      // Custom fork: interruptGenerate aborts without committing partial KV / assistant text
      await this.engine.interruptGenerate?.()
    }
  }

  async terminate(): Promise<void> {
    if (this.engine) {
      await this.engine.unload()
      this.engine = null
    }
    this.initialized = false
    this.config = null
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
      chatOpts?: { context_window_size?: number }
      chatConfig?: { context_window_size?: number }
    } | null
    return (
      engine?.chatOpts?.context_window_size ??
      engine?.chatConfig?.context_window_size ??
      4096
    )
  }

  getEngineType(): EngineType {
    return 'mlc'
  }

  /**
   * Get the underlying MLCEngine instance.
   * For advanced use cases only.
   */
  getEngine(): webllm.MLCEngine | null {
    return this.engine
  }

  countTokens(text: string): number | null {
    if (!this.engine || !text) return null;
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

  getModelFamily(): string {
    const id = (this.config?.id ?? '').toLowerCase();
    if (id.includes('hermes')) return 'hermes';
    if (id.includes('llama-3') || id.includes('llama3')) return 'llama3';
    if (id.includes('llama-2') || id.includes('llama2')) return 'llama2';
    return 'default';
  }
}
