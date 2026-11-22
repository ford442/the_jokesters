import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import {
  isScriptPlayerRequested,
  parseScriptPacket,
  scriptHoldMs,
  scriptPacketToEpisode,
  scriptVoiceOverrides,
  validateScriptPacket,
} from '../../src/script/scriptPacket'
import { setVoiceOverrides, voiceFor } from '../../src/audio/voiceMap'

const base = () => ({
  version: 1,
  title: 'T',
  stageKit: 'talkshow',
  speakers: [
    { id: 'rubella', name: 'Rubella', slot: 'comedian', voice: 'F1' },
    { id: 'lillith', name: 'Lillith', slot: 'philosopher', voice: 'F2' },
    { id: 'riley', name: 'Riley', slot: 'scientist' },
  ],
  turns: [
    { speaker: 'rubella', text: 'One.' },
    { speaker: 'lillith', text: 'Two.', holdMs: 900, sfx: 'rimshot' },
    { speaker: 'riley', text: 'Three.' },
  ],
})

afterEach(() => setVoiceOverrides({}))

describe('script packet', () => {
  it('adapts one episode turn per line with agentId = slot and applies voices', () => {
    const r = validateScriptPacket(base())
    if (!r.ok) throw new Error(r.errors.join())
    const ep = scriptPacketToEpisode(r.packet)
    expect(ep.turns.map((t) => t.agentId)).toEqual(['comedian', 'philosopher', 'scientist'])
    expect(ep.turns[1].sfx).toBe('rimshot')
    expect(ep.modelId).toBeNull()
    expect(ep.agents.find((a) => a.id === 'philosopher')?.name).toBe('Lillith')
    expect(scriptHoldMs(r.packet)).toEqual([350, 900, 350])
    setVoiceOverrides(scriptVoiceOverrides(r.packet))
    expect(voiceFor('comedian')).toBe('F1')
    expect(voiceFor('philosopher')).toBe('F2')
  })

  it('rejects a turn with an unknown speaker', () => {
    const p = base()
    p.turns.push({ speaker: 'ghost', text: 'Boo.' })
    const r = validateScriptPacket(p)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join()).toMatch(/unknown speaker "ghost"/)
  })

  it('resolves an unknown stageKit to void', () => {
    const r = validateScriptPacket({ ...base(), stageKit: '../../etc/passwd' })
    expect(r.ok && r.packet.stageKit).toBe('void')
    const r2 = validateScriptPacket({ ...base(), stageKit: undefined })
    expect(r2.ok && r2.packet.stageKit).toBe('void')
  })

  it('falls back to the slot default voice when voice is missing', () => {
    const r = validateScriptPacket(base())
    if (!r.ok) throw new Error()
    expect(scriptVoiceOverrides(r.packet).scientist).toBe('M1')
  })

  it('rejects bad voices, slots and JSON', () => {
    const p = base() as { speakers: Array<Record<string, unknown>> }
    p.speakers[0].voice = 'M3'
    expect(validateScriptPacket(p).ok).toBe(false)
    expect(parseScriptPacket('{nope').ok).toBe(false)
  })

  it('adapter is pure — produces data without starting playback', () => {
    const r = validateScriptPacket(base())
    if (!r.ok) throw new Error()
    const ep = scriptPacketToEpisode(r.packet)
    expect(typeof ep).toBe('object')
    expect(voiceFor('philosopher')).toBe('M2') // no override applied by the adapter
  })

  it('ships a valid sample packet', () => {
    const r = parseScriptPacket(readFileSync('public/scripts/sample-script.json', 'utf8'))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.packet.turns.length).toBeLessThan(6)
  })

  it('detects the script-player route', () => {
    expect(isScriptPlayerRequested('?mode=script')).toBe(true)
    expect(isScriptPlayerRequested('?script=/x.json')).toBe(true)
    expect(isScriptPlayerRequested('')).toBe(false)
    expect(isScriptPlayerRequested('?mode=improv')).toBe(false)
  })
})
