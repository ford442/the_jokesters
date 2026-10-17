import * as THREE from 'three'
import { VRMUtils, type VRM } from '@pixiv/three-vrm'
import {
  detectReactionFromText,
  getAnimProfile,
  reactionDuration,
  sampleIdlePose,
  sampleReactionPose,
  sampleThinkPose,
  type IdlePersonality,
  type PoseSample,
  type ReactionClip,
} from './actorAnimations'
import { BlinkController, EmotionState, extractEmotionTag, VRM_EMOTIONS } from './expressions'
import { loudnessToFrame, neutralMouth, type MouthFrame } from './mouth'
import type { StageActor } from './stageActor'

/** Neutral arms-down pose (radians about Z) — VRM models load in a T-pose. */
const ARM_DOWN = 1.2
const MAX_HEAD_YAW = 0.45
const MAX_HEAD_PITCH = 0.25

export interface VrmActorOptions {
  baseX: number
  /** Optional shared mixer for authored clips (e.g. VRMA idles). Procedural pose layers on top. */
  mixer?: THREE.AnimationMixer
  rand?: () => number
}

type NormalizedBone = THREE.Object3D | null

/**
 * A VRM avatar behaving as a StageActor: viseme-driven vowel expressions, emotion presets,
 * procedural blinking, eye+head gaze toward the speaker, and the same idle/think/reaction
 * body language the capsule actors use (sampled from actorAnimations.ts).
 */
export class VrmActor implements StageActor {
  readonly group = new THREE.Group()

  private readonly agentId: string
  private readonly baseX: number
  private readonly idle: IdlePersonality
  private readonly signatureReactions: readonly ReactionClip[]
  private readonly spotlight: THREE.SpotLight
  private readonly mixer?: THREE.AnimationMixer

  private readonly bones: Record<'head' | 'neck' | 'spine' | 'chest' | 'lUpperArm' | 'rUpperArm' | 'lLowerArm' | 'rLowerArm', NormalizedBone>

  private thinking = false
  private talking = false
  private reactionClip: ReactionClip | null = null
  private reactionElapsed = 0
  private reactionDur = 0
  private lastTimeSec = performance.now() * 0.001

  private mouthFrame: MouthFrame | null = null
  private smoothMouth: MouthFrame = neutralMouth()
  private readonly emotion = new EmotionState()
  private readonly blink: BlinkController

  /** Gaze: a world-space point the VRMLookAt tracks, eased so glances read as turns, not snaps. */
  private readonly gazeObject = new THREE.Object3D()
  private readonly gazeGoal = new THREE.Vector3(0, 1.5, 6)
  private readonly gazeLocal = new THREE.Vector3()
  private headYaw = 0
  private headPitch = 0

