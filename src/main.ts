import './utils/installVpsFetch'
import './style.css'
import { initApp } from './app/bootstrap'
import { startSyncPolling } from './app/statusBar'
import { setupDashboard } from './ui/dashboard'
import { getSharedMemoryManager } from './Director/MemoryManager'

void initApp().catch((error: unknown) => {
  console.error('[initApp] Failed before the app finished starting:', error)
  const host = document.getElementById('app') ?? document.body
  const pre = document.createElement('pre')
  pre.style.color = 'white'
  pre.style.background = '#ff6b6b'
  pre.style.padding = '12px'
  pre.style.borderRadius = '6px'
  pre.textContent = `Startup error: ${error instanceof Error ? error.message : String(error)}`
  host.prepend(pre)
})
// Both wire up before initApp()'s async body has constructed MemoryManager, so they
// read it through the shared-instance accessor (populated once bootstrap finishes)
// rather than a parameter that doesn't exist yet.
startSyncPolling(getSharedMemoryManager)
setupDashboard(getSharedMemoryManager)
