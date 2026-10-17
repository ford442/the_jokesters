import type { ProfanityLevel } from '../types/chat'

/**
 * Persona text goes through the show's profanity setting twice: PromptCompiler already appends
 * the `[STYLE: …]` instruction for the active level, and this masks explicit words in
 * user-authored persona text at the levels that forbid them, so a persona cannot smuggle
 * swearing past a PG/Casual show (or a shared cast card past the viewer's own setting).
 */

/** Strong profanity: masked unless the level allows swearing (GRITTY / UNCENSORED). */
const STRONG = ['fuck\\w*', 'motherfuck\\w*', 'shit\\w*', 'bullshit', 'bitch\\w*', 'cunt\\w*', 'asshole\\w*', 'dick\\w*', 'prick', 'bastard\\w*', 'slut\\w*', 'whore\\w*', 'piss\\w*', 'cock\\w*']
/** Mild language: additionally masked at PG ("No swearing"). CASUAL explicitly allows damn/hell. */
const MILD = ['damn\\w*', 'hell', 'crap\\w*', 'ass', 'arse', 'bloody', 'screw\\s+you']

function makeRe(words: string[]): RegExp {
  return new RegExp(`\\b(?:${words.join('|')})\\b`, 'gi')
}

const STRONG_RE = makeRe(STRONG)
const MILD_RE = makeRe(MILD)

export interface MaskResult {
  text: string
  masked: number
}

export function maskProfanity(text: string, level: ProfanityLevel): MaskResult {
  if (level === 'GRITTY' || level === 'UNCENSORED') return { text, masked: 0 }
  let masked = 0
  const sub = (m: string) => {
    masked++
    return '*'.repeat(Math.max(3, m.length))
  }
  let out = text.replace(STRONG_RE, sub)
  if (level === 'PG') out = out.replace(MILD_RE, sub)
  return { text: out, masked }
}

/** The persona text to send to the model for `agent` at the given profanity level. */
export function personaFor(agent: { systemPrompt: string; custom?: boolean }, level: ProfanityLevel): string {
  return agent.custom ? maskProfanity(agent.systemPrompt, level).text : agent.systemPrompt
}
