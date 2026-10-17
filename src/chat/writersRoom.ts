/**
 * "Writers' room" prompt layout (#400 B): one shared system prompt for the whole cast,
 * append-only history, and the per-turn speaker cue + Director note in the LAST user message.
 *
 * web-llm (and wllama `useCache`) only reuse the KV cache when a request exactly extends the
 * previous conversation, so nothing before the newest user message may change between turns.
 */
import type { Agent } from '../types/chat'

/** Persona boilerplate that moves into the shared rules (said once instead of five times). */
const BOILERPLATE = [
  /DO NOT (start sentences with|use) your name\.?/gi,
  /End your response with "###"\.?/gi,
  /You MUST reply with actual English sentences\.?/gi,
  /Do NOT reply with only emojis or emoticons\.?/gi,
]

/** Shrink one persona prompt to at most `maxChars`, cutting on a sentence boundary. */
export function compactPersona(prompt: string, maxChars: number): string {
  let text = prompt
  for (const pattern of BOILERPLATE) text = text.replace(pattern, '')
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (text.length <= maxChars) return text
  const cut = text.slice(0, maxChars)
  const boundary = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return (boundary > maxChars * 0.5 ? cut.slice(0, boundary + 1) : cut).trim()
}

/** Persona character budget so the whole shared prefix stays ≈30% of the context window. */
export function personaCharBudget(contextTokens: number, agentCount: number, charsPerToken = 4): number {
  const personaChars = contextTokens * 0.3 * charsPerToken - RULES_CHARS
  return Math.min(1200, Math.max(100, Math.floor(personaChars / Math.max(1, agentCount))))
}

const RULES =
  `RULES:\n` +
  `- The last user message ends with a [cue] naming who speaks next. Reply ONLY as that ` +
  `character: one short spoken turn, no name prefix, never other characters' lines.\n` +
  `- A Director whisper in the cue is private to that character: act on it, never mention it.\n` +
  `- End every reply with "###".`
const RULES_CHARS = RULES.length + 120

export function buildWritersRoomSystemPrompt(
  agents: Agent[],
  styleInstruction: string,
  options: { contextTokens: number; charsPerToken?: number; summary?: string | null },
): string {
  const budget = personaCharBudget(options.contextTokens, agents.length, options.charsPerToken)
  const cast = agents
    .map((a) => `### ${a.name}\n${compactPersona(a.systemPrompt, budget)}`)
    .join('\n\n')
  let prompt =
    `You are the writers' room of a live improv comedy show. The cast:\n\n${cast}\n\n` +
    `${RULES}\n[STYLE: ${styleInstruction}]`
  if (options.summary) prompt += `\n\n${options.summary}`
  return prompt
}

/** The bracketed cue appended to the newest user message. */
export function buildSpeakerCue(agent: Agent, directorNote?: string): string {
  const note = directorNote?.replace(/\s+/g, ' ').trim()
  return note ? `[${agent.name}, the Director whispers: ${note}]` : `[${agent.name} speaks next]`
}

export function composeCuedUserMessage(userContent: string, agent: Agent, directorNote?: string): string {
  return `${userContent}\n\n${buildSpeakerCue(agent, directorNote)}`
}
