/**
 * Vocoder-grounded playback sample rate.
 *
 * `tts.json` `ae.sample_rate` is a claim, not ground truth. PCM rate is
 * `wav.length / duration` (duration-predictor seconds). Snap that empirical
 * rate to a standard Hz and stamp it when it disagrees with the JSON by >5%.
 */

export const TTS_NATIVE_SAMPLE_RATES = [16000, 22050, 24000, 32000, 44100, 48000] as const

/** Relative error above which config.ae.sample_rate is treated as wrong. */
export const TTS_SAMPLE_RATE_DISAGREE_FRACTION = 0.05

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
 * Resolve the rate to stamp on a vocoder buffer.
 *
 * If `configHz` and `nativeHz` differ by more than ~5%, prefer `nativeHz`.
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
  // Prefer native when they disagree; identical when they don't.
  const sampleRate = disagree ? nativeHz : configHz > 0 ? configHz : nativeHz
  return { configHz, empiricalHz, nativeHz, samples, duration, sampleRate }
}
