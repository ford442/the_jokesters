import { describe, expect, it } from 'vitest'
import { selectErrorPanelActions } from '../../src/app/errorPanelActions'

const VICUNA = 'vicuna-7b-q4f32-webllm-vps'
const HERMES = 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC'

describe('selectErrorPanelActions', () => {
  it('always includes Retry', () => {
    expect(selectErrorPanelActions({ category: 'unknown', modelId: VICUNA }).actions).toEqual([
      'retry',
    ])
  })

  it('shows Try Hermes + cache + HF + mirror on Vicuna network failure', () => {
    const plan = selectErrorPanelActions({ category: 'network', modelId: VICUNA })
    expect(plan.actions).toEqual([
      'retry',
      'try_smaller',
      'clear_cache',
      'retry_hf',
      'retry_mirror',
    ])
    expect(plan.smallerPresetId).toBe(HERMES)
    expect(plan.smallerShortName.toLowerCase()).toContain('hermes')
  })

  it('omits HF retry for non-Vicuna download failures', () => {
    const plan = selectErrorPanelActions({ category: 'network', modelId: HERMES })
    expect(plan.actions).toContain('try_smaller')
    expect(plan.actions).toContain('clear_cache')
    expect(plan.actions).toContain('retry_mirror')
    expect(plan.actions).not.toContain('retry_hf')
  })

  it('steps down on OOM without HF or mirror buttons', () => {
    const plan = selectErrorPanelActions({ category: 'oom', modelId: VICUNA })
    expect(plan.actions).toEqual(['retry', 'try_smaller'])
    expect(plan.smallerPresetId).toBe(HERMES)
  })

  it('offers the same recovery set for config and wasm_missing', () => {
    const config = selectErrorPanelActions({ category: 'config', modelId: VICUNA })
    const wasm = selectErrorPanelActions({ category: 'wasm_missing', modelId: VICUNA })
    expect(config.actions).toEqual(wasm.actions)
    expect(config.actions).toContain('retry_hf')
  })
})
