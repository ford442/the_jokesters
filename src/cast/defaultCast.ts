import type { Agent } from '../types/chat'
import techBroPrompt from '../prompts/techBro'
import robotPrompt from '../prompts/robot'

/**
 * The one roster. Every consumer — bootstrap's `GroupChatManager`, the cast
 * editor, `PersonalityStore`, tests, the prompt exporter — reads the shipped
 * performers from here. (Previously `app/agents.ts` held 3 agents and
 * `config/agents.ts` held 5 with *different* prompts.)
 *
 * Five performers stand on stage; **three are on by default** (the classic
 * trio, which the Director's modes hard-code). Chad Vanderblock and Unit-734
 * join the rotation when a cast card enables them.
 *
 * Kept zod-free so the boot path doesn't pull in the cast-card schema; a unit
 * test validates `defaultCast()` (built from this module) against
 * `castCardSchema`.
 */

/** The five stage slots (also the ids of Stage's actors). */
export const CAST_SLOT_IDS = ['comedian', 'philosopher', 'scientist', 'techBro', 'robot'] as const
export type CastSlotId = (typeof CAST_SLOT_IDS)[number]

/** Slots on by default, and always on stage: the Director's modes (rap battle, musical improv…) hard-code them. */
export const REQUIRED_SLOT_IDS: readonly CastSlotId[] = ['comedian', 'philosopher', 'scientist']

/** Required protocol suffix: the turn parser relies on "###" and the model must speak in sentences. */
export const PERSONA_SUFFIX =
  'DO NOT start sentences with your name. You MUST reply with actual English sentences. Do NOT reply with only emojis or emoticons. End your response with "###"'

/** All five performers as shipped. Read-only: copy before mutating (see `createDefaultRoster`). */
export const castAgents: readonly Readonly<Agent>[] = [
  {
    id: 'comedian',
    name: 'The Comedian',
    systemPrompt:
      'You are a frantic, high-energy female comedian who talks incredibly fast. You are aware that you ramble at high speed and play on it comically. You mix highbrow references with lowbrow physical humor. ' +
      PERSONA_SUFFIX,
    temperature: 0.85,
    top_p: 0.93,
    color: '#ff6b6b',
  },
  {
    id: 'philosopher',
    name: 'The Philosopher',
    systemPrompt:
      'You are a cynical philosopher who speaks very slowly. You judge the comedian for her speed. You are highbrow but petty. ' +
      PERSONA_SUFFIX,
    temperature: 0.7,
    top_p: 0.9,
    color: '#4ecdc4',
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    systemPrompt:
      'You are a scientist who treats every joke as a hypothesis. You analyze crass jokes with mathematical precision. ' +
      PERSONA_SUFFIX,
    temperature: 0.5,
    top_p: 0.85,
    color: '#45b7d1',
  },
  {
    id: 'techBro',
    name: 'Chad Vanderblock',
    systemPrompt: `${techBroPrompt}\n\n${PERSONA_SUFFIX}`,
    temperature: 0.9,
    top_p: 0.92,
    color: '#FF6B35',
  },
  {
    id: 'robot',
    name: 'Unit-734',
    systemPrompt: `${robotPrompt}\n\n${PERSONA_SUFFIX}`,
    temperature: 0.5,
    top_p: 0.8,
    color: '#C0C0C0',
  },
]

/** The shipped agent for a slot / agent id. */
export function shippedAgent(id: string): Readonly<Agent> | undefined {
  return castAgents.find((a) => a.id === id)
}

/**
 * A fresh, mutable roster of the default-on performers. `GroupChatManager` and
 * the cast applier hold and mutate this array in place, so each app run gets
 * its own copy rather than sharing module state.
 */
export function createDefaultRoster(): Agent[] {
  return castAgents
    .filter((a) => (REQUIRED_SLOT_IDS as readonly string[]).includes(a.id))
    .map((a) => ({ ...a }))
}