  constructor(
    id: string,
    private readonly vrm: VRM,
    options: VrmActorOptions,
  ) {
    this.agentId = id
    this.baseX = options.baseX
    this.mixer = options.mixer
    const profile = getAnimProfile(id)
    this.idle = profile.idle
    this.signatureReactions = profile.reactions
    this.blink = new BlinkController(options.rand)

    this.group.position.set(options.baseX, 0, 0)
    this.group.add(vrm.scene)

    const h = vrm.humanoid
    this.bones = {
      head: h.getNormalizedBoneNode('head'),
      neck: h.getNormalizedBoneNode('neck'),
      spine: h.getNormalizedBoneNode('spine'),
      chest: h.getNormalizedBoneNode('chest') ?? h.getNormalizedBoneNode('upperChest'),
      lUpperArm: h.getNormalizedBoneNode('leftUpperArm'),
      rUpperArm: h.getNormalizedBoneNode('rightUpperArm'),
      lLowerArm: h.getNormalizedBoneNode('leftLowerArm'),
      rLowerArm: h.getNormalizedBoneNode('rightLowerArm'),
    }

    // No shadow-casting spotlight: five of them would dominate the frame budget. The stage's
    // directional lights already cast the soft shadows; this one only separates the speaker.
    this.spotlight = new THREE.SpotLight(0xffffff, 0)
    this.spotlight.position.set(0, 5, 2)
    this.spotlight.target = vrm.scene
    this.spotlight.angle = Math.PI / 6
    this.spotlight.penumbra = 0.5
    this.group.add(this.spotlight)

    vrm.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })

    if (vrm.lookAt) {
      vrm.lookAt.autoUpdate = true
      vrm.lookAt.target = this.gazeObject
    }
    this.gazeObject.position.copy(this.gazeGoal)
  }

  getAgentId(): string {
    return this.agentId
  }

  getSignatureReactions(): readonly ReactionClip[] {
    return this.signatureReactions
  }

  /** Play an authored clip (VRMA etc.) through the shared mixer. */
  playClip(clip: THREE.AnimationClip): THREE.AnimationAction | null {
    if (!this.mixer) return null
    const action = this.mixer.clipAction(clip, this.vrm.scene)
    action.reset().play()
    return action
  }

  setTalking(isTalking: boolean): void {
    this.talking = isTalking
    this.spotlight.intensity = isTalking ? 50 : 0
    if (isTalking) this.thinking = false
    if (!isTalking) this.mouthFrame = null
  }

  setThinking(isThinking: boolean): void {
    this.thinking = isThinking
    if (isThinking) {
      this.reactionClip = null
      if (!this.talking) this.spotlight.intensity = 12
    } else if (!this.talking) {
      this.spotlight.intensity = 0
    }
  }

  isThinking(): boolean {
    return this.thinking
  }

  playReaction(clip: ReactionClip, durationSec?: number): void {
    this.reactionClip = clip
    this.reactionElapsed = 0
    this.reactionDur = durationSec ?? reactionDuration(clip)
    if (clip !== 'think') this.thinking = false
    this.emotion.setFromClip(clip, this.reactionDur + 0.6)
  }

  reactToText(text: string): ReactionClip | null {
    const tagged = extractEmotionTag(text)
    if (tagged) this.emotion.set(tagged, 0.85, 3)
    const clip = detectReactionFromText(text, this.signatureReactions)
    if (clip) {
      this.playReaction(clip)
      return clip
    }
    return null
  }

  setMouth(frame: MouthFrame | null): void {
    this.mouthFrame = frame
  }

  setGazeTarget(point: THREE.Vector3 | null): void {
    if (point) this.gazeGoal.copy(point)
    else this.gazeGoal.set(this.group.position.x * 0.3, 1.5, 6)
  }

  update(volume: number, timeSec?: number): void {
    const now = timeSec ?? performance.now() * 0.001
    const dt = Math.min(0.05, Math.max(0, now - this.lastTimeSec))
    this.lastTimeSec = now

    if (this.reactionClip) {
      this.reactionElapsed += dt
      if (this.reactionElapsed >= this.reactionDur) {
        this.reactionClip = null
        this.reactionElapsed = 0
      }
    }

    let pose: PoseSample
    if (this.reactionClip) {
      const progress = this.reactionDur > 0 ? this.reactionElapsed / this.reactionDur : 1
      pose = sampleReactionPose(this.reactionClip, progress)
    } else if (this.thinking && volume < 0.05) {
      pose = sampleThinkPose(now, this.idle.phase)
    } else {
      pose = sampleIdlePose(this.idle, now)
    }

    // The shared mixer (ticked once by Stage) has already written authored tracks; the
    // procedural layer below overrides only the bones it owns.
    this.applyBody(pose, now)
    this.applyGaze(dt, now)
    this.applyFace(volume, pose, now, dt)

    this.vrm.update(dt)
  }

  private applyBody(pose: PoseSample, now: number): void {
    this.group.position.x = this.baseX
    this.group.position.y = pose.groupY
    this.group.rotation.y = pose.groupRotY
    this.group.rotation.z = pose.groupRotZ

    const { spine, chest, lUpperArm, rUpperArm, lLowerArm, rLowerArm } = this.bones
    // Breathing + posture from the shared pose (squash/stretch is deliberately not applied
    // to a humanoid — only its rotational component).
    const breath = Math.sin(now * (this.idle.breathFreq || 1.5)) * this.idle.breathAmp
    if (spine) spine.rotation.set(pose.meshRotX * 0.5, 0, pose.meshRotZ * 0.5)
    if (chest) chest.rotation.set(breath * 2.5, 0, 0)

    const sway = Math.sin(now * 1.3 + this.idle.phase) * 0.03
    const gesture = this.talking ? Math.sin(now * 3.1 + this.idle.phase) * 0.08 : 0
    if (lUpperArm) lUpperArm.rotation.z = -ARM_DOWN + sway - gesture * 0.5
    if (rUpperArm) rUpperArm.rotation.z = ARM_DOWN - sway + gesture
    // Slightly bent elbows read as relaxed rather than rigid.
    if (lLowerArm) lLowerArm.rotation.y = 0.15
    if (rLowerArm) rLowerArm.rotation.y = -0.15 - (this.talking ? Math.max(0, gesture) * 3 : 0)
  }

  private applyGaze(dt: number, now: number): void {
    // Ease the look target (eyes), then derive a damped head turn toward the same point.
    const k = 1 - Math.exp(-9 * dt)
    this.gazeObject.position.lerp(this.gazeGoal, k)
    // Tiny saccades keep the eyes alive.
    this.gazeObject.position.x += Math.sin(now * 2.3 + this.idle.phase) * 0.0015
    this.gazeObject.position.y += Math.sin(now * 3.7) * 0.001

    this.gazeLocal.copy(this.gazeObject.position)
    this.group.worldToLocal(this.gazeLocal)
    const dz = Math.max(0.5, this.gazeLocal.z)
    const yaw = THREE.MathUtils.clamp(Math.atan2(this.gazeLocal.x, dz), -MAX_HEAD_YAW, MAX_HEAD_YAW)
    const pitch = THREE.MathUtils.clamp(-Math.atan2(this.gazeLocal.y - 1.5, dz) * 0.5, -MAX_HEAD_PITCH, MAX_HEAD_PITCH)
    const hk = 1 - Math.exp(-5 * dt)
    this.headYaw += (yaw * 0.55 - this.headYaw) * hk
    this.headPitch += (pitch - this.headPitch) * hk

    const { head, neck } = this.bones
    const thinkTilt = this.thinking ? 0.12 : 0
    if (neck) neck.rotation.set(this.headPitch * 0.4, this.headYaw * 0.4, 0)
    if (head) head.rotation.set(this.headPitch * 0.6 + thinkTilt, this.headYaw * 0.6, thinkTilt * 0.5)
  }

  private applyFace(volume: number, pose: PoseSample, now: number, dt: number): void {
    const em = this.vrm.expressionManager
    if (!em) return

    // Mouth: phoneme-timed frame when available, loudness otherwise.
    const target = this.mouthFrame ?? (volume > 0.02 ? loudnessToFrame(volume, now) : neutralMouth())
    // Frames from MouthDriver are already smoothed; this extra pass only covers the fallback path.
    const s = 1 - Math.exp(-(this.mouthFrame ? 40 : 18) * dt)
    const m = this.smoothMouth
    m.aa += (target.aa - m.aa) * s
    m.ih += (target.ih - m.ih) * s
    m.ou += (target.ou - m.ou) * s
    m.ee += (target.ee - m.ee) * s
    m.oh += (target.oh - m.oh) * s
    m.closed += (target.closed - m.closed) * s
    const open = 1 - m.closed * 0.85
    const idleOpen = pose.mouthOpen * 0.4
    em.setValue('aa', Math.min(1, m.aa * open + idleOpen))
    em.setValue('ih', m.ih * open)
    em.setValue('ou', m.ou * open)
    em.setValue('ee', m.ee * open)
    em.setValue('oh', m.oh * open)

    // Emotions (one dominant at a time, eased).
    const w = this.emotion.update(dt)
    for (const e of VRM_EMOTIONS) em.setValue(e, w[e])

    // Blink; a wide-eyed surprise suppresses it, a squinting pose adds to it.
    const surprised = w.surprised > 0.4
    const squint = Math.max(0, 1 - pose.eyeScaleY) * 0.7
    const lid = Math.max(this.blink.update(dt, surprised), squint)
    em.setValue('blink', surprised ? 0 : lid)
  }

  dispose(): void {
    this.group.removeFromParent()
    this.spotlight.dispose?.()
    this.mixer?.uncacheRoot(this.vrm.scene)
    VRMUtils.deepDispose(this.vrm.scene)
  }
}
