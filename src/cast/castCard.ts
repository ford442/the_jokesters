import { z } from 'zod'
import { SUPERTONIC_STYLE_IDS, AGENT_VOICE_MAP, type AgentVoiceId, type SupertonicStyleId } from '../audio/voiceMap'
import { agents as rosterAgents } from '../app/agents'
import { agents as defaultAgents } from '../config/agents'
import type { ProfanityLevel } from '../types/chat'
import { maskProfanity } from './profanity'

/**
 * Cast card: a shareable JSON description of the five performers — name, persona, voice,
 * avatar and sampling. Validated with zod on import, so a card from another machine (or a
 * hostile one) can only ever produce bounded, well-typed values.
 */

export const CAST_CARD_FORMAT = 'jokesters-cast'
export const CAST_CARD_VERSION = 1

/** The five stage slots (also the ids of Stage's actors and of config/agents.ts). */
export const CAST_SLOT_IDS = ['comedian', 'philosopher', 'scientist', 'techBro', 'robot'] as const
export type CastSlotId = (typeof CAST_SLOT_IDS)[number]

/** Slots the Director's modes hard-code (rap battle, musical improv…): always on stage. */
export const REQUIRED_SLOT_IDS: readonly CastSlotId[] = ['comedian', 'philosopher', 'scientist']

export const MAX_NAME_CHARS = 32
/**
 * Persona cap. The shared writers'-room prompt carries all five personas inside ≈30% of the
 * context window, so each custom persona stays well under its per-agent budget
 * (chat/writersRoom.ts caps at 1200 chars; 600 leaves room for small contexts).
 */
export const MAX_PERSONA_CHARS = 600
export const MAX_TITLE_CHARS = 60
/** Upper bound on an embedded .vrm (decoded). Hosted avatars are far smaller; this stops a card from carrying a gigabyte. */
export const MAX_EMBEDDED_AVATAR_BYTES = 24 * 1024 * 1024
/** Rough chars-per-token for the live budget readout in the editor. */
export const CHARS_PER_TOKEN = 3.6

const slotIdSchema = z.enum(CAST_SLOT_IDS)
const voiceSchema = z.enum(SUPERTONIC_STYLE_IDS as unknown as [SupertonicStyleId, ...SupertonicStyleId[]])
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be #rrggbb')

/**
 * `default`  — the bundled avatar for this slot (or the capsule on low-tier GPUs)
 * `url`      — an https VRM (CORS permitting)
 * `embedded` — the .vrm itself, base64 (what "export with avatars" writes)
 * `upload`   — a .vrm stored in this browser's IndexedDB (never leaves the machine; exports downgrade it)
 */
export const avatarSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('default') }),
  z.object({ kind: z.literal('url'), url: z.string().url().max(2048).refine((u) => u.startsWith('https://'), 'avatar url must be https') }),
  z.object({
    kind: z.literal('embedded'),
    name: z.string().max(120),
    // base64 of ≤ MAX_EMBEDDED_AVATAR_BYTES
    data: z.string().max(Math.ceil((MAX_EMBEDDED_AVATAR_BYTES * 4) / 3) + 8).regex(/^[A-Za-z0-9+/]*={0,2}$/, 'avatar data must be base64'),
  }),
  z.object({ kind: z.literal('upload'), name: z.string().max(120) }),
])
export type CastAvatar = z.infer<typeof avatarSchema>

export const castSlotSchema = z.object({
  id: slotIdSchema,
  name: z.string().trim().min(1).max(MAX_NAME_CHARS),
  /** null = the built-in persona for this slot. */
  persona: z.string().max(MAX_PERSONA_CHARS).nullable(),
  voice: voiceSchema,
  avatar: avatarSchema,
  temperature: z.number().min(0).max(1.5),
  top_p: z.number().min(0.1).max(1),
  color: colorSchema,
  /** Optional slots (Chad / Unit-734) join the chat rotation only when enabled. */
  enabled: z.boolean(),
})
export type CastSlot = z.infer<typeof castSlotSchema>

export const castCardSchema = z
  .object({
    format: z.literal(CAST_CARD_FORMAT),
    version: z.literal(CAST_CARD_VERSION),
    title: z.string().trim().min(1).max(MAX_TITLE_CHARS),
    author: z.string().max(60).optional(),
    slots: z.array(castSlotSchema).min(1).max(CAST_SLOT_IDS.length),
  })
  .superRefine((card, ctx) => {
    const seen = new Set<string>()
    card.slots.forEach((slot, i) => {
      if (seen.has(slot.id)) ctx.addIssue({ code: 'custom', path: ['slots', i, 'id'], message: `duplicate slot "${slot.id}"` })
      seen.add(slot.id)
    })
    for (const required of REQUIRED_SLOT_IDS) {
      const s = card.slots.find((x) => x.id === required)
      if (!s) ctx.addIssue({ code: 'custom', path: ['slots'], message: `missing required slot "${required}"` })
      else if (!s.enabled) ctx.addIssue({ code: 'custom', path: ['slots'], message: `slot "${required}" cannot be disabled` })
    }
  })
