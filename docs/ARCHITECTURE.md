# The Jokesters Architecture

This document explains the technical architecture of The Jokesters, focusing on the three core systems that power the application: **GroupChatManager**, **Director**, and the **Comedy Engine**.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              THE JOKESTERS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   GroupChat     │◄──►│    Director     │◄──►│  Comedy Engine  │          │
│  │    Manager      │    │                 │    │                 │          │
│  │                 │    │  - Mode Loops   │    │  - Callbacks    │          │
│  │  - LLM Engine   │    │  - Turn Taking  │    │  - Quality Gate │          │
│  │  - Agent State  │    │  - Scene Mgmt   │    │  - Joke Loader  │          │
│  │  - History      │    │  - Pacing       │    │  - Branching    │          │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────┘          │
│           │                      │                                          │
│           ▼                      ▼                                          │
│  ┌─────────────────┐    ┌─────────────────┐                                 │
│  │  AgentModelMgr  │    │   ModeContext   │                                 │
│  │  (Hot-swapping) │    │   (Shared API)  │                                 │
│  └─────────────────┘    └────────┬────────┘                                 │
│                                  │                                          │
│           ┌──────────────────────┼──────────────────────┐                  │
│           ▼                      ▼                      ▼                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  AudioEngine    │    │     Stage       │    │  MemoryManager  │         │
│  │  (TTS/Speech)   │    │  (3D/Visuals)   │    │  (Persistence)  │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1. GroupChatManager

**File**: `src/GroupChatManager.ts`

The GroupChatManager is the low-level LLM interface. It manages the WebLLM engine, conversation state, and agent rotation.

### Key Responsibilities

```
┌────────────────────────────────────────────────────────────────┐
│                    GroupChatManager                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Engine     │  │   Agents     │  │   History    │         │
│  │   (MLC)      │  │  (5 personas)│  │  (max 8 msg) │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                 │
│         └─────────────────┼──────────────────┘                 │
│                           │                                    │
│                    ┌──────▼──────┐                            │
│                    │    Chat     │                            │
│                    │   Method    │                            │
│                    └──────┬──────┘                            │
│                           │                                    │
│              ┌────────────┼────────────┐                      │
│              ▼            ▼            ▼                      │
│        ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│        │ System  │  │  User   │  │Assistant│                 │
│        │ Prompt  │  │ Message │  │ Response│                 │
│        │(persona)│  │         │  │         │                 │
│        └─────────┘  └─────────┘  └─────────┘                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Core Methods

| Method | Purpose |
|--------|---------|
| `initialize(modelId, onProgress)` | Load LLM with retry logic, cache clearing on network errors |
| `chat(message, onSentence, options)` | Generate response with streaming, sentence-by-sentence callback |
| `chatForAgent(agentId, message, ...)` | Force specific agent to speak (breaks rotation) |
| `terminate()` | Unload engine to free VRAM |
| `completion(messages, options)` | One-off generation without history |

### Conversation Flow

```typescript
// 1. Build system prompt with agent persona + style + language + context
const fullSystemPrompt = `${currentAgent.systemPrompt}
  ${this.styleInstruction}
  ${this.languageInstruction}
  ${this.globalContext}`

// 2. Truncate history to prevent VRAM exhaustion
const recentHistory = this.conversationHistory.slice(-MAX_HISTORY_MESSAGES)

// 3. Generate with agent-specific parameters
const completion = await this.engine.chat.completions.create({
  messages: [{ role: 'system', content: fullSystemPrompt }, ...recentHistory],
  temperature: currentAgent.temperature,  // Per-agent creativity
  top_p: currentAgent.top_p,
  max_tokens: 96,                         // Hard cap for speed
  stream: true,                           // Sentence-by-sentence delivery
  stop: ["###", "Director:", "User:"],    // Stop tokens
})

