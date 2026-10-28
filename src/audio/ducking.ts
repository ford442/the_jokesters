/**
 * Sidechain-style ducking envelope: music steps aside while anyone is talking and swells back
 * after a short hold (so the tail of a sentence, or a breath between sentences, does not pump).
 * Pure: feed it the speech level each tick, apply the returned gain to a GainNode.
 */

export interface DuckOptions {
  /** Music gain while speech is present (0..1). */
  duckGain: number
  /** Speech level above which we duck (0..1 loudness). */
  threshold: number
  attackSec: number
  releaseSec: number
  /** Stay ducked this long after speech drops below the threshold. */
  holdSec: number
}

export const DEFAULT_DUCK: DuckOptions = {
  duckGain: 0.18,
  threshold: 0.02,
  attackSec: 0.06,
  releaseSec: 0.55,
  holdSec: 0.3,
}

export class DuckEnvelope {
  private gain = 1
  private hold = 0
  private readonly opts: DuckOptions

  constructor(opts: Partial<DuckOptions> = {}) {
    this.opts = { ...DEFAULT_DUCK, ...opts }
  }

  /** @returns music gain 0..1 after `dt` seconds with the given speech level. */
  update(speechLevel: number, dt: number): number {
    const { duckGain, threshold, attackSec, releaseSec, holdSec } = this.opts
    if (speechLevel > threshold) this.hold = holdSec
    else this.hold = Math.max(0, this.hold - dt)

    const target = this.hold > 0 ? duckGain : 1
    const tau = target < this.gain ? attackSec : releaseSec
    this.gain += (target - this.gain) * (1 - Math.exp(-Math.max(0, dt) / Math.max(1e-3, tau)))
    return this.gain
  }

  get current(): number {
    return this.gain
  }
}
