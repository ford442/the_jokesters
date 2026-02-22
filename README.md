# The Jokesters

A multi-agent chat application powered by Llama-3 and WebGPU, featuring 3D animated agent visualizations, autonomous improv comedy, and a sophisticated comedy engine with callback tracking.

![The Jokesters App](https://github.com/user-attachments/assets/c0474e26-df60-464a-b936-46688ab6b143)

## Features

- **Multi-Agent Chat System**: Simulates multiple AI agents with distinct personalities using LLMs running entirely in your browser
- **5 Unique Agent Personas**: From a frantic comedian to a deadpan robot, each with distinct voices and behaviors
- **Dynamic Prompt Swapping**: Each agent has its own system prompt and sampling parameters (temperature, top_p)
- **3D Agent Visualization**: Agents are rendered as 3D capsules using Three.js with lip-sync animations
- **WebGPU-Powered**: Uses @mlc-ai/web-llm for in-browser LLM inference with WebGPU acceleration
- **Real-time Interaction**: Chat with rotating AI agents, each with unique personalities
- **Advanced Improv Mode**: Watch agents perform autonomous multi-character improv with:
  - Sentiment-driven conversation branching
  - Running gag callback system
  - Quality gating and chaos injection
  - Dynamic topic pivoting
- **18+ Interaction Modes**: Chat, Improv, Watcher (media reaction), Reporter, Roast, Story, Debate, Musical, Podcast, Dungeon Master, Trivia, Dream, Vision, Trial, Tech Support, Historical, and Commentary modes
- **Text-to-Speech**: Real-time TTS with multiple voice styles and lip-sync
- **Memory System**: Episode persistence with localStorage and optional HuggingFace cloud sync

## Agents

The application features five distinct agents, each with unique personalities, speaking styles, and visual representations:

### 1. The Comedian (Red) `#ff6b6b`
- **Personality**: Frantic, high-energy female comedian who talks incredibly fast
- **Traits**: Mixes highbrow references with lowbrow physical humor, self-aware about rambling
- **Parameters**: temp: 0.95, top_p: 0.95 (high creativity)
- **Voice**: F1 (Fast female voice)
- **Speed**: 1.5x (fastest)

### 2. The Philosopher (Teal) `#4ecdc4`
- **Personality**: Cynical philosopher who speaks... very... slowly...
- **Traits**: Highbrow but petty, judges the comedian's speed
- **Parameters**: temp: 0.75, top_p: 0.9 (moderate creativity)
- **Voice**: M2 (Deep/slow male voice)
- **Speed**: 0.6x (slowest)

### 3. The Scientist (Blue) `#45b7d1`
- **Personality**: Dry, literal scientist who treats jokes as hypotheses
- **Traits**: Devoid of humor in a way that's unintentionally funny, analyzes with mathematical precision
- **Parameters**: temp: 0.6, top_p: 0.85 (conservative)
- **Voice**: M1 (Standard male voice)
- **Speed**: 1.0x (normal)

### 4. Chad Vanderblock - The Tech Bro (Orange) `#FF6B35` 🆕
- **Personality**: Overconfident Series A founder, ultimate Tech Bro™
- **Traits**: Drops buzzwords constantly, references "grindset" and 4 AM wake-up routine, always "crushing it"
- **Catchphrases**: "Here's the thing," "Real talk," "Not gonna lie," "Hot take:"
- **Parameters**: temp: 0.9, top_p: 0.92 (high creativity)
- **Voice**: M1 with speed boost
- **Visual**: Custom TechBroActor with gesture animations (finger guns, hair flip, watch check)

### 5. Unit-734 - The Deadpan Robot (Silver) `#C0C0C0` 🆕
- **Personality**: Robot with malfunctioning humor chip, literal to a fault
- **Traits**: Finds absurdity in human behavior through dry observations, treats feelings as computational errors
- **Speech Patterns**: Uses `[pause 2s]`, `[processing...]`, `[whirring noise]`, `[error beep]`, `[calculating...]`
- **Parameters**: temp: 0.5, top_p: 0.8 (very conservative)
- **Voice**: M2 with robot-like pacing
- **Visual**: Custom DeadpanRobotActor with mechanical animations and head tilting

## Prerequisites

- Node.js 18+ 
- A modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Sufficient GPU memory (recommended: 4GB+ VRAM)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## Building

```bash
npm run build
```

## Technical Architecture

### GroupChatManager

The `GroupChatManager` class manages the conversation flow:

- Initializes LLM models using @mlc-ai/web-llm with retry logic
- Dynamically swaps system prompts between agents
- Adjusts sampling parameters (temperature, top_p) per agent turn
- Maintains conversation history with VRAM-aware truncation (max 8 messages)
- Supports per-agent model assignments and hot-swapping
- Implements 4-bit quantization for performance
- Tracks performance metrics (tokens/sec, latency)

### Director & Improv System

The `Director` class orchestrates autonomous scenes:

- **Improv Mode**: Multi-agent autonomous conversations with:
  - Sentiment tracking (cheer/boo reactions drive topic changes)
  - 4-layer conversation tree with branching logic
  - Quality gating (responses rated 1-10, low scores trigger retries)
  - Chaos injection (random events at configurable probability)
  - Callback tracking for running gags
- **Pacing Control**: Three response types (punchline, standard, rant) with different token limits
- **Heckler Support**: Audience interruptions that agents react to
- **18+ Modes**: Specialized loops for different interaction types

### Comedy Engine

The comedy system consists of:

- **CallbackEngine**: Tracks joke themes and calculates running gag decay
  - Bell curve decay: 1st use (1.0) → 3rd use (1.5 peak) → 6th+ use (0.2 dead)
  - Theme-based indexing for finding related jokes
  - Visual feedback when callbacks are triggered
- **JokeLoader**: Manages joke databases (absurdist, dark_tech, crowd_work)
  - Template substitution for crowd work (browser name, time of day)
  - Multi-agent bits with per-agent lines
- **QualityFilter**: Rates jokes on surprise metrics
  - Subversion score (expectation subversion)
  - Wordplay score (puns, double meanings)
  - Timing score (setup/punchline effectiveness)
  - Originality score (novelty factor)

### Stage (3D Visualization)

The `Stage` class handles 3D rendering:

- **5-Agent Layout**: Semi-circle arrangement for optimal visibility
  - Comedian (-3), Tech Bro (-1.5), Scientist (0), Robot (1.5), Philosopher (3)
- **Custom Actors**: 
  - Standard Actor: Basic capsule with face indicators
  - TechBroActor: Orange aesthetic with gesture animations
  - DeadpanRobotActor: Mechanical design with timing cue support
- **Performance Optimizations**:
  - InstancedMesh for 150 audience members (single draw call)
  - LOD system with frustum culling
  - Throttled updates for non-active actors
- **Lip-Sync**: Real-time mouth animation based on audio volume
- **Callback Visuals**: Floating indicators when running gags are triggered

### Vite Configuration

Critical COOP/COEP headers are configured in `vite.config.ts` to enable WebGPU:

```typescript
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}
```

## How It Works

### Chat Mode
1. On initialization, the app downloads the LLM model (~3-4GB) from HuggingFace
2. The model is cached in the browser for subsequent runs
3. When you send a message, the current agent responds with its unique personality
4. The agent's 3D representation animates during its turn with lip-sync
5. The system automatically rotates to the next agent for the following turn

### Improv Mode
1. Click the "Improv Mode" button to switch to autonomous multi-character conversations
2. Enter a scene title (e.g., "At the Coffee Shop")
3. Provide a scene description or subject (e.g., "Three friends discuss their latest adventures")
4. Click "Start Scene" and watch the agents improvise a comedy scene
5. Agents will converse with each other for up to 10 turns
6. The system monitors quality and injects chaos events
7. Running gags are tracked and callbacks suggested at peak moments (3rd use)
8. Sentiment evaluation happens every 2 turns, potentially causing topic pivots

### 5-Agent Performance
With all five agents active, you'll experience:
- **Comedian**: High-energy rambling that sets up jokes
- **Tech Bro**: Hijacks topics with buzzwords and startup talk
- **Scientist**: Analyzes everything literally, unintentionally funny
- **Robot**: Deadpan observations with mechanical timing cues
- **Philosopher**: Slow, judgmental commentary on everything

The agents interact dynamically, with the Tech Bro trying to one-up everyone, the Robot missing social cues, and the Philosopher judging them all.

## Browser Compatibility

The application requires WebGPU support:

- ✅ Chrome/Edge 113+
- ✅ Chrome/Edge Android (with flag)
- ⚠️ Firefox (in development)
- ⚠️ Safari (in development)

## Notes

- First load requires downloading ~3-4GB model files (cached after first run)
- Requires sufficient GPU memory for WebGPU inference
- Model inference runs entirely in-browser - no server required!
- For detailed information on model loading, configuration, and troubleshooting, see [model-plan.md](./model-plan.md)
- For contributor documentation on the comedy system, see [docs/COMEDY_GUIDE.md](./docs/COMEDY_GUIDE.md)
- For architecture details, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## License

MIT
