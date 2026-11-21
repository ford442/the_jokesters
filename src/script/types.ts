/**
 * Script packet: a prewritten, non-LLM dialog the Script Player speaks on the
 * existing stage (`?mode=script`). Authors write this, not a full JokestersEpisode;
 * `scriptPacketToEpisode` adapts it for `replayEpisode`.
 */
import { z } from 'zod'
import { SUPERTONIC_STYLE_IDS, type SupertonicStyleId, type AgentVoiceId } from '../audio/voiceMap'
import { STAGE_KIT_IDS, type StageKitId } from '../visuals/stageKitIds'

export const SCRIPT_SLOTS = ['comedian', 'philosopher', 'scientist', 'techBro', 'robot'] as const satisfies readonly AgentVoiceId[]
export type ScriptSlot = (typeof SCRIPT_SLOTS)[number]

export const DEFAULT_HOLD_MS = 350

const voiceSchema = z.enum(SUPERTONIC_STYLE_IDS as unknown as [SupertonicStyleId, ...SupertonicStyleId[]])

export const scriptSpeakerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slot: z.enum(SCRIPT_SLOTS),
  voice: voiceSchema.optional(),
  color: z.string().optional(),
})

export const scriptTurnSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
  holdMs: z.number().nonnegative().max(60_000).optional(),
  sfx: z.string().optional(),
})

export const scriptPacketSchema = z
  .object({
    version: z.literal(1),
    id: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    // Unknown kit → void (resolved, not rejected).
    stageKit: z
      .string()
      .optional()
      .transform((k): StageKitId => ((STAGE_KIT_IDS as readonly string[]).includes(k ?? '') ? (k as StageKitId) : 'void')),
    speakers: z.array(scriptSpeakerSchema).min(1),
    turns: z.array(scriptTurnSchema).min(1),
  })
  .superRefine((p, ctx) => {
    const ids = new Set<string>()
    p.speakers.forEach((s, i) => {
      if (ids.has(s.id)) ctx.addIssue({ code: 'custom', path: ['speakers', i, 'id'], message: `Duplicate speaker id "${s.id}"` })
      ids.add(s.id)
    })
    p.turns.forEach((t, i) => {
      if (!ids.has(t.speaker)) {
        ctx.addIssue({ code: 'custom', path: ['turns', i, 'speaker'], message: `Turn ${i + 1}: unknown speaker "${t.speaker}"` })
      }
    })
  })

export type ScriptPacketInput = z.input<typeof scriptPacketSchema>
export type ScriptPacket = z.output<typeof scriptPacketSchema>
export type ScriptSpeaker = z.output<typeof scriptSpeakerSchema>
export type ScriptTurn = z.output<typeof scriptTurnSchema>
