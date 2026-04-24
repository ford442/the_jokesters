# Copilot Instructions — The Jokesters

## Build & Development Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173 (HMR)
npm run build        # tsc --noEmit && vite build → dist/
npm run preview      # Serve dist/ locally
npx tsc --noEmit     # Type-check only (required to pass before committing)

# Performance benchmarks (browser environment required for most; Node only runs memory leak test)
npm run perf:quick   # Quick benchmark run (~30s)
npm run perf         # Standard CI run
npm run perf:ci      # JSON output for CI
```

There is no unit test suite. The `tests/` directory contains only performance benchmarks.

## Architecture Overview

### The "Digital Director / Stateless Actor" Model

The app runs entirely in the browser with no server-side logic. Inference happens via WebGPU (or WASM fallback).

**Key data flow:**
```
main.ts → GroupChatManager (LLM) → Director (orchestration) → mode loop functions → DirectorCallbacks → UI/audio/visuals
```

**Core classes:**
- `src/main.ts` — App entry, init state machine (`BOOTING → AUDIO → MODEL → FINALIZING → READY`), all UI event wiring
- `src/GroupChatManager.ts` — Wraps the LLM engine; manages conversation history (capped at 8 messages), agent rotation, profanity level, and VRAM-aware dynamic context
- `src/Director/Director.ts` — Receives a `Scenario` object and dispatches to the correct mode loop function; one `Director` instance persists across scenes
- `src/Director/modes/` — Each file exports one or more `ModeLoop` functions with signature `(scenario: Scenario, ctx: ModeContext) => Promise<void>`. **All** turn generation goes through `ctx.processTurn()`
- `src/llm/EngineFactory.ts` — Detects browser capabilities and creates the right engine: MLC WebLLM (WebGPU) → Transformers.js → llama.cpp WASM
- `src/llm/LLMEngine.ts` — The `LLMEngine` interface all three engine adapters implement
- `src/config/models.ts` — Single source of truth for all model IDs, URLs, WASM lib URLs, and VRAM estimates. `appConfig` here **must** be passed to `CreateMLCEngine` or the WASM binary URL will be missing (causes `ExitStatus: exit(1)`)
- `src/config/agents.ts` — Agent definitions (id, systemPrompt, temperature, color). All agents end responses with `"###"` as a stop token
- `src/audio/AudioEngine.ts` — ONNX-based TTS (Supertonic pipeline). Maps agent IDs to voice files: `comedian→F1`, `philosopher→M2`, `scientist→M1`, `techBro→M1`, `robot→M2`
- `src/visuals/Stage.ts` — Three.js scene; `InstancedMesh` for 150 audience members (single draw call), `LOD` + frustum culling, spotlight on active speaker
- `src/Director/MemoryManager.ts` — Episode persistence to `localStorage` (`jokesters-` prefix) with optional HuggingFace Hub cloud sync

### LLM Engine Selection

`EngineFactory` auto-selects: WebGPU (MLC) → ONNX/WebGPU (Transformers.js) → CPU WASM (llama.cpp). Manual override via `EngineType = 'mlc' | 'llamacpp' | 'transformers' | 'auto'`.

### Model Loading Fallback Chain

`GroupChatManager.initialize()` attempts models in order from `getModelFallbackChain()` in `src/config/models.ts`. Default primary model is `Hermes-3-Llama-3.2-3B-q4f32_1-MLC` (~2.5 GB VRAM) hosted at `storage.noahcohn.com`. On failure, `GroupChatManager.getErrorCategory(error)` classifies the error as `'webgpu' | 'oom' | 'network' | 'unknown'`.

### Adding a New Interaction Mode

1. Export a `ModeLoop` function from the appropriate file in `src/Director/modes/`
2. Add the scenario type string to the `Scenario['type']` union in `Director.ts`
3. Add a `case` in `Director.runScenario()` to call your new loop
4. Add a UI button in `src/ui/ModeHandlers.ts`

### Adding a New Model

1. Add an entry to `OPTIMIZED_MODELS` (or the relevant constant) in `src/config/models.ts` with `model_id`, `model`, `model_lib`, `overrides`, and `vram_required_MB`
2. Add it to `appConfig.model_list` in the same file
3. Optionally insert it into the fallback chain in `GroupChatManager.initialize()`

## Key Conventions

### TypeScript
- Strict mode is fully enabled: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`
- `erasableSyntaxOnly` is **disabled** — `@wllama/wllama` uses non-erasable syntax
- `npx tsc --noEmit` must produce zero errors before committing
- `src/test/` and `node_modules/@wllama/**` are excluded from `tsconfig.json` includes

### Agent System Prompts
- Every system prompt **must** end with `End your response with "###"` — this string is the LLM stop token used to cleanly terminate generations
- Evolved personalities are persisted to `localStorage` under `jokesters-evolved-prompt-{agentId}` and are loaded on construction

### Service Worker
- `service-worker.js` must have a **stable filename** (no hash) — enforced via `entryFileNames` in `vite.config.ts`
- It intercepts large model file fetches (`.safetensors`, `.bin`, `.gguf`, `.wasm`) and parallelizes them as 42 MB byte-range chunks

### TTS Models and Assets
- TTS model files are **not bundled** — they must be hosted at `./tts/onnx/` and `./tts/voice_styles/` relative to the deployment root
- ONNX Runtime WASM files are copied to `dist/assets/ort/` at build time via `viteStaticCopy`
- LLM weights are downloaded at runtime and cached in the browser's IndexedDB via WebLLM

### Deployment
- `base: './'` in `vite.config.ts` means all asset paths are relative — suitable for static hosting without a fixed root
- COOP/COEP headers are **commented out** in `vite.config.ts`; do not enable them without verifying cross-origin isolation requirements for all model hosting URLs

### Common Errors
| Error | Cause | Fix |
|---|---|---|
| `ExitStatus: exit(1)` | Missing `appConfig` in `CreateMLCEngine`, or GPU OOM | Always pass `appConfig`; use q4f32_1 models for compatibility |
| `WebGPU not supported` | Non-WebGPU browser | Chrome 113+ / Edge 113+ required |
| `Unknown CPU vendor` (ONNX) | WASM on non-x86 | Harmless warning |
| `powerPreference ignored` | WebLLM + Windows | Harmless warning |
