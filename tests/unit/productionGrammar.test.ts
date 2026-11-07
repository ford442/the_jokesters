import { describe, expect, it } from 'vitest'
import {
  GUEST_AGENT_ID,
  GUEST_TURN_INTERVAL,
  PRODUCTION_SCHEMA_VERSION,
  arcEmotionTag,
  arcLabelForAct,
  consumeGenreFlip,
  createProductionCard,
  emotionTagFor,
  guestVoiceStyle,
  isGenreShiftActive,
  isGuestOnStage,
  isGuestTurn,
  parseEmotionArc,
  parseProductionSnapshot,
  recordProductionTurn,
  setGenreShift,
  snapshotProductionCard,
} from '../../src/Director/productionCard'
import type { ProductionCard, ProductionCardInput } from '../../src/Director/productionCard'
import { buildGuestAgent, compileProductionInstruction } from '../../src/Director/productionPrompt'
import type { SceneAct } from '../../src/Director/sceneArc'
import { extractDirectorTags } from '../../src/visuals/actorAnimations'
import { buildEpisodeFromHistory, parseAndValidateEpisode } from '../../src/episode'

const NAMES: Record<string, string> = {
  comedian: 'The Comedian',
  philosopher: 'The Philosopher',
  scientist: 'The Scientist',
  techBro: 'Chad',
  robot: 'Unit-734',
  [GUEST_AGENT_ID]: 'Grandma',
}
const nameOf = (id: string) => NAMES[id] ?? id

function advance(card: ProductionCard, turns: number): ProductionCard {
  let c = card
  for (let i = 0; i < turns; i++) c = recordProductionTurn(c, 'comedian', 'A line.').card
  return c
}

function compile(card: ProductionCard, agent: string, act: SceneAct | null = null) {
  return compileProductionInstruction(card, agent, { nameOf, act })
}

describe('status', () => {
  const input: ProductionCardInput = {
    statuses: [{ agentId: 'comedian', level: 'low', targetId: 'philosopher', public: true }],
  }

  it('tells low status to hedge and appeal, naming the boss', () => {
    const out = compile(createProductionCard(null, input), 'comedian')!
    expect(out).toContain('LOW status beneath The Philosopher')
    expect(out).toMatch(/hedge/)
    expect(out).toMatch(/appeal/)
  })

  it('tells high status to grant and interrupt', () => {
    const card = createProductionCard(null, { statuses: [{ agentId: 'philosopher', level: 'high', public: true }] })
    const out = compile(card, 'philosopher')!
    expect(out).toContain('HIGH status')
    expect(out).toMatch(/grant permission/)
    expect(out).toMatch(/interrupt/)
  })

  it('peer status is an equal-footing line, with or without a target', () => {
    const solo = compile(createProductionCard(null, { statuses: [{ agentId: 'robot', level: 'peer', public: true }] }), 'robot')!
    expect(solo).toContain('equal footing with everyone')
    const duo = compile(createProductionCard(null, { statuses: [{ agentId: 'robot', level: 'peer', targetId: 'scientist', public: true }] }), 'robot')!
    expect(duo).toContain('You and The Scientist are on equal footing')
  })

  it('mirrors a targeted status onto the target (the boss learns they are the boss)', () => {
    const card = createProductionCard(null, input)
    const boss = compile(card, 'philosopher')!
    expect(boss).toContain('HIGH status over The Comedian')
    // A bystander gets nothing.
    expect(compile(card, 'scientist')).toBeUndefined()
  })

  it('does not mirror when the target already has an explicit status toward that agent', () => {
    const card = createProductionCard(null, {
      statuses: [
        { agentId: 'comedian', level: 'low', targetId: 'philosopher', public: true },
        { agentId: 'philosopher', level: 'peer', targetId: 'comedian', public: true },
      ],
    })
    const out = compile(card, 'philosopher')!
    expect(out).toContain('equal footing')
    expect(out).not.toContain('HIGH status')
  })

  it('shares the relationship public/subtext flag', () => {
    const publicOut = compile(createProductionCard(null, input), 'comedian')!
    expect(publicOut).toContain('play it openly')
    const subtext = compile(
      createProductionCard(null, { statuses: [{ agentId: 'comedian', level: 'low', targetId: 'philosopher', public: false }] }),
      'comedian',
    )!
    expect(subtext).toContain('STATUS (subtext only)')
    expect(subtext).toContain('Never state it outright')
  })

  it('drops invalid entries and self-targets', () => {
    const card = createProductionCard(null, {
      statuses: [
        { agentId: 'comedian', level: 'boss' as never, public: true },
        { agentId: '', level: 'high', public: true },
        { agentId: 'robot', level: 'high', targetId: 'robot', public: true },
      ],
    })
    expect(card.statuses).toEqual([{ agentId: 'robot', level: 'high', public: true }])
  })
})

