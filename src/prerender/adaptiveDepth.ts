/**
 * Adaptive LLM/TTS prerender depth from estimated free VRAM.
 * Tight GPUs prerender less (or not at all) to avoid OOM during background gen.
 */

export interface PrerenderDepthBudget {
  /** Turns to generate at scene start */
  initialTurns: number
  /** Refill when queue length falls below this */
  minQueue: number
  /** Turns per background refill batch */
  batchSize: number
  /** Max upcoming sentences to TTS-prerender within a turn */
  maxSentences: number
  /** Human-readable reason for the budget */
  reason: string
}

/**
 * Pure function — unit-testable.
 * @param availableVramMB free VRAM estimate after app overhead (0 = unknown/CPU)
 */
export function computePrerenderDepth(availableVramMB: number): PrerenderDepthBudget {
  // CPU / unknown → conservative single-turn text only, minimal TTS ahead
  if (!Number.isFinite(availableVramMB) || availableVramMB <= 0) {
    return {
      initialTurns: 1,
      minQueue: 0,
      batchSize: 1,
      maxSentences: 1,
      reason: 'No VRAM estimate — minimal prerender',
    }
  }

  if (availableVramMB < 1800) {
    return {
      initialTurns: 0,
      minQueue: 0,
      batchSize: 0,
      maxSentences: 1,
      reason: `Ultra-low VRAM (~${Math.round(availableVramMB)} MB) — live generation only`,
    }
  }

  if (availableVramMB < 2800) {
    return {
      initialTurns: 1,
      minQueue: 0,
      batchSize: 1,
      maxSentences: 2,
      reason: `Tight VRAM (~${Math.round(availableVramMB)} MB) — shallow queue`,
    }
  }

  if (availableVramMB < 4000) {
    return {
      initialTurns: 2,
      minQueue: 1,
      batchSize: 1,
      maxSentences: 2,
      reason: `Moderate VRAM (~${Math.round(availableVramMB)} MB) — depth 2`,
    }
  }

  return {
    initialTurns: 3,
    minQueue: 2,
    batchSize: 2,
    maxSentences: 3,
    reason: `Healthy VRAM (~${Math.round(availableVramMB)} MB) — full depth 3`,
  }
}

/** Rolling median of a numeric series (copy + sort). */
export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}
