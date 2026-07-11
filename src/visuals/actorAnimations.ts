/**
 * Lightweight procedural avatar animation profiles & text → clip mapping.
 * No Three.js dependency — pure math for unit tests and FPS-friendly sampling.
 */

export type ReactionClip =
  | 'laugh'
  | 'think'
  | 'gasp'
  | 'angry'
  | 'deadpan'
  | 'facepalm'
  | 'eyeroll'
  | 'nod'
  | 'bounce'
  | 'shrug'

/** Idle personality loop parameters (all amplitudes in world/local units). */
export interface IdlePersonality {
  /** Vertical bounce amplitude */
  bounceAmp: number
  bounceFreq: number
  /** Side lean (rotation Z) */
  swayAmp: number
  swayFreq: number
  /** Head/body nod (rotation X) */
  nodAmp: number
  nodFreq: number
  /** Yaw twist */
  twistAmp: number
  twistFreq: number
  /** Breath scale pulse */
  breathAmp: number
  breathFreq: number
  /** Phase offset so agents don't sync */
  phase: number
}

export interface AgentAnimProfile {
  agentId: string
  idle: IdlePersonality
  /** Three signature reaction clips for this persona */
  reactions: readonly [ReactionClip, ReactionClip, ReactionClip]
}

export interface PoseSample {
  groupY: number
  groupRotY: number
  groupRotZ: number
  meshRotX: number
  meshRotZ: number
  meshScaleY: number
  meshScaleXZ: number
  eyeScaleY: number
  mouthOpen: number
}

const ZERO_POSE: PoseSample = {
  groupY: 0,
  groupRotY: 0,
  groupRotZ: 0,
  meshRotX: 0,
  meshRotZ: 0,
  meshScaleY: 1,
  meshScaleXZ: 1,
  eyeScaleY: 1,
  mouthOpen: 0,
}

function idleFor(
  bounceAmp: number,
  bounceFreq: number,
  swayAmp: number,
  swayFreq: number,
  nodAmp: number,
  nodFreq: number,
  twistAmp: number,
  twistFreq: number,
  breathAmp: number,
  breathFreq: number,
  phase: number,
): IdlePersonality {
  return {
    bounceAmp,
    bounceFreq,
    swayAmp,
    swayFreq,
    nodAmp,
    nodFreq,
    twistAmp,
    twistFreq,
    breathAmp,
    breathFreq,
    phase,
  }
}

/**
 * Distinct idle + 3 reaction states per agent (acceptance: 5 agents).
 */
export const AGENT_ANIM_PROFILES: Record<string, AgentAnimProfile> = {
  comedian: {
    agentId: 'comedian',
    idle: idleFor(0.06, 3.2, 0.04, 2.4, 0.03, 2.8, 0.05, 1.6, 0.02, 2.5, 0.1),
    reactions: ['laugh', 'bounce', 'gasp'],
  },
  philosopher: {
    agentId: 'philosopher',
    idle: idleFor(0.015, 0.9, 0.02, 0.7, 0.05, 0.85, 0.02, 0.5, 0.012, 1.1, 1.2),
    reactions: ['think', 'nod', 'eyeroll'],
  },
  scientist: {
    agentId: 'scientist',
    idle: idleFor(0.02, 1.4, 0.015, 1.1, 0.025, 1.6, 0.03, 0.9, 0.01, 1.5, 2.4),
    reactions: ['think', 'gasp', 'shrug'],
  },
  techBro: {
    agentId: 'techBro',
    idle: idleFor(0.03, 2.0, 0.025, 1.8, 0.02, 1.5, 0.06, 1.2, 0.018, 2.0, 3.1),
    reactions: ['laugh', 'shrug', 'angry'],
  },
  robot: {
    agentId: 'robot',
    idle: idleFor(0.008, 0.6, 0.01, 0.4, 0.04, 0.55, 0.0, 0.3, 0.005, 0.8, 4.0),
    reactions: ['deadpan', 'think', 'nod'],
  },
}

export function getAnimProfile(agentId: string): AgentAnimProfile {
  return (
    AGENT_ANIM_PROFILES[agentId] ?? {
      agentId,
      idle: idleFor(0.02, 1.5, 0.02, 1.2, 0.02, 1.2, 0.02, 1.0, 0.012, 1.5, 0),
      reactions: ['nod', 'gasp', 'shrug'],
    }
  )
}

/** Duration in seconds for each reaction clip. */
export function reactionDuration(clip: ReactionClip): number {
  switch (clip) {
    case 'laugh':
      return 1.1
    case 'think':
      return 1.4
    case 'gasp':
      return 0.7
    case 'angry':
      return 1.0
    case 'deadpan':
      return 1.2
    case 'facepalm':
      return 1.3
    case 'eyeroll':
      return 0.9
    case 'nod':
      return 0.8
    case 'bounce':
      return 0.9
    case 'shrug':
      return 1.0
    default:
      return 1.0
  }
}

