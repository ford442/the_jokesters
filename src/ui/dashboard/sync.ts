import type { MemoryManager } from '../../Director/MemoryManager'
import { HFStorageManager } from '../../Director/HFStorageManager'
import type { PendingDelta } from '../../Director/memoryTypes'
import { CARD_STYLE, h, note, setChildren } from './dom'
import { episodesWithDeltas } from './deltas'

/**
 * Force merge: flush the local sync queue, then consolidate every episode that
 * has pending delta files. Resolves when the worker reports completion; throws
 * on the first failure.
 */
export async function forceMergeDeltas(memoryManager: MemoryManager, pending: readonly PendingDelta[]): Promise<number> {
  await memoryManager.processSyncQueue()
  const episodes = episodesWithDeltas(pending)
  for (const episodeId of episodes) {
    await memoryManager.consolidateEpisodeDeltas(episodeId)
  }
  return episodes.length
}

/** Lists a public community dataset's script files into `results`, each with a View (import) button. */
export async function renderPublicDataset(
  results: HTMLElement,
  repoId: string,
  getMemoryManager: () => MemoryManager | null,
): Promise<void> {
  setChildren(results, note('Loading...', '#ccc'))
  try {
    const history = await new HFStorageManager().getDatasetHistory('', repoId)
    const files = (history ?? []).filter((f): f is typeof f & { path: string } => !!f.path?.endsWith('.json'))
    if (files.length === 0) {
      setChildren(results, note('No public scripts found.', '#ccc'))
      return
    }
    setChildren(results, ...files.map((file) => {
      const viewBtn = h('button', {
        type: 'button',
        style: { background: '#4ecdc4', color: '#1a1a2e', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
      }, 'View')
      viewBtn.addEventListener('click', () => {
        void (async () => {
          viewBtn.textContent = '...'
          const manager = getMemoryManager()
          if (!manager) {
            alert('Memory manager not found.')
          } else {
            const script = await manager.loadCommunityScript(repoId, file.path)
            if (script) {
              alert('Script imported successfully!')
              console.log(`[Public Script ${file.path}]`, script)
            } else {
              alert('Failed to load script.')
            }
          }
          viewBtn.textContent = 'View'
        })()
      })
      return h('div', { style: { ...CARD_STYLE, padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h('span', {}, file.path),
        viewBtn,
      )
    }))
  } catch (err) {
    console.error('Failed to fetch public repo history', err)
    setChildren(results, note('Error loading datasets.', '#ff6b6b'))
  }
}
