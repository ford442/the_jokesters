import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModeLoop } from '../../src/Director/modes/ModeContext'
import type { ModeCatalogEntry } from '../../src/Director/modes/registry'

const testModeDef: ModeCatalogEntry = {
  id: 'test-mode',
  title: 'Test Mode',
  category: 'improv',
  description: 'Director production-card test double',
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
import { parseAndValidateEpisode } from '../../src/episode'
import type { JokestersEpisode } from '../../src/episode'
import { parseProductionSnapshot } from '../../src/Director/productionCard'

const SECRET_GOAL = 'steer to marmalade'

async function makeManager() {
  const manager = new GroupChatManager(agents.map((a) => ({ ...a })))
  const engine = new MockLLMEngine('mock', 'Mock')
  await engine.initialize({ id: 'mock-model', name: 'Mock', vram_required_MB: 0, context_window_size: 4096 })
  engine.queueResponses(
    'Cold open line.',
    'I brought marmalade for everyone.',
    'Main line two.',
    'Main line three.',
    'Main line four.',
    'Main line five.',
    'Main line six.',
    'Main line seven.',
    'Main line eight.',
    'The final button.',
  )
  manager.attachSessionForTests(engine, 'mock')
  return { manager, engine }
}

function makeCallbacks() {
  const messages: Array<{ sender: string; message: string }> = []
  const callbacks: DirectorCallbacks = {
    onMessage: (sender, message) => { messages.push({ sender, message }) },
    onSpeak: async () => {},
    onTurnStart: async () => {},
    onTurnEnd: async () => {},
    onError: (e) => { throw e },
    onSceneStop: vi.fn(),
    getSeed: () => undefined,
  }
  return { callbacks, messages }
}

function fakeMemoryManager() {
  return {
    setSyncStatusCallback: () => {},
    fetchPreviousEpisodeSummaries: async () => {},
    searchLocalEpisodes: async () => [],
    searchFetchedSummaries: async () => [],
    saveEpisode: () => {},
    saveEpisodeScriptToCloud: async () => {},
  } as any
}

function agentForSystemPrompt(system: string): string | undefined {
  return agents.find((a) => system.startsWith(a.systemPrompt))?.id
}

describe('Director production card', () => {
  beforeEach(() => {
    ;(globalThis as any).document = { getElementById: () => null }
  })
  afterEach(() => {
    delete (globalThis as any).document
    vi.restoreAllMocks()
  })

  it('runs cold open → main → tag, injects relationships/secrets privately, and exports the snapshot', async () => {
    const injections: Array<string | null> = []
    const beats: Array<string | null> = []
    testModeLoop = async (_scenario, ctx) => {
      ctx.production!.setTurnBudget(10)
      for (let i = 0; i < 10 && ctx.isRunning(); i++) {
        beats.push(ctx.production!.getBeat())
        await ctx.processTurn('(Reply naturally to the last thing said)')
        injections.push(ctx.getArcPromptInjection())
      }
    }

    const { manager, engine } = await makeManager()
    const { callbacks, messages } = makeCallbacks()
    const director = new Director(manager, callbacks, fakeMemoryManager())
    let exported: JokestersEpisode | null = null
    director.setEpisodeReadyHandler((ep) => { exported = ep })

    const scenario: Scenario = {
      type: 'improv',
      title: 'Breakfast',
      description: 'desc',
      config: {
        chaosLevel: 0,
        production: {
          relationships: [{ a: 'comedian', b: 'philosopher', label: 'exes', public: false }],
          secrets: [{ agentId: 'philosopher', goal: SECRET_GOAL }],
        },
      },
    }
    await director.playScenario(scenario)

    // Beats: 1-turn cold open, main sketch, 1-turn tag — announced as Director messages.
    expect(beats[0]).toBe('cold_open')
    expect(beats.slice(1, 9).every((b) => b === 'main')).toBe(true)
    expect(beats[9]).toBe('tag')
    const directorLines = messages.filter((m) => m.sender === 'Director').map((m) => m.message)
    expect(directorLines).toEqual(expect.arrayContaining(['🎬 COLD OPEN', '🎭 MAIN SKETCH', '🏷️ TAG']))

    // Tag beat forces the arc's close-act path.
    expect(injections[8]).toContain('scene is wrapping up')

    // Relationship reaches both agents' system prompts (hidden), not the third.
    const systemFor = (id: string) => engine.chatCalls
      .map((c) => c.messages.find((m) => m.role === 'system')?.content as string)
      .filter((s) => agentForSystemPrompt(s) === id)
    for (const id of ['comedian', 'philosopher', 'scientist']) expect(systemFor(id).length).toBeGreaterThan(0)
    expect(systemFor('comedian').every((s) => s.includes('You and The Philosopher are exes'))).toBe(true)
    expect(systemFor('philosopher').every((s) => s.includes('You and The Comedian are exes'))).toBe(true)
    expect(systemFor('scientist').every((s) => !s.includes('RELATIONSHIP'))).toBe(true)
    expect(systemFor('philosopher').every((s) => s.includes(SECRET_GOAL))).toBe(true)
    expect(systemFor('comedian').every((s) => !s.includes(SECRET_GOAL))).toBe(true)

    // Tag turn's hidden note carries the callback instruction.
    const lastSystem = engine.chatCalls.at(-1)!.messages.find((m) => m.role === 'system')!.content as string
    expect(lastSystem).toContain('BEAT: TAG')

    // Secret was tracked (philosopher said "marmalade") without leaking into the public transcript.
    expect(director.getProductionCard()).toBeNull() // cleared on stop
    expect(directorLines.some((l) => l.includes('The Philosopher is up to something'))).toBe(true)
    for (const m of messages) expect(m.message).not.toContain(SECRET_GOAL)
    for (const h of manager.getHistory()) expect(String(h.content)).not.toContain(SECRET_GOAL)

    // Episode JSON round-trips the production snapshot.
    expect(exported).not.toBeNull()
    for (const t of exported!.turns) expect(t.text).not.toContain(SECRET_GOAL)
    const reparsed = parseAndValidateEpisode(JSON.stringify(exported))
    expect(reparsed.ok).toBe(true)
    const snap = parseProductionSnapshot(reparsed.episode!.sceneState!.production)
    expect(snap).toEqual(exported!.sceneState!.production)
    expect(snap).toMatchObject({ beat: 'tag', turnCount: 10, turnBudget: 10 })
    expect(snap!.secrets[0]).toMatchObject({ agentId: 'philosopher', achieved: true })
  })
})
