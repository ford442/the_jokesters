# The Jokesters - Agent Guide

## Project Overview

**The Jokesters** is a multi-agent chat application that runs entirely in the browser using WebGPU acceleration. It features three AI agents with distinct personalities (The Comedian, The Philosopher, The Scientist) that engage in improvised comedy conversations powered by an in-browser Large Language Model (LLM).

### Key Features
- **In-browser LLM inference** using `@mlc-ai/web-llm` with WebGPU acceleration
- **Multi-mode interactions**: Chat Mode, Improv Mode, Watcher Mode (media reaction), Reporter Mode
- **3D agent visualization** using Three.js with lip-sync and animations
- **Real-time text-to-speech (TTS)** using ONNX-based Supertonic pipeline
- **Dynamic model swapping** allowing different LLMs per agent to fit within VRAM constraints

### Architecture Philosophy: "The Digital Director"
The system follows a **Centralized Director / Stateless Actor** model:
- **Agents** (`Comedian`, `Philosopher`, `Scientist`) are stateless configurations (prompts + visual params)
- **The Director** (`Director` class) orchestrates the scene, manages state, decides turn-taking, and injects environmental context

---

## Technology Stack

### Core Technologies
| Technology | Purpose |
|------------|---------|
| **TypeScript** | Primary language (ES2022 target) |
| **Vite** | Build tool and dev server |
| **Three.js** | 3D visualization and WebGL rendering |
| **@mlc-ai/web-llm** | In-browser LLM inference via WebGPU |
| **ONNX Runtime Web** | TTS model inference |
| **Python** | Deployment scripts only |

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
│   ├── main.ts                    # Application entry point, UI setup
│   ├── GroupChatManager.ts        # LLM chat management, agent rotation
│   ├── AgentModelManager.ts       # Per-agent model assignment and swapping
│   ├── ImprovSceneManager.ts      # [Legacy] Improv scene orchestration
│   ├── SceneManager.ts            # [Legacy] 3D scene management
│   ├── Director/
│   │   ├── Director.ts            # Main orchestration class (game loop)
│   │   └── MediaReactionManager.ts # Video reaction trigger handling
│   ├── audio/
│   │   ├── AudioEngine.ts         # TTS audio synthesis orchestration
│   │   ├── SpeechQueue.ts         # Speech playback queue management
│   │   ├── Supertonic.ts          # Core TTS ONNX inference
│   │   ├── SupertonicPipeline.ts  # TTS pipeline stages
│   │   └── worker/
│   │       └── audio.worker.ts    # Web Worker for audio processing
│   ├── visuals/
│   │   ├── Actor.ts               # 3D agent representation
│   │   ├── Stage.ts               # Three.js scene management
│   │   └── LipSync.ts             # Lip synchronization
│   ├── services/
│   │   └── DataFetchService.ts    # External data fetching for Reporter mode
│   ├── utils/
│   │   └── RNG.ts                 # Random number utilities
│   ├── types/                     # TypeScript type declarations
│   │   ├── webllm.d.ts
│   │   ├── three.d.ts
│   │   └── ...
│   ├── style.css                  # Application styles
│   └── vite-env.d.ts
├── public/                        # Static assets served directly
├── voices/                        # Voice style files for TTS
├── models/                        # Model-related assets
├── verification/                  # Verification scripts and images
├── deploy.py                      # SFTP deployment script
├── deploy_models.py               # Model deployment script
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

### Comments
- Use JSDoc for public methods
- Inline comments for complex logic
- Section headers for related groups of functionality

---

## Key Classes and Modules

### GroupChatManager
**File**: `src/GroupChatManager.ts`

Manages LLM interactions and conversation state:
- Initializes and terminates the MLCEngine
- Handles conversation history (max 8 messages to prevent VRAM exhaustion)
- Manages agent rotation
- Applies profanity level settings
- Implements retry logic with exponential backoff for model loading

### Director
**File**: `src/Director/Director.ts`

