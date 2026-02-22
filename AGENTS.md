# The Jokesters - Agent Guide

## Project Overview

**The Jokesters** is a multi-agent chat application that runs entirely in the browser using WebGPU acceleration. It features three AI agents with distinct personalities (The Comedian, The Philosopher, The Scientist) that engage in improvised comedy conversations powered by in-browser Large Language Models (LLM).

### Key Features
- **In-browser LLM inference** using `@mlc-ai/web-llm` with WebGPU acceleration
- **Multi-mode interactions**: 18+ distinct modes including Chat Mode, Improv Mode, Watcher Mode (media reaction), Reporter Mode, Roast Mode, Story Mode, Debate Mode, Musical Mode, Podcast/Interview Mode, Dungeon Master Mode, Trivia Mode, Dream Mode, Vision Mode, Trial Mode, Tech Support Mode, Historical Mode, and Commentary Mode
- **3D agent visualization** using Three.js with lip-sync and real-time animations
- **Real-time text-to-speech (TTS)** using ONNX-based Supertonic pipeline with multiple voice styles
- **Dynamic model swapping** allowing different LLMs per agent to fit within VRAM constraints
- **Memory management** with localStorage persistence and optional HuggingFace cloud sync
- **Voice input** support using Web Speech API

### Architecture Philosophy: "The Digital Director"
The system follows a **Centralized Director / Stateless Actor** model:
- **Agents** (`Comedian`, `Philosopher`, `Scientist`) are stateless configurations (prompts + visual params)
- **The Director** (`Director` class) orchestrates the scene, manages state, decides turn-taking, and injects environmental context
- **GroupChatManager** handles LLM interactions with retry logic and VRAM management
- **AgentModelManager** manages per-agent model assignments and hot-swapping

---

## Technology Stack

### Core Technologies
| Technology | Purpose | Version |
|------------|---------|---------|
| **TypeScript** | Primary language | ES2022 target |
| **Vite** | Build tool and dev server | ^7.2.4 |
| **Three.js** | 3D visualization and WebGL rendering | ^0.181.2 |
| **@mlc-ai/web-llm** | In-browser LLM inference via WebGPU | ^0.2.8 |
| **ONNX Runtime Web** | TTS model inference | ^1.17.0 |
| **Python** | Deployment scripts only | 3.x |

### Key Dependencies
```json
{
  "@mlc-ai/web-llm": "^0.2.8",    // LLM inference engine
  "three": "^0.181.2",             // 3D graphics
  "onnxruntime-web": "^1.17.0",    // ONNX model runtime
  "vite-plugin-static-copy": "^3.1.4"  // Asset copying
}
```

---

## Project Structure

