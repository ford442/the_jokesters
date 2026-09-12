/**
 * Dual-domain striped Range downloads for VPS model shards.
 *
 * Large `.bin` / `.safetensors` / `.gguf` / `.wasm` files are split into 42MB
 * chunks and alternating chunks prefer `storage.1ink.us` vs the Contabo mirror
 * (`storage.noahcohn.com`). A miss/stall on the preferred origin is a *soft*
 * failure: the same byte range is refilled from the other host.
 *
 * Cache API keys stay on the canonical primary URL — this module never
 * produces a mirror-host cache key. The service worker intercepts WebLLM
 * `Cache.add` / fetch and returns an assembled Response for the original
 * request; it does not `Cache.put` under either host.
 *
 * Option A (SW-only intercept) is the sole parallel download path. GGUF
 * loads hit the same worker via `.gguf` fetch intercept. There is no
 * second Range assembler in application TypeScript.
 */

import {
  isVpsStorageUrl,
  toVpsMirrorUrl,
  VPS_STORAGE_MIRROR_ORIGIN,
} from './vpsStorageUrl'

export const STRIPE_CHUNK_SIZE = 42 * 1024 * 1024
export const STRIPE_PARALLEL_CONNECTIONS = 4
/** Give up on a stalled origin so the sibling host can refill the range. */
export const STRIPE_CHUNK_TIMEOUT_MS = 45_000
/** Headers-received budget when racing both origins for a chunk. */
export const STRIPE_TTFB_TIMEOUT_MS = 8_000

export const STRIPE_STORAGE_KEY = 'jokesters-dual-domain-stripe'
export const STRIPE_RACE_STORAGE_KEY = 'jokesters-stripe-race'
/** One-load session flag: invert even/odd origin preference (Retry mirror). */
export const STRIPE_INVERT_SESSION_KEY = 'jokesters-prefer-mirror'

export const STRIPE_ELIGIBLE_EXTENSIONS = ['.bin', '.safetensors', '.gguf', '.wasm'] as const

export type StripeOrigin = 'primary' | 'mirror'

export interface StripeConfig {
  /** When false, every chunk stays on the canonical primary URL. */
  enabled: boolean
  /** Race TTFB on both origins and abort the loser (optional; off by default). */
  raceFirstByte: boolean
  /** Swap even/odd origin preference for one retry (Contabo-first even chunks). */
  invertOrigins?: boolean
}

export interface StripeChunk {
  index: number
  start: number
  end: number
  preferred: StripeOrigin
  /** Sibling origin to refill from; null when striping is off or no mirror. */
  fallback: StripeOrigin | null
}

export interface StripePlan {
  /** Canonical primary-host URL — use this as the Cache API / logical key. */
  cacheKey: string
  primaryUrl: string
  mirrorUrl: string | null
  chunks: StripeChunk[]
  raceFirstByte: boolean
  enabled: boolean
  fileSize: number
  chunkSize: number
}

export interface StripeChunkResult<T> {
  data: T
  url: string
  fromFallback: boolean
}

function readEnvFlag(name: string, defaultOn: boolean): boolean {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    const v = env?.[name]?.trim()
    if (v === undefined || v === '') return defaultOn
    const lower = v.toLowerCase()
    return lower !== '0' && lower !== 'false' && lower !== 'off' && lower !== 'no'
  } catch {
    return defaultOn
  }
}

/** Build-time defaults (`VITE_VPS_DUAL_DOMAIN_STRIPE` on, race off). */
export function defaultStripeConfig(): StripeConfig {
  return {
    enabled: readEnvFlag('VITE_VPS_DUAL_DOMAIN_STRIPE', true),
    raceFirstByte: readEnvFlag('VITE_VPS_STRIPE_RACE', false),
    invertOrigins: false,
  }
}

export interface StripeKillSwitchInput {
  search?: string
  storageGet?: (key: string) => string | null
  envEnabled?: boolean
  envRace?: boolean
}

/**
 * Runtime kill-switch. Query `?noStripe` / `?stripeOff` wins; localStorage
 * `jokesters-dual-domain-stripe=0` disables after a reload. `?stripeRace`
 * enables per-chunk TTFB racing.
 */
