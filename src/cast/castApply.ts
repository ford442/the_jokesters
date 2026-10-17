import type { Agent } from '../types/chat'
import { agents as defaultAgents } from '../config/agents'
import { setVoiceOverrides } from '../audio/voiceMap'
import { setPersonaBaseOverrides } from '../chat/PersonalityStore'
import { bundledAvatarUrl } from '../visuals/avatarManifest'
import type { AvatarTier } from '../visuals/avatarTier'
import { CAST_SLOT_IDS, compilePersona, type CastCard, type CastSlot, type CastSlotId } from './castCard'
import type { AvatarStore } from './castStore'

/** The prompts each roster agent shipped with, captured before any cast overwrites them. */
const originalPrompts = new Map<string, string>()

export interface RosterApplyResult {
  /** Ids on stage after applying, in rotation order. */
  roster: string[]
  /** True when the set of speaking agents changed (conversation should restart). */
  rosterChanged: boolean
}

function newAgentFor(slot: CastSlot): Agent {
  const base = defaultAgents.find((a) => a.id === slot.id)!
  return { ...base }
}

/**
 * Apply a card's text-side settings — names, personas, sampling, voices, which optional agents
 * are in the rotation — to the shared roster array **in place** (GroupChatManager and
 * ConversationStore hold that array by reference). Safe to call before the manager exists.
 */
export function applyCastToRoster(roster: Agent[], card: CastCard): RosterApplyResult {
  const before = roster.map((a) => a.id).join(',')
  const next: Agent[] = []

  for (const id of CAST_SLOT_IDS) {
    const slot = card.slots.find((s) => s.id === id)
    if (!slot?.enabled) continue
    const agent = roster.find((a) => a.id === id) ?? newAgentFor(slot)
    if (!originalPrompts.has(id)) originalPrompts.set(id, agent.systemPrompt)

    agent.name = slot.name
    agent.color = slot.color
    agent.temperature = slot.temperature
    agent.top_p = slot.top_p
    if (slot.persona === null) {
      agent.systemPrompt = originalPrompts.get(id)!
      agent.custom = false
    } else {
      agent.systemPrompt = compilePersona(slot.persona)
      agent.custom = true
    }
    next.push(agent)
  }

  roster.splice(0, roster.length, ...next)

  // Voices: only deviations from the shipped map matter, but setting all is harmless and simple.
  setVoiceOverrides(Object.fromEntries(card.slots.map((s) => [s.id, s.voice])))
  // Persona evolution (feedback buttons) rebuilds from a base prompt; keep it on the custom persona.
  setPersonaBaseOverrides(
    Object.fromEntries(
      card.slots.filter((s) => s.persona !== null).map((s) => [s.id, compilePersona(s.persona!)]),
    ),
  )

  return { roster: next.map((a) => a.id), rosterChanged: before !== next.map((a) => a.id).join(',') }
}

/** Stage surface castApply needs (keeps this module free of three.js). */
export interface AvatarStage {
  swapActorToVrm(id: string, url: string): Promise<boolean>
  resetActorToPrimitive(id: string): void
  getActorKind(id: string): 'primitive' | 'vrm' | null
}

export interface AvatarApplyResult {
  loaded: CastSlotId[]
  failed: Array<{ id: CastSlotId; reason: string }>
}

/** `${kind}:${identity}` of what is on stage per slot, so unchanged slots are not reloaded (a VRM is ~10 MB). */
const appliedAvatar = new Map<string, string>()

function avatarKey(slot: CastSlot, tier: AvatarTier): string {
  switch (slot.avatar.kind) {
    case 'upload': return `upload:${slot.avatar.name}`
    case 'url': return `url:${slot.avatar.url}`
    default: return `default:${tier}`
  }
}

/**
 * Apply avatar choices to the stage. Uploads and URLs load regardless of GPU tier (the user
 * asked for them); `default` follows the tier — bundled VRM on capable GPUs, capsule otherwise.
 * Any failure leaves (or restores) that agent's capsule.
 */
export async function applyCastAvatars(
  card: CastCard,
  deps: { stage: AvatarStage; store: AvatarStore; tier: AvatarTier },
): Promise<AvatarApplyResult> {
  const result: AvatarApplyResult = { loaded: [], failed: [] }
  await Promise.all(
    card.slots.map(async (slot) => {
      const key = avatarKey(slot, deps.tier)
      if (appliedAvatar.get(slot.id) === key && deps.stage.getActorKind(slot.id) !== null) {
        if (deps.stage.getActorKind(slot.id) === 'vrm') result.loaded.push(slot.id)
        return
      }
      let objectUrl: string | null = null
      try {
        let url: string | null = null
        if (slot.avatar.kind === 'upload') {
          const stored = await deps.store.get(slot.id)
          if (!stored) throw new Error('uploaded avatar is missing from this browser')
          objectUrl = URL.createObjectURL(stored.blob)
          url = objectUrl
        } else if (slot.avatar.kind === 'url') {
          url = slot.avatar.url
        } else if (deps.tier === 'vrm') {
          url = bundledAvatarUrl(slot.id)
        }

        if (!url) {
          deps.stage.resetActorToPrimitive(slot.id)
        } else if (await deps.stage.swapActorToVrm(slot.id, url)) {
          result.loaded.push(slot.id)
        } else {
          deps.stage.resetActorToPrimitive(slot.id)
          result.failed.push({ id: slot.id, reason: 'avatar load was superseded' })
          return
        }
        appliedAvatar.set(slot.id, key)
      } catch (err) {
        deps.stage.resetActorToPrimitive(slot.id)
        appliedAvatar.delete(slot.id)
        result.failed.push({ id: slot.id, reason: (err as Error)?.message ?? String(err) })
      } finally {
        // GLTFLoader has already read the bytes by the time swap resolves.
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }),
  )
  return result
}

export function _resetCastApplyStateForTests(): void {
  originalPrompts.clear()
  appliedAvatar.clear()
}
