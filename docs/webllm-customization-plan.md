# WebLLM Customization Plan for The Jokesters

**Status:** Draft for review  
**Date:** 2026  
**Owner:** ford442 / The Jokesters team  
**Related:** [CLAUDE.md](../CLAUDE.md), [MODEL_HOSTING.md](./MODEL_HOSTING.md), [VRAM_OPTIMIZATION_IMPLEMENTATION.md](./VRAM_OPTIMIZATION_IMPLEMENTATION.md), `src/llm/EngineFactory.ts`, **[ADR 0001 — Native C++ boundary](./adr/0001-native-cpp-boundary.md)** (when *not* to fork mlc-llm / TVM)

---

## Executive Summary

**Recommended path: Fork web-llm (submodule already initialized at `3rd_party/web-llm` pointing to `ford442/web-llm`) + disciplined build script + Vite/TS alias or vendored artifacts.**

We should **defer forking mlc-llm** until we have a concrete, measured need for custom WASM runtime behavior (smaller binary, new kernels, or experimental hooks). The highest-leverage, lowest-maintenance customizations for a real-time multi-agent comedy improv show live in the JavaScript/TypeScript runtime layer.

**Why now?**
- We already self-host all weights and `model_lib` `.wasm` files on the VPS.
- The project has evolved a sophisticated multi-engine architecture (`EngineFactory` + adapters) — web-llm/Mlc is one interchangeable backend.
- Real comedy wins (timing, style control, streaming to TTS/lip-sync, callback memory, low-latency turn-taking) are mostly orchestration + sampling problems, not low-level TVM codegen problems.
- The fork exists; the submodule is checked out. We need a clean, repeatable way to consume it without polluting the main repo or breaking `npm run build`.

---

## 1. Current State of WebLLM in The Jokesters

### 1.1 Consumption Today
- **NPM dep:** `"@mlc-ai/web-llm": "^0.2.8"` (installed in `node_modules/@mlc-ai/web-llm`)
- **Primary entry:** `src/llm/MlcEngineAdapter.ts` → `src/utils/dynamicContext.ts` → `webllm.CreateMLCEngine(modelId, { appConfig, initProgressCallback }, chatOpts)`
- **Model config:** Fully custom via `src/config/models.ts` (VPS-hosted weights + `model_lib` URLs under `https://storage.noahcohn.com/models/wasm-libs/`)
- **Engine selection:** `src/llm/EngineFactory.ts` supports `mlc | llamacpp | transformers | api | auto` with capability probing.
- **Heavy customization already exists** around VRAM (dynamic context, KV cache quantization, sliding window, attention sinks, `maxBufferSize` interception, device-lost racing).
- **Parallel downloads:** Custom `src/service-worker.ts` intercepts model + `.wasm` fetches with 4-connection range requests (bypasses some Cache API pain).
- **Bundle awareness:** Vite manual chunk `'webllm-engine': ['@mlc-ai/web-llm']` + `optimizeDeps.exclude`.

### 1.2 Submodule Status (as of this investigation)
- `.gitmodules` + `3rd_party/web-llm/` points to **https://github.com/ford442/web-llm.git**
- Current commit: `9e572d6` ("[Version] Bump version to 0.2.84")
- Tracks upstream closely (recent merges for OPFS, Hermes tool calling, VLM framework, etc.).
- **No lib/ build output yet** — the fork has not been built locally.
- Minimal (if any) diverging comedy-specific code so far — this is the setup phase.

### 1.3 Where the Real Work Happens
| Layer                    | Location in web-llm fork          | Who controls it today          | Customization potential for jokes |
|--------------------------|-----------------------------------|--------------------------------|-----------------------------------|
| Model weights + tokenizer | VPS (self-hosted)                | Us (via mlc-llm compile)      | High (domain fine-tunes)         |
| `model_lib` `.wasm`      | Built by `mlc_llm compile --device webgpu` | MLC team (or us if we build mlc-llm) | Medium (size, specific kernels) |
| JS runtime (engine, workers, sampling, caching, OpenAI compat) | `src/*.ts` in web-llm            | npm package or our fork       | **Very High**                    |
| Orchestration + adapters | `src/llm/*.ts`, `dynamicContext.ts`, `GroupChatManager.ts`, Director | Us                            | Already our code                 |