describe('emotional arc', () => {
  const card = createProductionCard(null, {
    arcs: [{ agentId: 'comedian', start: 'angry', mid: 'confused', end: 'pleased' }],
  })

  it('maps open / middle / close to start / mid / end with no judge in the loop', () => {
    const arc = card.arcs[0]
    expect(arcLabelForAct(arc, 'open')).toBe('angry')
    expect(arcLabelForAct(arc, 'middle')).toBe('confused')
    expect(arcLabelForAct(arc, 'close')).toBe('pleased')
  })

  it('injects exactly one EMOTION line per act, for the owning agent only', () => {
    expect(compile(card, 'comedian', 'open')).toContain('feeling angry')
    expect(compile(card, 'comedian', 'middle')).toContain('feeling confused')
    expect(compile(card, 'comedian', 'close')).toContain('feeling pleased')
    for (const act of ['open', 'middle', 'close'] as const) {
      expect(compile(card, 'comedian', act)!.match(/^EMOTION/gm)).toHaveLength(1)
      expect(compile(card, 'philosopher', act)).toBeUndefined()
    }
  })

  it('says nothing without an act (no scene arc → nothing to key off)', () => {
    expect(compile(card, 'comedian', null)).toBeUndefined()
  })

  it('passes through only labels the actors already understand, as [clip] tags', () => {
    expect(arcEmotionTag(card, 'comedian', 'open')).toBe('[angry]')
    expect(arcEmotionTag(card, 'comedian', 'middle')).toBe('[think]') // confused → think
    expect(arcEmotionTag(card, 'comedian', 'close')).toBe('[nod]') // pleased → nod
    expect(arcEmotionTag(card, 'philosopher', 'open')).toBeNull()
    expect(arcEmotionTag(card, 'comedian', null)).toBeNull()
    expect(emotionTagFor('Wistful')).toBeNull() // no clip → prompt line only
  })

  it('emits tags the actor tag parser really reads', () => {
    for (const label of ['angry', 'confused', 'pleased', 'laugh', 'shocked', 'bored', 'embarrassed', 'annoyed', 'excited', 'resigned']) {
      const tag = emotionTagFor(label)!
      expect(tag, label).toBeTruthy()
      expect(extractDirectorTags(tag).clips, label).toHaveLength(1)
    }
  })

  it('parses "a → b → c" and friends; two labels hold the start through the middle act', () => {
    expect(parseEmotionArc('robot', 'angry → confused → pleased')).toEqual({ agentId: 'robot', start: 'angry', mid: 'confused', end: 'pleased' })
    expect(parseEmotionArc('robot', 'angry -> confused > pleased')).toMatchObject({ start: 'angry', mid: 'confused', end: 'pleased' })
    expect(parseEmotionArc('robot', 'tense, relieved')).toEqual({ agentId: 'robot', start: 'tense', mid: 'tense', end: 'relieved' })
    expect(parseEmotionArc('robot', 'just one')).toBeNull()
    expect(parseEmotionArc('', 'a → b')).toBeNull()
  })

  it('ignores incomplete arcs on the card', () => {
    const bad = createProductionCard(null, { arcs: [{ agentId: 'robot', start: 'angry', mid: '', end: 'calm' }] })
    expect(bad.arcs).toEqual([])
  })
})

