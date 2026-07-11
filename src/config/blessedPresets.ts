/**
 * Curated "blessed" model presets for guided onboarding.
 * Keep this list short (3–5) — do not dump the full registry into the launch UI.
 */

import type { EngineType } from '../llm/EngineFactory'

export type BlessedTier = 'quality' | 'balanced' | 'safe' | 'ultra' | 'cpu'

export interface BlessedPreset {
  /** Model id registered in appConfig / UNIFIED_MODELS */
  id: string
  /** Short label for buttons */
  shortName: string
  /** Dropdown label */
  label: string
  /** Preferred engine for this preset */
  engine: EngineType
  /** Engines that can run it (for filtering) */
  engines: EngineType[]
  /** Approx VRAM needed (MB) */
  vramMB: number
  /** Approx download size for first load (MB) — shown before Load */
  downloadMB: number
  needsF16: boolean
  needsWebGPU: boolean
  tier: BlessedTier
  /** One-line plain-language blurb */
  blurb: string
}

/**
 * Five blessed presets — primary recommendation ladder + CPU escape hatch.
 */
export const BLESSED_PRESETS: readonly BlessedPreset[] = [
  {
    id: 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC',
    shortName: 'Hermes-3 3B (fast)',
    label: 'Hermes-3 3B · MLC · ~2 GB · needs f16 ★ Fast',
    engine: 'mlc',
    engines: ['mlc', 'auto'],
    vramMB: 2000,
    downloadMB: 1800,
    needsF16: true,
    needsWebGPU: true,
    tier: 'balanced',
    blurb: 'Best speed on modern GPUs with shader-f16. Great default when VRAM is modest.',
  },
  {
    id: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
    shortName: 'Hermes-3 3B (safe)',
    label: 'Hermes-3 3B q4f32 · MLC · ~2 GB · no f16 needed ★ Safe',
    engine: 'mlc',
    engines: ['mlc', 'auto'],
    vramMB: 2200,
    downloadMB: 1900,
    needsF16: false,
    needsWebGPU: true,
    tier: 'safe',
    blurb: 'Universal WebGPU fallback — works without f16. Reliable on integrated / older GPUs.',
  },
  {
    id: 'vicuna-7b-q4f32-webllm-vps',
    shortName: 'Vicuna 7B',
    label: 'Vicuna 7B q4f32 · MLC · ~4 GB · richer replies',
    engine: 'mlc',
    engines: ['mlc', 'auto'],
    vramMB: 4000,
    downloadMB: 3800,
    needsF16: false,
    needsWebGPU: true,
    tier: 'quality',
    blurb: 'Higher quality multi-agent banter when you have ~4+ GB free VRAM.',
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-ONNX',
    shortName: 'Qwen 0.5B (ultra-low)',
    label: 'Qwen 2.5 0.5B · Transformers.js · ~1.5 GB · ultra-low',
    engine: 'transformers',
    engines: ['transformers', 'auto'],
    vramMB: 1500,
    downloadMB: 600,
    needsF16: false,
    needsWebGPU: true,
    tier: 'ultra',
    blurb: 'Smallest WebGPU option when larger models OOM. Quality is limited — use to get on stage.',
  },
  {
    id: 'vicuna-7b-v1.5-GGUF',
    shortName: 'Vicuna GGUF (CPU)',
    label: 'Vicuna 7B · llama.cpp WASM · ~4 GB RAM · no WebGPU',
    engine: 'llamacpp',
    engines: ['llamacpp', 'auto'],
    vramMB: 0,
    downloadMB: 3800,
    needsF16: false,
    needsWebGPU: false,
    tier: 'cpu',
    blurb: 'Runs on CPU via WASM when WebGPU is missing or broken. Slow but works.',
  },
] as const

export function getBlessedPreset(id: string): BlessedPreset | undefined {
  return BLESSED_PRESETS.find((p) => p.id === id)
}

export function formatDownloadSize(mb: number): string {
  if (mb >= 1000) return `~${(mb / 1000).toFixed(1)} GB`
  return `~${mb} MB`
}