**Key insight:** The `.wasm` is an opaque TVM module (architecture + quant + memory plan baked in). web-llm's job is to load it via `@mlc-ai/web-runtime` (tvmjs), wire up WebGPU, run the KV cache loop, tokenize, sample, and stream.

---

## 2. WebLLM / MLC-LLM Architecture (from Submodule + Upstream Docs)

### 2.1 Build Flow for a Custom Model (today)
1. `mlc_llm convert_weight ... --quantization q4f32_1` (produces MLC-format shards + `tensor-cache.json`)
2. `mlc_llm gen_config ...` (produces `mlc-chat-config.json` + tokenizer artifacts)
3. `mlc_llm compile <mlc-chat-config.json> --device webgpu -o foo-webgpu.wasm`
   - Requires Emscripten (emsdk) + TVM built with WASM + WebGPU targets.
   - The `.wasm` contains the compiled TVM IRModule (operators, schedules, memory planner tuned to the context/prefill sizes in the config).

4. Host weights (HF or VPS) + `.wasm` (VPS for Range header reliability).
5. Register in `AppConfig.model_list` with `model` + `model_lib` URLs.

### 2.2 Runtime Flow (web-llm)
- `CreateMLCEngine` / `MLCEngine.reload()` selects `ModelRecord` from `appConfig`.
- Fetches (or Cache-hits) the `.wasm` + weight shards.
- `tvmjs.instantiate(wasmSource, ...)` → creates TVM runtime + WebGPU device.
- `LLMChatPipeline` / `LLMChat` manages:
  - Prefill + decode loop
  - KV cache (paged or continuous)
  - Logit processors / grammar (xgrammar, JSON schema, structural tags)
  - Streaming via `AsyncGenerator`
- Workers: `WebWorkerMLCEngineHandler` for off-main-thread (optional today).
- Caching: `cache_util.ts` uses browser Cache API (or IndexedDB/OPFS/CrossOrigin per `appConfig.cacheBackend`).

**No part of web-llm knows how to *compile* a new `.wasm`.** That is 100% mlc-llm + TVM/Emscripten.

### 2.3 Customization Points (ranked by accessibility)
1. **Easiest (pure client code today):** `appConfig`, `GenerationConfig`, custom `LogitProcessor`, `initProgressCallback`, wrapper adapters, SW interception.
2. **Fork web-llm (this task):** Anything in `src/` — new public APIs, custom sampling loops, tighter Cache/SW integration, pruned bundle, comedy-specific `LLMChat` variants, better interrupt/abort semantics, streaming hooks that emit *before* full sentences.
3. **Fork mlc-llm + build env (future):** Change what goes into the `.wasm` itself (operator fusion, memory layout, custom WebGPU shaders via TVM, dead-code elimination of unused kernels for Llama-only workloads).

---

## 3. Evaluation of Approaches

| Approach                              | Initial Effort | Ongoing Maintenance | Realistic Wins for Jokesters                                                                 | Risk / Pain Points                          | Verdict |
|---------------------------------------|----------------|---------------------|----------------------------------------------------------------------------------------------|---------------------------------------------|---------|
| **Official npm + VPS hosting only**   | Zero           | Zero                | URLs, client wrappers, dynamic context, SW parallel downloads (already excellent)           | Cannot touch runtime, bundle bloat, no comedy-specific sampling hooks | Baseline — we are here |
| **Fork web-llm (submodule)**          | Low-Medium     | Low-Medium (rebase ~quarterly) | Full control of JS layer: comedy logit processors, streaming-to-TTS pipeline, cache/SW co-design, bundle pruning (target <5MB total), first-class multi-agent ergonomics, custom error surfaces | Must rebase on upstream releases; worker + bundler edge cases | **Recommended primary path** |
| **Fork mlc-llm + Emscripten/TVM**     | High (days-weeks of env pain) | High (TVM moves fast) | Smaller custom `.wasm` (strip vision/embedding kernels?), experimental hooks, custom quant schedules | Full C++/Python/TVM compiler env, hours-long rebuilds, binary debugging nightmare, Emscripten version skew | Only pursue with specific measured need (e.g. "our 3B wasm must be <1.5MB") |

**Conclusion:** 80-90% of the value for a humor-focused, real-time, 3D-lip-synced improv show is in approach #2. Approach #3 is a research project with diminishing returns unless we hit a hard wall on wasm size or need a completely new model architecture.

