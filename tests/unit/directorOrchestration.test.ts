import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModeLoop } from '../../src/Director/modes/ModeContext'
import type { ModeCatalogEntry } from '../../src/Director/modes/registry'

const testModeDef: ModeCatalogEntry = {
  id: 'test-mode',
  title: 'Test Mode',
  category: 'improv',
  description: 'Director orchestration test double',
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
import { agents } from '../../src/config/agents'

async function makeManager() {
  const manager = new GroupChatManager(agents.map((a) => ({ ...a })))
  const engine = new MockLLMEngine('mock', 'Mock')
  await engine.initialize({
    id: 'mock-model',
    name: 'Mock',
    vram_required_MB: 0,
    context_window_size: 4096,
  })
  engine.queueResponses('A quick joke.', 'A quick reply.', 'Another line.', 'One more.')
  manager.attachSessionForTests(engine, 'mock')
  return { manager, engine }
}

function makeCallbacks() {
  const messages: Array<{ sender: string; message: string }> = []
  const turnStarts: string[] = []
  const errors: unknown[] = []
  const callbacks: DirectorCallbacks = {
    onMessage: (sender, message) => {
      messages.push({ sender, message })
    },
    onSpeak: async () => {},
    onTurnStart: async (agentId) => {
      turnStarts.push(agentId)
    },
    onTurnEnd: async () => {},
    onError: (error) => {
      errors.push(error)
    },
    onSceneStop: vi.fn(),
    getSeed: () => undefined,
  }
  return { callbacks, messages, turnStarts, errors }
}

describe('Director orchestration', () => {
  beforeEach(() => {
    // Director's constructor touches `document` only when a memoryManager is supplied
    // (to wire a #settings-status sync-status label) — no `window` access at all.
    ;(globalThis as any).document = { getElementById: () => null }
  })

  afterEach(() => {
    delete (globalThis as any).document
    vi.restoreAllMocks()
  })

  it('runs a scenario end-to-end: comedy session active, turns flow, auto-stops when the mode loop resolves', async () => {
    testModeLoop = async (_scenario, ctx) => {
      expect(ctx.comedy).not.toBeNull() // 'improv' family scenarios enable comedy by default

      await ctx.callbacks.onTurnStart('comedian')
      await ctx.manager.chatForAgent('comedian', 'Say something.', async () => {})
      await ctx.callbacks.onTurnEnd()

      await ctx.callbacks.onTurnStart('philosopher')
      await ctx.manager.chatForAgent('philosopher', 'Reply.', async () => {})
      await ctx.callbacks.onTurnEnd()

      if (ctx.comedy) {
        ctx.comedy.handleAgentResponse('a joke about money and taxes', 'comedian')
      }
    }

    const { manager } = await makeManager()
    const { callbacks, turnStarts, errors } = makeCallbacks()
    const director = new Director(manager, callbacks)

    const scenario: Scenario = { type: 'improv', title: 'Test Scene', description: 'desc' }
    await director.playScenario(scenario)

    expect(errors).toEqual([])
    expect(turnStarts).toEqual(['comedian', 'philosopher'])
    expect(director.isSceneRunning()).toBe(false) // auto-stopped once the mode loop resolved
    expect(callbacks.onSceneStop).toHaveBeenCalledTimes(1)
    expect(manager.getHistoryLength()).toBeGreaterThan(0)
  })

  it('stopScene() mid-scenario ends the loop and only fires onSceneStop once', async () => {
    let stopEarly: () => void = () => {}
    testModeLoop = async (_scenario, ctx) => {
      await ctx.callbacks.onTurnStart('comedian')
      await ctx.manager.chatForAgent('comedian', 'Say something.', async () => {})
      await ctx.callbacks.onTurnEnd()

      stopEarly = ctx.stopScene
      // Simulate a loop that keeps checking isRunning() between turns.
      while (ctx.isRunning()) {
        await Promise.resolve()
        break
      }
    }

    const { manager } = await makeManager()
    const { callbacks } = makeCallbacks()
    const director = new Director(manager, callbacks)

    const scenario: Scenario = { type: 'improv', title: 'Stoppable', description: 'desc' }
    const run = director.playScenario(scenario)
    await run

    expect(director.isSceneRunning()).toBe(false)
    expect(callbacks.onSceneStop).toHaveBeenCalledTimes(1)

    // Calling stopScene again (e.g. a user double-clicking Stop) must stay a no-op.
    stopEarly()
    expect(callbacks.onSceneStop).toHaveBeenCalledTimes(1)
  })

  it('auto-saves an episode via the MemoryManager when the scene produced real history', async () => {
    testModeLoop = async (_scenario, ctx) => {
      await ctx.callbacks.onTurnStart('comedian')
      await ctx.manager.chatForAgent('comedian', 'Line one.', async () => {})
      await ctx.callbacks.onTurnEnd()

      await ctx.callbacks.onTurnStart('philosopher')
      await ctx.manager.chatForAgent('philosopher', 'Line two.', async () => {})
      await ctx.callbacks.onTurnEnd()
    }

    const { manager } = await makeManager()
    const { callbacks, messages } = makeCallbacks()
    const saveEpisode = vi.fn()
    const fakeMemoryManager = {
      saveEpisode,
      fetchPreviousEpisodeSummaries: vi.fn(async () => {}),
      saveEpisodeScriptToCloud: vi.fn(async () => {}),
      searchLocalEpisodes: vi.fn(async () => []),
      searchFetchedSummaries: vi.fn(async () => []),
    } as any

    const director = new Director(manager, callbacks, fakeMemoryManager)

    const scenario: Scenario = { type: 'improv', title: 'Save Me', description: 'desc' }
    await director.playScenario(scenario)

    expect(manager.getHistoryLength()).toBeGreaterThan(2)
    expect(saveEpisode).toHaveBeenCalledTimes(1)
    const [, payload] = saveEpisode.mock.calls[0]
    expect(payload.scenario?.title).toBe('Save Me')
    expect(messages.some((m) => m.sender === 'System' && m.message.includes('Episode auto-saved'))).toBe(true)
  })

  it('does not initialize a comedy session for a non-comedy scenario family', async () => {
    testModeLoop = async (_scenario, ctx) => {
      expect(ctx.comedy).toBeNull()
    }

    const { manager } = await makeManager()
    const { callbacks } = makeCallbacks()
    const director = new Director(manager, callbacks)

    // "media" family scenarios opt out of comedy wiring by default (see modeConfig.ts).
    const scenario: Scenario = { type: 'reaction', title: 'No Comedy', description: 'desc' }
    await director.playScenario(scenario)
  })
})
