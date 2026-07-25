# The Jokesters - Agent Guide

## Project Overview

**The Jokesters** is a multi-agent comedy chat application that runs entirely in the browser using WebGPU (and WASM fallback) acceleration. It features five AI agents with distinct personalities that engage in improvised comedy conversations powered by in-browser Large Language Models (LLM), real-time text-to-speech (TTS) with lip-sync, and Three.js 3D avatar visualization.

### Key Features
- **Triple-engine in-browser LLM inference**: MLC WebLLM (WebGPU), llama.cpp WASM (`@wllama/wllama`), Transformers.js (ONNX/WebGPU), and an optional API fallback
- **100+ interaction modes** across categories:
  - *Improv / Autonomous*: Improv Mode, Autonomous Loop
  - *Media*: Watcher Mode (video reaction), Vision Mode
  - *Reporter*: Reporter Mode, Newsroom Mode, Meltdown Mode
  - *Performance*: Roast Mode, Story Mode, Debate Mode, Musical Mode, Podcast/Interview Mode, Standup Mode, Script Mode, Dream Mode, Historical Mode, Commentary Mode
  - *Interactive*: Trial Mode, Tech Support Mode, Dungeon Master Mode, Trivia Mode, Code Review Mode, Therapy Mode, Dating Show, Silent Treatment, Intervention, Support Group, Customer Service Hell, and many more
  - *Creative / Reality-expanded*: Mystery Mode, Pitch Mode, Haunted House, Sports Commentary, Reality TV, Auction House, Escape Room, Time Loop, Superhero, Conspiracy, Silent Film, Procedural, Lightning Round, Rapid Fire variants, and 70+ additional "Dream" and "Expanded Reality" modes
- **5 Unique Agent Personas**: The Comedian, The Philosopher, The Scientist, Chad Vanderblock (Tech Bro), and Unit-734 (Deadpan Robot)
- **3D agent visualization** using Three.js with lip-sync, blinking, volume-reactive squash/stretch, and spotlight highlighting
- **Real-time text-to-speech (TTS)** using an ONNX-based Supertonic pipeline with 4 voice styles (M1, M2, F1, F2)
- **Dynamic model swapping** allowing different LLMs per agent to fit within VRAM constraints
- **Memory management** with IndexedDB/`localStorage` persistence and optional HuggingFace cloud sync
- **Voice input** support using the Web Speech API
- **Comedy Engine** with callback tracking (bell curve decay), quality gating, and conversation branching
- **Service Worker** for parallel model downloads via byte-range requests (42MB chunks, 4 connections)
- **Backend proxy** (`backend/llama_proxy.py`) — FastAPI OpenAI-compatible proxy for local llama-server

### Architecture Philosophy: "The Digital Director"
The system follows a **Centralized Director / Stateless Actor** model:
- **Agents** (`Comedian`, `Philosopher`, `Scientist`, `TechBro`, `Robot`) are stateless configurations (prompts + visual params)
- **The Director** (`Director` class) orchestrates the scene, manages state, decides turn-taking, and injects environmental context
- **GroupChatManager** handles LLM interactions with retry logic and VRAM management
- **AgentModelManager** manages per-agent model assignments and hot-swapping
- **LLM Engine Factory** (`src/llm/EngineFactory.ts`) selects the best engine (MLC / llama.cpp / Transformers.js / API) based on browser capabilities and model config

### Native C++ / WASM policy
There is **no first-party C++ tree**. Native code arrives only as prebuilt WASM (MLC `model_lib`, `@wllama/wllama`, onnxruntime-web). Comedy orchestration stays in TypeScript.

- **ADR (read before thrashing toolchains):** [docs/adr/0001-native-cpp-boundary.md](./docs/adr/0001-native-cpp-boundary.md)
- **Official Vicuna small-context compile:** `scripts/build-vicuna-wasm.sh`, Colab `public/Jokesters_WebLLM_Compile.ipynb`
- **wllama / llama.cpp deeper work:** GitHub **#119** + `npm run verify:wllama` first

### New Director modes — quality bar (P0 process)

Recent history over-indexed on new Dream/Expanded modes while foundation debt grew. **New modes must meet a quality bar** or maintainers may close the PR with a checklist link.

**Canonical checklist:** [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md) · **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)

1. Registered via **Mode Registry** (`MODE_REGISTRY` / `registryEntries`) — registry already exists; do not add orphan loops  
2. Uses shared **`ModeContext`**; comedy hooks supported (`src/comedy/comedyModeHelpers.ts`, `ctx.comedy`)  
3. Short UI **description** + **tags** + **`estimatedTurns`** on the registry entry  
4. Does **not** duplicate an existing premise without a twist **documented in the PR**  
5. Prefer improving **one existing mode’s humor** over adding three new ones  

PR template (also in the quality bar doc): premise one-liner, agent roles, why funnier than freeform improv, callback opportunities, token budget notes.

Foundation focus list: [agent_plan.md](./agent_plan.md) (not a mode checklist).

---

## Technology Stack

### Core Technologies
| Technology | Purpose | Version |
|------------|---------|---------|
| **TypeScript** | Primary language | ~5.9.3, ES2022 target |
| **Vite** | Build tool and dev server | ^7.2.4 |
| **Three.js** | 3D visualization and WebGL rendering | 0.170.0 |
| **@mlc-ai/web-llm** | In-browser LLM inference via WebGPU | ^0.2.8 |
| **@wllama/wllama** | llama.cpp WASM engine for GGUF models | ^2.3.7 |
| **@huggingface/transformers** | Transformers.js ONNX/WebGPU engine | ^4.0.1 |
| **onnxruntime-web** | TTS model inference | ^1.17.0 |
| **vite-plugin-static-copy** | Asset copying | ^3.1.4 |

