/**
 * Service Worker for Parallel Model Downloads
 *
 * Intercepts fetch requests for model files from HuggingFace CDN and handles them
 * using parallel connections with byte-range requests for faster downloads.
 *
 * Installation: Register in main.ts with:
 *   if ('serviceWorker' in navigator) {
 *     navigator.serviceWorker.register('./service-worker.ts')
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
  'storage.noahcohn.com',
];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

interface MemoryCacheEntry {
  timestamp: number;
  data: Uint8Array;
}

// Memory-only cache (temporary, cleared on service worker restart)
const memoryCacheStore = new Map<string, MemoryCacheEntry>();
const MEMORY_CACHE_TTL = 3600000; // 1 hour

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

/**
 * Check if URL is for a model file
 */
function isModelFile(url: string): boolean {
  // Skip small files and non-model requests
  const isModelHost = MODEL_HOSTS.some(host => url.includes(host));
  if (!isModelHost) return false;

  // Only parallelize large files (>10MB)
  return url.includes('.safetensors') || url.includes('.bin') || url.includes('.gguf') || url.includes('.wasm');
}

/**
 * Download with parallel connections
 */
async function downloadParallel(
  url: string,
  fileSize: number
): Promise<Response> {
  const chunkCount = Math.ceil(fileSize / CHUNK_SIZE);
  const chunks: (Uint8Array | null)[] = new Array(chunkCount).fill(null);

  // Create queue of chunk indices
  const queue = Array.from({ length: chunkCount }, (_, i) => i);

  const downloadWorker = async (): Promise<void> => {
    while (queue.length > 0) {
      const chunkIndex = queue.shift();
      if (chunkIndex === undefined) break;

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

      try {
        const response = await fetchWithRetry(url, {
          headers: {
            'Range': `bytes=${start}-${end}`,
          },
        });

        const buffer = await response.arrayBuffer();
        chunks[chunkIndex] = new Uint8Array(buffer);
      } catch (error) {
        console.error(`[ServiceWorker] Chunk ${chunkIndex} failed after retries:`, error);
        throw error;
      }
    }
  };

  // Start 4 parallel workers
  const workers = Array.from({ length: Math.min(PARALLEL_CONNECTIONS, chunkCount) }, () =>
    downloadWorker()
  );

  await Promise.all(workers);

  // Combine chunks
  const totalSize = chunks.reduce((sum, chunk) => sum + (chunk?.length || 0), 0);
  const combined = new Uint8Array(totalSize);
  let offset = 0;

  for (const chunk of chunks) {
    if (chunk) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
  }

  // Return as Response with Uint8Array body
  const responseBody = combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength) as ArrayBuffer;
  return new Response(responseBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(totalSize),
    },
  });
}

/**
 * Fetch event listener - intercept model file downloads
 */
// @ts-ignore - FetchEvent is service worker specific
self.addEventListener('fetch', (event: FetchEvent & { request: Request; respondWith(r: Promise<Response> | Response): void }) => {
  const url = event.request.url;

  if (!isModelFile(url)) {
    return; // Let browser handle non-model requests
  }

  console.log('[ServiceWorker] Intercepting model download:', url);

  event.respondWith(
    (async () => {
      try {
        // Check memory cache (temporary, cleared on worker restart)
        const cached = memoryCacheStore.get(url);
        if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_TTL) {
          console.log('[ServiceWorker] Serving from memory cache:', url);
          const cachedBody = cached.data.buffer.slice(cached.data.byteOffset, cached.data.byteOffset + cached.data.byteLength) as ArrayBuffer;
          return new Response(cachedBody, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': String(cached.data.length),
            },
          });
        }

        // Get file size
        let headResponse: Response | null = null;
        let fileSize = 0;
        try {
          headResponse = await fetchWithRetry(url, { method: 'HEAD' }, 1);
          fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10);
        } catch (headError) {
          console.warn('[ServiceWorker] HEAD request failed, falling back to regular fetch:', url);
          return fetchWithRetry(event.request.url, undefined, MAX_RETRIES);
        }

        if (fileSize === 0 || !headResponse.ok) {
          // Fallback to regular fetch
          return fetchWithRetry(event.request.url, undefined, MAX_RETRIES);
        }

        // Check if server supports ranges
        const supportsRanges = headResponse.headers.has('accept-ranges') &&
                              headResponse.headers.get('accept-ranges') !== 'none';

        let response: Response;
        if (supportsRanges && fileSize > CHUNK_SIZE) {
          console.log('[ServiceWorker] Using parallel download for:', url);
          response = await downloadParallel(url, fileSize);

          // Cache in memory (temporary, not persistent)
          const data = await response.clone().arrayBuffer();
          memoryCacheStore.set(url, {
            timestamp: Date.now(),
            data: new Uint8Array(data),
          });

          // Return a fresh response from cached data
          return new Response(data, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': String(data.byteLength),
            },
          });
        } else {
          // Fallback to regular fetch
          console.log('[ServiceWorker] Server does not support ranges, using regular fetch:', url);
          return fetchWithRetry(event.request.url, undefined, MAX_RETRIES);
        }
      } catch (error) {
        console.error('[ServiceWorker] Download failed:', error);
        // Fallback to regular fetch on error
        return fetchWithRetry(event.request.url, undefined, MAX_RETRIES);
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
    memoryCacheStore.clear();
    console.log('[ServiceWorker] Memory cache cleared');
  }
});
