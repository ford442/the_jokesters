import { describe, expect, it } from 'vitest'
import { ApiEngineAdapter } from '../../src/llm/ApiEngineAdapter'
import { LlamaCppEngineAdapter } from '../../src/llm/LlamaCppEngineAdapter'
import { MlcEngineAdapter } from '../../src/llm/MlcEngineAdapter'
import { TransformersEngineAdapter } from '../../src/llm/TransformersEngineAdapter'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import { DEFAULT_CONTEXT_WINDOW_SIZE, type EngineContextInfo } from '../../src/llm/LLMEngine'

describe('EngineContextInfo contract', () => {
  it('all adapters implement getContextInfo', () => {
    const api = new ApiEngineAdapter()
    const llama = new LlamaCppEngineAdapter()
    const mlc = new MlcEngineAdapter()
    const tfjs = new TransformersEngineAdapter()
    const mock = new MockLLMEngine('mock', 'Mock')

    // Just verifying the function exists and returns the right structure
    // (Actual values depend on config which isn't passed here)
    const apiInfo = api.getContextInfo()
    expect(apiInfo).toHaveProperty('requested')
    expect(apiInfo).toHaveProperty('effective', DEFAULT_CONTEXT_WINDOW_SIZE)
    expect(apiInfo).toHaveProperty('source')

    const llamaInfo = llama.getContextInfo()
    expect(llamaInfo).toHaveProperty('requested')
    expect(llamaInfo).toHaveProperty('effective', DEFAULT_CONTEXT_WINDOW_SIZE)
    expect(llamaInfo).toHaveProperty('source')

    const mlcInfo = mlc.getContextInfo()
    expect(mlcInfo).toHaveProperty('requested')
    expect(mlcInfo).toHaveProperty('effective', DEFAULT_CONTEXT_WINDOW_SIZE)
    expect(mlcInfo).toHaveProperty('source')

    const tfjsInfo = tfjs.getContextInfo()
    expect(tfjsInfo).toHaveProperty('requested')
    expect(tfjsInfo).toHaveProperty('effective', DEFAULT_CONTEXT_WINDOW_SIZE)
    expect(tfjsInfo).toHaveProperty('source')

    const mockInfo = mock.getContextInfo()
    expect(mockInfo).toHaveProperty('requested')
    expect(mockInfo).toHaveProperty('effective')
    expect(mockInfo).toHaveProperty('source')
  })
})
