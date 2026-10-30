---
title: Jokesters Comedy Tester
emoji: 🎭
colorFrom: red
colorTo: yellow
sdk: gradio
sdk_version: 5.9.1
app_file: app.py
pinned: false
license: mit
---

# The Jokesters — GPU comedy tester

Runs the show's **5-agent improv loop** (same personas, writers'-room rules, stop tokens,
speakability filter and empty-turn retry as `src/GroupChatManager.ts`) on a real GPU, so the
question *"are the prompts bad, or is the browser model/context too small?"* can be answered
without WebGPU, q4f32 or TTS in the way.

## What it answers

| Experiment | Change | Reads as |
|---|---|---|
| Browser-equivalent vs better quant | Vicuna NF4 vs Vicuna fp16, same ctx | quantization cost |
| Context sweep | 512 / 1024 / 2048 / 4096 on one model | how much memory a 5-agent scene needs |
| Model swap | Vicuna vs Qwen2.5-7B vs Llama-3.1-8B vs Hermes-3 3B | whether the 2023 base model is the ceiling |
| Prompt layout | writers-room vs legacy per-speaker | which layout survives small ctx |

Metrics per run: spoken turns, empty (unspeakable) turns, one-shot retries, history trims, tok/s.

## Prompts stay in sync with `src/`

`prompts.json` is **generated**, never hand-edited:

```bash
npx tsx scripts/export-comedy-prompts.ts   # from the repo root
```

It captures `src/config/agents.ts`, `chatConfig.ts`, the pre-built writers'-room system prompt per
context size (`src/chat/writersRoom.ts`), empty-turn constants (`src/chat/speakableText.ts`) and the
first 40 improv setups. Re-run it after changing any of those, then push the Space.

## Deploy

Hardware: **T4 small** is enough for every 4-bit entry; use **A10G** (or ZeroGPU) for Vicuna fp16.
Set `HF_TOKEN` as a Space secret for the gated Llama-3.1 repo.

```bash
pip install huggingface_hub && huggingface-cli login
huggingface-cli repo create jokesters-comedy-tester --type space --sdk gradio --private
git clone https://huggingface.co/spaces/YOUR_USER/jokesters-comedy-tester && cd $_
cp ../hf_spaces/comedy-tester/{app.py,requirements.txt,README.md,prompts.json} .
git add . && git commit -m "comedy tester" && git push
```

Local: `pip install -r requirements.txt && python app.py` (needs a CUDA GPU).

## Not ported on purpose

Director modes (100+), production cards, comedy sampling plan, TTS, stage. Add a mode's
`hiddenInstruction` as a custom premise or Director whisper if you need to test one.
