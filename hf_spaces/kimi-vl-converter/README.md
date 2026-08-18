---
title: Kimi-VL / Vicuna ONNX Converter
emoji: 🛠️
colorFrom: yellow
colorTo: red
sdk: gradio
sdk_version: 5.49.0
python_version: '3.10'
app_file: app.py
pinned: false
hardware: zero-gpu
short_description: Gradio ZeroGPU conversion (no Docker, no Colab dep hell)
---

# Kimi-VL / Vicuna ONNX Converter (Gradio + ZeroGPU)

Dedicated **Gradio** Space for the conversion jobs that used to live in
[`utils/convert_kimi_vl.ipynb`](../../utils/convert_kimi_vl.ipynb).

**Not Docker** — ZeroGPU only works with Gradio (or Streamlit) Spaces, not Docker.

## Why not Colab / Docker?

| Approach | Problem |
|---|---|
| Colab | Preinstalled Gradio/Diffusers/hub fight `transformers==4.51.3` |
| Docker Space | **Cannot** attach ZeroGPU |
| **This Space** | Clean Gradio venv + `@spaces.GPU` for export |

## Jobs

| Job | Runtime | Notes |
|-----|---------|--------|
| Diagnose env | CPU | Pins + Optimum import (CUDA off until a GPU job runs) |
| Kimi-VL preflight | CPU | Config + processor, `trust_remote_code` |
| Vicuna → ONNX (+ web shards) | **ZeroGPU** | **fp32** (WebGPU / ORT Web); Hub upload in the **same** call |
| Kimi stock Optimum export | **ZeroGPU** | Expected fail — no ONNX config for `kimi_vl` |

### WebGPU dtype: fp32

Browser ORT Web in The Jokesters expects **FP32** Vicuna weights. This Space
defaults to `dtype=fp32`. Do not ship fp16 for the web path (web-shard step also
warns if it sees FLOAT16 initializers).

### ZeroGPU rules (important)

1. **Ephemeral GPU disk** — artifacts die when the GPU slice ends. Always set
   **Upload repo** + Space secret `HF_TOKEN` so weights land on the Hub.
2. **Duration budget** — default `GPU_DURATION_EXPORT=600` seconds for **fp32**
   7B. Raise the env var if ZeroGPU kills the job mid-export.
3. **Product path for Kimi-VL** — inference Space
   `hf_spaces/kimi-vl-zero-gpu-test` or server API, not browser ONNX.

## Deploy

1. [Create Space](https://huggingface.co/new-space) → SDK **Gradio** → hardware **ZeroGPU**
2. Upload this folder (or set Space root to `hf_spaces/kimi-vl-converter`)
3. Settings → Secrets → `HF_TOKEN` (write) for Hub uploads
4. Open the Space → **Diagnose env** → **Vicuna ONNX** with a target repo id

```bash
huggingface-cli login
huggingface-cli repo create kimi-vl-converter --type space --space_sdk gradio
# copy files, git push, then set hardware to ZeroGPU in the UI if needed
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KIMI_MODEL_ID` | `moonshotai/Kimi-VL-A3B-Instruct` | Preflight / Optimum attempt |
| `VICUNA_MODEL_ID` | `lmsys/vicuna-7b-v1.5` | ONNX export source |
| `CONVERT_WORK_ROOT` | `/tmp/convert` | Artifact root on the worker |
| `GPU_DURATION_EXPORT` | `600` | `@spaces.GPU` duration hint for fp32 Vicuna (seconds) |
| `GPU_DURATION_KIMI_TRY` | `120` | Duration for Kimi Optimum attempt |
| `HF_TOKEN` | _(secret)_ | Hub upload |

## Local (no ZeroGPU)

```bash
cd hf_spaces/kimi-vl-converter
pip install -r requirements.txt
# CUDA machine recommended for Vicuna export
python app.py
```

Without CUDA, diagnose + Kimi preflight still work; Vicuna export will fall back to CPU and usually OOM.

## Files

| File | Role |
|------|------|
| `app.py` | Gradio UI + `@spaces.GPU` entrypoints |
| `convert_lib.py` | Export / shard / zip / Hub helpers |
| `requirements.txt` | Pinned Gradio ZeroGPU stack |

## Related

- Kimi inference: `hf_spaces/kimi-vl-zero-gpu-test/`
- Legacy Colab: `utils/convert_kimi_vl.ipynb`
