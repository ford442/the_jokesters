import type { MouthShape, Viseme } from '../audio/VisemePredictor'

/**
 * Renderer-agnostic mouth pose. The five VRM vowel expressions plus a lip-closure
 * channel (bilabials, which VRM has no preset for — consumers fold it into `aa` suppression).
 * All weights are 0..1.
 */
export interface MouthFrame {
  aa: number
  ih: number
  ou: number
  ee: number
  oh: number
  /** Lips pressed together (m/b/p). Pulls every vowel weight down. */
  closed: number
}

export const NEUTRAL_MOUTH: Readonly<MouthFrame> = Object.freeze({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0, closed: 0 })

export function neutralMouth(): MouthFrame {
  return { ...NEUTRAL_MOUTH }
}

type VowelWeights = Partial<MouthFrame>

/**
 * VisemePredictor's MouthShape → VRM vowel expressions. Consonants with a visible
 * lip/teeth posture get a small contribution; tongue-only consonants (l/n/d/t, k/g)
 * stay near rest so they do not flap the jaw.
 */
const SHAPE_TO_WEIGHTS: Record<MouthShape, VowelWeights> = {
  REST: {},
  AE_AW: { aa: 1, ee: 0.15 },
  AA_AH: { aa: 0.85 },
  AO_OH: { oh: 0.9, aa: 0.2 },
  UW_OW: { ou: 0.9, oh: 0.25 },
  IH_IY_EH: { ih: 0.8, ee: 0.4 },
  UH: { aa: 0.3, oh: 0.3 },
  ER: { oh: 0.35, ih: 0.2 },
  W: { ou: 0.75 },
  R: { ou: 0.35, ih: 0.25 },
  M_B_P: { closed: 1 },
  F_V: { ih: 0.3, closed: 0.35 },
  S_Z: { ih: 0.5, ee: 0.5 },
  SH_CH_J: { ou: 0.45, ih: 0.25 },
  TH_DH: { ih: 0.35, aa: 0.1 },
  L_N_D_T: { ih: 0.25, aa: 0.1 },
  K_G_NG: { aa: 0.2 },
}

const KNOWN_SHAPES = new Set<string>(Object.keys(SHAPE_TO_WEIGHTS))

export function shapeToFrame(shape: string | undefined, intensity = 1): MouthFrame {
  const frame = neutralMouth()
  const weights = shape && KNOWN_SHAPES.has(shape) ? SHAPE_TO_WEIGHTS[shape as MouthShape] : undefined
  if (!weights) return frame
  for (const key of Object.keys(weights) as (keyof MouthFrame)[]) {
    frame[key] = clamp01((weights[key] ?? 0) * intensity)
  }
  return frame
}

