/**
 * Engine Factory
 * 
 * Factory for creating and selecting LLM engines based on:
 * - Browser capabilities (WebGPU, WASM, SIMD)
 * - Model configuration
 * - User preference
 */

import type { LLMEngine, UnifiedModelConfig } from './LLMEngine'
import { MlcEngineAdapter } from './MlcEngineAdapter'
import { LlamaCppEngineAdapter } from './LlamaCppEngineAdapter'

export type EngineType = 'auto' | 'mlc' | 'llamacpp'

export interface EngineCapabilities {
  /** WebGPU support available */
  webgpu: boolean
  /** WebAssembly support available */
  wasm: boolean
  /** SIMD support available */
  simd: boolean
  /** SharedArrayBuffer support available */
  threads: boolean
  /** WebGPU shader-f16 support */
  shaderF16: boolean
}

/**
 * Detect browser capabilities relevant to LLM engines.
 */
export function detectCapabilities(): EngineCapabilities {
  const nav = navigator as any

  // Check WebGPU
  const webgpu = typeof nav.gpu !== 'undefined'

  // Check WASM
  const wasm = typeof WebAssembly === 'object' && 
               typeof WebAssembly.instantiate === 'function'

  // Check SIMD (via WebAssembly feature detection)
  let simd = false
  try {
    if (wasm) {
      // SIMD is supported if we can compile a SIMD module
      WebAssembly.validate(new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x60, 0x01, 0x7f, 0x01, 0x7f,
        0x03, 0x02, 0x01, 0x00, 0x07, 0x08, 0x01, 0x04,
        0x74, 0x65, 0x73, 0x74, 0x00, 0x00, 0x0a, 0x0a,
        0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0x1a,
        0x41, 0x00, 0x0b
      ]))
      simd = true
    }
  } catch {
    simd = false
  }

  // Check SharedArrayBuffer (for threads)
  const threads = typeof SharedArrayBuffer !== 'undefined'

  // Check shader-f16 (async, but we return false for now - will be checked at model load time)
  const shaderF16 = false  // Actual check happens in checkF16Support() from config/models

  return {
    webgpu,
    wasm,
    simd,
    threads,
    shaderF16,
  }
}

/**
 * Async check for shader-f16 support.
 * This requires requesting a GPU adapter.
 */
export async function detectShaderF16Support(): Promise<boolean> {
  try {
    const nav = navigator as any
    if (!nav.gpu) return false
    
    const adapter = await nav.gpu.requestAdapter()
    return adapter?.features?.has('shader-f16') ?? false
  } catch {
    return false
  }
}

/**
 * Get the recommended engine type based on capabilities and model.
 */
export async function getRecommendedEngineType(
  capabilities: EngineCapabilities
): Promise<'mlc' | 'llamacpp'> {
  // MLC requires WebGPU for best performance
  // llama.cpp (wllama) works with WASM and is more compatible
  
  if (capabilities.webgpu) {
    return 'mlc'
  }
  
  return 'llamacpp'
}

export interface ModelEngineSupport {
  /** Whether the model supports MLC engine */
  mlc: boolean
  /** Whether the model supports llama.cpp engine */
  llamacpp: boolean
  /** Recommended engine for this model */
  recommended: 'mlc' | 'llamacpp'
}

/**
 * Check which engines support a given model configuration.
 */
export function getModelEngineSupport(
  modelConfig: UnifiedModelConfig,
  capabilities: EngineCapabilities
): ModelEngineSupport {
  // Check explicit engine configs
  const hasMlc = modelConfig.mlc !== undefined || modelConfig.engineConfig?.model_lib !== undefined
  const hasLlamaCpp = modelConfig.llamaCpp !== undefined || 
                      modelConfig.engineConfig?.ggufUrl !== undefined ||
                      modelConfig.engineConfig?.gguf_url !== undefined

  // If both are available, recommend based on capabilities
  if (hasMlc && hasLlamaCpp) {
    return {
      mlc: true,
      llamacpp: true,
      recommended: capabilities.webgpu ? 'mlc' : 'llamacpp'
    }
  }

  // If only one is available
  if (hasMlc) {
    return { mlc: true, llamacpp: false, recommended: 'mlc' }
  }
  if (hasLlamaCpp) {
    return { mlc: false, llamacpp: true, recommended: 'llamacpp' }
  }

  // Fallback: try to detect from capabilities
  if (capabilities.webgpu) {
    return { mlc: true, llamacpp: true, recommended: 'mlc' }
  }
  
  return { mlc: false, llamacpp: true, recommended: 'llamacpp' }
}

