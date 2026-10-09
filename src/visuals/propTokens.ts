/**
 * Parse / strip inline prop cues from dialogue before TTS.
 *
 * Supported forms:
 *   [prop:mug]  [prop:mug:hide]  [PROP: briefcase : off]
 *   PROP:mug    PROP:briefcase:hide
 *
 * Any `[prop:…]` / `PROP:…` token is removed from speech, including names that
 * are not on the whitelist and path-like payloads. Only whitelist hits become cues.
 */

import { stripSfxTokens } from '../audio/sfxTokens'
import { isAllowedPropName, type AllowedPropName, type PropAction } from './propCatalog'

export interface PropCue {
  name: AllowedPropName
  action: PropAction
}

export interface PropTokenEvent {
  /** Raw name from a syntactically safe token (not yet whitelist-checked). */
  name: string
  action: PropAction
  index: number
}

export interface ParsePropResult {
  cleanText: string
  events: PropTokenEvent[]
}

/** Bracket form, including unsafe payloads so they can be stripped. */
const BRACKET_PROP_RE = /\[\s*prop\s*:\s*([^\]]*)\]/gi

/** Bare Director form. Token body runs to whitespace. */
const BARE_PROP_RE = /(?:^|[\s(,;])PROP:(\S+)/gi

function normalizeAction(raw: string | undefined): PropAction {
  if (raw === 'hide' || raw === 'off') return 'hide'
  return 'show'
}

function classifyPropBody(raw: string): { name: string; action: PropAction } | null {
  const match = raw.trim().toLowerCase().match(/^([a-z0-9_-]+)\s*(?::\s*(show|hide|on|off))?$/)
  if (!match) return null
  return { name: match[1], action: normalizeAction(match[2]) }
}

/**
 * Extract prop-shaped tokens and return text safe for TTS / chat display.
 * Does not whitelist — `takePropCues` drops unknown names.
 */
export function parsePropTokens(text: string): ParsePropResult {
  if (!text) return { cleanText: '', events: [] }

  const events: PropTokenEvent[] = []

  BRACKET_PROP_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = BRACKET_PROP_RE.exec(text)) !== null) {
    const classified = classifyPropBody(match[1] ?? '')
    if (classified) {
      events.push({ name: classified.name, action: classified.action, index: match.index })
    }
  }

  BARE_PROP_RE.lastIndex = 0
  while ((match = BARE_PROP_RE.exec(text)) !== null) {
    const classified = classifyPropBody(match[1] ?? '')
    if (!classified) continue
    const propIdx = match.index + match[0].toLowerCase().indexOf('prop:')
    const already = events.some((event) => Math.abs(event.index - propIdx) < 2 && event.name === classified.name)
    if (!already) {
      events.push({ name: classified.name, action: classified.action, index: propIdx })
    }
  }

  events.sort((a, b) => a.index - b.index)

  BRACKET_PROP_RE.lastIndex = 0
  let cleanText = text.replace(BRACKET_PROP_RE, ' ')
  BARE_PROP_RE.lastIndex = 0
  cleanText = cleanText.replace(BARE_PROP_RE, (full) => full.match(/^[\s(,;]/)?.[0] ?? '')
  cleanText = cleanText.replace(/\s{2,}/g, ' ').trim()

  return { cleanText, events }
}

export function stripPropTokens(text: string): string {
  return parsePropTokens(text).cleanText
}

/** Strip prop tokens, keep only whitelist cues. */
export function takePropCues(text: string): { cleanText: string; cues: PropCue[] } {
  const { cleanText, events } = parsePropTokens(text)
  const cues: PropCue[] = []
  for (const event of events) {
    if (!isAllowedPropName(event.name)) continue
    cues.push({ name: event.name, action: event.action })
  }
  return { cleanText, cues }
}

/** Prop + SFX tokens removed. Used before TTS and chat display. */
export function stripStageTokens(text: string): string {
  return stripPropTokens(stripSfxTokens(text)).replace(/\s{2,}/g, ' ').trim()
}
