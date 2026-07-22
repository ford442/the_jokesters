/// <reference lib="webworker" />
// Inject manifest from vite-plugin-pwa
import { precacheAndRoute } from 'workbox-precaching';
import {
  isVpsStorageUrl,
  rewriteVpsModelUrl,
  toVpsMirrorUrl,
  vpsGzUrl,
} from './utils/vpsStorageUrl';

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
 * Reliability: after primary retries exhaust, falls back once to the Contabo
 * mirror (storage.noahcohn.com ↔ storage.1ink.us).
 *
 * Speed: same-origin `.gz` twins only (no cross-host Contabo .gz pulls);
 * negative-caches missing `.gz` HEADs for 1 hour.
 */

// Service worker context (use any to avoid type conflicts with DOM types)
// @ts-ignore
declare const self: ServiceWorkerGlobalScope;

const PARALLEL_CONNECTIONS = 4;
const CHUNK_SIZE = 42 * 1024 * 1024; // 42MB
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
 * Chunk workers use fetchWithRetry (including mirror failover).
 */
async function downloadParallel(
  url: string,
  fileSize: number
): Promise<Response> {
  const chunkCount = Math.ceil(fileSize / CHUNK_SIZE);

  const ranges: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < chunkCount; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
    ranges.push({ start, end });
  }

  const queue = [...ranges];
  const completedChunks: Array<{ index: number; data: Uint8Array }> = [];

  const downloadWorker = async (): Promise<void> => {
    while (true) {
      const range = queue.shift();
      if (!range) break;

      const { start, end } = range;
      const idx = ranges.indexOf(range);

      try {
        const response = await fetchWithRetry(url, {
          headers: { 'Range': `bytes=${start}-${end}` },
        });
        const buffer = await response.arrayBuffer();
        completedChunks.push({ index: idx, data: new Uint8Array(buffer) });
      } catch (error) {
        console.error(`[ServiceWorker] Chunk ${idx} failed after retries:`, error);
        throw error;
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(PARALLEL_CONNECTIONS, chunkCount) },
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

        // Get file size via HEAD for parallel download decision.
        // If primary fails over to the mirror, Response.url is the mirror URL —
        // reuse it so subsequent GETs stay on the working host.
        let headResponse: Response | null = null;
        let fileSize = 0;
        let downloadUrl = fetchUrl;
        try {
          headResponse = await fetchWithRetry(fetchUrl, { method: 'HEAD' }, 1);
          fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10);
          if (headResponse.url) {
            downloadUrl = headResponse.url;
          }
        } catch {
          console.warn('[ServiceWorker] HEAD request failed, using regular fetch:', fetchUrl);
          return fetchWithRetry(fetchUrl, fetchInit, MAX_RETRIES);
        }

        if (fileSize === 0 || !headResponse.ok) {
          return fetchWithRetry(downloadUrl, fetchInit, MAX_RETRIES);
        }

        const supportsRanges =
          headResponse.headers.has('accept-ranges') &&
          headResponse.headers.get('accept-ranges') !== 'none';

        if (supportsRanges && fileSize > CHUNK_SIZE) {
          console.log('[ServiceWorker] Using parallel download for:', downloadUrl);
          return await downloadParallel(downloadUrl, fileSize);
        }

        console.log('[ServiceWorker] File fits in single chunk, using regular fetch:', downloadUrl);
        return fetchWithRetry(downloadUrl, fetchInit, MAX_RETRIES);
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
self.addEventListener('message', (event: ExtendableMessageEvent & { data: { type?: string } }) => {
  if (event.data?.type === 'SKIP_WAITING') {
    (self as any).skipWaiting();
  } else if (event.data?.type === 'CLEAR_CACHE') {
    gzMissCache.clear();
    console.log('[ServiceWorker] Memory cache cleared');
  }
});
