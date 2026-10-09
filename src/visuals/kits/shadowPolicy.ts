/** Drop directional shadows once a short FPS window stays under the stage budget. */

export const SHADOW_FPS_FLOOR = 30
export const SHADOW_SAMPLE_MIN = 20

export function averageFps(samples: readonly number[]): number {
  if (samples.length === 0) return 0
  let sum = 0
  for (const sample of samples) sum += sample
  return sum / samples.length
}

/**
 * Sticky: once shadows are off they stay off for the session (no flicker).
 * Ignores windows shorter than SHADOW_SAMPLE_MIN so a single hitch does not trip it.
 */
export function shouldDisableShadows(samples: readonly number[], alreadyDisabled: boolean): boolean {
  if (alreadyDisabled) return true
  if (samples.length < SHADOW_SAMPLE_MIN) return false
  return averageFps(samples) < SHADOW_FPS_FLOOR
}
