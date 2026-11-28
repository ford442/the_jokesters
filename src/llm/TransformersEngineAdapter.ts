/**
 * Transformers.js Engine Adapter
 * 
 * Hugging Face ONNX inference via ONNX Runtime Web. Uses the WebGPU backend when an
 * adapter exists and falls back — explicitly, never silently — to WASM (CPU) with a
 * WASM-friendly dtype when it does not.
 */

import { pipeline, TextStreamer, InterruptableStoppingCriteria, env } from '@huggingface/transformers'
import type {

  LLMEngine, 
  ChatMessage, 
  GenerationOptions, 
  InitProgressReport, 
  UnifiedModelConfig 
} from './LLMEngine';
import {
  type EngineContextInfo,
  DEFAULT_CONTEXT_WINDOW_SIZE
} from './LLMEngine'
import type { ChatStreamEvent } from './streamEvents'
import { VPS_STORAGE_ORIGIN } from '../config/models'
import {
  isTransformersCpuDevice,
  resolveTransformersDevice,
  resolveTransformersDtype,
  type TransformersDevice,
} from './engineSelection'

export interface TransformersEngineConfig {
  model_id: string  // HuggingFace model ID
  device?: 'webgpu' | 'wasm' | 'cpu'
  dtype?: 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16'
  /** Weights are not on the VPS mirror: load from the HF Hub directly (no 404 round-trip). */
  skipMirror?: boolean
}

/** `remotePathTemplate` is supported by transformers.js but missing from its public `env` type. */
type MirrorEnv = { remotePathTemplate: string }

async function hasWebGpuAdapter(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter?: () => Promise<unknown> } }).gpu
    if (!gpu?.requestAdapter) return false
    const adapter = await gpu.requestAdapter()
    return adapter != null
  } catch (error) {
    console.error('[Transformers] WebGPU adapter check failed:', error)
    return false
  }
}

export class TransformersEngineAdapter implements LLMEngine {
  readonly id = 'transformers'
  readonly name = 'Transformers.js (ONNX/WebGPU)'
  readonly supportsWebGPU = true
  
  private generator: any = null
  private config: UnifiedModelConfig | null = null
  private abortController: AbortController | null = null
  private readonly deviceOverride: TransformersDevice | undefined
  private resolvedDevice: TransformersDevice | null = null
  private stopping: InstanceType<typeof InterruptableStoppingCriteria> | null = null

  constructor(options: { device?: TransformersDevice } = {}) {
    this.deviceOverride = options.device
  }
  
