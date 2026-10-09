/**
 * Camera grammar for the stage. Pure data — no Three.js, no actor meshes.
 * The render loop copies the resulting pose onto the camera only, so lip-sync
 * squash/stretch on the speaking actor is never overwritten.
 */

import { resolveStageKitId, type StageKitId } from '../stageKitIds'

export type CameraShot = 'idle' | 'speakerClose' | 'twoShot'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface CameraPose {
  position: Vec3
  lookAt: Vec3
  fov: number
}

/** Home X of each capsule. Matches `Stage.initActors`. */
export const ACTOR_STAGE_X: Readonly<Record<string, number>> = {
  comedian: -3.2,
  philosopher: -1.6,
  scientist: 0,
  techBro: 1.6,
  robot: 3.2,
}

const WHIP_DURATION_SEC = 0.42
const WHIP_AMPLITUDE = 0.9

/** How long a new speaker holds a two-shot before the push-in. */
const TWO_SHOT_HOLD_SEC = 1.35

export interface CameraDirectorState {
  pose: CameraPose
  /** Seconds since the whip started, or -1 when idle. */
  whipElapsed: number
  kit: StageKitId
  speakerId: string | null
  secondsOnSpeaker: number
}

export interface CameraStepInput {
  dt: number
  activeActorId: string | null
  previousActorId: string | null
  kit: StageKitId | string
  triggerWhip?: boolean
}

export function actorFocus(id: string | null): Vec3 {
  const x = id != null && Object.prototype.hasOwnProperty.call(ACTOR_STAGE_X, id)
    ? ACTOR_STAGE_X[id]
    : 0
  return { x, y: 1.15, z: 0 }
}

export function selectCameraShot(input: {
  activeActorId: string | null
  previousActorId: string | null
  secondsOnSpeaker: number
}): CameraShot {
  if (!input.activeActorId) return 'idle'
  if (
    input.previousActorId
    && input.previousActorId !== input.activeActorId
    && input.secondsOnSpeaker < TWO_SHOT_HOLD_SEC
  ) {
    return 'twoShot'
  }
  return 'speakerClose'
}

/** Court is a wider lens; talk show / news push in tighter than the bare stage. */
export function kitFov(kit: StageKitId, shot: CameraShot): number {
  const base = kit === 'court' ? 64 : kit === 'talkshow' || kit === 'news' ? 48 : 58
  if (shot === 'idle') return base + 8
  if (shot === 'twoShot') return base + 4
  return base - 4
}

export function poseForShot(
  shot: CameraShot,
  activeId: string | null,
  previousId: string | null,
  kit: StageKitId,
): CameraPose {
  const fov = kitFov(kit, shot)
  if (shot === 'idle' || !activeId) {
    return {
      position: { x: 0, y: 2.2, z: 6.5 },
      lookAt: { x: 0, y: 1.05, z: 0 },
      fov,
    }
  }
  const speaker = actorFocus(activeId)
  if (shot === 'twoShot') {
    const other = actorFocus(previousId)
    const mid = (speaker.x + other.x) / 2
    return {
      position: { x: mid * 0.55, y: 1.95, z: 4.6 },
      lookAt: { x: mid, y: 1.1, z: 0 },
      fov,
    }
  }
  return {
    position: { x: speaker.x * 0.78, y: 1.62, z: 3.25 },
    lookAt: { x: speaker.x, y: 1.2, z: 0 },
    fov,
  }
}

export function lerpPose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  const u = Math.min(1, Math.max(0, t))
  const mix = (a: number, b: number) => a + (b - a) * u
  return {
    position: {
      x: mix(from.position.x, to.position.x),
      y: mix(from.position.y, to.position.y),
      z: mix(from.position.z, to.position.z),
    },
    lookAt: {
      x: mix(from.lookAt.x, to.lookAt.x),
      y: mix(from.lookAt.y, to.lookAt.y),
      z: mix(from.lookAt.z, to.lookAt.z),
    },
    fov: mix(from.fov, to.fov),
  }
}

/** Lateral kick for a callback / tag. Zero outside the whip window. */
export function whipLateralOffset(elapsed: number): number {
  if (elapsed < 0 || elapsed > WHIP_DURATION_SEC) return 0
  return Math.sin((elapsed / WHIP_DURATION_SEC) * Math.PI) * WHIP_AMPLITUDE
}

export function createCameraDirectorState(kit: StageKitId = 'void'): CameraDirectorState {
  const resolved = resolveStageKitId(kit)
  return {
    pose: poseForShot('idle', null, null, resolved),
    whipElapsed: -1,
    kit: resolved,
    speakerId: null,
    secondsOnSpeaker: 0,
  }
}

export function triggerWhip(state: CameraDirectorState): CameraDirectorState {
  return { ...state, whipElapsed: 0 }
}

function dampAlpha(dt: number, lambda: number): number {
  return 1 - Math.exp(-lambda * Math.max(0, dt))
}

export function stepCameraDirector(state: CameraDirectorState, input: CameraStepInput): CameraDirectorState {
  const kit = resolveStageKitId(input.kit)
  const sameSpeaker = input.activeActorId != null && input.activeActorId === state.speakerId
  const secondsOnSpeaker = sameSpeaker ? state.secondsOnSpeaker + Math.max(0, input.dt) : 0
  const shot = selectCameraShot({
    activeActorId: input.activeActorId,
    previousActorId: input.previousActorId,
    secondsOnSpeaker,
  })
  let target = poseForShot(shot, input.activeActorId, input.previousActorId, kit)
  let whipElapsed = input.triggerWhip ? 0 : state.whipElapsed
  const offset = whipLateralOffset(whipElapsed)
  if (offset !== 0) {
    target = {
      ...target,
      position: { ...target.position, x: target.position.x + offset },
    }
  }
  if (whipElapsed >= 0) {
    whipElapsed += Math.max(0, input.dt)
    if (whipElapsed > WHIP_DURATION_SEC) whipElapsed = -1
  }
  const lambda = offset !== 0 ? 10 : shot === 'speakerClose' ? 2.6 : 1.8
  return {
    pose: lerpPose(state.pose, target, dampAlpha(input.dt, lambda)),
    whipElapsed,
    kit,
    speakerId: input.activeActorId,
    secondsOnSpeaker,
  }
}