/**
 * Sample idle pose at wall-clock seconds.
 */
export function sampleIdlePose(idle: IdlePersonality, timeSec: number): PoseSample {
  const t = timeSec + idle.phase
  const breath = 1 + Math.sin(t * idle.breathFreq * Math.PI * 2) * idle.breathAmp
  return {
    groupY: Math.sin(t * idle.bounceFreq * Math.PI * 2) * idle.bounceAmp,
    groupRotY: Math.sin(t * idle.twistFreq * Math.PI * 2) * idle.twistAmp,
    groupRotZ: Math.sin(t * idle.swayFreq * Math.PI * 2) * idle.swayAmp,
    meshRotX: Math.sin(t * idle.nodFreq * Math.PI * 2) * idle.nodAmp,
    meshRotZ: 0,
    meshScaleY: breath,
    meshScaleXZ: 1 / Math.sqrt(Math.max(0.5, breath)),
    eyeScaleY: 1,
    mouthOpen: 0,
  }
}

/**
 * Continuous "thinking" pose while LLM generates (bob + lean + slight rock).
 */
export function sampleThinkPose(timeSec: number, phase = 0): PoseSample {
  const t = timeSec + phase
  return {
    groupY: Math.sin(t * 2.2) * 0.02,
    groupRotY: Math.sin(t * 1.1) * 0.04,
    groupRotZ: -0.08 + Math.sin(t * 1.4) * 0.02,
    meshRotX: 0.18 + Math.sin(t * 1.8) * 0.04, // chin-down / pondering
    meshRotZ: 0.05,
    meshScaleY: 1 + Math.sin(t * 3) * 0.015,
    meshScaleXZ: 1,
    eyeScaleY: 0.85, // slight squint of concentration
    mouthOpen: 0,
  }
}

/**
 * One-shot reaction poses. `progress` is 0..1 over the clip duration.
 */
export function sampleReactionPose(clip: ReactionClip, progress: number): PoseSample {
  const p = Math.max(0, Math.min(1, progress))
  // Ease in-out envelope for attack/release
  const env = Math.sin(p * Math.PI)
  const attack = Math.min(1, p * 4)
  const release = p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1
  const e = env * release

  switch (clip) {
    case 'laugh':
      return {
        ...ZERO_POSE,
        groupY: Math.abs(Math.sin(p * Math.PI * 6)) * 0.1 * e,
        meshRotX: -0.15 * e + Math.sin(p * Math.PI * 8) * 0.08,
        meshScaleY: 1 + 0.08 * Math.sin(p * Math.PI * 10) * e,
        meshScaleXZ: 1 - 0.04 * e,
        mouthOpen: 0.6 * e,
        eyeScaleY: 0.7 + 0.3 * (1 - e),
      }
    case 'think':
      return {
        ...ZERO_POSE,
        meshRotX: 0.22 * attack * release,
        groupRotZ: -0.12 * attack * release,
        groupRotY: 0.08 * e,
        eyeScaleY: 0.75,
      }
    case 'gasp':
      return {
        ...ZERO_POSE,
        groupY: 0.12 * attack * (1 - p * 0.5),
        meshScaleY: 1 + 0.12 * attack * release,
        meshScaleXZ: 1 - 0.06 * attack * release,
        mouthOpen: 0.9 * e,
        eyeScaleY: 1.25 * attack * release + (1 - attack),
      }
    case 'angry':
      return {
        ...ZERO_POSE,
        meshRotX: 0.1 * e,
        groupRotZ: Math.sin(p * Math.PI * 12) * 0.06 * e,
        meshScaleXZ: 1.08 * e + (1 - e),
        meshScaleY: 0.95,
        eyeScaleY: 0.55 + 0.1 * Math.sin(p * 20),
        mouthOpen: 0.2 * e,
      }
    case 'deadpan':
      return {
        ...ZERO_POSE,
        meshRotX: 0.02,
        groupY: 0,
        eyeScaleY: 0.35 + 0.05 * Math.sin(p * 2), // half-lidded stare
        mouthOpen: 0,
        meshScaleY: 1,
      }
    case 'facepalm':
      return {
        ...ZERO_POSE,
        meshRotX: 0.45 * e, // bow head into hand
        groupRotZ: 0.15 * e,
        groupY: -0.04 * e,
        eyeScaleY: 0.2,
        mouthOpen: 0.1,
      }
    case 'eyeroll':
      return {
        ...ZERO_POSE,
        meshRotX: -0.12 * e + 0.2 * Math.sin(p * Math.PI),
        groupRotY: Math.sin(p * Math.PI) * 0.15,
        eyeScaleY: 0.5 + 0.5 * Math.abs(Math.sin(p * Math.PI * 2)),
      }
    case 'nod':
      return {
        ...ZERO_POSE,
        meshRotX: Math.sin(p * Math.PI * 3) * 0.2 * e,
        groupY: Math.abs(Math.sin(p * Math.PI * 3)) * 0.02,
      }
    case 'bounce':
      return {
        ...ZERO_POSE,
        groupY: Math.abs(Math.sin(p * Math.PI * 4)) * 0.14 * e,
        meshScaleY: 1 + Math.abs(Math.sin(p * Math.PI * 4)) * 0.1 * e,
        meshScaleXZ: 1 - Math.abs(Math.sin(p * Math.PI * 4)) * 0.05 * e,
        mouthOpen: 0.3 * e,
      }
    case 'shrug':
      return {
        ...ZERO_POSE,
        meshScaleY: 1 + 0.06 * e,
        meshScaleXZ: 1.1 * e + (1 - e) * 1,
        meshRotX: -0.05 * e,
        groupRotY: Math.sin(p * Math.PI) * 0.05,
      }
    default:
      return { ...ZERO_POSE }
  }
}

