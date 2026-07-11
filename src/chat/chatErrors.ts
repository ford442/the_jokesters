import { isWllamaRuntimeMismatch } from '../llm/wllamaRuntime'
import type { ErrorCategory } from '../types/chat'

/** Categorize LLM / GPU errors for user-facing messaging. */
export function categorizeChatError(error: unknown): ErrorCategory {
  const msg = error instanceof Error ? error.message : String(error)
  const msgLower = msg.toLowerCase()

  if (
    error instanceof Error &&
    error.name === 'WebLLMInitError' &&
    'category' in error &&
    typeof (error as { category?: string }).category === 'string'
  ) {
    const cat = (error as { category: string }).category
    if (cat === 'webgpu' || cat === 'oom' || cat === 'network') {
      return cat
    }
  }

  if (msgLower.includes('webgpu') || (msgLower.includes('gpu') && msgLower.includes('not supported'))) {
    return 'webgpu'
  }

  if (
    msgLower.includes('oom') ||
    msgLower.includes('memory') ||
    msgLower.includes('createbuffer') ||
    msgLower.includes('allocation') ||
    msgLower.includes('mapasync') ||
    msgLower.includes('buffer was unmapped') ||
    msgLower.includes('device is lost') ||
    msgLower.includes('device lost')
  ) {
    return 'oom'
  }

  if (
    msgLower.includes('fetch') ||
    msgLower.includes('network') ||
    msgLower.includes('err_') ||
    msgLower.includes('cache') ||
    msgLower.includes('cdn') ||
    msgLower.includes('timeout')
  ) {
    return 'network'
  }

  if (
    msgLower.includes('llama.cpp runtime mismatch') ||
    msgLower.includes('function import requires a callable') ||
    isWllamaRuntimeMismatch(error)
  ) {
    return 'llamacpp_mismatch'
  }

  return 'unknown'
}
