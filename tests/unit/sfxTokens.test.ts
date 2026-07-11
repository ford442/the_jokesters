import { describe, it, expect } from 'vitest'
import { parseSfxTokens, stripSfxTokens, hasSfxTokens } from '../../src/audio/sfxTokens'
import {
  isAllowedSfxName,
  sfxAssetUrl,
  resolveAgentSfx,
  ALLOWED_SFX,
} from '../../src/audio/sfxCatalog'

describe('parseSfxTokens', () => {
  it('strips [sfx:rimshot] and collects the event', () => {
    const { cleanText, events } = parseSfxTokens('That was a joke [sfx:rimshot] right?')
    expect(cleanText).toBe('That was a joke right?')
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('rimshot')
  })

  it('handles multiple tokens mid-line', () => {
    const { cleanText, events } = parseSfxTokens('[sfx:whoosh] Boom [sfx:explosion] done')
    expect(cleanText).toBe('Boom done')
    expect(events.map((e) => e.name)).toEqual(['whoosh', 'explosion'])
  })

  it('parses bare SFX:explosion director form', () => {
    const { cleanText, events } = parseSfxTokens('Cue it now SFX:explosion please')
    expect(events.some((e) => e.name === 'explosion')).toBe(true)
    expect(cleanText.toLowerCase()).not.toContain('sfx:explosion')
    expect(cleanText).toMatch(/cue it now/i)
  })

  it('is case-insensitive', () => {
    const { events } = parseSfxTokens('Hi [SFX:Laugh]')
    expect(events[0].name).toBe('laugh')
  })

  it('returns empty events for plain text', () => {
    const r = parseSfxTokens('Hello world')
    expect(r.events).toHaveLength(0)
    expect(r.cleanText).toBe('Hello world')
  })

  it('stripSfxTokens matches cleanText', () => {
    const t = 'Ha [sfx:laugh] ha'
    expect(stripSfxTokens(t)).toBe(parseSfxTokens(t).cleanText)
  })

  it('hasSfxTokens detects tokens', () => {
    expect(hasSfxTokens('nope')).toBe(false)
    expect(hasSfxTokens('[sfx:boo]')).toBe(true)
  })
})

describe('sfxCatalog security', () => {
  it('whitelists only known names', () => {
    expect(isAllowedSfxName('rimshot')).toBe(true)
    expect(isAllowedSfxName('laugh')).toBe(true)
    expect(isAllowedSfxName('../etc/passwd')).toBe(false)
    expect(isAllowedSfxName('rimshot.wav')).toBe(false)
    expect(isAllowedSfxName('evil')).toBe(false)
    expect(isAllowedSfxName('')).toBe(false)
  })

  it('sfxAssetUrl never builds paths for unknown names', () => {
    expect(sfxAssetUrl('rimshot')).toBe('./sfx/rimshot.wav')
    expect(sfxAssetUrl('../../secret')).toBeNull()
    expect(sfxAssetUrl('rimshot;rm -rf')).toBeNull()
    expect(sfxAssetUrl('laugh/../../../x')).toBeNull()
  })

  it('asset filenames come only from whitelist entries', () => {
    for (const name of ALLOWED_SFX) {
      const url = sfxAssetUrl(name)
      expect(url).toBe(`./sfx/${name}.wav`)
      expect(url).not.toMatch(/\.\./)
    }
  })

  it('resolves per-agent maps only to whitelist entries', () => {
    expect(resolveAgentSfx('laugh', 'comedian')).toBe('comedian_laugh')
    expect(resolveAgentSfx('laugh', 'scientist')).toBe('laugh')
    expect(isAllowedSfxName(resolveAgentSfx('laugh', 'comedian'))).toBe(true)
  })
})
