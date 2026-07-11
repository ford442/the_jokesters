# Model Loading — The Jokesters

Last reviewed: 2026-05-02

Scope: how models (especially Vicuna 7B) are fetched, cached, and handed to engines; what changes are worth making and which trade-offs are deliberate.

---

## 1. Current state — three ways to get Vicuna into the browser

The model picker in `src/main.ts` exposes two visible Vicuna paths today, and a third is implicit via the GGUF route. Here's what each actually does and what it costs.

### 1A. vicuna-7b-q4f32-webllm-vps — MLC, self-hosted

- **Engine**: `MlcEngineAdapter` → WebLLM → WebGPU
- **Quantization**: q4f32 (4-bit weights, fp32 activations)
- **Source**: VPS at `storage.noahcohn.com`
- **WASM lib**: MLC's prebuilt Llama-2-7B/Vicuna lib (`Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`)
- **VRAM**: ~4 GB
- **Runs on**: any WebGPU GPU; no `shader-f16` requirement (this is the whole point of q4f32)

### 1B. Llama-2-7b-chat-hf-q4f32_1-MLC — MLC, HF CDN

- Same engine, same quantization, same VRAM as 1A
- Source: HuggingFace CDN, lib from MLC's GitHub
- The "official" Vicuna-equivalent path — Vicuna is a Llama-2 fine-tune and shares Llama-2's prompt format

### 1C. vicuna-7b-v1.5-GGUF — wllama, WASM/CPU

- **Engine**: `LlamaCppEngineAdapter` → wllama → WASM (no WebGPU)
- **Quantization**: whatever GGUF file you point at — typically Q4_K_M (~4 GB)
- **Source**: HuggingFace via `loadModelFromHF`, or VPS via `loadModelFromUrl`
- **RAM**: ~4 GB system RAM (CPU-side)
- **Inference speed**: 5–10× slower than 1A/1B — this is the dealbreaker for an interactive multi-agent improv app

### Which is "most ideal"? — 1A (MLC, q4f32, self-hosted)

For this app specifically, 1A wins on every axis that matters:

| Criterion | 1A (MLC self-host) | 1B (MLC HF) | 1C (GGUF/wllama) |
|---|---|---|---|
| Inference speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Hardware compat | Any WebGPU | Any WebGPU | Any WASM |
| Download speed | Yours to control | HF CDN (good globally) | HF CDN |
| Reliability under traffic | Yours | HF rare outages | HF rare outages |
| Quality at q4f32 | 97–99% of fp16 | same | depends on .gguf |
| First-load size | ~4 GB | ~4 GB | ~4 GB |

The honest case for 1B over 1A: HF's CDN is geo-distributed and you're paying nothing for it. If your test users are global, 1B is faster for first-load on far-from-VPS users.

The honest case for 1A over 1B: you control the cache headers, MIME types, CORS, and uptime. No "model unavailable" errors when HF has a hiccup.

**Verdict**: keep 1A as the default Vicuna path. Keep 1B as a fallback. Drop 1C from the picker — wllama's only real role is "what if WebGPU is missing entirely," and at that point a 7B model is the wrong size anyway.

---

## 2. The bigger question — should Vicuna 7B even be in the picker?

Vicuna 7B is a 2023-era Llama-2 fine-tune. The 3B models in your picker (Hermes-3, Llama-3.2) are smaller, faster to load, faster to run, and on most benchmarks outperform Vicuna 7B.

The only genuine reason to keep Vicuna is "I want a 7B model for users with beefy GPUs who'd rather have richer responses." If that's the goal, Llama-3.1-8B is a strict upgrade — better instruction-following, modern training, MLC has it prebuilt with both q4f16 and q4f32 variants.

### Suggested picker reorganization

- **Recommended** (top of list): `Hermes-3-Llama-3.2-3B-q4f16` (current default)
- **Best quality (f16 GPUs)**: `Hermes-3-Llama-3.1-8B-q4f16`
- **Best quality (no f16)**: `Llama-2-7b-chat` or `Vicuna 7B q4f32` — pick one, drop the other
- **Compatibility / smaller**: the q4f32 3B variants
- **Drop**: the GGUF Vicuna option (slow, redundant)

If you keep Vicuna for nostalgia or for Llama-2 prompt-format testing, that's a fine reason — just be honest about it in the dropdown label (`"Vicuna 7B · for Llama-2 prompt-format testing · slower than Hermes-3"`).

---

## 3. Loading-speed optimizations (orthogonal to model choice)

These are wins available regardless of which model is selected. Some are already in the codebase; some aren't.

### Already in the codebase ✅

