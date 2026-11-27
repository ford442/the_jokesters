import './utils/installVpsFetch'
import './style.css'
import { setupServiceWorker } from './app/serviceWorkerSetup'
import { Scope } from './utils/lifecycle'
import type { AppServices } from './app/services'
import { isScriptPlayerRequested } from './script/scriptPacket'

/** Page-lifetime root. Each `initApp()` attempt runs in a child scope of it. */
const pageScope = new Scope()

if (import.meta.env.PROD) {
  void fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const version = (await response.json()) as {
        sha: string
        builtAt: string
        dirty: boolean
      }
      console.info(
        `[release] ${version.sha.slice(0, 7)} built ${version.builtAt}; dirty=${version.dirty}`,
      )
    })
    .catch((error: unknown) => console.warn('[release] Build metadata unavailable:', error))
}

setupServiceWorker(pageScope)

function showStartupError(error: unknown): void {
  const host = document.getElementById('app') ?? document.body
  const pre = document.createElement('pre')
  pre.style.color = 'white'
  pre.style.background = '#ff6b6b'
  pre.style.padding = '12px'
  pre.style.borderRadius = '6px'
  pre.textContent = `Startup error: ${error instanceof Error ? error.message : String(error)}`
  host.prepend(pre)
}

if (isScriptPlayerRequested(window.location.search)) {
  // Script Player: TTS + stage only. Dynamic import keeps bootstrap (and with it every
  // LLM engine) out of this path entirely.
  void import('./script/scriptPlayerBoot')
    .then((m) => m.initScriptPlayer(pageScope))
    .catch((error: unknown) => {
      console.error('[ScriptPlayer] Failed to start:', error)
      showStartupError(error)
    })
  pageScope.listen(window, 'pagehide', () => void pageScope.dispose())
} else {
  /** Services of the current app run; null before the first run is built and after a run is torn down. */
  let services: AppServices | null = null
  const getMemoryManager = () => services?.memoryManager ?? null
  void Promise.all([import('./app/bootstrap'), import('./app/statusBar'), import('./ui/dashboard')])
    .then(([{ initApp }, { startSyncPolling }, { setupDashboard }]) => {
      void initApp(pageScope, { onServices: (s) => { services = s } }).catch((error: unknown) => {
        console.error('[initApp] Failed before the app finished starting:', error)
        showStartupError(error)
      })
      // Both wire up before the first run has built its services, so they read the
      // MemoryManager through an accessor rather than a value that doesn't exist yet.
      startSyncPolling(pageScope, getMemoryManager)
      setupDashboard(pageScope, getMemoryManager)
    })
    .catch((error: unknown) => {
      console.error('[initApp] Failed to load the app:', error)
      showStartupError(error)
    })
}
