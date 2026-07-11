import { describe, it, expect } from 'vitest'
import {
  buildEpisodeFromHistory,
  historyToTurns,
  validateEpisode,
  parseAndValidateEpisode,
  episodeToMarkdown,
  episodeToPlainText,
  fromMemoryEpisode,
  EPISODE_FORMAT_VERSION,
} from '../../src/episode'
import type { Message } from '../../src/types/chat'

const agents = [
  { id: 'comedian', name: 'The Comedian', color: '#ff6b6b' },
  { id: 'philosopher', name: 'The Philosopher', color: '#4ecdc4' },
  { id: 'scientist', name: 'The Scientist', color: '#45b7d1' },
]

const sampleHistory: Message[] = [
  { role: 'user', content: 'You are participating in an improv comedy scene...' },
  { role: 'assistant', content: 'Welcome to the coffee shop of broken dreams!' },
  { role: 'user', content: '(Reply naturally to the last thing said)' },
  { role: 'assistant', content: 'Dreams are just unpaid internships for the soul.' },
  { role: 'user', content: 'Why is the latte so existential?' },
  { role: 'assistant', content: 'Because the milk is pasteurized with regret.' },
]

describe('historyToTurns', () => {
  it('maps assistants to rotating agents and keeps real user lines', () => {
    const turns = historyToTurns(sampleHistory, agents.map((a) => a.id))
    expect(turns).toHaveLength(4)
    expect(turns[0]).toMatchObject({
      agentId: 'comedian',
      text: 'Welcome to the coffee shop of broken dreams!',
    })
    expect(turns[1]).toMatchObject({
      agentId: 'philosopher',
      text: 'Dreams are just unpaid internships for the soul.',
    })
    expect(turns[2]).toMatchObject({
      agentId: 'user',
      text: 'Why is the latte so existential?',
    })
    expect(turns[3]).toMatchObject({
      agentId: 'scientist',
      text: 'Because the milk is pasteurized with regret.',
    })
    for (const t of turns) {
      expect(typeof t.ts).toBe('number')
      expect(Number.isFinite(t.ts)).toBe(true)
    }
  })

  it('skips internal continue prompts', () => {
    const turns = historyToTurns(
      [
        { role: 'user', content: '(Continue)' },
        { role: 'assistant', content: 'Hi' },
      ],
      ['comedian'],
    )
    expect(turns).toHaveLength(1)
    expect(turns[0].agentId).toBe('comedian')
  })
})

describe('buildEpisodeFromHistory', () => {
  it('builds a versioned portable episode', () => {
    const ep = buildEpisodeFromHistory({
      history: sampleHistory,
      agents,
      modelId: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
      sceneState: { title: 'Coffee Shop', mode: 'improv' },
      episodeId: 'test-ep-1',
    })
    expect(ep.version).toBe(EPISODE_FORMAT_VERSION)
    expect(ep.modelId).toContain('Hermes')
    expect(ep.agents).toHaveLength(3)
    expect(ep.agents[0]).not.toHaveProperty('systemPrompt')
    expect(ep.turns.length).toBeGreaterThan(0)
    expect(ep.sceneState?.title).toBe('Coffee Shop')
    expect(ep.episodeId).toBe('test-ep-1')
  })
})

describe('validateEpisode', () => {
  const valid = buildEpisodeFromHistory({
    history: sampleHistory,
    agents,
    modelId: 'test-model',
    sceneState: { title: 'T' },
  })

  it('accepts a well-formed episode', () => {
    const result = validateEpisode(valid)
    expect(result.ok).toBe(true)
    expect(result.episode?.turns.length).toBe(valid.turns.length)
  })

  it('rejects non-objects', () => {
    expect(validateEpisode(null).ok).toBe(false)
    expect(validateEpisode('nope').ok).toBe(false)
    expect(validateEpisode([]).ok).toBe(false)
  })

  it('rejects bad version', () => {
    const r = validateEpisode({ ...valid, version: 99 })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.code === 'bad_version')).toBe(true)
  })

  it('rejects empty turns', () => {
    const r = validateEpisode({ ...valid, turns: [] })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.code === 'empty_turns')).toBe(true)
  })

  it('rejects turns missing agentId', () => {
    const r = validateEpisode({
      ...valid,
      turns: [{ text: 'hi', ts: 1 }],
    })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.code === 'bad_turn_fields')).toBe(true)
  })

  it('rejects invalid agent entries', () => {
    const r = validateEpisode({
      ...valid,
      agents: [{ id: 'x' }],
    })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.code === 'bad_agents')).toBe(true)
  })

  it('strips unknown prototype pollution keys safely via map', () => {
    const dirty = {
      version: 1,
      modelId: null,
      agents: [{ id: 'a', name: 'A' }],
      turns: [{ agentId: 'a', text: 'hello', ts: 1, sfx: 'rimshot' }],
      __proto__: { polluted: true },
    }
    const r = validateEpisode(dirty)
    expect(r.ok).toBe(true)
    expect(r.episode!.turns[0].sfx).toBe('rimshot')
  })
})

describe('parseAndValidateEpisode', () => {
  it('parses JSON text', () => {
    const ep = buildEpisodeFromHistory({ history: sampleHistory, agents })
    const r = parseAndValidateEpisode(JSON.stringify(ep))
    expect(r.ok).toBe(true)
  })

  it('fails on garbage JSON', () => {
    const r = parseAndValidateEpisode('{not json')
    expect(r.ok).toBe(false)
  })
})

describe('transcript exporters', () => {
  it('renders markdown with speakers', () => {
    const ep = buildEpisodeFromHistory({
      history: sampleHistory,
      agents,
      sceneState: { title: 'Shop', description: 'Three friends' },
      modelId: 'm',
    })
    const md = episodeToMarkdown(ep)
    expect(md).toContain('# Shop')
    expect(md).toContain('The Comedian')
    expect(md).toContain('Audience')
  })

  it('renders plain text', () => {
    const ep = buildEpisodeFromHistory({ history: sampleHistory, agents })
    const txt = episodeToPlainText(ep)
    expect(txt).toContain('The Comedian:')
    expect(txt).not.toContain('**')
  })
})

describe('fromMemoryEpisode', () => {
  it('converts legacy MemoryManager blobs', () => {
    const legacy = {
      timestamp: '2026-01-01T00:00:00.000Z',
      history: sampleHistory,
      scenario: { type: 'improv', title: 'Legacy', description: 'Old save' },
    }
    const ep = fromMemoryEpisode(legacy, agents, 'model-x')
    expect(ep).not.toBeNull()
    expect(ep!.sceneState?.title).toBe('Legacy')
    expect(ep!.modelId).toBe('model-x')
    expect(ep!.turns.length).toBeGreaterThan(0)
  })

  it('passes through already-portable episodes', () => {
    const ep = buildEpisodeFromHistory({ history: sampleHistory, agents })
    const again = fromMemoryEpisode(ep, agents)
    expect(again?.version).toBe(EPISODE_FORMAT_VERSION)
  })
})
