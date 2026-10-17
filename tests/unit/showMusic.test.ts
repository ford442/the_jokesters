import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModeLoop } from '../../src/Director/modes/ModeContext'
import type { ModeCatalogEntry } from '../../src/Director/modes/registry'

const testModeDef: ModeCatalogEntry = { id: 'test-mode', title: 'Test Mode', category: 'improv', description: 'cue test' }
let testModeLoop: ModeLoop = async () => {}
vi.mock('../../src/Director/modes/registry', () => ({
  getMode: vi.fn(() => testModeDef),
  loadModeLoop: vi.fn(async () => testModeLoop),
}))

import { Director } from '../../src/Director/Director'
import type { DirectorCallbacks } from '../../src/Director/Director'
import { GroupChatManager } from '../../src/GroupChatManager'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import { agents } from '../../src/config/agents'
import type { ShowCue } from '../../src/audio/showCues'
import { buildCueScore, cueDuration, degreeHz, midiToHz } from '../../src/audio/cueScores'
import { MUSIC_PALETTES, paletteForKit } from '../../src/audio/musicPalettes'
import { SHOW_CUES } from '../../src/audio/showCues'
import { DuckEnvelope } from '../../src/audio/ducking'
import { CueGate } from '../../src/audio/ShowMusic'
import { KIT_MUSIC_PALETTE, STAGE_KIT_IDS } from '../../src/visuals/stageKitIds'
import { AudienceFeedbackDriver } from '../../src/comedy/audienceFeedback'

describe('cue scores', () => {
  it('every cue exists for every palette, with sane timing, gain and pitch', () => {
    for (const palette of Object.values(MUSIC_PALETTES)) {
      for (const cue of SHOW_CUES) {
        const score = buildCueScore(cue, palette)
        expect(score.length, `${palette.id}/${cue}`).toBeGreaterThan(2)
        for (const n of score) {
          expect(n.time).toBeGreaterThanOrEqual(0)
          expect(n.dur).toBeGreaterThan(0)
          expect(n.gain).toBeGreaterThan(0)
          expect(n.gain).toBeLessThanOrEqual(1)
          expect(n.freq).toBeGreaterThan(20)
          expect(n.freq).toBeLessThan(12000)
        }
        // Stingers stay short enough to never become a bed over dialogue.
        expect(cueDuration(score), `${palette.id}/${cue}`).toBeLessThan(7)
        // sorted for scheduling
        for (let i = 1; i < score.length; i++) expect(score[i].time).toBeGreaterThanOrEqual(score[i - 1].time)
      }
    }
  })

  it('palettes sound different (cold open pitches/timing differ per kit)', () => {
    const sig = (id: keyof typeof MUSIC_PALETTES) =>
      buildCueScore('cold_open', MUSIC_PALETTES[id]).map((n) => `${n.time.toFixed(2)}:${Math.round(n.freq)}`).join(',')
    const all = new Set((['house', 'talkshow', 'court', 'news'] as const).map(sig))
    expect(all.size).toBe(4)
  })

  it('bit_died is a four-note chromatic descent ending on a long wobbly note', () => {
    const score = buildCueScore('bit_died', MUSIC_PALETTES.house)
    const tones = score.filter((n) => n.voice === 'tone')
    expect(tones).toHaveLength(4)
    for (let i = 1; i < tones.length; i++) expect(tones[i].freq).toBeLessThan(tones[i - 1].freq)
    expect(tones[3].dur).toBeGreaterThan(tones[0].dur * 2)
    expect(tones[3].vibrato).toBeDefined()
  })

  it('degreeHz wraps scale degrees across octaves', () => {
    const p = MUSIC_PALETTES.house
    expect(degreeHz(p, 0)).toBeCloseTo(midiToHz(p.rootMidi))
    expect(degreeHz(p, p.scale.length)).toBeCloseTo(midiToHz(p.rootMidi + 12))
    expect(degreeHz(p, -1)).toBeLessThan(degreeHz(p, 0))
  })
})

describe('palette per stage kit', () => {
  it('every kit has a palette, and unknown kits get the house band', () => {
    for (const kit of STAGE_KIT_IDS) expect(MUSIC_PALETTES[KIT_MUSIC_PALETTE[kit]]).toBeDefined()
    expect(paletteForKit('talkshow').id).toBe('talkshow')
    expect(paletteForKit('court').id).toBe('court')
    expect(paletteForKit('news').id).toBe('news')
    expect(paletteForKit('void').id).toBe('house')
    expect(paletteForKit('../../etc').id).toBe('house')
    expect(paletteForKit(null).id).toBe('house')
  })
})

