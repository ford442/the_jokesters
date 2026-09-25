/**
 * Canonical agent → Supertonic voice style mapping.
 *
 * Single source of truth for both TTS engines (`AudioEngine.ts` legacy /
 * `OptimizedAudioEngine.ts` optimized, selected via bootstrap's `?legacyAudio`
 * flag) so the two never drift into different voice assignments again.
 *
 * Only 4 style files are hosted at `${VPS_STORAGE_URL}/tts/voice_styles/`
 * (M1, M2, F1, F2) for 5 agents, so one pair must share a style id. Robot
 * shares Philosopher's M2 (deep, monotone-capable) rather than Scientist's
 * M1 — a robotic delivery reads better on a voice that already has slow,
 * flat range. The two are told apart by `CHARACTER_SPEEDS` in `chatLog.ts`:
 * Philosopher is deliberately slow (0.6), Robot is faster and metronomic
 * (0.85) rather than dragging like the Philosopher.
 */

export type SupertonicStyleId = 'F1' | 'F2' | 'M1' | 'M2'

export type AgentVoiceId = 'comedian' | 'philosopher' | 'scientist' | 'techBro' | 'robot'

export const SUPERTONIC_STYLE_IDS: readonly SupertonicStyleId[] = ['M1', 'M2', 'F1', 'F2']

export const DEFAULT_VOICE_STYLE: SupertonicStyleId = 'F1'

/** Covers all 5 `src/config/agents.ts` ids — every entry uses a real hosted style file. */
export const AGENT_VOICE_MAP: Record<AgentVoiceId, SupertonicStyleId> = {
  comedian: 'F1',
  philosopher: 'M2',
  scientist: 'M1',
  techBro: 'F2',
  robot: 'M2',
}

/** Resolves an agent id to a hosted Supertonic style, falling back to the default voice. */
export function resolveVoiceStyle(agentId: string): SupertonicStyleId {
  const mapped = AGENT_VOICE_MAP[agentId as AgentVoiceId]
  return mapped ?? DEFAULT_VOICE_STYLE
}
