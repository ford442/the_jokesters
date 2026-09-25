import { describe, expect, it } from 'vitest'
import {
  computeBeat,
  createProductionCard,
  deriveBeatTiming,
  goalKeywords,
  parseProductionSnapshot,
  recordProductionTurn,
  setProductionTurnBudget,
  snapshotProductionCard,
  withDefaultRelationships,
} from '../../src/Director/productionCard'
import type { ProductionCard } from '../../src/Director/productionCard'
import { compileProductionInstruction, mergeHiddenInstructions } from '../../src/Director/productionPrompt'
import { buildEpisodeFromHistory, parseAndValidateEpisode } from '../../src/episode'
import { buildProductionInput } from '../../src/app/productionCardUi'

function run(card: ProductionCard, turns: number, agentId = 'comedian', text = 'A line.') {
  const beats: string[] = [card.beat]
  let c = card
  for (let i = 0; i < turns; i++) {
    c = recordProductionTurn(c, agentId, text).card
    beats.push(c.beat)
  }
  return { card: c, beats }
}

describe('production card beat timing', () => {
  it('open-ended scenes have no cold open or tag', () => {
    expect(deriveBeatTiming(null)).toEqual({ coldOpenTurns: 0, tagTurns: 0 })
    const { beats } = run(createProductionCard(null), 30)
    expect(new Set(beats)).toEqual(new Set(['main']))
  })

  it('short budgets skip the cold open but still tag the last turn', () => {
    expect(deriveBeatTiming(8)).toEqual({ coldOpenTurns: 0, tagTurns: 1 })
    const { beats } = run(createProductionCard(8), 8)
    expect(beats.slice(0, 7).every((b) => b === 'main')).toBe(true)
    expect(beats[7]).toBe('tag')
  })

  it('long budgets get a 1-turn cold open, a main sketch, and a 1-turn tag', () => {
    const card = createProductionCard(10)
    expect(card.beat).toBe('cold_open')
    const { beats } = run(card, 9)
    expect(beats[0]).toBe('cold_open')
    expect(beats.slice(1, 9).every((b) => b === 'main')).toBe(true)
    expect(beats[9]).toBe('tag')
    expect(computeBeat(9, card)).toBe('tag')
  })

  it('reports beat changes exactly on transitions', () => {
    let card = createProductionCard(10)
    const changes: string[] = []
    for (let i = 0; i < 10; i++) {
      const r = recordProductionTurn(card, 'comedian', 'x')
      if (r.beatChanged) changes.push(r.card.beat)
      card = r.card
    }
    expect(changes).toEqual(['main', 'tag'])
  })

  it('setProductionTurnBudget keeps content and re-derives the beat', () => {
    const card = createProductionCard(null, { relationships: [{ a: 'comedian', b: 'robot', label: 'rivals', public: true }] })
    const updated = setProductionTurnBudget(card, 12)
    expect(updated.beat).toBe('cold_open')
    expect(updated.relationships).toHaveLength(1)
  })

  it('mode default relationships never override user-supplied ones', () => {
    const user = createProductionCard(null, { relationships: [{ a: 'comedian', b: 'robot', label: 'exes', public: true }] })
    expect(withDefaultRelationships(user, [{ a: 'scientist', b: 'techBro', label: 'boss-intern', public: true }]).relationships[0].label).toBe('exes')
    const empty = createProductionCard(null)
    expect(withDefaultRelationships(empty, [{ a: 'scientist', b: 'techBro', label: 'boss-intern', public: true }]).relationships[0].label).toBe('boss-intern')
  })
})

describe('secrets + guest', () => {
  it('tracks a secret only when its owner mentions a goal keyword', () => {
    expect(goalKeywords('steer to pickles')).toEqual(['pickle'])
    const card = createProductionCard(null, { secrets: [{ agentId: 'comedian', goal: 'steer to pickles' }] })
    const other = recordProductionTurn(card, 'philosopher', 'I love pickles')
    expect(other.secretsAchieved).toEqual([])
    const miss = recordProductionTurn(card, 'comedian', 'Nothing relevant')
    expect(miss.card.secrets[0].achieved).toBe(false)
    const hit = recordProductionTurn(card, 'comedian', 'Speaking of Pickles...')
    expect(hit.secretsAchieved).toEqual(['comedian'])
    expect(hit.card.secrets[0]).toMatchObject({ achieved: true, hits: 1 })
    expect(recordProductionTurn(hit.card, 'comedian', 'pickle again').secretsAchieved).toEqual([])
  })

  it('guest enters after the configured turn', () => {
    const card = createProductionCard(null, { guestNpc: { name: 'Grandma', voiceAgentId: 'robot', entersAfterTurn: 2 } })
    const one = recordProductionTurn(card, 'comedian', 'a')
    expect(one.guestEntered).toBe(false)
    const two = recordProductionTurn(one.card, 'comedian', 'b')
    expect(two.guestEntered).toBe(true)
    expect(compileProductionInstruction(two.card, 'robot')).toContain('you also play them')
    expect(compileProductionInstruction(two.card, 'comedian')).toContain('Grandma has just entered')
  })
})

