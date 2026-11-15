import type { MemoryManager } from '../../Director/MemoryManager'
import type { Scope } from '../../utils/lifecycle'
import { MODAL_AUTH_FORM, wireHfAuthForm } from './auth'
import { renderHistory } from './history'
import { renderPendingDeltas } from './deltas'
import { renderAnalytics } from './analytics'
import { forceMergeDeltas, renderPublicDataset } from './sync'
import { byId } from './dom'

export { MAIN_PANEL_AUTH_FORM, wireHfAuthForm } from './auth'

/**
 * Wire the cloud dashboard modal (index.html, outside #app, page-lifetime).
 *
 * The two buttons that open it live in the app template, which is re-rendered
 * on every init attempt, so they are handled by delegation on `document` and
 * keep working after a retry. Every button has exactly one click handler, and
 * remote data is rendered as text (see ./dom).
 */
export function setupDashboard(scope: Scope, getMemoryManager: () => MemoryManager | null): void {
  const modal = byId('cloud-dashboard-modal')
  const closeBtn = byId('close-cloud-dashboard-btn')
  const refreshBtn = byId('refresh-cloud-dashboard-btn')
  const historyList = byId('cloud-history-list')
  if (!modal || !closeBtn || !refreshBtn || !historyList) return

  // Never block the launch UI; the modal only appears when explicitly opened.
  modal.style.display = 'none'

  const loadHistory = () => {
    void renderHistory(historyList, getMemoryManager()).catch((err: unknown) => console.error('[dashboard] history failed', err))
  }

  const prefillAuth = wireHfAuthForm(scope, MODAL_AUTH_FORM, getMemoryManager)

  scope.listen<MouseEvent>(document, 'click', (e) => {
    const target = e.target as Element | null
    if (typeof target?.closest !== 'function') return
    if (target.closest('#cloud-dashboard-btn')) {
      modal.style.display = 'flex'
      prefillAuth()
      loadHistory()
    } else if (target.closest('#review-sync-btn')) {
      modal.style.display = 'flex'
      prefillAuth()
    }
  })
  scope.listen(closeBtn, 'click', () => { modal.style.display = 'none' })
  scope.listen(refreshBtn, 'click', loadHistory)

  // Pending deltas: one toggle button, one force-merge button.
  const checkDeltasBtn = byId('check-pending-deltas-btn')
  const deltasContainer = byId('pending-deltas-container')
  const deltasList = byId('pending-deltas-list')
  const forceMergeBtn = byId<HTMLButtonElement>('force-merge-deltas-btn')
  if (checkDeltasBtn && deltasContainer && deltasList) {
    scope.listen(checkDeltasBtn, 'click', () => {
      if (deltasContainer.style.display === 'block') {
        deltasContainer.style.display = 'none'
        return
      }
      deltasContainer.style.display = 'block'
      void renderPendingDeltas(deltasList, getMemoryManager)
    })
  }
  if (forceMergeBtn && deltasContainer && deltasList) {
    const idleLabel = forceMergeBtn.textContent || 'Force Merge All Deltas'
    scope.listen(forceMergeBtn, 'click', () => {
      const memoryManager = getMemoryManager()
      if (!memoryManager || forceMergeBtn.disabled) return
      void (async () => {
        forceMergeBtn.disabled = true
        forceMergeBtn.textContent = 'Merging...'
        try {
          const pending = await memoryManager.getPendingDeltas()
          await forceMergeDeltas(memoryManager, pending)
          forceMergeBtn.textContent = idleLabel
          deltasContainer.style.display = 'block'
          await renderPendingDeltas(deltasList, getMemoryManager)
          loadHistory()
        } catch (err) {
          console.error('[dashboard] force merge failed', err)
          forceMergeBtn.textContent = 'Error (Retry)'
        } finally {
          forceMergeBtn.disabled = false
        }
      })()
    })
  }

  const browsePublicBtn = byId('browse-public-dataset-btn')
  const publicRepoInput = byId<HTMLInputElement>('public-dataset-repo-input')
  const publicRepoResults = byId('public-dataset-results')
  if (browsePublicBtn && publicRepoInput && publicRepoResults) {
    scope.listen(browsePublicBtn, 'click', () => {
      const repoId = publicRepoInput.value.trim()
      if (repoId) void renderPublicDataset(publicRepoResults, repoId, getMemoryManager)
    })
  }

  const viewAnalyticsBtn = byId('view-analytics-btn')
  const analyticsContainer = byId('episode-analytics-container')
  const analyticsContent = byId('episode-analytics-content')
  if (viewAnalyticsBtn && analyticsContainer && analyticsContent) {
    scope.listen(viewAnalyticsBtn, 'click', () => {
      const memoryManager = getMemoryManager()
      if (!memoryManager) return
      if (analyticsContainer.style.display === 'block') {
        analyticsContainer.style.display = 'none'
        return
      }
      analyticsContainer.style.display = 'block'
      void renderAnalytics(analyticsContent, memoryManager)
    })
  }
}
