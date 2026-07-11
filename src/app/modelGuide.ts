/**
 * Guided model onboarding: capability probe, recommendations, last-success persistence.
 */

import { detectCapabilities, detectWebGPULimits, type EngineType } from '../llm/EngineFactory'
import { estimateAvailableVRAM } from '../utils/dynamicContext'
import type { VRAMOptimizationConfig } from '../utils/dynamicContext'
import {
  BLESSED_PRESETS,
  formatDownloadSize,
  getBlessedPreset,
  type BlessedPreset,
} from '../config/blessedPresets'
import type { LaunchConfig } from './types'

export const LAST_SUCCESS_KEY = 'jokesters-last-success-launch'
export const OOM_FALLBACK_KEY = 'jokesters-oom-fallback-model'
export const FORCE_ENGINE_KEY = 'jokesters-force-engine'

export interface DeviceCapabilitySnapshot {
  webgpu: boolean
  wasm: boolean
  simd: boolean
  threads: boolean
  supportsF16: boolean
  maxBufferSize: number
  /** Estimated free VRAM for models (MB), after overhead */
  availableVramMB: number
  /** Plain-language GPU summary for UI */
  summary: string
}

export interface ModelRecommendation {
  primary: BlessedPreset
  safeFallback: BlessedPreset
  primaryReason: string
  fallbackReason: string
  device: DeviceCapabilitySnapshot
  /** Suggested engine preference for the primary pick */
  enginePreference: EngineType
}

export interface PersistedLaunchSuccess {
  selectedModelId: string
  preferredContext: number | 'auto'
  vramConfig: VRAMOptimizationConfig
  chosenMaxTokens: number
  enginePreference: EngineType
  savedAt: string
}

/** Probe device once for guided picker (async WebGPU limits + VRAM estimate). */
export async function probeDeviceCapabilities(): Promise<DeviceCapabilitySnapshot> {
  const caps = detectCapabilities()
  let supportsF16 = false
  let maxBufferSize = 0
  let availableVramMB = 2048

  if (caps.webgpu) {
    try {
      const limits = await detectWebGPULimits()
      supportsF16 = limits.supportsF16
      maxBufferSize = limits.maxBufferSize
    } catch {
      /* keep defaults */
    }
    try {
      availableVramMB = await estimateAvailableVRAM()
    } catch {
      availableVramMB = 2048
    }
  } else {
    availableVramMB = 0
  }

  const parts: string[] = []
  if (!caps.webgpu) {
    parts.push('No WebGPU — CPU fallback recommended')
  } else {
    parts.push(`~${Math.round(availableVramMB)} MB VRAM free (est.)`)
    parts.push(supportsF16 ? 'shader-f16 yes' : 'no shader-f16')
    if (maxBufferSize > 0 && maxBufferSize < 268_435_456) {
      parts.push('small GPU buffers')
    }
  }

  return {
    webgpu: caps.webgpu,
    wasm: caps.wasm,
    simd: caps.simd,
    threads: caps.threads,
    supportsF16,
    maxBufferSize,
    availableVramMB,
    summary: parts.join(' · '),
  }
}

/**
 * Pick 1 primary + 1 safe fallback from blessed presets with plain-language reasons.
 * Pure decision given a device snapshot (easy to unit test).
 */