export type CastCard = z.infer<typeof castCardSchema>

export interface CastValidationResult {
  ok: boolean
  card?: CastCard
  errors: string[]
}

/** Parse + validate untrusted JSON text. Never throws. */
export function parseCastCard(text: string): CastValidationResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['Not valid JSON.'] }
  }
  return validateCastCard(raw)
}

export function validateCastCard(raw: unknown): CastValidationResult {
  const parsed = castCardSchema.safeParse(raw)
  if (parsed.success) return { ok: true, card: parsed.data, errors: [] }
  const errors = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join('.') || 'card'}: ${i.message}`)
  return { ok: false, errors }
}

/**
 * The agent as shipped: the live trio comes from app/agents.ts (what the show actually runs),
 * Chad and Unit-734 from config/agents.ts.
 */
function shippedAgent(id: CastSlotId) {
  return rosterAgents.find((x) => x.id === id) ?? defaultAgents.find((x) => x.id === id)
}

/** Default name/colour/sampling for each slot, as the show ships them. */
export function defaultSlot(id: CastSlotId): CastSlot {
  const a = shippedAgent(id)
  return {
    id,
    name: (a?.name ?? id).slice(0, MAX_NAME_CHARS),
    persona: null,
    voice: AGENT_VOICE_MAP[id as AgentVoiceId],
    avatar: { kind: 'default' },
    temperature: a?.temperature ?? 0.8,
    top_p: a?.top_p ?? 0.9,
    color: /^#[0-9a-fA-F]{6}$/.test(a?.color ?? '') ? a!.color : '#ffffff',
    // The classic trio is always on; Chad and Unit-734 are opt-in extras.
    enabled: (REQUIRED_SLOT_IDS as readonly string[]).includes(id),
  }
}

export function defaultCast(): CastCard {
  return {
    format: CAST_CARD_FORMAT,
    version: CAST_CARD_VERSION,
    title: 'The Jokesters (default cast)',
    slots: CAST_SLOT_IDS.map(defaultSlot),
  }
}

/** Shipped persona text for a slot (what `persona: null` means). */
export function builtInPersona(id: CastSlotId): string {
  return shippedAgent(id)?.systemPrompt ?? ''
}

/** Required protocol suffix: the turn parser relies on "###" and the model must speak in sentences. */
export const PERSONA_SUFFIX =
  'DO NOT start sentences with your name. You MUST reply with actual English sentences. Do NOT reply with only emojis or emoticons. End your response with "###"'

/**
 * System prompt for a custom persona: the user's text (trimmed, whitespace-normalised) plus the
 * protocol suffix, so a persona can never drop the "###" terminator the turn loop depends on.
 */
export function compilePersona(persona: string): string {
  const clean = persona.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  return `${clean}\n\n${PERSONA_SUFFIX}`
}

export interface PersonaCheck {
  /** Text to store (hard-capped). */
  text: string
  truncated: boolean
  /** Words that would be masked at the given profanity level. */
  flagged: number
  approxTokens: number
}

/** Editor-side guard rails: hard cap + a preview of what the current profanity setting would mask. */
export function checkPersona(text: string, level: ProfanityLevel): PersonaCheck {
  const truncated = text.length > MAX_PERSONA_CHARS
  const capped = truncated ? text.slice(0, MAX_PERSONA_CHARS) : text
  return {
    text: capped,
    truncated,
    flagged: maskProfanity(capped, level).masked,
    approxTokens: Math.ceil(capped.length / CHARS_PER_TOKEN),
  }
}

/**
 * Export-safe copy of a card. `upload` avatars live only in this browser's IndexedDB, so unless the
 * caller embeds them (see castStore.exportCastCard) they fall back to the default avatar.
 */
export function stripLocalAvatars(card: CastCard): CastCard {
  return {
    ...card,
    slots: card.slots.map((s) => (s.avatar.kind === 'upload' ? { ...s, avatar: { kind: 'default' as const } } : s)),
  }
}

/** Approximate decoded size of a base64 string. */
export function base64Bytes(b64: string): number {
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.floor((b64.length * 3) / 4) - pad
}

/** A .vrm is a GLB: magic bytes "glTF". */
export function looksLikeGlb(bytes: Uint8Array): boolean {
  return bytes.length > 12 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46
}
