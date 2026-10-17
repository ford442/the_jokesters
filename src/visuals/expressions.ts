import type { ReactionClip } from './actorAnimations'

/** VRM 1.0 emotion presets (the VRM0 names map onto these in three-vrm). */
export const VRM_EMOTIONS = ['happy', 'angry', 'sad', 'surprised', 'relaxed'] as const
export type VrmEmotion = (typeof VRM_EMOTIONS)[number]

export type EmotionWeights = Record<VrmEmotion, number>

export function zeroEmotions(): EmotionWeights {
  return { happy: 0, angry: 0, sad: 0, surprised: 0, relaxed: 0 }
}

export interface EmotionCue {
  emotion: VrmEmotion | null
  intensity: number
}

/**
 * Reaction clip → face. The body animation (actorAnimations.ts) is unchanged; this only
 * decides which expression rides along. `null` emotion = neutral face.
 */
const CLIP_EMOTION: Record<ReactionClip, EmotionCue> = {
  laugh: { emotion: 'happy', intensity: 1 },
  bounce: { emotion: 'happy', intensity: 0.7 },
  gasp: { emotion: 'surprised', intensity: 1 },
  angry: { emotion: 'angry', intensity: 0.9 },
  facepalm: { emotion: 'sad', intensity: 0.7 },
  eyeroll: { emotion: 'relaxed', intensity: 0.6 },
  think: { emotion: 'relaxed', intensity: 0.45 },
  nod: { emotion: 'relaxed', intensity: 0.4 },
  shrug: { emotion: 'relaxed', intensity: 0.3 },
  deadpan: { emotion: null, intensity: 0 },
}

export function clipToEmotion(clip: ReactionClip): EmotionCue {
  return CLIP_EMOTION[clip] ?? { emotion: null, intensity: 0 }
}

const EMOTION_TAG = /\[(happy|angry|sad|surprised|relaxed)\]/i

/** Explicit `[happy]`-style tag in model/director text, if any. */
export function extractEmotionTag(text: string): VrmEmotion | null {
  const m = EMOTION_TAG.exec(text)
  return m ? (m[1].toLowerCase() as VrmEmotion) : null
}

/**
 * Smoothed emotion channel: one active emotion at a time, eased in and out so
 * expressions never pop. A cue holds for `holdSec`, then decays back to neutral.
 */
export class EmotionState {
  private weights: EmotionWeights = zeroEmotions()
  private target: EmotionCue = { emotion: null, intensity: 0 }
  private holdLeft = 0

  constructor(private readonly easeIn = 9, private readonly easeOut = 4) {}

  set(emotion: VrmEmotion | null, intensity = 1, holdSec = 2.5): void {
    this.target = { emotion, intensity: emotion ? Math.max(0, Math.min(1, intensity)) : 0 }
    this.holdLeft = holdSec
  }

  setFromClip(clip: ReactionClip, holdSec: number): void {
    const cue = clipToEmotion(clip)
    this.set(cue.emotion, cue.intensity, holdSec)
  }

  update(dt: number): Readonly<EmotionWeights> {
    if (this.holdLeft > 0) {
      this.holdLeft -= dt
      if (this.holdLeft <= 0) this.target = { emotion: null, intensity: 0 }
    }
    for (const e of VRM_EMOTIONS) {
      const goal = this.target.emotion === e ? this.target.intensity : 0
      const rate = goal > this.weights[e] ? this.easeIn : this.easeOut
      this.weights[e] += (goal - this.weights[e]) * (1 - Math.exp(-rate * Math.max(0, dt)))
      if (this.weights[e] < 0.001) this.weights[e] = 0
    }
    return this.weights
  }
}

/**
 * Procedural blink: irregular 2–6 s gaps, ~160 ms close/open, with an occasional double blink.
 * Pure state machine — `rand` is injectable so tests are deterministic.
 */
export class BlinkController {
  private untilNext: number
  private phase = 0 // 0..1 progress through the current blink; <0 means idle
  private active = false
  private pending = 0 // queued extra blinks (double blink)

  constructor(private readonly rand: () => number = Math.random, private readonly durationSec = 0.16) {
    this.untilNext = this.nextGap()
  }

  private nextGap(): number {
    return 2 + this.rand() * 4
  }

  /** Eyelid closure 0 (open) … 1 (shut). `suppress` holds the eyes open (e.g. a wide-eyed gasp). */
  update(dt: number, suppress = false): number {
    if (this.active) {
      this.phase += dt / this.durationSec
      if (this.phase >= 1) {
        this.active = false
        this.phase = 0
        if (this.pending > 0) {
          this.pending--
          this.untilNext = 0.08
        } else {
          this.untilNext = this.nextGap()
        }
        return 0
      }
      // Fast close (first 40%), slower open.
      const p = this.phase
      return p < 0.4 ? p / 0.4 : 1 - (p - 0.4) / 0.6
    }
    this.untilNext -= dt
    if (this.untilNext <= 0 && !suppress) {
      this.active = true
      this.phase = 0
      if (this.pending === 0 && this.rand() < 0.15) this.pending = 1
    }
    return 0
  }

  isBlinking(): boolean {
    return this.active
  }
}
