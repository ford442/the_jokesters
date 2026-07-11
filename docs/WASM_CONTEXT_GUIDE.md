# WASM Context Guide — JS Overrides vs Custom Recompile

Two layers control context and peak VRAM in The Jokesters WebLLM stack. This guide explains when each is sufficient and how they must stay coupled.

**Policy:** Custom compile is allowed only after JS paths are exhausted — see **[ADR 0001 — Native C++ boundary](./adr/0001-native-cpp-boundary.md)**. Official compile entry points: `scripts/build-vicuna-wasm.sh`, Colab `public/Jokesters_WebLLM_Compile.ipynb`.

## Layer A: JS runtime overrides (`dynamicContext.ts`)

Applied at `CreateMLCEngine` via `appConfig.model_list[].overrides` and `chatOpts`:

| Key | Purpose |
|-----|---------|
| `context_window_size` | Runtime KV cache budget during chat |
| `prefill_chunk_size` | Prefill batch size (≤ context, power-of-two friendly) |
| `sliding_window_size` | Rolling attention window (generic 4K .wasm only) |
| `attention_sink_size` | Tokens pinned at sequence start when sliding |
| `kv_cache_quantization` | int8/fp8 KV when runtime supports it |

**OOM retry:** halves context down to 128 (3B) or 256 (7B/8B), then forces int8 KV cache.

**WebGPU limits:** `maxBufferSize` interception + device-lost race during init.

### When JS overrides are enough

- **3B models** (Hermes-3 3B, Llama-3.2 3B): generic ctx4k `.wasm` + `context_window_size: 2048` or lower fits most GPUs.
- **7B with ≥5 GB VRAM**: generic ctx4k `.wasm` + `context_window_size: 2048` is fine.
- **Tuning chat length** on an already-loaded engine without changing peak init allocation.

### When JS overrides are NOT enough

- **≤4 GB GPUs loading 7B Vicuna**: generic `Llama-2-7b-…-ctx4k_cs1k-webgpu.wasm` bakes a 4096-token TVM memory plan. Runtime `context_window_size: 512` reduces KV during chat but **peak allocation at `CreateMLCEngine` still follows the 4K plan**.
- **Fix:** recompile `model_lib` with `mlc_llm compile --device webgpu` at the target context (512 or 1024). Same weight shards; only the `.wasm` changes.

## Layer B: Compiled `model_lib` WASM

Built by `scripts/build-vicuna-wasm.sh` (or `.github/workflows/build-vicuna-wasm.yml`):

```bash
CONTEXT_SIZE=512  ./scripts/build-vicuna-wasm.sh
CONTEXT_SIZE=1024 ./scripts/build-vicuna-wasm.sh
```

**Output:** `.vps-staging/wasm-libs/vicuna-7b-q4f32_1-ctx{512,1024}_cs1k-webgpu.wasm`

**Upload:** `python scripts/upload_staged_to_vps.py` → `https://storage.1ink.us/models/wasm-libs/`

## Model presets (`src/config/models.ts`)

| Preset | model_lib | overrides.context | Est. peak VRAM |
|--------|-----------|-------------------|----------------|
| `vicuna-7b-q4f32-webllm-vps` | generic ctx4k | 2048 | ~4.0 GB |
| `vicuna-7b-q4f32-webllm-ultra-low` | generic ctx4k | 512 + sliding | ~3.5 GB |
| `vicuna-7b-q4f32-webllm-ctx512` | **custom ctx512** | 512 | **~3.2 GB** |
| `vicuna-7b-q4f32-webllm-ctx1024` | **custom ctx1024** | 1024 | **~3.6 GB** |
| `Hermes-3-Llama-3.2-3B-q4f32_1-MLC` | Llama-3.2 ctx4k | 4096 | ~2.5 GB |

`loadModelWithDynamicContext()` HEAD-probes custom `.wasm` URLs and falls back to generic ctx4k with a user-visible warning until the artifact is hosted.

## Context creation checklist

When calling `CreateMLCEngine`:

- [ ] `appConfig.model_list[].model_lib` matches quant + arch + intended max ctx
- [ ] `overrides.context_window_size` ≤ compiled max (parsed from filename `ctx{N}`)
- [ ] `prefill_chunk_size` ≤ context and power-of-two friendly
- [ ] Sliding window only on generic ctx4k `.wasm` presets (not custom low-ctx `.wasm`)
- [ ] Fallback chain: full Vicuna → ctx1024 → ctx512 → Hermes 3B → ultra-low JS preset

## Benchmarking peak VRAM (≤4 GB hardware)

Proxy metrics when `navigator.gpu` memory probes are unavailable:

1. **Load success rate** on GTX 1650 / 4 GB iGPU with `vicuna-7b-q4f32-webllm-ctx512` vs `ultra-low`
2. **`createBuffer` / maxBufferSize failures** during `CreateMLCEngine` (should drop with custom .wasm)
3. **Chrome → More tools → Task manager → GPU memory** after model reaches "Ready"

Documented improvement target: custom ctx512 `.wasm` loads where generic ctx4k + JS overrides OOM on 4 GB cards.

## Build & deploy workflow

1. Trigger CI: **Actions → Build Custom Vicuna-7B WASM** (or run Colab `public/Jokesters_WebLLM_Compile.ipynb`)
2. Download artifacts → `.vps-staging/wasm-libs/`
3. `python scripts/upload_staged_to_vps.py`
4. `python scripts/verify_model_urls.py` (checks ctx512/ctx1024 URLs)
5. Reload app — `resolveModelLibUrl()` picks custom `.wasm` automatically

## Related

- `docs/VRAM_OPTIMIZATION_IMPLEMENTATION.md` §1.4
- `scripts/build-vicuna-wasm.sh`
- Issues #160, #161 (JS-side reductions — closed)
