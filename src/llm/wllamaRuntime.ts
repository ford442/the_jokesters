/**
 * wllama runtime helpers — bundled WASM URLs and mismatch detection.
 *
 * WASM is imported via Vite ?url so it always matches the installed @wllama/wllama JS glue.
 * After bumping @wllama/wllama, run: npm run verify:wllama
 */

import singleThreadWasm from '@wllama/wllama/esm/single-thread/wllama.wasm?url'
import multiThreadWasm from '@wllama/wllama/esm/multi-thread/wllama.wasm?url'
import type { AssetsPathConfig } from '@wllama/wllama'

/** Bundled WASM paths keyed for Wllama constructor (must match wllama internal paths). */
export const WLLAMA_WASM_PATHS: AssetsPathConfig = {
  'single-thread/wllama.wasm': singleThreadWasm,
  'multi-thread/wllama.wasm': multiThreadWasm,
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
