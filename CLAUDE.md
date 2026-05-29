# The Jokesters — Claude Development Guide

## Project Overview

A browser-based multi-agent comedy show powered by WebGPU inference (`@mlc-ai/web-llm`) and
ONNX TTS. Three AI comedians (The Comedian, The Philosopher, The Scientist) improvise together
in real time with 3D lip-synced avatars.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM inference | `@mlc-ai/web-llm` ^0.2.8 (WebGPU, runs in browser) |
| TTS | ONNX Runtime Web + Supertonic pipeline (`./tts/onnx/`) |
| 3D visuals | Three.js 0.170.0 (WebGL2) |
| Build | Vite 7, TypeScript 5.9, ES2022 |

## Key Files

```
src/
  main.ts                 Entry point, UI, initialization pipeline
  GroupChatManager.ts     LLM engine wrapper — model loading & chat
  AgentModelManager.ts    VRAM-aware model hot-swapping
  config/models.ts        Model registry — IDs, WASM URLs, VRAM estimates
  Director/Director.ts    Scene orchestrator (20+ improv modes)
  audio/AudioEngine.ts    TTS synthesis
  audio/SpeechQueue.ts    Sentence-by-sentence audio playback
  visuals/Stage.ts        Three.js stage + animated avatars
```

## Model Loading Architecture

### How it works

`GroupChatManager.initialize()` in `src/GroupChatManager.ts`:

1. Pre-checks `navigator.gpu` (WebGPU) — throws a human-readable error if absent
2. Attempts models in a **fallback chain**:
   - Primary: `Hermes-3-Llama-3.2-3B-q4f16_1-MLC` (~2 GB VRAM)
   - Fallback: `Llama-3.2-3B-Instruct-q4f16_1-MLC` (~2.5 GB VRAM)
3. Passes `appConfig` from `src/config/models.ts` so WebLLM resolves the correct
   WASM binary URL for each model (critical — missing this caused the original `ExitStatus` crash)
4. Categorizes failures (WASM OOM vs network) and surfaces them via `onProgress`

### Changing the default model

Edit `src/config/models.ts`:

```typescript
export const defaultModelId = OPTIMIZED_MODELS.HERMES_3_3B_Q4F16.model_id
// or swap to:
// export const defaultModelId = OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16.model_id
```

### Adding a new model

1. Add an entry to `OPTIMIZED_MODELS` in `src/config/models.ts` with `model_id`, `model`,
   `model_lib`, `overrides`, and `vram_required_MB`
2. Add it to `appConfig.model_list` in the same file
3. Optionally add it to the fallback chain in `GroupChatManager.initialize()`

## Development

```bash
npm run dev        # local dev server (Vite HMR)
npm run build      # tsc + vite build → dist/
npm run preview    # preview production build
npm run perf:quick # run perf benchmarks (quick mode)
./scripts/build-webllm.sh   # build custom web-llm from 3rd_party/ submodule (see docs/webllm-customization-plan.md)
```

TypeScript must pass `npx tsc --noEmit` with zero errors before committing.
All strict checks are enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`).

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ExitStatus: exit(1)` | Wrong WASM binary for model, or GPU OOM | Pass `appConfig` to `CreateMLCEngine`; use q4f16 models |
| `WebGPU not supported` | Browser missing WebGPU | Use Chrome 113+ / Edge 113+ |
| `ERR_FILE_NOT_FOUND` for chrome-extension CSS | Browser extension conflict | Harmless — ignore |
| `Unknown CPU vendor` (ONNX warn) | WASM running on non-x86 | Harmless warning |
| `powerPreference ignored on Windows` | WebLLM limitation | Harmless warning |

## Deployment

Static hosting. All paths are relative (`base: './'` in vite.config.ts).

Required paths at server root:
- `./tts/onnx/` — Supertonic TTS model files
- `./assets/ort/*.wasm` — ONNX Runtime WASM (copied from `node_modules` at build time)
- LLM model weights are downloaded from HuggingFace CDN at runtime and cached in IndexedDB

---

## Next Task Prompt

> **Task: Show a user-friendly error UI when model loading fails**
>
> Currently when `GroupChatManager.initialize()` exhausts all model fallbacks, the app
> silently fails — the loading screen stays up with no actionable message for the user.
>
> **What to implement:**
>
> 1. In `src/main.ts`, catch the error thrown by `groupChatManager.initialize()` in `initApp()`
>    and render a styled error panel inside `#loading` instead of leaving the progress bar frozen.
>    The panel should:
>    - Show the specific error category (WebGPU not supported / GPU out of memory / network error)
>    - Provide a one-sentence fix suggestion per category:
>      - WebGPU: "Use Chrome 113+ or Edge 113+ with hardware acceleration enabled."
>      - OOM: "Close other GPU-heavy tabs and reload, or try a lower-VRAM model."
>      - Network: "Check your connection and reload. Model weights download from HuggingFace CDN."
>    - Include a **Retry** button that calls `initApp()` again
>    - Include a **Copy Error** button that copies the raw error message to clipboard
>
> 2. Add a `getErrorCategory(error: unknown): 'webgpu' | 'oom' | 'network' | 'unknown'` helper
>    in `GroupChatManager.ts` that classifies errors (reusing the string patterns already in
>    `initialize()`).
>
> 3. Expose the loaded model ID after successful init so the status bar can display
>    "Ready — Hermes-3 3B" rather than just "Ready!". Add a `getLoadedModelId(): string | null`
>    getter to `GroupChatManager` and wire it up in `main.ts`.
>
> **Files to change:** `src/main.ts`, `src/GroupChatManager.ts`, `src/style.css`
> (add `.error-panel`, `.error-panel button` styles)
>
> **Do not** add a model selector UI in this task — that is a separate feature.
