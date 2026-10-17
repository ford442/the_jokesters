export type ProfanityLevel = 'PG' | 'CASUAL' | 'GRITTY' | 'UNCENSORED'

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
  /** Cleaned text for display, TTS and memory. */
  content: string
  /**
   * Exact text the engine saw (cued user prompt / raw model output). Re-sent verbatim so
   * the request extends the previous one and the KV cache is reused (#400 B).
   */
  engineContent?: string
}

export type ErrorCategory =
  | 'webgpu'
  | 'oom'
  | 'network'
  | 'config'
  | 'wasm_missing'
  | 'llamacpp_mismatch'
  | 'unknown'
