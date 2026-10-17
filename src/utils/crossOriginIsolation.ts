/**
 * Cross-origin isolation (#400 A): COOP `same-origin` + COEP `credentialless` make
 * `crossOriginIsolated === true`, which unlocks SharedArrayBuffer → multithreaded wllama / ORT.
 *
 * Served from: Vite dev/preview (`vite.config.ts`), `public/.htaccess` (Apache hosts), and the
 * service worker as a fallback for hosts that cannot set headers (coi-serviceworker approach).
 *
 * `credentialless` (not `require-corp`) keeps cross-origin no-cors loads working without CORP
 * headers; model hosts (storage.1ink.us, the noahcohn mirror, HF Hub, GitHub raw) are fetched
 * with CORS already. Browsers that don't know `credentialless` (Safari) ignore it: no isolation,
 * but nothing breaks.
 */

export const ISOLATION_HEADERS: Readonly<Record<string, string>> = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

export type IsolationStatus = 'isolated' | 'not-isolated' | 'unsupported'

export interface IsolationProbe {
  status: IsolationStatus
  crossOriginIsolated: boolean
  sharedArrayBuffer: boolean
  hardwareConcurrency: number
  /** Threads wllama / ORT will use given the current isolation state. */
  wasmThreads: number
}

/** Threads for WASM inference: one core is left for Three.js / audio. */
export function wasmThreadCount(isolated: boolean, cores: number, cap = 8): number {
  return isolated ? Math.min(cap, Math.max(1, cores - 1)) : 1
}

export function probeIsolation(scope: {
  crossOriginIsolated?: boolean
  SharedArrayBuffer?: unknown
  navigator?: { hardwareConcurrency?: number }
  isSecureContext?: boolean
} = globalThis as never): IsolationProbe {
  const isolated = scope.crossOriginIsolated === true
  const sab = typeof scope.SharedArrayBuffer === 'function'
  const cores = scope.navigator?.hardwareConcurrency ?? 1
  const status: IsolationStatus = isolated && sab ? 'isolated' : scope.isSecureContext === false ? 'unsupported' : 'not-isolated'
  return {
    status,
    crossOriginIsolated: isolated,
    sharedArrayBuffer: sab,
    hardwareConcurrency: cores,
    wasmThreads: wasmThreadCount(isolated && sab, cores),
  }
}

/** Copy of `response` with COOP/COEP added, unless it already carries them or is opaque. */
export function withIsolationHeaders(response: Response): Response {
  if (response.type === 'opaque' || response.type === 'opaqueredirect' || response.status === 0) return response
  if (response.headers.has('Cross-Origin-Embedder-Policy')) return response
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(ISOLATION_HEADERS)) headers.set(name, value)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
