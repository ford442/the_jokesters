/// <reference lib="webworker" />
// Inject manifest from vite-plugin-pwa
import { precacheAndRoute } from 'workbox-precaching';
import {
  isVpsStorageUrl,
  rewriteVpsModelUrl,
  toVpsMirrorUrl,
  vpsGzUrl,
} from './utils/vpsStorageUrl';
import {
  STRIPE_CHUNK_SIZE,
  STRIPE_CHUNK_TIMEOUT_MS,
  STRIPE_TTFB_TIMEOUT_MS,
  buildStripePlan,
  chunkSourceUrls,
  defaultStripeConfig,
  expectedChunkBytes,
  fetchStripedChunk,
  isChunkLengthValid,
  raceRangeResponses,
  stripeWorkerCount,
  type StripeChunk,
  type StripeConfig,
} from './utils/dualDomainStripe';

// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST || []);

// Take control immediately so VPS URL rewrites apply on first load (not only after reload).
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Service Worker for Parallel Model Downloads
 *
 * Intercepts fetch requests for model files and uses parallel byte-range
 * requests for large files (> CHUNK_SIZE). For smaller files it acts as a
 * thin pass-through to avoid unnecessary memory buffering.
 *
 * Reliability: large Range-able shards stripe 42MB chunks across
 * storage.1ink.us and the Contabo mirror (storage.noahcohn.com). A miss or
 * stall on the preferred origin is a soft failure — the same byte range is
 * refilled from the sibling host. Whole-file fetchWithRetry still failovers
 * after retries for small / non-range files.
 *
 * Cache API keys stay on the canonical primary URL (the intercepted request).
 * This worker never Cache.put()s under the mirror host.
 *
 * Kill-switch: VITE_VPS_DUAL_DOMAIN_STRIPE=0, ?noStripe, or
 * localStorage jokesters-dual-domain-stripe=0 (page posts SET_STRIPE_CONFIG).
 *
 * Speed: same-origin `.gz` twins only (no cross-host Contabo .gz pulls);
 * negative-caches missing `.gz` HEADs for 1 hour.
 */

// Service worker context (use any to avoid type conflicts with DOM types)
// @ts-ignore
declare const self: ServiceWorkerGlobalScope;

const CHUNK_SIZE = STRIPE_CHUNK_SIZE;
const MODEL_HOSTS = [
  'cdn-lfs.huggingface.co',
  'huggingface.co',
  'models.mlc.ai',
  'storage.1ink.us',
  'storage.noahcohn.com',
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const GZ_MISS_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Runtime override from the page (query / localStorage kill-switch). */
let stripeConfig: StripeConfig = defaultStripeConfig();

/** Session negative cache for missing same-origin `.gz` twins. */
const gzMissCache = new Map<string, number>();

function isGzMissCached(gzUrl: string): boolean {
  const expires = gzMissCache.get(gzUrl);
  if (expires === undefined) return false;
  if (Date.now() > expires) {
    gzMissCache.delete(gzUrl);
    return false;
  }
  return true;
}

function markGzMiss(gzUrl: string): void {
  gzMissCache.set(gzUrl, Date.now() + GZ_MISS_TTL_MS);
}

/**
 * Fetch with exponential backoff. On VPS URLs, after retries exhaust, try the
 * mirror host once (primary ↔ Contabo).
 */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = MAX_RETRIES,
  allowMirrorFailover = true,
): Promise<Response> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 206) {
        return response;
      }
      // Retry on server errors (5xx) and rate limits (429)
      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`HTTP ${response.status}`);
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[ServiceWorker] Retry ${attempt + 1}/${maxRetries} for ${url} after ${delay}ms (HTTP ${response.status})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      // Don't retry client errors (4xx except 429)
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[ServiceWorker] Retry ${attempt + 1}/${maxRetries} for ${url} after ${delay}ms (${lastError.message})`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  if (allowMirrorFailover) {
    const mirror = toVpsMirrorUrl(url);
    if (mirror) {
      console.warn(`[ServiceWorker] Primary failed, failing over to mirror: ${url} → ${mirror}`);
      return fetchWithRetry(mirror, options, maxRetries, false);
    }
  }

  throw lastError || new Error(`fetch failed after ${maxRetries} retries`);
}

function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
  const live = signals.filter((s) => !!s);
  if (live.length === 0) return new AbortController().signal;
  const anyFn = (AbortSignal as typeof AbortSignal & {
    any?: (s: AbortSignal[]) => AbortSignal;
  }).any;
  if (typeof anyFn === 'function') return anyFn(live);
  const ctrl = new AbortController();
  for (const s of live) {
    if (s.aborted) {
      ctrl.abort();
      return ctrl.signal;
    }
    s.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  return ctrl.signal;
}

async function fetchRangeResponse(
  url: string,
  start: number,
  end: number,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=${start}-${end}` },
      signal: mergeAbortSignals(signal ? [signal, ctrl.signal] : [ctrl.signal]),
    });
    if (response.ok || response.status === 206) return response;
    throw new Error(`HTTP ${response.status}`);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRangeBytes(
  url: string,
  start: number,
  end: number,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const response = await fetchRangeResponse(url, start, end, timeoutMs, signal);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Check if URL is a model download we should intercept (with retry / rewrite).
 */
async function probeHead(url: string): Promise<{ fileSize: number; supportsRanges: boolean; ok: boolean }> {
  const headResponse = await fetchWithRetry(url, { method: 'HEAD' }, 1, false);
  const fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10);
  const supportsRanges =
    headResponse.ok &&
    headResponse.headers.has('accept-ranges') &&
    headResponse.headers.get('accept-ranges') !== 'none';
  return { fileSize, supportsRanges, ok: headResponse.ok };
}