---

## 4. Proposed Integration Architecture

### 4.1 Folder & Repo Layout (additions in **bold**)

```
the_jokesters/
├── 3rd_party/
│   ├── web-llm/                    # git submodule (ford442 fork, source)
│   │   ├── src/
│   │   ├── rollup.config.js
│   │   └── package.json (version ~0.2.84+)
│   └── **web-llm-dist/**           # GENERATED — gitignored. Populated by build script
│       ├── lib/
│       │   ├── index.js
│       │   ├── index.d.ts
│       │   └── ...
│       └── **BUILD_INFO.txt**      # timestamp + git sha of submodule at build time
├── **patches/**
│   └── **web-llm/**                # Optional .patch files (git format-patch) applied by build script
├── scripts/
│   ├── **build-webllm.sh**         # THE repeatable entry point (executable)
│   └── (existing python scripts)
├── src/
│   ├── llm/
│   ├── config/models.ts
│   └── **vendor/webllm/**          # Optional thin re-export shim (future)
├── vite.config.ts                  # (will document alias + fs.allow already present)
├── tsconfig.json                   # (will document paths for IDE)
└── docs/
    └── **webllm-customization-plan.md**  # This file
```

**`.gitignore` additions (recommended):**
```
3rd_party/web-llm-dist/
patches/web-llm/*.applied
```

### 4.2 Submodule Hygiene (already good)
- URL points to our fork (not upstream) — correct.
- Update process (document in the script header):
  1. In `3rd_party/web-llm`: `git remote add upstream https://github.com/mlc-ai/web-llm.git`
  2. `git fetch upstream && git merge upstream/main`
  3. Resolve conflicts, test, `git push origin main`
  4. In root: `git add 3rd_party/web-llm && git commit -m "chore: update web-llm fork to <sha>"`

### 4.3 The `scripts/build-webllm.sh` Contract

The script must be:
- Idempotent / safe to re-run
- Verbose (echo every major step)
- Patch-aware (optional)
- Output-only (never mutates the main working tree except the generated `web-llm-dist`)
- Fast-failing (`set -euo pipefail`)

**High-level steps it performs:**
1. Sanity checks (submodule present, emscripten not required here, node >=18)
2. `cd 3rd_party/web-llm`
3. `npm ci` (or `npm install` with lockfile preference)
4. Apply any `../../patches/web-llm/*.patch` in lexical order (with `.applied` guard or `git apply --check`)
5. `npm run build` (rollup + cleanup-index-js.sh)
6. `cd -`
7. `rm -rf 3rd_party/web-llm-dist && mkdir -p 3rd_party/web-llm-dist`
8. `cp -r 3rd_party/web-llm/lib 3rd_party/web-llm-dist/`
9. `cp 3rd_party/web-llm/package.json 3rd_party/web-llm-dist/`
10. Write `3rd_party/web-llm-dist/BUILD_INFO.txt` (date, submodule sha, node version, patch list)
11. Optional: size report (`du -sh`, individual file sizes) — useful for perf budget tracking
12. Print next-step instructions ("To use: set alias in vite.config.ts or change package.json to file:..." )

**Invocation examples:**
```bash
# One-time or when you changed the fork
./scripts/build-webllm.sh

# With a specific patch set
APPLY_PATCHES=1 ./scripts/build-webllm.sh
```

### 4.4 Consumption Patterns (pick one, document the choice)

**Pattern A — Fast iteration (recommended while actively hacking the fork)**
```ts
// vite.config.ts
import path from 'path'
resolve: {
  alias: {
    '@mlc-ai/web-llm': path.resolve(__dirname, '3rd_party/web-llm/src/index.ts'),
  },
},
// tsconfig.json
"paths": {
  "@mlc-ai/web-llm": ["./3rd_party/web-llm/src/index.ts"],
  "@mlc-ai/web-llm/*": ["./3rd_party/web-llm/src/*"]
}
```
Vite/esbuild will transpile the TS sources on the fly. Zero rebuild step during development. `server.fs.allow: ['..']` already permits it.

