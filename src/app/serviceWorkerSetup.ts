import { registerSW } from 'virtual:pwa-register'
import { reloadOnceForIsolation } from './isolationReload'
import type { Scope } from '../utils/lifecycle'
import { parseStripeKillSwitch, consumePreferMirror } from '../utils/dualDomainStripe'

/**
 * Service-worker registration, stale-root cleanup and dual-domain stripe config.
 * Page-lifetime: call once per page load (from `main.ts`), not per `initApp()`
 * attempt — retries must not register a second `controllerchange` listener.
 */
export function setupServiceWorker(scope: Scope): void {
  if ('serviceWorker' in navigator) {
    try {
      // Clean up any stale origin-wide (scope '/') service worker registration from
      // earlier builds — it intercepts fetches for every app on this shared origin
      // (test.1ink.us, go.1ink.us), not just this one. Our own registration below is
      // scoped to this app path, so this only ever removes the poisoned root worker.
      const ownScope = new URL('./', location.href).href
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            if (registration.scope === location.origin + '/' && registration.scope !== ownScope) {
              void registration.unregister().then(() => {
                console.log('[ServiceWorker] Unregistered stale origin-wide service worker')
              })
            }
          }
        })
        .catch((error) => {
          console.warn('[ServiceWorker] Failed to enumerate registrations for cleanup:', error)
        })

      reloadOnceForIsolation({ scope })
      registerSW({
        onNeedRefresh() {
          console.log('[ServiceWorker] New content available, please refresh.')
        },
        onOfflineReady() {
          console.log('[ServiceWorker] App is ready for offline use.')
        },
      })
      console.log('[ServiceWorker] Registered via virtual:pwa-register')

      const invertOrigins = consumePreferMirror()
      const stripeConfig = {
        ...parseStripeKillSwitch({
          search: window.location.search,
          storageGet: (key) => {
            try {
              return localStorage.getItem(key)
            } catch {
              return null
            }
          },
        }),
        invertOrigins,
      }
      const stripeMessage = {
        type: 'SET_STRIPE_CONFIG',
        enabled: stripeConfig.enabled,
        raceFirstByte: stripeConfig.raceFirstByte,
        invertOrigins: stripeConfig.invertOrigins,
      }
      navigator.serviceWorker.controller?.postMessage(stripeMessage)
      void navigator.serviceWorker.ready
        .then((reg) => {
          reg.active?.postMessage(stripeMessage)
        })
        .catch(() => {
          /* registration still in flight */
        })
      scope.listen(navigator.serviceWorker, 'controllerchange', () => {
        navigator.serviceWorker.controller?.postMessage(stripeMessage)
      })
      console.log('[ServiceWorker] Dual-domain stripe', stripeConfig)
    } catch (error) {
      console.warn('[ServiceWorker] Registration failed (non-critical):', error)
    }
  }
}