export function parseStripeKillSwitch(input: StripeKillSwitchInput = {}): StripeConfig {
  const env = defaultStripeConfig()
  let enabled = input.envEnabled ?? env.enabled
  let raceFirstByte = input.envRace ?? env.raceFirstByte

  const params = new URLSearchParams(
    input.search?.startsWith('?') ? input.search.slice(1) : (input.search ?? ''),
  )
  const stored = input.storageGet?.(STRIPE_STORAGE_KEY)
  const storedRace = input.storageGet?.(STRIPE_RACE_STORAGE_KEY)

  if (stored === '0' || stored === 'off' || stored === 'false') enabled = false
  if (stored === '1' || stored === 'on' || stored === 'true') enabled = true
  if (storedRace === '0' || storedRace === 'off') raceFirstByte = false
  if (storedRace === '1' || storedRace === 'on') raceFirstByte = true

  if (params.has('noStripe') || params.has('stripeOff')) {
    enabled = false
    raceFirstByte = false
  }
  if (params.has('stripeRace') && enabled) {
    raceFirstByte = true
  }

  return { enabled, raceFirstByte, invertOrigins: false }
}

/** Page: honor query + localStorage when a window exists. */
export function readRuntimeStripeConfig(): StripeConfig {
  try {
    if (typeof location !== 'undefined') {
      return parseStripeKillSwitch({
        search: location.search,
        storageGet:
          typeof localStorage !== 'undefined'
            ? (key) => {
                try {
                  return localStorage.getItem(key)
                } catch {
                  return null
                }
              }
            : undefined,
      })
    }
  } catch {
    /* Node / worker without DOM */
  }
  return defaultStripeConfig()
}

export function queuePreferMirror(): void {
  try {
    sessionStorage.setItem(STRIPE_INVERT_SESSION_KEY, '1')
  } catch {
    /* ignore quota */
  }
}

/** True when the next load should invert even/odd stripe preference. Consumes the flag. */
export function consumePreferMirror(): boolean {
  try {
    const v = sessionStorage.getItem(STRIPE_INVERT_SESSION_KEY)
    if (v) sessionStorage.removeItem(STRIPE_INVERT_SESSION_KEY)
    return v === '1' || v === 'on' || v === 'true'
  } catch {
    return false
  }
}

export function isStripeEligibleUrl(url: string): boolean {
  if (!isVpsStorageUrl(url)) return false
  if (url.endsWith('.gz') || url.includes('.gz?')) return false
  return STRIPE_ELIGIBLE_EXTENSIONS.some((ext) => url.includes(ext))
}

/**
 * Map any VPS URL onto { primary, mirror }. Non-VPS URLs have no mirror.
 * The primary URL is the Cache API key (never the Contabo host).
 */
export function resolveStripePair(url: string): { primaryUrl: string; mirrorUrl: string | null } {
  const other = toVpsMirrorUrl(url)
  if (!other) return { primaryUrl: url, mirrorUrl: null }

  if (url.startsWith(`${VPS_STORAGE_MIRROR_ORIGIN}/`)) {
    return { primaryUrl: other, mirrorUrl: url }
  }
  return { primaryUrl: url, mirrorUrl: other }
}

/** Always the primary-host equivalent; never a mirror-host cache key. */
export function stripeCacheKey(requestUrl: string): string {
  return resolveStripePair(requestUrl).primaryUrl
}

export function splitByteRanges(
  fileSize: number,
  chunkSize: number = STRIPE_CHUNK_SIZE,
): Array<{ index: number; start: number; end: number }> {
  if (fileSize <= 0 || chunkSize <= 0) return []
  const chunkCount = Math.ceil(fileSize / chunkSize)
  return Array.from({ length: chunkCount }, (_, i) => ({
    index: i,
    start: i * chunkSize,
    end: Math.min((i + 1) * chunkSize - 1, fileSize - 1),
  }))
}

export function expectedChunkBytes(chunk: Pick<StripeChunk, 'start' | 'end'>): number {
  return chunk.end - chunk.start + 1
}

export function isChunkLengthValid(
  receivedBytes: number,
  chunk: Pick<StripeChunk, 'start' | 'end'>,
): boolean {
  return receivedBytes === expectedChunkBytes(chunk)
}

/**
 * Even chunks prefer primary, odd chunks prefer the mirror. When striping is
 * off (flag, no mirror, ineligible URL) every chunk stays on primary.
 */
export function preferredOriginForChunk(
  index: number,
  striping: boolean,
  invertOrigins = false,
): StripeOrigin {
  if (!striping) return 'primary'
  const evenPrefersMirror = invertOrigins
  if (index % 2 === 0) return evenPrefersMirror ? 'mirror' : 'primary'
  return evenPrefersMirror ? 'primary' : 'mirror'
}

export function originAttemptOrder(chunk: StripeChunk): StripeOrigin[] {
  if (chunk.fallback === null || chunk.fallback === chunk.preferred) {
    return [chunk.preferred]
  }
  return [chunk.preferred, chunk.fallback]
}

