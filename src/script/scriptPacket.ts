/** Pure helpers for script packets — no DOM, no audio, no LLM. */
import { AGENT_VOICE_MAP, type SupertonicStyleId } from '../audio/voiceMap'
import type { JokestersEpisode } from '../episode/types'
import { DEFAULT_HOLD_MS, scriptPacketSchema, type ScriptPacket, type ScriptSlot } from './types'

export type ScriptParseResult = { ok: true; packet: ScriptPacket } | { ok: false; errors: string[] }

/** Validate an already-parsed JSON value. */
export function validateScriptPacket(data: unknown): ScriptParseResult {
  const r = scriptPacketSchema.safeParse(data)
  if (r.success) return { ok: true, packet: r.data }
  return {
    ok: false,
    errors: r.error.issues.map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message)),
  }
}

/** Parse + validate JSON text. */
export function parseScriptPacket(text: string): ScriptParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { ok: false, errors: [`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`] }
  }
  return validateScriptPacket(data)
}

/** slot → Supertonic style: packet voice, else the slot's canonical voice. Last speaker on a slot wins. */
export function scriptVoiceOverrides(packet: ScriptPacket): Record<ScriptSlot, SupertonicStyleId> {
  const out = {} as Record<ScriptSlot, SupertonicStyleId>
  for (const s of packet.speakers) out[s.slot] = s.voice ?? AGENT_VOICE_MAP[s.slot]
  return out
}

/** Per-turn pause after each line, ms. */
export function scriptHoldMs(packet: ScriptPacket): number[] {
  return packet.turns.map((t) => t.holdMs ?? DEFAULT_HOLD_MS)
}

/**
 * Adapt a packet to the episode format so `replayEpisode` plays it. agentId = stage slot;
 * the episode agent carries the packet speaker's display name/color. Pure — starts nothing.
 */
export function scriptPacketToEpisode(packet: ScriptPacket): JokestersEpisode {
  const bySpeaker = new Map(packet.speakers.map((s) => [s.id, s]))
  const agents = new Map<string, { id: string; name: string; color?: string }>()
  for (const s of packet.speakers) {
    if (!agents.has(s.slot)) agents.set(s.slot, { id: s.slot, name: s.name, color: s.color })
  }
  let ts = 0
  return {
    version: 1,
    modelId: null,
    episodeId: packet.id,
    agents: [...agents.values()],
    turns: packet.turns.map((t) => {
      const sp = bySpeaker.get(t.speaker)
      if (!sp) throw new Error(`Unknown speaker "${t.speaker}"`) // unreachable after validation
      return { agentId: sp.slot, text: t.text, ts: ts++, ...(t.sfx ? { sfx: t.sfx } : {}) }
    }),
    sceneState: { title: packet.title, description: packet.description, mode: 'script', stageKit: packet.stageKit },
  }
}

/** Display name for each turn (two speakers may share a slot, so names come per turn). */
export function scriptTurnNames(packet: ScriptPacket): string[] {
  const bySpeaker = new Map(packet.speakers.map((s) => [s.id, s]))
  return packet.turns.map((t) => bySpeaker.get(t.speaker)?.name ?? t.speaker)
}

/** `?mode=script` or `?script=<url>` selects the script-player boot path. */
export function isScriptPlayerRequested(search: string): boolean {
  const q = new URLSearchParams(search)
  return q.get('mode') === 'script' || q.has('script')
}
