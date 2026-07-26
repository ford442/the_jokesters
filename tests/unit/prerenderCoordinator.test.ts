import { describe, expect, it, vi } from 'vitest'
import { PrerenderCoordinator } from '../../src/prerender/PrerenderCoordinator'
import type { GroupChatManager } from '../../src/GroupChatManager'
import type { AudioEngine } from '../../src/audio/AudioEngine'
import type { SpeechQueue } from '../../src/audio/SpeechQueue'

interface RawTurn {
  agentId: string
  agentName: string
  response: string
  sentences: string[]
}

function fakeSpeechQueue() {
  return {
    clearPrerendered: vi.fn(),
    prerenderOne: vi.fn(async () => new Float32Array([1])),
    synthesizeOrTakeCached: vi.fn(async () => new Float32Array([1])),
  } as unknown as SpeechQueue
}

function fakeAudioEngine() {
  return {} as unknown as AudioEngine
}

function makeTurn(agentId: string, text: string): RawTurn {
  return { agentId, agentName: agentId, response: text, sentences: [text] }
}

/** Resolves manually — lets a test control exactly when an async op "completes". */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('PrerenderCoordinator', () => {
  it('fillInitial enqueues turns at the default (healthy-VRAM) depth, and takeTurn drains them in order', async () => {
    const turns = [makeTurn('comedian', 'a'), makeTurn('philosopher', 'b'), makeTurn('scientist', 'c')]
    const manager = { prerenderTurns: vi.fn(async () => turns) } as unknown as GroupChatManager
    const speechQueue = fakeSpeechQueue()
    const coordinator = new PrerenderCoordinator(manager, fakeAudioEngine(), speechQueue)

    const n = await coordinator.fillInitial('seed prompt')

    // constructor default depth is computePrerenderDepth(4096) => initialTurns: 3
    expect(n).toBe(3)
    expect(coordinator.getQueueDepth()).toBe(3)
    expect(coordinator.isFilling()).toBe(false)

    expect(coordinator.takeTurn()?.agentId).toBe('comedian')
    expect(coordinator.takeTurn()?.agentId).toBe('philosopher')
    expect(coordinator.takeTurn()?.agentId).toBe('scientist')
    expect(coordinator.takeTurn()).toBeNull()
    expect(coordinator.getQueueDepth()).toBe(0)
  })

  it('discards a fillInitial batch that resolves after cancel() bumped the generation', async () => {
    const pending = deferred<RawTurn[]>()
    const manager = { prerenderTurns: vi.fn(() => pending.promise) } as unknown as GroupChatManager
    const speechQueue = fakeSpeechQueue()
    const coordinator = new PrerenderCoordinator(manager, fakeAudioEngine(), speechQueue)

    const fillPromise = coordinator.fillInitial('seed prompt')
    expect(coordinator.isFilling()).toBe(true)

    // User stops the scene mid-generation: bumps the epoch and clears state.
    coordinator.cancel('user stopped mid-fill')
    expect(coordinator.isFilling()).toBe(false)

    // The stale LLM call finally resolves — it must not resurrect the queue.
    pending.resolve([makeTurn('comedian', 'too late')])

    const n = await fillPromise
    expect(n).toBe(0)
    expect(coordinator.getQueueDepth()).toBe(0)
  })

  it('refillInBackground is a no-op while a refill is already in flight (mutex)', async () => {
    const pending = deferred<RawTurn[]>()
    const prerenderTurns = vi.fn(() => pending.promise)
    const manager = { prerenderTurns } as unknown as GroupChatManager
    const speechQueue = fakeSpeechQueue()
    const coordinator = new PrerenderCoordinator(manager, fakeAudioEngine(), speechQueue)

    coordinator.refillInBackground('continue prompt')
    expect(coordinator.isFilling()).toBe(true)

    // A second refill request while the first is still pending should not fire another LLM call.
    coordinator.refillInBackground('continue prompt')
    expect(prerenderTurns).toHaveBeenCalledTimes(1)

    pending.resolve([makeTurn('comedian', 'refilled')])
    await vi.waitFor(() => expect(coordinator.isFilling()).toBe(false))
    expect(coordinator.getQueueDepth()).toBe(1)
  })

  it('discards a refillInBackground batch that resolves after cancel() bumped the generation', async () => {
    const pending = deferred<RawTurn[]>()
    const manager = { prerenderTurns: vi.fn(() => pending.promise) } as unknown as GroupChatManager
    const speechQueue = fakeSpeechQueue()
    const coordinator = new PrerenderCoordinator(manager, fakeAudioEngine(), speechQueue)

    coordinator.refillInBackground('continue prompt')
    expect(coordinator.isFilling()).toBe(true)

    coordinator.cancel('scene stopped mid-refill')

    pending.resolve([makeTurn('comedian', 'stale refill')])
    await vi.waitFor(() => expect(coordinator.isFilling()).toBe(false))

    expect(coordinator.getQueueDepth()).toBe(0)
  })
})