// 4. Clean response and advance to next agent
this.conversationHistory.push({ role: 'assistant', content: cleanResponse })
this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length
```

### VRAM Management

- **History Truncation**: Max 8 messages to prevent context window exhaustion
- **Model Hot-Swapping**: `AgentModelManager` can unload/reload different models per agent
- **4-bit Quantization**: Uses q4f16_1 models (~4-5GB VRAM instead of 8GB+)
- **Cache Clearing**: Automatic cache purge on network errors during model load

## 2. Director

**File**: `src/Director/Director.ts`

The Director is the scene orchestrator. It manages the overall flow of interaction modes, turn-taking, and scene lifecycle.

### Architecture: The Digital Director Pattern

```
┌────────────────────────────────────────────────────────────────┐
│                      Director                                   │
│                 (Scene Orchestrator)                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                  Mode Loop Registry                      │  │
│   ├─────────────┬─────────────┬─────────────┬───────────────┤  │
│   │   improv    │   reporter  │    roast    │     ...       │  │
│   │             │             │             │               │  │
│   │ ImprovMode  │ReporterMode │Performance  │  Interactive  │  │
│   │   .ts       │   .ts       │   Mode.ts   │   Mode.ts     │  │
│   └─────────────┴─────────────┴─────────────┴───────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    ModeContext                          │  │
│   │  (Shared API passed to all mode loops)                  │  │
│   ├─────────────────────────────────────────────────────────┤  │
│   │  manager: GroupChatManager                              │  │
│   │  callbacks: DirectorCallbacks (UI hooks)                │  │
│   │  chaosLevel: number (0-100)                             │  │
│   │  processTurn(text): Promise<void>                       │  │
│   │  isRunning(): boolean                                   │  │
│   │  interruptQueue: string[]                               │  │
│   │  memoryManager: MemoryManager                           │  │
│   │  recordCallbackVisual(...)                              │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Mode Loop System

Each interaction mode is implemented as a loop function:

```typescript
const MODE_LOOPS: Record<string, (scenario: Scenario, ctx: ModeContext) => Promise<void>> = {
    improv: runImprovLoop,           // Autonomous conversation
    autonomous: runAutonomousLoop,   // Self-directed topics
    reaction: runReactionLoop,       // Video reaction
    vision: runVisionLoop,           // Image analysis
    reporter: runReporterLoop,       // News discussion
    roast: runRoastLoop,             // Comedy roast
    story: runStoryLoop,             // Collaborative storytelling
    debate: runDebateLoop,           // Structured debate
    musical: runMusicalLoop,         // Rhythmic performance
    podcast: runPodcastLoop,         // Interview format
    trial: runTrialLoop,             // Courtroom simulation
    tech_support: runTechSupportLoop,// Tech support comedy
    dungeon_master: runDungeonMasterLoop, // RPG gameplay
    trivia: runTriviaLoop,           // Quiz show
    dream: runDreamLoop,             // Surreal narrative
    historical: runHistoricalLoop,   // Historical reenactment
    commentary: runCommentaryLoop,   // Sports/play commentary
}
```

### Scene Lifecycle

```
User selects mode
      │
      ▼
┌─────────────┐
│ playScenario│
│  (Director) │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ Reset State │────►│ Clear History│
│  Set Chaos  │     │ Reset Callbacks
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│ Mode Loop   │◄──── Runs until
│  Function   │      isRunning() = false
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  stopScene  │────►│ Auto-save   │
│             │     │  Episode    │
└─────────────┘     └─────────────┘
```

### Pacing Control

The Director implements three pacing types for varied rhythm:

| Type | Tokens | TTS Steps | Use Case |
|------|--------|-----------|----------|
| **Punchline** | 60 | 25 | Quick zingers, 30% chance |
| **Standard** | 150 | 16 | Normal conversation, 50% chance |
| **Rant** | 256 | 8 | Passionate monologues, 20% chance |

```typescript
private calculatePacing() {
    const roll = Math.random()
    if (roll > 0.7) {
        return { type: 'punchline', maxTokens: 60, ttsSteps: 25, 
                 promptSuffix: ' (Reply with a single, joking sentence.)' }
    } else if (roll > 0.2) {
        return { type: 'standard', maxTokens: 150, ttsSteps: 16,
                 promptSuffix: ' (Keep the conversation flowing. 1-2 sentences.)' }
    } else {
        return { type: 'rant', maxTokens: 256, ttsSteps: 8,
                 promptSuffix: ' (Go on a funny, passionate rant!)' }
    }
}
```

## 3. Comedy Engine

**Files**: `src/comedy/callbackEngine.ts`, `src/comedy/jokeLoader.ts`, `src/comedy/qualityFilter.ts`, `src/improv/branching.ts`

The Comedy Engine is the unique system that enables coherent, funny multi-agent improvisation.

### Subsystem Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Comedy Engine                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ CallbackEngine │  │  JokeLoader    │  │ QualityFilter  │   │
│  │                │  │                │  │                │   │
│  │ Running Gag    │  │  Joke Database │  │ Surprise       │   │
│  │ Tracking       │  │  - Absurdist   │  │ Rating (1-10)  │   │
│  │ Decay Curve    │  │  - Dark Tech   │  │ TTS Analysis   │   │
│  │ Theme Index    │  │  - Crowd Work  │  │ Homograph Fix  │   │
│  └───────┬────────┘  └───────┬────────┘  └────────────────┘   │
│          │                   │                                 │
│          └─────────┬─────────┘                                 │
│                    │                                           │
│                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              ImprovMode (Integration Layer)              │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  - SentimentTracker (cheer/boo → topic changes)         │  │
│  │  - QualityGate (filter responses < 6/10)                │  │
│  │  - CallbackManager (inject callbacks at 30% chance)     │  │
│  │  - ConversationTree (4-layer branching)                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Callback System

