import type { ProfanityLevel } from '../types/chat';

export const PROFANITY_LEVEL: ProfanityLevel = 'GRITTY'

export const PROFANITY_INSTRUCTIONS: Record<ProfanityLevel, string> = {
  PG: `Keep it family-friendly. No swearing.`,
  CASUAL: `Mild language OK (damn, hell). No strong profanity.`,
  GRITTY: `Casual swearing OK (shit, f*ck). No sexual/violent content.`,
  UNCENSORED: `Full language freedom. No sexual/violent content.`,
}

export const DEFAULT_MAX_TOKENS = 96
export const ABSOLUTE_MAX_TOKENS = 512
