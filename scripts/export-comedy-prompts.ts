/**
 * Export the browser show's prompt layer to JSON for the GPU comedy-tester Space
 * (hf_spaces/comedy-tester). Keeps the Space's personas / rules / sampling in
 * lock-step with src/ instead of a hand-copied drift.
 *
 *   npx tsx scripts/export-comedy-prompts.ts
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { agents } from '../src/config/agents'
import { PROFANITY_INSTRUCTIONS, DEFAULT_MAX_TOKENS, ABSOLUTE_MAX_TOKENS } from '../src/config/chatConfig'
import { buildWritersRoomSystemPrompt, buildSpeakerCue } from '../src/chat/writersRoom'
import { EMPTY_TURN_RETRY_SUFFIX, EMPTY_TURN_RETRY_MIN_TOKENS } from '../src/chat/speakableText'
import setups from '../src/config/improvSetups.presets.json'

const contexts = [512, 1024, 2048, 4096]
const out = {
  generatedFrom: 'scripts/export-comedy-prompts.ts',
  agents: agents.map((a) => ({
    id: a.id, name: a.name, systemPrompt: a.systemPrompt, temperature: a.temperature, top_p: a.top_p,
  })),
  profanityInstructions: PROFANITY_INSTRUCTIONS,
  defaultMaxTokens: DEFAULT_MAX_TOKENS,
  absoluteMaxTokens: ABSOLUTE_MAX_TOKENS,
  stop: ['###', 'Director:', 'User:'],
  emptyTurnRetrySuffix: EMPTY_TURN_RETRY_SUFFIX,
  emptyTurnRetryMinTokens: EMPTY_TURN_RETRY_MIN_TOKENS,
  /** Shared writers'-room system prompt, pre-built per context size and profanity level. */
  writersRoomSystemPrompt: Object.fromEntries(
    contexts.map((ctx) => [
      String(ctx),
      Object.fromEntries(
        (Object.keys(PROFANITY_INSTRUCTIONS) as (keyof typeof PROFANITY_INSTRUCTIONS)[]).map((level) => [
          level,
          buildWritersRoomSystemPrompt(agents, PROFANITY_INSTRUCTIONS[level], { contextTokens: ctx, profanity: level }),
        ]),
      ),
    ]),
  ),
  speakerCueExample: buildSpeakerCue(agents[0], 'example whisper'),
  improvSetups: (setups as { id: string; title: string; description: string }[]).slice(0, 40),
}
const dest = resolve('hf_spaces/comedy-tester/prompts.json')
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n')
console.log(`wrote ${dest}`)