describe('genre shift', () => {
  const base = () => createProductionCard(null, { genreShift: { genre: 'film noir', atTurn: 3 } })

  it('adds one adaptation line from the turn it begins, not before', () => {
    expect(compile(advance(base(), 2), 'scientist')).toBeUndefined()
    const out = compile(advance(base(), 3), 'scientist')!
    expect(out.match(/^GENRE SHIFT/gm)).toHaveLength(1)
    expect(out).toContain('film noir')
    expect(compile(advance(base(), 7), 'scientist')).toContain('film noir')
  })

  it('flips exactly once, on the turn that reaches atTurn', () => {
    let card = base()
    const flips: number[] = []
    for (let i = 1; i <= 8; i++) {
      const r = recordProductionTurn(card, 'comedian', 'x')
      if (r.genreFlipped) flips.push(r.card.turnCount)
      card = r.card
    }
    expect(flips).toEqual([3])
  })

  it('a shift that applies from turn 0 never flips (nothing to cue)', () => {
    const card = createProductionCard(null, { genreShift: { genre: 'western', atTurn: 0 } })
    expect(isGenreShiftActive(card)).toBe(true)
    expect(card.genreShiftFired).toBe(true)
    expect(compile(card, 'robot')).toContain('western')
    expect(advance(card, 4).genreShift?.genre).toBe('western')
    expect(recordProductionTurn(card, 'robot', 'x').genreFlipped).toBe(false)
  })

  it('setGenreShift (mode / vote hook) re-arms the cue and replaces the old shift', () => {
    let card = advance(base(), 5) // already past atTurn=3 and fired
    expect(card.genreShiftFired).toBe(true)
    card = setGenreShift(card, 'musical', 7)
    expect(card.genreShift).toEqual({ genre: 'musical', atTurn: 7 })
    expect(card.genreShiftFired).toBe(false)
    expect(compile(card, 'robot')).toBeUndefined() // not yet
    const r2 = recordProductionTurn(card, 'robot', 'x').card
    expect(consumeGenreFlip(r2).flipped).toBe(false) // turn 6
    const r3 = recordProductionTurn(r2, 'robot', 'x')
    expect(r3.genreFlipped).toBe(true) // turn 7
    expect(compile(r3.card, 'robot')).toContain('musical')
  })

  it('an already-due shift reports its flip on consume, once', () => {
    const card = setGenreShift(advance(createProductionCard(null), 4), 'courtroom drama', 2)
    const first = consumeGenreFlip(card)
    expect(first.flipped).toBe(true)
    expect(consumeGenreFlip(first.card).flipped).toBe(false)
  })

  it('ignores a blank genre', () => {
    const card = createProductionCard(null)
    expect(setGenreShift(card, '  ', 2)).toBe(card)
  })
})

