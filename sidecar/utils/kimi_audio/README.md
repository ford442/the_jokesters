---
title: Kimi Audio
emoji: 🎵
colorFrom: pink
colorTo: indigo
sdk: gradio
sdk_version: 5.49.0
python_version: '3.10'
app_file: app.py
pinned: false
hardware: zero-gpu
short_description: Kimi-Audio-7B on ZeroGPU (audio-only)
---

# Kimi-Audio ZeroGPU Space

Audio-only inference for **moonshotai/Kimi-Audio-7B-Instruct**.

- ASR / audio Q&A / optional speech reply
- **Not** combined with Kimi-VL (use `hf_spaces/kimi-vl-zero-gpu-test` for vision)

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KIMI_AUDIO_MODEL` | `moonshotai/Kimi-Audio-7B-Instruct` | HF model id |
| `KIMI_LOAD_DETOKENIZER` | `1` | `0` = text-only, saves ~4 GB VRAM |
| `KIMI_AUDIO_DIR` | `/tmp/Kimi-Audio` | Clone path for `kimia_infer` |

## ZeroGPU tips

1. Click **Load Kimi-Audio** and wait 2–3 min on first run.
2. If OOM: set `KIMI_LOAD_DETOKENIZER=0` and uncheck voice reply.
3. Do **not** pin `transformers>=5` — Kimi-Audio remote code fails on v5.
4. `flash-attn` is **not** installed at runtime; SDPA is used instead.

## Local dev

```bash
cd utils/kimi_audio
pip install -r requirements.txt
python app.py
```

Requires a CUDA GPU locally; ZeroGPU on HF Spaces.