**Pattern B — Reproducible builds (CI-friendly)**
After running `scripts/build-webllm.sh`:
```ts
// vite.config.ts
alias: {
  '@mlc-ai/web-llm': path.resolve(__dirname, '3rd_party/web-llm-dist/lib/index.js'),
}
```
Also copy `index.d.ts` and point `typeRoots` or use a `declare module` shim. Add the build step to `package.json` `"prepare"` or a `build:webllm` script that the main `build` depends on.

**Pattern C — npm file: link (simple but has sharp edges)**
In root `package.json`:
```json
"@mlc-ai/web-llm": "file:./3rd_party/web-llm"
```
Run `npm install` after every `build-webllm.sh`. Works well if the submodule's `package.json` "main" points at the freshly-built `lib/`. Can cause nested `node_modules` duplication of web-llm's own (small) runtime deps.

**Pattern D — npm link (local machine only)**
```bash
cd 3rd_party/web-llm && npm link
cd ../.. && npm link @mlc-ai/web-llm
```
Fast, but stateful and not reproducible.

**Recommendation in the plan:** Start with **Pattern A** (source alias) for 90% of fork development. Promote to **Pattern B** (vendored dist + explicit build step) before any release or when multiple engineers touch the fork. Never rely on Pattern C/D for the canonical build.

### 4.5 Worker Considerations
web-llm supports off-main-thread via `WebWorkerMLCEngineHandler`. Our current `MlcEngineAdapter` + `CreateMLCEngine` runs on the main thread (acceptable today because generation is async and we have `requestAnimationFrame` + Three.js on the same thread).

Future comedy win: move the entire LLM loop to a worker so the Director game loop + TTS synthesis + 3D rendering never stutter on long prefills. The fork makes it easy to expose a clean "create worker engine" factory that the adapter can opt into.

---

## 5. High-Value Customization Opportunities (Comedy-Specific)

### 5.1 Low-to-Medium Effort (Start Here — Many Don't Even Require the Fork)
- Per-agent `LogitProcessor` that the Director can swap at turn boundaries ("roast mode" vs "philosophical tangent" vs "callback callback").
- Smarter streaming: emit *partial sentences* or "laughter candidate" tokens to `SpeechQueue` / `VisemePredictor` earlier instead of waiting for sentence terminators.
- First-class "generation budget" API (max tokens + "soft stop" for comedic timing rather than hard cutoffs).
- Better abort semantics that the Director can use to interrupt a rambling agent mid-generation without leaking state.
- Expose the underlying `tvm` instance / KV cache stats so MemoryManager can do intelligent summarization or "forget" low-value turns.

### 5.2 Medium Effort (Ideal for web-llm Fork)
- **Comedy-optimized sampling loop** inside a forked `LLMChat` or custom processor: temperature annealing within a single generation ("high entropy setup → low entropy punchline"), presence penalty that specifically targets callback phrases the CallbackEngine has registered.
- **Cache / SW co-design**: Modify `cache_util.ts` (or the new OPFS backend) to be aware of the app's service worker. Avoid double-buffering large `.wasm` + weight shards. Add progress hooks that feed the existing `ParallelDownloadManager`.
- **Bundle pruning**: In the fork's rollup config, conditional exports or manual tree-shaking for vision, embeddings, full xgrammar/structural-tag support if the jokesters workload only needs a subset. Goal: shrink the `'webllm-engine'` chunk.
- **Multi-agent ergonomics**: New helper `createAgentEngines(...)` or batched reload that understands the 5-persona + hot-swap pattern we already have in `AgentModelManager`.
- Custom `InitProgressReport` enrichment so the loading UI (and the new error UI from the previous task) can show "model X for comedian, context Y tuned for improv".

### 5.3 High Effort / Low Near-Term Value (mlc-llm + Emscripten Territory)
- Stripped Llama-only webgpu.wasm (remove all Mistral/Qwen/Phi/VLM kernels, embedding paths, etc.). Potential 1–3 MB savings per lib?
- Custom TVM memory planner pass that is "improv aware" (prefers keeping recent 4–6 turns + system prompt + callback registry).
- Experimental hooks that let external JS mutate attention scores or KV states between tokens (for "dream mode" or "haunted callback" effects). Fun research, high maintenance.
- Domain-specific fine-tune + compile pipeline that bakes joke datasets into the model weights at compile time.

**Prioritization suggestion:** Attack 5.1 + the first two bullets of 5.2 in the next 1–2 weeks. Measure latency to first TTS viseme and bundle size delta. Only then decide if a wasm size win justifies touching mlc-llm.

