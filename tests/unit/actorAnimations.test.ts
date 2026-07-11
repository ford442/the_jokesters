import { describe, it, expect } from 'vitest'
import {
  AGENT_ANIM_PROFILES,
  detectReactionFromText,
  extractDirectorTags,
  getAnimProfile,
  listAnimatedAgentIds,
  reactionDuration,
  sampleIdlePose,
  sampleReactionPose,
  sampleThinkPose,
  type ReactionClip,
} from '../../src/visuals/actorAnimations'

describe('AGENT_ANIM_PROFILES', () => {
  it('covers all 5 agents with distinct idle + 3 reactions', () => {
    const ids = listAnimatedAgentIds()
    expect(ids).toEqual(
      expect.arrayContaining(['comedian', 'philosopher', 'scientist', 'techBro', 'robot']),
    )
    expect(ids).toHaveLength(5)

    const idleSignatures = new Set<string>()
    for (const id of ids) {
      const p = AGENT_ANIM_PROFILES[id]
      expect(p.reactions).toHaveLength(3)
      expect(new Set(p.reactions).size).toBe(3)
      // Distinct idle: bounce amp + freq fingerprint
      const sig = `${p.idle.bounceAmp}:${p.idle.bounceFreq}:${p.idle.nodFreq}:${p.idle.phase}`
      expect(idleSignatures.has(sig)).toBe(false)
      idleSignatures.add(sig)
    }
  })

  it('getAnimProfile falls back for unknown agents', () => {
    const p = getAnimProfile('unknown-agent')
    expect(p.reactions).toHaveLength(3)
    expect(p.idle.bounceAmp).toBeGreaterThan(0)
  })
})

describe('sampleIdlePose / sampleThinkPose / sampleReactionPose', () => {
  it('samples finite poses without NaN', () => {
    const idle = getAnimProfile('comedian').idle
    const a = sampleIdlePose(idle, 1.23)
    const b = sampleThinkPose(2.5, 0.1)
    for (const pose of [a, b]) {
      for (const v of Object.values(pose)) {
        expect(Number.isFinite(v)).toBe(true)
      }
    }
  })

  it('idle poses evolve over time (not static)', () => {
    const idle = getAnimProfile('comedian').idle
    const p0 = sampleIdlePose(idle, 0)
    const p1 = sampleIdlePose(idle, 0.37)
    // At least one channel should differ for a bouncy comedian
    expect(
      p0.groupY !== p1.groupY ||
        p0.groupRotZ !== p1.groupRotZ ||
        p0.meshRotX !== p1.meshRotX,
    ).toBe(true)
  })

  it('each reaction clip produces a non-default pose mid-clip', () => {
    const clips: ReactionClip[] = [
      'laugh', 'think', 'gasp', 'angry', 'deadpan',
      'facepalm', 'eyeroll', 'nod', 'bounce', 'shrug',
    ]
    for (const clip of clips) {
      expect(reactionDuration(clip)).toBeGreaterThan(0)
      const mid = sampleReactionPose(clip, 0.5)
      const start = sampleReactionPose(clip, 0)
      // mid should differ from zero-ish start for most clips
      const delta =
        Math.abs(mid.groupY - start.groupY) +
        Math.abs(mid.meshRotX - start.meshRotX) +
        Math.abs(mid.mouthOpen - start.mouthOpen) +
        Math.abs(mid.eyeScaleY - start.eyeScaleY) +
        Math.abs(mid.meshScaleY - start.meshScaleY)
      expect(delta).toBeGreaterThan(0.001)
    }
  })
})

describe('detectReactionFromText / extractDirectorTags', () => {
  it('extracts director tags and cleans text', () => {
    const { cleanText, clips } = extractDirectorTags('Wow [laugh] that was wild [gasp]')
    expect(clips).toEqual(['laugh', 'gasp'])
    expect(cleanText.toLowerCase()).not.toContain('[laugh]')
    expect(cleanText).toMatch(/wow/i)
  })

  it('prefers director tags over keywords', () => {
    expect(detectReactionFromText('haha so funny [deadpan]')).toBe('deadpan')
  })

  it('maps laugh keywords', () => {
    expect(detectReactionFromText('That was hilarious hahaha')).toBe('laugh')
  })

  it('maps think keywords', () => {
    expect(detectReactionFromText('Hmm, let me think about that hypothesis')).toBe('think')
  })

  it('maps gasp / shock', () => {
    expect(detectReactionFromText('Whoa!!! No way')).toBe('gasp')
  })

  it('returns null when nothing matches', () => {
    expect(detectReactionFromText('The sky is blue today.')).toBeNull()
  })

  it('boosts preferred signature reactions', () => {
    // "indeed" is nod weight 1; with preferred nod it should still pick nod
    expect(detectReactionFromText('Indeed.', ['nod', 'think', 'eyeroll'])).toBe('nod')
  })
})
