import { describe, expect, it } from 'vitest'
import { EngineFactory } from '../../src/llm/EngineFactory'
import { isMlcEngine } from '../../src/llm/engineGuards'

describe('engine adapters load on demand', () => {
  it('createEngine resolves each adapter through a dynamic import', async () => {
    const api = await EngineFactory.createEngine('api')
    expect(api.id).toBe('api')

    const mlc = await EngineFactory.createEngine('mlc')
    expect(mlc.id).toBe('mlc')
  })

  it('isMlcEngine narrows on the engine id without importing the adapter', async () => {
    const mlc = await EngineFactory.createEngine('mlc')
    const api = await EngineFactory.createEngine('api')
    expect(isMlcEngine(mlc)).toBe(true)
    expect(isMlcEngine(api)).toBe(false)
    expect(isMlcEngine(null)).toBe(false)
  })
})
