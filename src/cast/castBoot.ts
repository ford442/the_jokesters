import type { Agent } from '../types/chat'
import type { AvatarTier } from '../visuals/avatarTier'
import { applyCastAvatars, applyCastToRoster, type AvatarApplyResult, type AvatarStage } from './castApply'
import type { CastCard } from './castCard'
import { IdbAvatarStore, loadActiveCard } from './castStore'

/**
 * Boot-time hook. Loaded dynamically (and only when a cast is stored) so zod and the editor
 * stay out of the initial bundle. Text-side settings are applied to the shared roster before
 * GroupChatManager exists; avatars follow once the stage is up.
 */
export function applyStoredCastToRoster(roster: Agent[]): CastCard | null {
  const card = loadActiveCard()
  if (!card) return null
  applyCastToRoster(roster, card)
  console.log(`[Cast] Applied custom cast "${card.title}" · on stage: ${roster.map((a) => a.name).join(', ')}`)
  return card
}

export function applyStoredCastAvatars(card: CastCard, stage: AvatarStage, tier: AvatarTier): Promise<AvatarApplyResult> {
  return applyCastAvatars(card, { stage, store: new IdbAvatarStore(), tier })
}