- Service worker registration (`main.ts`) — for parallel shard download
- Bundled WASM for wllama (Vite `?url` from `@wllama/wllama`; verified via `npm run verify:wllama`)
- Self-hosted Transformers.js mirror via `env.remoteHost`
- Storage quota check before loading large models, with proactive cache-clear UI
- Corrupted-cache recovery in `LlamaCppEngineAdapter` (re-download with `useCache: false`)
- Dynamic context sizing based on detected VRAM
- Engine fast-path swap — same-API-endpoint model switches skip unload (`AgentModelManager.ts`)

### Worth adding 🟡

#### 3.1. WebLLM cross-origin cache backend (for power users)

WebLLM 0.2.80+ supports a `cacheBackend: "cross-origin"` mode that uses a Chrome extension for cross-origin shared storage. Users who install the extension share model weights across any WebLLM site. Trivial to wire in:

```ts
const appConfig = {
  ...prebuiltAppConfig,
  cacheBackend: "cross-origin"
}
```

If the extension isn't installed, WebLLM falls back gracefully. Pure upside.

**Status**: Added to `src/config/models.ts`.

#### 3.2. HTTP/2 or HTTP/3 on storage.noahcohn.com

WebLLM downloads many small shards. Each shard over HTTP/1.1 has TCP overhead. Verify your VPS is serving the model directory over HTTP/2 (most modern reverse proxies do this by default with TLS, but worth confirming).

```bash
curl -I --http2 https://storage.noahcohn.com/models/vicuna-7b-q4f32-MLC/mlc-chat-config.json
# Look for: HTTP/2 200
```

#### 3.3. Brotli on JSON, raw `application/octet-stream` on shards

- `mlc-chat-config.json` and tokenizer files: serve with Brotli (usually 5–10× smaller).
- `.bin` shards: don't bother compressing — they're already entropy-dense from quantization. Compression CPU is wasted.

Sample nginx snippet for the model dir:

```nginx
location /models/ {
    alias /data/files/models/;
    autoindex on;

    # Required for WebLLM / Transformers.js
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Range, Origin, X-Requested-With" always;

    # Required for parallel chunk downloads
    add_header Accept-Ranges bytes always;

    # Enable Brotli for JSON/WASM (if ngx_brotli is installed)
    location ~* \.(json|wasm)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin * always;
        add_header Accept-Ranges bytes always;
        # brotli on;  # uncomment if ngx_brotli is available
        # brotli_types application/json application/wasm;
    }

    # Raw octet-stream for already-compressed model shards
    location ~* \.(bin|safetensors|gguf|onnx)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin * always;
        add_header Accept-Ranges bytes always;
        # Do NOT enable Brotli here — .bin shards are entropy-dense
    }
}
```

The `immutable` cache header is the big one — model shards never change at a given URL, so the browser can skip even the conditional GET on revisit.

#### 3.4. Prefetch the model lib `.wasm` early

Today the `.wasm` library only starts downloading after `engine.reload()` is called. You can warm the cache in parallel with the user picking options:

```html
<link rel="preload" as="fetch" crossorigin
  href="https://storage.noahcohn.com/models/wasm-libs/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm">
```

Saves ~1–2s on subsequent load. Only do this for the recommended model — preloading every option wastes bandwidth.

**Status**: Added to `index.html`.

#### 3.5. Show ETA, not just percent

Cosmetic but valuable. Track bytes/sec from `progressCallback` and project total time. Users tolerate a 4 GB download better when they see `"3:42 remaining"` than when they see `"37%"`.

**Status**: Added to `src/main.ts`.

### Not worth doing ❌

