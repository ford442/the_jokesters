import { describe, expect, it } from 'vitest'
import { getModelFallbackChain, VPS_FP32_MODELS } from '../../src/config/models'

const VICUNA = VPS_FP32_MODELS.VPS_VICUNA_7B_Q4F32.model_id
const HERMES = VPS_FP32_MODELS.VPS_HERMES_3_3B_Q4F32.model_id
const CTX512 = VPS_FP32_MODELS.VPS_VICUNA_7B_CTX512.model_id

describe('getModelFallbackChain', () => {
  it('after Vicuna, steps to Hermes 3B before any other 7B ctx variant', () => {
    const chain = getModelFallbackChain(VICUNA)
    expect(chain[0]).toBe(VICUNA)
    expect(chain[1]).toBe(HERMES)
    expect(chain.includes(CTX512)).toBe(false)
    expect(chain.includes(VPS_FP32_MODELS.VPS_VICUNA_7B_CTX1024.model_id)).toBe(false)
    expect(chain.includes(VPS_FP32_MODELS.VPS_VICUNA_7B_ULTRA_LOW.model_id)).toBe(false)
  })

  it('keeps an explicit ctx512 pick first, then Hermes — not more Vicuna 7B', () => {
    const chain = getModelFallbackChain(CTX512)
    expect(chain[0]).toBe(CTX512)
    expect(chain[1]).toBe(HERMES)
    expect(chain.filter((id) => id.includes('vicuna-7b-q4f32'))).toEqual([CTX512])
  })

  it('defaults to Hermes-first when no preferred model is given', () => {
    const chain = getModelFallbackChain()
    expect(chain[0]).toBe(HERMES)
    expect(chain).toContain('Qwen2.5-0.5B-Instruct-ONNX')
    expect(chain).toContain('vicuna-7b-v1.5-GGUF')
  })
})
