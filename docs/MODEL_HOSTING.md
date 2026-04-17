# Model Hosting on VPS - Setup Guide

This guide explains how all Jokesters models are hosted on the Contabo VPS (`storage.noahcohn.com`) for reliable, resumable downloads with full range header support.

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

# Upload everything staged in .vps-staging/
python scripts/upload_staged_to_vps.py
```

### 4. Verify Uploads

```bash
python scripts/verify_model_urls.py
```

This checks:
- All model endpoints return HTTP 200/206
- `Accept-Ranges: bytes` is present
- CORS headers are present

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
│   └── Hermes-3-Llama-3.2-3B.Q4_K_M.gguf
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
- `src/service-worker.ts` — Intercepts `storage.noahcohn.com` for parallel downloads

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
  https://storage.noahcohn.com/models/Llama-2-7b-chat-hf-q4f32_1-MLC/params_shard_0.bin
```

Should return `HTTP/1.1 206 Partial Content` and `Accept-Ranges: bytes`.

### CORS Errors

```bash
curl -I -H "Origin: https://your-app.com" \
  https://storage.noahcohn.com/models/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm
```

Should return `Access-Control-Allow-Origin: *`.

### Upload Failures

1. Ensure SSH key is loaded: `ssh-add -l`
2. Test connection: `ssh -i ~/.ssh/id_rsa root@storage.noahcohn.com`
3. Check disk space: `df -h /data`
4. Check permissions: `ls -la /data/files/models/`

## Migration Checklist

- [ ] Run `python scripts/migrate_all_models.py`
- [ ] Run `python scripts/upload_staged_to_vps.py` from a machine with SSH access
- [ ] Run `python scripts/verify_model_urls.py`
- [ ] Verify nginx CORS and range headers
- [ ] Test model loading in browser with WebGPU
- [ ] Test TTS initialization
- [ ] Verify IndexedDB caching works