/**
 * Select and create the appropriate engine for a model.
 */
export async function selectEngine(
  modelConfig: UnifiedModelConfig,
  preference: EngineType = 'auto',
  capabilities?: EngineCapabilities
): Promise<LLMEngine> {
  const caps = capabilities ?? detectCapabilities()
  const support = getModelEngineSupport(modelConfig, caps)

  // Respect user preference
  if (preference === 'mlc') {
    if (!support.mlc) {
      console.warn(`[EngineFactory] Model ${modelConfig.id} does not support MLC engine. Falling back to llama.cpp.`)
      return new LlamaCppEngineAdapter()
    }
    if (!caps.webgpu) {
      console.warn(`[EngineFactory] WebGPU not available. MLC engine may not work properly.`)
    }
    return new MlcEngineAdapter()
  }

  if (preference === 'llamacpp') {
    if (!support.llamacpp) {
      console.warn(`[EngineFactory] Model ${modelConfig.id} does not support llama.cpp engine. Falling back to MLC.`)
      return new MlcEngineAdapter()
    }
    return new LlamaCppEngineAdapter()
  }

  // Auto-select based on model support and capabilities
  if (support.recommended === 'mlc' && caps.webgpu) {
    return new MlcEngineAdapter()
  }

  // Fall back to llama.cpp for compatibility
  return new LlamaCppEngineAdapter()
}

/**
 * Get a list of compatible engines for a model.
 */
export function getCompatibleEngines(
  modelConfig: UnifiedModelConfig,
  capabilities?: EngineCapabilities
): string[] {
  const caps = capabilities ?? detectCapabilities()
  const support = getModelEngineSupport(modelConfig, caps)

  const engines: string[] = []
  if (support.mlc) engines.push('mlc')
  if (support.llamacpp) engines.push('llamacpp')

  return engines
}

/**
 * EngineFactory class for convenient access.
 */
export class EngineFactory {
  /**
   * Detect browser capabilities.
   */
  static detectCapabilities(): EngineCapabilities {
    return detectCapabilities()
  }

  /**
   * Async check for shader-f16 support.
   */
  static async detectShaderF16Support(): Promise<boolean> {
    return detectShaderF16Support()
  }

  /**
   * Select and create the appropriate engine.
   */
  static async selectEngine(
    modelConfig: UnifiedModelConfig,
    preference: EngineType = 'auto',
    capabilities?: EngineCapabilities
  ): Promise<LLMEngine> {
    return selectEngine(modelConfig, preference, capabilities)
  }

  /**
   * Get compatible engines for a model.
   */
  static getCompatibleEngines(
    modelConfig: UnifiedModelConfig,
    capabilities?: EngineCapabilities
  ): string[] {
    return getCompatibleEngines(modelConfig, capabilities)
  }

  /**
   * Get engine support info for a model.
   */
  static getModelEngineSupport(
    modelConfig: UnifiedModelConfig,
    capabilities?: EngineCapabilities
  ): ModelEngineSupport {
    return getModelEngineSupport(modelConfig, capabilities ?? detectCapabilities())
  }

  /**
   * Create a specific engine by type.
   */
  static createEngine(type: 'mlc' | 'llamacpp'): LLMEngine {
    switch (type) {
      case 'mlc':
        return new MlcEngineAdapter()
      case 'llamacpp':
        return new LlamaCppEngineAdapter()
      default:
        throw new Error(`Unknown engine type: ${type}`)
    }
  }
}
