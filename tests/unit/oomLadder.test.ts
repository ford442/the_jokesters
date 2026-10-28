import { describe, it, expect, vi, beforeEach } from 'vitest'

const createCalls: Array<{ modelId: string; lib: string; ctx: number }> = []
vi.mock('../../src/llm/worker/mlcWorkerEngine', () => ({
  MlcWorkerStartupError: class extends Error {},
  resolveMlcRuntime: () => 'worker',
  createMlcWorkerEngine: vi.fn(async (
    modelId: string,
    cfg: { appConfig: { model_list: Array<{ model_lib: string }> } },
    chatOpts: { context_window_size: number },
  ) => {
    createCalls.push({
      modelId,
      lib: cfg.appConfig.model_list[0].model_lib,
      ctx: chatOpts.context_window_size,
    })
    if (createCalls.length === 1) throw new Error('GPU out of memory: createBuffer failed')
    return { chatOpts: [chatOpts] }
  }),
}))

import { loadModelWithDynamicContext, type DynamicModelConfig } from '../../src/llm/mlcEngineCreate'
import {
  OOM_MODEL_LADDER,
  getContextConfigForVRAM,
  nextMlcOomStep,
  nextOomLadderModelId,
  resolveContextPolicy,
  APP_OVERHEAD_MB,
} from '../../src/utils/vramOverrides'
import { applyHfWeightFailover, MLC_LLAMA2_7B_CTX4K_WASM } from '../../src/config/loadFailover'
import { appConfig } from '../../src/config/models'
import { getSmallerFallbackFor } from '../../src/app/modelGuide'
import { parseCompiledMaxContextFromModelLib } from '../../src/utils/vramOverrides'

const cfg = (id: string) => appConfig.model_list.find((m) => m.model_id === id) as unknown as DynamicModelConfig

describe('OOM ladder', () => {
  it('orders ctx4k → ctx1024 → ctx512 → Hermes q4f32 → Qwen', () => {
    expect([...OOM_MODEL_LADDER]).toEqual([
      'vicuna-7b-q4f32-webllm-vps',
      'vicuna-7b-q4f32-webllm-ctx1024',
      'vicuna-7b-q4f32-webllm-ctx512',
      'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
      'Qwen2.5-0.5B-Instruct-ONNX',
    ])
    expect(nextOomLadderModelId('vicuna-7b-q4f32-webllm-ultra-low')).toBe('vicuna-7b-q4f32-webllm-ctx1024')
    expect(nextOomLadderModelId('Qwen2.5-0.5B-Instruct-ONNX')).toBeNull()
    // Qwen needs Transformers.js — the MLC engine stops at Hermes and hands off to the panel.
    expect(nextMlcOomStep('Hermes-3-Llama-3.2-3B-q4f32_1-MLC')).toBeNull()
  })

  it('every MLC rung exists in appConfig', () => {
    for (const id of OOM_MODEL_LADDER.slice(0, 4)) expect(cfg(id)).toBeDefined()
  })

  it('guided fallback names ctx1024 then ctx512 before Hermes', () => {
    expect(getSmallerFallbackFor('vicuna-7b-q4f32-webllm-vps').id).toBe('vicuna-7b-q4f32-webllm-ctx1024')
    expect(getSmallerFallbackFor('vicuna-7b-q4f32-webllm-ctx1024').id).toBe('vicuna-7b-q4f32-webllm-ctx512')
    expect(getSmallerFallbackFor('vicuna-7b-q4f32-webllm-ctx512').id).toBe('Hermes-3-Llama-3.2-3B-q4f32_1-MLC')
  })
})

describe('loadModelWithDynamicContext OOM', () => {
  beforeEach(() => {
    createCalls.length = 0
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200 })))
  })

  it('steps a ctx4k OOM (context == compiled floor) to the ctx1024 lib instead of throwing', async () => {
    await loadModelWithDynamicContext(
      { ...cfg('vicuna-7b-q4f32-webllm-vps'), skipSourceFailover: true },
      'auto',
    )
    expect(createCalls).toHaveLength(2)
    expect(createCalls[0].ctx).toBe(2048)
    expect(createCalls[1].modelId).toBe('vicuna-7b-q4f32-webllm-ctx1024')
    expect(parseCompiledMaxContextFromModelLib(createCalls[1].lib)).toBe(1024)
    expect(createCalls[1].ctx).toBe(1024)
  })
})

describe('applyHfWeightFailover compiled class', () => {
  it('keeps a ctx512 lib on HF retry', () => {
    const c = cfg('vicuna-7b-q4f32-webllm-ctx512')
    const next = applyHfWeightFailover({ ...c })
    expect(next.model_lib).toBe(c.model_lib)
    expect(parseCompiledMaxContextFromModelLib(next.model_lib)).toBe(512)
  })
  it('still uses the upstream 4K lib for generic Vicuna', () => {
    expect(applyHfWeightFailover({ ...cfg('vicuna-7b-q4f32-webllm-vps') }).model_lib).toBe(MLC_LLAMA2_7B_CTX4K_WASM)
  })
})

describe('context policy', () => {
  it('a 4 GB probe does not select 128 tokens for 7B', () => {
    const net = 4096 - APP_OVERHEAD_MB
    expect(getContextConfigForVRAM(net, '7b').context_window_size).toBeGreaterThan(128)
    const p = resolveContextPolicy({
      modelId: 'vicuna-7b-q4f32-webllm-vps', vramMB: net, compiledMaxContext: null, preferredContext: 'auto',
    })
    expect(p.context_window_size).toBeGreaterThan(128)
  })
  it('presets win over the table and are clamped to the compiled plan', () => {
    const p = resolveContextPolicy({
      modelId: 'vicuna-7b-q4f32-webllm-ctx512', compiledMaxContext: 512, preferredContext: 'auto',
      presetOverrides: { context_window_size: 2048 },
    })
    expect(p.context_window_size).toBe(512)
    expect(p.overrides.sliding_window_size).toBeUndefined()
  })
})
