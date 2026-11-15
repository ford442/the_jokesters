import { describe, expect, it } from 'vitest'
import { CAST_SLOT_IDS, REQUIRED_SLOT_IDS, PERSONA_SUFFIX, castAgents, createDefaultRoster, shippedAgent } from '../../src/cast/defaultCast'
import { castCardSchema, defaultCast } from '../../src/cast/castCard'

describe('defaultCast — the one roster', () => {
  it('ships one agent per stage slot, in slot order', () => {
    expect(castAgents.map((a) => a.id)).toEqual([...CAST_SLOT_IDS])
  })

  it('turns on exactly the required trio by default', () => {
    expect(createDefaultRoster().map((a) => a.id)).toEqual([...REQUIRED_SLOT_IDS])
    expect(REQUIRED_SLOT_IDS).toEqual(['comedian', 'philosopher', 'scientist'])
  })

  it('hands out a fresh mutable copy each time (runs never share roster state)', () => {
    const a = createDefaultRoster()
    a[0].name = 'Mutated'
    expect(createDefaultRoster()[0].name).toBe('The Comedian')
    expect(shippedAgent('comedian')!.name).toBe('The Comedian')
  })

  it('every persona ends with the protocol suffix the turn parser relies on', () => {
    for (const agent of castAgents) expect(agent.systemPrompt.endsWith(PERSONA_SUFFIX)).toBe(true)
  })

  it('the default cast card built from it passes the zod schema', () => {
    const card = defaultCast()
    expect(castCardSchema.safeParse(card).success).toBe(true)
    expect(card.slots.filter((s) => s.enabled).map((s) => s.id)).toEqual([...REQUIRED_SLOT_IDS])
  })
})