The callback engine tracks running gags across the conversation:

```
Joke Registration                    Decay Curve (Value Over Uses)
┌─────────────────┐
│ Register Joke   │                  1.5 ┤       ╭─╮
│  - Themes       │                      │      ╱   ╲     Peak at 3rd use
│  - Context      │                  1.2 ┤     ╱     ╲    (maximum hilarity)
└────────┬────────┘                  1.0 ┤────╱       ╲___
         │                           0.6 ┤            0.6   Declining
         ▼                           0.2 ┤____________0.2   Dead (6+)
┌─────────────────┐                      └────┬───┬───┬───┬───┬───┬
│ Record Callback │                           1   2   3   4   5   6
└────────┬────────┘                           Uses
         │
         ▼
┌─────────────────┐
│ Get Metrics     │   Status: fresh → building → peak → declining → dead
│  - Value (0-1.5)│
│  - Recommended? │
└─────────────────┘
```

**Code Example**:

```typescript
class CallbackManager {
    private engine: CallbackEngine
    
    // Register a joke theme for tracking
    registerJoke(jokeId: string, themes: string[], context?: string): void {
        this.engine.registerJoke(jokeId, themes, context)
    }
    
    // Record a callback and trigger visual feedback
    recordCallback(jokeId: string, agentId?: string): void {
        this.engine.recordCallback(jokeId)
        const metrics = this.engine.getCallbackMetrics(jokeId)
        
        // Trigger visual feedback via ModeContext
        if (this.ctx && agentId) {
            this.ctx.recordCallbackVisual(agentId, jokeId, 
                metrics.timesUsed, metrics.status)
        }
    }
    
    // Get prompt injection for peak callbacks
    getCallbackPrompt(): string {
        const peakCallbacks = this.engine.getPeakCallbacks() // 3rd use
        if (peakCallbacks.length > 0) {
            const context = peakCallbacks[0].contextSnippets[0]
            return `(SYSTEM: Reference this earlier bit: "${context}" - bring it back!)`
        }
        return ""
    }
}
```

### Conversation Branching

The branching system uses audience sentiment to drive topic changes:

```
┌────────────────────────────────────────────────────────────────┐
│                    4-Layer Conversation Tree                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 0: Root Topic                                            │
│     │                                                           │
│     ├──────┬──────┬──────┐                                     │
│     │      │      │      │                                     │
│     ▼      ▼      ▼      ▼                                     │
│  Layer 1: Sub-topics                                            │
│     │                                                           │
│     ├──────┬──────┐                                            │
│     │      │      │                                            │
│     ▼      ▼      ▼                                            │
│  Layer 2: Directions                                            │
│     │                                                           │
│     ├───┐                                                       │
│     │   │                                                       │
│     ▼   ▼                                                       │
│  Layer 3: Details (Max Depth)                                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Sentiment-Driven Decisions**:

| Sentiment | Threshold | Strategy | Action |
|-----------|-----------|----------|--------|
| Cheer | > 0.7 | `double_down` | Stay on topic, go deeper |
| Boo | > 0.5 | `pivot` | Switch to new topic from bank |
| Neutral | - | `continue` | Keep current direction |
| Max turns (4) | - | `escalate` | Move to child node or pivot |

### Quality Gating

Every response is rated for surprise/comedy value:

```typescript
class QualityGate {
    assessQuality(text: string): { passed: boolean; score: number; alternative?: JokeBit } {
        const rating = rateJoke(text)  // Uses qualityFilter.ts
        const passed = rating.score >= QUALITY_THRESHOLD // 6/10
        
        if (!passed) {
            // Inject alternative or quality prompt
            const alternative = getRandomJoke()
            return { passed: false, score: rating.score, alternative }
        }
        
        return { passed: true, score: rating.score }
    }
}
```

**Rating Criteria** (from `qualityFilter.ts`):

| Metric | Weight | Description |
|--------|--------|-------------|
| Subversion | 35% | Expectation subversion |
| Wordplay | 25% | Puns, double meanings |
| Timing | 20% | Setup/punchline structure |
| Originality | 20% | Novelty, cliché avoidance |

## Data Flow: Complete Turn Cycle

```
┌─────────────┐
│   User      │──► Clicks "Start Improv Scene"
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                        Director                               │
│  1. playScenario() creates ModeContext                        │
│  2. Calls runImprovLoop(scenario, ctx)                        │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                      ImprovMode                               │
│  3. Creates ConversationTree with seed topic                  │
│  4. Initializes CallbackManager, QualityGate                  │
│  5. Enters main loop                                          │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                    processTurn()                              │
│  6. Calculate pacing (punchline/standard/rant)                │
│  7. Check for heckles/interrupts                              │
│  8. Get callback prompt if peak available                     │
│  9. Inject chaos if random < chaosLevel                       │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                   GroupChatManager                            │
│  10. Build system prompt (persona + style + context)          │
│  11. Truncate history to last 8 messages                      │
│  12. Stream generation with agent parameters                  │
│  13. Emit sentences via onSentence callback                   │
└───────────────────────┬──────────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           │                         │
           ▼                         ▼
