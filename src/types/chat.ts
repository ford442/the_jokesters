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
  content: string
}

export type ErrorCategory = 'webgpu' | 'oom' | 'network' | 'llamacpp_mismatch' | 'unknown'
