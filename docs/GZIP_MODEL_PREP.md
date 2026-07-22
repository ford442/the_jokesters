# Preparing gzip-compressed model shards for storage.1ink.us

The service worker transparently fetches `<shard>.bin.gz` (or `.wasm.gz`) instead
of the plain file when the compressed twin exists **on the same host** as the
request. This cuts download size by roughly 20–35% with zero code changes on the
client — the SW handles decompression with the browser's native
`DecompressionStream('gzip')`.

**Important:** gzip only pays off on `storage.1ink.us`. Contabo-only `.gz` twins
are a footgun — the SW will not cross-host to Contabo for compression (that host
is slower). After compressing on Contabo origin, sync `.gz` files with
`sync_models_to_1ink.sh`. Missing `.gz` HEADs are negative-cached for ~1 hour.

**Why gzip and not brotli:** browsers only expose `DecompressionStream` for
`gzip`, `deflate`, and `deflate-raw`. Brotli is server-side (`Content-Encoding: br`)
and Dreamhost shared hosting doesn't support it. gzip -9 is the practical maximum.

---

## What to compress

Only files served from **`storage.1ink.us`** are eligible — the service worker
probes `<url>.gz` on the **same origin** as the request. Contabo-only `.gz`
twins on `storage.noahcohn.com` are ignored (cross-host gzip would pull from the
slower origin). Compress every file with extension `.bin`, `.wasm`, or `.gguf`,
then sync those `.gz` files to DreamHost via `sync_models_to_1ink.sh`.

Priority order (biggest wins first):

| Directory | Files | Approx size | Est. saving |
|-----------|-------|-------------|-------------|
| `models/vicuna-7b-q4f32-webllm/` | `params_shard_*.bin` | ~3.5 GB total | ~700 MB |
| `models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/` | `params_shard_*.bin` | ~2.5 GB total | ~500 MB |
| `models/Llama-3.2-3B-Instruct-q4f32_1-MLC/` | `params_shard_*.bin` | ~2.5 GB total | ~500 MB |
| `models/wasm-libs/` | `*.wasm` | ~15 MB total | ~3 MB |
| `models/gguf/` | `*.gguf` | varies | ~20% |

Do **not** delete the originals — browsers that already have the plain files cached
in IndexedDB will skip the download entirely. The originals are also needed if the
`.gz` fetch fails (the SW falls back automatically).

---

## Step-by-step

### Option A — compress directly on the VPS (fastest, no upload needed)

SSH into the VPS and run in each model directory:

```bash
# Vicuna 7B (largest priority)
cd /path/to/storage.1ink.us/models/vicuna-7b-q4f32-webllm/
for f in *.bin; do
  echo "Compressing $f..."
  gzip -9 -k "$f"     # -k keeps the original
done

# Hermes-3 3B
cd /path/to/storage.1ink.us/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/
for f in *.bin; do gzip -9 -k "$f"; done

# Llama 3.2 3B
cd /path/to/storage.1ink.us/models/Llama-3.2-3B-Instruct-q4f32_1-MLC/
for f in *.bin; do gzip -9 -k "$f"; done

# WASM libs (small, quick)
cd /path/to/storage.1ink.us/models/wasm-libs/
for f in *.wasm; do gzip -9 -k "$f"; done

# GGUF files (if hosted)
cd /path/to/storage.1ink.us/models/gguf/
for f in *.gguf; do gzip -9 -k "$f"; done
```

On a modern server CPU, gzip -9 runs at ~50–100 MB/s. The Vicuna 7B shards
(~3.5 GB total) will take roughly 1–2 minutes.

### Option B — compress locally and upload via rsync

If the VPS is low on CPU or disk space during compression, compress on your
dev machine and push the `.gz` files only:

```bash
# On your dev machine — in the directory containing the model files
for f in *.bin; do gzip -9 -k "$f"; done

# rsync only the .gz files (leave originals on server untouched)
rsync -av --progress --include='*.gz' --exclude='*' \
  ./ user@your-vps:/path/to/storage.1ink.us/models/vicuna-7b-q4f32-webllm/
```

---

## Verifying the setup

After uploading, confirm the SW will find the files:

```bash
# Should return HTTP 200 and a Content-Length
curl -I https://storage.1ink.us/models/vicuna-7b-q4f32-webllm/params_shard_0.bin.gz

# Content-Encoding must NOT be 'gzip' — the file IS the gzip stream, not
# a gzip-encoded response. If Apache/nginx auto-encodes it, you'll get
# double-compression. Check with:
curl -sv https://storage.1ink.us/models/vicuna-7b-q4f32-webllm/params_shard_0.bin.gz \
  2>&1 | grep -i "content-encoding"
# Expected output: (nothing — no Content-Encoding header)
```

### Preventing Apache/nginx from double-encoding

If the server sees `.gz` and adds `Content-Encoding: gzip` automatically, the SW
will receive a double-gzipped stream and decompression will fail. Disable
auto-encoding for `.gz` files:

**Apache `.htaccess`** (in the model directories):
```apache
<FilesMatch "\.gz$">
  RemoveEncoding .gz
  AddType application/octet-stream .gz
</FilesMatch>
```

**nginx** (server block):
```nginx
location ~* \.gz$ {
    add_header Content-Encoding "";
    types { application/octet-stream gz; }
}
```

---

## Space budget

You need roughly **equal extra space** for the `.gz` files (the originals stay):

| Model | Original | After gzip -9 | Extra space |
|-------|----------|---------------|-------------|
| Vicuna 7B | ~3.5 GB | ~2.4 GB | ~2.4 GB |
| Hermes-3 3B | ~2.5 GB | ~1.8 GB | ~1.8 GB |
| Llama 3.2 3B | ~2.5 GB | ~1.8 GB | ~1.8 GB |
| WASM libs | ~15 MB | ~10 MB | ~10 MB |
| **Total extra** | | | **~6 GB** |

If disk is tight, start with just Vicuna 7B shards (highest user impact) and
add the 3B models later. The SW falls back gracefully for any model without `.gz`
files — there is no partial-failure risk.

---

## How the SW finds the files

`src/service-worker.ts` — `tryFetchGzCompressed(url)`:

1. `HEAD <url>.gz` — if 404, exits immediately (fast; no download attempted).
2. If found: downloads the `.gz` (parallel Range requests if server supports it).
3. Decompresses with `new DecompressionStream('gzip')`.
4. Returns the decompressed bytes as a synthetic `Response` to WebLLM's cache layer.

Only URLs containing `storage.1ink.us` and ending in `.bin`, `.wasm`, `.gguf`,
or `.safetensors` are eligible. HuggingFace CDN URLs are never probed.