export function recommendModels(device: DeviceCapabilitySnapshot): ModelRecommendation {
  const byId = (id: string) => BLESSED_PRESETS.find((p) => p.id === id)!

  const hermesF16 = byId('Hermes-3-Llama-3.2-3B-q4f16_1-MLC')
  const hermesF32 = byId('Hermes-3-Llama-3.2-3B-q4f32_1-MLC')
  const vicuna7 = byId('vicuna-7b-q4f32-webllm-vps')
  const qwenUltra = byId('Qwen2.5-0.5B-Instruct-ONNX')
  const cpuGguf = byId('vicuna-7b-v1.5-GGUF')

  // No WebGPU → CPU path
  if (!device.webgpu) {
    return {
      primary: cpuGguf,
      safeFallback: qwenUltra,
      primaryReason:
        'This browser has no WebGPU. Vicuna via llama.cpp (CPU) will still run the show — slower, but works.',
      fallbackReason:
        'If you enable WebGPU later, Qwen 0.5B is a tiny GPU option for tight memory.',
      device,
      enginePreference: 'llamacpp',
    }
  }

  // Tiny GPU buffers → cannot hold large weight tensors
  if (device.maxBufferSize > 0 && device.maxBufferSize < 268_435_456) {
    return {
      primary: hermesF32,
      safeFallback: qwenUltra,
      primaryReason:
        'Your GPU only allows small buffers. Hermes-3 3B (q4f32) is the safest full WebGPU model.',
      fallbackReason:
        'If 3B still fails, try Qwen 0.5B (ultra-low) — smallest download and VRAM footprint.',
      device,
      enginePreference: 'mlc',
    }
  }

  const vram = device.availableVramMB

  // Ultra-low VRAM
  if (vram > 0 && vram < 1800) {
    return {
      primary: qwenUltra,
      safeFallback: cpuGguf,
      primaryReason: `Only ~${Math.round(vram)} MB VRAM estimated — Qwen 0.5B is the ultra-low path so load is more likely to succeed.`,
      fallbackReason: 'CPU llama.cpp avoids GPU memory entirely if WebGPU still OOMs.',
      device,
      enginePreference: 'transformers',
    }
  }

  // Comfortable VRAM for 7B
  if (vram >= 3800) {
    return {
      primary: vicuna7,
      safeFallback: device.supportsF16 ? hermesF16 : hermesF32,
      primaryReason: `~${Math.round(vram)} MB free looks enough for Vicuna 7B — richer multi-agent comedy.`,
      fallbackReason: device.supportsF16
        ? 'Hermes-3 3B (f16) is a faster, lighter fallback if 7B OOMs mid-load.'
        : 'Hermes-3 3B (q4f32) is a reliable lighter fallback without needing f16.',
      device,
      enginePreference: 'mlc',
    }
  }

  // Mid band: 3B primary
  if (device.supportsF16 && vram >= 2000) {
    return {
      primary: hermesF16,
      safeFallback: hermesF32,
      primaryReason: `GPU has shader-f16 and ~${Math.round(vram)} MB free — Hermes-3 3B (f16) is the sweet spot for speed.`,
      fallbackReason: 'Hermes-3 3B q4f32 works if f16 path fails or memory is tighter than estimated.',
      device,
      enginePreference: 'mlc',
    }
  }

  // Default safe: f32 3B
  return {
    primary: hermesF32,
    safeFallback: qwenUltra,
    primaryReason: device.supportsF16
      ? `~${Math.round(vram)} MB VRAM — Hermes-3 3B q4f32 is the safe WebGPU default.`
      : `No shader-f16 (or limited VRAM ~${Math.round(vram)} MB) — Hermes-3 3B q4f32 is the universal pick.`,
    fallbackReason: 'Qwen 0.5B is the ultra-low escape hatch if 3B runs out of GPU memory.',
    device,
    enginePreference: 'mlc',
  }
}

export function saveSuccessfulLaunch(config: LaunchConfig): void {
  const payload: PersistedLaunchSuccess = {
    selectedModelId: config.selectedModelId,
    preferredContext: config.preferredContext,
    vramConfig: config.vramConfig,
    chosenMaxTokens: config.chosenMaxTokens,
    enginePreference: config.enginePreference,
    savedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(LAST_SUCCESS_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn('[modelGuide] Could not persist last success:', e)
  }
}

export function loadLastSuccessfulLaunch(): PersistedLaunchSuccess | null {
  try {
    const raw = localStorage.getItem(LAST_SUCCESS_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedLaunchSuccess
    if (!data || typeof data.selectedModelId !== 'string') return null
    return data
  } catch {
    return null
  }
}

/** Queue a smaller model for the next initApp() after OOM. */
export function queueOomFallback(modelId: string, engine?: EngineType): void {
  try {
    sessionStorage.setItem(OOM_FALLBACK_KEY, modelId)
    if (engine) sessionStorage.setItem(FORCE_ENGINE_KEY, engine)
  } catch { /* ignore */ }
}

export function consumeOomFallback(): { modelId: string; engine?: EngineType } | null {
  try {
    const modelId = sessionStorage.getItem(OOM_FALLBACK_KEY)
    if (!modelId) return null
    sessionStorage.removeItem(OOM_FALLBACK_KEY)
    const engine = sessionStorage.getItem(FORCE_ENGINE_KEY) as EngineType | null
    sessionStorage.removeItem(FORCE_ENGINE_KEY)
    return { modelId, engine: engine || undefined }
  } catch {
    return null
  }
}

/** Smaller model for OOM recovery given what failed. */
export function getSmallerFallbackFor(failedModelId: string): BlessedPreset {
  const failed = getBlessedPreset(failedModelId)
  if (!failed) {
    return BLESSED_PRESETS.find((p) => p.tier === 'safe')!
  }
  if (failed.tier === 'quality' || failed.vramMB >= 3500) {
    return BLESSED_PRESETS.find((p) => p.id === 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC')!
  }
  if (failed.tier === 'balanced' || failed.tier === 'safe') {
    return BLESSED_PRESETS.find((p) => p.tier === 'ultra')!
  }
  if (failed.tier === 'ultra') {
    return BLESSED_PRESETS.find((p) => p.tier === 'cpu')!
  }
  return BLESSED_PRESETS.find((p) => p.tier === 'safe')!
}

export function downloadBlurb(preset: BlessedPreset): string {
  return `What gets downloaded? ${formatDownloadSize(preset.downloadMB)} model weights (cached in this browser after the first load). ~${Math.round(preset.vramMB / 1024 * 10) / 10 || '<1'} GB VRAM at runtime.`
}

export { formatDownloadSize, getBlessedPreset, BLESSED_PRESETS }
