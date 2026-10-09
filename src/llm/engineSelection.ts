/**
 * Pure engine-selection decisions.
 *
 * `navigator.gpu` existing is not enough — `requestAdapter()` can resolve to
 * null (no hardware adapter, WebGPU disabled, software GL only). Callers must
 * pass adapter-aware capabilities (`detectCapabilitiesWithAdapter`).
 */

import type { EngineType, UnifiedModelConfig } from './LLMEngine'

export interface EngineCapabilities {
  /** True only when a WebGPU adapter was actually granted. */
  webgpu: boolean
  wasm: boolean
  simd: boolean
  threads: boolean
  shaderF16: boolean
}

export type ConcreteEngine = 'mlc' | 'llamacpp' | 'transformers' | 'api'

export interface ModelEngineSupport {
  mlc: boolean
  llamacpp: boolean
  transformers: boolean
  api: boolean
  recommended: ConcreteEngine
}

export interface EngineSwitchTarget {
  modelId: string
  engine: 'llamacpp'
  label: string
}

/** Blessed CPU preset the launch UI can switch to when WebGPU cannot start. */
export const CPU_WASM_SWITCH: EngineSwitchTarget = {
  modelId: 'vicuna-7b-v1.5-GGUF',
  engine: 'llamacpp',
  label: 'Vicuna GGUF (CPU/WASM)',
}

export const NO_WEBGPU_ADAPTER_MESSAGE =
  'No WebGPU adapter — MLC unavailable. Try CPU/WASM mode or API.'

export class EngineStartError extends Error {
  readonly category = 'webgpu' as const
  readonly switchTo: EngineSwitchTarget

  constructor(message: string, switchTo: EngineSwitchTarget = CPU_WASM_SWITCH) {
    super(message)
    this.name = 'EngineStartError'
    this.switchTo = switchTo
  }
}

export function isEngineStartError(error: unknown): error is EngineStartError {
  return error instanceof EngineStartError
}

export type TransformersDevice = 'webgpu' | 'wasm' | 'cpu'

/**
 * Honor an explicit device, but never request WebGPU when no adapter exists.
 * Configs hardcode `device: 'webgpu'`; a null adapter must downgrade to WASM.
 */
export function resolveTransformersDevice(
  configured: TransformersDevice | undefined,
  override: TransformersDevice | undefined,
  adapterAvailable: boolean,
): TransformersDevice {
  const requested = override ?? configured ?? 'webgpu'
  if (requested === 'webgpu' && !adapterAvailable) return 'wasm'
  return requested
}

/**
 * Check which engines a model config declares.
 * `recommended` prefers API, then MLC when an adapter exists, then
 * Transformers.js, then llama.cpp.
 */
export function getModelEngineSupport(
  modelConfig: UnifiedModelConfig,
  capabilities: EngineCapabilities,
): ModelEngineSupport {
  const hasMlc = modelConfig.mlc !== undefined || modelConfig.engineConfig?.model_lib !== undefined
  const hasLlamaCpp = modelConfig.llamaCpp !== undefined ||
    modelConfig.engineConfig?.ggufUrl !== undefined ||
    modelConfig.engineConfig?.gguf_url !== undefined
  const hasTransformers = modelConfig.transformers !== undefined
  const hasApi = modelConfig.api !== undefined

  let recommended: ConcreteEngine
  if (hasApi) {
    recommended = 'api'
  } else if (hasMlc && capabilities.webgpu) {
    recommended = 'mlc'
  } else if (hasTransformers) {
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
    recommended,
  }
}

/**
 * Engines that can actually start, in fallback order:
 * MLC (adapter required) → Transformers.js → llama.cpp WASM → API.
 */
export function listViableEngines(
  modelConfig: UnifiedModelConfig,
  capabilities: EngineCapabilities,
): ConcreteEngine[] {
  const support = getModelEngineSupport(modelConfig, capabilities)
  const order: ConcreteEngine[] = []
  if (support.mlc && capabilities.webgpu) order.push('mlc')
  if (support.transformers) order.push('transformers')
  if (support.llamacpp) order.push('llamacpp')
  if (support.api) order.push('api')
  return order
}

/**
 * Ordered fallback engines. Includes llama.cpp unless the caller excludes it
 * (the wllama-mismatch path excludes the engine that just failed).
 */