  async initialize(
    modelConfig: UnifiedModelConfig,
    onProgress?: (report: InitProgressReport) => void
  ): Promise<void> {
    if (!modelConfig.transformers) {
      throw new Error('Model config missing transformers configuration')
    }
    
    this.config = modelConfig
    this.abortController = new AbortController()
    
    const tfConfig = modelConfig.transformers
    
    // Configure Transformers.js environment
    ;(env.backends as any).onnx.wasm.proxy = false
    env.allowLocalModels = false
    
    // Self-hosted model mirror on VPS, unless this model is known not to be mirrored.
    if (tfConfig.skipMirror) {
      env.remoteHost = 'https://huggingface.co'
      ;(env as unknown as MirrorEnv).remotePathTemplate = '{model}/resolve/{revision}/'
    } else {
      env.remoteHost = VPS_STORAGE_ORIGIN
      ;(env as unknown as MirrorEnv).remotePathTemplate = 'models/transformers/{model}/resolve/{revision}/'
    }
    
    onProgress?.({ progress: 0, text: `Loading ${modelConfig.name}...`, timeElapsed: 0 })

    const requested = this.deviceOverride ?? tfConfig.device ?? 'webgpu'
    const adapterAvailable = requested === 'webgpu' ? await hasWebGpuAdapter() : true
    const device = resolveTransformersDevice(tfConfig.device, this.deviceOverride, adapterAvailable)
    const dtype = resolveTransformersDtype(tfConfig.dtype, device)
    this.resolvedDevice = device
    if (requested === 'webgpu' && device !== 'webgpu') {
      const message = `No WebGPU adapter — Transformers.js using WASM (${dtype}), slower`
      console.warn(`[Transformers] ${message}`)
      onProgress?.({ progress: 0, text: message, timeElapsed: 0 })
    } else {
      console.log(`[Transformers] Using device: ${device}, dtype: ${dtype}`)
    }
    
    const load = () => pipeline(
      'text-generation',
      tfConfig.model_id,
      {
        device,
        dtype,
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
            onProgress?.({
              progress: progress.progress,
              text: `Downloading ${progress.file}...`,
              timeElapsed: 0
            })
          }
        }
      }
    )

    try {
      try {
        this.generator = await load()
      } catch (mirrorError) {
        // The VPS mirror may not carry every dtype variant (e.g. `q4` for WASM). Retry once
        // from the Hugging Face Hub, and say so — never switch sources silently.
        if (env.remoteHost !== VPS_STORAGE_ORIGIN) throw mirrorError
        console.warn('[Transformers] Mirror load failed, retrying from Hugging Face Hub:', mirrorError)
        onProgress?.({ progress: 0, text: 'Mirror load failed — retrying from Hugging Face Hub...', timeElapsed: 0 })
        env.remoteHost = 'https://huggingface.co'
        ;(env as unknown as MirrorEnv).remotePathTemplate = '{model}/resolve/{revision}/'
        this.generator = await load()
      }

      onProgress?.({ progress: 1, text: 'Model loaded', timeElapsed: 0 })

    } catch (error) {
      console.error('Failed to load Transformers.js model:', error)
      throw error
    }
  }

  async *chat(
    messages: ChatMessage[],
    options: GenerationOptions
  ): AsyncGenerator<ChatStreamEvent> {
    if (!this.generator) throw new Error('Engine not initialized')

    this.abortController = new AbortController()
    const abortSignal = this.abortController.signal
    const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }))
    
    // Use TextStreamer for real-time output
    const chunks: string[] = []
    const streamer = new TextStreamer(this.generator.tokenizer, {
      skip_prompt: true,
      callback_function: (text: string) => { chunks.push(text) }
    })
    
    // Start generation. Completion is tracked explicitly: a Promise has no `isResolved`.
    this.stopping = new InterruptableStoppingCriteria()
    let finished = false
    let failure: unknown = null
    const generationPromise: Promise<unknown> = this.generator(formattedMessages, {
      max_new_tokens: options.max_tokens || 256,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.9,
      do_sample: true,
      repetition_penalty: options.repetition_penalty ?? 1.0,
      streamer,
      stopping_criteria: this.stopping,
      return_full_text: false
    }).then(
      () => { finished = true },
      (error: unknown) => { failure = error; finished = true },
    )

    // Yield chunks as they arrive
    let lastChunkIndex = 0
    while (!abortSignal?.aborted) {
      if (chunks.length > lastChunkIndex) {
        const newChunks = chunks.slice(lastChunkIndex)
        lastChunkIndex = chunks.length
        for (const chunk of newChunks) yield chunk
      }

      if (finished) {
        if (chunks.length > lastChunkIndex) {
          const newChunks = chunks.slice(lastChunkIndex)
          for (const chunk of newChunks) yield chunk
        }
        break
      }

      await new Promise(r => setTimeout(r, 10))
    }

    if (abortSignal?.aborted) {
      this.stopping.interrupt()
      await generationPromise
      return
    }
    if (failure) throw failure
  }

  async interrupt(): Promise<void> {
    this.stopping?.interrupt()
    this.abortController?.abort()
    this.abortController = new AbortController()
  }
  
  async terminate(): Promise<void> {
    this.generator = null
    this.config = null
    this.abortController = null
    this.stopping = null
    this.resolvedDevice = null
  }

  /** Device the loaded pipeline actually runs on (`null` before initialize). */
  getResolvedDevice(): TransformersDevice | null {
    return this.resolvedDevice
  }

  /** True when running on WASM/CPU — callers show the explicit slower-mode badge. */
  isCpuMode(): boolean {
    return isTransformersCpuDevice(this.resolvedDevice ?? undefined)
  }
  
  getEngineType(): import('./LLMEngine').EngineType {
    return 'transformers'
  }
  
  isInitialized(): boolean { return this.generator !== null }
  getLoadedModelId(): string | null { return this.config?.id || null }

  getContextInfo(): EngineContextInfo {
    const requested = this.config?.context_window_size ?? DEFAULT_CONTEXT_WINDOW_SIZE
    return {
      requested,
      effective: requested,
      source: this.config?.context_window_size ? 'config' : 'adapter_default'
    }
  }

  countTokens(text: string): number | null {
    if (!this.generator?.tokenizer || !text) return null;
    try {
      const tokenizer = this.generator.tokenizer;
      if (typeof tokenizer.encode === 'function') {
        const encoded = tokenizer.encode(text, { add_special_tokens: false });
        if (Array.isArray(encoded)) return encoded.length;
        if (encoded?.input_ids) return encoded.input_ids.length;
      }
    } catch {
      return null;
    }
    return null;
  }

  getModelFamily(): string {
    const id = (this.config?.id ?? '').toLowerCase();
    if (id.includes('llama-3') || id.includes('llama3')) return 'llama3';
    if (id.includes('hermes')) return 'hermes';
    return 'default';
  }
}