### Development Dependencies
- `typescript`: ~5.9.3 with strict mode enabled
- `tsx`: ^4.21.0 for TypeScript execution
- `@types/node`: ^24.10.1
- `@types/three`: 0.170.0

### Runtime Requirements
- Modern browser with **WebGPU** support (Chrome 113+, Edge 113+, Opera 99+)
- Recommended **4GB+ VRAM**
- All LLM inference runs client-side; no server required for basic operation

---

## Project Structure

```
the_jokesters/
├── src/
│   ├── main.ts                    # Application entry point, UI setup, event handlers, service worker registration
│   ├── GroupChatManager.ts        # LLM chat management, conversation history, agent rotation, retry logic
│   ├── AgentModelManager.ts       # Per-agent model assignment and hot-swapping
│   ├── Director/                  # Scene orchestration and mode implementations
│   │   ├── Director.ts            # Main orchestration class (game loop), Scenario execution, 100+ mode dispatch
│   │   ├── MemoryManager.ts       # Episode persistence (IndexedDB + localStorage + HuggingFace cloud)
│   │   ├── HFStorageManager.ts    # HuggingFace Hub API integration
│   │   ├── ScriptGenerator.ts     # AI-powered script generation
│   │   ├── ScriptParser.ts        # Script parsing utilities
│   │   ├── MediaReactionManager.ts # Video reaction trigger handling
│   │   └── modes/                 # Mode implementations (100+ modes)
│   │       ├── ModeContext.ts     # Shared context interface for all modes
│   │       ├── ImprovMode.ts      # Improv and autonomous conversation loops
│   │       ├── MediaMode.ts       # Video reaction and vision analysis loops
│   │       ├── ReporterMode.ts    # News/Reporter mode with data fetching
│   │       ├── InteractiveMode.ts # Trial, Tech Support, DM, Trivia, Interview, etc.
│   │       ├── PerformanceMode.ts # Roast, Story, Debate, Musical, Podcast, Script, Dream, Historical, Commentary
│   │       ├── CreativeMode.ts    # Creative writing, mystery, pitch, procedural
│   │       ├── TherapyMode.ts     # Therapy/support mode
│   │       ├── CodeReviewMode.ts  # Code review mode
│   │       ├── DreamModes.ts      # 40+ surreal/absurdist modes
│   │       ├── ExpandedRealityModes.ts # 40+ reality-expanded modes
│   │       ├── RapidFireMode.ts   # Rapid-fire trivia/roast/association/this-or-that
│   │       ├── LightningRoundMode.ts
│   │       ├── PhilosopherMode.ts
│   │       ├── AlienMode.ts
│   │       └── RapBattleVisualsMode.ts
│   ├── audio/                     # Text-to-speech and audio systems
│   │   ├── AudioEngine.ts         # TTS audio synthesis orchestration
│   │   ├── OptimizedAudioEngine.ts # Optimized TTS with Web Workers, phoneme cache, viseme lookahead
│   │   ├── MusicEngine.ts         # Beat generation for musical mode
│   │   ├── SpeechQueue.ts         # Speech playback queue management
│   │   ├── OptimizedSpeechQueue.ts # Optimized speech queue
│   │   ├── Supertonic.ts          # Core TTS ONNX inference (legacy)
│   │   ├── SupertonicPipeline.ts  # TTS pipeline stages (current): text encoder, duration predictor, vector estimator, vocoder
│   │   ├── VoiceInputManager.ts   # Web Speech API voice input
│   │   ├── VisemePredictor.ts     # Lip-sync viseme prediction
│   │   ├── PhonemeCache.ts        # Phoneme caching for TTS
│   │   ├── TTSLatencyProfiler.ts  # TTS performance profiling
│   │   ├── TTSBenchmark.ts        # TTS benchmarking utilities
│   │   └── worker/                # Web Workers
│   │       ├── audio.worker.ts    # Web Worker for audio processing
│   │       └── tts.worker.ts      # Web Worker for TTS synthesis
│   ├── comedy/                    # Comedy engine components
│   │   ├── callbackEngine.ts      # Running gag callback tracking with bell curve decay
│   │   ├── jokeLoader.ts          # Joke database loading
│   │   ├── qualityFilter.ts       # Joke quality rating/filtering, homograph detection for TTS
│   │   └── bits/                  # Pre-written comedy bits (JSON)
│   │       ├── absurdist.json
│   │       ├── crowd_work.json
│   │       └── dark_tech.json
│   ├── llm/                       # Triple-engine LLM abstraction + API fallback
│   │   ├── EngineFactory.ts       # Factory for selecting/creating engines
│   │   ├── LLMEngine.ts           # Unified engine interface
│   │   ├── MlcEngineAdapter.ts    # MLC WebLLM adapter
│   │   ├── LlamaCppEngineAdapter.ts # wllama (llama.cpp WASM) adapter
│   │   ├── TransformersEngineAdapter.ts # Transformers.js adapter
│   │   ├── ApiEngineAdapter.ts    # OpenAI-compatible API adapter
│   │   └── index.ts               # Re-exports
│   ├── visuals/                   # 3D visualization
│   │   ├── Actor.ts               # 3D agent representation (capsule with face, eyes, mouth)
│   │   ├── TechBroActor.ts        # Custom Tech Bro actor with gesture animations
│   │   ├── DeadpanRobotActor.ts   # Custom Robot actor with mechanical animations
│   │   ├── Stage.ts               # Three.js scene management, lighting, rendering, audience InstancedMesh
│   │   ├── LipSync.ts             # Lip synchronization with audio volume
│   │   └── CallbackVisualizer.ts  # Visual feedback for callbacks
│   ├── services/                  # External services
│   │   ├── DataFetchService.ts    # Wikipedia, Hacker News fetching for Reporter mode
│   │   └── ParallelDownloadManager.ts # Parallel download orchestration
│   ├── config/                    # Configuration
│   │   ├── agents.ts              # Agent definitions (personalities, prompts, colors)
│   │   ├── models.ts              # LLM model configurations (VPS, HF, unified, triple-engine)
│   │   └── improvSetups.ts        # Pre-defined improv scene setups
│   ├── ui/                        # UI utilities
│   │   └── BeatGenerator.ts       # Simple beat animation for musical mode
│   ├── utils/                     # Utilities
│   │   ├── RNG.ts                 # Seeded random number generator
│   │   ├── performanceTest.ts     # Performance testing utilities
│   │   └── dynamicContext.ts      # Dynamic context window / VRAM optimization
│   ├── prompts/                   # Persona prompts (loaded as text)
│   │   ├── robot.ts               # Robot persona prompt
│   │   └── techBro.ts             # Tech Bro persona prompt
│   ├── types/                     # TypeScript type declarations
│   │   ├── webllm.d.ts
│   │   ├── three.d.ts
│   │   ├── onnxruntime-web.d.ts
│   │   ├── vite-plugin-static-copy.d.ts
│   │   ├── vite.d.ts
│   │   └── style.d.ts
│   ├── test/                      # Test utilities
│   │   ├── chaosTest.ts           # Chaos testing
│   │   ├── chaosTestRunner.cjs    # Chaos test runner (CommonJS)
│   │   ├── integrationChaosTest.ts # Integration chaos tests
│   │   └── runChaosTests.ts       # Chaos test runner
│   ├── service-worker.ts          # Service worker for parallel model downloads
│   ├── improv/                    # Conversation branching utilities
│   │   └── branching.ts
│   └── style.css                  # Application styles
├── tests/                         # Performance test suite
│   ├── perf/                      # Performance benchmarks
│   │   ├── FPSBenchmark.ts        # Frame rate benchmarking
│   │   ├── LLMThroughputBenchmark.ts # LLM token throughput
│   │   ├── MemoryLeakTest.ts      # Memory leak detection
│   │   ├── TTSLatencyBenchmark.ts # TTS latency testing
│   │   ├── PerformanceMonitor.ts  # Performance monitoring
│   │   ├── ci-runner.ts           # CI test runner (Node-compatible via mocks)
│   │   ├── browser-runner.html    # Browser-based test runner
│   │   ├── setup-env.ts           # Mock browser environment for Node.js
│   │   ├── index.ts               # Test exports
│   │   └── README.md              # Performance testing docs
│   └── engine-comparison/         # Engine comparison tests
│       ├── index.html
│       └── test-runner.ts
├── backend/                       # Optional backend proxy
│   └── llama_proxy.py             # FastAPI OpenAI-compatible proxy for llama-server
├── public/                        # Static assets served directly
│   ├── jokes/                     # Joke databases
│   ├── scenarios/                 # Test scenarios
│   └── tts/                       # TTS assets (if bundled locally)
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md            # System architecture documentation
│   ├── COMEDY_GUIDE.md            # Comedy system documentation
│   ├── PERFORMANCE.md             # Performance guardrails documentation
│   ├── MODEL_HOSTING.md           # Model hosting guide
│   ├── PARALLEL_DOWNLOADS.md      # Service worker / parallel download docs
│   ├── VRAM_OPTIMIZATION_IMPLEMENTATION.md
│   ├── VRAM_RESEARCH_SUMMARY.md
│   ├── bundle-analysis.md         # Bundle analysis
│   ├── chaos-report.md            # Chaos testing report
│   ├── integration-log.md         # Integration log
│   └── smoke-test-passed.md       # Smoke test results
├── .github/workflows/
│   └── performance.yml            # GitHub Actions CI for perf tests + bundle size check
├── scripts/                       # Utility scripts
│   ├── download_models_on_vps.py
│   ├── migrate_all_models.py
│   ├── test_model_loading.py
│   ├── upload_staged_to_vps.py
│   ├── verify_model_urls.py
│   └── verify_vps_headers.py
├── dist/                          # Production build output
├── models/                        # Local model artifacts (tokenizer, config)
│   ├── onnx/
│   ├── config.json
│   ├── tokenizer.json
│   └── tokenizer_config.json
├── .vps-staging/                  # Staged model files for VPS deployment
├── verification/                  # Screenshot verification assets
├── index.html                     # HTML entry point (WebGPU detection, runtime error surfacing)
├── package.json                   # Node.js dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── perf-budget.json               # Performance budget thresholds
├── scripts/
│   ├── deploy_dist.py             # SFTP deploy of dist/ (credentials via env only)
│   ├── smoke_test.py              # Playwright-oriented smoke test
│   └── README.md                  # Script inventory + env vars
├── .env.example                   # VITE_VPS_STORAGE_ORIGIN sample
└── docs/ROADMAP.md                # Strategic product roadmap
```

