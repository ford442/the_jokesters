import { describe, expect, it } from 'vitest'
import {
  resolveTtsNativeSampleRate,
  snapSampleRate,
  TTS_NATIVE_SAMPLE_RATES,
} from '../../src/audio/ttsNativeSampleRate'

describe('snapSampleRate', () => {
  it('snaps to the nearest standard rate', () => {
    expect(snapSampleRate(24000)).toBe(24000)
    expect(snapSampleRate(23900)).toBe(24000)
    expect(snapSampleRate(16000)).toBe(16000)
    expect(snapSampleRate(48000)).toBe(48000)
    expect(snapSampleRate(23500)).toBe(24000)
    expect(snapSampleRate(20000)).toBe(22050)
  })

  it('covers every candidate in the snap list', () => {
    for (const hz of TTS_NATIVE_SAMPLE_RATES) {
      expect(snapSampleRate(hz)).toBe(hz)
    }
  })
})

describe('resolveTtsNativeSampleRate', () => {
  it('stamps configHz when empirical agrees with tts.json (24 kHz vocoder)', () => {
    const probe = resolveTtsNativeSampleRate(24000, 24000, 1)
    expect(probe).toMatchObject({
      configHz: 24000,
      empiricalHz: 24000,
      nativeHz: 24000,
      sampleRate: 24000,
    })
  })

  it('stamps 24 kHz when tts.json claims 16 kHz but PCM is 24 kHz (too slow if JSON wins)', () => {
    // 1s of speech, vocoder emitted 24000 samples, JSON said 16000
    const probe = resolveTtsNativeSampleRate(16000, 24000, 1)
    expect(probe.empiricalHz).toBe(24000)
    expect(probe.nativeHz).toBe(24000)
    expect(probe.sampleRate).toBe(24000)
  })

  it('stamps 24 kHz when tts.json claims 48 kHz but PCM is 24 kHz (chipmunk if JSON wins)', () => {
    const probe = resolveTtsNativeSampleRate(48000, 24000, 1)
    expect(probe.empiricalHz).toBe(24000)
    expect(probe.nativeHz).toBe(24000)
    expect(probe.sampleRate).toBe(24000)
  })

  it('keeps configHz when empirical is within ~5% (chunk padding, not a different codec rate)', () => {
    // 24120/1 = 24120 → 0.5% off 24000, snaps to 24000
    const probe = resolveTtsNativeSampleRate(24000, 24120, 1)
    expect(probe.empiricalHz).toBe(24120)
    expect(probe.nativeHz).toBe(24000)
    expect(probe.sampleRate).toBe(24000)
  })

  it('falls back to configHz (then snap) when duration is too short to trust samples/duration', () => {
    const probe = resolveTtsNativeSampleRate(24000, 48000, 0.01)
    expect(probe.empiricalHz).toBe(24000)
    expect(probe.nativeHz).toBe(24000)
    expect(probe.sampleRate).toBe(24000)
  })

  it('prefers nativeHz when configHz and nativeHz differ', () => {
    const probe = resolveTtsNativeSampleRate(16000, 48000, 1) // empirical 48 kHz
    expect(probe.configHz).toBe(16000)
    expect(probe.nativeHz).toBe(48000)
    expect(probe.sampleRate).toBe(48000)
  })
})