/**
 * Size + range probe. Tries primary then mirror for *metadata only* — the
 * download URL stays canonical so striping can still split across both hosts.
 */
async function probeFileMeta(url: string): Promise<{ fileSize: number; supportsRanges: boolean } | null> {
  const apply = async (u: string) => {
    const probed = await probeHead(u);
    if (probed.ok && probed.fileSize > 0) return probed;
    return null;
  };

  try {
    const primary = await apply(url);
    if (primary) return primary;
  } catch {
    /* try mirror for size */
  }

  const mirror = toVpsMirrorUrl(url);
  if (!mirror) return null;
  try {
    return await apply(mirror);
  } catch {
    return null;
  }
}

/**
 * Check if URL is a model download we should intercept (with retry / rewrite).
 */
function isModelFile(url: string): boolean {
  const isModelHost = MODEL_HOSTS.some(host => url.includes(host));
  if (!isModelHost) return false;
  // Weight / runtime binaries
  if (url.includes('.safetensors') || url.includes('.bin') || url.includes('.gguf') || url.includes('.wasm')) {
    return true;
  }
  // Config + tokenizer JSON (WebLLM fetches these before shards)
  if (url.includes('.json') && url.includes('/models/')) {
    return true;
  }
  // VPS /resolve/main/ paths (any extension) — needs rewrite
  if (isVpsStorageUrl(url) && url.includes('/resolve/main/')) {
    return true;
  }
  return false;
}

/**
 * Extensions whose weight shards may have pre-compressed .gz twins on the VPS.
 * Only applies to our own storage origin (same-origin probe).
 */
const GZ_ELIGIBLE_EXTENSIONS = ['.bin', '.wasm', '.gguf', '.safetensors'];

function isGzEligible(url: string): boolean {
  return (
    isVpsStorageUrl(url) &&
    GZ_ELIGIBLE_EXTENSIONS.some(ext => url.includes(ext))
  );
}

/**
 * Try to fetch a pre-compressed .gz twin of a model shard (same origin only).
 *
 * Flow:
 *  1. Skip if negative-cached miss.
 *  2. HEAD <url>.gz — if 404 or error, cache miss and return null.
 *  3. If found: download compressed bytes (parallel if range-capable).
 *  4. Decompress via DecompressionStream('gzip').
 *
 * The .gz files must be pre-created on the same host as `url` (usually
 * storage.1ink.us). Contabo-only .gz twins are ignored by design.
 */