---

## Build and Development Commands

### Prerequisites
- Node.js 18+
- A modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Sufficient GPU memory (recommended: 4GB+ VRAM)
- Python 3.x (for deployment and smoke tests)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
- Starts the Vite dev server at `http://localhost:5173/`
- Supports hot module replacement

### Production Build
```bash
npm run build
```
- Compiles TypeScript and bundles with Vite
- Outputs to `dist/` directory
- Copies ONNX WASM files to `dist/assets/ort/`
- Produces a stable `service-worker.js` filename (required for SW registration)

### Typecheck
```bash
npm run typecheck
```
- Runs `tsc --noEmit` (same gate as `npx tsc --noEmit` in `CLAUDE.md`)
- CI workflow `.github/workflows/typecheck.yml` runs this on every PR touching `src/`, `tests/`, or TypeScript config
- Requires a full `npm ci` install — PWA client types come from the `vite-plugin-pwa` devDependency via `src/vite-env.d.ts`

### Preview Production Build
```bash
npm run preview
```
- Serves the `dist/` directory locally

### Performance Testing
```bash
# Run all benchmarks (CI mode)
npm run perf

# Quick test (30 seconds)
npm run perf:quick

# Full test (5 minutes)
npm run perf:full

# CI mode with JSON output
npm run perf:ci

# Browser-based test runner
npm run perf:browser
```

