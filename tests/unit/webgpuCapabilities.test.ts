import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  detectCapabilities,
  detectCapabilitiesWithAdapter,
  formatWebGPUCapabilityLabel,
  resetWebGPUDetectionCache,
  resolveEngineChoice,
  type EngineCapabilities,
  type WebGPUStatus,
} from '../../src/llm/EngineFactory'
import type { UnifiedModelConfig } from '../../src/llm/LLMEngine'

function caps(partial: Partial<EngineCapabilities> & { webgpuStatus: WebGPUStatus }): EngineCapabilities {
  return {
    webgpu: partial.webgpuStatus === 'ready',
    webgpuApi: partial.webgpuStatus !== 'unavailable',
    wasm: true,
    simd: true,
    threads: false,
    shaderF16: false,
    ...partial,
  }
}

function model(partial: Partial<UnifiedModelConfig>): UnifiedModelConfig {
  return {
    id: 'test-model',
    name: 'Test',
    vram_required_MB: 1000,
    context_window_size: 2048,
    ...partial,
  }
}

const mlcAndLlama = model({
  mlc: { model_url: 'm', model_lib_url: 'l' },
  llamaCpp: { gguf_url: 'g', context_size: 2048 },
  transformers: { model_id: 'org/model', device: 'webgpu', dtype: 'q4f16' },
})

describe('formatWebGPUCapabilityLabel', () => {
  it('names the three adapter states', () => {
    expect(formatWebGPUCapabilityLabel('ready')).toBe('✅ WebGPU (adapter OK)')
    expect(formatWebGPUCapabilityLabel('no-adapter')).toBe('⚠️ WebGPU API present, no adapter')
    expect(formatWebGPUCapabilityLabel('unavailable')).toBe('❌ no WebGPU')
  })
})

describe('detectCapabilitiesWithAdapter', () => {
  beforeEach(() => {
    resetWebGPUDetectionCache()
  })

  afterEach(() => {
    resetWebGPUDetectionCache()
    vi.unstubAllGlobals()
  })

  it('reports no WebGPU when navigator.gpu is missing', async () => {
    vi.stubGlobal('navigator', {})
    const sync = detectCapabilities()
    expect(sync.webgpu).toBe(false)
    expect(sync.webgpuApi).toBe(false)
    expect(sync.webgpuStatus).toBe('unavailable')

    const probed = await detectCapabilitiesWithAdapter()
    expect(probed.webgpu).toBe(false)
    expect(probed.webgpuStatus).toBe('unavailable')
  })

  it('reports API-present with no adapter when requestAdapter returns null', async () => {
    vi.stubGlobal('navigator', {
      gpu: { requestAdapter: vi.fn(async () => null) },
    })
    const sync = detectCapabilities()
    expect(sync.webgpuApi).toBe(true)
    expect(sync.webgpu).toBe(false)
    expect(sync.webgpuStatus).toBe('unknown')

    const probed = await detectCapabilitiesWithAdapter()
    expect(probed.webgpu).toBe(false)
    expect(probed.webgpuStatus).toBe('no-adapter')
    expect(probed.shaderF16).toBe(false)
  })

  it('reports adapter OK when requestAdapter returns an adapter', async () => {
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn(async () => ({
          limits: { maxBufferSize: 1_000_000 },
          features: { has: (name: string) => name === 'shader-f16' },
        })),
      },
    })
    const probed = await detectCapabilitiesWithAdapter()
    expect(probed.webgpu).toBe(true)
    expect(probed.webgpuStatus).toBe('ready')
    expect(probed.shaderF16).toBe(true)
  })
})

describe('resolveEngineChoice', () => {
  it('auto-selects llama.cpp when the API exists but no adapter does', () => {
    const choice = resolveEngineChoice(mlcAndLlama, 'auto', caps({ webgpuStatus: 'no-adapter' }))
    expect(choice).toBe('llamacpp')
  })

  it('auto-selects llama.cpp when WebGPU is missing entirely', () => {
    const choice = resolveEngineChoice(mlcAndLlama, 'auto', caps({ webgpuStatus: 'unavailable' }))
    expect(choice).toBe('llamacpp')
  })

  it('auto-selects MLC when an adapter is available', () => {
    const choice = resolveEngineChoice(mlcAndLlama, 'auto', caps({ webgpuStatus: 'ready' }))
    expect(choice).toBe('mlc')
  })

  it('does not auto-select a WebGPU Transformers model without an adapter', () => {
    const onnx = model({
      transformers: { model_id: 'org/model', device: 'webgpu', dtype: 'q4f16' },
      llamaCpp: { gguf_url: 'g', context_size: 2048 },
    })
    expect(resolveEngineChoice(onnx, 'auto', caps({ webgpuStatus: 'no-adapter' }))).toBe('llamacpp')
    expect(resolveEngineChoice(onnx, 'auto', caps({ webgpuStatus: 'ready' }))).toBe('transformers')
  })

  it('still honors an explicit MLC preference when the user overrides Auto', () => {
    expect(resolveEngineChoice(mlcAndLlama, 'mlc', caps({ webgpuStatus: 'no-adapter' }))).toBe('mlc')
  })
})
