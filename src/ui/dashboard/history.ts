import type { MemoryManager } from '../../Director/MemoryManager'
import type { HFHistoryEntry } from '../../Director/memoryTypes'
import { CARD_STYLE, h, note, setChildren } from './dom'

function fileCard(item: HFHistoryEntry): HTMLDivElement {
  return h('div', { style: CARD_STYLE },
    h('div', { style: { fontWeight: 'bold', color: '#4ecdc4' } }, item.path || 'Unknown file'),
    h('div', { style: { fontSize: '0.85em', color: '#ccc' } }, `Size: ${item.size || 0} bytes`),
  )
}

function commitCard(item: HFHistoryEntry): HTMLDivElement {
  const date = item.date || item.createdAt || 'Unknown Date'
  const message = item.message || item.commitMessage || item.title || 'No message'
  const author = item.author ? (typeof item.author === 'string' ? item.author : item.author.name || 'Unknown') : 'Unknown'
  return h('div', { style: CARD_STYLE },
    h('div', { style: { fontWeight: 'bold', color: '#4ecdc4' } }, message),
    h('div', { style: { fontSize: '0.85em', color: '#ccc' } }, `By ${author} on ${new Date(date).toLocaleString()}`),
  )
}

/** Renders the cloud dataset history (file tree or commit list) into `list`. */
export async function renderHistory(list: HTMLElement, memoryManager: MemoryManager | null): Promise<void> {
  setChildren(list, note('Loading history...'))
  if (!memoryManager) {
    setChildren(list, note('MemoryManager not available.', '#ff6b6b'))
    return
  }
  const history = await memoryManager.getCloudHistory()
  if (!history || history.length === 0) {
    setChildren(list, note('No history found or error fetching.'))
    return
  }
  const isFileTree = !history[0].commit && !history[0].oid
  setChildren(list, ...history.map(isFileTree ? fileCard : commitCard))
}