### Smoke Testing
```bash
python scripts/smoke_test.py
```
- Validates build, agent configuration, CallbackEngine, QualityFilter, TTS setup
- Uses Playwright for browser automation testing
- Writes results to `docs/smoke-test-passed.md`
- Note: some paths assume Docker/`cwd` layouts — see script header

### Deployment
```bash
export DEPLOY_HOST=1ink.us
export DEPLOY_USER=...
export DEPLOY_KEY=~/.ssh/id_ed25519          # preferred (password optional fallback)
# export DEPLOY_PASS=...                     # only if no key
export DEPLOY_REMOTE_DIR=/var/www/the-jokesters

npm run deploy:dry      # build + list remote actions (no writes)
npm run deploy          # build + upload
npm run deploy:verify   # build + upload + SHA-256 sample check
```
- Script: `scripts/deploy_dist.py` (Paramiko SFTP)
- **Key auth preferred** (`DEPLOY_KEY`); password fallback `DEPLOY_PASS`
- **Refuses `CHANGEME` placeholders**; no secrets in the repo
- **`--dry-run`** / `npm run deploy:dry`; optional `--clean` / `DEPLOY_CLEAN=1` (destructive)
- Optional CI: `.github/workflows/deploy.yml` (`workflow_dispatch` + Actions secrets)
- See `scripts/README.md` and `docs/DEPLOY_CHECKLIST.md`

---

## Code Style Guidelines

### TypeScript Conventions
- **Strict mode enabled**: All strict TypeScript compiler options are on
- **Explicit types**: Prefer explicit return types on public methods
- **ES modules**: Uses ES2022 module syntax (`import`/`export`)
- **Unused locals/params**: `noUnusedLocals` / `noUnusedParameters` are currently **off** in `tsconfig.json` (prefer clean code anyway; do not re-enable casually without a cleanup PR)
- **No fallthrough**: `noFallthroughCasesInSwitch` is enabled
- **Erasable syntax only disabled**: `@wllama/wllama` uses non-erasable syntax, so `erasableSyntaxOnly` is explicitly disabled
- **Verbatim module syntax**: `verbatimModuleSyntax: true` enforces `type` imports for types
- **No unchecked side effect imports**: `noUncheckedSideEffectImports: true`

### Naming Conventions
- **Classes**: PascalCase (e.g., `GroupChatManager`, `Director`)
- **Interfaces**: PascalCase with descriptive names (e.g., `DirectorCallbacks`, `AgentModelMapping`)
- **Methods/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **File names**: PascalCase for classes, camelCase for utilities

### Code Organization
- One class per file (generally)
- Group related functionality into directories (`audio/`, `visuals/`, `Director/`, `llm/`)
- Type declarations in `src/types/`
- Utilities in `src/utils/`
- Configuration in `src/config/`
- UI helpers in `src/ui/`

### Comments
- Use JSDoc for public methods
- Inline comments for complex logic
- Section headers for related groups of functionality

---

## Key Classes and Modules

### GroupChatManager
**File**: `src/GroupChatManager.ts`

Manages LLM interactions and conversation state:
- Initializes and terminates the MLCEngine with retry logic (3 attempts)
- Handles conversation history (max 8 messages to prevent VRAM exhaustion)
- Manages agent rotation and persona switching
- Applies profanity level settings (PG, CASUAL, GRITTY, UNCENSORED)
- Supports language switching
- Implements retry logic with exponential backoff for model loading
- Cache clearing on network errors
- Interrupt handling for stopping generation
- Token-level dynamic context window management via `DynamicContextManager`

### Director
**File**: `src/Director/Director.ts`