- **Sharding to a CDN like jsDelivr or Cloudflare R2** — cost/complexity not justified for a personal project; `storage.noahcohn.com` is fine.
- ~~**Custom-recompiling a smaller Vicuna with MLC's compiler**~~ — **We now do this.** See `scripts/build-vicuna-wasm.sh`, Colab `public/Jokesters_WebLLM_Compile.ipynb`, and `docs/VRAM_OPTIMIZATION_IMPLEMENTATION.md` §1.4. Policy for when to go deeper: [ADR 0001](./adr/0001-native-cpp-boundary.md). The payoff is real for 4GB GPU users, even if Hermes-3 3B is still the better default for most people.
- **Pruning / distilling Vicuna 7B yourself** — same reason. The community has moved on; Hermes-3 and Llama-3 are the distilled successors.
- **2-bit / 3-bit quantization (VPTQ, AQLM, QuIP#)** — research-grade, no MLC pipeline support today, quality cliff at <4 bits is real. Reconsider if MLC ships a 3-bit kernel; until then it's a side quest.

---

## 4. Engine selection logic — minor tightening

Looking at `EngineFactory.getModelEngineSupport()`, the priority is:

```
API → MLC (if WebGPU) → Transformers.js → llama.cpp
```

This is correct. One small wrinkle: the Transformers.js engine is auto-selected over llamacpp even when both are supported. For 7B models that's right (Transformers.js with WebGPU > wllama with WASM). For tiny CPU-only fallback scenarios, it might be worth flipping. Not a priority — Transformers.js with WebGPU is faster than wllama in basically every modern-browser case.

---

## 5. How models are loaded (README block)

The Jokesters loads LLM weights at runtime in the user's browser. Three engines are supported, picked automatically based on the model's config and the user's hardware:

1. **MLC WebLLM (preferred)** — WebGPU-accelerated, ~80% of native performance. Used for any model with an `mlc` config block.
2. **Transformers.js** — WebGPU via ONNX Runtime Web. Used as a fallback for HuggingFace ONNX models.
3. **wllama (llama.cpp/WASM)** — CPU-only, GGUF format. Last resort for browsers without WebGPU. WASM is bundled with the app (not fetched from VPS) so it always matches the JS glue.

### Engine selection by environment

| Environment | Recommended engine | Notes |
|-------------|-------------------|-------|
| Desktop Chrome/Edge with discrete GPU | **MLC** | Default; q4f16 models if `shader-f16` available |
| Integrated GPU / no shader-f16 | **MLC** (q4f32) | Use FP32-quant MLC models |
| Software WebGPU (SwiftShader, CI VMs) | **MLC** (q4f32 only) | Shader compile is slow; skip f16 models |
| No WebGPU at all | **llama.cpp** or **Transformers.js** | TinyLlama GGUF for CPU; 7B GGUF is very slow |
| WASM glue mismatch (stale cache/CDN) | Auto-fallback → **MLC** / Transformers / API | See `WllamaRuntimeMismatchError` in `src/llm/wllamaRuntime.ts` |

After bumping `@wllama/wllama`, run `npm run verify:wllama` and update `scripts/wllama-wasm.manifest.json`. VPS-hosted wllama WASM (`wllama-wasm/`) is optional legacy mirror for `download_models_on_vps.py`; the app uses bundled WASM.

Model weights are hosted on `storage.noahcohn.com` (self-hosted mirror) with HuggingFace as a fallback. Self-hosting gives us control over CORS, MIME types, cache headers, and uptime; HF gives us geo-distributed CDN reach. Both paths use the same MLC-compiled q4f32 weights for Vicuna 7B and the same Llama-2 model library `.wasm`.

First-load is ~2–4 GB depending on model size; subsequent loads are instant from IndexedDB cache. The cache is cleared if storage pressure is detected (see `checkStorage()` in `main.ts`).

**Why q4f32 for the 7B Vicuna path?** q4f16 requires `shader-f16` WebGPU feature support, which isn't universal (older Intel iGPUs and some Android GPUs lack it). q4f32 trades slightly more VRAM (~4 GB vs ~3.5 GB) for universal compatibility. q4f32 quality is indistinguishable from q4f16 for chat at this scale.

**Why not Q4_K_M GGUF for Vicuna?** Inference is 5–10× slower than MLC's WebGPU path. Reserved for the WASM fallback only.

---

## 6. Action items checklist

| # | Action | Status | File |
|---|--------|--------|------|
| 1 | Add `cacheBackend: "cross-origin"` to AppConfig | ✅ Done | `src/config/models.ts` |
| 2 | Audit `storage.noahcohn.com` headers | 🟡 Pending | Run `scripts/verify_vps_headers.py` |
| 3 | Drop / relabel GGUF Vicuna in picker | ✅ Done | `src/main.ts` |
| 4 | Relabel two MLC Vicuna options | ✅ Done | `src/main.ts` |
| 5 | Add `<link rel="preload">` for recommended `.wasm` | ✅ Done | `index.html` |
| 6 | Show download ETA, not just percent | ✅ Done | `src/main.ts` |
| 7 | Build & upload custom small-context Vicuna .wasm | 🟡 CI ready — run `build-vicuna-wasm.yml` | `scripts/build-vicuna-wasm.sh` |
| 8 | Register ctx512 / ctx1024 variants in model picker | ✅ Done | `src/config/models.ts`, `docs/WASM_CONTEXT_GUIDE.md` |

(1) and (2) are 30 minutes of work for measurable gains. (3) and (4) are picker-text edits. (5) and (6) are nice-to-have polish.
