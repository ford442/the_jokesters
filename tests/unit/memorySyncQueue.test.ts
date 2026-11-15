import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemorySyncQueue } from '../../src/Director/memorySyncQueue'
import type { MemoryIdbStore } from '../../src/Director/memoryIdbStore'
import type { CloudCredentialsSource } from '../../src/Director/memoryCredentials'

class FakeWorker {
  static instances: FakeWorker[] = []
  posted: Array<Record<string, unknown>> = []
  terminated = false
  onmessage: ((e: { data: unknown }) => void) | null = null
  constructor() { FakeWorker.instances.push(this) }
  postMessage(msg: Record<string, unknown>) { this.posted.push(msg) }
  terminate() { this.terminated = true }
  reply(data: unknown) { this.onmessage?.({ data }) }
}

const idb = { getQueue: async () => [], setQueue: async () => {} } as unknown as MemoryIdbStore
const creds = { getToken: () => 'tok', getRepoId: () => 'me/repo' } as unknown as CloudCredentialsSource

function makeQueue() {
  const q = new MemorySyncQueue(idb, creds, 'p-', () => 'default', () => {})
  return { q, worker: FakeWorker.instances.at(-1)! }
}

describe('MemorySyncQueue lifecycle', () => {
  beforeEach(() => {
    FakeWorker.instances = []
    vi.stubGlobal('Worker', FakeWorker)
    vi.stubGlobal('navigator', { onLine: true })
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('startScheduler is idempotent and dispose() stops it and terminates the worker', () => {
    const { q, worker } = makeQueue()
    const flush = vi.spyOn(q, 'processSyncQueue').mockResolvedValue()
    q.startScheduler(async () => [])
    q.startScheduler(async () => []) // second call must not add timers
    vi.advanceTimersByTime(60_000)
    expect(flush).toHaveBeenCalledTimes(1)

    q.dispose()
    vi.advanceTimersByTime(10 * 60_000)
    expect(flush).toHaveBeenCalledTimes(1)
    expect(worker.terminated).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('consolidateEpisodeDeltas resolves on consolidation_complete', async () => {
    const { q, worker } = makeQueue()
    const p = q.consolidateEpisodeDeltas('ep1')
    expect(worker.posted[0]).toMatchObject({ type: 'consolidate_deltas', episodeId: 'ep1' })
    worker.reply({ type: 'consolidation_complete', episodeId: 'ep1' })
    await expect(p).resolves.toBeUndefined()
    q.dispose()
  })

  it('consolidateEpisodeDeltas rejects (and reports status) when the worker errors', async () => {
    const { q, worker } = makeQueue()
    const status = vi.fn()
    q.setSyncStatusCallback(status)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('localStorage', { setItem: () => {}, removeItem: () => {}, getItem: () => null })
    vi.stubGlobal('window', { dispatchEvent: () => true })
    const p = q.consolidateEpisodeDeltas('ep1')
    worker.reply({ type: 'sync_error', error: 'Failed to fetch tree: 404' })
    await expect(p).rejects.toThrow('404')
    expect(status).toHaveBeenCalledWith(expect.stringContaining('Consolidation failed'))
    q.dispose()
  })

  it('consolidateEpisodeDeltas rejects without credentials instead of failing silently', async () => {
    const noCreds = { getToken: () => null, getRepoId: () => null } as unknown as CloudCredentialsSource
    const q = new MemorySyncQueue(idb, noCreds, 'p-', () => 'default', () => {})
    await expect(q.consolidateEpisodeDeltas('ep1')).rejects.toThrow(/not configured/)
    q.dispose()
  })
})
