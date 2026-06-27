/// <reference lib="webworker" />
// Inject manifest from vite-plugin-pwa
import { precacheAndRoute } from 'workbox-precaching';
import { rewriteVpsModelUrl } from './utils/vpsStorageUrl';

// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST || []);

/**
 * Service Worker for Parallel Model Downloads
 *
 * Intercepts fetch requests for model files and uses parallel byte-range
 * requests for large files (> CHUNK_SIZE). For smaller files it acts as a
 * thin pass-through to avoid unnecessary memory buffering.
 *
 * Installation: Register in main.ts with:
 *   if ('serviceWorker' in navigator) {
 *     navigator.serviceWorker.register('./service-worker.js')
 *   }
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
];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

/**
 * Fetch with exponential backoff retry
 */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = MAX_RETRIES
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
  throw lastError || new Error(`fetch failed after ${maxRetries} retries`);
}

/** VPS hosts serve flat files; WebLLM's cleanModelUrl() injects /resolve/main/ (HF-style). */
function rewriteVpsModelUrlForSw(url: string): string {
  return rewriteVpsModelUrl(url);
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
  if (url.includes('storage.1ink.us/models/') && url.includes('/resolve/main/')) {
    return true;
  }
  return false;
}

/**
 * Extensions whose weight shards may have pre-compressed .gz twins on the VPS.
 * Only applies to our own storage origin.
 */
const GZ_ELIGIBLE_EXTENSIONS = ['.bin', '.wasm', '.gguf', '.safetensors'];

function isGzEligible(url: string): boolean {
  return (
    url.includes('storage.1ink.us') &&
    GZ_ELIGIBLE_EXTENSIONS.some(ext => url.includes(ext))
  );
}

/**
 * Try to fetch a pre-compressed .gz twin of a model shard.
 *
 * Flow:
 *  1. HEAD <url>.gz — if 404 or error, return null immediately (fast path).
 *  2. If found: download compressed bytes (parallel if range-capable).
 *  3. Decompress via DecompressionStream('gzip') (Chrome 80+, Edge 80+).
 *  4. Return a synthesised Response with the decompressed bytes.
 *
 * The .gz files must be pre-created on the VPS with `gzip -9 <shard>`.
 */
async function tryFetchGzCompressed(url: string): Promise<Response | null> {
  const gzUrl = url + '.gz';
  try {
    const headResp = await fetch(gzUrl, { method: 'HEAD' });
    if (!headResp.ok) return null;

    const compressedSize = parseInt(headResp.headers.get('content-length') || '0', 10);
    if (compressedSize === 0) return null;

    const supportsRanges =
      headResp.headers.has('accept-ranges') &&
      headResp.headers.get('accept-ranges') !== 'none';

    console.log(`[ServiceWorker] Found .gz shard: ${gzUrl} (${(compressedSize / 1024 / 1024).toFixed(1)} MB compressed)`);

    // Download compressed bytes — parallel if the server supports Range requests
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

    // Decompress using the native browser DecompressionStream (gzip)
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    // Write all compressed bytes then close; collect decompressed chunks
    (async () => {
      try {
        await writer.write(compressedBytes);
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
    // .gz not found or decompression failed — caller will try the plain URL
    console.log(`[ServiceWorker] No usable .gz for ${url}:`, (error as Error).message ?? error);
    return null;
  }
}

/**
 * Download a large file with parallel connections.
 * Streams chunks directly into a combined response to avoid keeping the
 * entire file in service-worker RAM.
 */
async function downloadParallel(
  url: string,
  fileSize: number
): Promise<Response> {
  const chunkCount = Math.ceil(fileSize / CHUNK_SIZE);

  // Pre-compute range headers so workers can pull from a queue
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

  // Start parallel workers
  const workers = Array.from(
    { length: Math.min(PARALLEL_CONNECTIONS, chunkCount) },
    () => downloadWorker()
  );
  await Promise.all(workers);

  // Sort chunks back into order
  completedChunks.sort((a, b) => a.index - b.index);

  // Combine into single buffer
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

  const fetchUrl = rewriteVpsModelUrlForSw(requestUrl);
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

        // For binary shards on our VPS, try a pre-compressed .gz twin first.
        // This transparently reduces download size when .gz files exist server-side.
        // Pre-compress with: gzip -9 <shard>.bin  (no .br because browser DecompressionStream
        // only supports gzip/deflate — brotli is server-side only in current browsers).
        if (isGzEligible(fetchUrl)) {
          const gzResp = await tryFetchGzCompressed(fetchUrl);
          if (gzResp) return gzResp;
        }

        // Get file size via HEAD for parallel download decision
        let headResponse: Response | null = null;
        let fileSize = 0;
        try {
          headResponse = await fetchWithRetry(fetchUrl, { method: 'HEAD' }, 1);
          fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10);
        } catch (headError) {
          console.warn('[ServiceWorker] HEAD request failed, using regular fetch:', fetchUrl);
          return fetchWithRetry(fetchUrl, fetchInit, MAX_RETRIES);
        }

        if (fileSize === 0 || !headResponse.ok) {
          return fetchWithRetry(fetchUrl, fetchInit, MAX_RETRIES);
        }

        const supportsRanges =
          headResponse.headers.has('accept-ranges') &&
          headResponse.headers.get('accept-ranges') !== 'none';

        if (supportsRanges && fileSize > CHUNK_SIZE) {
          console.log('[ServiceWorker] Using parallel download for:', fetchUrl);
          return await downloadParallel(fetchUrl, fileSize);
        }

        console.log('[ServiceWorker] File fits in single chunk, using regular fetch:', fetchUrl);
        return fetchWithRetry(fetchUrl, fetchInit, MAX_RETRIES);
      } catch (error) {
        console.error('[ServiceWorker] Download failed:', error);
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
    console.log('[ServiceWorker] Memory cache cleared');
  }
});
