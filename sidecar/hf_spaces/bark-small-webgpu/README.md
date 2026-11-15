---
title: Bark Small WebGPU
emoji: 🔊
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
short_description: Agent-testable Bark-small WebGPU ONNX bench
---

# Bark-small WebGPU Test Bench

Self-contained **agent-testable** demo for browser Bark TTS via WebGPU + ONNX Runtime Web.

Forked from [ford442/suno_bark_small_webgpu](https://github.com/ford442/suno_bark_small_webgpu) — **do not restart from scratch**; this Space bakes your existing 1ink.us ONNX export at Docker build time.

## Why Docker (not ZeroGPU)

| | Bark WebGPU | Kimi-Audio / Kimi-VL |
|---|---|---|
| Inference runs | **In the browser** | On GPU server |
| HF hardware | Static/Docker file server | ZeroGPU |
| GPU at runtime | User's browser WebGPU | Space GPU |

ZeroGPU does **not** help Bark — there's nothing to run on the Space GPU. Docker is used only to **serve** the ~400 MB ONNX shards + tokenizer configs.

## Deploy

1. Create a new HF Space → SDK: **Docker**
2. Upload this directory (or point Space at this folder in the Jokesters repo)
3. First build runs `download_models.sh` (~400 MB wget from `1ink.us`)
4. Open the Space URL in Chrome 113+

## Agent testing

Automated agents (Cursor, Claude, Kimi) should:

1. Open the Space URL
2. Confirm `#webgpu-pill` shows **WebGPU ready**
3. Click `[data-testid="generate-btn"]`
4. Wait for `[data-testid="status"]` → `Done in …s`
5. Verify `[data-testid="audio-player"]` is visible and playing

## Environment variables (Docker build)

| Variable | Default | Description |
|----------|---------|-------------|
| `ONNX_CDN` | `https://1ink.us/files/barksmall` | Quantized ONNX shard CDN |
| `MODEL_DIR` | `/app/models/bark-small` | Target directory |

## Local dev

```bash
cd hf_spaces/bark-small-webgpu
docker build -t bark-webgpu .
docker run --rm -p 7860:7860 bark-webgpu
# open http://localhost:7860
```

Or sync from the standalone repo:

```bash
git clone https://github.com/ford442/suno_bark_small_webgpu.git
cd suno_bark_small_webgpu
bash download_models.sh
npm install && npm run dev
```

## Jokesters integration (later)

Keep Bark **out of** `src/audio/` until this Space is green. Planned slot:

- **Supertonic** → agent lip-sync dialogue (keep)
- **Bark-small** → SFX / stingers / `[laughter]` tags (add via `BarkEngine.ts`)

See `experiments/bark-webgpu/README.md`.

## Conversion (Colab only)

Re-export ONNX: `utils/convert_bark_small.ipynb` (GPU Colab — not ZeroGPU).
