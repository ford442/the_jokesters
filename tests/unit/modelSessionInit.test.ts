import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelSession } from '../../src/chat/ModelSession'

type InitOnce = (...args: unknown[]) => Promise<void>

describe('ModelSession.initialize', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shares one in-flight load between concurrent callers (one engine)', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => { release = r })
    const initOnce = vi
      .spyOn(ModelSession.prototype as unknown as { initializeOnce: InitOnce }, 'initializeOnce')
      .mockImplementation(async () => { await gate })

    const session = new ModelSession()
    const a = session.initialize(undefined, 'model-a')
    const b = session.initialize(undefined, 'model-b') // e.g. auto-fallback racing the picker
    expect(b).toBe(a)
    release()
    await Promise.all([a, b])
    expect(initOnce).toHaveBeenCalledTimes(1)
  })

  it('allows a fresh attempt after a failed load', async () => {
    const initOnce = vi
      .spyOn(ModelSession.prototype as unknown as { initializeOnce: InitOnce }, 'initializeOnce')
      .mockRejectedValueOnce(new Error('oom'))
      .mockResolvedValueOnce(undefined)

    const session = new ModelSession()
    await expect(session.initialize()).rejects.toThrow('oom')
    await session.initialize()
    expect(initOnce).toHaveBeenCalledTimes(2)
  })

  it('terminate() waits for an in-flight load before tearing down', async () => {
    const order: string[] = []
    let release!: () => void
    const gate = new Promise<void>((r) => { release = r })
    vi.spyOn(ModelSession.prototype as unknown as { initializeOnce: InitOnce }, 'initializeOnce')
      .mockImplementation(async () => { await gate; order.push('loaded') })

    const session = new ModelSession()
    const init = session.initialize()
    const term = session.terminate().then(() => order.push('terminated'))
    release()
    await Promise.all([init, term])
    expect(order).toEqual(['loaded', 'terminated'])
  })
})