```
the_jokesters/
├── src/
│   ├── main.ts                    # Application entry point, UI setup, event handlers
│   ├── GroupChatManager.ts        # LLM chat management, conversation history, agent rotation
│   ├── AgentModelManager.ts       # Per-agent model assignment and hot-swapping
│   ├── ImprovSceneManager.ts      # [Legacy] Improv scene orchestration
│   ├── SceneManager.ts            # [Legacy] 3D scene management
│   ├── Director/
│   │   ├── Director.ts            # Main orchestration class (game loop), Scenario execution
│   │   ├── MemoryManager.ts       # Episode persistence (local + HuggingFace cloud)
│   │   ├── HFStorageManager.ts    # HuggingFace Hub API integration
│   │   ├── ScriptGenerator.ts     # AI-powered script generation
│   │   ├── ScriptParser.ts        # Script parsing utilities
│   │   ├── MediaReactionManager.ts # Video reaction trigger handling
│   │   └── modes/                 # Mode implementations
│   │       ├── ModeContext.ts     # Shared context interface for all modes
│   │       ├── ImprovMode.ts      # Improv and autonomous conversation loops
│   │       ├── MediaMode.ts       # Video reaction and vision analysis loops
│   │       ├── ReporterMode.ts    # News/Reporter mode with data fetching
│   │       ├── InteractiveMode.ts # Trial, Tech Support, DM, Trivia, Interview modes
│   │       └── PerformanceMode.ts # Roast, Story, Debate, Musical, Podcast, Script, Dream, Historical, Commentary modes
│   ├── audio/
│   │   ├── AudioEngine.ts         # TTS audio synthesis orchestration
│   │   ├── MusicEngine.ts         # Beat generation for musical mode
│   │   ├── SpeechQueue.ts         # Speech playback queue management
│   │   ├── Supertonic.ts          # Core TTS ONNX inference (legacy)
│   │   ├── SupertonicPipeline.ts  # TTS pipeline stages (current)
│   │   ├── VoiceInputManager.ts   # Web Speech API voice input
│   │   └── worker/
│   │       └── audio.worker.ts    # Web Worker for audio processing
│   ├── visuals/
│   │   ├── Actor.ts               # 3D agent representation (capsule with face)
│   │   ├── Stage.ts               # Three.js scene management, lighting, rendering
│   │   └── LipSync.ts             # Lip synchronization with audio volume
│   ├── services/
│   │   └── DataFetchService.ts    # External data fetching for Reporter mode (Wikipedia, Hacker News)
│   ├── config/
│   │   ├── agents.ts              # Agent definitions (personalities, prompts, colors)
│   │   └── models.ts              # LLM model configurations
│   ├── ui/
│   │   ├── htmlTemplate.ts        # HTML template generation for the UI
│   │   ├── ModeHandlers.ts        # Mode button handlers and UI controls
│   │   └── BeatGenerator.ts       # Simple beat animation for musical mode
│   ├── utils/
│   │   └── RNG.ts                 # Seeded random number generator
│   ├── types/                     # TypeScript type declarations
│   │   ├── webllm.d.ts
│   │   ├── three.d.ts
│   │   ├── onnxruntime-web.d.ts
│   │   └── vite-plugin-static-copy.d.ts
│   ├── style.css                  # Application styles
│   └── vite-env.d.ts
├── public/                        # Static assets served directly
├── voices/                        # Voice style files for TTS
├── models/                        # Model-related assets
├── verification/                  # Verification scripts and images
├── deploy.py                      # SFTP deployment script (paramiko-based)
├── deploy_models.py               # Model deployment script
├── upload_model.py                # HuggingFace model upload utility
├── upload_hermes.py               # Hermes model upload utility
├── index.html                     # HTML entry point
├── package.json                   # Node.js dependencies
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite build configuration
```

---

## Build and Development Commands

### Prerequisites
- Node.js 18+
- A modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Sufficient GPU memory (recommended: 4GB+ VRAM)

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

### Preview Production Build
```bash
npm run preview
```
- Serves the `dist/` directory locally

### Deployment
```bash
python deploy.py
```
- Uploads `dist/` directory to configured SFTP server
- Requires `paramiko` Python package

---

## Code Style Guidelines

### TypeScript Conventions
- **Strict mode enabled**: All strict TypeScript compiler options are on
- **Explicit types**: Prefer explicit return types on public methods
- **ES modules**: Uses ES2022 module syntax (`import`/`export`)
- **No unused variables**: Compiler enforces `noUnusedLocals` and `noUnusedParameters`

### Naming Conventions
- **Classes**: PascalCase (e.g., `GroupChatManager`, `Director`)
- **Interfaces**: PascalCase with descriptive names (e.g., `DirectorCallbacks`, `AgentModelMapping`)
- **Methods/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **File names**: PascalCase for classes, camelCase for utilities

### Code Organization
- One class per file (generally)
- Group related functionality into directories (`audio/`, `visuals/`, `Director/`)
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

### Director
**File**: `src/Director/Director.ts`

Central orchestrator for all interaction modes:
- **Improv Mode**: Autonomous agent conversations with chaos injection
- **Watcher Mode**: Video reaction with time-synced triggers
- **Reporter Mode**: Discussion of live topics with context injection
- **Script Mode**: Performance of AI-generated or pre-written scripts
- **Interactive Modes**: Trial, Tech Support, Dungeon Master, Trivia, Interview
- **Performance Modes**: Roast, Story, Debate, Musical, Podcast, Dream, Historical, Commentary
- Manages turn-taking, pacing (punchline/standard/rant), and scene lifecycle
- Auto-saves episodes to memory on scene stop

### AgentModelManager
**File**: `src/AgentModelManager.ts`

Handles per-agent LLM model assignment:
- Maintains mapping of agent IDs to model IDs
- Hot-swaps models between turns to stay within VRAM limits
- Only one model loaded at a time
- Reports progress during model swaps with scaled percentages

### AudioEngine
**File**: `src/audio/AudioEngine.ts`

Text-to-speech orchestration:
- Maps agent IDs to voice styles (M1, M2, F1, F2)
- Configurable speed (0.5-2.0) and quality (diffusion steps 1-50)
- Loads voice styles from `./tts/voice_styles/`
- Agent-to-voice mapping:
  - Comedian → F1 (Female voice, fast)
  - Philosopher → M2 (Deep/slow male voice)
  - Scientist → M1 (Standard male voice)