describe('guest', () => {
  const persona = 'a nosy grandmother who mistakes everyone for her grandchildren.'
  const input = (extra: Partial<NonNullable<ProductionCardInput['guestNpc']>> = {}): ProductionCardInput => ({
    guestNpc: { name: 'Grandma', persona, voiceStyle: 'F2', entersAfterTurn: 3, exitsAfterTurn: 8, ...extra },
  })

  it('is a sixth speaker only with a persona; a costume guest keeps the old behavior', () => {
    const costume = createProductionCard(null, { guestNpc: { name: 'Grandma', voiceAgentId: 'robot', entersAfterTurn: 0 } })
    const out = compile(costume, 'robot')!
    expect(out).toContain('you also play them')
    expect(compile(costume, 'comedian')).toContain('has just entered the scene. React to them.')
    expect(isGuestTurn(costume)).toBe(false) // no persona → never takes a turn of its own
  })

  it('needs a name and either a persona or a voice-lending agent', () => {
    expect(createProductionCard(null, { guestNpc: { name: 'X', entersAfterTurn: 1 } }).guestNpc).toBeUndefined()
    expect(createProductionCard(null, { guestNpc: { name: '  ', persona, entersAfterTurn: 1 } }).guestNpc).toBeUndefined()
    expect(createProductionCard(null, input()).guestNpc?.name).toBe('Grandma')
  })

  it('is on stage between entrance and exit, and only then', () => {
    let card = createProductionCard(null, input())
    const timeline: boolean[] = []
    for (let i = 0; i < 10; i++) {
      timeline.push(isGuestOnStage(card))
      card = recordProductionTurn(card, 'comedian', 'x').card
    }
    // After 3 completed turns → on; after 8 → off.
    expect(timeline).toEqual([false, false, false, true, true, true, true, true, false, false])
  })

  it('reports entrance and exit exactly once', () => {
    let card = createProductionCard(null, input())
    const events: string[] = []
    for (let i = 1; i <= 12; i++) {
      const r = recordProductionTurn(card, 'comedian', 'x')
      if (r.guestEntered) events.push(`enter@${r.card.turnCount}`)
      if (r.guestExited) events.push(`exit@${r.card.turnCount}`)
      card = r.card
    }
    expect(events).toEqual(['enter@3', 'exit@8'])
  })

  it('takes the floor on the entrance and every Nth turn while on stage, never after exit', () => {
    let card = createProductionCard(null, input({ exitsAfterTurn: 10 }))
    const guestTurns: number[] = []
    for (let i = 0; i < 14; i++) {
      if (isGuestTurn(card)) guestTurns.push(card.turnCount)
      card = recordProductionTurn(card, 'comedian', 'x').card
    }
    expect(GUEST_TURN_INTERVAL).toBe(3)
    expect(guestTurns).toEqual([3, 6, 9])
  })

  it('an exit at or before the entrance still leaves one turn on stage', () => {
    const card = createProductionCard(null, input({ entersAfterTurn: 4, exitsAfterTurn: 2 }))
    expect(card.guestNpc?.exitsAfterTurn).toBe(5)
  })

  it('compiles different lines for the guest, the regulars, and after exit', () => {
    const onStage = advance(createProductionCard(null, input()), 3)
    const guestLine = compile(onStage, GUEST_AGENT_ID)!
    expect(guestLine).toContain('You are Grandma')
    expect(guestLine).toContain(persona)
    const regular = compile(onStage, 'comedian')!
    expect(regular).toContain('Grandma is on stage')
    expect(regular).toContain('do not speak for them')
    expect(regular).not.toContain('you also play them')
    const gone = advance(onStage, 5)
    expect(compile(gone, GUEST_AGENT_ID)).toBeUndefined()
    expect(compile(gone, 'comedian')).toBeUndefined()
  })

  it('voice: own style, else the lending agent, else the default', () => {
    expect(guestVoiceStyle(createProductionCard(null, input()).guestNpc!)).toBe('F2')
    expect(guestVoiceStyle(createProductionCard(null, input({ voiceStyle: undefined, voiceAgentId: 'scientist' })).guestNpc!)).toBe('M1')
    expect(guestVoiceStyle(createProductionCard(null, input({ voiceStyle: undefined })).guestNpc!)).toBe('F1')
    // Only the four hosted Supertonic styles are accepted.
    expect(createProductionCard(null, input({ voiceStyle: 'Z9' as never })).guestNpc?.voiceStyle).toBeUndefined()
  })

  it('the guest Agent is thin: persona rides the per-turn note, not the system prompt', () => {
    const agent = buildGuestAgent(createProductionCard(null, input()).guestNpc!)
    expect(agent.id).toBe(GUEST_AGENT_ID)
    expect(agent.name).toBe('Grandma')
    expect(agent.systemPrompt).not.toContain(persona)
  })
})

describe('per-act output for a status + arc + guest scene', () => {
  const card0 = createProductionCard(12, {
    statuses: [{ agentId: 'comedian', level: 'low', targetId: 'philosopher', public: true }],
    arcs: [{ agentId: 'comedian', start: 'angry', mid: 'confused', end: 'pleased' }],
    guestNpc: { name: 'Grandma', persona: 'a nosy grandmother.', voiceStyle: 'F2', entersAfterTurn: 3, exitsAfterTurn: 8 },
  })

  it('produces different compileProductionInstruction output in each act', () => {
    const open = compile(card0, 'comedian', 'open')!
    const middle = compile(advance(card0, 4), 'comedian', 'middle')!
    const close = compile(advance(card0, 9), 'comedian', 'close')!
    expect(new Set([open, middle, close]).size).toBe(3)
    // Status is constant; the arc label and guest line are what move.
    for (const out of [open, middle, close]) expect(out).toContain('LOW status beneath The Philosopher')
    expect(open).toContain('feeling angry')
    expect(open).not.toContain('Grandma')
    expect(middle).toContain('feeling confused')
    expect(middle).toContain('Grandma is on stage')
    expect(close).toContain('feeling pleased')
    expect(close).not.toContain('Grandma') // exited at turn 8
  })
})

