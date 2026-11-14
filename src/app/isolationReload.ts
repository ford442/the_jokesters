import type { Scope } from '../utils/lifecycle'

/**
 * Page-side half of the service-worker isolation fallback (see src/utils/crossOriginIsolation.ts).
 */
const RELOAD_FLAG = 'jokesters:coi-reload'

/**
 * First visit on a header-less host: the service worker only starts injecting COOP/COEP once it
 * controls the page, so reload once when it takes control. Guarded by sessionStorage (never loops)
 * and skipped once the page has been open long enough that the user may be mid-launch.
 */
export function reloadOnceForIsolation(options: { maxPageAgeMs?: number; scope?: Scope } = {}): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  if (window.crossOriginIsolated || !window.isSecureContext) return
  if (new URLSearchParams(location.search).has('noCoiReload')) return
  let alreadyTried = false
  try {
    alreadyTried = sessionStorage.getItem(RELOAD_FLAG) === '1'
  } catch {
    return // no sessionStorage → can't guard against loops
  }
  if (alreadyTried) return
  const maxAge = options.maxPageAgeMs ?? 15_000
  const onControllerChange = () => {
    if (window.crossOriginIsolated || performance.now() > maxAge) return
    try {
      sessionStorage.setItem(RELOAD_FLAG, '1')
    } catch {
      return
    }
    console.log('[Isolation] Service worker took control — reloading once for cross-origin isolation')
    location.reload()
  }
  if (options.scope) options.scope.listen(navigator.serviceWorker, 'controllerchange', onControllerChange)
  else navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
}