export function lerpFrame(a: MouthFrame, b: MouthFrame, t: number): MouthFrame {
  const k = clamp01(t)
  return {
    aa: a.aa + (b.aa - a.aa) * k,
    ih: a.ih + (b.ih - a.ih) * k,
    ou: a.ou + (b.ou - a.ou) * k,
    ee: a.ee + (b.ee - a.ee) * k,
    oh: a.oh + (b.oh - a.oh) * k,
    closed: a.closed + (b.closed - a.closed) * k,
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function smoothstep(t: number): number {
  const k = clamp01(t)
  return k * k * (3 - 2 * k)
}

/** Fraction of a viseme (at its tail) during which the next shape is blended in. */
export const LOOKAHEAD_BLEND = 0.4

/**
 * Sample a viseme timeline at `offsetSec` from utterance start.
 * Coarticulation: during the last LOOKAHEAD_BLEND of each viseme the mouth eases
 * toward the following viseme, so lips lead the sound the way real speech does.
 * Returns null once past the end (caller should close the mouth).
 */
export function sampleVisemes(visemes: readonly Viseme[], offsetSec: number): MouthFrame | null {
  if (visemes.length === 0 || offsetSec < 0) return null
  const last = visemes[visemes.length - 1]
  if (offsetSec > last.startTime + last.duration) return null

  // Linear scan from the end is fine — an utterance has tens of visemes, sampled once a frame.
  let idx = visemes.length - 1
  for (let i = 0; i < visemes.length; i++) {
    if (offsetSec < visemes[i].startTime + visemes[i].duration) {
      idx = i
      break
    }
  }

  const cur = visemes[idx]
  const curFrame = shapeToFrame(cur.mouthShape, cur.intensity)
  const next = visemes[idx + 1]
  if (!next || cur.duration <= 0) return curFrame

  const progress = (offsetSec - cur.startTime) / cur.duration
  const blendStart = 1 - LOOKAHEAD_BLEND
  if (progress <= blendStart) return curFrame
  const t = smoothstep((progress - blendStart) / LOOKAHEAD_BLEND)
  return lerpFrame(curFrame, shapeToFrame(next.mouthShape, next.intensity), t)
}

/**
 * Loudness-only fallback (no phoneme timing): open `aa` with the signal, with a slow
 * wobble in `oh`/`ee` so the mouth does not read as a single hinge.
 */
export function loudnessToFrame(loudness: number, timeSec: number): MouthFrame {
  const open = clamp01(loudness * 2.2)
  if (open < 0.04) return neutralMouth()
  const wobble = 0.5 + 0.5 * Math.sin(timeSec * 11)
  return {
    aa: open * (0.55 + 0.45 * wobble),
    ih: 0,
    ou: 0,
    ee: open * 0.25 * (1 - wobble),
    oh: open * 0.35 * wobble,
    closed: 0,
  }
}

/** Below this loudness a timed viseme is treated as silence (pauses between words). */
const SILENCE_FLOOR = 0.015

/**
 * Per-actor mouth state machine. Feed it utterances (viseme timelines anchored to the
 * audio clock) and call `update` every frame with the audio clock + analyser loudness.
 *
 * Source priority: phoneme timeline when one is active → loudness otherwise.
 * Timed frames are gated by loudness (when a meter is available) so pauses close the
 * mouth even if the text-derived timeline is slightly out of phase with the audio.
 */
export class MouthDriver {
  private timeline: { visemes: readonly Viseme[]; startTime: number } | null = null
  private current: MouthFrame = neutralMouth()

  /** How fast the displayed mouth chases the target (1/seconds). Attack is faster than release. */
  constructor(private readonly attack = 28, private readonly release = 16) {}

  startUtterance(visemes: readonly Viseme[] | null | undefined, audioStartTime: number): void {
    this.timeline = visemes && visemes.length > 0 ? { visemes, startTime: audioStartTime } : null
  }

  stop(): void {
    this.timeline = null
  }

  hasTimeline(): boolean {
    return this.timeline !== null
  }

  update(audioNow: number, loudness: number, dt: number, wallTimeSec = audioNow): MouthFrame {
    let target: MouthFrame
    const timed = this.timeline ? sampleVisemes(this.timeline.visemes, audioNow - this.timeline.startTime) : null
    if (this.timeline && !timed && audioNow - this.timeline.startTime > 0) {
      // Past the end of the timeline: drop it and let loudness carry any audio tail.
      this.timeline = null
    }

    if (timed) {
      // Loudness gate: scale 0→1 across the floor so quiet gaps close the mouth.
      const gate = loudness <= SILENCE_FLOOR ? 0 : clamp01(0.55 + loudness * 3)
      target = scaleFrame(timed, gate)
    } else {
      target = loudnessToFrame(loudness, wallTimeSec)
    }

    const rate = (target.aa + target.ih + target.ou + target.ee + target.oh) >=
      (this.current.aa + this.current.ih + this.current.ou + this.current.ee + this.current.oh)
      ? this.attack
      : this.release
    this.current = lerpFrame(this.current, target, 1 - Math.exp(-rate * Math.max(0, dt)))
    return this.current
  }
}

function scaleFrame(f: MouthFrame, k: number): MouthFrame {
  // `closed` is a lip-press, not an opening, so it is not attenuated by the loudness gate.
  return { aa: f.aa * k, ih: f.ih * k, ou: f.ou * k, ee: f.ee * k, oh: f.oh * k, closed: f.closed }
}

/**
 * Collapse a frame into the primitive actors' single mouth line: `sx`/`sy` scale an
 * ellipse that is 0.12 wide × 0.06 tall at rest scale (1, 1).
 */
export function frameToPrimitiveMouth(f: MouthFrame): { sx: number; sy: number } {
  const open = Math.max(f.aa, f.oh * 0.9, f.ih * 0.5, f.ee * 0.45, f.ou * 0.5)
  const sy = (0.6 + open * 1.4) * (1 - 0.8 * f.closed)
  const sx = 1 + f.ee * 0.55 + f.ih * 0.25 - f.ou * 0.4 - f.oh * 0.2
  return { sx: Math.max(0.4, sx), sy: Math.max(0.12, sy) }
}
