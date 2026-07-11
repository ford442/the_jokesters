# The Jokesters — Roadmap & Future Features

This document tracks planned enhancements, feature ideas, and technical improvements for the project.

**Architecture guardrails:** [ADR 0001 — Native C++ / compile boundary](./adr/0001-native-cpp-boundary.md) (TypeScript-first; when Vicuna WASM compile or wllama/#119 is justified).

**Mode process (P0):** [MODE_QUALITY_BAR.md](./MODE_QUALITY_BAR.md) — new modes must clear the bar; prefer humor quality on existing modes.

**Live show vision (P3):** [LIVE_SHOW_VISION.md](./LIVE_SHOW_VISION.md) — audience mode, multi-human, crowd work, laugh track. **Blocked on foundation** (registry, prerender, export, SFX).

**Mode browser (P2):** [MODE_BROWSER.md](./MODE_BROWSER.md) — categorized discovery, search, favorites, lazy mode chunks.

**GroupChat facade (P1):** [GROUP_CHAT_FACADE.md](./GROUP_CHAT_FACADE.md) — `ConversationStore` + `ModelSession`; standardized engine interrupt/context API.

---

## ✅ Implemented Features

### Smart Director (Silent Coach)
- Director analyzes scene flow every turn (based on Chaos slider probability)
- Judges scene as **FLOWING** (good momentum) or **STAGNANT** (boring/repetitive)
- Injects a hidden instruction to the next agent to steer the scene
- Color-coded Director messages in chat log (teal = flowing, red = action needed)

### Gritty Style Guide
- "Gritty but Safe" style instruction injected into every agent turn
- Allows casual profanity (shit, hell, damn, f*ck) for realism
- Strictly forbids sexual violence, graphic gore, and hate speech
- Applied automatically — no toggle required

### Context Window Limiting
- Agent turns use last **15 messages** from conversation history
- Director critique uses last **6 messages** for focused momentum judgment
- Keeps inference fast and token usage manageable

---

## 🚧 Planned Features

### Configurable Context Window Size
**Priority:** Medium  
**Status:** Implemented (see [docs/CONTEXT_DEPTH.md](./CONTEXT_DEPTH.md))

Allow the context window size to be adjusted dynamically:

1. **Director-controlled window** — `zoom_in` / `zoom_out` / `recall:TOPIC` via `memoryHint` on critique
2. **Scene setup `contextDepth`** — per-scenario message limit; category defaults when omitted
3. **UI "Memory Depth" slider** — 4–30 messages, persisted in `localStorage`, live mid-session updates

**Implementation:**
- `GroupChatManager.setMemoryDepth()` + message-count slice before token truncation
- `getDirectorCritique()` returns `{ instruction, status, memoryHint }`
- Status bar shows depth + token usage

---

### Grittiness Level Presets
**Priority:** Low  
**Status:** Idea

Add selectable style presets:
- **PG** — No swearing, family-friendly
- **PG-13** — Mild swearing (damn, hell)
- **R** — Full casual profanity (current default)

Could be a dropdown in the settings panel or per-scene config.

---

### Runtime Content Filter
**Priority:** Low  
**Status:** Idea

Add a post-generation safety classifier to catch forbidden content that slips through the prompt-based guardrails. Could use a small classifier model or keyword blocklist.

---

### Director Memory / Scene Arc Tracking
**Priority:** Medium  
**Status:** Idea

Track high-level scene beats and callbacks:
- Director maintains a short "scene summary" that persists across turns
- Can reference earlier jokes/moments for callbacks
- Helps create satisfying narrative arcs in longer scenes

---

## 💡 Other Ideas

- **Per-agent grittiness** — Some characters swear more than others
- **Live comedy show** — Audience votes, multi-human slots, crowd work, laugh track — see **[LIVE_SHOW_VISION.md](./LIVE_SHOW_VISION.md)** (P3; MVP = local party mode, no server)
- **Audience reactions** — Simulated laugh track or emoji reactions based on joke quality *(partial: `Stage.triggerAudienceReaction`, heckler mode; full wiring in live-show MVP)*
- **Scene templates** — Pre-built scene setups (talk show, courtroom, etc.)
- **Export scene** — Save completed improv as transcript or video
- **Character-triggered Sound Effects (SFX)** — Allow characters to trigger sound effects from within their dialogue.
   - **Trigger format:** Recognize inline tokens (e.g., `[sfx:laugh]`) or JSON-like structured outputs from Director.
   - **SFX Manager:** Add a new `SfxManager` to preload and play sounds from `public/sfx/`.
   - **Playback modes:** overlay (play alongside TTS), interrupt (stop/pause TTS), or duck (lower TTS volume while SFX plays).
   - **Per-agent mapping:** Allow agent-specific SFX mappings (e.g., `comedian` -> `comedian_laugh.ogg`).
   - **UI:** Add SFX toggle and volume controls in settings, and a button to preview agent SFX.
   - **Director SFX:** Allow the Director to inject SFX via hidden instruction (e.g., `SFX:explosion`) and map those to audio events.
   - **Implementation notes:**
      - Extend `GroupChatManager.chat()` to include `onSfx?: (sfxName: string, agentId?: string)` callback or detect tokens in the existing streaming loop.
      - Create `src/audio/SfxManager.ts` to manage preloading and playing, and connect it to existing `SpeechQueue` and `AudioEngine` for ducking.
      - Preload a small core SFX set at init and lazy-load extras on-demand.
   - **Safety:** Use a whitelist for allowed SFX names to avoid path traversal or arbitrary fetches.

---

---

## 🎯 Recent Implementation Summary

### LLM Dialog Prerendering System (Implemented Dec 2025)

**Problem Solved:**  
Long gaps between agent responses during improv scenes broke the flow and made performances feel sluggish.

**Solution:**  
Implemented a smart prerendering system that generates conversation turns ahead of time in the background.

**How It Works:**
1. **Initial Prerender**: When starting a scene, system generates 3 turns immediately
2. **Background Queue**: As turns play, system automatically generates 2 more turns in background
3. **Smart Trigger**: When queue drops below 2 turns, background generation kicks in
4. **Instant Playback**: Prerendered dialogue plays with zero LLM wait time
5. **State Preservation**: Prerendering uses temporary conversation state, doesn't affect actual history

**Configuration Constants:**
- `PRERENDER_INITIAL_TURNS = 3` - Opening dialogue batch size
- `PRERENDER_MIN_QUEUE = 2` - Queue threshold for background generation
- `PRERENDER_BATCH_SIZE = 2` - Background generation batch size
- `MAX_PRERENDER_SENTENCES = 3` - Audio prerender limit

**Benefits:**
- ✅ Eliminates 3-5 second gaps between responses
- ✅ Maintains natural conversation flow
- ✅ Works transparently in background
- ✅ Gracefully falls back to live generation if needed
- ✅ No impact on memory or performance

**API:**
```typescript
// In GroupChatManager
async prerenderTurns(
  initialPrompt: string,
  turnCount: number = 3
): Promise<Array<{ agentId, agentName, response, sentences }>>

addToHistory(userMessage: string, assistantResponse: string): void
```

---

## 🎭 Scene-Starting System Analysis & Future Directions

### Current System: Prompt-Driven Scene Initialization

**How It Works:**
- User provides a **scene title** and **description** (e.g., "At the Coffee Shop" / "Three friends discuss adventures")
- The system creates an initial prompt combining scene context with character instructions
- Agents improvise within the scene constraints, taking turns organically
- Director can intervene based on chaos level to maintain flow or escalate tension

**Strengths:**
- ✅ **Flexible** — Works for any scenario without pre-scripting
- ✅ **Creative autonomy** — Agents improvise naturally within characters
- ✅ **Low barrier to entry** — Only requires 1-2 sentences from the user
- ✅ **Dynamic pacing** — Random pacing system (one-liners, standard, rants) creates rhythm variety
- ✅ **Director intelligence** — Silent coach analyzes momentum and injects steering when needed

**Weaknesses:**
- ⚠️ **Generic setups** — Without detailed context, scenes can feel aimless
- ⚠️ **No structure** — Lacks classic improv formats (games, scenes with specific rules)
- ⚠️ **Limited callbacks** — Agents don't retain long-term memory for recurring jokes
- ⚠️ **Unpredictable humor quality** — Success depends heavily on LLM output

---

### Alternative Scene-Starting Methods

#### Method 1: Full Script Supply
**Description:** Provide a complete dialogue script for agents to perform.

**Pros:**
- Guaranteed quality control
- Can replicate classic comedy sketches
- Predictable timing and structure

**Cons:**
- Removes spontaneity and improvisation
- Requires significant upfront writing
- Agents become puppets rather than performers

**Use Case:** Best for educational demonstrations or recreating famous scenes.

---

#### Method 2: Storyline/Adventure Mode
**Description:** Provide a narrative arc with plot points, goals, or obstacles agents must navigate.

**Example:**
```
Story: "A heist goes wrong"
Act 1: Planning the heist at a diner
Act 2: The plan fails hilariously
Act 3: Escaping the consequences
```

**Pros:**
- Creates dramatic structure and tension
- Gives agents clear objectives to pursue
- Natural escalation and resolution
- Callbacks are easier (refer to earlier acts)

**Cons:**
- Requires more complex Director logic
- May feel constraining to pure improv
- Harder to implement technically

**Use Case:** Best for longer-form narrative comedy with arcs and payoffs.

---

#### Method 3: Improv Game Formats
**Description:** Use classic improv game structures (e.g., "Questions Only", "Character Swap", "Props").

**Example:**
```
Game: "Questions Only"
Rule: All lines must be questions. If someone makes a statement, they lose.
Setup: "At a job interview"
```

**Pros:**
- Creates built-in tension and rules
- Forces creativity within constraints
- Familiar to improv audiences
- Easy to judge "success" or "failure"

**Cons:**
- LLMs may struggle to follow strict rules consistently
- Requires robust validation system
- Limited to structured formats

**Use Case:** Best for game-show-style entertainment with clear win/loss conditions.

---

#### Method 4: Character Relationship Pre-Definition
**Description:** Define relationships before the scene (e.g., "Comedian and Philosopher are exes", "Scientist is Comedian's therapist").

**Pros:**
- Instant dramatic tension
- Provides subtext and motivations
- Creates richer character dynamics

**Cons:**
- Requires UI for relationship definition
- May complicate system prompts
- Agents need relationship memory

**Use Case:** Best for character-driven comedy with emotional stakes.

---

### What Makes Current Setup Humorous (and Not)

#### ✅ What Works:
1. **Personality contrast** — Fast comedian vs. slow philosopher creates natural tension
2. **Character consistency** — Agents maintain distinct voices (frantic vs. pretentious vs. analytical)
3. **Director interventions** — When stagnant, Director injects chaos effectively
4. **Gritty style guide** — Casual profanity adds realism and edge
5. **Pacing variety** — Random one-liners vs. rants keeps rhythm unpredictable

#### ❌ What Doesn't Work:
1. **Repetitive patterns** — Agents can fall into predictable response loops
2. **Lack of callbacks** — No memory of earlier jokes for running gags
3. **Unclear stakes** — Scenes can feel aimless without goals or obstacles
4. **Weak scene endings** — No natural climax or resolution
5. **Limited physical comedy** — Text-based limits slapstick potential
6. **No audience interaction** — Missing simulated reactions (laughs, groans)

---

### 🚀 How to Improve TV-Show-Like Entertainment

#### 1. Episode Structure
- **Cold Open:** Quick 1-minute scene before main sketch
- **Main Sketch:** 3-5 minute improv with arc
- **Tag:** Quick callback joke at the end
- Implement scene "chapters" with Director managing transitions

#### 2. Audience Simulation
- Add simulated laugh track or emoji reactions based on joke quality
- Use sentiment analysis or Director to judge "funniness"
- Visual feedback (e.g., applause meter, live audience avatars)

#### 3. Recurring Characters & Callbacks
- **Character memory system**: Store "signature moves" (e.g., Comedian's trademark rant about hotdogs)
- **Callback injection**: Director can prompt agents to reference earlier jokes
- **Running gags**: Track recurring themes across scenes

#### 4. Guest Characters / NPCs
- Allow Director to spawn one-off characters mid-scene
  - Example: "A waiter interrupts with a ridiculous order"
- Temporary fourth agent controlled by Director for plot twists

#### 5. Scene Templates Library
Pre-built setups with structure:
- **Talk Show** — Host interviews agents with pre-defined segments
- **Courtroom** — Prosecutor vs. Defense with absurd case
- **Game Show** — Host asks trivia, agents compete hilariously
- **News Desk** — Anchor reports breaking "news" with correspondent interviews

#### 6. Music & Sound Effects
- Background music based on scene mood (tension, slapstick, dramatic)
- Character-triggered SFX (already planned in roadmap)
- Intro/outro jingles for "episodes"

#### 7. Visual Enhancements
- Better avatars with expressive animations
- Scene-specific backgrounds (coffee shop, courtroom, spaceship)
- Visual props that appear based on dialogue
- Camera angles that change dynamically

---

### 🎬 New Angles for Automated Character Interaction

#### 1. Antagonistic Pairing
- Assign **conflict roles** per scene:
  - Agent A: "You want to leave the party"
  - Agent B: "You want them to stay"
- Forces genuine dramatic tension and negotiation

#### 2. Secret Objectives
- Each agent gets a **hidden goal** unknown to others:
  - Comedian: "Steer conversation to your favorite topic: pickles"
  - Philosopher: "Avoid talking about your embarrassing past"
- Director tracks whether they achieve goals

#### 3. Status Games
- Assign **power dynamics**:
  - High status: Philosopher is boss, others are employees
  - Low status: Scientist is intern, gets picked on
- Changes how agents address and interrupt each other

#### 4. Timed Challenges
- **Beat the clock**: Agents must resolve situation in 5 turns
- **Speed rounds**: One-liners only for 3 turns
- **Silence game**: Longest pause wins (agents try NOT to talk)

#### 5. Emotional Arcs
- Assign **emotional journey** per character:
  - Start: Angry → Middle: Confused → End: Joyful
- Director enforces emotional checkpoints

#### 6. Genre Shifts Mid-Scene
- Director can announce: "GENRE SHIFT: Now it's a horror scene"
- Agents must adapt on the fly, creating absurd tonal whiplash

#### 7. Audience Voting System
- After each turn, simulate "audience vote" for best line
- Winning agent gets spotlight bonus or extra turn
- Gamifies performance and creates competition

#### 8. Character Swap Mechanic
- Mid-scene, Director forces agents to **swap personalities**
- Comedian becomes Philosopher, etc.
- Tests versatility and creates chaos

---

### Implementation Priorities

**Phase 1 - Quick Wins (1-2 weeks):**
- [ ] Add scene templates library (talk show, courtroom, news desk)
- [ ] Implement simulated audience reactions (laugh track, emoji reactions)
- [ ] Create "cold open" + "tag" episode structure

**Phase 2 - Medium Complexity (3-4 weeks):**
- [ ] Build character memory system for callbacks
- [ ] Add secret objectives and conflict roles
- [ ] Implement status games and power dynamics

**Phase 3 - Advanced Features (5-8 weeks):**
- [ ] Guest character / NPC spawning by Director
- [ ] Genre shift mechanism
- [ ] Emotional arc tracking
- [ ] Audience voting system

---

## Contributing

Feel free to pick up any planned feature! Open an issue first to discuss approach.
