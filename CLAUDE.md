# The Jokesters — Claude Development Guide

## Project Overview

A browser-based multi-agent comedy show powered by in-browser LLMs (MLC WebLLM / llama.cpp WASM /
Transformers.js / optional API), ONNX Supertonic TTS, and Three.js avatars with lip-sync and
procedural acting.

**5 agents:** The Comedian, The Philosopher, The Scientist, Chad Vanderblock (Tech Bro), Unit-734 (Robot).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | `@mlc-ai/web-llm`, `@wllama/wllama`, `@huggingface/transformers`, optional OpenAI-compatible API |
| TTS | ONNX Runtime Web + Supertonic (`VPS_STORAGE_URL/tts/onnx`) |
| 3D | Three.js 0.170 (WebGL2 default; optional WebGPU renderer) |
| Build | Vite 7, TypeScript 5.9, ES2022 |

## Key files

```
src/
  app/bootstrap.ts          App init, model load, SFX, scene wire-up
  GroupChatManager.ts       LLM chat, history, prerenderTurns
  config/models.ts          Model registry (uses VPS_STORAGE_URL)
  config/blessedPresets.ts  Curated 5-model launch list
  app/modelGuide.ts         Guided onboarding recommendations
  Director/Director.ts      Scene orchestrator (100+ modes via registry)
  prerender/                Adaptive LLM+TTS prerender coordinator
  audio/SfxManager.ts       Whitelisted SFX
  utils/vpsStorageUrl.ts    Canonical storage host (+ Vite env override)
  visuals/Stage.ts          Three.js stage + 5 actors
```

## Model hosting

- **Canonical origin:** `https://storage.1ink.us` (`VPS_STORAGE_ORIGIN` in `src/utils/vpsStorageUrl.ts`)
- **Override:** `VITE_VPS_STORAGE_ORIGIN` (see `.env.example`)
- **Mirror (ops):** `storage.noahcohn.com` — do not hardcode new app paths to the mirror
- Weights download at runtime and cache in the browser (Cache API / IndexedDB)

## Guided launch UX

Cold start probes WebGPU / f16 / VRAM, recommends primary + safe fallback from blessed presets,
shows download size estimate, persists last successful launch, and OOM panel can step down models.

## Development

```bash
npm ci
npm run dev          # http://localhost:5173
npm run typecheck    # tsc --noEmit (required before commit)
npm test             # Vitest unit tests
npm run build        # tsc + vite → dist/
npm run perf:quick
./scripts/build-webllm.sh   # custom web-llm (optional)
```

### TypeScript policy

- `strict: true` is on.
- `noUnusedLocals` / `noUnusedParameters` are currently **`false`** in `tsconfig.json` (legacy debt).
  Prefer not introducing new unused symbols; do not claim they are compiler-enforced until flipped on.
- PWA types: `/// <reference types="vite-plugin-pwa/client" />` in `src/vite-env.d.ts` — requires
  `npm ci` so `vite-plugin-pwa` is installed. Do **not** put `"types": ["vite-plugin-pwa/client"]`
  alone in `tsconfig.json`.

## Common errors

| Error | Fix |
|-------|-----|
| `ExitStatus: exit(1)` | Wrong WASM for model / GPU OOM — pass `appConfig`; use q4f16/q4f32 appropriately |
| `WebGPU not supported` | Chrome/Edge 113+; or use llama.cpp blessed preset |
| Model 404 `/resolve/main/` | VPS rewrites must be installed (`installVpsStorageRewrites`) |

## Deployment

```bash
export DEPLOY_USER=...
export DEPLOY_KEY=~/.ssh/id_ed25519   # preferred; never commit
npm run deploy:dry                   # build + dry-run
npm run deploy                       # build + upload
```

See `docs/DEPLOY_CHECKLIST.md` and `scripts/README.md`. Secrets only via env / Actions secrets.

## Roadmap

Strategic plans: [docs/ROADMAP.md](./docs/ROADMAP.md).  
`agent_plan.md` is a stub pointing here — not a living mode checklist.

## Native C++ / compile work

**Default: do not.** This is a TypeScript browser app; C++ only arrives as prebuilt WASM
(MLC `model_lib`, wllama, onnxruntime-web). See **[docs/adr/0001-native-cpp-boundary.md](./docs/adr/0001-native-cpp-boundary.md)**.

Official compile path when peak VRAM needs a smaller baked context:
- `scripts/build-vicuna-wasm.sh` / CI `build-vicuna-wasm.yml`
- Colab: `public/Jokesters_WebLLM_Compile.ipynb`

## New Director modes

**Quality bar (P0):** [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md) — registry + ModeContext/comedy + metadata + non-duplicate premise.  
Prefer fixing humor on an existing mode. Low-effort mode spam may be closed. See [CONTRIBUTING.md](./CONTRIBUTING.md).
