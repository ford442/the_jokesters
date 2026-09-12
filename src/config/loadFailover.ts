/**
 * Vicuna / MLC load-source failover (pure).
 *
 * Documented order:
 *   1. VPS primary (`storage.1ink.us`) — SW may stripe chunks with Contabo
 *   2. Contabo mirror (`storage.noahcohn.com`) — SW `fetchWithRetry` / striping
 *   3. HuggingFace Hub (`ford442/vicuna-7b-q4f32-webllm`) — one automatic retry
 *   4. Optional OpenAI-compatible API — comedy-only remote path; not a Vicuna weight host
 *
 * Contabo is not a ModelSession source: the service worker already failovers /
 * stripes there. This module decides when to leave VPS *weights* for HF Hub.
 *
 * Option A (HF Hub public CDN) is the automatic recovery path.
 * Option B (HF repo completeness) is a checklist + tokenizer overrides, not a
 * second code path. Option C (paid HF Endpoint) is not wired — use the existing
 * API engine if comedy-only remote is enough. Option D (per-shard mix) is
 * rejected: Cache API keys would fragment.
 */

import { VPS_STORAGE_URL } from '../utils/vpsStorageUrl'
import type { ErrorCategory } from '../types/chat'

export type LoadSource = 'vps' | 'hf' | 'api'
export type LoadPhase =
  | 'start'
  | 'wasm_probe'
  | 'engine'
  | 'hf_retry'
  | 'vps_retry'
  | 'success'
  | 'fail'

/** Human-facing chain (Contabo is SW-level). */
export const LOAD_FAILOVER_ORDER = ['vps', 'contabo', 'hf', 'api'] as const

export const HF_VICUNA_REPO = 'ford442/vicuna-7b-q4f32-webllm'
export const HF_VICUNA_MODEL_ID = HF_VICUNA_REPO
export const HF_VICUNA_MODEL_URL = `https://huggingface.co/${HF_VICUNA_REPO}`
/** Pin when a known-good commit is verified; `main` until then. */
export const HF_VICUNA_REVISION = 'main'

export const MLC_GITHUB_WASM_PREFIX =
  'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80'

export const MLC_LLAMA2_7B_CTX4K_WASM =
  `${MLC_GITHUB_WASM_PREFIX}/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`

export const VPS_LLAMA2_7B_CTX4K_WASM =
  `${VPS_STORAGE_URL}/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`

export const LAST_LOAD_SOURCE_KEY = 'jokesters-last-load-source'
export const LAST_OOM_MODEL_KEY = 'jokesters-last-oom-model'
export const FORCE_HF_SESSION_KEY = 'jokesters-force-hf'

export const WASM_FALLBACK_VRAM_WARNING =
  'Custom low-context WASM was missing. Using the generic 4K MLC library — peak VRAM may be ~4 GB.'

export const VICUNA_VPS_MODEL_IDS = [
  'vicuna-7b-q4f32-webllm-vps',
  'vicuna-7b-q4f32-webllm-ultra-low',
  'vicuna-7b-q4f32-webllm-ctx512',
  'vicuna-7b-q4f32-webllm-ctx1024',
] as const

export interface LastLoadSource {
  modelId: string
  source: LoadSource
  wasmFallback: boolean
  savedAt: string
}

export interface LoadTelemetry {
  modelId: string
  source: LoadSource
  phase: LoadPhase
  ms: number
  errorCategory?: ErrorCategory
}

export type WeightFailoverAction = 'retry_hf' | 'retry_vps' | 'none'

export function isVicunaVpsModelId(modelId: string): boolean {
  return (VICUNA_VPS_MODEL_IDS as readonly string[]).includes(modelId)
}

export function isVicunaHfModelId(modelId: string): boolean {
  return modelId === HF_VICUNA_MODEL_ID
}

export function isVicunaFamilyModelId(modelId: string): boolean {
  return isVicunaVpsModelId(modelId) || isVicunaHfModelId(modelId)
}

export function inferLoadSourceFromUrl(url: string): LoadSource {
  if (url.includes('huggingface.co') || url.includes('hf.co')) return 'hf'
  return 'vps'
}

/**
 * Even chunks / odd mirror stay in the SW. This is the *weight-host* decision
 * after VPS+Contabo have already failed (or last success was HF).
 */
export function decideWeightFailover(input: {
  modelId: string
  currentSource: LoadSource
  category: ErrorCategory
  tried: readonly LoadSource[]
}): WeightFailoverAction {
  const { modelId, currentSource, category, tried } = input
  if (category === 'oom' || category === 'webgpu' || category === 'llamacpp_mismatch') {
    return 'none'
  }
  const recoverable =
    category === 'network' || category === 'config' || category === 'wasm_missing'
  if (!recoverable || !isVicunaFamilyModelId(modelId)) return 'none'

  if (currentSource === 'vps' && !tried.includes('hf')) return 'retry_hf'
  if (currentSource === 'hf' && !tried.includes('vps')) return 'retry_vps'
  return 'none'
}