describe('compileProductionInstruction', () => {
  const names: Record<string, string> = { comedian: 'The Comedian', philosopher: 'The Philosopher', scientist: 'The Scientist' }
  const nameOf = (id: string) => names[id] ?? id

  it('gives a relationship to both agents and nobody else', () => {
    const card = createProductionCard(null, { relationships: [{ a: 'comedian', b: 'philosopher', label: 'exes', public: true }] })
    expect(compileProductionInstruction(card, 'comedian', { nameOf })).toContain('You and The Philosopher are exes')
    expect(compileProductionInstruction(card, 'philosopher', { nameOf })).toContain('You and The Comedian are exes')
    expect(compileProductionInstruction(card, 'scientist', { nameOf })).toBeUndefined()
  })

  it('non-public relationships are subtext only', () => {
    const card = createProductionCard(null, { relationships: [{ a: 'comedian', b: 'philosopher', label: 'exes', public: false }] })
    expect(compileProductionInstruction(card, 'comedian', { nameOf })).toMatch(/subtext only.*Never state it outright/s)
  })

  it('secret objectives go only to their owner', () => {
    const card = createProductionCard(null, { secrets: [{ agentId: 'scientist', goal: 'steer to pickles' }] })
    expect(compileProductionInstruction(card, 'scientist')).toContain('SECRET OBJECTIVE: steer to pickles')
    expect(compileProductionInstruction(card, 'comedian')).toBeUndefined()
  })

  it('tag beat carries the close-act instruction', () => {
    const card = setProductionTurnBudget(createProductionCard(null), 3)
    const tagged = run(card, 2).card
    expect(tagged.beat).toBe('tag')
    const out = compileProductionInstruction(tagged, 'comedian', { closeActInstruction: '(SYSTEM: wrap up)' })
    expect(out).toContain('BEAT: TAG')
    expect(out).toContain('(SYSTEM: wrap up)')
  })

  it('merges hidden instructions, dropping empties', () => {
    expect(mergeHiddenInstructions(undefined, '', 'a', null, 'b')).toBe('a\nb')
    expect(mergeHiddenInstructions(undefined, ' ')).toBeUndefined()
  })
})

describe('episode round-trip', () => {
  it('production snapshot survives JSON export → import', () => {
    let card = createProductionCard(10, {
      relationships: [{ a: 'comedian', b: 'philosopher', label: 'exes', public: false }],
      secrets: [{ agentId: 'comedian', goal: 'steer to pickles', successHint: 'say pickles' }],
      guestNpc: { name: 'Grandma', voiceAgentId: 'robot', entersAfterTurn: 1 },
    })
    card = recordProductionTurn(card, 'comedian', 'pickles!').card
    const snapshot = snapshotProductionCard(card)
    const episode = buildEpisodeFromHistory({
      history: [{ role: 'assistant', content: 'hi' }],
      agents: [{ id: 'comedian', name: 'The Comedian' }],
      sceneState: { title: 'T', production: snapshot },
    })
    const parsed = parseAndValidateEpisode(JSON.stringify(episode))
    expect(parsed.ok).toBe(true)
    expect(parseProductionSnapshot(parsed.episode!.sceneState!.production)).toEqual(snapshot)
  })

  it('rejects unknown snapshot versions', () => {
    expect(parseProductionSnapshot({ version: 99, beat: 'main' })).toBeNull()
    expect(parseProductionSnapshot({ version: 1, beat: 'nope' })).toBeNull()
  })
})

describe('improv panel input', () => {
  const base = { relA: 'comedian', relB: 'philosopher', relLabel: '', relPublic: true, secretAgent: 'robot', secretGoal: '' }
  it('returns undefined when nothing is filled in', () => {
    expect(buildProductionInput(base)).toBeUndefined()
  })
  it('ignores self-relationships and builds both fields', () => {
    expect(buildProductionInput({ ...base, relB: 'comedian', relLabel: 'exes' })).toBeUndefined()
    expect(buildProductionInput({ ...base, relLabel: ' exes ', relPublic: false, secretGoal: 'steer to pickles' })).toEqual({
      relationships: [{ a: 'comedian', b: 'philosopher', label: 'exes', public: false }],
      secrets: [{ agentId: 'robot', goal: 'steer to pickles' }],
    })
  })
})
