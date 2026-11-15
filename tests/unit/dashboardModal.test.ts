import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installFakeDom, type FakeDocument, type FakeElement } from './helpers/fakeDom'
import { Scope } from '../../src/utils/lifecycle'
import { setupDashboard } from '../../src/ui/dashboard'
import { renderHistory } from '../../src/ui/dashboard/history'
import { renderPendingDeltas, episodesWithDeltas } from '../../src/ui/dashboard/deltas'
import { forceMergeDeltas } from '../../src/ui/dashboard/sync'
import type { MemoryManager } from '../../src/Director/MemoryManager'
import type { PendingDelta } from '../../src/Director/memoryTypes'

const XSS = '<img src=x onerror="alert(1)">'

const MODAL_IDS = [
  'cloud-dashboard-modal',
  'close-cloud-dashboard-btn',
  'refresh-cloud-dashboard-btn',
  'cloud-history-list',
  'check-pending-deltas-btn',
  'pending-deltas-container',
  'pending-deltas-list',
  'force-merge-deltas-btn',
  'view-analytics-btn',
  'episode-analytics-container',
  'episode-analytics-content',
]

function fakeMemoryManager(overrides: Partial<Record<keyof MemoryManager, unknown>> = {}): MemoryManager {
  return {
    getCloudHistory: vi.fn(async () => []),
    getPendingDeltas: vi.fn(async () => []),
    getCloudCredentials: () => ({ token: null, repoId: null }),
    processSyncQueue: vi.fn(async () => {}),
    consolidateEpisodeDeltas: vi.fn(async () => {}),
    getEpisodeAnalytics: vi.fn(async () => ({ totalEpisodes: 0, totalTokensProxy: 0, avgEpisodeLength: 0, commonModes: {} })),
    ...overrides,
  } as unknown as MemoryManager
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0))

describe('cloud dashboard', () => {
  let doc: FakeDocument
  let uninstall: () => void
  let els: Record<string, FakeElement>
  let scope: Scope

  beforeEach(() => {
    ;({ doc, uninstall } = installFakeDom())
    els = Object.fromEntries(MODAL_IDS.map((id) => [id, doc.add(id, id.endsWith('-btn') ? 'button' : 'div')]))
    els['cloud-dashboard-modal'].style.display = 'flex' // stale inline style from index.html
    scope = new Scope()
  })
  afterEach(async () => {
    await scope.dispose()
    uninstall()
    vi.restoreAllMocks()
  })

  it('starts hidden and opens from openers re-rendered after setup (delegated), closes from Close', () => {
    setupDashboard(scope, () => null)
    const modal = els['cloud-dashboard-modal']
    expect(modal.style.display).toBe('none')

    // The opener buttons live in the per-run app template, created after setup (and again on retry).
    const reviewBtn = doc.add('review-sync-btn', 'button')
    reviewBtn.click()
    expect(modal.style.display).toBe('flex')
    els['close-cloud-dashboard-btn'].click()
    expect(modal.style.display).toBe('none')

    const dashBtn = doc.add('cloud-dashboard-btn', 'button')
    dashBtn.click()
    expect(modal.style.display).toBe('flex')
  })

  it('every dashboard button has exactly one click handler', () => {
    setupDashboard(scope, () => null)
    for (const id of ['check-pending-deltas-btn', 'force-merge-deltas-btn', 'view-analytics-btn', 'close-cloud-dashboard-btn', 'refresh-cloud-dashboard-btn']) {
      expect(els[id].listenerCount('click'), id).toBe(1)
    }
  })

  it('"Check Pending Deltas" toggles the panel open and closed', async () => {
    setupDashboard(scope, () => fakeMemoryManager())
    const container = els['pending-deltas-container']
    els['check-pending-deltas-btn'].click()
    expect(container.style.display).toBe('block')
    await flush()
    expect(els['pending-deltas-list'].textContent).toContain('No pending deltas')
    els['check-pending-deltas-btn'].click()
    expect(container.style.display).toBe('none')
  })

  it('releases its listeners when the scope is disposed', async () => {
    setupDashboard(scope, () => null)
    expect(doc.listenerCount('click')).toBe(1)
    await scope.dispose()
    expect(doc.listenerCount('click')).toBe(0)
    expect(els['check-pending-deltas-btn'].listenerCount('click')).toBe(0)
  })

  it('renders remote history strings as text, never via innerHTML', async () => {
    const list = doc.add('list')
    const mm = fakeMemoryManager({
      getCloudHistory: async () => [{ path: XSS, size: 3 }],
    })
    await renderHistory(list as unknown as HTMLElement, mm)
    expect(doc.innerHTMLWrites).toEqual([])
    expect(list.textContent).toContain(XSS)
    // The hostile string is a text node, not an element.
    expect(list.descendants().some((el) => el.tagName === 'img')).toBe(false)

    const commits = doc.add('commits')
    await renderHistory(commits as unknown as HTMLElement, fakeMemoryManager({
      getCloudHistory: async () => [{ oid: '1', message: XSS, author: { name: XSS }, date: '2026-01-01' }],
    }))
    expect(doc.innerHTMLWrites).toEqual([])
    expect(commits.textContent).toContain(XSS)
  })

  it('renders pending delta ids/paths as text, never via innerHTML', async () => {
    const list = doc.add('deltas')
    const delta: PendingDelta = {
      id: XSS,
      path: `episodes/x/delta-${XSS}.json`,
      action: 'delta_merge',
      cloudState: { fileInfo: XSS, size: 1 },
      localState: {},
    }
    const mm = fakeMemoryManager({ getPendingDeltas: async () => [delta] })
    await renderPendingDeltas(list as unknown as HTMLElement, () => mm)
    expect(doc.innerHTMLWrites).toEqual([])
    expect(list.textContent).toContain(delta.path)
    expect(list.descendants().some((el) => el.tagName === 'img')).toBe(false)
  })

  it('force merge flushes the queue and consolidates exactly the episodes with pending deltas', async () => {
    const mm = fakeMemoryManager()
    const pending: PendingDelta[] = [
      { id: 'a', path: 'episodes/ep1/delta-1.json', action: 'delta_merge', cloudState: { fileInfo: '' }, localState: {} },
      { id: 'b', path: 'episodes/ep1/delta-2.json', action: 'delta_merge', cloudState: { fileInfo: '' }, localState: {} },
      { id: 'c', path: 'episodes/ep2/delta-3.json', action: 'delta_merge', cloudState: { fileInfo: '' }, localState: {} },
    ]
    expect(episodesWithDeltas(pending)).toEqual(['ep1', 'ep2'])
    await expect(forceMergeDeltas(mm, pending)).resolves.toBe(2)
    expect(mm.processSyncQueue).toHaveBeenCalledTimes(1)
    expect(mm.consolidateEpisodeDeltas).toHaveBeenNthCalledWith(1, 'ep1')
    expect(mm.consolidateEpisodeDeltas).toHaveBeenNthCalledWith(2, 'ep2')
  })
})
