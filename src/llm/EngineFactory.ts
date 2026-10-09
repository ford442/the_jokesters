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
import { TransformersEngineAdapter } from './TransformersEngineAdapter'
import { ApiEngineAdapter } from './ApiEngineAdapter'

export type EngineType = 'auto' | 'mlc' | 'llamacpp' | 'transformers' | 'api'

/**
 * Adapter-aware WebGPU availability.
 * - `ready`: `requestAdapter()` returned an adapter
 * - `no-adapter`: `navigator.gpu` exists, but no adapter (null or request failed)
 * - `unavailable`: no WebGPU API
 * - `unknown`: API is present, but the adapter has not been requested yet
 */
export type WebGPUStatus = 'ready' | 'no-adapter' | 'unavailable' | 'unknown'

export interface EngineCapabilities {
  /**
   * True only when a WebGPU adapter was obtained.
   * API presence alone is not enough — engines that need WebGPU will fail without an adapter.
   */
  webgpu: boolean
  /** `navigator.gpu` exists, independent of whether an adapter can be created. */
  webgpuApi: boolean
  /** Three-state availability used by the capability line and engine selection. */
  webgpuStatus: WebGPUStatus
  /** WebAssembly support available */
  wasm: boolean
  /** SIMD support available */
  simd: boolean
  /** SharedArrayBuffer support available */
  threads: boolean
  /** WebGPU shader-f16 support */
  shaderF16: boolean
}

/** Capability-line label. Same status drives Auto engine selection via `webgpu`. */
export function formatWebGPUCapabilityLabel(status: WebGPUStatus): string {
  switch (status) {
    case 'ready':
      return '✅ WebGPU (adapter OK)'
    case 'no-adapter':
      return '⚠️ WebGPU API present, no adapter'
    case 'unavailable':
      return '❌ no WebGPU'
    case 'unknown':
      return '… WebGPU (checking adapter)'
  }
}

/**
 * Detect browser capabilities relevant to LLM engines.
 */
