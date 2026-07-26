import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createFakeLocalStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
    setItem: (key: string, value: string) => {
      data.set(key, String(value))
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size
    },
    clear: () => data.clear(),
  }
}

/** Minimal in-memory IndexedDB double — just enough for MemoryManager's put/get/getAllKeys usage. */
function createFakeIndexedDB() {
  const databases = new Map<string, Map<string, Map<string, unknown>>>()

  function makeRequest<T>(run: () => T) {
    const req: {
      result: T | undefined
      error: unknown
      onsuccess: (() => void) | null
      onerror: (() => void) | null
    } = { result: undefined, error: null, onsuccess: null, onerror: null }

    queueMicrotask(() => {
      try {
        req.result = run()
        req.onsuccess?.()
      } catch (e) {
        req.error = e
        req.onerror?.()
      }
    })
    return req
  }

  return {
    open(name: string) {
      const req: {
        result: unknown
        error: unknown
        onupgradeneeded: (() => void) | null
        onsuccess: (() => void) | null
        onerror: (() => void) | null
      } = { result: undefined, error: null, onupgradeneeded: null, onsuccess: null, onerror: null }

      queueMicrotask(() => {
        if (!databases.has(name)) databases.set(name, new Map())
        const stores = databases.get(name)!

        const db = {
          objectStoreNames: { contains: (n: string) => stores.has(n) },
          createObjectStore: (n: string) => {
            stores.set(n, new Map())
          },
          transaction: (storeName: string) => ({
            objectStore: () => {
              const map = stores.get(storeName)!
              return {
                put: (val: unknown, key: string) => makeRequest(() => { map.set(key, val); return undefined }),
                get: (key: string) => makeRequest(() => map.get(key)),
                getAllKeys: () => makeRequest(() => Array.from(map.keys())),
              }
            },
          }),
        }

        req.result = db
        req.onupgradeneeded?.()
        req.onsuccess?.()
      })

      return req
    },
  }
}

describe('MemoryManager episode roundtrip (mocked IndexedDB + localStorage)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createFakeLocalStorage())
    vi.stubGlobal('indexedDB', createFakeIndexedDB())
    vi.stubGlobal('navigator', { onLine: true })
    // Worker intentionally left undefined: MemoryManager's constructor checks
    // `typeof Worker !== 'undefined'` and skips sync-worker setup entirely when absent.
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves an episode and loads it back with an incremented vector clock and fresh timestamps', async () => {
    const { MemoryManager } = await import('../../src/Director/MemoryManager')
    const manager = new MemoryManager()

    const before = Date.now()
    manager.saveEpisode('ep-1', {
      history: [
        { role: 'user', content: 'tell me a joke' },
        { role: 'assistant', content: 'why did the chicken...' },
      ],
      scenario: null,
    })

    // saveEpisode's IDB write is fire-and-forget; give the microtask queue a turn.
    await new Promise((r) => setTimeout(r, 0))

    const loaded = await manager.loadEpisode('ep-1')
    expect(loaded).not.toBeNull()
    expect(loaded!.history).toHaveLength(2)
    expect(loaded!.history[1].content).toBe('why did the chicken...')
    expect(loaded!.vectorClock).toBeDefined()
    expect(Object.values(loaded!.vectorClock!)[0]).toBe(1)
    expect(loaded!.updatedAt).toBeGreaterThanOrEqual(before)
    expect(loaded!.timestamp).toBeGreaterThanOrEqual(before)
  })

  it('bumps the same client-id counter when a load→modify→save cycle carries the vector clock forward', async () => {
    // saveEpisode only bumps whatever vectorClock is on the object it's given — a fresh
    // literal (as Director.stopScene passes) always starts that episode's clock over at 1.
    // Continuity requires threading the previously loaded record's vectorClock through, the
    // same way resolveEpisodeConflict/applyManualResolution operate on already-loaded episodes.
    const { MemoryManager } = await import('../../src/Director/MemoryManager')
    const manager = new MemoryManager()

    manager.saveEpisode('ep-2', { history: [{ role: 'user', content: 'first' }] })
    await new Promise((r) => setTimeout(r, 0))
    const first = await manager.loadEpisode('ep-2')
    const clientId = Object.keys(first!.vectorClock!)[0]
    expect(first!.vectorClock![clientId]).toBe(1)

    manager.saveEpisode('ep-2', {
      ...first!,
      history: [...first!.history, { role: 'assistant', content: 'second' }],
    })
    await new Promise((r) => setTimeout(r, 0))
    const second = await manager.loadEpisode('ep-2')
    expect(second!.vectorClock![clientId]).toBe(2)
    expect(second!.history).toHaveLength(2)
  })

  it('lists and full-text searches saved episodes', async () => {
    const { MemoryManager } = await import('../../src/Director/MemoryManager')
    const manager = new MemoryManager()

    manager.saveEpisode('ep-3', {
      history: [{ role: 'assistant', content: 'the punchline about bananas' }],
    })
    await new Promise((r) => setTimeout(r, 0))

    const ids = await manager.listEpisodes()
    expect(ids).toContain('ep-3')

    const results = await manager.searchLocalEpisodes('bananas')
    expect(results.some((r) => r.episodeId === 'ep-3')).toBe(true)
  })

  it('returns null for an episode that was never saved', async () => {
    const { MemoryManager } = await import('../../src/Director/MemoryManager')
    const manager = new MemoryManager()

    const loaded = await manager.loadEpisode('does-not-exist')
    expect(loaded).toBeNull()
  })

  it('surfaces a cloud sync failure via the status callback, not just the console', async () => {
    const { MemoryManager } = await import('../../src/Director/MemoryManager')
    const { HFStorageManager } = await import('../../src/Director/HFStorageManager')

    vi.spyOn(HFStorageManager.prototype, 'saveFile').mockRejectedValue(new Error('network down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const manager = new MemoryManager()
    manager.setCloudCredentials('fake-token', 'fake/repo')

    const statuses: string[] = []
    manager.setSyncStatusCallback((status) => statuses.push(status))

    await manager.saveEpisodeAssetToCloud('ep-4', 'song', 'theme.json', '{}')

    expect(statuses.some((s) => s.toLowerCase().includes('failed'))).toBe(true)
  })
})
