import { describe, it, expect } from 'vitest'
import {
  recommendModels,
  getSmallerFallbackFor,
  type DeviceCapabilitySnapshot,
} from '../../src/app/modelGuide'
import { BLESSED_PRESETS } from '../../src/config/blessedPresets'
import { getUnifiedModelById } from '../../src/config/models'

function device(partial: Partial<DeviceCapabilitySnapshot>): DeviceCapabilitySnapshot {
  const webgpu = partial.webgpu ?? true
  return {
    webgpu,
    webgpuStatus: partial.webgpuStatus ?? (webgpu ? 'ready' : 'unavailable'),
    wasm: true,
    simd: true,
    threads: false,
    supportsF16: false,
    maxBufferSize: 2 ** 31,
    availableVramMB: 4096,
    summary: 'test',
    ...partial,
  }
}

describe('recommendModels', () => {
  it('recommends CPU GGUF when WebGPU is missing', () => {
    const r = recommendModels(device({ webgpu: false, availableVramMB: 0 }))
    expect(r.primary.tier).toBe('cpu')
    expect(r.enginePreference).toBe('llamacpp')
    expect(r.primaryReason.toLowerCase()).toMatch(/no webgpu/)
  })

  it('recommends CPU GGUF when the API exists but no adapter does', () => {
    const r = recommendModels(device({ webgpu: false, webgpuStatus: 'no-adapter', availableVramMB: 0 }))
    expect(r.primary.tier).toBe('cpu')
    expect(r.enginePreference).toBe('llamacpp')
    expect(r.primaryReason.toLowerCase()).toMatch(/no gpu adapter/)
  })

  it('recommends Hermes instead of Vicuna after a prior Vicuna OOM', () => {
    const r = recommendModels(device({ availableVramMB: 5000, supportsF16: true }), {
      avoidVicuna: true,
    })
    expect(r.primary.id).not.toContain('vicuna-7b-q4f32-webllm-vps')
    expect(r.primaryReason.toLowerCase()).toMatch(/gpu memory|oom/)
  })

  it('recommends Vicuna 7B on high VRAM', () => {
    const r = recommendModels(device({ availableVramMB: 5000, supportsF16: true }))
    expect(r.primary.id).toContain('vicuna-7b-q4f32')
    expect(r.safeFallback.id).not.toBe(r.primary.id)
  })

  it('recommends Hermes f16 when f16 + mid VRAM', () => {
    const r = recommendModels(device({ availableVramMB: 2500, supportsF16: true }))
    expect(r.primary.needsF16).toBe(true)
    expect(r.primary.id).toContain('Hermes-3')
  })

  it('recommends Hermes f32 without f16', () => {
    const r = recommendModels(device({ availableVramMB: 2500, supportsF16: false }))
    expect(r.primary.needsF16).toBe(false)
    expect(r.primary.id).toContain('q4f32')
  })

  it('recommends ultra-low on very small VRAM', () => {
    const r = recommendModels(device({ availableVramMB: 1200, supportsF16: false }))
    expect(r.primary.tier).toBe('ultra')
  })

  it('always returns two distinct blessed presets with reasons', () => {
    const r = recommendModels(device({}))
    expect(BLESSED_PRESETS.some((p) => p.id === r.primary.id)).toBe(true)
    expect(BLESSED_PRESETS.some((p) => p.id === r.safeFallback.id)).toBe(true)
    expect(r.primaryReason.length).toBeGreaterThan(20)
    expect(r.fallbackReason.length).toBeGreaterThan(10)
  })
})

describe('getSmallerFallbackFor', () => {
  it('steps down from quality to safe 3B', () => {
    const next = getSmallerFallbackFor('vicuna-7b-q4f32-webllm-vps')
    expect(next.vramMB).toBeLessThan(4000)
  })

  it('steps down from safe to ultra', () => {
    const next = getSmallerFallbackFor('Hermes-3-Llama-3.2-3B-q4f32_1-MLC')
    expect(next.tier).toBe('ultra')
  })

  it('steps down from ultra to cpu', () => {
    const next = getSmallerFallbackFor('Qwen2.5-0.5B-Instruct-ONNX')
    expect(next.tier).toBe('cpu')
  })
})

describe('recommendModels after a ctx4k Vicuna OOM', () => {
  it('starts on the ctx1024 lib instead of skipping Vicuna', () => {
    const r = recommendModels(device({ availableVramMB: 4096 }), {
      avoidVicuna: false,
      lastOomModelId: 'vicuna-7b-q4f32-webllm-vps',
    })
    expect(r.primary.id).toBe('vicuna-7b-q4f32-webllm-ctx1024')
  })
})

describe('BLESSED_PRESETS', () => {
  it('offers Kimi-VL as a selectable vision preset without making it a recommendation', () => {
    const kimi = BLESSED_PRESETS.find((p) => p.id === 'Kimi-VL-A3B-Thinking-2506-GGUF')
    expect(kimi?.tier).toBe('vision')
    expect(kimi?.engine).toBe('llamacpp')
    expect(getUnifiedModelById(kimi!.id)?.llamaCpp?.mmprojUrl).toBeDefined()
    const devices = [
      { webgpu: false, availableVramMB: 0 },
      { webgpu: true, availableVramMB: 16000, supportsF16: true },
      { webgpu: true, availableVramMB: 8000, supportsF16: false },
    ]
    for (const d of devices) {
      const r = recommendModels(device(d))
      expect(r.primary.id).not.toBe(kimi!.id)
      expect(r.safeFallback.id).not.toBe(kimi!.id)
    }
  })

  it('falls back from a failed Kimi-VL load to the safe Hermes preset', () => {
    expect(getSmallerFallbackFor('Kimi-VL-A3B-Thinking-2506-GGUF').id).toBe('Hermes-3-Llama-3.2-3B-q4f32_1-MLC')
  })

  it('curates 3–8 presets only', () => {
    expect(BLESSED_PRESETS.length).toBeGreaterThanOrEqual(3)
    expect(BLESSED_PRESETS.length).toBeLessThanOrEqual(8)
  })
})
