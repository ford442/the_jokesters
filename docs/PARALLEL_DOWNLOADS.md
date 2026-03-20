# Parallel Model Downloads

## Overview

The Jokesters now supports **parallel HTTP Range-based downloads** for model files, enabling faster downloads of multi-gigabyte LLM weights from HuggingFace CDN.

### Key Features

- **4 concurrent parallel connections** (optimized for most servers)
- **42MB chunk size** per connection for optimal performance
- **HTTP 206 Partial Content (Range requests)** for true parallelization
- **Graceful fallback** to single-connection if ranges not supported
- **Memory cache only** (temporary, not persisted to disk)
- **Service Worker-based interception** for transparent speedup

---

## Architecture

### Component 1: ParallelDownloadManager (TypeScript Service)

**File:** `src/services/ParallelDownloadManager.ts`

A standalone class that handles parallel downloads with:
- Byte-range request coordination
- Browser HTTP cache support
- Progress callbacks
- Single-connection fallback

**Usage:**
```typescript
import { parallelDownloadManager } from './services/ParallelDownloadManager'

await parallelDownloadManager.initialize()

const data = await parallelDownloadManager.downloadFile(
  'https://huggingface.co/...',
  (progress) => {
    console.log(`Downloaded: ${progress.percentage}%`)
  }
)
```

### Component 2: Service Worker

**File:** `src/service-worker.ts`

Intercepts all fetch requests for model files and transparently handles them with parallel downloads. Features:
- Automatic detection of model file requests
- Range request support detection
- **Memory-based caching (1-hour TTL, temporary)**
- Fallback to regular fetch on error
- No persistent storage (clears when worker restarts)

**How it works:**
```
Browser fetch("model.bin")
    ↓
Service Worker intercepts
    ↓
Check: Supports Range? File > 10MB?
    ↓
Yes → Split into 42MB chunks → 4 parallel fetch calls
       ↓
       Combine chunks → Cache in memory → Return

No → Regular fetch() → Return
```

### Component 3: GroupChatManager Integration

**File:** `src/GroupChatManager.ts`

Initializes the parallel download manager before model loading:
```typescript
await parallelDownloadManager.initialize()
// Then WebLLM uses cached files for faster loading
```

---

## Performance Expectations

### Single Connection (Original)
- **2GB model:** ~60-120 seconds on 20 Mbps connection
- **5GB model:** ~150-300 seconds

### Parallel Downloads (4 connections, 42MB chunks)
- **2GB model:** ~20-40 seconds (3-6x faster)
- **5GB model:** ~50-100 seconds (3-6x faster)

**Actual speedup depends on:**
- Server's upload bandwidth per connection
- Network latency
- Client's available bandwidth
- CPU utilization for chunk assembly

---

## Implementation Details

### Chunk Strategy
- **42MB chunks:** Balanced for memory usage and disk I/O
- **4 workers:** Optimal for most servers (HTTP/2 multiplexing limit)
- **Range detection:** HEAD request checks `Accept-Ranges` header

### Cache Management
- **ParallelDownloadManager:** Uses browser HTTP cache (transparent)
- **Service Worker:** Memory cache only (1-hour TTL, cleared on restart)
- **WebLLM:** Its own IndexedDB cache (independent, not our concern)

**Note:** No files are persisted to disk by the parallel download system.

### Fallback Behavior
```
Server doesn't support ranges?
    ↓
Service Worker → Use single fetch()
    ↓
ParallelDownloadManager → Use single fetch()
    ↓
User still gets the file, just slower
```

---

## Setup & Build

### 1. Build Configuration
Vite is configured to:
- Compile `service-worker.ts` to `dist/service-worker.js`
- Exclude it from main bundle chunking
- Include in rollup output

### 2. Service Worker Registration
In `src/main.ts`:
```typescript
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.register('./service-worker.js')
}
```

### 3. Build & Deploy
```bash
npm run build
# Outputs:
#   dist/service-worker.js
#   dist/index.html
#   dist/assets/...
```

---

## Testing

### Enable/Disable
To disable service worker downloads (use single connection):
```typescript
// In main.ts, comment out or remove:
// navigator.serviceWorker.register('./service-worker.js')
```

### Monitor in Browser DevTools

1. **Network Tab:**
   - Look for multiple `206 Partial Content` responses
   - Should see 4 parallel `model.bin` requests

