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
];

interface MemoryCacheEntry {
  timestamp: number;
  data: Uint8Array;
}

// Memory-only cache (temporary, cleared on service worker restart)
const memoryCacheStore = new Map<string, MemoryCacheEntry>();
const MEMORY_CACHE_TTL = 3600000; // 1 hour

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
        const response = await fetch(url, {
          headers: {
            'Range': `bytes=${start}-${end}`,
          },
        });

        if (response.status === 206 || response.ok) {
          const buffer = await response.arrayBuffer();
          chunks[chunkIndex] = new Uint8Array(buffer);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`[ServiceWorker] Chunk ${chunkIndex} failed:`, error);
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
      'Content-Length': String(fileSize),
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
        const headResponse = await fetch(url, { method: 'HEAD' });
        const fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10);

        if (fileSize === 0) {
          // Fallback to regular fetch
          return fetch(event.request);
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
          return fetch(event.request);
        }
      } catch (error) {
        console.error('[ServiceWorker] Download failed:', error);
        // Fallback to regular fetch on error
        return fetch(event.request);
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
