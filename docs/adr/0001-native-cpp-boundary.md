# ADR 0001 — Native C++ / compile boundary for The Jokesters

| Field | Value |
|-------|--------|
| **Status** | Accepted |
| **Date** | 2026-07-11 |
| **Deciders** | Project maintainers |
| **Priority** | P2 — Strategic guardrail |
| **Related** | [webllm-customization-plan.md](../webllm-customization-plan.md), [WASM_CONTEXT_GUIDE.md](../WASM_CONTEXT_GUIDE.md), [VRAM_OPTIMIZATION_IMPLEMENTATION.md](../VRAM_OPTIMIZATION_IMPLEMENTATION.md), [MODEL_LOADING.md](../MODEL_LOADING.md), GitHub **#119** (llama.cpp / wllama source path) |

---

## Context

The Jokesters is **primarily TypeScript in the browser**. Comedy product value lives in orchestration (Director, modes, prerender, TTS/SFX, avatars), not in shipping first-party native code.

C++ enters the runtime **only** as prebuilt WebAssembly:

| Component | Role | Source of truth |
|-----------|------|-----------------|
| MLC `model_lib` WebGPU WASM | Graph + memory plan for a quant/context | `mlc_llm compile` + TVM + Emscripten |
| `@wllama/wllama` | llama.cpp WASM (CPU / no-WebGPU fallback) | npm package; verify with `npm run verify:wllama` |
| `onnxruntime-web` | Supertonic TTS inference | npm package |

There is **no first-party C++ tree** in this repo, and **that is intentional and correct**.

Agents and contributors repeatedly thrash native toolchains (full TVM/emsdk installs, private llama.cpp forks) without ROI. This ADR is the decision framework that stops that thrash.

---

## Decision

### Default: stay in TypeScript

1. **Orchestration, comedy logic, UI, engines adapters, VRAM JS overrides** remain in `src/` TypeScript.
2. **Do not** add an in-repo full TVM / Emscripten / mlc-llm monorepo “for convenience.”
3. **Do not** maintain a private llama.cpp fork without CI that pins, builds, and verifies WASM against `@wllama/wllama`.
4. **Do not** implement comedy rules, Director logic, or mode prompts in C++.

### When native / compile work *is* allowed

Pursue custom C++/compile work **only if** one of these is **measured** (logs, OOM rates, VRAM probe, or perf budget):

| Need (measured) | Allowed path | Official entry |
|-----------------|--------------|----------------|
| Peak VRAM still too high **after** JS overrides (`dynamicContext`, blessed presets, guided load) | Custom `mlc_llm compile` with smaller **baked** context (same weights) | [`scripts/build-vicuna-wasm.sh`](../../scripts/build-vicuna-wasm.sh), Colab notebook below |
| Need ops not present in stock web-llm JS | Prefer **web-llm JS fork** (`3rd_party/web-llm` + `scripts/build-webllm.sh`) before forking mlc-llm/TVM | [webllm-customization-plan.md](../webllm-customization-plan.md) |
| Need ops not in stock **model_lib** WASM | Fork mlc-llm / TVM schedules (**high cost** — requires explicit green-light metrics below) | Out of tree; not committed here |
| CPU fallback quality/speed insufficient | (1) Fix **wllama version pin** + `npm run verify:wllama`; (2) only then optional custom llama.cpp build | **#119**, `scripts/verify_wllama_wasm.sh`, `scripts/wllama-wasm.manifest.json` |
| Multimodal Kimi-VL / audio | Separate research track; **must not** block comedy core | Optional API / experimental engines only |

### Official “native artifact” path (Vicuna small-context WASM)

This is the **only** first-class, documented native compile pipeline for product needs today:

| Artifact | How |
|----------|-----|
| **Script** | `CONTEXT_SIZE=512 ./scripts/build-vicuna-wasm.sh` (or `1024`) |
| **CI** | `.github/workflows/build-vicuna-wasm.yml` (manual dispatch) |
| **Colab / notebook (source of truth for manual path)** | [`public/Jokesters_WebLLM_Compile.ipynb`](../../public/Jokesters_WebLLM_Compile.ipynb) |
| **Related notebook** | [`public/Github_ConvertVicuna.ipynb`](../../public/Github_ConvertVicuna.ipynb) |
| **Stage outputs** | `scripts/stage_vicuna_wasm_from_ci.sh` → VPS `wasm-libs/` |
| **Why it exists** | Generic ctx4k `model_lib` peaks at init; JS `context_window_size: 512` cannot shrink that peak — see [WASM_CONTEXT_GUIDE.md](../WASM_CONTEXT_GUIDE.md) |

