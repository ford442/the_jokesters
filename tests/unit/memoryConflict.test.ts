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

function episode(history: StoredEpisode['history'], vectorClock: StoredEpisode['vectorClock']): StoredEpisode {
  return { history, vectorClock }
}

const m = (id: string, content: string, role: 'user' | 'assistant' = 'assistant') => ({ id, role, content })

describe('mergeHistories', () => {
  it('cloud wins: returns the cloud history and clock without appending local lines', () => {
    const cloud = episode([m('1', 'setup', 'user'), m('2', 'cloud punchline')], { a: 3 })
    const local = episode([m('1', 'setup', 'user'), m('3', 'stale local line')], { a: 1 })

    const merged = mergeHistories(cloud, local, 'b')
    expect(merged.strategy).toBe('cloud')
    expect(merged.history).toBe(cloud.history)
    expect(merged.vectorClock).toEqual({ a: 3 })
  })

  it('local wins and equal clocks return the local side untouched', () => {
    const cloud = episode([m('1', 'cloud')], { a: 1 })
    const local = episode([m('2', 'local')], { a: 2 })
    expect(mergeHistories(cloud, local, 'b').history).toBe(local.history)
    expect(mergeHistories(cloud, episode([m('2', 'local')], { a: 1 }), 'b').strategy).toBe('equal')
  })

  it('keeps two concurrent messages with identical text', () => {
    const cloud = episode([m('1', 'setup', 'user'), m('c1', 'same line')], { a: 2, b: 1 })
    const local = episode([m('1', 'setup', 'user'), m('l1', 'same line')], { a: 1, b: 2 })

    const merged = mergeHistories(cloud, local, 'b')
    expect(merged.strategy).toBe('concurrent')
    expect(merged.history.map((x) => x.id)).toEqual(['1', 'c1', 'l1'])
  })

  it('does not duplicate a shared message that appears on both sides', () => {
    const cloud = episode([m('1', 'a'), m('2', 'b'), m('c', 'c')], { x: 3, y: 1 })
    const local = episode([m('1', 'a'), m('2', 'b'), m('l', 'l')], { x: 2, y: 2 })
    expect(mergeHistories(cloud, local, 'y').history.map((x) => x.id)).toEqual(['1', '2', 'c', 'l'])
  })

  it('orders by the side with the greater clock total, whichever side that is', () => {
    const cloud = episode([m('c1', 'cloud')], { a: 1, b: 1 })
    const local = episode([m('l1', 'local')], { a: 3 })
    // totals: cloud 2, local 3 -> local's order leads
    expect(mergeHistories(cloud, local, 'a').history.map((x) => x.id)).toEqual(['l1', 'c1'])
  })

  it('is stable across repeated merges and independent of which device runs it', () => {
    const one = episode([m('1', 's', 'user'), m('a1', 'A')], { a: 2, b: 1 })
    const two = episode([m('1', 's', 'user'), m('b1', 'B')], { a: 1, b: 2 })

    const first = mergeHistories(one, two, 'a').history.map((x) => x.id)
    const second = mergeHistories(one, two, 'a').history.map((x) => x.id)
    const swapped = mergeHistories(two, one, 'b').history.map((x) => x.id)
    expect(second).toEqual(first)
    expect(swapped).toEqual(first)
  })

  it('remerging a merged episode is a no-op: the merge dominates both inputs', () => {
    const one = episode([m('a1', 'A')], { a: 2, b: 1 })
    const two = episode([m('b1', 'B')], { a: 1, b: 2 })
    const { resolved } = resolveEpisodeConflict(one, two, 'a')
    expect(resolveEpisodeConflict(resolved, two, 'b').resolved).toBe(resolved)
    expect(resolveEpisodeConflict(one, resolved, 'b').resolved).toBe(resolved)
  })

  it('gives legacy messages without ids the same identity on both sides', () => {
    const legacy = [{ role: 'user' as const, content: 'old setup' }, { role: 'assistant' as const, content: 'old punchline' }]
    const cloud = episode([...legacy, m('c1', 'cloud')], { a: 2, b: 1 })
    const local = episode([...legacy, m('l1', 'local')], { a: 1, b: 2 })

    const merged = mergeHistories(cloud, local, 'b').history
    expect(merged.map((x) => x.content)).toEqual(['old setup', 'old punchline', 'cloud', 'local'])
    expect(merged.every((x) => typeof x.id === 'string')).toBe(true)
  })

  it('drops repeats of one id within a single side', () => {
    const cloud = episode([m('1', 'a'), m('1', 'a')], { a: 2, b: 1 })
    const local = episode([m('2', 'b')], { a: 1, b: 2 })
    expect(mergeHistories(cloud, local, 'b').history.map((x) => x.id)).toEqual(['1', '2'])
  })
})

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
    expect(resolved.history.map((x) => x.content)).toEqual(['shared setup', 'cloud punchline', 'local punchline'])
    // max(2,1)=2 for deviceA, max(1,2)=2 for deviceB, then the resolving client (deviceB) is bumped by 1
    expect(resolved.vectorClock).toEqual({ deviceA: 2, deviceB: 3 })
    expect(resolved.updatedAt).toBeTypeOf('number')
    expect(resolved.timestamp).toBeTypeOf('number')
  })

  it('ignores a legacy yjsState: a decisive clock still wins outright', () => {
    const cloud = { ...episode([{ role: 'user' as const, content: 'cloud line' }], { deviceA: 3 }), yjsState: 'AAAA' }
    const local = { ...episode([{ role: 'user' as const, content: 'local line' }], { deviceA: 1 }), yjsState: 'BBBB' }
    expect(resolveEpisodeConflict(cloud, local, 'deviceB').resolved).toBe(cloud)
    expect(resolveEpisodeConflict(local, cloud, 'deviceB').resolved).toBe(cloud)
  })

  it('does not carry a legacy yjsState into a merged episode', () => {
    const cloud = { ...episode([{ id: 'c', role: 'user' as const, content: 'x' }], { a: 2, b: 1 }), yjsState: 'AAAA' }
    const local = { ...episode([{ id: 'l', role: 'user' as const, content: 'y' }], { a: 1, b: 2 }), yjsState: 'BBBB' }
    expect(resolveEpisodeConflict(cloud, local, 'b').resolved).not.toHaveProperty('yjsState')
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
    // equal clock totals: the tie breaks on the canonical clock text, so local ("deviceB=1") leads
    expect(resolved.history.map((x) => x.content)).toEqual(['local line', 'cloud line'])
    expect(resolved.vectorClock).toEqual({ deviceA: 1, deviceB: 2 })
  })

  it('"merge" unions even when a clock is decisive, since the user asked for it explicitly', () => {
    const newer = episode([{ id: 'n', role: 'user', content: 'newer' }], { deviceA: 3 })
    const older = episode([{ id: 'o', role: 'user', content: 'older' }], { deviceA: 1 })
    const resolved = applyManualResolution(older, newer, 'merge', 'deviceB')
    expect(resolved.history.map((x) => x.id)).toEqual(['n', 'o'])
  })
})