export function getEngineFallbackOrder(
  modelConfig: UnifiedModelConfig,
  capabilities: EngineCapabilities,
  exclude: ConcreteEngine[] = [],
): ConcreteEngine[] {
  return listViableEngines(modelConfig, capabilities).filter((engine) => !exclude.includes(engine))
}

export interface EnginePlan {
  engine: ConcreteEngine
  /** Console line naming the engine and why it was chosen. */
  announcement: string
  /** Short progress-UI status. */
  statusText: string
  transformersDevice?: TransformersDevice
}

function describePlan(
  engine: ConcreteEngine,
  capabilities: EngineCapabilities,
  auto: boolean,
  configuredDevice?: TransformersDevice,
): EnginePlan {
  const prefix = auto ? 'Auto-selected' : 'Selected'
  const noAdapter = !capabilities.webgpu
  const because = noAdapter ? 'No WebGPU adapter — ' : ''

  switch (engine) {
    case 'mlc':
      return {
        engine,
        announcement: `[EngineFactory] ${prefix} MLC (WebGPU)`,
        statusText: `${prefix} MLC (WebGPU)`,
      }
    case 'transformers': {
      const transformersDevice = resolveTransformersDevice(configuredDevice, undefined, capabilities.webgpu)
      const runtime = transformersDevice === 'wasm' ? 'WASM' : transformersDevice === 'cpu' ? 'CPU' : 'WebGPU'
      return {
        engine,
        transformersDevice,
        announcement: `[EngineFactory] ${because}${prefix} Transformers.js (device: ${transformersDevice})`,
        statusText: `${because}${prefix} Transformers.js (${runtime})`,
      }
    }
    case 'llamacpp':
      return {
        engine,
        announcement: `[EngineFactory] ${because}${prefix} llama.cpp (WASM/CPU)`,
        statusText: `${because}${prefix} llama.cpp (WASM/CPU)`,
      }
    case 'api':
      return {
        engine,
        announcement: `[EngineFactory] ${because}${prefix} API`,
        statusText: `${because}${prefix} API`,
      }
  }
}

function modelDeclaresEngine(
  support: ModelEngineSupport,
  engine: ConcreteEngine,
): boolean {
  switch (engine) {
    case 'mlc':
      return support.mlc
    case 'llamacpp':
      return support.llamacpp
    case 'transformers':
      return support.transformers
    case 'api':
      return support.api
  }
}

/**
 * Decide which concrete engine to construct.
 * Explicit MLC with no adapter throws `EngineStartError` instead of warning
 * and continuing. Auto skips MLC and walks Transformers.js (WASM) → llama.cpp → API.
 */
export function planEngineSelection(
  modelConfig: UnifiedModelConfig,
  preference: EngineType,
  capabilities: EngineCapabilities,
  allowAutoFallback = true,
): EnginePlan {
  const support = getModelEngineSupport(modelConfig, capabilities)
  const viable = listViableEngines(modelConfig, capabilities)

  if (preference !== 'auto') {
    const explicit = preference
    if (!modelDeclaresEngine(support, explicit)) {
      console.warn(
        `[EngineFactory] Model ${modelConfig.id} does not support ${explicit}. Falling back to auto.`,
      )
      if (!allowAutoFallback) {
        throw new EngineStartError(
          `Model ${modelConfig.id} cannot start with ${explicit}. ${NO_WEBGPU_ADAPTER_MESSAGE}`,
        )
      }
      return planEngineSelection(modelConfig, 'auto', capabilities, false)
    }

    if (explicit === 'mlc' && !capabilities.webgpu) {
      console.error(`[EngineFactory] ${NO_WEBGPU_ADAPTER_MESSAGE}`)
      throw new EngineStartError(NO_WEBGPU_ADAPTER_MESSAGE)
    }

    return describePlan(explicit, capabilities, false, modelConfig.transformers?.device)
  }

  if (viable.length === 0) {
    console.error(`[EngineFactory] ${NO_WEBGPU_ADAPTER_MESSAGE}`)
    throw new EngineStartError(NO_WEBGPU_ADAPTER_MESSAGE)
  }

  return describePlan(viable[0], capabilities, true, modelConfig.transformers?.device)
}
