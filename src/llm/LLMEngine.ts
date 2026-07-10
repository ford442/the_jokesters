/**
 * LLM Engine Interface - Dual-Engine Architecture
 * 
 * This module defines the core abstraction layer that allows the app to switch
 * between MLC WebLLM and llama.cpp WASM engines without breaking existing functionality.
 */

export type EngineType = 'mlc' | 'llamacpp' | 'transformers' | 'api' | 'auto'

export interface ContentPartText {
  type: 'text'
  text: string
}

export interface ContentPartImage {
  type: 'image_url'
  image_url: { url: string }
}

export type ContentPart = ContentPartText | ContentPartImage

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

export interface GenerationOptions {
  temperature?: number
  top_p?: number
  max_tokens?: number
  seed?: number
  repetition_penalty?: number
  presence_penalty?: number
  stop?: string[]
  stream?: boolean
}

export interface NormalizedGenerationOptions {
  temperature: number
  top_p: number
  max_tokens: number
  seed?: number
  repetition_penalty?: number
  presence_penalty?: number
  stop: string[]
  stream: boolean
}

export interface InitProgressReport {
  progress: number
  text: string
  timeElapsed: number
}

export interface CapabilityReport {
  webgpu: boolean
  webgpuShaderF16: boolean
  wasm: boolean
  simd: boolean
  threads: boolean
  estimatedVRAM_MB: number | null
}

export interface EngineConfig {
  /** URL to the GGUF model file (for llama.cpp) */
  ggufUrl?: string
  /** Alias for ggufUrl (snake_case version) */
  gguf_url?: string
  /** Optional tokenizer URL */
  tokenizerUrl?: string
  /** Model family for prompt formatting */
  modelFamily?: 'vicuna' | 'hermes' | 'llama2' | 'llama3' | 'auto'
  /** Model library URL (for MLC) */
  model_lib?: string
  /** Model overrides (for MLC) */
  overrides?: Record<string, unknown>
  /** HuggingFace repo for loading model */
  hf_repo?: string
  /** HuggingFace file for loading model */
  hf_file?: string
}

export interface MlcEngineConfig {
  model_url: string
  model_lib_url: string
  overrides?: Record<string, unknown>
  contextWindowSize?: number
}

export interface LlamaCppEngineConfig {
  gguf_url: string
  hf_repo?: string
  hf_file?: string
  context_size: number
}

export interface TransformersEngineConfig {
  model_id: string
  device?: 'webgpu' | 'wasm' | 'cpu'
  dtype?: 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16'
}

export interface ApiEngineConfig {
  /** URL to the OpenAI-compatible API endpoint */
  endpoint: string
  /** Model identifier to send in requests */
  model_id: string
  /** Optional API key for authenticated endpoints */
  api_key?: string
}

export interface UnifiedModelConfig {
  id: string
  name: string
  /** Model source URL or path (optional fallback) */
  source?: string
  /** VRAM required in MB (0 for server-side models) */
  vram_required_MB: number
  /** Context window size */
  context_window_size: number
  /** Engine type hint */
  engine?: EngineType
  /** Engine-specific configuration */
  engineConfig?: EngineConfig
  /** MLC-specific configuration */
  mlc?: MlcEngineConfig
  /** llama.cpp-specific configuration */
  llamaCpp?: LlamaCppEngineConfig
  /** Transformers.js-specific configuration */
  transformers?: TransformersEngineConfig
  /** API server-specific configuration */
  api?: ApiEngineConfig
}

/**
 * LLM Engine Interface
 * 
 * Both MLC and llama.cpp engines must implement this interface.
 */
export interface LLMEngine {
  /** Engine identifier */
  readonly id: string
  /** Human-readable engine name */
  readonly name: string
  
  /**
   * Initialize the engine with a model configuration
   */
  initialize(
    modelConfig: UnifiedModelConfig,
    onProgress?: (report: InitProgressReport) => void
  ): Promise<void>
  
  /**
   * Terminate the engine and free resources
   */
  terminate(): Promise<void>
  
  /**
   * Generate chat completions with streaming
   */
  chat(
    messages: ChatMessage[],
    options: GenerationOptions
  ): AsyncGenerator<string>
  
  /**
   * Interrupt the current generation
   */
  interrupt(): Promise<void>
  
  /**
   * Get the engine type identifier
   */
  getEngineType(): EngineType
  
  /**
   * Check if the engine is initialized
   */
  isInitialized(): boolean
  
  /**
   * Get the ID of the currently loaded model
   */
  getLoadedModelId(): string | null

  /**
   * Count tokens in text using the engine tokenizer when available.
   * Returns null when the engine cannot tokenize synchronously.
   */
  countTokens?(text: string): number | null

  /**
   * Async token count for engines with lazy tokenizers (e.g. wllama).
   */
  countTokensAsync?(text: string): Promise<number>

  /**
   * Model family hint for cached-ratio fallback (llama3, hermes, etc.).
   */
  getModelFamily?(): string
}

/** Alias for backward compatibility */
export type BaseLLMEngine = LLMEngine

/**
 * Normalize generation options with defaults
 */
export function normalizeOptions(options: GenerationOptions): NormalizedGenerationOptions {
  return {
    temperature: options.temperature ?? 0.7,
    top_p: options.top_p ?? 0.9,
    max_tokens: options.max_tokens ?? 256,
    seed: options.seed,
    repetition_penalty: options.repetition_penalty,
    presence_penalty: options.presence_penalty,
    stop: options.stop ?? [],
    stream: options.stream ?? true,
  }
}
