import { describe, expect, it } from 'vitest'
import {
  isSpeakableText,
  isVicunaModel,
  retryMaxTokens,
  stripForSpeakability,
} from '../../src/chat/speakableText'

describe('isSpeakableText', () => {
  it('rejects emoji-only and emoticon-only replies', () => {
    expect(isSpeakableText('😂')).toBe(false)
    expect(isSpeakableText('🤣')).toBe(false)
    expect(isSpeakableText('[sfx:rimshot] 😂')).toBe(false)
    expect(isSpeakableText(':)')).toBe(false)
    expect(isSpeakableText('  ')).toBe(false)
  })

  it('accepts English with optional emoji or stage directions', () => {
    expect(isSpeakableText("That's a bit.")).toBe(true)
    expect(isSpeakableText('*slips on banana* 🍌')).toBe(true)
    expect(isSpeakableText('The contract is a banana 😂')).toBe(true)
  })

  it('stripForSpeakability removes SFX tokens and pictographs', () => {
    expect(stripForSpeakability('[sfx:rimshot] hello')).toMatch(/hello/)
    expect(stripForSpeakability('😂')).toBe('')
  })
})

describe('isVicunaModel / retryMaxTokens', () => {
  it('detects Vicuna ids case-insensitively', () => {
    expect(isVicunaModel('Vicuna-7B')).toBe(true)
    expect(isVicunaModel('vicuna-gguf')).toBe(true)
    expect(isVicunaModel('Hermes-3-Llama-3.2-3B')).toBe(false)
    expect(isVicunaModel(null)).toBe(false)
  })

  it('floors retry tokens at 96 when the turn budget allows', () => {
    expect(retryMaxTokens(48, 96, 512)).toBe(96)
    expect(retryMaxTokens(150, 200, 512)).toBe(150)
    expect(retryMaxTokens(48, 32, 512)).toBe(32)
  })
})
