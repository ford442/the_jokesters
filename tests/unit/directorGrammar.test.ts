import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModeLoop } from '../../src/Director/modes/ModeContext'
import type { ModeCatalogEntry } from '../../src/Director/modes/registry'

const testModeDef: ModeCatalogEntry = {
  id: 'test-mode',
  title: 'Test Mode',
  category: 'improv',
  description: 'Director status/arc/genre/guest test double',
}

let testModeLoop: ModeLoop = async () => {}

vi.mock('../../src/Director/modes/registry', () => ({
  getMode: vi.fn(() => testModeDef),
  loadModeLoop: vi.fn(async () => testModeLoop),
}))

import { Director } from '../../src/Director/Director'
import type { DirectorCallbacks, GuestStageInfo, Scenario } from '../../src/Director/Director'
import { GroupChatManager } from '../../src/GroupChatManager'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import { agents } from '../../src/config/agents'
import { parseAndValidateEpisode } from '../../src/episode'
import type { JokestersEpisode } from '../../src/episode'
import { GUEST_AGENT_ID, parseProductionSnapshot } from '../../src/Director/productionCard'
import type { ProductionCardInput } from '../../src/Director/productionCard'
import type { ShowCue } from '../../src/audio/showCues'
import type { MemoryManager } from '../../src/Director/MemoryManager'

const REGULARS = agents.map((a) => a.id)
const PERSONA = 'a nosy grandmother who mistakes everyone for her grandchildren.'
const GUEST_SYSTEM_PREFIX = 'You are Grandma, a guest on a live comedy show'

async function makeManager(lines = 14) {
  const manager = new GroupChatManager(agents.map((a) => ({ ...a })))
  // Hidden notes land in per-speaker system prompts under the legacy layout (see directorProduction.test.ts).
  manager.setPromptLayout('per-speaker')
  const engine = new MockLLMEngine('mock', 'Mock')
  await engine.initialize({ id: 'mock-model', name: 'Mock', vram_required_MB: 0, context_window_size: 4096 })
  engine.queueResponses(...Array.from({ length: lines }, (_, i) => `Turn number ${i} line.`))
  manager.attachSessionForTests(engine, 'mock')
  return { manager, engine }
}

function fakeMemoryManager() {
  return {
    setSyncStatusCallback: () => {},
    fetchPreviousEpisodeSummaries: async () => {},
    searchLocalEpisodes: async () => [],
    searchFetchedSummaries: async () => [],
    saveEpisode: () => {},
    saveEpisodeScriptToCloud: async () => {},
  } as unknown as MemoryManager
}

interface TurnSnapshot {
  turn: number
  act: string | null
  comedian: string | undefined
  scientist: string | undefined
  guest: string | undefined
  seated: string | null
  arcBeats: number
  rosterIds: string[]
}

interface RunOptions {
  production: ProductionCardInput
  turns?: number
  /** Called at the top of each turn, before the speaker is chosen. */
  beforeTurn?: (i: number, ctx: Parameters<ModeLoop>[1], director: Director) => void
}

async function runScene({ production, turns = 12, beforeTurn }: RunOptions) {
  const speakers: string[] = []
  const guestEnters: Array<GuestStageInfo & { atTurn: number }> = []
  const guestExits: Array<{ id: string; atTurn: number }> = []
  const cues: Array<{ cue: ShowCue; turn: number }> = []
  const reacts: Array<{ agentId: string; text: string }> = []
  const directorLines: string[] = []
  /** Ordered playback timeline: turn starts, line-finished-playing, and guest exits. */
  const timeline: string[] = []
  const snapshots: TurnSnapshot[] = []
  let currentTurn = -1

  const { manager, engine } = await makeManager()
  const callbacks: DirectorCallbacks = {
    onMessage: (sender, message) => { if (sender === 'Director') directorLines.push(message) },
    onSpeak: async () => {},
    onTurnStart: async (agentId) => { speakers.push(agentId); timeline.push(`start:${agentId}`) },
    onTurnEnd: async () => { timeline.push('end') },
    onError: (e) => { throw e },
    onSceneStop: vi.fn(),
    getSeed: () => undefined,
    onShowCue: (cue) => { cues.push({ cue, turn: currentTurn }) },
    onReactToText: (agentId, text) => { reacts.push({ agentId, text }) },
    onGuestEnter: (g) => { guestEnters.push({ ...g, atTurn: currentTurn }) },
    onGuestExit: (id) => { guestExits.push({ id, atTurn: currentTurn }); timeline.push('guestExit') },
  }
  const director = new Director(manager, callbacks, fakeMemoryManager())
  let exported: JokestersEpisode | null = null
  director.setEpisodeReadyHandler((ep) => { exported = ep })

  testModeLoop = async (_scenario, ctx) => {
    ctx.production!.setTurnBudget(turns)
    for (let i = 0; i < turns && ctx.isRunning(); i++) {
      currentTurn = i
      snapshots.push({
        turn: i,
        act: ctx.getSceneAct!(),
        comedian: ctx.getProductionInstruction!('comedian'),
        scientist: ctx.getProductionInstruction!('scientist'),
        guest: ctx.getProductionInstruction!(GUEST_AGENT_ID),
        seated: manager.getGuestAgent()?.id ?? null,
        arcBeats: director.getSceneArc()?.beats.length ?? -1,
        rosterIds: manager.getAgents().map((a) => a.id),
      })
      beforeTurn?.(i, ctx, director)
      await ctx.processTurn('(Reply naturally to the last thing said)')
    }
  }

  const scenario: Scenario = { type: 'improv', title: 'Parlor', description: 'desc', config: { chaosLevel: 0, production } }
  await director.playScenario(scenario)
  return { director, manager, engine, speakers, guestEnters, guestExits, cues, reacts, directorLines, snapshots, timeline, exported: exported as JokestersEpisode | null }
}