Central orchestrator for all interaction modes. Supports 100+ scenario types including:
- **Improv Mode**: Autonomous agent conversations with chaos injection
- **Watcher Mode**: Video reaction with time-synced triggers
- **Reporter Mode**: Discussion of live topics with context injection
- **Script Mode**: Performance of AI-generated or pre-written scripts
- **Interactive Modes**: Trial, Tech Support, Dungeon Master, Trivia, Interview, Dating Show, Silent Treatment, Intervention, Support Group, Customer Service Hell, and more
- **Performance Modes**: Roast, Story, Debate, Musical, Podcast, Dream, Historical, Commentary, Standup
- **Creative / Expanded Modes**: Mystery, Pitch, Haunted House, Reality TV, Auction House, Escape Room, Time Loop, Conspiracy, Silent Film, Procedural, Lightning Round, Rapid Fire variants, and 70+ Dream/Expanded Reality modes
- Manages turn-taking, pacing (punchline/standard/rant), and scene lifecycle
- Auto-saves episodes to memory on scene stop

### EngineFactory
**File**: `src/llm/EngineFactory.ts`

Factory for creating and selecting LLM engines:
- Detects browser capabilities (WebGPU, WASM, SIMD, threads, shader-f16)
- Auto-selects the best engine: MLC WebLLM (WebGPU) → Transformers.js (ONNX/WebGPU) → llama.cpp WASM (CPU) → API fallback
- Supports manual engine preference override
- Validates model compatibility per engine

### AgentModelManager
**File**: `src/AgentModelManager.ts`

Handles per-agent LLM model assignment:
- Maintains mapping of agent IDs to model IDs
- Hot-swaps models between turns to stay within VRAM limits
- Only one model loaded at a time
- Reports progress during model swaps with scaled percentages

### AudioEngine / OptimizedAudioEngine
**Files**: `src/audio/AudioEngine.ts`, `src/audio/OptimizedAudioEngine.ts`

Text-to-speech orchestration:
- Maps agent IDs to voice styles (M1, M2, F1, F2)
- Configurable speed (0.5-2.0) and quality (diffusion steps 1-50)
- Loads voice styles from `./tts/voice_styles/`
- Optimized version uses Web Workers for off-main-thread synthesis
- Viseme prediction lookahead (predict next 3 phonemes while speaking current)
- Phoneme pre-cache for common sounds
- Agent-to-voice mapping:
  - Comedian → F1 (Female voice, fast)
  - Philosopher → M2 (Deep/slow male voice)
  - Scientist → M1 (Standard male voice)
  - Tech Bro → M1 with speed boost
  - Robot → M2 with robot-like pacing

### Stage
**File**: `src/visuals/Stage.ts`

Three.js scene management:
- Creates and manages 3D actors (capsules with animated eyes, mouth, accessories)
- Custom actors: TechBroActor with gesture animations, DeadpanRobotActor with mechanical timing
- Handles window resize
- Integrates lip-sync with audio volume for real-time mouth animation
- Spotlight highlighting for active speaker
- InstancedMesh for audience members (single draw call)
- Professional stage lighting: three colored directional lights + rim light + ambient

### MemoryManager
**File**: `src/Director/MemoryManager.ts`

Episode persistence system:
- Local storage using IndexedDB with `jokesters-` prefix
- Optional cloud sync to HuggingFace Hub via `HFStorageManager`
- Episode search and recall functionality
- Profile-based namespacing

### CallbackEngine
**File**: `src/comedy/callbackEngine.ts`

Running gag tracking system:
- Registers jokes with themes and context
- Tracks callback usage with bell curve decay (peak at 3rd use, 1.5x value; dead by 6th+)
- Status calculation: fresh → building → peak → declining → dead
- Theme-based joke retrieval for contextual callbacks

### QualityFilter
**File**: `src/comedy/qualityFilter.ts`

Joke quality assessment:
- Rates jokes on surprise metrics (1-10 scale)
- Criteria: Subversion (35%), Wordplay (25%), Timing (20%), Originality (20%)
- Homograph detection for TTS optimization (e.g., "read" → "reed"/"red")
- Pattern-based analysis for cliché detection

### Service Worker
**File**: `src/service-worker.ts`

Parallel model download optimization:
- Intercepts fetches for large model files (`.safetensors`, `.bin`, `.gguf`, `.wasm`)
- Splits downloads into 42MB chunks
- Uses 4 parallel connections with HTTP Range requests
- Exponential backoff retry (max 3 retries, 500ms base delay)
- Temporary in-memory caching

### PWA (Progressive Web App)
**Files**: `vite.config.ts`, `src/main.ts`, `src/vite-env.d.ts`, `src/service-worker.ts`

Offline install and service-worker registration via `vite-plugin-pwa`:
- **Strategy**: `injectManifest` — the custom `src/service-worker.ts` is the SW source; the plugin injects the web manifest at build time
- **Registration**: `registerSW()` from `virtual:pwa-register` in `main.ts` (auto-update, `onNeedRefresh` / `onOfflineReady` callbacks)
- **Dev**: `devOptions.enabled: true` so the SW is active during `npm run dev`
- **Build output**: stable `service-worker.js` filename (see `vite.config.ts` `entryFileNames`)
- **Types**: `/// <reference types="vite-plugin-pwa/client" />` in `src/vite-env.d.ts` — do **not** add `"types": ["vite-plugin-pwa/client"]` to `tsconfig.json` (that restricts the whole program to one type package and breaks typecheck when `node_modules` is incomplete)
- **Dependencies**: `vite-plugin-pwa` and `workbox-window` are devDependencies; run `npm ci` before `npm run typecheck`

---

## Configuration