export function wasmLibFallbackChain(modelLib: string): string[] {
  const chain: string[] = []
  const push = (url: string) => {
    if (url && url !== modelLib && !chain.includes(url)) chain.push(url)
  }

  const isCustomVicuna = /vicuna-7b-q4f32_1-ctx(512|1024)_/.test(modelLib)
  if (isCustomVicuna) {
    push(VPS_LLAMA2_7B_CTX4K_WASM)
    push(MLC_LLAMA2_7B_CTX4K_WASM)
    return chain
  }

  const fileName = modelLib.split('/').pop() ?? ''
  if (fileName.endsWith('.wasm') && modelLib.includes('/wasm-libs/')) {
    push(`${MLC_GITHUB_WASM_PREFIX}/${fileName}`)
  }
  return chain
}

export interface HfFailoverConfig {
  model_id: string
  model: string
  model_lib: string
  hf_fallback_url?: string
  requestedModelId?: string
  loadSource?: LoadSource
  skipSourceFailover?: boolean
  overrides?: Record<string, unknown>
}

export function applyHfWeightFailover<T extends HfFailoverConfig>(config: T): T {
  return {
    ...config,
    requestedModelId: config.requestedModelId ?? config.model_id,
    model_id: HF_VICUNA_MODEL_ID,
    model: HF_VICUNA_MODEL_URL,
    model_lib: MLC_LLAMA2_7B_CTX4K_WASM,
    hf_fallback_url: undefined,
    loadSource: 'hf',
    skipSourceFailover: true,
    overrides: {
      ...config.overrides,
      tokenizer_files: ['tokenizer.model', 'tokenizer_config.json'],
    },
  }
}

export function applyVpsWeightRestore<T extends HfFailoverConfig>(
  config: T,
  original: Pick<T, 'model_id' | 'model' | 'model_lib' | 'overrides'>,
): T {
  return {
    ...config,
    ...original,
    requestedModelId: config.requestedModelId ?? original.model_id,
    loadSource: 'vps',
    skipSourceFailover: true,
    hf_fallback_url: undefined,
  }
}

export function preferredStartSource(
  modelId: string,
  last: LastLoadSource | null,
  opts?: { forceHf?: boolean },
): LoadSource {
  if (!isVicunaFamilyModelId(modelId)) return 'vps'
  if (opts?.forceHf) return 'hf'
  if (!last) return 'vps'
  if (!isVicunaFamilyModelId(last.modelId) && last.modelId !== modelId) return 'vps'
  return last.source === 'hf' ? 'hf' : 'vps'
}

export function queueForceHfSource(): void {
  try {
    sessionStorage.setItem(FORCE_HF_SESSION_KEY, '1')
  } catch {
    /* ignore quota */
  }
}

export function consumeForceHfSource(): boolean {
  try {
    const v = sessionStorage.getItem(FORCE_HF_SESSION_KEY)
    if (v) sessionStorage.removeItem(FORCE_HF_SESSION_KEY)
    return v === '1' || v === 'on' || v === 'true'
  } catch {
    return false
  }
}

export function parseLastLoadSource(raw: string | null): LastLoadSource | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as LastLoadSource
    if (!data || typeof data.modelId !== 'string') return null
    if (data.source !== 'vps' && data.source !== 'hf' && data.source !== 'api') return null
    return data
  } catch {
    return null
  }
}

export function shouldAvoidVicunaRecommendation(lastOomModelId: string | null): boolean {
  if (!lastOomModelId) return false
  return isVicunaFamilyModelId(lastOomModelId) || lastOomModelId.toLowerCase().includes('vicuna')
}

export function formatLoadTelemetry(event: LoadTelemetry): string {
  return JSON.stringify(event)
}

export function logLoadEvent(event: LoadTelemetry): LoadTelemetry {
  console.info('[LoadFailover]', formatLoadTelemetry(event))
  return event
}

let wasmFallbackWarning: string | null = null

export function setWasmFallbackWarning(message: string): void {
  wasmFallbackWarning = message
}

export function consumeWasmFallbackWarning(): string | null {
  const msg = wasmFallbackWarning
  wasmFallbackWarning = null
  return msg
}

let lastLoadTelemetry: LoadTelemetry | null = null

export function recordLoadTelemetry(event: LoadTelemetry): void {
  lastLoadTelemetry = event
  logLoadEvent(event)
}

export function consumeLastLoadTelemetry(): LoadTelemetry | null {
  const event = lastLoadTelemetry
  lastLoadTelemetry = null
  return event
}