┌─────────────────┐        ┌─────────────────┐
│   AudioEngine   │        │      Stage      │
│  14. TTS synth  │        │  14. Lip-sync   │
│  15. Queue play │        │  15. Animation  │
└─────────────────┘        └─────────────────┘
           │                         │
           └────────────┬────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                 Response Processing                           │
│  16. QualityGate assesses response (1-10)                     │
│  17. Extract themes, register with CallbackManager            │
│  18. Check sentiment, possibly pivot topic                    │
│  19. Advance conversation tree                                │
│  20. Loop or exit                                             │
└──────────────────────────────────────────────────────────────┘
```

## Performance Considerations

### VRAM Budget (Typical 8GB GPU)

| Component | VRAM Usage |
|-----------|------------|
| Llama-3.2-3B (q4f16_1) | ~3.5 GB |
| Conversation Context | ~0.5 GB |
| TTS Models (ONNX) | ~0.3 GB |
| Three.js / WebGL | ~0.5 GB |
| **Total** | **~4.8 GB** |
| **Headroom** | **~3.2 GB** |

> **Rendering vs. inference split:** LLM inference always runs on WebGPU, while
> the Three.js avatar/stage rendering defaults to **WebGL2** (universal, easy to
> debug, no VRAM contention) with an **opt-in WebGPU** renderer. See
> [`docs/RENDERING.md`](./RENDERING.md) for the toggle and rationale.

### Optimizations

1. **KV-Cache Reuse**: WebLLM automatically caches context between turns
2. **History Truncation**: Max 8 messages prevents context explosion
3. **4-bit Quantization**: q4f16_1 models halve VRAM usage
4. **Frustum Culling**: Only render actors in camera view
5. **InstancedMesh**: 150 audience members in 1 draw call
6. **Throttled LOD**: Update level-of-detail every 10 frames

## Extension Points

### Adding a New Mode

1. Create mode file in `src/Director/modes/MyMode.ts`
2. Implement `async function runMyMode(scenario, ctx)`
3. Register in `Director.ts` MODE_LOOPS map
4. Add scenario type to `Scenario` interface

### Adding a New Agent

1. Add agent config to `src/config/agents.ts`
2. Add model mapping to `defaultAgentModelMappings`
3. Add voice mapping in `AudioEngine.ts`
4. Create custom actor class if needed (extends `Actor`)
5. Add to `Stage.ts` initActors()

### Adding Joke Bits

1. Create JSON in `src/comedy/bits/my_category.json`
2. Import in `jokeLoader.ts`
3. Add to `getRandomJoke()` switch statement
4. Update `JokeCategory` type

## App Service Wiring

`bootstrap.ts` constructs `GroupChatManager`, `MemoryManager`, `AudioEngine`/`SpeechQueue`, `Stage`,
and `SfxManager` once and threads them into the controllers (`chatController`, `improvController`,
`sceneController`, `episodeUi`, `directorBridge`) as explicit constructor/function parameters — no
`window.getX` globals. `Director` stays fully decoupled from `app/`: it exposes
`setPrerenderInvalidator(fn)` and `setEpisodeReadyHandler(fn)` hooks that `improvController` /
`episodeUi` register into once their services exist, rather than Director reaching into app-layer
globals to invalidate the prerender queue or show the episode export bar.

Two entry points (`main.ts`'s `setupDashboard()` / `startSyncPolling()`) run synchronously before
`initApp()`'s async body has constructed anything, so they can't receive services as ordinary
parameters. They instead take a `getMemoryManager: () => MemoryManager | null` argument backed by a
typed shared-instance module (`setSharedMemoryManager`/`getSharedMemoryManager` in
`MemoryManager.ts`, mirroring the existing `SfxManager.ts` pattern) — populated once `bootstrap.ts`
constructs the real instance. See AGENTS.md's "App service wiring" section for the full rationale.

## Related Documentation

- [COMEDY_GUIDE.md](./COMEDY_GUIDE.md) - Detailed comedy system documentation
- [model-plan.md](../model-plan.md) - WebLLM setup and model configuration
- [AGENTS.md](../AGENTS.md) - Complete agent and development guide
