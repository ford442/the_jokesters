# Model Hosting on VPS - Setup Guide

This guide explains how all Jokesters models are hosted for reliable, resumable
downloads with full range header support.

- **Public CDN (app default):** `https://storage.1ink.us/models`
- **Origin / failover mirror:** Contabo VPS at `https://storage.noahcohn.com/models`
  (`/data/files/models/`), synced to DreamHost with `contabo_storage_manager/scripts/sync_models_to_1ink.sh`

## Overview

### Why Self-Host?
- **Reliability**: Hugging Face and GitHub CDNs don't always support HTTP Range headers consistently
- **Performance**: The service worker uses parallel chunked downloads (42MB chunks, 4 connections)
- **Independence**: No dependency on external CDNs for model loading
- **CORS**: Fully configured for cross-origin browser access

### What's Hosted on the VPS

| Category | Path on VPS | Description |
|----------|-------------|-------------|
| MLC WebLLM FP32 | `/data/files/models/{MODEL_NAME}/` | Primary LLM models (universal WebGPU) |
| MLC WebLLM FP16 | `/data/files/models/{MODEL_NAME}/` | Faster LLM models (requires shader-f16) |
| WASM Model Libs | `/data/files/models/wasm-libs/` | WebLLM runtime WASM binaries (~3-6MB each) |
| GGUF Models | `/data/files/models/gguf/` | llama.cpp WASM models |
| Transformers.js | `/data/files/models/transformers/{org}/{model}/` | ONNX models for Transformers.js engine |
| TTS ONNX | `/data/files/models/tts/onnx/` | Supertonic TTS model files |
| TTS Voices | `/data/files/models/tts/voice_styles/` | Voice style JSON files (M1, M2, F1, F2) |
| wllama WASM | `/data/files/models/wllama-wasm/` | llama.cpp WASM runtime binaries |

## Quick Start

### 1. One-Time VPS Setup

SSH into your VPS and ensure the models directory exists:

```bash
ssh root@storage.noahcohn.com

mkdir -p /data/files/models
chmod 755 /data/files/models

# Ensure nginx is configured for CORS and range requests
nginx -t
systemctl reload nginx

# Sync origin → public CDN (DreamHost)
# export SFTP_PASS=…
# bash /path/to/contabo_storage_manager/scripts/sync_models_to_1ink.sh
```

### 2. Automated Model Migration

From the project root, run the migration script to download all models from HuggingFace:

```bash
# Install requirements if needed
pip install huggingface_hub paramiko

# Download all models to .vps-staging/
python scripts/migrate_all_models.py
```

This will download:
- All 8 MLC WebLLM models (FP32 + FP16)
- All 4 Transformers.js ONNX model repos
- All 3 GGUF models
- Small assets already fetched: WASM libs, TTS models, voice styles, wllama binaries

### 3. Upload to VPS

From a machine with SSH key access to the VPS:

```bash
# Set env vars (optional, defaults shown)
export VPS_HOST=storage.noahcohn.com
export VPS_USER=root
export VPS_KEY_PATH=~/.ssh/id_rsa

# Upload everything staged in .vps-staging/ (Contabo origin)
python scripts/upload_staged_to_vps.py

# Then sync Contabo → storage.1ink.us (see contabo_storage_manager/scripts/sync_models_to_1ink.sh)
```

### 4. Verify Uploads

```bash
python scripts/verify_model_urls.py
```

This checks:
- All model endpoints return HTTP 200/206
- `Accept-Ranges: bytes` is present
- CORS headers are present


## CDN / Object Storage Evaluation (Issue #303)

This section evaluates third-party hosting options for large LLM weights (e.g., Vicuna ~4GB shards + `model_lib.wasm`) to improve reliability over the current dual-VPS setup.

### Comparison Table