describe('DuckEnvelope (music never masks TTS)', () => {
  const run = (env: DuckEnvelope, level: number, seconds: number) => {
    let g = 1
    for (let t = 0; t < seconds; t += 0.03) g = env.update(level, 0.03)
    return g
  }

  it('ducks quickly under speech and recovers after a hold', () => {
    const env = new DuckEnvelope({ duckGain: 0.2 })
    expect(run(env, 0.4, 0.5)).toBeLessThan(0.25)
    // a short breath between words does not pump the music back up
    expect(run(env, 0, 0.15)).toBeLessThan(0.3)
    // after the hold + release it is back at full
    expect(run(env, 0, 2.5)).toBeGreaterThan(0.95)
  })

  it('attack is faster than release', () => {
    const a = new DuckEnvelope()
    const down = run(a, 0.5, 0.12)
    const b = new DuckEnvelope()
    run(b, 0.5, 1)
    run(b, 0, 0.35) // past hold
    const up = run(b, 0, 0.12)
    expect(1 - down).toBeGreaterThan(up - run(new DuckEnvelope(), 0.5, 1))
  })
})

describe('CueGate', () => {
  it('drops structural cues that stack, always plays the tag and bit_died', () => {
    const g = new CueGate(4000)
    expect(g.shouldPlay('cold_open', 0)).toBe(true)
    expect(g.shouldPlay('act_break', 1000)).toBe(false)
    expect(g.shouldPlay('tag', 1500)).toBe(true)
    expect(g.shouldPlay('bit_died', 1600)).toBe(true)
    expect(g.shouldPlay('act_break', 9000)).toBe(true)
  })
})

describe('AudienceFeedbackDriver → bit died', () => {
  it('fires onBitDied on the boo path only, and honors rate limiting', () => {
    let t = 0
    const onBitDied = vi.fn()
    const d = new AudienceFeedbackDriver({ triggerReaction: () => {}, playSfx: () => {}, onBitDied }, 2500, () => t)
    d.handleEvent({ reaction: 'groan', sfx: 'boo', score: 1 })
    expect(onBitDied).toHaveBeenCalledTimes(1)
    t = 100
    d.handleEvent({ reaction: 'groan', sfx: 'boo', score: 1 }) // rate-limited
    expect(onBitDied).toHaveBeenCalledTimes(1)
    t = 10_000
    d.handleEvent({ reaction: 'cheer', sfx: 'applause', score: 9 })
    d.handleEvent({ reaction: 'neutral', sfx: null, score: 5 })
    expect(onBitDied).toHaveBeenCalledTimes(1)
  })
})

describe('Director show cues', () => {
  beforeEach(() => { ;(globalThis as unknown as { document?: unknown }).document = { getElementById: () => null } })
  afterEach(() => { delete (globalThis as unknown as { document?: unknown }).document; vi.restoreAllMocks() })

  it('emits cold open → act breaks → tag over a 10-turn scene (no double cue on a beat change)', async () => {
    const cues: ShowCue[] = []
    testModeLoop = async (_s, ctx) => {
      ctx.production!.setTurnBudget(10)
      for (let i = 0; i < 10 && ctx.isRunning(); i++) await ctx.processTurn('(Reply naturally to the last thing said)')
    }
    const manager = new GroupChatManager(agents.map((a) => ({ ...a })))
    const engine = new MockLLMEngine('mock', 'Mock')
    await engine.initialize({ id: 'mock-model', name: 'Mock', vram_required_MB: 0, context_window_size: 4096 })
    engine.queueResponses(...Array.from({ length: 12 }, (_, i) => `Line number ${i + 1}.`))
    manager.attachSessionForTests(engine, 'mock')

    const callbacks: DirectorCallbacks = {
      onMessage: () => {},
      onSpeak: async () => {},
      onTurnStart: async () => {},
      onTurnEnd: async () => {},
      onError: (e) => { throw e },
      onSceneStop: () => {},
      getSeed: () => undefined,
      onShowCue: (c) => cues.push(c),
    }
    const mem = { setSyncStatusCallback: () => {}, fetchPreviousEpisodeSummaries: async () => {}, searchLocalEpisodes: async () => [], searchFetchedSummaries: async () => [], saveEpisode: () => {}, saveEpisodeScriptToCloud: async () => {} } as never
    const director = new Director(manager, callbacks, mem)
    await director.playScenario({ type: 'improv', title: 'Cues', description: 'd', config: { chaosLevel: 0 } })

    // cold open theme → bumper into act 2 (open→middle) → bumper into act 3 (middle→close) → tag.
    // Entering the main sketch and the forced close at the tag beat add no extra cues.
    expect(cues).toEqual(['cold_open', 'act_break', 'act_break', 'tag'])
  })
})
