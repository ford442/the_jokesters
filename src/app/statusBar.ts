import type { GroupChatManager } from '../GroupChatManager'
import { getModelDisplayName } from '../config/models'
import { setProgress } from './loadingUi'

export function updateVRAMInfoBar(groupChatManager: GroupChatManager): void {
  const ctxInfoText = document.getElementById('ctx-info-text')
  const tokenBudgetText = document.getElementById('token-budget-text')
  const kvText = document.getElementById('vram-kv-text')

  const ctxInfo = groupChatManager.getContextWindowInfo()
  if (ctxInfoText) {
    if (ctxInfo) {
      const pct = Math.round((ctxInfo.usedTokens / ctxInfo.maxTokens) * 100)
      let label = `Context: ${ctxInfo.usedTokens}/${ctxInfo.maxTokens} tokens (${pct}%)`
      label += ` · reserve ${ctxInfo.reserveTokens}`
      if (ctxInfo.droppedMessages > 0) {
        label += ` · ${ctxInfo.droppedMessages} dropped`
      }
      if (ctxInfo.hasSummary) {
        label += ' · summary'
      }
      if (ctxInfo.estimationSource !== 'heuristic') {
        label += ` · ${ctxInfo.estimationSource}`
      }
      ctxInfoText.textContent = label
      ctxInfoText.title = ctxInfo.summaryStub ?? ''
    } else {
      const maxCtx = groupChatManager.getContextManager().getMaxContextTokens()
      ctxInfoText.textContent = `Context window: ${maxCtx} tokens`
    }
  }
  if (tokenBudgetText) {
    tokenBudgetText.textContent = `Max tokens: ${groupChatManager.getMaxTokensPerTurn()}`
  }
  if (kvText) {
    const cfg = groupChatManager.getVRAMConfig()
    if (cfg.kv_cache_quantization !== 'none') {
      kvText.textContent = `KV: ${cfg.kv_cache_quantization === 'auto' ? 'auto' : cfg.kv_cache_quantization}`
    } else {
      kvText.textContent = ''
    }
  }
}

export function updateNextAgentUI(groupChatManager: GroupChatManager): void {
  const nextAgentSpan = document.getElementById('next-agent')!
  const nextAgent = groupChatManager.getCurrentAgent()
  nextAgentSpan.textContent = nextAgent.name
  nextAgentSpan.style.color = nextAgent.color
}

export function setReadyStatus(groupChatManager: GroupChatManager): void {
  setProgress(`Ready — ${getModelDisplayName(groupChatManager.getLoadedModelId())}`, 100)
}

export function updateSyncUI(): void {
  const syncIcon = document.getElementById('sync-icon')
  const syncText = document.getElementById('sync-text')
  const syncContainer = document.getElementById('sync-status-indicator')

  if (!syncIcon || !syncText || !syncContainer) return

  const getMemMgr = (window as any).getMemoryManager
  if (!getMemMgr) {
    syncContainer.style.display = 'none'
    return
  }

  syncContainer.style.display = 'flex'

  const memoryManager = getMemMgr()
  if (!memoryManager) return

  const state = memoryManager.getSyncState()
  if (state.syncError) {
    syncIcon.textContent = '❌'
    syncText.textContent = 'Sync Error'
    syncText.style.color = '#ff6b6b'
    syncIcon.title = state.syncError
  } else if (state.isSyncing) {
    syncIcon.textContent = '⏳'
    syncText.textContent = `Syncing... (${state.queueLength} pending)`
    syncText.style.color = '#4ecdc4'
    syncIcon.title = ''
  } else if (state.queueLength > 0) {
    syncIcon.textContent = '⏸️'
    syncText.textContent = `Queued (${state.queueLength})`
    syncText.style.color = '#ffd700'
    syncIcon.title = ''
  } else {
    syncIcon.textContent = '☁️'
    if (state.lastSyncTime) {
      const dDate = new Date(state.lastSyncTime)
      syncText.textContent = `Synced: ${dDate.getHours().toString().padStart(2, '0')}:${dDate.getMinutes().toString().padStart(2, '0')}`
    } else {
      syncText.textContent = 'Synced'
    }
    syncText.style.color = '#888'
    syncIcon.title = ''
  }
}

export function startSyncPolling(): void {
  setInterval(updateSyncUI, 2000)
  window.addEventListener('syncStatusUpdated', updateSyncUI)

  window.addEventListener('offline', () => {
    console.log('App is offline, sync will resume when online.')
  })

  window.addEventListener('online', () => {
    console.log('App is back online, triggering MemoryManager sync retry...')
    if ((window as any).getMemoryManager) {
      (window as any).getMemoryManager().processSyncQueue()
    }
  })
}