---

## 9. Model Artifact Customization (Companion to JS Runtime Fork)

### 9.1 The Two-Build Story

The project now has **two symmetric build scripts** for the WebLLM stack:

| Script | What it builds | Source | Output |
|--------|---------------|--------|--------|
| `scripts/build-webllm.sh` | JS runtime (engine, chat pipeline, cache utils) | `3rd_party/web-llm` (our fork) | `3rd_party/web-llm-dist/` |
| `scripts/build-vicuna-wasm.sh` | model_lib `.wasm` (TVM memory plan, kernels) | MLC-LLM upstream + Vicuna weights | `.vps-staging/wasm-libs/` |

`build-webllm.sh` is the "JS-side fork" story documented in this plan.  
`build-vicuna-wasm.sh` is the "model artifact" story — it produces custom `.wasm` files with baked-in small context windows (512, 1024) so the TVM memory planner allocates less at `CreateMLCEngine` time.

### 9.2 Why Custom `.wasm` Matters for Low VRAM

The generic MLC-prebuilt `.wasm` (`Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`) reserves buffers for a 4096-token context. Even when we pass `context_window_size: 512` as a runtime override, the `.wasm` has already laid out memory for 4K. A custom-compiled `.wasm` with `context_window_size: 512` in `mlc-chat-config.json` gives TVM's memory planner a tighter budget from the start.

**Measured win:** ~300 MB lower peak VRAM for the 512-ctx variant vs generic 4K .wasm + overrides (3.2 GB vs 3.5 GB). This is the difference between loading successfully and OOM-ing on a 4 GB GPU.

### 9.3 Build Flow

1. `mlc_llm convert_weight lmsys/vicuna-7b-v1.5 --quantization q4f32_1` (produces shards)
2. `mlc_llm gen_config ... --conv-template vicuna_v1.1` (produces `mlc-chat-config.json`)
3. Patch `mlc-chat-config.json` to set `context_window_size` and `prefill_chunk_size` to 512 or 1024
4. `mlc_llm compile mlc-chat-config.json --device webgpu -o vicuna-7b-ctx512.wasm`
5. Stage to `.vps-staging/wasm-libs/` and upload to VPS

The script handles steps 1–5 automatically, including prerequisite checks.

### 9.4 Integration with the Multi-Engine Architecture

The custom `.wasm` is just another `model_lib` URL in `src/config/models.ts`. The rest of the stack (`EngineFactory`, `MlcEngineAdapter`, `AgentModelManager`, `dynamicContext.ts`) is unchanged. The custom `.wasm` is an optimization, not a new engine.

```typescript
// src/config/models.ts
VPS_VICUNA_7B_CTX512: {
  model_id: "vicuna-7b-q4f32-webllm-ctx512",
  model: `${VPS_STORAGE_URL}/vicuna-7b-q4f32-webllm/`,
  model_lib: `${VPS_STORAGE_URL}/wasm-libs/vicuna-7b-q4f32_1-ctx512_cs1k-webgpu.wasm`,
  overrides: { context_window_size: 512, prefill_chunk_size: 512 },
  vram_required_MB: 3200,
}
```

### 9.5 CI / Reproducibility

- `.github/workflows/build-vicuna-wasm.yml` is a manually-triggered workflow that installs the heavy build environment and runs `build-vicuna-wasm.sh`
- For faster iteration, the script can be run inside a Docker image with mlc-llm + emsdk pre-installed, or on Google Colab (see `public/Jokesters_WebLLM_Compile.ipynb`)
- The `.wasm` output is tiny (~3–6 MB) and is uploaded as a GitHub Actions artifact, then to the VPS

### 9.6 References

- Build script: `scripts/build-vicuna-wasm.sh`
- CI workflow: `.github/workflows/build-vicuna-wasm.yml`
- **Primary Colab notebook:** `public/Jokesters_WebLLM_Compile.ipynb` (full pipeline: convert, gen_config, compile, package, test)
- Legacy Vicuna notebook: `public/Github_ConvertVicuna.ipynb` (deprecated — redirects to the notebook above)
- VRAM docs: `docs/VRAM_OPTIMIZATION_IMPLEMENTATION.md` §1.4
- Model loading docs: `docs/MODEL_LOADING.md` §1D

---