| Provider | Egress Cost ($/TB) | Range Support | CORS Support | Latency (TTFB)* | Recommendation |
|----------|--------------------|---------------|--------------|-----------------|----------------|
| **Current Dual-VPS** | Included | Yes | Yes | ~265ms | **Baseline** |
| **Hugging Face** | Free | Yes | Yes | ~145ms | **Baseline** |
| **Cloudflare R2** | [$0.00](https://developers.cloudflare.com/r2/pricing/) | [Yes](https://developers.cloudflare.com/r2/api/s3/api/) | [Yes](https://developers.cloudflare.com/r2/buckets/cors/) | Not measured | **Recommended** |
| **BunnyCDN** | [$5.00 - $10.00](https://bunny.net/pricing/) | [Yes](https://support.bunny.net/hc/en-us/articles/115000574045-Does-BunnyCDN-support-byte-range-requests) | [Yes](https://support.bunny.net/hc/en-us/articles/115001309852-How-to-enable-CORS-headers-in-BunnyCDN) | Not measured | Good alternative |
| **Backblaze B2** | [$10.00/TB](https://www.backblaze.com/b2/cloud-storage-pricing.html) | [Yes](https://www.backblaze.com/docs/cloud-storage-s3-get-object) | [Yes](https://www.backblaze.com/docs/cloud-storage-cross-origin-resource-sharing-rules-cors) | Not measured | Costly at high traffic |
| **Fastly** | [Varies (High)](https://www.fastly.com/pricing/) | [Yes](https://docs.fastly.com/en/guides/serving-content#enabling-support-for-range-requests) | [Yes](https://docs.fastly.com/en/guides/enabling-cross-origin-resource-sharing-cors) | Not measured | Overkill / Expensive |

*\* Note: Latency measured via `curl -o /dev/null -s -w "%{time_starttransfer}\n" -H "Range: bytes=0-1023" <URL>` against current public VPS and HuggingFace URLs. Third-party CDNs were not measured directly.*
*(Data checked on October 20, 2026)*

### Proof of Concept (PoC) URL
* **pending: needs Noah's account**
* **Setup steps for Noah:**
  1. Create a Cloudflare R2 bucket.
  2. Configure a custom domain (e.g., `models.thejokesters.com`) and enable public access.
  3. Upload the Vicuna model weights and config (`mlc-chat-config.json`, `tokenizer.model`, shards).
  4. Ensure CORS settings allow `GET, HEAD, OPTIONS` from `*` with `Range` headers allowed.

### Go/No-Go Recommendation
**Go with Cloudflare R2.**
* **Reasons:** R2 offers zero-cost egress, which is crucial for delivering ~4GB of model weights to multiple users. It fully supports `Accept-Ranges` and CORS, matching the technical requirements of the Service Worker parallel chunking. It eliminates the maintenance burden of the current dual-VPS setup without incurring the unpredictable bandwidth costs of traditional object storage or CDNs.

## Directory Structure on VPS

After upload, the VPS should look like this:

```
/data/files/models/
├── Llama-2-7b-chat-hf-q4f32_1-MLC/
├── Hermes-3-Llama-3.2-3B-q4f32_1-MLC/
├── Llama-3.2-3B-Instruct-q4f32_1-MLC/
├── vicuna-7b-q4f32-webllm/
├── Llama-3.1-8B-Instruct-q4f16_1-MLC/
├── Llama-3.2-3B-Instruct-q4f16_1-MLC/
├── Hermes-3-Llama-3.1-8B-q4f16_1-MLC/
├── Hermes-3-Llama-3.2-3B-q4f16_1-MLC/
├── wasm-libs/
│   ├── Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm
│   ├── Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm
│   └── Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm
├── gguf/
│   ├── Hermes-3-Llama-3.1-8B.Q4_K_M.gguf
│   ├── vicuna-7b-v1.5.Q4_K_M.gguf
│   ├── Hermes-3-Llama-3.2-3B.Q4_K_M.gguf
│   ├── Kimi-VL-A3B-Thinking-2506-Q4_K_M.gguf
│   └── mmproj-Kimi-VL-A3B-Thinking-2506-f16.gguf
├── transformers/
│   └── onnx-community/
│       ├── Qwen2.5-0.5B-Instruct/
│       ├── Qwen2.5-1.5B-Instruct/
│       ├── Phi-3-mini-4k-instruct-onnx-web/
│       └── Llama-3.2-1B-Instruct/
├── tts/
│   ├── onnx/
│   │   ├── tts.json
│   │   ├── duration_predictor.onnx
│   │   ├── text_encoder.onnx
│   │   ├── vector_estimator.onnx
│   │   ├── vocoder.onnx
│   │   └── ...
│   └── voice_styles/
│       ├── M1.json
│       ├── M2.json
│       ├── F1.json
│       └── F2.json
└── wllama-wasm/
    ├── single-thread.wasm
    └── multi-thread.wasm
```

## GGUF Models

GGUF files live in `gguf/` and are registered in `src/config/models.ts` with `${VPS_STORAGE_URL}/gguf/<file>`.
Any URL containing `.gguf` goes through the service worker's dual-domain Range striping, and the Cache API key stays
the primary-host URL, so a new GGUF needs no extra wiring.

### Kimi-VL (vision) smoke note

`Kimi-VL-A3B-Thinking-2506-GGUF` pairs the model with a vision projector via `llamaCpp.mmprojUrl`:

| File | Role |
|------|------|
| `Kimi-VL-A3B-Thinking-2506-Q4_K_M.gguf` | Language model (~10 GB) |
| `mmproj-Kimi-VL-A3B-Thinking-2506-f16.gguf` | Vision projector, loaded together with the model |

1. Confirm both files are served (200/206 with `Accept-Ranges: bytes`) from the **public** host, not just the Contabo origin
   — run the VPS → `storage.1ink.us` sync first:
   ```bash
   for f in Kimi-VL-A3B-Thinking-2506-Q4_K_M.gguf mmproj-Kimi-VL-A3B-Thinking-2506-f16.gguf; do
     curl -sI -H "Range: bytes=0-0" "https://storage.1ink.us/models/gguf/$f" | head -1
   done
   ```
2. `npm test -- kimiVlGguf` checks the registry entry, striping eligibility and primary-host cache keys for both files.
3. Runtime (`@wllama/wllama` 3.8.1): the adapter loads `{ url, mmprojUrl }`, offloads all layers to WebGPU (`gpuLayers: 99`),
   parses the chat template with Jinja, and sends `image_url` message parts as image buffers once
   `supportInputModality('image')` is true after load. It needs wllama's JSPI + 64-bit-memory build (recent Chrome/Edge);
   elsewhere wllama would swap in a 32-bit compat build from a CDN, so the adapter throws a clear error first (`requiresMem64`).
   This path has unit coverage with a mocked wllama but has not been run against the real 10.5 GB model.
4. The launch picker lists it as a `vision` tier preset in `src/config/blessedPresets.ts` ("high VRAM / multimodal", ~13 GB
   peak estimate). It is never returned by `recommendModels`, and a failed load steps down to Hermes-3 3B q4f32.
5. The Q4_K_M file is far larger than the other GGUFs. Expect memory limits on typical browsers; treat as experimental
   and keep `Kimi-VL-A3B-Thinking-2506` (server API) as the working path.
6. wllama 3.x has no tokenizer API, so GGUF models use the token estimator's calibrated ratio instead of exact counts.

## Nginx Configuration

Ensure your nginx config includes:

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
    
    # Cache immutable model files
    location ~* \.(wasm|gguf|bin|safetensors|onnx|json)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin * always;
        add_header Accept-Ranges bytes always;
    }
}
```

## Code Configuration

All model URLs in the codebase now point to the VPS:

- `src/config/models.ts` — MLC model URLs and WASM lib URLs
- `src/llm/LlamaCppEngineAdapter.ts` — wllama WASM binaries
- `src/llm/TransformersEngineAdapter.ts` — `env.remoteHost` redirected to VPS
- `src/audio/Supertonic.ts` — TTS ONNX models
- `src/audio/AudioEngine.ts` — TTS voice styles
- `src/service-worker.ts` — Intercepts `storage.1ink.us` (and Contabo) for parallel Range downloads with dual-domain striping
- `src/config/loadFailover.ts` — VPS → Contabo (SW) → HF Hub automatic Vicuna retry

## HuggingFace Vicuna repo checklist (Option B)

Failover target: `https://huggingface.co/ford442/vicuna-7b-q4f32-webllm` (`main` until `HF_VICUNA_REVISION` is pinned).

| Item | Why |
|------|-----|
| `mlc-chat-config.json` | WebLLM refuses to init without it |
| `tokenizer.model` + `tokenizer_config.json` | Upstream config omits `tokenizer_files`; app supplies them via overrides |
| All `params_shard_*.bin` (complete shard set) | Partial uploads fail mid-load as network/config |
| HF CDN Range / HTTP 206 | SW parallel chunks; confirm with `curl -I -H 'Range: bytes=0-1023'` |
| Matching q4f32 quant | Same as VPS Vicuna — do not mix q4f16 shards |
| LFS pointer files resolved | Raw LFS pointers 404 as tiny files and fail the byte-length check |

Option C (HF Inference Endpoint / paid always-on) is **not** implemented. Use the existing API engine for comedy-only remote inference if Hub CDN is still too flaky after A+B.

## Storage Requirements

## Storage Requirements

| Category | Count | Est. Size |
|----------|-------|-----------|
| MLC FP32 | 4 | ~13 GB |
| MLC FP16 | 4 | ~13 GB |
| GGUF | 3 | ~12 GB |
| Transformers.js | 4 repos | ~5-10 GB |
| TTS + Voices + WASM | - | ~1 GB |
| **Total** | | **~40-50 GB** |

## Troubleshooting

### Range Headers Not Working

```bash
curl -I -H "Range: bytes=0-1023" \
  https://storage.1ink.us/models/Llama-2-7b-chat-hf-q4f32_1-MLC/params_shard_0.bin
```

Should return `HTTP/2 206` (or `HTTP/1.1 206`) and `Accept-Ranges: bytes`.

### CORS Errors

```bash
curl -I -H "Origin: https://your-app.com" \
  https://storage.1ink.us/models/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm
```

Should return `Access-Control-Allow-Origin: *`.

### Upload Failures

1. Ensure SSH key is loaded: `ssh-add -l`
2. Test Contabo origin: `ssh -i ~/.ssh/id_rsa root@storage.noahcohn.com`
3. Check disk space: `df -h /data`
4. Check permissions: `ls -la /data/files/models/`
5. Re-sync CDN: `SFTP_PASS=… bash contabo_storage_manager/scripts/sync_models_to_1ink.sh`

## Migration Checklist

- [ ] Run `python scripts/migrate_all_models.py`
- [ ] Run `python scripts/upload_staged_to_vps.py` from a machine with SSH access
- [ ] Run `python scripts/verify_model_urls.py`
- [ ] Verify nginx CORS and range headers
- [ ] Test model loading in browser with WebGPU
- [ ] Test TTS initialization
- [ ] Verify IndexedDB caching works
