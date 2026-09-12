import { describe, expect, it } from 'vitest'
import { categorizeChatError } from '../../src/chat/chatErrors'
import {
  HF_VICUNA_MODEL_ID,
  HF_VICUNA_MODEL_URL,
  LOAD_FAILOVER_ORDER,
  MLC_LLAMA2_7B_CTX4K_WASM,
  VPS_LLAMA2_7B_CTX4K_WASM,
  applyHfWeightFailover,
  decideWeightFailover,
  inferLoadSourceFromUrl,
  parseLastLoadSource,
  preferredStartSource,
  shouldAvoidVicunaRecommendation,
  wasmLibFallbackChain,
} from '../../src/config/loadFailover'
import { VPS_STORAGE_URL } from '../../src/utils/vpsStorageUrl'

describe('LOAD_FAILOVER_ORDER', () => {
  it('documents VPS → Contabo → HF Hub → optional API', () => {
    expect(LOAD_FAILOVER_ORDER).toEqual(['vps', 'contabo', 'hf', 'api'])
  })
})

describe('decideWeightFailover', () => {
  const vicuna = 'vicuna-7b-q4f32-webllm-vps'

  it('retries HF once when VPS Vicuna fails as network or config', () => {
    expect(
      decideWeightFailover({
        modelId: vicuna,
        currentSource: 'vps',
        category: 'network',
        tried: [],
      }),
    ).toBe('retry_hf')
    expect(
      decideWeightFailover({
        modelId: vicuna,
        currentSource: 'vps',
        category: 'config',
        tried: [],
      }),
    ).toBe('retry_hf')
    expect(
      decideWeightFailover({
        modelId: vicuna,
        currentSource: 'vps',
        category: 'wasm_missing',
        tried: [],
      }),
    ).toBe('retry_hf')
  })

  it('does not retry HF on GPU OOM or WebGPU', () => {
    expect(
      decideWeightFailover({
        modelId: vicuna,
        currentSource: 'vps',
        category: 'oom',
        tried: [],
      }),
    ).toBe('none')
    expect(
      decideWeightFailover({
        modelId: vicuna,
        currentSource: 'vps',
        category: 'webgpu',
        tried: [],
      }),
    ).toBe('none')
  })

  it('does not retry HF twice', () => {
    expect(
      decideWeightFailover({
        modelId: vicuna,
        currentSource: 'vps',
        category: 'network',
        tried: ['hf'],
      }),
    ).toBe('none')
  })

  it('reverse-failovers HF → VPS once when last success started at Hub', () => {
    expect(
      decideWeightFailover({
        modelId: HF_VICUNA_MODEL_ID,
        currentSource: 'hf',
        category: 'network',
        tried: ['hf'],
      }),
    ).toBe('retry_vps')
  })

  it('does not failover non-Vicuna models', () => {
    expect(
      decideWeightFailover({
        modelId: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
        currentSource: 'vps',
        category: 'network',
        tried: [],
      }),
    ).toBe('none')
  })
})

describe('applyHfWeightFailover', () => {
  it('rewrites Vicuna onto the HF Hub id/url and GitHub wasm, breaking retry loops', () => {
    const next = applyHfWeightFailover({
      model_id: 'vicuna-7b-q4f32-webllm-vps',
      model: `${VPS_STORAGE_URL}/vicuna-7b-q4f32-webllm/`,
      model_lib: `${VPS_STORAGE_URL}/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
      hf_fallback_url: HF_VICUNA_MODEL_URL,
      overrides: { context_window_size: 2048 },
    })
    expect(next.model_id).toBe(HF_VICUNA_MODEL_ID)
    expect(next.model).toBe(HF_VICUNA_MODEL_URL)
    expect(next.model_lib).toBe(MLC_LLAMA2_7B_CTX4K_WASM)
    expect(next.hf_fallback_url).toBeUndefined()
    expect(next.loadSource).toBe('hf')
    expect(next.skipSourceFailover).toBe(true)
    expect(next.requestedModelId).toBe('vicuna-7b-q4f32-webllm-vps')
    expect(next.overrides?.tokenizer_files).toEqual(['tokenizer.model', 'tokenizer_config.json'])
  })
})

describe('wasmLibFallbackChain', () => {
  it('maps missing custom ctx512/1024 Vicuna wasm to generic 4K libs', () => {
    const custom = `${VPS_STORAGE_URL}/wasm-libs/vicuna-7b-q4f32_1-ctx512_cs1k-webgpu.wasm`
    expect(wasmLibFallbackChain(custom)).toEqual([
      VPS_LLAMA2_7B_CTX4K_WASM,
      MLC_LLAMA2_7B_CTX4K_WASM,
    ])
  })

  it('maps other VPS wasm-libs onto the MLC GitHub twin by filename', () => {
    const vps = `${VPS_STORAGE_URL}/wasm-libs/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm`
    const chain = wasmLibFallbackChain(vps)
    expect(chain[0]).toContain('binary-mlc-llm-libs')
    expect(chain[0]).toContain('Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm')
  })
})

describe('preferredStartSource / last success', () => {
  it('starts on HF when the last successful Vicuna load was Hub', () => {
    expect(
      preferredStartSource('vicuna-7b-q4f32-webllm-vps', {
        modelId: 'vicuna-7b-q4f32-webllm-vps',
        source: 'hf',
        wasmFallback: false,
        savedAt: '2026-09-12',
      }),
    ).toBe('hf')
    expect(preferredStartSource('vicuna-7b-q4f32-webllm-vps', null)).toBe('vps')
    expect(
      preferredStartSource('vicuna-7b-q4f32-webllm-vps', null, { forceHf: true }),
    ).toBe('hf')
    expect(
      preferredStartSource('Hermes-3-Llama-3.2-3B-q4f32_1-MLC', null, { forceHf: true }),
    ).toBe('vps')
  })

  it('parses last-load JSON and infers source from URLs', () => {
    expect(parseLastLoadSource(null)).toBeNull()
    expect(parseLastLoadSource('{"modelId":"x"}')).toBeNull()
    expect(
      parseLastLoadSource(
        JSON.stringify({
          modelId: 'vicuna-7b-q4f32-webllm-vps',
          source: 'hf',
          wasmFallback: true,
          savedAt: 't',
        }),
      )?.source,
    ).toBe('hf')
    expect(inferLoadSourceFromUrl(HF_VICUNA_MODEL_URL)).toBe('hf')
    expect(inferLoadSourceFromUrl(`${VPS_STORAGE_URL}/vicuna-7b-q4f32-webllm/`)).toBe('vps')
  })
})

describe('shouldAvoidVicunaRecommendation', () => {
  it('is true after a Vicuna OOM', () => {
    expect(shouldAvoidVicunaRecommendation('vicuna-7b-q4f32-webllm-vps')).toBe(true)
    expect(shouldAvoidVicunaRecommendation('Hermes-3-Llama-3.2-3B-q4f32_1-MLC')).toBe(false)
    expect(shouldAvoidVicunaRecommendation(null)).toBe(false)
  })
})

describe('categorizeChatError load classes', () => {
  it('classifies config vs wasm_missing vs download vs OOM', () => {
    expect(categorizeChatError(new Error('tokenizer_files missing in mlc-chat-config.json'))).toBe(
      'config',
    )
    expect(categorizeChatError(new Error('HEAD 404 for model_lib foo.wasm'))).toBe('wasm_missing')
    expect(categorizeChatError(new Error('Cache.add() encountered a network error'))).toBe('network')
    expect(categorizeChatError(new Error('GPU OOM during CreateBuffer'))).toBe('oom')
  })
})