### Model Configuration
Models are registered in `src/config/models.ts`. The app supports four engine backends:

1. **MLC WebLLM** — WebGPU-optimized, expects `model`, `model_lib`, `overrides`, `vram_required_MB`
2. **Transformers.js** — ONNX/WebGPU, expects `transformers: { model_id, device, dtype }`
3. **llama.cpp WASM** — GGUF format, expects `llamaCpp: { gguf_url, hf_repo, hf_file, context_size }`
4. **API Fallback** — OpenAI-compatible endpoint, expects `api: { endpoint, model_id, apiKey }`

Available models include:
- **VPS-hosted FP32 models** (primary, universal compatibility): Hermes-3-Llama-3.2-3B, Llama-3.2-3B-Instruct, Llama-2-7B-chat, Vicuna-7B
- **HuggingFace FP32 models** (fallback)
- **FP16 models** (faster, requires `shader-f16`): Llama-3.1-8B, Hermes-3-8B, Llama-3.2-3B, Hermes-3-3B
- **Unified models** (triple-engine): configs that work across MLC, Transformers.js, and llama.cpp

Default / blessed launch presets: Hermes-3 3B (f32/f16), Vicuna 7B, Qwen 0.5B, Vicuna GGUF — see `src/config/blessedPresets.ts`.
**Canonical model host:** `https://storage.1ink.us` via `VPS_STORAGE_URL` (`src/utils/vpsStorageUrl.ts`).  
Override with `VITE_VPS_STORAGE_ORIGIN`. Mirror `storage.noahcohn.com` is ops/SW failover only.

### Agent Configuration
Agents defined in `src/config/agents.ts`:
```typescript
const agents = [
  { id: 'comedian', name: 'The Comedian', temperature: 0.95, top_p: 0.95, color: '#ff6b6b' },
  { id: 'philosopher', name: 'The Philosopher', temperature: 0.75, top_p: 0.9, color: '#4ecdc4' },
  { id: 'scientist', name: 'The Scientist', temperature: 0.6, top_p: 0.85, color: '#45b7d1' },
  { id: 'techBro', name: 'Chad Vanderblock', temperature: 0.9, top_p: 0.92, color: '#FF6B35' },
  { id: 'robot', name: 'Unit-734', temperature: 0.5, top_p: 0.8, color: '#C0C0C0' },
]
```

### Profanity Levels
- **PG**: Family-friendly, no swearing
- **CASUAL**: Light profanity (damn, hell)
- **GRITTY**: Casual swearing (default)
- **UNCENSORED**: Full language freedom

---

## Testing

### Unit Tests (Vitest)
Fast, GPU-free unit tests live in `tests/unit/` and run via Vitest:

```bash
npm test              # run once (CI)
npm run test:watch    # watch mode during development
npm run test:coverage # coverage report for comedy + context utilities
```

**CI:** `.github/workflows/test.yml` runs `npm test` on every PR touching `src/` or `tests/`.
TypeScript (`npm run typecheck`) remains a separate hard gate.

**How to add a test:**
1. Create `tests/unit/<feature>.test.ts` (or add a `describe` block to an existing file).
2. Import the pure function or class under test from `src/` using a relative path.
3. Use Vitest's `describe` / `it` / `expect` — no custom assert helpers or `process.exit`.
4. Keep tests deterministic: mock `console.log` if the code under test logs, stub randomness when needed.
5. Run `npm test` locally before pushing.

**Current high-ROI targets:** `GroupChatManager.getErrorCategory`, `DynamicContextManager.truncate`,
`CallbackEngine` status decay, `qualityFilter.rateJoke`, `buildVRAMOverrides`, `MODE_REGISTRY` integrity.

**Orchestration coverage** (`tests/unit/directorOrchestration.test.ts`, `tests/unit/prerenderCoordinator.test.ts`,
`tests/unit/featuredModeLoaders.test.ts`) exercises the paths above that used to be caught only by manual
browser runs or chaos scripts:
- `Director.playScenario` / `stopScene` — comedy session init/teardown, turn callbacks, auto-stop when the
  mode loop resolves, episode auto-save via a stubbed `MemoryManager`. Uses `vi.mock` on `Director/modes/registry`
  to swap in a trivial test-double mode loop (`ModeLoop`) instead of a real Dream/Improv mode, so the test is
  fast and only asserts Director's own contract. `GroupChatManager` + `MockLLMEngine.attachSessionForTests`
  (no real model load) drive the chat turns. Director's constructor unconditionally touches
  `(window as any).getDirector = …`, so stub `globalThis.window` (and `document` when passing a `memoryManager`)
  before constructing it in Node.
- `PrerenderCoordinator` — `fillInitial`/`refillInBackground` enqueue + `takeTurn` drain order, plus the
  cancel-mid-flight race: a manually-resolvable ("deferred") promise lets a test call `cancel()` while an LLM
  prerender call is still in flight, then resolve it late and assert the stale batch never reaches the queue
  (epoch bump discards it).
- Featured mode loaders (`improv`, `roast`, `reporter`, `tech_support`, `debate`, `audience_heckler`,
  `lightning_round`, `therapy`) resolve via `loadModeLoop` and are confirmed to use dynamic `import()` in
  `MODE_LOADER_BY_ID`, so loading one mode never pulls in the whole Dream/Expanded corpus.

GPU/TTS/Three.js stay out of these tests — audio/visual callbacks are no-op stubs.

