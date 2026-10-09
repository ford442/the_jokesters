import { describe, expect, it, vi } from 'vitest'
import {
  CPU_WASM_SWITCH,
  EngineStartError,
  NO_WEBGPU_ADAPTER_MESSAGE,
  getEngineFallbackOrder,
  listViableEngines,
  planEngineSelection,
  resolveTransformersDevice,
  type EngineCapabilities,
} from '../../src/llm/engineSelection'
import type { UnifiedModelConfig } from '../../src/llm/LLMEngine'

function caps(webgpu: boolean): EngineCapabilities {
  return { webgpu, wasm: true, simd: true, threads: false, shaderF16: false }
}

const mlcOnly: UnifiedModelConfig = {
  id: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
  name: 'Hermes',
  vram_required_MB: 2500,
  context_window_size: 4096,
  mlc: { model_url: 'https://example.test/hermes/', model_lib_url: 'https://example.test/hermes.wasm' },
}

const qwen: UnifiedModelConfig = {
  id: 'Qwen2.5-0.5B-Instruct-ONNX',
  name: 'Qwen',
  vram_required_MB: 1500,
  context_window_size: 32768,
  transformers: {
    model_id: 'onnx-community/Qwen2.5-0.5B-Instruct',
    device: 'webgpu',
    dtype: 'q4f16',
  },
}

const gguf: UnifiedModelConfig = {
  id: 'vicuna-7b-v1.5-GGUF',
  name: 'Vicuna GGUF',
  vram_required_MB: 0,
  context_window_size: 4096,
  llamaCpp: { gguf_url: 'https://example.test/vicuna.gguf', context_size: 4096 },
}

const everyEngine: UnifiedModelConfig = {
  id: 'every-engine',
  name: 'Every engine',
  vram_required_MB: 1000,
  context_window_size: 2048,
  mlc: { model_url: 'm', model_lib_url: 'l' },
  transformers: { model_id: 'org/model', device: 'webgpu', dtype: 'q4' },
  llamaCpp: { gguf_url: 'https://example.test/m.gguf', context_size: 2048 },
  api: { endpoint: 'https://example.test/v1/chat/completions', model_id: 'remote' },
}

describe('planEngineSelection without a WebGPU adapter', () => {
  it('refuses explicit MLC and names the CPU switch target', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => planEngineSelection(mlcOnly, 'mlc', caps(false))).toThrow(EngineStartError)
    try {
      planEngineSelection(mlcOnly, 'mlc', caps(false))
    } catch (error) {
      expect(error).toBeInstanceOf(EngineStartError)
      expect((error as EngineStartError).message).toBe(NO_WEBGPU_ADAPTER_MESSAGE)
      expect((error as EngineStartError).category).toBe('webgpu')
      expect((error as EngineStartError).switchTo).toEqual(CPU_WASM_SWITCH)
    }
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('refuses Auto on an MLC-only model instead of constructing llama.cpp', () => {
    expect(() => planEngineSelection(mlcOnly, 'auto', caps(false))).toThrow(NO_WEBGPU_ADAPTER_MESSAGE)
  })

  it('Auto-selects Transformers.js WASM, then llama.cpp, then API', () => {
    const qwenPlan = planEngineSelection(qwen, 'auto', caps(false))
    expect(qwenPlan.engine).toBe('transformers')
    expect(qwenPlan.transformersDevice).toBe('wasm')
    expect(qwenPlan.announcement).toContain('No WebGPU adapter')
    expect(qwenPlan.announcement).toContain('device: wasm')
    expect(qwenPlan.announcement).toContain('Auto-selected')

    const order = listViableEngines(everyEngine, caps(false))
    expect(order).toEqual(['transformers', 'llamacpp', 'api'])
    const first = planEngineSelection(everyEngine, 'auto', caps(false))
    expect(first.engine).toBe('transformers')
    expect(first.transformersDevice).toBe('wasm')
  })

  it('keeps an explicit Transformers.js choice and forces device wasm', () => {
    const plan = planEngineSelection(qwen, 'transformers', caps(false))
    expect(plan.engine).toBe('transformers')
    expect(plan.transformersDevice).toBe('wasm')
    expect(plan.announcement).toContain('Selected Transformers.js (device: wasm)')
  })

  it('Auto-selects llama.cpp and says so when that is the first viable engine', () => {
    const plan = planEngineSelection(gguf, 'auto', caps(false))
    expect(plan.engine).toBe('llamacpp')
    expect(plan.announcement).toContain('No WebGPU adapter')
    expect(plan.announcement).toContain('llama.cpp (WASM/CPU)')
  })

  it('does not offer MLC in the fallback order', () => {
    expect(getEngineFallbackOrder(everyEngine, caps(false))).toEqual(['transformers', 'llamacpp', 'api'])
    expect(getEngineFallbackOrder(everyEngine, caps(false), ['transformers'])).toEqual(['llamacpp', 'api'])
  })
})

describe('planEngineSelection with an adapter', () => {
  it('Auto-selects MLC first', () => {
    const plan = planEngineSelection(everyEngine, 'auto', caps(true))
    expect(plan.engine).toBe('mlc')
    expect(plan.announcement).toContain('Auto-selected MLC')
    expect(listViableEngines(everyEngine, caps(true))).toEqual(['mlc', 'transformers', 'llamacpp', 'api'])
  })

  it('keeps Transformers.js on webgpu when the config asked for it', () => {
    const plan = planEngineSelection(qwen, 'transformers', caps(true))
    expect(plan.transformersDevice).toBe('webgpu')
  })
})

describe('resolveTransformersDevice', () => {
  it('downgrades a hardcoded webgpu device when the adapter is missing', () => {
    expect(resolveTransformersDevice('webgpu', undefined, false)).toBe('wasm')
    expect(resolveTransformersDevice(undefined, undefined, false)).toBe('wasm')
  })

  it('honors an explicit wasm override and a real adapter', () => {
    expect(resolveTransformersDevice('webgpu', 'wasm', false)).toBe('wasm')
    expect(resolveTransformersDevice('webgpu', undefined, true)).toBe('webgpu')
    expect(resolveTransformersDevice('cpu', undefined, false)).toBe('cpu')
  })
})