async function tryFetchGzCompressed(url: string): Promise<Response | null> {
  const gzUrl = vpsGzUrl(url);
  if (isGzMissCached(gzUrl)) {
    return null;
  }

  try {
    const headResp = await fetch(gzUrl, { method: 'HEAD' });
    if (!headResp.ok) {
      markGzMiss(gzUrl);
      return null;
    }

    const compressedSize = parseInt(headResp.headers.get('content-length') || '0', 10);
    if (compressedSize === 0) {
      markGzMiss(gzUrl);
      return null;
    }

    const supportsRanges =
      headResp.headers.has('accept-ranges') &&
      headResp.headers.get('accept-ranges') !== 'none';

    console.log(`[ServiceWorker] Found .gz shard: ${gzUrl} (${(compressedSize / 1024 / 1024).toFixed(1)} MB compressed)`);

    let compressedBytes: Uint8Array;
    if (supportsRanges && compressedSize > CHUNK_SIZE) {
      const combined = await downloadParallel(gzUrl, compressedSize);
      const buf = await combined.arrayBuffer();
      compressedBytes = new Uint8Array(buf);
    } else {
      const resp = await fetchWithRetry(gzUrl, {}, MAX_RETRIES);
      const buf = await resp.arrayBuffer();
      compressedBytes = new Uint8Array(buf);
    }

    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    (async () => {
      try {
        await writer.write(compressedBytes as any);
        await writer.close();
      } catch { /* reader will see the error */ }
    })();

    const decompressedChunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      decompressedChunks.push(value as Uint8Array);
    }

    const totalSize = decompressedChunks.reduce((s, c) => s + c.length, 0);
    const decompressed = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of decompressedChunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }

    console.log(
      `[ServiceWorker] Decompressed ${gzUrl}: ` +
      `${(compressedSize / 1024 / 1024).toFixed(1)} MB → ${(totalSize / 1024 / 1024).toFixed(1)} MB`
    );

    return new Response(decompressed.buffer.slice(decompressed.byteOffset, decompressed.byteOffset + decompressed.byteLength), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(totalSize),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Origin, Accept, Content-Type',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    markGzMiss(gzUrl);
    console.log(`[ServiceWorker] No usable .gz for ${gzUrl}:`, (error as Error).message ?? error);
    return null;
  }
}

/**
 * Download a large file with parallel connections.
 *
 * VPS shards stripe even/odd chunks across primary + Contabo mirror. A miss
 * on the preferred origin refills that range from the sibling (soft fail).
 * Cache keys stay on `url` (canonical primary); we never put under the mirror.
 */
async function downloadParallel(
  url: string,
  fileSize: number
): Promise<Response> {
  const plan = buildStripePlan(fileSize, url, stripeConfig);
  console.log(
    `[ServiceWorker] Parallel download${plan.enabled ? ' (dual-domain stripe)' : ''}: ` +
    `${url} — ${plan.chunks.length} × ${(plan.chunkSize / 1024 / 1024).toFixed(0)}MB, ` +
    `cache key ${plan.cacheKey}`
  );

  const queue = [...plan.chunks];
  const completedChunks: Array<{ index: number; data: Uint8Array }> = [];

  const fetchRange = async (
    chunk: StripeChunk,
    sourceUrl: string,
    start: number,
    end: number,
    signal?: AbortSignal,
  ): Promise<Uint8Array> => {
    const bytes = await fetchRangeBytes(sourceUrl, start, end, STRIPE_CHUNK_TIMEOUT_MS, signal);
    if (!isChunkLengthValid(bytes.byteLength, chunk)) {
      throw new Error(
        `chunk ${chunk.index} length ${bytes.byteLength} != ${expectedChunkBytes(chunk)} from ${sourceUrl}`
      );
    }
    return bytes;
  };

  const downloadOne = async (chunk: StripeChunk): Promise<Uint8Array> => {
    const { preferredUrl, fallbackUrl } = chunkSourceUrls(chunk, plan);

    if (plan.raceFirstByte && fallbackUrl) {
      try {
        const { value: response, url: winnerUrl } = await raceRangeResponses(
          preferredUrl,
          fallbackUrl,
          (sourceUrl, signal) =>
            fetchRangeResponse(sourceUrl, chunk.start, chunk.end, STRIPE_TTFB_TIMEOUT_MS, signal),
        );
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!isChunkLengthValid(bytes.byteLength, chunk)) {
          throw new Error(`raced chunk ${chunk.index} length mismatch from ${winnerUrl}`);
        }
        console.log(`[ServiceWorker] Stripe chunk ${chunk.index} raced via ${winnerUrl}`);
        return bytes;
      } catch (err) {
        console.warn(
          `[ServiceWorker] Stripe race failed for chunk ${chunk.index}, sequential refill:`,
          err,
        );
      }
    }

    const result = await fetchStripedChunk(chunk, plan, (sourceUrl, start, end, signal) =>
      fetchRange(chunk, sourceUrl, start, end, signal),
    );
    if (result.fromFallback) {
      console.warn(
        `[ServiceWorker] Stripe chunk ${chunk.index} missed ${preferredUrl}, refilled from ${result.url}`
      );
    }
    return result.data;
  };

  const downloadWorker = async (): Promise<void> => {
    while (true) {
      const chunk = queue.shift();
      if (!chunk) break;

      try {
        const data = await downloadOne(chunk);
        completedChunks.push({ index: chunk.index, data });
      } catch (error) {
        console.error(`[ServiceWorker] Chunk ${chunk.index} failed after stripe refill:`, error);
        throw error;
      }
    }
  };

  const workers = Array.from(
    { length: stripeWorkerCount(plan.chunks.length, plan.raceFirstByte) },
    () => downloadWorker()
  );
  await Promise.all(workers);

  completedChunks.sort((a, b) => a.index - b.index);

  const totalSize = completedChunks.reduce((sum, c) => sum + c.data.length, 0);
  const combined = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of completedChunks) {
    combined.set(chunk.data, offset);
    offset += chunk.data.length;
  }

  const responseBody = combined.buffer.slice(
    combined.byteOffset,
    combined.byteOffset + combined.byteLength
  ) as ArrayBuffer;

  // CRITICAL: Include CORS headers so cross-origin Cache.add() in Web Workers succeeds
  return new Response(responseBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(totalSize),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Origin, Accept, Content-Type',
      'Accept-Ranges': 'bytes',
    },
  });
}

