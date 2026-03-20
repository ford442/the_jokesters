/**
 * Parallel Download Manager
 *
 * Downloads large model files from HuggingFace using multiple parallel connections
 * with HTTP Range requests for faster downloads.
 *
 * Features:
 * - 4 concurrent parallel connections
 * - 42MB chunks per connection
 * - Byte-range (HTTP 206) support with fallback
 * - No persistent caching (browser HTTP cache + service worker memory only)
 */

const PARALLEL_CONNECTIONS = 4;
const CHUNK_SIZE = 42 * 1024 * 1024; // 42MB

interface DownloadProgress {
  fileName: string;
  downloaded: number;
  total: number;
  percentage: number;
}

export class ParallelDownloadManager {
  private supportsRange: boolean | null = null;

  /**
   * Initialize manager (no IndexedDB setup needed)
   */
  async initialize(): Promise<void> {
    console.log('[ParallelDownloadManager] Initialized (memory + browser cache only)');
    return Promise.resolve();
  }

  /**
   * Check if server supports HTTP Range requests
   */
  private async supportsRangeRequests(url: string): Promise<boolean> {
    if (this.supportsRange !== null) return this.supportsRange;

    try {
      const response = await fetch(url, { method: 'HEAD' });
      this.supportsRange = response.headers.has('accept-ranges') &&
                          response.headers.get('accept-ranges') !== 'none';
      return this.supportsRange;
    } catch {
      this.supportsRange = false;
      return false;
    }
  }

  /**
   * Get file size from server
   */
  private async getFileSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Download a single chunk with a byte range
   */
  private async downloadChunk(
    url: string,
    start: number,
    end: number
  ): Promise<Uint8Array> {
    try {
      const response = await fetch(url, {
        headers: {
          'Range': `bytes=${start}-${end}`,
        },
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      console.warn(`[ParallelDownload] Chunk fetch failed (${start}-${end}):`, error);
      throw error;
    }
  }

  /**
   * Download file with parallel connections
   */
  async downloadFile(
    url: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<Uint8Array> {
    const fileName = url.split('/').pop() || 'model';

    const fileSize = await this.getFileSize(url);
    if (fileSize === 0) {
      throw new Error(`Could not determine file size for ${url}`);
    }

    const supportsRange = await this.supportsRangeRequests(url);

    let data: Uint8Array;
    if (supportsRange && fileSize > CHUNK_SIZE) {
      console.log(`[ParallelDownload] Starting parallel download: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
      data = await this.downloadParallel(url, fileSize, onProgress, fileName);
    } else {
      console.log(`[ParallelDownload] Range not supported or file too small, using single connection: ${fileName}`);
      data = await this.downloadSingleConnection(url, onProgress, fileName, fileSize);
    }

    return data;
  }

  /**
   * Download file using parallel connections
   */
  private async downloadParallel(
    url: string,
    fileSize: number,
    onProgress?: (progress: DownloadProgress) => void,
    fileName?: string
  ): Promise<Uint8Array> {
    const chunkCount = Math.ceil(fileSize / CHUNK_SIZE);
    const chunks: (Uint8Array | null)[] = new Array(chunkCount).fill(null);
    let downloadedBytes = 0;

    // Create queue of chunk indices
    const queue = Array.from({ length: chunkCount }, (_, i) => i);

    const downloadWorker = async (): Promise<void> => {
      while (queue.length > 0) {
        const chunkIndex = queue.shift();
        if (chunkIndex === undefined) break;

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
        const chunkSize = end - start + 1;

        try {
          const chunkData = await this.downloadChunk(url, start, end);
          chunks[chunkIndex] = chunkData;
          downloadedBytes += chunkSize;

          onProgress?.({
            fileName: fileName || url,
            downloaded: downloadedBytes,
            total: fileSize,
            percentage: Math.round((downloadedBytes / fileSize) * 100),
          });
        } catch (error) {
          console.error(`[ParallelDownload] Failed to download chunk ${chunkIndex}:`, error);
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

    return combined;
  }

  /**
   * Fallback: download file with single connection
   */
  private async downloadSingleConnection(
    url: string,
    onProgress?: (progress: DownloadProgress) => void,
    fileName?: string,
    fileSize?: number
  ): Promise<Uint8Array> {
    let downloaded = 0;

    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const chunks: Uint8Array[] = [];

          const read = async (): Promise<void> => {
            const { done, value } = await reader.read();
            if (done) {
              const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
              const combined = new Uint8Array(totalSize);
              let offset = 0;
              for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
              }
              resolve(combined);
              return;
            }

            chunks.push(value);
            downloaded += value.length;

            if (fileSize) {
              onProgress?.({
                fileName: fileName || url,
                downloaded,
                total: fileSize,
                percentage: Math.round((downloaded / fileSize) * 100),
              });
            }

            await read();
          };

          read().catch(reject);
        })
        .catch(reject);
    });
  }
}

export const parallelDownloadManager = new ParallelDownloadManager();
