/**
 * Vocoder-grounded playback sample rate.
 *
 * Hosted Supertonic `tts.json` `ae.sample_rate` is 44100. PCM length is
 * `ceil(duration * sr / chunk) * hop`, so untrimmed `wav.length / duration`
 * is inflated by chunk padding and snaps 44.1 kHz → 48 kHz on short lines.
 * Trim to `duration * configHz` first (official Python does this), then snap.
 */

/** Supertonic 2/3 vocoder native rate (hosted tts.json ae.sample_rate). */
export const SUPERTONIC_NATIVE_SAMPLE_RATE = 44100

export const TTS_NATIVE_SAMPLE_RATES = [16000, 22050, 24000, 32000, 44100, 48000] as const

/** Relative error above which config.ae.sample_rate is treated as wrong. */
export const TTS_SAMPLE_RATE_DISAGREE_FRACTION = 0.05

/**
 * Empirical-higher-than-config within this fraction is chunk padding
 * (44.1k → 48k), not a different codec. JSON-too-low (16k vs 24k = 50%)
 * still prefers the empirical snap.
 */
export const TTS_SAMPLE_RATE_PAD_FRACTION = 0.2

/** Below this, samples/duration is too jumpy — keep the config claim. */
export const TTS_SAMPLE_RATE_MIN_DURATION_SEC = 0.05

export interface TtsNativeSampleRate {
  configHz: number
  empiricalHz: number
  nativeHz: number
  samples: number
  duration: number
  /** Value to postMessage / stamp on createBuffer. */
  sampleRate: number
}

export function snapSampleRate(
  hz: number,
  candidates: readonly number[] = TTS_NATIVE_SAMPLE_RATES,
): number {
  return candidates.reduce((best, candidate) =>
    Math.abs(candidate - hz) < Math.abs(best - hz) ? candidate : best,
  )
}

/**
 * Drop vocoder ceil-to-chunk padding so playback length matches the
 * duration-predictor seconds. Official Python trims the same way.
 */
export function trimVocoderPcm(
  wav: Float32Array,
  durationSec: number,
  sampleRate: number,
): Float32Array {
  if (!(durationSec > 0) || !(sampleRate > 0) || wav.length === 0) return wav
  const expected = Math.max(1, Math.round(durationSec * sampleRate))
  return wav.length > expected ? wav.slice(0, expected) : wav
}

/**
 * Resolve the rate to stamp on a vocoder buffer.
 *
 * After trim, empirical ≈ config. If they still disagree: keep config when
 * extra samples look like chunk padding; otherwise prefer the empirical snap
 * (JSON claiming 48 kHz of a 24 kHz vocoder would chipmunk).
 */
export function resolveTtsNativeSampleRate(
  configHz: number,
  samples: number,
  duration: number,
): TtsNativeSampleRate {
  const empiricalHz =
    duration > TTS_SAMPLE_RATE_MIN_DURATION_SEC ? Math.round(samples / duration) : configHz
  const nativeHz = snapSampleRate(empiricalHz)
  const denom = Math.max(Math.abs(configHz), 1)
  const disagree = Math.abs(nativeHz - configHz) / denom > TTS_SAMPLE_RATE_DISAGREE_FRACTION
  const padding =
    configHz > 0 &&
    empiricalHz >= configHz &&
    (empiricalHz - configHz) / denom <= TTS_SAMPLE_RATE_PAD_FRACTION
  const sampleRate = !disagree
    ? configHz > 0
      ? configHz
      : nativeHz
    : padding
      ? configHz
      : nativeHz
  return { configHz, empiricalHz, nativeHz, samples, duration, sampleRate }
}