/**
 * Fetch event listener - intercept model file downloads
 */
// @ts-ignore - FetchEvent is service worker specific
self.addEventListener('fetch', (event: FetchEvent & { request: Request; respondWith(r: Promise<Response> | Response): void }) => {
  const requestUrl = event.request.url;

  if (!isModelFile(requestUrl)) {
    return; // Let browser handle non-model requests
  }

  const fetchUrl = rewriteVpsModelUrl(requestUrl);
  if (fetchUrl !== requestUrl) {
    console.log('[ServiceWorker] Rewrote VPS URL:', requestUrl, '→', fetchUrl);
  } else {
    console.log('[ServiceWorker] Intercepting model download:', requestUrl);
  }

  const fetchInit: RequestInit = {
    method: event.request.method,
    mode: event.request.mode,
    credentials: event.request.credentials,
    cache: event.request.cache,
    redirect: event.request.redirect,
    referrer: event.request.referrer,
    referrerPolicy: event.request.referrerPolicy,
    integrity: event.request.integrity,
    headers: event.request.headers,
  };

  event.respondWith(
    (async () => {
      try {
        // Small JSON/config files — fetch directly (no parallel chunking or compression)
        const isSmallConfig =
          fetchUrl.includes('.json') ||
          (!fetchUrl.includes('.bin') && !fetchUrl.includes('.wasm') && !fetchUrl.includes('.gguf') && !fetchUrl.includes('.safetensors'));

        if (isSmallConfig) {
          return fetchWithRetry(fetchUrl, fetchInit, MAX_RETRIES);
        }

        // Same-origin .gz twin only (must live on storage.1ink.us for primary URLs).
        if (isGzEligible(fetchUrl)) {
          const gzResp = await tryFetchGzCompressed(fetchUrl);
          if (gzResp) return gzResp;
        }

        const meta = await probeFileMeta(fetchUrl);
        if (!meta) {
          console.warn('[ServiceWorker] HEAD request failed, using regular fetch:', fetchUrl);
          return fetchWithRetry(fetchUrl, fetchInit, MAX_RETRIES);
        }

        if (meta.supportsRanges && meta.fileSize > CHUNK_SIZE) {
          console.log('[ServiceWorker] Using parallel download for:', fetchUrl);
          return await downloadParallel(fetchUrl, meta.fileSize);
        }

        console.log('[ServiceWorker] File fits in single chunk, using regular fetch:', fetchUrl);
        return fetchWithRetry(fetchUrl, fetchInit, MAX_RETRIES);
      } catch (error) {
        console.error('[ServiceWorker] Download failed:', error);
        // Last-ditch: try mirror once more, then bare fetch
        const mirror = toVpsMirrorUrl(fetchUrl);
        if (mirror) {
          try {
            return await fetchWithRetry(mirror, fetchInit, MAX_RETRIES, false);
          } catch { /* fall through */ }
        }
        return fetch(fetchUrl, fetchInit);
      }
    })()
  );
});

/**
 * Handle messages from the client
 */
// @ts-ignore - ExtendableMessageEvent is service worker specific
self.addEventListener('message', (event: ExtendableMessageEvent & {
  data: { type?: string; enabled?: boolean; raceFirstByte?: boolean; invertOrigins?: boolean }
}) => {
  if (event.data?.type === 'SKIP_WAITING') {
    (self as any).skipWaiting();
  } else if (event.data?.type === 'CLEAR_CACHE') {
    gzMissCache.clear();
    console.log('[ServiceWorker] Memory cache cleared');
  } else if (event.data?.type === 'SET_STRIPE_CONFIG') {
    stripeConfig = {
      enabled: event.data.enabled !== false,
      raceFirstByte: !!event.data.raceFirstByte,
      invertOrigins: !!event.data.invertOrigins,
    };
    console.log('[ServiceWorker] Stripe config', stripeConfig);
  }
});
