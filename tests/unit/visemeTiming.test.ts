import { describe, expect, it } from 'vitest'
import { approximatePhonemes, layoutVisemes, predictTimedVisemes } from '../../src/audio/visemeTiming'
import { VisemePredictor } from '../../src/audio/VisemePredictor'

describe('visemeTiming', () => {
  it('lays visemes out contiguously and sums to exactly the audio length', () => {
    for (const [text, dur] of [
      ['hello there, my friend. how are you?', 2.7],
      ['no', 0.4],
      ['The quick brown fox jumps over the lazy dog!', 3.1],
    ] as const) {
      const v = predictTimedVisemes(text, dur)
      expect(v.length).toBeGreaterThan(0)
      expect(v[0].startTime).toBe(0)
      for (let i = 1; i < v.length; i++) {
        expect(v[i].startTime).toBeCloseTo(v[i - 1].startTime + v[i - 1].duration, 9)
      }
      const last = v[v.length - 1]
      expect(last.startTime + last.duration).toBeCloseTo(dur, 9)
    }
  })

  it('puts silence between words and at punctuation, but not trailing', () => {
    const p = approximatePhonemes('hi there, friend.')
    expect(p).toContain('REST')
    expect(p).toContain('PAUSE_S')
    expect(p[p.length - 1]).not.toMatch(/REST|PAUSE/)
    const v = predictTimedVisemes('hi there, friend.', 2)
    const pause = v.find((x) => x.phoneme === 'PAUSE_S')!
    expect(pause.mouthShape).toBe('REST')
    expect(pause.intensity).toBe(0)
  })

  it('gives vowels more time than consonants and maps m/b/p to closed lips', () => {
    const v = layoutVisemes(['M', 'AA', 'B'], 3)
    expect(v[1].duration).toBeGreaterThan(v[0].duration)
    expect(v[0].mouthShape).toBe('M_B_P')
    expect(v[1].mouthShape).toBe('AA_AH')
  })

  it('handles empty / non-speech / zero-length input', () => {
    expect(predictTimedVisemes('', 1)).toEqual([])
    expect(predictTimedVisemes('!!! ...', 1)).toEqual([])
    expect(predictTimedVisemes('hello', 0)).toEqual([])
  })

  it('VisemePredictor delegates to the shared layout (same timeline as the worker)', () => {
    const predictor = new VisemePredictor()
    const seq = predictor.predictVisemes('what a joke', 1.5)
    expect(seq.totalDuration).toBeCloseTo(1.5, 9)
    expect(seq.visemes).toEqual(predictTimedVisemes('what a joke', 1.5))
    expect(seq.lookaheadVisemes).toHaveLength(3)
  })
})
