import { stripSfxTokens } from '../audio/sfxTokens'

/** Appended on a one-shot retry when the first reply has no speakable English. */
export const EMPTY_TURN_RETRY_SUFFIX =
  ' Reply in 1-2 full English sentences. No emoji-only messages.'

export const EMPTY_TURN_RETRY_MIN_TOKENS = 96

const EMOJI_AND_VS_RE = /[\p{Extended_Pictographic}\u{FE00}-\u{FE0F}\u{200D}]/gu
const EMOTICON_RE = /(?:(?<![A-Za-z])[:;=8][-o^']?[)(DPOpo3/\\*|]+)|\b(?:xD|XD|xP)\b|<3/g

export function stripForSpeakability(text: string): string {
  return stripSfxTokens(text)
    .replace(EMOJI_AND_VS_RE, ' ')
    .replace(EMOTICON_RE, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** True when the line has a real English token after SFX + emoji/emoticon strip. */
export function isSpeakableText(text: string): boolean {
  return /[A-Za-z]{3,}/.test(stripForSpeakability(text))
}

export function logTurnText(raw: string, cleaned: string): void {
  console.log(`[TurnText] raw=${JSON.stringify(raw)} cleaned=${JSON.stringify(cleaned)}`)
}

export function isVicunaModel(modelId: string | null | undefined): boolean {
  return typeof modelId === 'string' && /vicuna/i.test(modelId)
}

export function retryMaxTokens(
  effectiveMaxTokens: number,
  maxTokensPerTurn: number,
  absoluteMax: number,
): number {
  return Math.min(
    absoluteMax,
    maxTokensPerTurn,
    Math.max(effectiveMaxTokens, EMPTY_TURN_RETRY_MIN_TOKENS),
  )
}
