/**
 * wllama runtime helpers — bundled WASM URLs and mismatch detection.
 *
 * WASM is imported via Vite ?url so it always matches the installed @wllama/wllama JS glue.
 * After bumping @wllama/wllama, run: npm run verify:wllama
 */

import wllamaWasm from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import type { AssetsPathConfig, ModelSource } from '@wllama/wllama'
import type { ChatMessage } from './LLMEngine'
import { probeIsolation, wasmThreadCount } from '../utils/crossOriginIsolation'

/** Bundled WASM path for the Wllama constructor (wllama 3.1+: one build for single/multi-thread and WebGPU). */
export const WLLAMA_WASM_PATHS: AssetsPathConfig = {
  default: wllamaWasm,
}

/**
 * Thrown when @wllama/wllama JS glue cannot instantiate its WASM module.
 * Usually means hosted WASM ≠ installed package version.
 */
export class WllamaRuntimeMismatchError extends Error {
  readonly category = 'llamacpp_mismatch' as const

  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'WllamaRuntimeMismatchError'
    if (options?.cause !== undefined) {
      this.cause = options.cause
    }
  }
}

const MISMATCH_PATTERNS = [
  'function import requires a callable',
  'llama.cpp runtime mismatch',
  'failed to instantiate wasm',
  'webassembly.instantiate',
  'linkerror',
  'import #',
] as const

/** Detect WASM glue mismatch from a thrown value or message string. */
export function isWllamaRuntimeMismatch(error: unknown): boolean {
  if (error instanceof WllamaRuntimeMismatchError) {
    return true
  }

  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase()
  return MISMATCH_PATTERNS.some((pattern) => msg.includes(pattern))
}

/** Wrap unknown errors; rethrow typed mismatch for engine fallback + UI. */
export function rethrowWllamaRuntimeError(error: unknown): never {
  if (error instanceof WllamaRuntimeMismatchError) {
    throw error
  }

  if (isWllamaRuntimeMismatch(error)) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new WllamaRuntimeMismatchError(
      `llama.cpp runtime mismatch — fall back to MLC or another engine. (${detail})`,
      { cause: error }
    )
  }

  throw error
}

export interface WllamaLoadTuningEnv {
  isolated?: boolean
  hardwareConcurrency?: number
  /** Layers offloaded to WebGPU. wllama 3.x offloads everything by default; we default to CPU (0). */
  gpuLayers?: number
}

/** llama.cpp load tuning: threads when isolated, larger batch, q8_0 K cache, flash attention, GPU offload. */
export function wllamaLoadTuning(
  contextTokens: number,
  env: WllamaLoadTuningEnv = {},
): { n_ctx: number; n_threads: number; n_batch: number; n_gpu_layers: number; cache_type_k: 'q8_0'; flash_attn: boolean } {
  const probe = probeIsolation()
  return {
    n_ctx: contextTokens,
    // Single-thread wasm (not isolated) ignores n_threads > 1.
    n_threads: wasmThreadCount(env.isolated ?? probe.status === 'isolated', env.hardwareConcurrency ?? probe.hardwareConcurrency),
    n_batch: Math.min(512, contextTokens),
    // 0 keeps the CPU-only behaviour of the wllama 2.x GGUF presets (the 3.x default would grab all VRAM).
    n_gpu_layers: env.gpuLayers ?? 0,
    cache_type_k: 'q8_0',
    flash_attn: true,
  }
}

/**
 * The main wllama build needs JSPI and 64-bit memory. Without them wllama silently switches to a
 * 32-bit compat build fetched from a CDN, which cannot hold multi-GB models.
 */
export function wllamaHasMemory64Build(
  env: { jspi?: boolean; memory64?: boolean } = {},
): boolean {
  if (!(env.jspi ?? !!(WebAssembly as { Suspending?: unknown }).Suspending)) return false
  if (env.memory64 !== undefined) return env.memory64
  try {
    new (WebAssembly.Memory as new (d: object) => WebAssembly.Memory)({ address: 'i64', initial: BigInt(1) })
    return true
  } catch {
    return false
  }
}

/** First argument for `loadModelFromUrl`: plain GGUF URL, or `{ url, mmprojUrl }` for vision models. */
export function wllamaModelSource(ggufUrl: string, mmprojUrl?: string): string | ModelSource {
  return mmprojUrl ? { url: ggufUrl, mmprojUrl } : ggufUrl
}

type WllamaMessage =
  | { role: 'system' | 'assistant'; content: string }
  | { role: 'user'; content: string | Array<{ type: 'text'; text: string } | { type: 'image'; data: ArrayBuffer }> }

const textOf = (content: ChatMessage['content']): string =>
  typeof content === 'string' ? content : content.flatMap((p) => (p.type === 'text' ? [p.text] : [])).join('\n')

/**
 * Engine-neutral messages → wllama's OAI-style messages. Image parts (`image_url`: data:/blob:/http URL)
 * become `ArrayBuffer`s on user turns when the loaded model has a vision projector; otherwise they are dropped.
 */
export async function toWllamaMessages(
  messages: ChatMessage[],
  opts: { imageInput: boolean; fetchImage?: (url: string) => Promise<ArrayBuffer> } = { imageInput: false },
): Promise<WllamaMessage[]> {
  const fetchImage = opts.fetchImage ?? (async (url: string) => (await fetch(url)).arrayBuffer())
  return Promise.all(
    messages.map(async (m): Promise<WllamaMessage> => {
      if (m.role !== 'user' || typeof m.content === 'string') return { role: m.role, content: textOf(m.content) }
      const hasImage = m.content.some((p) => p.type === 'image_url')
      if (hasImage && !opts.imageInput) {
        console.warn('[wllama] image part dropped: loaded model has no vision projector')
      }
      if (!hasImage || !opts.imageInput) return { role: 'user', content: textOf(m.content) }
      const parts = await Promise.all(
        m.content.map(async (p) =>
          p.type === 'text'
            ? ({ type: 'text', text: p.text } as const)
            : ({ type: 'image', data: await fetchImage(p.image_url.url) } as const),
        ),
      )
      return { role: 'user', content: parts }
    }),
  )
}