describe('episode snapshot v2', () => {
  const full = (): ProductionCard => {
    let card = createProductionCard(12, {
      relationships: [{ a: 'comedian', b: 'philosopher', label: 'exes', public: false }],
      statuses: [{ agentId: 'comedian', level: 'low', targetId: 'philosopher', public: false }],
      arcs: [{ agentId: 'robot', start: 'tense', mid: 'tense', end: 'relieved' }],
      genreShift: { genre: 'film noir', atTurn: 2 },
      secrets: [{ agentId: 'comedian', goal: 'steer to pickles' }],
      guestNpc: { name: 'Grandma', persona: 'a nosy grandmother.', voiceStyle: 'F2', entersAfterTurn: 1, exitsAfterTurn: 5 },
    })
    card = advance(card, 6)
    return card
  }

  it('bumps the version and round-trips every new field through episode JSON', () => {
    expect(PRODUCTION_SCHEMA_VERSION).toBe(2)
    const card = full()
    const snapshot = snapshotProductionCard(card)
    expect(snapshot.version).toBe(2)
    expect(snapshot.guestExited).toBe(true)
    expect(snapshot.genreShiftFired).toBe(true)
    const episode = buildEpisodeFromHistory({
      history: [{ role: 'assistant', content: 'hi' }],
      agents: [{ id: 'comedian', name: 'The Comedian' }],
      sceneState: { title: 'T', production: snapshot },
    })
    const parsed = parseAndValidateEpisode(JSON.stringify(episode))
    expect(parsed.ok).toBe(true)
    const back = parseProductionSnapshot(parsed.episode!.sceneState!.production)
    expect(back).toEqual(snapshot)
    expect(back?.guestNpc).toMatchObject({ persona: 'a nosy grandmother.', voiceStyle: 'F2', exitsAfterTurn: 5 })
  })

  it('still loads an old v1 snapshot, with the new fields defaulted', () => {
    const v1 = {
      version: 1,
      beat: 'main',
      turnBudget: 10,
      coldOpenTurns: 1,
      tagTurns: 1,
      turnCount: 4,
      relationships: [{ a: 'comedian', b: 'robot', label: 'rivals', public: true }],
      secrets: [{ agentId: 'robot', goal: 'steer to pickles', hits: 1, achieved: true }],
      guestNpc: { name: 'Grandma', voiceAgentId: 'robot', entersAfterTurn: 2 },
      guestEntered: true,
    }
    const parsed = parseProductionSnapshot(v1)!
    expect(parsed).not.toBeNull()
    expect(parsed.version).toBe(2)
    expect(parsed.statuses).toEqual([])
    expect(parsed.arcs).toEqual([])
    expect(parsed.genreShift).toBeUndefined()
    expect(parsed.genreShiftFired).toBe(false)
    expect(parsed.guestExited).toBe(false)
    expect(parsed.guestNpc).toEqual({ name: 'Grandma', voiceAgentId: 'robot', entersAfterTurn: 2 })
    expect(parsed.relationships).toHaveLength(1)
    expect(parsed.secrets[0]).toMatchObject({ achieved: true, hits: 1 })
  })

  it('rejects unknown versions and malformed beats', () => {
    expect(parseProductionSnapshot({ version: 3, beat: 'main' })).toBeNull()
    expect(parseProductionSnapshot({ version: 2, beat: 'nope' })).toBeNull()
    expect(parseProductionSnapshot(null)).toBeNull()
  })

  it('tolerates garbage in the new fields instead of throwing', () => {
    const parsed = parseProductionSnapshot({
      version: 2,
      beat: 'main',
      statuses: [null, 7, { agentId: 'robot', level: 'wild' }, { agentId: 'robot', level: 'high', public: true }],
      arcs: 'nope',
      genreShift: { genre: 42 },
      guestNpc: { name: 'G', persona: 5 },
    })!
    expect(parsed.statuses).toEqual([{ agentId: 'robot', level: 'high', public: true }])
    expect(parsed.arcs).toEqual([])
    expect(parsed.genreShift).toBeUndefined()
    expect(parsed.guestNpc).toBeUndefined()
  })
})