**Chaos tests** (mock-based stress suite, ~2s): `npm run test:chaos` — writes `docs/chaos-report.md`. Not a CI gate; use for local regression before refactors.

Browser/GPU benchmarks stay separate: `npm run perf` (Node mocks), `npm run perf:browser`, Playwright smoke tests (`python smoke_test.py` from repo root).

### Performance Testing
The application includes comprehensive performance benchmarks defined in `perf-budget.json`:

| Metric | Target | Threshold |
|--------|--------|-----------|
| FPS | 60 | ≥30 |
| Memory Leak | 0 MB | ≤50 MB |
| TTS Latency | 30 ms | ≤50 ms |
| LLM Throughput | 60 tok/sec | ≥40 tok/sec |
| Bundle Size | 3 MB | ≤5 MB |
| First Contentful Paint | 1000 ms | ≤2000 ms |
| Time to Interactive | 3000 ms | ≤5000 ms |

CI runner: `tests/perf/ci-runner.ts`
- Runs memory leak tests in Node (others require browser)
- Uses `tests/perf/setup-env.ts` to mock browser globals (window, document, localStorage, Worker, URL, Blob)
- Exits with code 1 if thresholds are violated
- GitHub Actions workflow `.github/workflows/performance.yml` runs on push/PR to `main`/`master`
- Bundle size check enforces <7.5MB total JS

### Engine Comparison Tests
`tests/engine-comparison/` contains browser-based tests for comparing LLM engine performance.

### Smoke Testing
`smoke_test.py` validates:
1. Project builds successfully
2. Page loads without console errors
3. All 5 personas initialize correctly
4. CallbackEngine tracks references across turns
5. QualityFilter rejects low-rated jokes
6. TTS system is configured

### Chaos Testing
`src/test/chaosTest.ts` and `src/test/integrationChaosTest.ts` provide randomized stress testing for the conversation and mode systems.

### Manual Testing Checklist
1. **Model Loading**: Verify model loads successfully with progress indicator
2. **Chat Mode**: Type messages and verify agent responses
3. **Improv Mode**: Start a scene and verify autonomous conversation
4. **Watcher Mode**: Test video reaction with sample video
5. **Reporter Mode**: Test topic fetching and discussion
6. **Model Swapping**: Verify different models can be assigned to agents
7. **TTS**: Verify speech synthesis works for all agents with lip-sync
8. **3D Visualization**: Verify actors animate when speaking
9. **Voice Input**: Test microphone input (if supported)
10. **Memory**: Save and load episodes, verify cloud sync

### Browser Console
Runtime errors are surfaced directly in the page via error handlers in `index.html`. Check browser DevTools for:
- WebGPU initialization errors
- Model loading failures
- Network issues with model URLs

---

## Deployment

### Production Deployment
1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy via SFTP (env credentials only — prefer `DEPLOY_KEY`):
   ```bash
   npm run deploy:dry    # preview
   npm run deploy        # or: python scripts/deploy_dist.py --verify
   ```

### External Dependencies (Runtime)
The application requires these external resources at runtime (canonical host `storage.1ink.us`, overridable):
- **LLM models**: `VPS_STORAGE_URL` — MLC, GGUF, Transformers ONNX, WASM libs
- **TTS models**: `${VPS_STORAGE_URL}/tts/onnx/`
- **Voice styles**: `${VPS_STORAGE_URL}/tts/voice_styles/` (M1, M2, F1, F2)
- See `docs/MODEL_HOSTING.md` and `src/utils/vpsStorageUrl.ts`.

### Server Configuration
The application uses a base-relative path (`base: './'` in `vite.config.ts`) for flexible deployment. COOP/COEP headers are commented out but can be enabled in `vite.config.ts` if needed for specific WebGPU scenarios.

---

## Security Considerations

### Client-Side Only
- All LLM inference runs entirely in the browser
- No server-side API keys or secrets required for basic operation
- User data (conversations) stored locally by default

### External Resources
- **Models**: Self-hosted CDN (`VPS_STORAGE_ORIGIN`, default `storage.1ink.us`)
- **Wikipedia API**: Reporter mode (no API key)
- **HuggingFace Hub API**: Optional cloud sync (user-provided token)

### Known Limitations
- Deploy secrets only via env / Actions secrets / local keys — never in git (`deploy_dist.py` rejects `CHANGEME` and missing auth)
- No Content Security Policy defined
- Input sanitization relies largely on LLM-level filtering

---

## Troubleshooting

### Common Issues

**"Cache.add() encountered a network error"**
- Clear browser cache
- Check network connection
- Try a smaller model

**Model download stuck at 0%**
- Verify WebGPU support at `chrome://gpu`
- Ensure model URLs end with `/resolve/main/`

**Out of memory / VRAM exhausted**
- Close other GPU-intensive tabs
- Select a smaller model (Hermes-3-Llama-3.2-3B uses ~2GB)
- Refresh the page to clear GPU memory

**Audio not playing**
- Check browser autoplay policies
- Verify TTS model files are hosted at correct path
- Check browser console for ONNX loading errors

**TTS model files not found**
- Ensure `tts/onnx/` directory exists with all required files
- Check that `vite.config.ts` static copy includes ONNX WASM files

**Low FPS during scenes**
- Check WebGPU support: `chrome://gpu`
- Reduce audience count in `Stage.ts`
- Disable shadows: `shadowMap.enabled = false`

---