### Stage
**File**: `src/visuals/Stage.ts`

Three.js scene management:
- Creates and manages 3D actors (capsules with face indicators)
- Handles window resize
- Integrates lip-sync with audio volume for real-time mouth animation
- Spotlight highlighting for active speaker

### MemoryManager
**File**: `src/Director/MemoryManager.ts`

Episode persistence system:
- Local storage using localStorage with `jokesters-` prefix
- Optional cloud sync to HuggingFace Hub
- Episode search and recall functionality
- Automatic loading of previous episode context on startup

---

## Configuration

### Model Configuration
Models are registered in `src/config/models.ts`. Each model requires:
```typescript
{
  model_id: 'unique-identifier',
  model: 'https://url-to-model-weights/resolve/main/',
  model_lib: 'https://url-to-wasm-runtime.wasm',
  overrides: {
    context_window_size: 4096
  }
}
```

### Available Models (as of current config)
- **Hermes-3-Llama-3.2-3B-q4f32_1-MLC** (default)
- **Llama-3.2-3B-Instruct-q4f32_1-MLC**

Additional models available through webllm prebuilt config:
- TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC
- Qwen2-0.5B-Instruct-q4f32_1-MLC
- SmolLM2-360M-Instruct-q4f32_1-MLC
- And others from @mlc-ai/web-llm

### Agent Configuration
Agents defined in `src/config/agents.ts`:
```typescript
const agents = [
  {
    id: 'comedian',
    name: 'The Comedian',
    systemPrompt: 'You are a frantic, high-energy female comedian...',
    temperature: 0.95,
    top_p: 0.95,
    color: '#ff6b6b'
  },
  // ... philosopher, scientist
]
```

### Profanity Levels
- **PG**: Family-friendly, no swearing
- **CASUAL**: Light profanity (damn, hell)
- **GRITTY**: Casual swearing (default)
- **UNCENSORED**: Full language freedom

---

## Testing

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

2. Deploy via SFTP:
   ```bash
   python deploy.py
   ```

### External Dependencies (Runtime)
The application requires these external resources at runtime:
- **TTS models**: Expected at `./tts/onnx/` (host separately)
  - `tts.json` - Configuration
  - `unicode_indexer.json` - Text processing
  - `*.onnx` - Model files (duration_predictor, text_encoder, vector_estimator, vocoder)
- **Voice styles**: Expected at `./tts/voice_styles/` (M1.json, M2.json, F1.json, F2.json)
- **LLM models**: Downloaded from HuggingFace/CDN on first run

### Server Configuration
The application uses a base-relative path (`base: './'` in vite.config.ts) for flexible deployment. COOP/COEP headers are commented out but can be enabled in vite.config.ts if needed for specific WebGPU scenarios.

---

## Security Considerations

### Client-Side Only
- All LLM inference runs entirely in the browser
- No server-side API keys or secrets required for basic operation
- User data (conversations) stored locally by default

### External Resources
- Models loaded from HuggingFace and GitHub CDNs
- Wikipedia API used for Reporter mode (no API key required)
- HuggingFace Hub API optional for cloud sync (user-provided token)

### Known Limitations
- **Hardcoded credentials** in `deploy.py` - should be moved to environment variables
- No Content Security Policy defined
- Input sanitization relies on LLM-level filtering

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
- Select a smaller model
- Refresh the page to clear GPU memory

**Audio not playing**
- Check browser autoplay policies
- Verify TTS model files are hosted at correct path
- Check browser console for ONNX loading errors

**TTS model files not found**
- Ensure `tts/onnx/` directory exists with all required files
- Check that vite.config.ts static copy includes ONNX WASM files

---

## Documentation References

- [model-plan.md](./model-plan.md) - Detailed WebLLM model setup and loading guide
- [plan.md](./plan.md) - Avatar interaction system expansion plan (original architecture design)
- [agent_plan.md](./agent_plan.md) - Implementation roadmap and feature plans
- [README.md](./README.md) - User-facing documentation
- [REPORTER_MODE_CHANGES.md](./REPORTER_MODE_CHANGES.md) - Reporter mode implementation details
- [REPORTER_MODE_IMPROVEMENTS.md](./REPORTER_MODE_IMPROVEMENTS.md) - Reporter mode enhancements

---

## License

MIT License
