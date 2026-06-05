/**
 * Transformers.js Engine Adapter
 * 
 * Provides WebGPU-accelerated inference with Hugging Face's extensive model ecosystem.
 * Uses ONNX Runtime Web for efficient execution with WebGPU backend.
 */

import { pipeline, TextStreamer, env } from '@huggingface/transformers'
import type { 
  LLMEngine, 
  ChatMessage, 
  GenerationOptions, 
  InitProgressReport, 
  UnifiedModelConfig 
} from './LLMEngine'

export interface TransformersEngineConfig {
  model_id: string  // HuggingFace model ID
  device?: 'webgpu' | 'wasm' | 'cpu'
  dtype?: 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16'
}

export class TransformersEngineAdapter implements LLMEngine {
  readonly id = 'transformers'
  readonly name = 'Transformers.js (ONNX/WebGPU)'
  readonly supportsWebGPU = true
  
  private generator: any = null
  private config: UnifiedModelConfig | null = null
  private abortController: AbortController | null = null
  
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
    
    // Self-hosted model mirror on VPS
    env.remoteHost = 'https://storage.1ink.us'
    ;(env as any).remotePathTemplate = 'models/transformers/{model}/resolve/{revision}/'
    
    onProgress?.({ progress: 0, text: `Loading ${modelConfig.name}...`, timeElapsed: 0 })
    
    try {
      this.generator = await pipeline(
        'text-generation',
        tfConfig.model_id,
        {
          device: tfConfig.device || 'webgpu',
          dtype: tfConfig.dtype || 'q4f16',
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
      
      onProgress?.({ progress: 1, text: 'Model loaded', timeElapsed: 0 })
      
    } catch (error) {
      console.error('Failed to load Transformers.js model:', error)
      throw error
    }
  }
  
  async *chat(
    messages: ChatMessage[],
    options: GenerationOptions
  ): AsyncGenerator<string> {
    if (!this.generator) throw new Error('Engine not initialized')
    
    const abortSignal = this.abortController?.signal
    const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }))
    
    // Use TextStreamer for real-time output
    const chunks: string[] = []
    const streamer = new TextStreamer(this.generator.tokenizer, {
      skip_prompt: true,
      callback_function: (text: string) => { chunks.push(text) }
    })
    
    // Start generation
    const generationPromise = this.generator(formattedMessages, {
      max_new_tokens: options.max_tokens || 256,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.9,
      do_sample: true,
      repetition_penalty: options.repetition_penalty ?? 1.0,
      streamer,
      return_full_text: false
    })
    
    // Yield chunks as they arrive
    let lastChunkIndex = 0
    while (!abortSignal?.aborted) {
      if (chunks.length > lastChunkIndex) {
        const newChunks = chunks.slice(lastChunkIndex)
        lastChunkIndex = chunks.length
        for (const chunk of newChunks) yield chunk
      }
      
      // Check if generation complete (poll promise)
      if (generationPromise.isResolved) {
        if (chunks.length > lastChunkIndex) {
          const newChunks = chunks.slice(lastChunkIndex)
          for (const chunk of newChunks) yield chunk
        }
        break
      }
      
      await new Promise(r => setTimeout(r, 10))
    }
  }
  
  async interrupt(): Promise<void> {
    this.abortController?.abort()
    this.abortController = new AbortController()
  }
  
  async terminate(): Promise<void> {
    this.generator = null
    this.config = null
    this.abortController = null
  }
  
  getEngineType(): import('./LLMEngine').EngineType {
    return 'transformers'
  }
  
  isInitialized(): boolean { return this.generator !== null }
  getLoadedModelId(): string | null { return this.config?.id || null }
}
