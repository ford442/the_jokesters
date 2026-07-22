/**
 * Canonical VPS model storage URL helpers.
 *
 * Primary host: storage.1ink.us (override with VITE_VPS_STORAGE_ORIGIN).
 * Mirror host:  storage.noahcohn.com (used by SW / ops scripts only).
 *
 * WebLLM's cleanModelUrl() appends HuggingFace-style `/resolve/main/` to every
 * model base URL. Our VPS serves flat paths (no /resolve/main/), so those
 * requests 404 unless rewritten before fetch or Cache.add().
 */

const DEFAULT_ORIGIN = 'https://storage.1ink.us'
const DEFAULT_MIRROR_ORIGIN = 'https://storage.noahcohn.com'

function readViteOrigin(): string | undefined {
  try {
    // Vite injects import.meta.env at build time
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    const v = env?.VITE_VPS_STORAGE_ORIGIN?.trim()
    return v || undefined
  } catch {
    return undefined
  }
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '')
}

/** Primary model CDN origin (no trailing slash). Overridable via VITE_VPS_STORAGE_ORIGIN. */
export const VPS_STORAGE_ORIGIN = normalizeOrigin(readViteOrigin() ?? DEFAULT_ORIGIN)

/** Optional mirror origin for ops / service-worker failover docs. */
export const VPS_STORAGE_MIRROR_ORIGIN = normalizeOrigin(
  (() => {
    try {
      const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env
      const v = env?.VITE_VPS_STORAGE_MIRROR_ORIGIN?.trim()
      return v || DEFAULT_MIRROR_ORIGIN
    } catch {
      return DEFAULT_MIRROR_ORIGIN
    }
  })(),
)

/** Base path for models: `${origin}/models` */
export const VPS_STORAGE_URL = `${VPS_STORAGE_ORIGIN}/models`

/** Hostname allowlist for rewrites / SW (primary + mirror). */
export const VPS_STORAGE_HOSTS = [
  new URL(VPS_STORAGE_ORIGIN).hostname,
  new URL(VPS_STORAGE_MIRROR_ORIGIN).hostname,
] as const

/** WebLLM HF-style URL → flat VPS path (both storage mirrors) */
const VPS_RESOLVE_MAIN_RE =
  /^(https:\/\/storage\.(?:1ink\.us|noahcohn\.com)\/models\/[^/]+)\/resolve\/main\/(.+)$/

export function rewriteVpsModelUrl(url: string): string {
  const match = url.match(VPS_RESOLVE_MAIN_RE)
  return match ? `${match[1]}/${match[2]}` : url
}

/**
 * Swap primary ↔ mirror storage host. Returns null if `url` is not on either host
 * or if primary and mirror are the same origin.
 */
export function toVpsMirrorUrl(url: string): string | null {
  if (VPS_STORAGE_ORIGIN === VPS_STORAGE_MIRROR_ORIGIN) return null

  const primaryPrefix = `${VPS_STORAGE_ORIGIN}/`
  const mirrorPrefix = `${VPS_STORAGE_MIRROR_ORIGIN}/`

  if (url.startsWith(primaryPrefix)) {
    return `${VPS_STORAGE_MIRROR_ORIGIN}/${url.slice(primaryPrefix.length)}`
  }
  if (url.startsWith(mirrorPrefix)) {
    return `${VPS_STORAGE_ORIGIN}/${url.slice(mirrorPrefix.length)}`
  }
  return null
}

/**
 * Same-origin `.gz` twin URL for pre-compressed shards.
 * Contabo-only `.gz` files are intentionally not probed — gzip only pays off
 * when the twin lives on the same host as the request (usually storage.1ink.us).
 */
export function vpsGzUrl(url: string): string {
  return `${url}.gz`
}

/** True when `url` is on our primary or mirror storage host. */
export function isVpsStorageUrl(url: string): boolean {
  return (
    url.startsWith(`${VPS_STORAGE_ORIGIN}/`) ||
    url.startsWith(`${VPS_STORAGE_MIRROR_ORIGIN}/`)
  )
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function buildRequest(input: RequestInfo | URL, url: string): Request {
  if (typeof input === 'string') return new Request(url)
  if (input instanceof URL) return new Request(url)
  return new Request(url, input)
}

function buildFetchInput(input: RequestInfo | URL, rewrittenUrl: string): RequestInfo | URL {
  if (typeof input === 'string' || input instanceof URL) {
    return rewrittenUrl
  }
  return new Request(rewrittenUrl, input)
}

/**
 * Patch global fetch so WebLLM's /resolve/main/ URLs hit flat VPS paths.
 * Safe to call multiple times (no-op after first install).
 */
export function installVpsFetchRewrite(): void {
  const g = globalThis as typeof globalThis & { __vpsFetchRewriteInstalled?: boolean }
  if (g.__vpsFetchRewriteInstalled) return

  const originalFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = resolveRequestUrl(input)
    const rewritten = rewriteVpsModelUrl(url)
    if (rewritten !== url) {
      return originalFetch(buildFetchInput(input, rewritten), init)
    }
    return originalFetch(input, init)
  }

  g.__vpsFetchRewriteInstalled = true
}

/**
 * Patch Cache.add so WebLLM artifact caching fetches flat VPS paths.
 * Cache.add() does not always honor a patched global fetch, so we fetch
 * explicitly and store under the original /resolve/main/ cache key.
 */
export function installVpsCacheRewrite(): void {
  const g = globalThis as typeof globalThis & { __vpsCacheRewriteInstalled?: boolean }
  if (g.__vpsCacheRewriteInstalled || typeof Cache === 'undefined') return

  const originalAdd = Cache.prototype.add
  Cache.prototype.add = async function (input: RequestInfo): Promise<void> {
    const url = resolveRequestUrl(input)
    const rewritten = rewriteVpsModelUrl(url)
    if (rewritten === url) {
      return originalAdd.call(this, input)
    }
    const response = await fetch(rewritten)
    if (!response?.ok) {
      throw new TypeError("Failed to execute 'add' on 'Cache': Request failed")
    }
    await this.put(buildRequest(input, url), response)
  }

  g.__vpsCacheRewriteInstalled = true
}

/** Install fetch + Cache rewrites (idempotent). */
export function installVpsStorageRewrites(): void {
  installVpsFetchRewrite()
  installVpsCacheRewrite()
}
