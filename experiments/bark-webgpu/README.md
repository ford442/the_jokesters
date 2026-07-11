# Bark WebGPU — experiments / integration track

## Source of truth

The standalone project remains canonical for Vite/React local dev:

**https://github.com/ford442/suno_bark_small_webgpu**

This folder documents how it relates to Jokesters — not a full copy (avoid drift).

## Recommendation: don't merge yet

| Approach | Verdict |
|----------|---------|
| **Start again** | ❌ Your 1ink.us ONNX export + tokenizer layout already works |
| **Merge into `src/` now** | ❌ Too early — no automated test loop |
| **HF Docker Space in `hf_spaces/bark-small-webgpu/`** | ✅ Agent-testable URL, models baked at build |
| **Merge `BarkEngine.ts` later** | ✅ After Space is green |

## Architecture (your export)

```
models/bark-small/
├── config.json + tokenizer files   (in git / Space)
├── semantic_model_quantized.onnx   (~197 MB, CDN)
├── coarse_acoustics_model_quantized.onnx (~112 MB)
└── fine_acoustics_model_quantized.onnx   (~89 MB)
```

Runtime: `@huggingface/transformers` v3.8+ pipeline `text-to-speech` + `device: 'webgpu'` + `dtype: 'q8'`.

## vs Kimi-Audio / Stable Audio 3

| Model | Browser? | Role in Jokesters |
|-------|----------|-------------------|
| **Bark-small** (this) | ✅ WebGPU | SFX, tags, weird voices |
| **Supertonic** (shipped) | ✅ WebGPU | Agent TTS + lip-sync |
| Kimi-Audio | Server / ZeroGPU | Audio-in understanding |
| Stable Audio 3 | Server | Music beds |

## Integration sketch (future PR)

```typescript
// src/audio/BarkEngine.ts — SFX only, not dialogue replacement
export class BarkEngine {
  async generateSfx(prompt: string): Promise<AudioBuffer> { ... }
}
```

Wire from `MusicEngine` or Director stinger callbacks. Keep Supertonic for `onSpeak()`.

## Test loop

1. Deploy `hf_spaces/bark-small-webgpu` to HF
2. Cursor / computerUse agent opens Space, runs checklist in Space README
3. When stable → port `useBarkTTS.ts` hook into Jokesters
