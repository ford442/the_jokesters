/**
 * Clear cached WebLLM / model weights without unregistering the service worker.
 * The SW must stay in control so the next retry still gets Range striping.
 */
export async function clearModelWeightCaches(): Promise<void> {
  const indexedDb = (
    globalThis as typeof globalThis & {
      indexedDB?: IDBFactory & { databases?: () => Promise<Array<{ name?: string }>> }
    }
  ).indexedDB

  try {
    const dbs = (await indexedDb?.databases?.()) ?? []
    for (const db of dbs) {
      if (db.name && (db.name.includes('webllm') || db.name.includes('cache'))) {
        indexedDb?.deleteDatabase(db.name)
        console.log('[Storage] Deleted IndexedDB:', db.name)
      }
    }
  } catch (error) {
    console.warn('[Storage] IndexedDB enumeration failed:', error)
  }

  try {
    if (typeof caches !== 'undefined') {
      const cacheNames = await caches.keys()
      for (const name of cacheNames) {
        await caches.delete(name)
        console.log('[Storage] Deleted Cache:', name)
      }
    }
  } catch (error) {
    console.warn('[Storage] Cache Storage wipe failed:', error)
  }

  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_CACHE' })
  } catch {
    /* SW not controlling this page */
  }
}