## 6. Open Questions (Answer These Next)

1. **Concrete comedy behaviors:** What exact generation artifacts do we want that current sampling + long system prompts cannot reliably deliver? (e.g. "always deliver exactly one setup + one punchline + optional tag under 80 tokens")
2. **Size targets:** Current webllm-engine chunk + transitive cost? What is the acceptable delta if we vendor a pruned fork?
3. **Worker migration:** Do we want the Mlc path to *always* run in a worker going forward? (Impacts Three.js/Director/TTS scheduling.)
4. **Patching vs fork merging:** Do we prefer a thin fork that we rebase, or a set of small maintained `.patch` files applied by the build script against upstream tags?
5. **CI integration:** `USE_CUSTOM_WEBLLM=1` is opt-in via env flag; see `.github/workflows/build-webllm.yml` and `npm run build:custom-webllm`. Default `npm run build` keeps the npm package.
6. **New model needs:** Are we planning any non-Llama/Hermes architectures soon, or only quant/context variants of existing ones?
7. **JSON mode / function calling / vision:** How heavily will future "Expanded Reality", "Script", or "Watcher" modes rely on these web-llm features? (Directly affects safe pruning.)
8. **TVM runtime vendoring:** Do we also want to fork/patch `@mlc-ai/web-runtime` (the tvmjs glue) or is that out of scope?
9. **Legal / licensing:** WebLLM is Apache-2.0; confirm our fork + any patches stay compatible (especially if we publish the custom wasm libs).

---

## 7. Immediate Next Steps (Actionable)

1. **Review & approve this plan** (this document).
2. **Land the scaffolding:**
   - `scripts/build-webllm.sh` (executable, well-commented)
   - `patches/web-llm/.gitkeep`
   - `3rd_party/web-llm-dist/.gitkeep` + `.gitignore` entry
   - Optional: thin `src/vendor/webllm/README.md` explaining the consumption strategy
3. **Prototype one win:** Add a `ComedyLogitProcessor` (or similar) in the fork under `src/comedy/` (or directly in llm_chat if it needs pipeline access) and wire it through `MlcEngineAdapter`.
4. **Measure:** Before/after bundle size (use existing `npm run perf` or `vite build --manifest`) and first-token-to-viseme latency on a 3B model.
5. **Decide consumption pattern** and land the minimal vite.config + tsconfig changes behind a flag or comment.
6. **Update CLAUDE.md / AGENTS.md** with a one-paragraph pointer to this plan and the build script.

---

## 8. Starter `scripts/build-webllm.sh` Template

See the companion file created alongside this document:

```bash
#!/usr/bin/env bash
# scripts/build-webllm.sh
# Builds the web-llm fork from 3rd_party/web-llm and prepares artifacts for consumption.
# Run this whenever you change code in the submodule.
```

(The actual script is created in the same PR/commit as this plan.)

---

## Appendix A: Key Files to Study in the Fork (First Week)

- `src/engine.ts`, `src/llm_chat.ts` — the heart of generation
- `src/cache_util.ts` — integration point with our SW + ParallelDownloadManager
- `src/web_worker.ts` — future off-main-thread home
- `src/config.ts` — `AppConfig`, `ModelRecord`, `modelLibURLPrefix`
- `src/support.ts` — model selection & config merging logic
- `rollup.config.js` + `cleanup-index-js.sh` — bundle shape
- `package.json` devDeps — `@mlc-ai/web-runtime`, `@mlc-ai/web-tokenizers`, `@mlc-ai/web-xgrammar`

## Appendix B: References

- Upstream web-llm: https://github.com/mlc-ai/web-llm
- Our fork: https://github.com/ford442/web-llm
- MLC-LLM web deployment docs: https://llm.mlc.ai/docs/deploy/webllm.html
- Binary libs (prebuilts): https://github.com/mlc-ai/binary-mlc-llm-libs/tree/main/web-llm-models
- Current project model hosting: [docs/MODEL_HOSTING.md](./MODEL_HOSTING.md)

---

**This plan prioritizes clarity, long-term maintainability, and practical comedy-app wins over heroic low-level hacks.** It fits the existing engineering style of the project (clear docs, shell scripts for repeatable ops, strict TypeScript, aggressive perf budgeting, and progressive enhancement of the multi-engine story).

---

*End of investigation summary.*