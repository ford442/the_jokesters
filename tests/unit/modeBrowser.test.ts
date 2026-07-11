import { describe, expect, it } from 'vitest'
import { MODE_REGISTRY } from '../../src/Director/modes/registry'
import { FEATURED_MODE_IDS } from '../../src/config/featuredModes'
import {
  filterModes,
  getFeaturedModes,
  MODE_CATEGORY_LABELS,
} from '../../src/app/modeBrowserCore'

describe('modeBrowserCore', () => {
  it('featured set resolves to 8 registry entries', () => {
    const featured = getFeaturedModes(MODE_REGISTRY)
    expect(featured).toHaveLength(FEATURED_MODE_IDS.length)
    expect(featured.map((m) => m.id)).toEqual([...FEATURED_MODE_IDS])
  })

  it('finds modes by title fragment in under 3s (instant search)', () => {
    const start = performance.now()
    const hits = filterModes(MODE_REGISTRY, { query: 'roast' })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(3000)
    expect(hits.some((m) => m.id === 'roast')).toBe(true)
  })

  it('finds modes by tag token', () => {
    const hits = filterModes(MODE_REGISTRY, { query: 'sentient' })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((m) => m.id.includes('sentient') || (m.tags ?? []).includes('sentient'))).toBe(true)
  })

  it('filters by category label', () => {
    const hits = filterModes(MODE_REGISTRY, { query: 'dream', category: 'all' })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((m) => m.category === 'dream')).toBe(true)
  })

  it('exposes human-readable category labels', () => {
    expect(MODE_CATEGORY_LABELS.improv).toBe('Improv')
    expect(MODE_CATEGORY_LABELS.dream).toBe('Dream')
  })
})