## Documentation References

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture details
- [docs/COMEDY_GUIDE.md](./docs/COMEDY_GUIDE.md) - Comedy system documentation
- [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) - Performance guardrails documentation
- [docs/MODEL_HOSTING.md](./docs/MODEL_HOSTING.md) - Model hosting guide
- [docs/PARALLEL_DOWNLOADS.md](./docs/PARALLEL_DOWNLOADS.md) - Parallel download docs
- [docs/VRAM_OPTIMIZATION_IMPLEMENTATION.md](./docs/VRAM_OPTIMIZATION_IMPLEMENTATION.md) - VRAM optimization details
- [docs/VRAM_RESEARCH_SUMMARY.md](./docs/VRAM_RESEARCH_SUMMARY.md) - VRAM research summary
- [REPORTER_MODE_CHANGES.md](./REPORTER_MODE_CHANGES.md) - Reporter mode implementation details
- [REPORTER_MODE_IMPROVEMENTS.md](./REPORTER_MODE_IMPROVEMENTS.md) - Reporter mode enhancements
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Deployment checklist
- [README.md](./README.md) - User-facing documentation

---

## Cursor Cloud specific instructions

Standard commands are unchanged (see **Build and Development Commands** above): `npm install`,
`npm run dev` (→ `http://localhost:5173`), `npm run build`, `npm run preview`, `npm run perf`.
The notes below capture non-obvious gotchas discovered when running this app in a Cloud VM
(headless Linux, **no GPU**).

### Lint / test / build (what actually runs here)
- **Lint / typecheck:** there is no ESLint; the project's check is `npm run typecheck` (`tsc --noEmit`, must be clean
  before committing — see `CLAUDE.md`). GitHub Actions workflow `typecheck.yml` enforces this on PRs.
- **Unit tests:** `npm test` runs Vitest on pure TS modules (comedy, context, mode registry) in <2s without GPU.
- **Perf tests:** `npm run perf` runs `tests/perf/ci-runner.ts`. Only the **memory-leak** test runs in
  Node and passes; the FPS / TTS / LLM benchmarks need a real browser/GPU and are reported as
  `Violations` (`gl.getExtension is not a function`, `Worker timeout`, `Invalid URL`). This is
  expected — the run still exits `0` ("All performance benchmarks passed").
- `python scripts/smoke_test.py` hardcodes `cwd='/app'` (Docker-oriented) and is not suited to this VM.

### Running the app in a browser (WebGPU is mandatory)
- `index.html` hard-gates on `navigator.gpu.requestAdapter()`; with no adapter it shows
  **"WebGPU Not Available"** and never renders the app. The default headless Chrome here only has
  `swiftshader-webgl` (WebGL, **not** WebGPU), so the gate fails out of the box.
- To get a **software WebGPU** adapter, launch Chrome with `--enable-unsafe-webgpu
  --enable-features=Vulkan` **and** point the Vulkan loader at Chrome's bundled SwiftShader ICD:
  `VK_ICD_FILENAMES=/opt/google/chrome/vk_swiftshader_icd.json`. (WebGPU is only exposed on secure
  contexts, i.e. `http://localhost`/https — not `data:` URLs.) Driving via the bundled `puppeteer`
  with these args is the reliable way to test the full app.
- Software WebGPU **works but is very slow**: loading the smallest hosted model
  (`Hermes-3-Llama-3.2-3B-q4f32_1-MLC`) compiles shaders for ~10 min, and **token generation is
  impractically slow** (a short reply may not finish within many minutes). Model download, shader
  compile/load to the interactive "Ready" state, 3D avatars, and TTS init all succeed; only LLM
  *generation* is GPU-bound and effectively too slow on CPU.
- `shader-f16` is unavailable on SwiftShader, so only **q4f32** MLC models load. The f16 MLC models
  and the Transformers.js (q4f16) models will not run here.

### Model hosting / engine caveats
- Models stream from the canonical host `storage.1ink.us` (`VPS_STORAGE_ORIGIN`). The HuggingFace xet CDN
  (`us.aws.cdn.hf.co`) **times out** from this VM, so HF-hosted models (e.g. `TinyLlama-1.1B-Chat-GGUF`)
  fail to download. Prefer VPS-hosted MLC/GGUF models.
- **llama.cpp (wllama)** ships WASM bundled with the app (`src/llm/wllamaRuntime.ts` via Vite
  `?url` imports) so it always matches the pinned `@wllama/wllama` package. Run `npm run verify:wllama`
  after version bumps. On SwiftShader / software WebGPU VMs, prefer **MLC** with q4f32 models (no
  shader-f16); llama.cpp is for true no-WebGPU browsers.
- WebLLM caches weights via the **Cache API** using HF-style `…/resolve/main/…` URLs. The
  `index.html` `fetch` wrapper cannot rewrite those (`Cache.add()` bypasses it); the service worker
  (`src/service-worker.ts`) does the rewrite but only controls the page **after a reload** (it never
  calls `clients.claim()`). A fresh first load can therefore 404 on `mlc-chat-config.json` — reload
  so the SW takes control (or rewrite `/resolve/main/` at the network layer in a test harness).
- The **"Cloud Conflict Dashboard"** modal (`#cloud-dashboard-modal`) defaults to `display:none` and
  `setupDashboard()` (`src/ui/dashboard.ts`) hides it again on init; it only opens via the dashboard
  or "Review Sync" buttons, so it no longer blocks **Load Model & Start** on cold start.

---

## License

MIT License
