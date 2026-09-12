import { isWllamaRuntimeMismatch } from '../llm/wllamaRuntime'
import type { ErrorCategory } from '../types/chat'

const CATEGORIES: readonly ErrorCategory[] = [
  'webgpu',
  'oom',
  'network',
  'config',
  'wasm_missing',
  'llamacpp_mismatch',
  'unknown',
]

function isErrorCategory(value: unknown): value is ErrorCategory {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value)
}

/** Categorize LLM / GPU / download errors for failover + user-facing messaging. */
export function categorizeChatError(error: unknown): ErrorCategory {
  if (
    error instanceof Error &&
    'category' in error &&
    isErrorCategory((error as { category?: unknown }).category)
  ) {
    return (error as { category: ErrorCategory }).category
  }

  const msg = error instanceof Error ? error.message : String(error)
  const msgLower = msg.toLowerCase()

  if (msgLower.includes('webgpu') || (msgLower.includes('gpu') && msgLower.includes('not supported'))) {
    return 'webgpu'
  }

  if (
    msgLower.includes('oom') ||
    msgLower.includes('createbuffer') ||
    msgLower.includes('mapasync') ||
    msgLower.includes('buffer was unmapped') ||
    msgLower.includes('device is lost') ||
    msgLower.includes('device lost') ||
    (msgLower.includes('memory') && !msgLower.includes('wasm'))
  ) {
    return 'oom'
  }

  if (
    msgLower.includes('model_lib') ||
    msgLower.includes('.wasm') ||
    msgLower.includes('wasm missing') ||
    msgLower.includes('webgpu.wasm')
  ) {
    return 'wasm_missing'
  }

  if (
    msgLower.includes('tokenizer') ||
    msgLower.includes('mlc-chat-config') ||
    msgLower.includes('tokenizer_files') ||
    msgLower.includes('invalid config') ||
    msgLower.includes('chat config')
  ) {
    return 'config'
  }

  if (
    msgLower.includes('llama.cpp runtime mismatch') ||
    msgLower.includes('function import requires a callable') ||
    isWllamaRuntimeMismatch(error)
  ) {
    return 'llamacpp_mismatch'
  }

  if (
    msgLower.includes('fetch') ||
    msgLower.includes('network') ||
    msgLower.includes('err_') ||
    msgLower.includes('cache') ||
    msgLower.includes('cdn') ||
    msgLower.includes('timeout') ||
    msgLower.includes('cors') ||
    /\b(404|403|429|500|502|503)\b/.test(msgLower) ||
    msgLower.includes('failed to load')
  ) {
    return 'network'
  }

  return 'unknown'
}
