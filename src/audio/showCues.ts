/**
 * Show-level music cues, shared by Director (which decides *when*), ShowMusic (which decides
 * *whether*) and the score builder (which decides *what it sounds like*). Pure types/data.
 */

export const SHOW_CUES = ['cold_open', 'act_break', 'tag', 'bit_died'] as const
export type ShowCue = (typeof SHOW_CUES)[number]

export function isShowCue(v: string): v is ShowCue {
  return (SHOW_CUES as readonly string[]).includes(v)
}

/** Cues that should not stack: a second one inside this window is dropped (bit_died is exempt — it is a reaction). */
export const SHOW_CUE_MIN_GAP_MS = 4000
