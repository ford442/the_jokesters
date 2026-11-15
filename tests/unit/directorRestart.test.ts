import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModeContext, ModeLoop } from '../../src/Director/modes/ModeContext'
import type { ModeCatalogEntry } from '../../src/Director/modes/registry'

const testModeDef: ModeCatalogEntry = {
  id: 'test-mode',
  title: 'Test Mode',
  category: 'improv',
  description: 'Director restart-race test double',
}

let testModeLoop: ModeLoop = async () => {}

vi.mock('../../src/Director/modes/registry', () => ({
  getMode: vi.fn(() => testModeDef),
  loadModeLoop: vi.fn(async () => testModeLoop),
}))

import { Director } from '../../src/Director/Director'
import type { DirectorCallbacks, Scenario } from '../../src/Director/Director'
import { GroupChatManager } from '../../src/GroupChatManager'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import { castAgents } from '../../src/cast/defaultCast'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function makeDirector() {
  const manager = new GroupChatManager(castAgents.map((a) => ({ ...a })))
  const engine = new MockLLMEngine('mock', 'Mock')
  await engine.initialize({ id: 'mock-model', name: 'Mock', vram_required_MB: 0, context_window_size: 4096 })
  manager.attachSessionForTests(engine, 'mock')
  const errors: unknown[] = []
  const callbacks: DirectorCallbacks = {
    onMessage: () => {},
    onSpeak: async () => {},
    onTurnStart: async () => {},
    onTurnEnd: async () => {},
    onError: (e) => { errors.push(e) },
    onSceneStop: vi.fn(),
    getSeed: () => undefined,
  }
  return { director: new Director(manager, callbacks), callbacks, errors }
}

/**
 * A mode loop that ticks every 5 ms while `ctx.isRunning()`, logging which scene
 * each tick belongs to, and — like many real modes — calls `ctx.stopScene()`
 * itself when it finishes. It keeps going for a while after a stop, the way a
 * loop parked in an await would.
 */
function tickingLoop(state: { log: string[]; live: Set<string>; maxLive: number; contexts: Map<string, ModeContext> }): ModeLoop {
  return async (scenario, ctx) => {
    state.contexts.set(scenario.title, ctx)
    state.live.add(scenario.title)
    state.maxLive = Math.max(state.maxLive, state.live.size)
    try {
      for (let i = 0; i < 20; i++) {
        if (ctx.isRunning()) state.log.push(scenario.title)
        await sleep(5)
      }
      ctx.stopScene()
    } finally {
      state.live.delete(scenario.title)
    }
  }
}

const newState = () => ({ log: [] as string[], live: new Set<string>(), maxLive: 0, contexts: new Map<string, ModeContext>() })

describe('Director stop → restart', () => {
  beforeEach(() => {
    ;(globalThis as any).document = { getElementById: () => null }
  })
  afterEach(() => {
    delete (globalThis as any).document
    vi.restoreAllMocks()
  })

  it('a stop then restart within 50 ms runs exactly one loop at a time, never interleaving lines', async () => {
    const state = newState()
    testModeLoop = tickingLoop(state)
    const { director, errors } = await makeDirector()

    const runA = director.playScenario({ type: 'improv', title: 'A', description: 'first' })
    await sleep(20)
    director.stopScene()
    await sleep(10) // restart well inside 50 ms
    const runB = director.playScenario({ type: 'improv', title: 'B', description: 'second' })

    // The stopped scene's context is fenced off immediately.
    const ctxA = state.contexts.get('A')!
    expect(ctxA.isRunning()).toBe(false)
    expect(ctxA.signal?.aborted).toBe(true)

    await runA
    await sleep(20)
    // B starts only once A has unwound, so it is the one live loop.
    expect([...state.live]).toEqual(['B'])
    expect(director.isSceneRunning()).toBe(true)

    // A's late stopScene() (its loop finishing) never touches B.
    ctxA.stopScene()
    expect(director.isSceneRunning()).toBe(true)

    await runB
    expect(state.maxLive).toBe(1)
    const firstB = state.log.indexOf('B')
    expect(firstB).toBeGreaterThan(0)
    expect(state.log.slice(firstB).every((t) => t === 'B')).toBe(true)
    expect(director.isSceneRunning()).toBe(false)
    expect(errors).toEqual([])
  })

  it('restarting without an explicit stop supersedes the running scene', async () => {
    const state = newState()
    testModeLoop = tickingLoop(state)
    const { director, callbacks } = await makeDirector()

    const runA = director.playScenario({ type: 'improv', title: 'A', description: '' })
    await sleep(15)
    const runB = director.playScenario({ type: 'improv', title: 'B', description: '' })
    await runA
    await sleep(10)
    expect(state.contexts.get('A')!.isRunning()).toBe(false)
    expect(director.isSceneRunning()).toBe(true)
    await runB
    expect(director.isSceneRunning()).toBe(false)
    // A's teardown + B's teardown — never a third from A's late stopScene().
    expect(callbacks.onSceneStop).toHaveBeenCalledTimes(2)
    expect(state.maxLive).toBe(1)
  })

  it('a stuck old loop that outlives the settle timeout cannot stop or write into the new scene', async () => {
    let releaseA!: () => void
    const gateA = new Promise<void>((r) => { releaseA = r })
    const contexts = new Map<string, ModeContext>()
    testModeLoop = async (scenario, ctx) => {
      contexts.set(scenario.title, ctx)
      if (scenario.title === 'A') {
        await gateA // e.g. parked on a long generation
        await ctx.processTurn('stale turn')
        ctx.stopScene()
        return
      }
      while (ctx.isRunning()) await sleep(5)
    }
    const { director, errors } = await makeDirector()
    const manager = (director as unknown as { manager: GroupChatManager }).manager

    const runA = director.playScenario({ type: 'improv', title: 'A', description: '' })
    await sleep(10)
    director.stopScene()
    const runB = director.playScenario({ type: 'improv', title: 'B', description: '' })
    await sleep(3200) // > PREVIOUS_RUN_SETTLE_MS: B starts without A
    expect(director.isSceneRunning()).toBe(true)
    const historyBefore = manager.getHistoryLength()

    releaseA()
    await runA
    expect(director.isSceneRunning()).toBe(true) // A's stopScene() was inert
    expect(manager.getHistoryLength()).toBe(historyBefore) // A's processTurn was dropped

    director.stopScene()
    await runB
    expect(errors).toEqual([])
  }, 10_000)
})
