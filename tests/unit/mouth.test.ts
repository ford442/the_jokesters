import { describe, expect, it } from 'vitest'
import type { Viseme } from '../../src/audio/VisemePredictor'
import {
  frameToPrimitiveMouth,
  loudnessToFrame,
  MouthDriver,
  neutralMouth,
  sampleVisemes,
  shapeToFrame,
} from '../../src/visuals/mouth'

const v = (mouthShape: Viseme['mouthShape'], startTime: number, duration: number, intensity = 1): Viseme => ({
  phoneme: 'X',
  startTime,
  duration,
  intensity,
  mouthShape,
})

describe('shapeToFrame', () => {
  it('maps open vowels onto VRM vowel expressions', () => {
    expect(shapeToFrame('AA_AH').aa).toBeGreaterThan(0.7)
    expect(shapeToFrame('UW_OW').ou).toBeGreaterThan(0.7)
    expect(shapeToFrame('AO_OH').oh).toBeGreaterThan(0.7)
    expect(shapeToFrame('IH_IY_EH').ih).toBeGreaterThan(0.6)
  })

  it('closes the lips for bilabials and rests on unknown shapes', () => {
    expect(shapeToFrame('M_B_P').closed).toBe(1)
    expect(shapeToFrame('REST')).toEqual(neutralMouth())
    expect(shapeToFrame('NOT_A_SHAPE')).toEqual(neutralMouth())
    expect(shapeToFrame(undefined)).toEqual(neutralMouth())
  })

  it('scales by intensity and clamps to 0..1', () => {
    expect(shapeToFrame('AE_AW', 0.5).aa).toBeCloseTo(0.5)
    expect(shapeToFrame('AE_AW', 5).aa).toBe(1)
  })
})

describe('sampleVisemes (coarticulation lookahead)', () => {
  const seq = [v('AA_AH', 0, 1), v('UW_OW', 1, 1)]

  it('is the pure current shape early in a viseme', () => {
    const f = sampleVisemes(seq, 0.2)!
    expect(f.aa).toBeCloseTo(shapeToFrame('AA_AH').aa)
    expect(f.ou).toBe(0)
  })

  it('blends toward the next viseme in the tail of the current one', () => {
    const early = sampleVisemes(seq, 0.5)!
    const late = sampleVisemes(seq, 0.95)!
    expect(late.ou).toBeGreaterThan(early.ou)
    expect(late.aa).toBeLessThan(early.aa)
    expect(late.ou).toBeGreaterThan(0.5) // lips already leading into the "oo"
  })

  it('returns null before the start and after the end', () => {
    expect(sampleVisemes(seq, -0.1)).toBeNull()
    expect(sampleVisemes(seq, 2.5)).toBeNull()
    expect(sampleVisemes([], 0)).toBeNull()
  })
})

describe('loudnessToFrame', () => {
  it('is closed when silent and opens with level', () => {
    expect(loudnessToFrame(0, 1)).toEqual(neutralMouth())
    expect(loudnessToFrame(0.3, 1).aa).toBeGreaterThan(0)
    const quiet = loudnessToFrame(0.1, 0.5)
    const loud = loudnessToFrame(0.4, 0.5)
    expect(loud.aa).toBeGreaterThan(quiet.aa)
  })
})

describe('MouthDriver', () => {
  const seq = [v('AA_AH', 0, 1), v('M_B_P', 1, 1)]

  it('follows the timeline when audio is audible', () => {
    const d = new MouthDriver()
    d.startUtterance(seq, 10)
    let f = neutralMouth()
    for (let i = 0; i < 20; i++) f = d.update(10.3, 0.3, 1 / 60)
    expect(f.aa).toBeGreaterThan(0.4)
  })

  it('closes during silence even mid-viseme (loudness gate)', () => {
    const d = new MouthDriver()
    d.startUtterance(seq, 10)
    let f = neutralMouth()
    for (let i = 0; i < 60; i++) f = d.update(10.3, 0, 1 / 60)
    expect(f.aa).toBeLessThan(0.05)
  })

  it('presses the lips on bilabials', () => {
    const d = new MouthDriver()
    d.startUtterance(seq, 10)
    let f = neutralMouth()
    for (let i = 0; i < 40; i++) f = d.update(11.5, 0.3, 1 / 60)
    expect(f.closed).toBeGreaterThan(0.8)
  })

  it('falls back to loudness with no timeline, and drops the timeline once it ends', () => {
    const d = new MouthDriver()
    d.startUtterance(null, 0)
    expect(d.hasTimeline()).toBe(false)
    let f = neutralMouth()
    for (let i = 0; i < 30; i++) f = d.update(1, 0.4, 1 / 60, 1)
    expect(f.aa + f.oh + f.ee).toBeGreaterThan(0.2)

    d.startUtterance(seq, 5)
    d.update(9, 0.2, 1 / 60)
    expect(d.hasTimeline()).toBe(false)
  })

  it('does not jump instantly (smoothed)', () => {
    const d = new MouthDriver()
    d.startUtterance([v('AA_AH', 0, 2)], 0)
    const f = d.update(0.1, 0.5, 1 / 60)
    expect(f.aa).toBeLessThan(0.6)
  })
})

describe('frameToPrimitiveMouth', () => {
  it('opens for vowels, narrows for oo, closes for bilabials', () => {
    const rest = frameToPrimitiveMouth(neutralMouth())
    const aa = frameToPrimitiveMouth(shapeToFrame('AA_AH'))
    const oo = frameToPrimitiveMouth(shapeToFrame('UW_OW'))
    const ee = frameToPrimitiveMouth(shapeToFrame('IH_IY_EH'))
    const mm = frameToPrimitiveMouth(shapeToFrame('M_B_P'))
    expect(aa.sy).toBeGreaterThan(rest.sy)
    expect(oo.sx).toBeLessThan(rest.sx)
    expect(ee.sx).toBeGreaterThan(rest.sx)
    expect(mm.sy).toBeLessThan(rest.sy)
    expect(mm.sy).toBeGreaterThan(0)
  })
})