/** Director-style tags in text: [laugh], [think], etc. */
const TAG_RE = /\[(laugh|think|gasp|angry|deadpan|facepalm|eyeroll|nod|bounce|shrug)\]/gi

const KEYWORD_RULES: { re: RegExp; clip: ReactionClip; weight: number }[] = [
  { re: /\b(ha(ha)+|heh+|lol|lmao|rofl|hilarious|comedy gold)\b/i, clip: 'laugh', weight: 3 },
  { re: /[!]{2,}|\b(oh my|whoa+|wow+|no way|wait what)\b/i, clip: 'gasp', weight: 2 },
  { re: /\b(hmm+|let me think|ponder|consider|analyz|hypothesis|interesting)\b/i, clip: 'think', weight: 2 },
  { re: /\b(ugh|facepalm|unbelievable|i can't even)\b/i, clip: 'facepalm', weight: 3 },
  { re: /\b(whatever|sure jan|obviously|as if|eye.?roll)\b/i, clip: 'eyeroll', weight: 2 },
  { re: /\b(angry|furious|outrage|how dare|unacceptable)\b/i, clip: 'angry', weight: 2 },
  { re: /\b(beep|boop|affirma|negat|does not compute|deadpan)\b/i, clip: 'deadpan', weight: 2 },
  { re: /\b(yep|indeed|agreed|precisely|exactly)\b/i, clip: 'nod', weight: 1 },
  { re: /\b(woo+|let's go|energy|hype)\b/i, clip: 'bounce', weight: 2 },
  { re: /\b(shrug|dunno|who knows|beats me|idk)\b/i, clip: 'shrug', weight: 2 },
]

/**
 * Strip director tags and return ordered clips to play.
 */
export function extractDirectorTags(text: string): { cleanText: string; clips: ReactionClip[] } {
  const clips: ReactionClip[] = []
  const cleanText = text
    .replace(TAG_RE, (_m, tag: string) => {
      clips.push(tag.toLowerCase() as ReactionClip)
      return ''
    })
    .replace(/\s{2,}/g, ' ')
    .trim()
  return { cleanText, clips }
}

/**
 * Map utterance text → a single best reaction clip (or null).
 * Prefer explicit director tags, then keyword rules.
 * Optional `preferred` limits to the agent's signature reactions (plus universal ones).
 */
export function detectReactionFromText(
  text: string,
  preferred?: readonly ReactionClip[],
): ReactionClip | null {
  const { clips } = extractDirectorTags(text)
  if (clips.length > 0) return clips[0]

  let best: { clip: ReactionClip; weight: number } | null = null
  for (const rule of KEYWORD_RULES) {
    if (!rule.re.test(text)) continue
    // Prefer signature reactions slightly
    let w = rule.weight
    if (preferred && preferred.includes(rule.clip)) w += 1
    if (!best || w > best.weight) best = { clip: rule.clip, weight: w }
  }
  return best?.clip ?? null
}

/**
 * Pick a fallback reaction from the agent's signature set (e.g. light nod).
 */
export function pickSignatureReaction(
  agentId: string,
  index = 0,
): ReactionClip {
  const profile = getAnimProfile(agentId)
  return profile.reactions[index % profile.reactions.length]
}

/** All known agent ids with full profiles (for tests / Stage init). */
export function listAnimatedAgentIds(): string[] {
  return Object.keys(AGENT_ANIM_PROFILES)
}
