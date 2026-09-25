import { describe, expect, it } from 'vitest'
import {
  AGENT_VOICE_MAP,
  DEFAULT_VOICE_STYLE,
  SUPERTONIC_STYLE_IDS,
  resolveVoiceStyle,
} from '../../src/audio/voiceMap'
import { CHARACTER_SPEEDS } from '../../src/app/chatLog'
import { agents } from '../../src/config/agents'

describe('AGENT_VOICE_MAP', () => {
  it('covers every agent id from src/config/agents.ts', () => {
    for (const agent of agents) {
      expect(AGENT_VOICE_MAP).toHaveProperty(agent.id)
    }
  })

  it('maps every agent to a real hosted Supertonic style id', () => {
    for (const agent of agents) {
      expect(SUPERTONIC_STYLE_IDS).toContain(AGENT_VOICE_MAP[agent.id as keyof typeof AGENT_VOICE_MAP])
    }
  })

  it('uses F2 for a real agent (previously loaded but never assigned)', () => {
    const styleIds = Object.values(AGENT_VOICE_MAP)
    expect(styleIds).toContain('F2')
  })

  it('uses at least 4 distinct style ids across the 5 agents', () => {
    const distinct = new Set(Object.values(AGENT_VOICE_MAP))
    expect(distinct.size).toBeGreaterThanOrEqual(4)
  })

  it('resolveVoiceStyle falls back to the default voice for unknown ids', () => {
    expect(resolveVoiceStyle('some-unmapped-agent')).toBe(DEFAULT_VOICE_STYLE)
  })

  it('resolveVoiceStyle matches AGENT_VOICE_MAP for known agents', () => {
    for (const agent of agents) {
      expect(resolveVoiceStyle(agent.id)).toBe(AGENT_VOICE_MAP[agent.id as keyof typeof AGENT_VOICE_MAP])
    }
  })
})

describe('CHARACTER_SPEEDS', () => {
  it('covers every agent id from src/config/agents.ts', () => {
    for (const agent of agents) {
      expect(CHARACTER_SPEEDS).toHaveProperty(agent.id)
      expect(typeof CHARACTER_SPEEDS[agent.id]).toBe('number')
    }
  })

  it('gives every agent a unique speed', () => {
    const speeds = agents.map((a) => CHARACTER_SPEEDS[a.id])
    expect(new Set(speeds).size).toBe(agents.length)
  })

  it('keeps agents sharing a style id (Philosopher/Robot, both M2) at distinct speeds', () => {
    const sharedAgents = agents.filter(
      (a) => AGENT_VOICE_MAP[a.id as keyof typeof AGENT_VOICE_MAP] === AGENT_VOICE_MAP.robot,
    )
    const speeds = sharedAgents.map((a) => CHARACTER_SPEEDS[a.id])
    expect(new Set(speeds).size).toBe(sharedAgents.length)
  })
})

describe('five distinguishable voice+speed combos', () => {
  it('no two agents share the exact same (style, speed) pair', () => {
    const combos = agents.map(
      (a) => `${AGENT_VOICE_MAP[a.id as keyof typeof AGENT_VOICE_MAP]}@${CHARACTER_SPEEDS[a.id]}`,
    )
    expect(new Set(combos).size).toBe(agents.length)
  })
})
