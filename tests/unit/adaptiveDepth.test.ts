import { describe, it, expect } from 'vitest'
import { computePrerenderDepth, median } from '../../src/prerender/adaptiveDepth'

describe('computePrerenderDepth', () => {
  it('uses full depth on healthy VRAM', () => {
    const d = computePrerenderDepth(5000)
    expect(d.initialTurns).toBe(3)
    expect(d.minQueue).toBe(2)
    expect(d.batchSize).toBe(2)
    expect(d.maxSentences).toBe(3)
  })

  it('shallows queue on moderate VRAM', () => {
    const d = computePrerenderDepth(3000)
    expect(d.initialTurns).toBe(2)
    expect(d.batchSize).toBe(1)
  })

  it('uses single turn on tight VRAM', () => {
    const d = computePrerenderDepth(2200)
    expect(d.initialTurns).toBe(1)
    expect(d.minQueue).toBe(0)
  })

  it('disables LLM prerender on ultra-low VRAM', () => {
    const d = computePrerenderDepth(1200)
    expect(d.initialTurns).toBe(0)
    expect(d.batchSize).toBe(0)
    expect(d.maxSentences).toBe(1)
  })

  it('is conservative when VRAM unknown', () => {
    const d = computePrerenderDepth(0)
    expect(d.initialTurns).toBeLessThanOrEqual(1)
  })
})

describe('median', () => {
  it('returns null for empty', () => {
    expect(median([])).toBeNull()
  })

  it('handles odd and even lengths', () => {
    expect(median([100, 300, 200])).toBe(200)
    expect(median([100, 200])).toBe(150)
  })
})
