import type * as THREE from 'three'
import type { ReactionClip } from './actorAnimations'
import type { MouthFrame } from './mouth'

/**
 * Everything Stage, the camera director, the reaction/emotion pipeline and props need from
 * an on-stage performer. `Actor` (capsule) and `VrmActor` both satisfy it, so avatars can be
 * swapped by GPU tier — or per-agent when a custom cast supplies its own .vrm.
 */
export interface StageActor {
  readonly group: THREE.Group
  getAgentId(): string
  getSignatureReactions(): readonly ReactionClip[]
  setTalking(isTalking: boolean): void
  setThinking(isThinking: boolean): void
  isThinking(): boolean
  playReaction(clip: ReactionClip, durationSec?: number): void
  reactToText(text: string): ReactionClip | null
  /**
   * Phoneme-driven mouth pose for the current speaker. `null` = no timing available;
   * the actor falls back to the loudness passed to `update`.
   */
  setMouth(frame: MouthFrame | null): void
  /** World-space point to look at; `null` = look straight ahead. */
  setGazeTarget(point: THREE.Vector3 | null): void
  update(volume: number, timeSec?: number): void
  dispose(): void
}
