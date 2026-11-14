import './utils/installVpsFetch'
import './style.css'
import { initApp, setupServiceWorker } from './app/bootstrap'
import { Scope } from './utils/lifecycle'
import type { AppServices } from './app/services'
import { startSyncPolling } from './app/statusBar'
import { setupDashboard } from './ui/dashboard'

/** Page-lifetime root. Each `initApp()` attempt runs in a child scope of it. */
const pageScope = new Scope()

/** Services of the current app run; null before the first run is built and after a run is torn down. */
let services: AppServices | null = null
const getMemoryManager = () => services?.memoryManager ?? null

setupServiceWorker(pageScope)

void initApp(pageScope, { onServices: (s) => { services = s } }).catch((error: unknown) => {
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
// Both wire up before the first run has built its services, so they read the
// MemoryManager through an accessor rather than a value that doesn't exist yet.
startSyncPolling(pageScope, getMemoryManager)
setupDashboard(pageScope, getMemoryManager)
