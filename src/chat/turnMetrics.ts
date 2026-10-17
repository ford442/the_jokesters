/**
 * Per-turn prefill / TTFT / decode summaries for the perf harness (#400 B acceptance:
 * median prefill tokens per turn after turn 3, writers' room vs legacy layout).
 */
import type { TurnMetrics } from '../GroupChatManager'

export interface TurnMetricsSummary {
  turns: number
  /** Median prompt tokens actually prefilled per turn, skipping the first `skipTurns`. */
  medianPrefillTokens: number | null
  medianTtftMs: number | null
  medianDecodeTokPerSec: number | null
  chainBreaks: number
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function summarizeTurnMetrics(metrics: readonly TurnMetrics[], skipTurns = 3): TurnMetricsSummary {
  const steady = metrics.slice(skipTurns)
  const known = <K extends keyof TurnMetrics>(key: K) =>
    steady.map((m) => m[key]).filter((v): v is NonNullable<TurnMetrics[K]> & number => typeof v === 'number' && v >= 0)
  return {
    turns: steady.length,
    medianPrefillTokens: median(known('prefillTokens')),
    medianTtftMs: median(known('ttftMs')),
    medianDecodeTokPerSec: median(known('decodeTokPerSec')),
    chainBreaks: steady.filter((m) => m.chainBreak != null).length,
  }
}

/** Fractional reduction of `after` vs `baseline` (0.6 = 60% fewer prefill tokens). */
export function prefillReduction(baseline: TurnMetricsSummary, after: TurnMetricsSummary): number | null {
  if (baseline.medianPrefillTokens == null || after.medianPrefillTokens == null || baseline.medianPrefillTokens <= 0) {
    return null
  }
  return 1 - after.medianPrefillTokens / baseline.medianPrefillTokens
}
