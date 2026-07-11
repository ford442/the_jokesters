/**
 * Parse / strip inline SFX tokens from dialogue before TTS.
 *
 * Supported forms:
 *   [sfx:rimshot]   [SFX:laugh]   [sfx: comedian_laugh ]
 *   SFX:explosion   (Director-style bare token, word boundary)
 */

export interface SfxTokenEvent {
  /** Raw name from the token (not yet whitelist-checked). */
  name: string
  /** Character index in the original string where the token started. */
  index: number
}

export interface ParseSfxResult {
  /** Text safe to send to TTS / show (tokens removed). */
  cleanText: string
  /** Ordered SFX events discovered in the original string. */
  events: SfxTokenEvent[]
}

/** Bracket form: [sfx:name] */
const BRACKET_SFX_RE = /\[\s*sfx\s*:\s*([a-zA-Z0-9_-]+)\s*\]/gi

/** Bare Director form: SFX:name (not inside brackets already handled) */
const BARE_SFX_RE = /(?:^|[\s(,;])SFX:([a-zA-Z0-9_-]+)\b/gi

/**
 * Extract SFX tokens and return cleaned text for TTS.
 * Does **not** whitelist — SfxManager rejects unknown names.
 */
export function parseSfxTokens(text: string): ParseSfxResult {
  if (!text) return { cleanText: '', events: [] }

  const events: SfxTokenEvent[] = []

  // Collect bracket matches with indices
  BRACKET_SFX_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = BRACKET_SFX_RE.exec(text)) !== null) {
    events.push({ name: m[1].toLowerCase(), index: m.index })
  }

  // Bare SFX:name — only if not already covered as part of [sfx:...]
  BARE_SFX_RE.lastIndex = 0
  while ((m = BARE_SFX_RE.exec(text)) !== null) {
    const name = m[1].toLowerCase()
    // index of the "SFX:" part: match may include leading whitespace
    const sfxIdx = m.index + m[0].indexOf('SFX:')
    // Skip if this position is inside a bracket token we already captured
    const already = events.some((e) => Math.abs(e.index - sfxIdx) < 2 && e.name === name)
    if (!already) {
      events.push({ name, index: sfxIdx })
    }
  }

  events.sort((a, b) => a.index - b.index)

  let cleanText = text.replace(BRACKET_SFX_RE, ' ')
  // Remove bare SFX:name carefully
  cleanText = cleanText.replace(/(?:^|[\s(,;])SFX:[a-zA-Z0-9_-]+\b/gi, (match) => {
    // Preserve leading whitespace/punct if present
    const lead = match.match(/^[\s(,;]/)?.[0] ?? ''
    return lead
  })

  cleanText = cleanText.replace(/\s{2,}/g, ' ').trim()

  return { cleanText, events }
}

/** Strip SFX tokens for display only (no event list). */
export function stripSfxTokens(text: string): string {
  return parseSfxTokens(text).cleanText
}

/**
 * True if text contains any SFX token form (for cheap checks).
 */
export function hasSfxTokens(text: string): boolean {
  BRACKET_SFX_RE.lastIndex = 0
  if (BRACKET_SFX_RE.test(text)) return true
  BARE_SFX_RE.lastIndex = 0
  return BARE_SFX_RE.test(text)
}
