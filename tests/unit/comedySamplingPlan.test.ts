import { describe, expect, it } from 'vitest'
import {
  buildComedySamplingPlan,
  derivePacing,
  DEAD_PRESENCE_PENALTY,
  PEAK_PRESENCE_PENALTY,
} from '../../src/comedy/comedySamplingPlan'
import { applyComedySamplingPlan } from '../../src/comedy/comedyModeHelpers'

describe('buildComedySamplingPlan', () => {
  it('peak vs dead callbacks produce different generation options', () => {
    const peak = buildComedySamplingPlan({ act: 'middle', pacing: 'setup', callback: { status: 'peak', snippet: 'the haunted toaster' } })
    const dead = buildComedySamplingPlan({ act: 'middle', pacing: 'setup', callback: { status: 'dead', snippet: 'the haunted toaster' } })
    expect(peak.presence_penalty).toBe(PEAK_PRESENCE_PENALTY)
    expect(dead.presence_penalty).toBe(DEAD_PRESENCE_PENALTY)
    expect(dead.presence_penalty!).toBeGreaterThan(peak.presence_penalty!)
    expect(peak.promptSuffix).toMatch(/haunted toaster/)
    expect(dead.promptSuffix).toMatch(/Do NOT reuse/)
  })

  it('close act uses a tighter token budget than open act', () => {
    const open = buildComedySamplingPlan({ act: 'open', pacing: 'setup', callback: null })
    const close = buildComedySamplingPlan({ act: 'close', pacing: 'punchline', callback: null })
    expect(close.max_tokens).toBeLessThan(open.max_tokens)
    expect(open.temperatureDelta).toBeGreaterThan(close.temperatureDelta)
  })

  it('punchline is cooler and shorter than setup', () => {
    const setup = buildComedySamplingPlan({ act: 'middle', pacing: 'setup', callback: null })
    const punch = buildComedySamplingPlan({ act: 'middle', pacing: 'punchline', callback: null })
    expect(punch.max_tokens).toBeLessThan(setup.max_tokens)
    expect(punch.temperatureDelta).toBeLessThan(setup.temperatureDelta)
    expect(punch.stop.length).toBeGreaterThan(0)
  })

  it('derivePacing alternates in the middle act', () => {
    expect(derivePacing('open', 3)).toBe('setup')
    expect(derivePacing('close', 2)).toBe('punchline')
    expect(derivePacing('middle', 2)).toBe('setup')
    expect(derivePacing('middle', 3)).toBe('punchline')
  })
})

describe('applyComedySamplingPlan', () => {
  it('keeps the tighter maxTokens and merges hidden instructions', () => {
    const plan = buildComedySamplingPlan({ act: 'close', pacing: 'punchline', callback: null })
    const merged = applyComedySamplingPlan(plan, { maxTokens: 40, hiddenInstruction: 'Be a pirate.' })!
    expect(merged.maxTokens).toBe(40)
    expect(merged.hiddenInstruction).toMatch(/pirate[\s\S]*Wrap it up/)
    expect(merged.sampling?.temperatureDelta).toBe(plan.temperatureDelta)
  })

  it('is a passthrough without a plan (comedy off)', () => {
    const base = { maxTokens: 100 }
    expect(applyComedySamplingPlan(null, base)).toBe(base)
  })
})
