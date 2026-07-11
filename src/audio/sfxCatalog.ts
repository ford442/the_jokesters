/**
 * Whitelisted SFX catalog — never construct paths from free-form user strings.
 * Only names in ALLOWED_SFX may be loaded or played.
 */

export type SfxPlaybackMode = 'overlay' | 'interrupt' | 'duck'

/** Core pack + optional per-agent variants (all must exist under public/sfx/). */
export const ALLOWED_SFX = [
  'laugh',
  'applause',
  'rimshot',
  'boo',
  'gasp',
  'whoosh',
  'explosion',
  'comedian_laugh',
  'robot_beep',
] as const

export type AllowedSfxName = (typeof ALLOWED_SFX)[number]

const ALLOWED_SET = new Set<string>(ALLOWED_SFX)

export function isAllowedSfxName(name: string): name is AllowedSfxName {
  return ALLOWED_SET.has(name)
}

/**
 * Resolve a safe asset URL for a whitelisted name only.
 * Returns null if the name is not on the whitelist (caller must not fetch).
 */
export function sfxAssetUrl(name: string, base = './sfx'): string | null {
  if (!isAllowedSfxName(name)) return null
  // Filename is taken only from the whitelist entry — never from raw input.
  return `${base.replace(/\/$/, '')}/${name}.wav`
}

/**
 * Per-agent remaps for generic cues (e.g. comedian "laugh" → comedian_laugh).
 * Both sides must be whitelist entries.
 */
export const AGENT_SFX_MAP: Readonly<Record<string, Partial<Record<AllowedSfxName, AllowedSfxName>>>> = {
  comedian: { laugh: 'comedian_laugh' },
  robot: { gasp: 'robot_beep', whoosh: 'robot_beep' },
}

export function resolveAgentSfx(name: AllowedSfxName, agentId?: string): AllowedSfxName {
  if (!agentId) return name
  const mapped = AGENT_SFX_MAP[agentId]?.[name]
  return mapped ?? name
}

export const DEFAULT_SFX_MODE: SfxPlaybackMode = 'duck'
export const DEFAULT_SFX_VOLUME = 0.7
export const DEFAULT_TTS_DUCK_LEVEL = 0.18
export const DEFAULT_DUCK_ATTACK_MS = 40
export const DEFAULT_DUCK_RELEASE_MS = 220

export const SFX_STORAGE_KEYS = {
  enabled: 'jokesters-sfx-enabled',
  volume: 'jokesters-sfx-volume',
  mode: 'jokesters-sfx-mode',
} as const
