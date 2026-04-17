# Prompt for Kimi on the VPS

## Goal
Download all Jokesters AI models directly onto the VPS (`storage.noahcohn.com`) so they are served from `/data/files/models/` via nginx.

## Context
- The Jokesters app is a browser-based comedy chat app that loads LLM models at runtime.
- All model URLs in the code now point to `https://storage.noahcohn.com/models/...`
- Nginx on this VPS is already configured to serve `/data/files/models/` with CORS and range headers.
- The models total ~35 GB and should be downloaded directly on the VPS to avoid slow network transfers.

## Prerequisites
```bash
pip install huggingface_hub
```

## Script Location
`/root/the_jokesters/scripts/download_models_on_vps.py`

## Action
Run this command:
```bash
cd /root/the_jokesters
python3 scripts/download_models_on_vps.py
```

## What the script downloads

1. **MLC WebLLM models** (8 models, ~24 GB) to `/data/files/models/{MODEL_NAME}/`
   - Llama-2-7b-chat-hf-q4f32_1-MLC
   - Hermes-3-Llama-3.2-3B-q4f32_1-MLC
   - Llama-3.2-3B-Instruct-q4f32_1-MLC
   - vicuna-7b-q4f32-webllm
   - Llama-3.1-8B-Instruct-q4f16_1-MLC
   - Llama-3.2-3B-Instruct-q4f16_1-MLC
   - Hermes-3-Llama-3.1-8B-q4f16_1-MLC
   - Hermes-3-Llama-3.2-3B-q4f16_1-MLC

2. **WASM model libraries** (~18 MB) to `/data/files/models/wasm-libs/`

3. **GGUF models** (3 models, ~11 GB) to `/data/files/models/gguf/`
   - Hermes-3-Llama-3.1-8B.Q4_K_M.gguf
   - vicuna-7b-v1.5.Q4_K_M.gguf
   - Hermes-3-Llama-3.2-3B.Q4_K_M.gguf

4. **wllama WASM binaries** (~4 MB) to `/data/files/models/wllama-wasm/`

5. **TTS ONNX models** (~500 MB) to `/data/files/models/tts/onnx/`

6. **Voice styles** (~1.6 MB) to `/data/files/models/tts/voice_styles/`

## Verification
After the script finishes, verify nginx is serving the files:

```bash
curl -I https://storage.noahcohn.com/models/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm
curl -I https://storage.noahcohn.com/models/tts/voice_styles/M1.json
curl -I https://storage.noahcohn.com/models/gguf/vicuna-7b-v1.5.Q4_K_M.gguf
```

All should return `HTTP/1.1 200 OK` with `Accept-Ranges: bytes` and `Access-Control-Allow-Origin: *`.

If any return 404, check nginx config and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Expected final directory structure
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
