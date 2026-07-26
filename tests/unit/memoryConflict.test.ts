import { describe, expect, it } from 'vitest'
import {
  applyManualResolution,
  compareVectorClocks,
  mergeHistories,
  mergeVectorClocks,
  resolveEpisodeConflict,
} from '../../src/Director/memoryConflict'
import type { StoredEpisode } from '../../src/Director/memoryTypes'

describe('compareVectorClocks', () => {
  it('detects cloud dominance', () => {
    expect(compareVectorClocks({ a: 2 }, { a: 1 })).toBe('cloud')
  })

  it('detects local dominance', () => {
    expect(compareVectorClocks({ a: 1 }, { a: 2 })).toBe('local')
  })

  it('detects concurrent edits from different clients', () => {
    expect(compareVectorClocks({ a: 2, b: 1 }, { a: 1, b: 2 })).toBe('concurrent')
  })

  it('treats identical clocks as equal', () => {
    expect(compareVectorClocks({ a: 1 }, { a: 1 })).toBe('equal')
  })

  it('treats two empty clocks as equal', () => {
    expect(compareVectorClocks({}, {})).toBe('equal')
  })
})

describe('mergeVectorClocks', () => {
  it('takes the max counter per client id', () => {
    expect(mergeVectorClocks({ a: 3, b: 1 }, { a: 1, b: 5, c: 2 })).toEqual({ a: 3, b: 5, c: 2 })
  })
})

describe('mergeHistories', () => {
  it('concatenates and dedupes by exact role+content match', () => {
    const cloud = [
      { role: 'user' as const, content: 'setup the bit' },
      { role: 'assistant' as const, content: 'punchline A' },
    ]
    const local = [
      { role: 'user' as const, content: 'setup the bit' }, // duplicate of cloud[0]
      { role: 'assistant' as const, content: 'punchline B' },
    ]

    const merged = mergeHistories(cloud, local)
    expect(merged).toEqual([
      { role: 'user', content: 'setup the bit' },
      { role: 'assistant', content: 'punchline A' },
      { role: 'assistant', content: 'punchline B' },
    ])
  })

  it('preserves order and keeps distinct messages with identical content but different roles', () => {
    const merged = mergeHistories(
      [{ role: 'user', content: 'echo' }],
      [{ role: 'assistant', content: 'echo' }],
    )
    expect(merged).toHaveLength(2)
  })
})

function episode(history: StoredEpisode['history'], vectorClock: StoredEpisode['vectorClock']): StoredEpisode {
  return { history, vectorClock }
}

describe('resolveEpisodeConflict', () => {
  it('picks the cloud episode outright when its clock strictly dominates', () => {
    const cloud = episode([{ role: 'user', content: 'cloud line' }], { deviceA: 3 })
    const local = episode([{ role: 'user', content: 'local line' }], { deviceA: 1 })

    const { strategy, resolved } = resolveEpisodeConflict(cloud, local, 'deviceB')
    expect(strategy).toBe('cloud')
    expect(resolved).toBe(cloud)
  })

  it('picks the local episode outright when its clock strictly dominates', () => {
    const cloud = episode([{ role: 'user', content: 'cloud line' }], { deviceA: 1 })
    const local = episode([{ role: 'user', content: 'local line' }], { deviceA: 3 })

    const { strategy, resolved } = resolveEpisodeConflict(cloud, local, 'deviceB')
    expect(strategy).toBe('local')
    expect(resolved).toBe(local)
  })

  it('merges concurrent edits: unions history, max-merges clocks, bumps the resolving client', () => {
    const cloud = episode(
      [{ role: 'user', content: 'shared setup' }, { role: 'assistant', content: 'cloud punchline' }],
      { deviceA: 2, deviceB: 1 },
    )
    const local = episode(
      [{ role: 'user', content: 'shared setup' }, { role: 'assistant', content: 'local punchline' }],
      { deviceA: 1, deviceB: 2 },
    )

    const { strategy, resolved } = resolveEpisodeConflict(cloud, local, 'deviceB')

    expect(strategy).toBe('concurrent')
    expect(resolved.history).toEqual([
      { role: 'user', content: 'shared setup' },
      { role: 'assistant', content: 'cloud punchline' },
      { role: 'assistant', content: 'local punchline' },
    ])
    // max(2,1)=2 for deviceA, max(1,2)=2 for deviceB, then the resolving client (deviceB) is bumped by 1
    expect(resolved.vectorClock).toEqual({ deviceA: 2, deviceB: 3 })
    expect(resolved.updatedAt).toBeTypeOf('number')
    expect(resolved.timestamp).toBeTypeOf('number')
  })

  it('treats missing vector clocks as empty (equal) rather than throwing', () => {
    const cloud = episode([{ role: 'user', content: 'x' }], undefined)
    const local = episode([{ role: 'user', content: 'y' }], undefined)

    const { strategy, resolved } = resolveEpisodeConflict(cloud, local, 'deviceB')
    expect(strategy).toBe('equal')
    expect(resolved).toBe(local)
  })
})

describe('applyManualResolution', () => {
  const cloud = episode([{ role: 'user', content: 'cloud line' }], { deviceA: 1 })
  const local = episode([{ role: 'user', content: 'local line' }], { deviceB: 1 })

  it('keeps local state untouched for "local"', () => {
    expect(applyManualResolution(local, cloud, 'local', 'deviceB')).toBe(local)
  })

  it('takes cloud state outright for "cloud"', () => {
    expect(applyManualResolution(local, cloud, 'cloud', 'deviceB')).toBe(cloud)
  })

  it('merges history and vector clocks for "merge", bumping the acting client', () => {
    const resolved = applyManualResolution(local, cloud, 'merge', 'deviceB')
    expect(resolved.history).toEqual([
      { role: 'user', content: 'cloud line' },
      { role: 'user', content: 'local line' },
    ])
    expect(resolved.vectorClock).toEqual({ deviceA: 1, deviceB: 2 })
  })
})