const GRAMMAR: ProductionCardInput = {
  statuses: [{ agentId: 'comedian', level: 'low', targetId: 'philosopher', public: true }],
  arcs: [{ agentId: 'comedian', start: 'angry', mid: 'confused', end: 'pleased' }],
  genreShift: { genre: 'film noir', atTurn: 5 },
  guestNpc: { name: 'Grandma', persona: PERSONA, voiceStyle: 'F2', entersAfterTurn: 3, exitsAfterTurn: 8 },
}

describe('Director: status + arc + genre shift + sixth-speaker guest', () => {
  beforeEach(() => {
    Object.assign(globalThis, { document: { getElementById: () => null } })
  })
  afterEach(() => {
    delete (globalThis as { document?: unknown }).document
    vi.restoreAllMocks()
  })

  it('the guest takes their turns outside the rotation and is gone after exit', async () => {
    const r = await runScene({ production: GRAMMAR })

    // Guest speaks on entrance (turn 3) and every 3rd turn after (6); exit lands before turn 9.
    expect(r.speakers).toEqual([
      'comedian', 'philosopher', 'scientist',
      GUEST_AGENT_ID,
      'techBro', 'robot',
      GUEST_AGENT_ID,
      'comedian', 'philosopher', 'scientist', 'techBro', 'robot',
    ])
    // The regulars still run in strict five-agent order around the guest's turns.
    const regulars = r.speakers.filter((s) => s !== GUEST_AGENT_ID)
    expect(regulars).toEqual(Array.from({ length: regulars.length }, (_, i) => REGULARS[i % REGULARS.length]))
    // No guest speaker after exit.
    expect(r.speakers.slice(7)).not.toContain(GUEST_AGENT_ID)

    // The manager's roster never held a sixth agent; the guest was seated only while on stage.
    for (const s of r.snapshots) expect(s.rosterIds).toEqual(REGULARS)
    expect(r.snapshots.map((s) => s.seated)).toEqual([
      null, null, null, GUEST_AGENT_ID, GUEST_AGENT_ID, GUEST_AGENT_ID, GUEST_AGENT_ID, GUEST_AGENT_ID, null, null, null, null,
    ])
    expect(r.manager.getGuestAgent()).toBeNull()
    expect(r.manager.getAgents().map((a) => a.id)).toEqual(REGULARS)
  })

  it('seats and releases the stage actor and voice exactly once, on entrance and exit', async () => {
    const r = await runScene({ production: GRAMMAR })
    expect(r.guestEnters).toEqual([
      { id: GUEST_AGENT_ID, name: 'Grandma', color: expect.any(String), voiceStyle: 'F2', atTurn: 2 },
    ])
    expect(r.guestExits).toEqual([{ id: GUEST_AGENT_ID, atTurn: 7 }])
    expect(r.directorLines).toEqual(expect.arrayContaining(['🚪 Guest enters: Grandma', '🚪 Guest exits: Grandma']))
  })

  it('waits for the guest\'s last line to finish playing before sending them off', async () => {
    // Enters after turn 3, exits after turn 4: their one line (turn 3) is also the exit turn.
    const r = await runScene({
      production: { guestNpc: { name: 'Grandma', persona: PERSONA, entersAfterTurn: 3, exitsAfterTurn: 4 } },
      turns: 6,
    })
    const guestStart = r.timeline.indexOf(`start:${GUEST_AGENT_ID}`)
    expect(guestStart).toBeGreaterThan(-1)
    const lineEnd = r.timeline.indexOf('end', guestStart)
    const exit = r.timeline.indexOf('guestExit')
    expect(lineEnd).toBeGreaterThan(guestStart)
    expect(exit).toBeGreaterThan(lineEnd) // not before the line is done
    expect(r.timeline.slice(lineEnd + 1, exit)).toEqual([]) // …and before the next turn begins
    expect(r.guestExits).toHaveLength(1)
    expect(r.directorLines).toContain('🚪 Guest exits: Grandma')
    expect(r.speakers.filter((s) => s === GUEST_AGENT_ID)).toHaveLength(1)
  })

  it('stopping the scene while the guest is on stage still drops the actor and the persona', async () => {
    const r = await runScene({
      production: { guestNpc: { name: 'Grandma', persona: PERSONA, entersAfterTurn: 1 } },
      turns: 5,
    })
    expect(r.guestEnters).toHaveLength(1)
    expect(r.guestExits).toHaveLength(1)
    expect(r.manager.getGuestAgent()).toBeNull()
    expect(r.manager.getAgents().map((a) => a.id)).toEqual(REGULARS)
  })

  it('the persona reaches the guest turns only, and only while the guest is on stage', async () => {
    const r = await runScene({ production: GRAMMAR })
    const systems = r.engine.chatCalls.map((c) => c.messages.find((m) => m.role === 'system')!.content as string)
    expect(systems).toHaveLength(12)

    const guestTurns = [3, 6]
    for (const i of guestTurns) {
      expect(systems[i].startsWith(GUEST_SYSTEM_PREFIX), `turn ${i} spoken as the guest`).toBe(true)
      expect(systems[i]).toContain(PERSONA)
    }
    // Regulars react to the guest while they are on stage, never before or after.
    const mentions = systems.map((s) => s.includes('Grandma is on stage'))
    expect(mentions).toEqual([false, false, false, false, true, true, false, true, false, false, false, false])
    // After exit nobody's prompt names the guest.
    for (const i of [8, 9, 10, 11]) expect(systems[i]).not.toContain('Grandma')
    // Regulars may read the blurb ("is on stage") but never get the guest's own role line.
    for (const i of [0, 1, 2, 4, 5, 7, 8, 9, 10, 11]) expect(systems[i]).not.toContain('GUEST ROLE')
    for (const i of guestTurns) expect(systems[i]).toContain('GUEST ROLE: You are Grandma')
  })

  it('compiles different instructions per act (status stays, arc moves, guest comes and goes)', async () => {
    const r = await runScene({ production: GRAMMAR })
    const byAct = new Map<string, TurnSnapshot>()
    for (const s of r.snapshots) if (s.act && !byAct.has(s.act)) byAct.set(s.act, s)
    expect([...byAct.keys()]).toEqual(['open', 'middle', 'close'])

    const [open, middle, close] = ['open', 'middle', 'close'].map((a) => byAct.get(a)!.comedian!)
    expect(new Set([open, middle, close]).size).toBe(3)
    for (const out of [open, middle, close]) expect(out).toContain('LOW status beneath The Philosopher')
    expect(open).toContain('feeling angry')
    expect(middle).toContain('feeling confused')
    expect(close).toContain('feeling pleased')

    // The act sequence only ever moves forward.
    const acts = r.snapshots.map((s) => s.act)
    expect(acts).toEqual([...acts].sort((a, b) => ['open', 'middle', 'close'].indexOf(a!) - ['open', 'middle', 'close'].indexOf(b!)))

    // The boss (target of the status) reads it from the other side.
    expect(r.snapshots.find((s) => s.turn === 1)).toBeDefined()
  })

  it('mirrors status onto the target through the real Director compile', async () => {
    const r = await runScene({ production: GRAMMAR, turns: 3 })
    expect(r.engine.chatCalls).toHaveLength(3)
    const philosopherSystem = r.engine.chatCalls[1].messages.find((m) => m.role === 'system')!.content as string
    expect(philosopherSystem).toContain('HIGH status over The Comedian')
  })

  it('arc emotion rides onReactToText at speak time, ahead of keyword guesses', async () => {
    const r = await runScene({ production: GRAMMAR })
    const comedian = r.reacts.filter((x) => x.agentId === 'comedian')
    // Comedian speaks on turns 0 (open) and 7 (middle).
    expect(comedian).toHaveLength(2)
    expect(comedian[0].text.startsWith('[angry] ')).toBe(true)
    expect(comedian[1].text.startsWith('[think] ')).toBe(true)
    // No arc → the line goes through untouched.
    for (const x of r.reacts.filter((y) => y.agentId !== 'comedian')) expect(x.text).not.toMatch(/^\[/)
  })

  it('a genre shift fires one show cue, adds one adaptation line, and does not touch scene-arc memory', async () => {
    const withGenre = await runScene({ production: GRAMMAR })
    const without = await runScene({ production: { ...GRAMMAR, genreShift: undefined } })

    const breaks = (r: typeof withGenre) => r.cues.filter((c) => c.cue === 'act_break').map((c) => c.turn)
    // Arc act breaks (open→middle at turn 2, middle→close at turn 8) exist either way;
    // the genre flip adds exactly one more, in the turn that completes turn 5 → index 4.
    expect(breaks(without)).toEqual([2, 8])
    expect(breaks(withGenre)).toEqual([2, 4, 8])
    expect(withGenre.directorLines.filter((l) => l.includes('GENRE SHIFT'))).toEqual(['🎞️ GENRE SHIFT: film noir'])

    // Adaptation line appears from the turn it begins (index 5), for everyone, and not before.
    const noir = withGenre.snapshots.map((s) => !!s.scientist?.includes('film noir'))
    expect(noir).toEqual([false, false, false, false, false, true, true, true, true, true, true, true])
    expect(withGenre.snapshots[5].scientist!.match(/^GENRE SHIFT/gm)).toHaveLength(1)

    // Scene-arc memory: beats accumulate one per turn, straight through the flip, and the act
    // sequence is identical with and without the shift.
    expect(withGenre.snapshots.map((s) => s.arcBeats)).toEqual(Array.from({ length: 12 }, (_, i) => i))
    expect(withGenre.snapshots.map((s) => s.act)).toEqual(without.snapshots.map((s) => s.act))
  })

  it('setGenreShift from a mode fires its cue once and leaves the arc object untouched', async () => {
    let before: unknown
    let after: unknown
    let cuesBefore = 0
    let cuesAfter = 0
    let ctxRef: Parameters<ModeLoop>[1] | null = null
    const r = await runScene({
      production: {},
      turns: 8,
      beforeTurn: (i, ctx, director) => {
        ctxRef = ctx
        if (i !== 4) return
        before = director.getSceneArc()
        cuesBefore = ctx.getSceneAct ? 0 : 0
        ctx.production!.setGenreShift('musical', 4) // already due: begins now
        after = director.getSceneArc()
      },
    })
    expect(ctxRef).not.toBeNull()
    expect(after).toBe(before) // same object: not rebuilt, not reset
    void cuesBefore
    void cuesAfter
    const genreCues = r.cues.filter((c) => c.cue === 'act_break' && c.turn === 4)
    expect(genreCues).toHaveLength(1)
    expect(r.directorLines.filter((l) => l.includes('GENRE SHIFT: musical'))).toHaveLength(1)
  })

  it('a costume guest (no persona) stays the original behavior: no actor, no extra turns', async () => {
    const r = await runScene({
      production: { guestNpc: { name: 'Grandma', voiceAgentId: 'robot', entersAfterTurn: 2 } },
      turns: 10,
    })
    expect(r.guestEnters).toEqual([])
    expect(r.guestExits).toEqual([])
    expect(r.speakers).toEqual(Array.from({ length: 10 }, (_, i) => REGULARS[i % REGULARS.length]))
    expect(r.directorLines).toContain('🚪 Guest enters: Grandma')
    const robotSystems = r.engine.chatCalls
      .map((c) => c.messages.find((m) => m.role === 'system')!.content as string)
      .filter((_, i) => r.speakers[i] === 'robot')
    expect(robotSystems.some((s) => s.includes('you also play them'))).toBe(true)
  })

  it('exports the guest as a speaker without disturbing later attribution, and v1-style readers still load it', async () => {
    const r = await runScene({ production: GRAMMAR })
    const ep = r.exported!
    expect(ep).not.toBeNull()
    expect(ep.turns.map((t) => t.agentId)).toEqual(r.speakers)
    expect(ep.agents.map((a) => a.id)).toEqual([...REGULARS, GUEST_AGENT_ID])
    expect(ep.agents.find((a) => a.id === GUEST_AGENT_ID)?.name).toBe('Grandma')

    const reparsed = parseAndValidateEpisode(JSON.stringify(ep))
    expect(reparsed.ok).toBe(true)
    const snap = parseProductionSnapshot(reparsed.episode!.sceneState!.production)!
    expect(snap).toEqual(ep.sceneState!.production)
    expect(snap.version).toBe(2)
    expect(snap).toMatchObject({ guestEntered: true, guestExited: true, genreShiftFired: true })
    expect(snap.statuses).toHaveLength(1)
    expect(snap.arcs).toHaveLength(1)
    expect(snap.genreShift).toEqual({ genre: 'film noir', atTurn: 5 })
  })

  it('a scene without a guest exports exactly as before (five-agent roster)', async () => {
    const r = await runScene({ production: { statuses: GRAMMAR.statuses }, turns: 6 })
    expect(r.exported!.agents.map((a) => a.id)).toEqual(REGULARS)
    expect(r.exported!.turns.map((t) => t.agentId)).toEqual(r.speakers)
  })
})
