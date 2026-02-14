# Avatar Interaction System: Expansion Plan

## Project Velocity
* **tasks_per_run**: 3
* **status**: On Fire! (Musical Mode + Voice Input)

## 1. System Philosophy: "The Digital Director"
Our architecture relies on a **Centralized Director / Stateless Actor** model.
- **The Agents** (`Comedian`, `Philosopher`, `Scientist`) are stateless configurations (Prompts + Visual Params). They do not "think" independently; they react to the context provided to them.
- **The Director** is the main loop (currently in `src/Director/Director.ts`) that orchestrates the scene. It holds the state, decides who speaks, determines the pacing, and injects environmental context.

**Goal:** To perfect interactions, we will move logic *out* of the random loop and *into* structured "Director Modes."

---

## 2. Core Architecture Enhancements

### A. Formalize the Director
* **Responsibility:** Manage the "Game Loop" of the conversation.
* **Input:** A `Scenario` object (Improv, Script, Reaction, Reporter, etc.).
* **Output:** Orchestrates `GroupChatManager.chat()` calls and `Stage` visual cues.

### B. The Context Injection Pipeline
To support new modes, we need a standard way to inject "World Info" into the LLM prompt without breaking character.
* **Mechanism:** Append "Stage Directions" to the prompt, hidden from the user.
* **Format:** `(SYSTEM_INJECTION: [Context])`

---

## 3. New Interaction Modes (The "Dream" Phase)

### Mode A: Scripted Vignettes ("The Writer's Room")
*Description: Agents perform a pre-written or AI-generated script instead of improvising.*
* **Status:** Implemented (`ScriptGenerator` + `Director.runScriptLoop`).

### Mode B: Media Reaction ("The MST3K Protocol")
*Description: Agents watch a video or look at images and comment on them in real-time.*

### Mode C: The Reporter (Dynamic Context / RAG)
*Description: Agents act as experts on specific live topics (Olympics, Science).*

### Mode D: Serialized Memory ("TV Show Logic")
*Description: Agents remember past interactions across sessions.*

### Mode E: Creative Expansion (New)
*   **Roast Battle Mode**: Agents take turns roasting each other or the user.
    *   *Model Pairing*: Hermes-3 (Uncensored) or Llama-3 (Instruct) for maximum creativity and bite.
    *   *Mechanic*: Score tracking based on "Oooooh" reactions from other agents.
*   **Collaborative Storytelling**: Agents build a story sentence by sentence.
    *   *Model Pairing*: Phi-3 (High logic/coherence) to keep the plot on rails.
*   **The Debate Club**: Two agents debate an absurd topic, while the third moderates.
    *   *Model Pairing*: Qwen2.5-Coder (Logic) vs. Hermes-3 (Creativity).
    *   *Mechanic*: Moderator tracks time and assigns points.
*   **Heckler Interaction**: User interrupts, agents must handle it dynamically.
*   **Musical Improv**: Agents generate lyrics to a beat (requires TTS timing sync).
    *   *Challenge*: syncing TTS with audio beat.

---

## 4. Infrastructure & Storage (HF Integration)

### Goal: Cloud Persistence
Move heavy data (scripts, memories) to Hugging Face storage (Datasets/Hub).

1.  **Authentication**: Implement HF OAuth or Token input in UI (Settings Modal).
2.  **Episode Storage**: Push finished "Episode Scripts" (JSON) to a private HF Dataset.
    *   `Dataset: user/jokesters-episodes`
    *   *Action*: `MemoryManager` should switch from `localStorage` to `HFStorageManager` if token is present.
3.  **Continuity**: Fetch "Previous Episode Summaries" at boot to seed the context window.
    *   *Logic*: Check for `summary.json` in the dataset, inject into system prompt.
4.  **Vector Memory**: (Future) Use a local vector store (e.g. Voy or simple cosine similarity) to retrieve relevant past jokes.

---

## 5. Audio & Interaction (Future)

*   **Musical Improv**: Agents generate lyrics to a beat.
    *   Requires: Audio analysis (BPM detection) or pre-set backing tracks.
    *   Sync: TTS timing must be adjusted (maybe simple syllable counting).
*   **Heckler Interaction**:
    *   User input during an active `Director` loop should trigger an interrupt.
    *   `Director` needs to listen to `GroupChatManager` events or UI input while running a loop.

---

## 5. Implementation Roadmap

### Phase 1: The Refactor (Foundation)
* [x] Extract `Director` logic from `main.ts` into `src/Director/Director.ts`.
* [x] Create `Director.playScenario(scenario)` interface.

### Phase 2: The "Watcher" (MST3K)
* [x] Add a video player to the UI (hidden or behind agents).
* [x] Create `MediaReactionManager` to poll video time and dispatch events.
* [x] Test with a hardcoded video + JSON description file.

### Phase 3: The "Writer" (Scripts)
* [x] Create `ScriptParser` to read JSON scripts.
* [x] Connect to a "Script Generator" (External LLM API hook / Local LLM).
    *   *Implemented*: `ScriptGenerator` class using `GroupChatManager.completion`.

### Phase 4: Persistence (HF Integration)
* [x] Implement `MemoryManager` (Local `localStorage` wrapper first).
* [x] Add HF Token Input in Settings Modal.
* [x] Implement `HFStorageManager` class using `fetch` (REST API).
    *   `authenticate(token)`
    *   `saveEpisode(data)`
    *   `loadLastEpisode()`
* [x] Add "Save/Load" buttons to the UI (Cloud Sync).

### Phase 5: New Creative Modes
* [x] **Roast Battle Mode**:
    *   Implement `Director.runRoastLoop(scenario)`.
    *   Agents react with "Oooooh" or "Weak!" (Simulated via System Messages).
* [x] **Collaborative Storytelling**:
    *   Implement `Director.runStoryLoop(scenario)`.
    *   Agents take turns adding exactly one sentence.
    *   Context injection: "The story so far: [Summary]".
* [x] **The Debate Club**:
    *   Implement `Director.runDebateLoop(scenario)`.
    *   Moderator (Scientist) enforces time limits.
    *   Topic Generator integration (via UI input).

### Phase 6: Audio & Interaction
* [x] **Heckler Interaction**: Implement dynamic handling in `Director` loop (Input interrupt).
* [x] **Musical Improv**: (Experimental) Sync TTS with audio beat.
* [x] **Voice Input**: Add STT (SpeechRecognition) to allow user to speak to agents.

### Phase 7: Advanced Intelligence & Polish (The "Interview" Phase)
* [ ] **Vector Memory (RAG)**: Use `voy` or similar to retrieve past relevant jokes.
* [ ] **Personality Evolution**: Agents drift in personality based on user feedback (thumbs up/down).
* [ ] **The Interview Mode**: One agent interviews the user.
