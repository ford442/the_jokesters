/**
 * Output schemas for every LLM call whose reply the code parses (#400 C).
 *
 * zod is the single source of truth: the same schema drives
 *  - MLC `response_format: { type: 'json_object', schema }` (xgrammar),
 *  - wllama `sampling.grammar` (GBNF via jsonSchemaToGbnf),
 *  - tolerant extraction + `safeParse` for engines without grammar support.
 */
import { z } from 'zod'

/** Director critique: judge the scene, coach the next actor, optionally steer memory. */
export const DirectorDecisionSchema = z.object({
  status: z.enum(['FLOWING', 'STAGNANT']),
  /** One sentence for the next actor. */
  instruction: z.string().optional(),
  /** `zoom_in` | `zoom_out` | `recall:TOPIC` (validated by parseMemoryHint). */
  memory: z.string().optional(),
})
export type DirectorDecision = z.infer<typeof DirectorDecisionSchema>

/** Next-speaker selection, constrained to the cast actually on stage. */
export function nextSpeakerSchema(agentIds: readonly [string, ...string[]]) {
  return z.object({
    speaker: z.enum(agentIds),
    reason: z.string().optional(),
  })
}
export type NextSpeakerDecision = z.infer<ReturnType<typeof nextSpeakerSchema>>

/** One beat of a scripted outline (see Director/ScriptGenerator.ts). */
export const ScriptBeatSchema = z.object({
  speaker: z.string(),
  line: z.string(),
})

/** Production card / beat outline: a short scripted scene. */
export const BeatOutlineSchema = z.object({
  beats: z.array(ScriptBeatSchema).min(1).max(20),
})
export type BeatOutline = z.infer<typeof BeatOutlineSchema>

/** JSON Schema for engines (draft 2020-12 minus the `$schema` marker, which xgrammar ignores). */
export function toEngineJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>
  delete json.$schema
  return json
}