export function detectCapabilities(): EngineCapabilities {
  const nav = (typeof navigator !== 'undefined' ? navigator : {}) as any

  // API presence only. A working adapter is resolved by detectCapabilitiesWithAdapter().
  const webgpuApi = typeof nav.gpu !== 'undefined'
  const webgpuStatus: WebGPUStatus = webgpuApi ? 'unknown' : 'unavailable'

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
    webgpu: false,
    webgpuApi,
    webgpuStatus,
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
 * Detect WebGPU hardware limits that affect model loading.
 * Returns maxBufferSize (0 if WebGPU unavailable) and shader-f16 support.
 */
export interface WebGPULimits {
  maxBufferSize: number
  supportsF16: boolean
  adapterAvailable: boolean
}

let webgpuLimitsPromise: Promise<WebGPULimits> | null = null;

export async function detectWebGPULimits(): Promise<WebGPULimits> {
  if (webgpuLimitsPromise) return webgpuLimitsPromise;

  webgpuLimitsPromise = (async () => {
    try {
      const nav = navigator as any
      if (!nav.gpu) {
        return { maxBufferSize: 0, supportsF16: false, adapterAvailable: false }
      }

      const adapter = await nav.gpu.requestAdapter()
      if (!adapter) {
        return { maxBufferSize: 0, supportsF16: false, adapterAvailable: false }
      }

      const maxBufferSize = adapter.limits?.maxBufferSize ?? 0
      const supportsF16 = adapter.features?.has('shader-f16') ?? false

      return { maxBufferSize, supportsF16, adapterAvailable: true }
    } catch {
      return { maxBufferSize: 0, supportsF16: false, adapterAvailable: false }
    }
  })();

  return webgpuLimitsPromise;
}

export async function detectCapabilitiesWithAdapter(): Promise<EngineCapabilities> {
  const caps = detectCapabilities();
  if (!caps.webgpuApi) {
    return { ...caps, webgpu: false, webgpuStatus: 'unavailable', shaderF16: false };
  }

  const limits = await detectWebGPULimits();
  if (!limits.adapterAvailable) {
    return { ...caps, webgpu: false, webgpuStatus: 'no-adapter', shaderF16: false };
  }

  return { ...caps, webgpu: true, webgpuStatus: 'ready', shaderF16: limits.supportsF16 };
}

/** Drop the cached adapter probe so a later call hits `requestAdapter()` again. */
export function resetWebGPUDetectionCache(): void {
  webgpuLimitsPromise = null;
}

function transformersUsesWebGPU(modelConfig: UnifiedModelConfig): boolean {
  const device = modelConfig.transformers?.device
  return device !== 'wasm' && device !== 'cpu'
}

function transformersRunnable(modelConfig: UnifiedModelConfig, capabilities: EngineCapabilities): boolean {
  if (modelConfig.transformers === undefined) return false
  if (!transformersUsesWebGPU(modelConfig)) return true
  return capabilities.webgpu
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
  /** Whether the model supports Transformers.js engine */
  transformers: boolean
  /** Whether the model supports API engine */
  api: boolean
  /** Recommended engine for this model */
  recommended: 'mlc' | 'llamacpp' | 'transformers' | 'api'
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
  const hasTransformers = modelConfig.transformers !== undefined
  const hasApi = modelConfig.api !== undefined

  // API models are server-side and don't depend on browser capabilities.
  // MLC and WebGPU Transformers.js require a real adapter (`capabilities.webgpu`).
  let recommended: 'mlc' | 'llamacpp' | 'transformers' | 'api'
  if (hasApi) {
    recommended = 'api'
  } else if (hasMlc && capabilities.webgpu) {
    recommended = 'mlc'
  } else if (hasTransformers && transformersRunnable(modelConfig, capabilities)) {
    recommended = 'transformers'
  } else if (hasLlamaCpp) {
    recommended = 'llamacpp'
  } else if (capabilities.webgpu) {
    recommended = 'mlc'
  } else {
    recommended = 'llamacpp'
  }

  return {
    mlc: hasMlc,
    llamacpp: hasLlamaCpp,
    transformers: hasTransformers,
    api: hasApi,
    recommended
  }
}

/**
 * Ordered fallback engines when llama.cpp WASM fails (glue mismatch, etc.).
 * Excludes engines already attempted via `exclude`.
 */
export function getEngineFallbackOrder(
  modelConfig: UnifiedModelConfig,
  capabilities: EngineCapabilities,
  exclude: Array<'mlc' | 'transformers' | 'api' | 'llamacpp'> = []
): Array<'mlc' | 'transformers' | 'api'> {
  const support = getModelEngineSupport(modelConfig, capabilities)
  const order: Array<'mlc' | 'transformers' | 'api'> = []

  if (support.mlc && capabilities.webgpu && !exclude.includes('mlc')) {
    order.push('mlc')
  }
  if (support.transformers && transformersRunnable(modelConfig, capabilities) && !exclude.includes('transformers')) {
    order.push('transformers')
  }
  if (support.api && !exclude.includes('api')) {
    order.push('api')
  }

  return order
}

/**
 * Select and create the appropriate engine for a model.
 */
/**
 * Pick an engine id from model support and adapter-aware capabilities.
 * `capabilities.webgpu` must come from `detectCapabilitiesWithAdapter()` (or an equivalent probe).
 */
export function resolveEngineChoice(
  modelConfig: UnifiedModelConfig,
  preference: EngineType,
  capabilities: EngineCapabilities,
): 'mlc' | 'llamacpp' | 'transformers' | 'api' {
  const support = getModelEngineSupport(modelConfig, capabilities)

  if (preference === 'api' && support.api) return 'api'
  if (preference === 'transformers' && support.transformers) return 'transformers'
  if (preference === 'mlc' && support.mlc) return 'mlc'
  if (preference === 'llamacpp' && support.llamacpp) return 'llamacpp'

  if (support.recommended === 'api' && support.api) return 'api'
  if (support.recommended === 'mlc' && support.mlc && capabilities.webgpu) return 'mlc'
  if (support.recommended === 'transformers' && transformersRunnable(modelConfig, capabilities)) {
    return 'transformers'
  }
  if (support.llamacpp) return 'llamacpp'
  if (support.api) return 'api'
  if (capabilities.webgpu && support.mlc) return 'mlc'
  if (transformersRunnable(modelConfig, capabilities)) return 'transformers'
  if (support.mlc) return 'mlc'
  if (support.transformers) return 'transformers'
  return 'llamacpp'
}

export async function selectEngine(
  modelConfig: UnifiedModelConfig,
  preference: EngineType = 'auto',
  capabilities?: EngineCapabilities
): Promise<LLMEngine> {
  const caps = capabilities ?? await detectCapabilitiesWithAdapter()
  const choice = resolveEngineChoice(modelConfig, preference, caps)

  if (preference !== 'auto' && preference !== choice) {
    console.warn(`[EngineFactory] Model ${modelConfig.id} does not support ${preference} engine. Falling back to auto.`)
  }
  if ((choice === 'mlc' || (choice === 'transformers' && transformersUsesWebGPU(modelConfig))) && !caps.webgpu) {
    console.warn(`[EngineFactory] WebGPU adapter not available. ${choice} engine may not work properly.`)
  }

  switch (choice) {
    case 'api':
      console.log('[EngineFactory] Using API Server (OpenAI-compatible)')
      return new ApiEngineAdapter()
    case 'transformers':
      console.log('[EngineFactory] Using Transformers.js (ONNX/WebGPU)')
      return new TransformersEngineAdapter()
    case 'mlc':
      console.log('[EngineFactory] Using MLC (WebGPU optimized)')
      return new MlcEngineAdapter()
    case 'llamacpp':
      console.log('[EngineFactory] Using llama.cpp (WASM/CPU)')
      return new LlamaCppEngineAdapter()
  }
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
  if (support.api) engines.push('api')
  if (support.mlc) engines.push('mlc')
  if (support.transformers) engines.push('transformers')
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
   * Detect browser capabilities asynchronously, explicitly checking the adapter.
   */
  static async detectCapabilitiesWithAdapter(): Promise<EngineCapabilities> {
    return detectCapabilitiesWithAdapter()
  }

  /**
   * Async check for shader-f16 support.
   */
  static async detectShaderF16Support(): Promise<boolean> {
    return detectShaderF16Support()
  }

  /**
   * Detect WebGPU hardware limits.
   */
  static async detectWebGPULimits(): Promise<WebGPULimits> {
    return detectWebGPULimits()
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
  static createEngine(type: 'mlc' | 'llamacpp' | 'transformers' | 'api'): LLMEngine {
    switch (type) {
      case 'mlc':
        return new MlcEngineAdapter()
      case 'llamacpp':
        return new LlamaCppEngineAdapter()
      case 'transformers':
        return new TransformersEngineAdapter()
      case 'api':
        return new ApiEngineAdapter()
      default:
        throw new Error(`Unknown engine type: ${type}`)
    }
  }
}