Companion (JS runtime, not C++):

| Artifact | How |
|----------|-----|
| web-llm fork build | `scripts/build-webllm.sh` / `npm run build:webllm` |
| Verify dist | `scripts/verify-webllm-dist.sh` |

### Explicit non-goals (for now)

- In-repo full TVM/Emscripten toolchain as a required developer dependency  
- Private llama.cpp fork without CI  
- Shipping C++ comedy logic  
- Blocking improv/TTS/avatar P0–P1 on multimodal native research  

---

## Success metrics — when to green-light *deeper* C++ work

Deeper work means: private TVM schedules, custom llama.cpp trees, or permanent heavy native CI on every PR.

**Do not start** until at least one row is true with evidence linked in an issue:

| Track | Green-light criterion | Evidence |
|-------|----------------------|----------|
| **A. Custom model_lib beyond Vicuna ctx scripts** | ≥**15%** absolute increase in successful `CreateMLCEngine` on target 4 GB class devices vs best JS + existing ctx512/1024 WASM | Browser matrix log, OOM category rates from `getErrorCategory` |
| **B. Custom llama.cpp / wllama rebuild** | After version-pin + verify is correct: median tokens/s on no-WebGPU path **≥1.5×** stock `@wllama/wllama`, or crash rate **&lt;1%** of sessions where stock fails | wllama bench + `#119` checklist |
| **C. Fork mlc-llm / TVM for new ops** | A **named** feature impossible in web-llm JS or existing compile flags (e.g. required kernel), with cost &lt; 2 engineering weeks of product TS work for equal comedy impact | Design note + rejection of JS alternatives |
| **D. Multimodal native** | Comedy core (guided load, prerender gap, TTS, export) meets its own acceptance; multimodal is **additive** funding | Product prioritization, not a side quest |

Until then: prefer **smaller blessed models**, **JS VRAM overrides**, **existing Vicuna compile script**, and **engine factory fallbacks** (MLC → Transformers → llama.cpp → API).

---

## Cross-links

| Topic | Link |
|-------|------|
| Vicuna / small-context WASM issue family | [WASM_CONTEXT_GUIDE.md](../WASM_CONTEXT_GUIDE.md), `scripts/build-vicuna-wasm.sh`, Colab `public/Jokesters_WebLLM_Compile.ipynb` |
| llama.cpp / wllama source & pin | GitHub **#119**, `scripts/verify_wllama_wasm.sh`, `package.json` `@wllama/wllama` |
| web-llm JS customization (prefer before C++) | [webllm-customization-plan.md](../webllm-customization-plan.md) |
| VRAM JS stack | [VRAM_OPTIMIZATION_IMPLEMENTATION.md](../VRAM_OPTIMIZATION_IMPLEMENTATION.md) |
| Scripts inventory | [scripts/README.md](../../scripts/README.md) |
| Product roadmap | [ROADMAP.md](../ROADMAP.md) |

---

## Consequences

**Positive**

- Agents and humans share one “don’t thrash native” rule.  
- Compile work is funneled through **one** Vicuna WASM pipeline + optional web-llm JS fork.  
- Comedy features stay reviewable in TypeScript.

**Negative / accepted costs**

- Peak VRAM for 7B on weak GPUs may require running the Vicuna compile pipeline (CI/Colab), not a local 5-minute fix.  
- Cutting-edge llama.cpp features lag until `#119` is done deliberately.  
- Multimodal stays secondary to the comedy core.

**Compliance**

- New PRs that add C++ trees, vendored emsdk, or undocumented compile steps should **cite this ADR** and the metric row that green-lit the work, or be closed as out of scope.

---

## Review

Revisit if:

- Browser WebGPU memory APIs change enough that JS overrides match custom WASM peaks, or  
- wllama becomes the primary engine for a large user segment, or  
- Product explicitly prioritizes multimodal native.

Until then: **TypeScript first; compile scripts only when measured.**
