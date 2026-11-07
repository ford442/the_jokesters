import { describe, expect, it } from 'vitest'
import { buildProductionInput } from '../../src/app/productionCardUi'
import type { ProductionPanelValues } from '../../src/app/productionCardUi'
import { createProductionCard } from '../../src/Director/productionCard'

const base: ProductionPanelValues = {
  relA: 'comedian', relB: 'philosopher', relLabel: '', relPublic: true, secretAgent: 'robot', secretGoal: '',
}

describe('improv panel: status / arc / guest', () => {
  it('stays undefined until something usable is filled in', () => {
    expect(buildProductionInput(base)).toBeUndefined()
    expect(buildProductionInput({ ...base, statusAgent: 'robot', statusLevel: '' })).toBeUndefined()
    expect(buildProductionInput({ ...base, arcAgent: 'robot', arcLabels: 'just one' })).toBeUndefined()
    expect(buildProductionInput({ ...base, guestName: 'Grandma', guestPersona: '  ' })).toBeUndefined()
  })

  it('builds a status, treating a blank or self target as "the room"', () => {
    expect(buildProductionInput({ ...base, statusAgent: 'comedian', statusLevel: 'low', statusTarget: 'philosopher', statusPublic: false })?.statuses)
      .toEqual([{ agentId: 'comedian', level: 'low', targetId: 'philosopher', public: false }])
    expect(buildProductionInput({ ...base, statusAgent: 'comedian', statusLevel: 'high', statusTarget: '' })?.statuses)
      .toEqual([{ agentId: 'comedian', level: 'high', public: true }])
    expect(buildProductionInput({ ...base, statusAgent: 'comedian', statusLevel: 'high', statusTarget: 'comedian' })?.statuses)
      .toEqual([{ agentId: 'comedian', level: 'high', public: true }])
  })

  it('builds an arc from the arrow syntax', () => {
    expect(buildProductionInput({ ...base, arcAgent: 'robot', arcLabels: 'angry → confused → pleased' })?.arcs)
      .toEqual([{ agentId: 'robot', start: 'angry', mid: 'confused', end: 'pleased' }])
  })

  it('builds a persona guest with defaults for enter turn and voice', () => {
    const input = buildProductionInput({ ...base, guestName: ' Grandma ', guestPersona: ' a nosy grandmother ' })!
    expect(input.guestNpc).toEqual({ name: 'Grandma', persona: 'a nosy grandmother', entersAfterTurn: 2 })
    const full = buildProductionInput({
      ...base, guestName: 'Grandma', guestPersona: 'a nosy grandmother', guestVoice: 'M1', guestEnters: '4', guestExits: '9',
    })!
    expect(full.guestNpc).toEqual({
      name: 'Grandma', persona: 'a nosy grandmother', entersAfterTurn: 4, voiceStyle: 'M1', exitsAfterTurn: 9,
    })
    // An unknown voice is ignored rather than passed to the TTS engine.
    expect(buildProductionInput({ ...base, guestName: 'G', guestPersona: 'p', guestVoice: 'Q7' })?.guestNpc).not.toHaveProperty('voiceStyle')
  })

  it('everything the panel builds is accepted by the production card', () => {
    const input = buildProductionInput({
      ...base,
      relLabel: 'exes',
      secretGoal: 'steer to pickles',
      statusAgent: 'comedian', statusLevel: 'low', statusTarget: 'philosopher',
      arcAgent: 'robot', arcLabels: 'tense → relieved',
      guestName: 'Grandma', guestPersona: 'a nosy grandmother', guestEnters: '1', guestExits: '6',
    })!
    const card = createProductionCard(12, input)
    expect(card.relationships).toHaveLength(1)
    expect(card.secrets).toHaveLength(1)
    expect(card.statuses).toHaveLength(1)
    expect(card.arcs).toHaveLength(1)
    expect(card.guestNpc).toMatchObject({ name: 'Grandma', entersAfterTurn: 1, exitsAfterTurn: 6 })
  })
})
