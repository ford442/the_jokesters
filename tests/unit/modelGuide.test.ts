import { describe, it, expect } from 'vitest'
import {
  recommendModels,
  getSmallerFallbackFor,
  type DeviceCapabilitySnapshot,
} from '../../src/app/modelGuide'
import { BLESSED_PRESETS } from '../../src/config/blessedPresets'

function device(partial: Partial<DeviceCapabilitySnapshot>): DeviceCapabilitySnapshot {
  return {
    webgpu: true,
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
    expect(r.primaryReason.toLowerCase()).toMatch(/webgpu|cpu/)
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

describe('BLESSED_PRESETS', () => {
  it('curates 3–5 presets only', () => {
    expect(BLESSED_PRESETS.length).toBeGreaterThanOrEqual(3)
    expect(BLESSED_PRESETS.length).toBeLessThanOrEqual(5)
  })
})
