import type { MemoryManager } from '../../Director/MemoryManager'
import type { PendingDelta } from '../../Director/memoryTypes'
import { CARD_STYLE, h, note, setChildren } from './dom'

type Json = Record<string, unknown>

/** Key-by-key summary of what differs between two flat state objects (text-only). */
export function visualDiff(localObj: Json, cloudObj: Json): HTMLDivElement {
  const keys = new Set([...Object.keys(localObj || {}), ...Object.keys(cloudObj || {})])
  const rows: HTMLDivElement[] = []
  const row = (color: string, bg: string, key: string, text: string) =>
    h('div', { style: { color, padding: '4px', background: bg } }, h('strong', {}, `${key}:`), ` ${text}`)

  for (const key of keys) {
    const localVal = localObj?.[key]
    const cloudVal = cloudObj?.[key]
    if (JSON.stringify(localVal) === JSON.stringify(cloudVal)) continue
    if (localVal === undefined) {
      rows.push(row('#ff6b6b', 'rgba(255,107,107,0.1)', key, `Removed (was ${JSON.stringify(cloudVal)})`))
    } else if (cloudVal === undefined) {
      rows.push(row('#4ecdc4', 'rgba(78,205,196,0.1)', key, `Added (${JSON.stringify(localVal)})`))
    } else if (Array.isArray(localVal) && Array.isArray(cloudVal)) {
      rows.push(row('#ffd700', 'rgba(255,215,0,0.1)', key, `Array length ${localVal.length} (local) vs ${cloudVal.length} (cloud)`))
    } else {
      rows.push(row('#ffd700', 'rgba(255,215,0,0.1)', key, 'Changed'))
    }
  }
  if (rows.length === 0) {
    return h('div', { style: { color: '#888', fontSize: '0.85em', marginTop: '5px' } }, 'No differences found.')
  }
  return h('div', {
    style: { display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px', padding: '5px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
  }, ...rows)
}

/** Short human summary of a delta file's JSON (or raw text). */
export function summarizeDeltaContent(path: string, content: string): string {
  let text = `File: ${path}\n`
  try {
    const json = JSON.parse(content) as { history?: Array<{ content?: string }>; content?: string; role?: string }
    if (Array.isArray(json.history)) {
      text += `+ ${json.history.length} messages in history array\n`
      const last = json.history[json.history.length - 1]
      if (last?.content) text += `  Latest: "${String(last.content).substring(0, 50)}..."\n`
    } else if (typeof json.content === 'string') {
      text += `Delta Message Role: ${json.role || 'unknown'}\n`
      text += `Delta Content: "${json.content.substring(0, 100)}..."\n`
    } else {
      text += JSON.stringify(json, null, 2)
    }
  } catch {
    text += content.substring(0, 500) + (content.length > 500 ? '...' : '')
  }
  return text
}

async function fetchDeltaPreview(memoryManager: MemoryManager, path: string): Promise<{ ok: boolean; text: string }> {
  const { token, repoId } = memoryManager.getCloudCredentials()
  if (!token || !repoId) return { ok: false, text: 'Cloud credentials not available.' }
  const cleanRepoId = repoId.startsWith('datasets/') ? repoId.slice('datasets/'.length) : repoId
  const url = `https://huggingface.co/datasets/${cleanRepoId}/resolve/main/${path.split('/').map(encodeURIComponent).join('/')}`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) return { ok: false, text: 'Failed to fetch from HuggingFace.' }
  return { ok: true, text: summarizeDeltaContent(path, await response.text()) }
}

function deltaCard(delta: PendingDelta, getMemoryManager: () => MemoryManager | null): HTMLDivElement {
  const preview = h('div', {
    style: { display: 'none', marginTop: '10px', fontFamily: 'monospace', fontSize: '0.8em', whiteSpace: 'pre-wrap', background: '#000', padding: '5px', borderRadius: '4px', border: '1px solid #333' },
  })
  const previewBtn = h('button', {
    type: 'button',
    style: { marginTop: '5px', background: '#0f3460', color: 'white', border: '1px solid #4ecdc4', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' },
  }, 'Preview Diff')

  previewBtn.addEventListener('click', () => {
    if (preview.style.display === 'block') {
      preview.style.display = 'none'
      previewBtn.textContent = 'Preview Diff'
      return
    }
    preview.style.display = 'block'
    previewBtn.textContent = 'Hide Diff'
    setChildren(preview, h('span', { style: { color: '#888' } }, 'Loading diff...'))
    const memoryManager = getMemoryManager()
    if (!memoryManager) {
      setChildren(preview, h('span', { style: { color: '#ff6b6b' } }, 'MemoryManager not available.'))
      return
    }
    fetchDeltaPreview(memoryManager, delta.path)
      .then(({ ok, text }) => setChildren(preview, h('span', { style: { color: ok ? '#4ecdc4' : '#ff6b6b' } }, text)))
      .catch(() => setChildren(preview, h('span', { style: { color: '#ff6b6b' } }, 'Failed to load diff.')))
  })

  return h('div', { style: CARD_STYLE },
    h('div', { style: { fontWeight: 'bold', color: '#ffd700' } }, delta.path || delta.id || 'Delta'),
    h('div', { style: { fontSize: '0.85em', color: '#ccc' } }, `Action: ${delta.action || 'Unknown'} · Size: ${delta.cloudState?.size ?? 0} bytes`),
    visualDiff(delta.localState, delta.cloudState as Json),
    previewBtn,
    preview,
  )
}

/** Renders pending deltas into `list`. Returns them so callers (force merge) can act on the same set. */
export async function renderPendingDeltas(
  list: HTMLElement,
  getMemoryManager: () => MemoryManager | null,
): Promise<PendingDelta[]> {
  const memoryManager = getMemoryManager()
  if (!memoryManager) {
    setChildren(list, note('MemoryManager not available.', '#ff6b6b'))
    return []
  }
  setChildren(list, note('Loading pending deltas...', '#ccc'))
  try {
    const deltas = await memoryManager.getPendingDeltas()
    if (deltas.length === 0) {
      setChildren(list, note('No pending deltas found.'))
      return []
    }
    setChildren(list, ...deltas.map((d) => deltaCard(d, getMemoryManager)))
    return deltas
  } catch (err) {
    console.error('Failed to load pending deltas', err)
    setChildren(list, note('Failed to load pending deltas.', '#ff6b6b'))
    return []
  }
}

/** Episode ids that own the given delta files (`episodes/<id>/delta-….json`). */
export function episodesWithDeltas(deltas: readonly PendingDelta[]): string[] {
  const ids = new Set<string>()
  for (const d of deltas) {
    const m = /^episodes\/([^/]+)\/delta-/.exec(d.path)
    if (m) ids.add(m[1])
  }
  return [...ids]
}