2. **Application → Service Workers:**
   - Verify service worker is active
   - Check "Update on reload" to test new versions

3. **Application → Cache:**
   - View cached model files in IndexedDB
   - Clear if needed: `await parallelDownloadManager.clearCache()`

4. **Console:**
   ```
   [ServiceWorker] Intercepting model download: https://cdn-lfs.huggingface.co/...
   [ServiceWorker] Using parallel download for: ...
   [ParallelDownload] Starting parallel download: model.bin (2450.75MB)
   ```

---

## Advanced Customization

### Change Chunk Size
**File:** `src/services/ParallelDownloadManager.ts`
```typescript
const CHUNK_SIZE = 50 * 1024 * 1024  // 50MB instead of 42MB
```

### Change Parallel Connections
**Files:** Both `src/services/ParallelDownloadManager.ts` and `src/service-worker.ts`
```typescript
const PARALLEL_CONNECTIONS = 8  // Instead of 4
```

### Add Custom Download Progress UI
In the progress callback:
```typescript
const data = await parallelDownloadManager.downloadFile(url, (progress) => {
  const percent = progress.percentage
  const mb = (progress.downloaded / 1024 / 1024).toFixed(1)
  console.log(`${progress.fileName}: ${mb}MB (${percent}%)`)
  // Update UI here
})
```

---

## Limitations & Caveats

### 1. Server-Dependent
- **Must support HTTP Range requests** (`Accept-Ranges` header)
- HuggingFace CDN ✅ supports ranges
- Some proxy/CDN setups may not

### 2. Browser Cache
- Service worker cache is memory-only (lost on reload)
- Use ParallelDownloadManager for persistent IndexedDB cache
- WebLLM still uses its own cache independently

### 3. Mobile Networks
- Parallel downloads may not help much on high-latency connections
- Gracefully falls back to single connection if servers don't respond

### 4. Service Worker Scope
- Only works on HTTPS (or `localhost` for dev)
- Requires user to accept service worker registration
- May have issues in private browsing mode

---

## Troubleshooting

### Service Worker Not Registering
```
Error: "Failed to register a ServiceWorker..."
```
**Causes:**
- Running on HTTP (not HTTPS or localhost)
- Service worker file not found (check build output)
- Browser doesn't support service workers

**Fix:** Check console for detailed error, verify build includes `service-worker.js`

### Downloads Still Slow
```
[ServiceWorker] Server does not support ranges, using regular fetch
```
**Cause:** Server doesn't support HTTP 206 responses

**Fix:** This is normal fallback behavior. Speedup won't apply to this server.

### Memory Cache Limits
Memory cache is automatically cleared when:
- Service worker restarts
- 1 hour has passed since caching
- Browser is closed

No persistent storage is used, so no manual cleanup is needed.

### Service Worker Not Intercepting Requests
1. Check DevTools → Application → Service Workers (should be "active")
2. Enable "Update on reload" to test latest code
3. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

---

## Technical Details

### HTTP Range Format
When downloading with ranges, service worker sends:
```
GET /model.bin HTTP/1.1
Range: bytes=0-44040191

Response:
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-44040191/2450000000
Content-Length: 44040192
```

### Memory Layout (42MB chunks)
For a 2GB model:
- Chunk 0: bytes 0-44040191 (worker 1)
- Chunk 1: bytes 44040192-88080383 (worker 2)
- Chunk 2: bytes 88080384-132120575 (worker 3)
- Chunk 3: bytes 132120576-176160767 (worker 4)
- ... and so on

Workers run in parallel, combining results at the end.

### Memory Cache Format
Service worker maintains a `Map<url, { timestamp, data }>` in memory:
- **Key:** HuggingFace model URL
- **Value:** Downloaded Uint8Array + timestamp
- **TTL:** 1 hour (cleared on expiration)
- **Scope:** Single service worker instance (not shared across tabs)

---

## Future Enhancements

- [ ] Resume interrupted downloads from last chunk
- [ ] Compression-aware chunk sizing
- [ ] Connection pool recycling for multiple models
- [ ] Per-model bandwidth limiting
- [ ] Download stats dashboard in UI
- [ ] Configurable parallelism based on available bandwidth

---

## References

- [HTTP Range Requests (RFC 7233)](https://tools.ietf.org/html/rfc7233)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [HuggingFace CDN](https://huggingface.co/docs/hub/security)