Central orchestrator for all interaction modes:
- **Improv Mode**: Autonomous agent conversations with chaos injection
- **Watcher Mode**: Video reaction with time-synced triggers
- **Reporter Mode**: Discussion of live topics with context injection
- Manages turn-taking, pacing, and scene lifecycle

### AgentModelManager
**File**: `src/AgentModelManager.ts`

Handles per-agent LLM model assignment:
- Maintains mapping of agent IDs to model IDs
- Hot-swaps models between turns to stay within VRAM limits
- Only one model loaded at a time
- Reports progress during model swaps

### AudioEngine
**File**: `src/audio/AudioEngine.ts`

Text-to-speech orchestration:
- Maps agent IDs to voice styles (M1, M2, F1, F2)
- Configurable speed and quality (diffusion steps)
- Loads voice styles from `./tts/voice_styles/`

### Stage
**File**: `src/visuals/Stage.ts`

Three.js scene management:
- Creates and manages 3D actors
- Handles window resize
- Integrates lip-sync with audio volume

---

## Configuration

### Model Configuration
Models are registered in `src/main.ts` (lines 24-154). Each model requires:
```typescript
{
  model_id: 'unique-identifier',
  model: 'https://url-to-model-weights/resolve/main/',
  model_lib: 'https://url-to-wasm-runtime.wasm',
  vram_required_MB: 3000,
  low_resource_required: false,
  model_type: 'llm'  // 'llm', 'vlm', or 'embedding'
}
```

### Available Models (as of current config)
- **Hermes-3-Llama-3.2-3B-q4f32_1-MLC** (default, ~2.9GB)
- **TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC** (~2GB)
- **ford442/vicuna-7b-q4f32-webllm** (~4GB)
- **Qwen2-0.5B-Instruct-q4f32_1-MLC** (smallest)
- **SmolLM2-360M-Instruct-q4f32_1-MLC** (~580MB)
- **Phi-3.5-vision-instruct** (vision-language)

### Agent Configuration
Agents defined in `src/main.ts` (lines 161-195):
```typescript
const agents = [
  {
    id: 'comedian',
    name: 'The Comedian',
    systemPrompt: '...',
    temperature: 0.95,
    top_p: 0.95,
    color: '#ff6b6b'
  },
  // ... philosopher, scientist
]
```

---

## Testing

### Manual Testing Checklist
1. **Model Loading**: Verify each registered model loads successfully
2. **Chat Mode**: Type messages and verify agent responses
3. **Improv Mode**: Start a scene and verify autonomous conversation
4. **Watcher Mode**: Test video reaction with a sample video
5. **Reporter Mode**: Test topic fetching and discussion
6. **Model Swapping**: Verify different models can be assigned to agents
7. **TTS**: Verify speech synthesis works for all agents
8. **3D Visualization**: Verify actors animate when speaking

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
- **Voice styles**: Expected at `./tts/voice_styles/` (M1.json, M2.json, F1.json, F2.json)
- **LLM models**: Downloaded from HuggingFace/CDN on first run

### Server Configuration
The application requires proper COOP/COEP headers for WebGPU (currently commented out in vite.config.ts):
```javascript
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
}
```

---

## Security Considerations

### Client-Side Only
- All LLM inference runs entirely in the browser
- No server-side API keys or secrets required
- User data (conversations) never leaves the browser

### External Resources
- Models loaded from HuggingFace and GitHub CDNs
- Wikipedia API used for Reporter mode (no API key required)
- Verify model URLs use `/resolve/main/` for raw file access

### Known Limitations
- **Hardcoded credentials** in `deploy.py` (password in plaintext) - should be moved to environment variables
- No Content Security Policy defined
- No input sanitization beyond LLM-level filtering

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

---

## Documentation References

- [model-plan.md](./model-plan.md) - Detailed WebLLM model setup and loading guide
- [plan.md](./plan.md) - Avatar interaction system expansion plan
- [agent_plan.md](./agent_plan.md) - Implementation roadmap and feature plans
- [README.md](./README.md) - User-facing documentation

---

## License

MIT License
