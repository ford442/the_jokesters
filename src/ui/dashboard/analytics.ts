import type { MemoryManager } from '../../Director/MemoryManager'
import { h, note, setChildren } from './dom'

const ROW_STYLE: Partial<CSSStyleDeclaration> = {
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: '1px solid #4ecdc4',
  paddingBottom: '5px',
  marginBottom: '5px',
}

function statRow(label: string, value: string | number, last = false): HTMLDivElement {
  return h('div', { style: last ? { display: 'flex', justifyContent: 'space-between' } : ROW_STYLE },
    h('span', {}, label),
    h('strong', { style: { color: 'white' } }, value),
  )
}

/** Renders local episode analytics into `content`. */
export async function renderAnalytics(content: HTMLElement, memoryManager: MemoryManager): Promise<void> {
  setChildren(content, note('Loading analytics...', '#ccc'))
  try {
    const analytics = await memoryManager.getEpisodeAnalytics()
    const topModes = Object.entries(analytics.commonModes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mode, n]) => `${mode} (${n})`)
      .join(', ') || 'None'
    setChildren(content,
      statRow('Total Episodes:', analytics.totalEpisodes),
      statRow('Total Tokens (Proxy):', analytics.totalTokensProxy),
      statRow('Avg Episode Length:', analytics.avgEpisodeLength),
      statRow('Top Modes:', topModes, true),
    )
  } catch (err) {
    console.error('Failed to load analytics', err)
    setChildren(content, note('Failed to load analytics.', '#ff6b6b'))
  }
}
