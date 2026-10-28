import { describe, expect, it } from 'vitest'
import { BlinkController, clipToEmotion, EmotionState, extractEmotionTag, VRM_EMOTIONS } from '../../src/visuals/expressions'
import type { ReactionClip } from '../../src/visuals/actorAnimations'

const ALL_CLIPS: ReactionClip[] = ['laugh', 'think', 'gasp', 'angry', 'deadpan', 'facepalm', 'eyeroll', 'nod', 'bounce', 'shrug']

describe('clipToEmotion', () => {
  it('covers every reaction clip with a valid VRM emotion or neutral', () => {
    for (const clip of ALL_CLIPS) {
      const cue = clipToEmotion(clip)
      expect(cue.emotion === null || VRM_EMOTIONS.includes(cue.emotion)).toBe(true)
      expect(cue.intensity).toBeGreaterThanOrEqual(0)
      expect(cue.intensity).toBeLessThanOrEqual(1)
    }
  })

  it('maps the headline reactions', () => {
    expect(clipToEmotion('laugh').emotion).toBe('happy')
    expect(clipToEmotion('gasp').emotion).toBe('surprised')
    expect(clipToEmotion('angry').emotion).toBe('angry')
    expect(clipToEmotion('facepalm').emotion).toBe('sad')
    expect(clipToEmotion('deadpan').emotion).toBeNull()
  })
})

describe('extractEmotionTag', () => {
  it('finds explicit tags, case-insensitively', () => {
    expect(extractEmotionTag('well [Happy] then')).toBe('happy')
    expect(extractEmotionTag('[sad]')).toBe('sad')
    expect(extractEmotionTag('no tags here')).toBeNull()
    expect(extractEmotionTag('[laugh]')).toBeNull() // clips are handled by actorAnimations
  })
})

describe('EmotionState', () => {
  it('eases in, holds, then decays to neutral', () => {
    const s = new EmotionState()
    s.set('happy', 1, 0.5)
    let w = s.update(1 / 60)
    expect(w.happy).toBeGreaterThan(0)
    expect(w.happy).toBeLessThan(0.5) // not a pop
    for (let i = 0; i < 20; i++) w = s.update(1 / 60)
    expect(w.happy).toBeGreaterThan(0.9)
    for (let i = 0; i < 400; i++) w = s.update(1 / 60)
    expect(w.happy).toBe(0)
  })

  it('crossfades between emotions', () => {
    const s = new EmotionState()
    s.set('happy', 1, 10)
    for (let i = 0; i < 60; i++) s.update(1 / 60)
    s.set('angry', 1, 10)
    let w = s.update(1 / 60)
    expect(w.happy).toBeGreaterThan(0.5)
    for (let i = 0; i < 90; i++) w = s.update(1 / 60)
    expect(w.angry).toBeGreaterThan(0.9)
    expect(w.happy).toBeLessThan(0.05)
  })
})

describe('BlinkController', () => {
  function run(seed: number, seconds: number) {
    let x = seed
    const rand = () => (x = (x * 16807) % 2147483647) / 2147483647
    const b = new BlinkController(rand)
    const dt = 1 / 60
    let blinks = 0
    let wasBlinking = false
    let peak = 0
    for (let t = 0; t < seconds; t += dt) {
      const w = b.update(dt)
      peak = Math.max(peak, w)
      expect(w).toBeGreaterThanOrEqual(0)
      expect(w).toBeLessThanOrEqual(1)
      if (b.isBlinking() && !wasBlinking) blinks++
      wasBlinking = b.isBlinking()
    }
    return { blinks, peak }
  }

  it('blinks irregularly, fully closing, every few seconds', () => {
    const { blinks, peak } = run(42, 60)
    expect(blinks).toBeGreaterThan(8) // ~every 2–6s (+ double blinks)
    expect(blinks).toBeLessThan(35)
    expect(peak).toBeGreaterThan(0.95)
  })

  it('holds the eyes open while suppressed', () => {
    const b = new BlinkController(() => 0, 0.16)
    let closed = 0
    for (let i = 0; i < 60 * 10; i++) closed += b.update(1 / 60, true)
    expect(closed).toBe(0)
  })
})