export function buildStripePlan(
  fileSize: number,
  requestUrl: string,
  config: StripeConfig,
  chunkSize: number = STRIPE_CHUNK_SIZE,
): StripePlan {
  const { primaryUrl, mirrorUrl } = resolveStripePair(requestUrl)
  const striping =
    config.enabled && mirrorUrl !== null && isStripeEligibleUrl(requestUrl)

  const ranges = splitByteRanges(fileSize, chunkSize)
  const invertOrigins = !!config.invertOrigins
  const chunks: StripeChunk[] = ranges.map((range) => {
    const preferred = preferredOriginForChunk(range.index, striping, invertOrigins)
    const fallback: StripeOrigin | null = striping
      ? (preferred === 'primary' ? 'mirror' : 'primary')
      : null
    return { ...range, preferred, fallback }
  })

  return {
    cacheKey: primaryUrl,
    primaryUrl,
    mirrorUrl: striping ? mirrorUrl : null,
    chunks,
    raceFirstByte: striping && config.raceFirstByte,
    enabled: striping,
    fileSize,
    chunkSize,
  }
}

export function urlForOrigin(plan: Pick<StripePlan, 'primaryUrl' | 'mirrorUrl'>, origin: StripeOrigin): string {
  if (origin === 'mirror' && plan.mirrorUrl) return plan.mirrorUrl
  return plan.primaryUrl
}

export function chunkSourceUrls(
  chunk: StripeChunk,
  plan: Pick<StripePlan, 'primaryUrl' | 'mirrorUrl'>,
): { preferredUrl: string; fallbackUrl: string | null } {
  const preferredUrl = urlForOrigin(plan, chunk.preferred)
  if (chunk.fallback === null) {
    return { preferredUrl, fallbackUrl: null }
  }
  const fallbackUrl = urlForOrigin(plan, chunk.fallback)
  if (fallbackUrl === preferredUrl) {
    return { preferredUrl, fallbackUrl: null }
  }
  return { preferredUrl, fallbackUrl }
}

/**
 * Sequential preferred → sibling refill. Inject `fetchRange` so unit tests
 * can simulate a blocked origin without a service worker.
 */
export async function fetchStripedChunk<T>(
  chunk: StripeChunk,
  plan: Pick<StripePlan, 'primaryUrl' | 'mirrorUrl' | 'raceFirstByte'>,
  fetchRange: (url: string, start: number, end: number, signal?: AbortSignal) => Promise<T>,
): Promise<StripeChunkResult<T>> {
  const { preferredUrl, fallbackUrl } = chunkSourceUrls(chunk, plan)

  try {
    const data = await fetchRange(preferredUrl, chunk.start, chunk.end)
    return { data, url: preferredUrl, fromFallback: false }
  } catch (preferredError) {
    if (!fallbackUrl) throw preferredError
    const data = await fetchRange(fallbackUrl, chunk.start, chunk.end)
    return { data, url: fallbackUrl, fromFallback: true }
  }
}

/**
 * Race two origin opens (typically TTFB / headers-received). The caller
 * aborts the loser via the signal the slower `open` received.
 */
export async function raceRangeResponses<T>(
  preferredUrl: string,
  fallbackUrl: string,
  open: (url: string, signal: AbortSignal) => Promise<T>,
): Promise<{ value: T; url: string }> {
  const preferredCtrl = new AbortController()
  const fallbackCtrl = new AbortController()

  const wrap = (url: string, ctrl: AbortController, loser: AbortController) =>
    open(url, ctrl.signal).then((value) => {
      loser.abort()
      return { value, url }
    })

  try {
    return await Promise.any([
      wrap(preferredUrl, preferredCtrl, fallbackCtrl),
      wrap(fallbackUrl, fallbackCtrl, preferredCtrl),
    ])
  } catch (error) {
    const aggregated = error as AggregateError
    const first = aggregated?.errors?.[0]
    throw first instanceof Error ? first : new Error('both origins failed TTFB race')
  }
}

/**
 * Progress from *successfully assembled* chunk bytes only — retries and
 * losing races must not be counted twice by the caller.
 */
export function stripeProgress(
  completedChunkBytes: number,
  fileSize: number,
): { downloaded: number; total: number; percentage: number } {
  const downloaded = Math.max(0, Math.min(completedChunkBytes, fileSize))
  return {
    downloaded,
    total: fileSize,
    percentage: fileSize === 0 ? 0 : Math.min(100, Math.round((downloaded / fileSize) * 100)),
  }
}

/** Worker count: racing opens two connections per worker, so halve them. */
export function stripeWorkerCount(chunkCount: number, raceFirstByte: boolean): number {
  const cap = raceFirstByte
    ? Math.max(1, Math.ceil(STRIPE_PARALLEL_CONNECTIONS / 2))
    : STRIPE_PARALLEL_CONNECTIONS
  return Math.min(cap, Math.max(1, chunkCount))
}
