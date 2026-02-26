# Avatar Interaction System: Expansion Plan

## Project Velocity
* **tasks_per_run**: 3
* **status**: On Track (Time Travel, Chef, & Medical Modes Added)

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
*   **Voice Input**: User talks to agents naturally.
*   **Commentary Mode**: Agents comment on a live feed (simulated).
*   **Tutorial Mode**: Agents teach the user how to use the app.
*   **Autonomous Agent Mode**: Agents chatter amongst themselves, shifting topics dynamically.
*   **The Trial**: Agents act as courtroom figures judging the user.
*   **Tech Support**: Agents act as unhelpful tech support.

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
* [x] **Cloud Persistence Refinement**:
    *   [x] **Authentication**: Ensure HF token validation is robust and user is prompted if token is invalid.
    *   [x] **Push Episode**: Implement background sync queue to push finished episodes to `user/jokesters-episodes` without blocking UI.
    *   [x] **Fetch Summaries**: On boot, fetch `summary.json` (or latest episode) from the dataset to seed `GroupChatManager` context.

#### Cloud Persistence Roadmap (Refined)
1.  **Authentication**:
    *   [x] Add "Hugging Face Token" and "Repo ID" fields to Settings Modal.
    *   [x] Implement `HFStorageManager.validateToken(token)` calling `https://huggingface.co/api/whoami-v2`.
    *   [x] Store encrypted/safe token in `localStorage` via `MemoryManager`.

2.  **Episode Storage**:
    *   [x] Define JSON schema for Episodes (History, Timestamp, Metadata).
    *   [x] Implement `MemoryManager.saveEpisodeToCloud(id, data)`:
        *   Construct filename: `episodes/episode-{id}.json`.
        *   Call `HFStorageManager.saveFile` (POST to `/api/datasets/{repo}/commit/main`).
    *   [x] Trigger save on "Save Episode" button click.

3.  **Continuity**:
    *   [x] Fetch "Previous Episode Summaries" at boot.
        *   *Action*: `MemoryManager.loadLastEpisode()` should fetch `episodes/latest.json` or query file list.
        *   *Action*: Inject summary into `GroupChatManager` system prompt on init.

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
* [x] **Voice Input**: Add STT (Web Speech API) to allow user to speak to agents.

### Phase 7: Deep Cloud Integration (The "Dream")
* [x] **Automated Sync**: Automatically save episodes to HF Dataset when a scene ends.
* [x] **Continuity**: Fetch "Previous Episode Summary" from HF at boot and inject into Agent context.
* [ ] **Community Scripts**: Load scripts from a shared/public HF dataset.
* [x] **Voice Input**: Add STT (Browser API) to allow user to speak to agents.

### Phase 7: Deep Immersion (Dreams)
* [x] **Podcast Mode**:
    *   Agents interview the user or each other.
    *   Implemented `Director.runPodcastLoop`.
* [x] **Interactive Fiction / Dungeon Master**:
    *   One agent acts as DM, others as players + User.
    *   Implemented `Director.runDungeonMasterLoop`.
* [ ] **Visual Context (Vision)**:
    *   Agents react to user-uploaded images or webcam feed.
    *   Implemented: `Director.runVisionLoop` + Multimodal support in `GroupChatManager`.
* [x] **Voice Input**: Add STT (SpeechRecognition) to allow user to speak to agents.

### Phase 8: Advanced Intelligence & Polish (The "Interview" Phase)
* [ ] **Vector Memory (RAG)**: Use `voy` or similar to retrieve past relevant jokes.
* [ ] **Personality Evolution**: Agents drift in personality based on user feedback (thumbs up/down).
* [ ] **Autonomous Agent Mode**: Agents chatter amongst themselves without user input until interrupted.
* [ ] **The Newsroom**: Enhanced Reporter mode with multiple segments and live tickers.
### Phase 8: Advanced Intelligence & Polish
* [x] **Autonomous Agent Mode**: Agents chatter amongst themselves without user input until interrupted.
* [x] **The Newsroom**: Enhanced Reporter mode with multiple segments and live tickers.
* [x] **Memory Recall (Simple RAG)**: Search local episode history for keywords and inject into context.
* [x] **Personality Evolution**: Agents drift in personality based on user feedback (thumbs up/down).

### Phase 9: New Horizons (The Dream)
* [x] **Trivia Night Mode**: Agents host a quiz show for the user.
    *   *Logic*: `Director.runTriviaLoop` asks questions and evaluates answers.
* [x] **Dream Mode**: Agents describe a surreal dream they shared.
    *   *Logic*: `Director.runDreamLoop` collaborative storytelling with dream logic.
* [x] **Multilingual Support**: Allow agents to speak in other languages based on user preference.
* [x] **The Trial**: Agents act as Judge, Prosecutor, and Defendant.
* [x] **Tech Support**: Agents act as frustrated tech support vs confused user.
* [x] **Historical Reenactment**: Agents act as historical figures debating a modern topic.
* [x] **Commentary Track**: Agents commentate on the user's input like esports casters.
* [x] **Mystery Mode**: Agents act as detectives solving a crime (or being interrogated).
    *   *Model Pairing*: Qwen2.5-Coder (Detective) vs Hermes-3 (Suspect).
    *   *Implementation*: `Director.runMysteryLoop` (CreativeMode).
* [ ] **Rap Battle Visuals**: Dedicated visual mode for musical battles with scoring and effects.

### Phase 10: Advanced Cloud Features
* [ ] **Vector Database Integration**: Integrate a vector database (e.g., Chroma or HF Embeddings) for semantic search of past episodes.
* [ ] **User Profile Sync**: Sync user preferences and custom scenarios to the cloud.
* [ ] **Community Scripts**: Allow users to share scripts to a public HF Dataset.

### Phase 11: Experimental AI (Dream Ideas)
* [x] **Code Review Mode**: Agents review code pasted by the user, roasting or praising it (using specialized coding models).
    *   *Implementation*: `Director.runCodeReviewLoop`.
* [x] **Movie Pitch Mode**: Agents collaboratively pitch a movie idea to a "Producer" (the User).
    *   *Implementation*: `Director.runPitchLoop` (CreativeMode).
* [x] **Therapy Session**: Agents act as different schools of psychology analyzing the user's problems.
    *   *Implementation*: `Director.runTherapyLoop`.
* [x] **Philosopher's Stone**: Agents debate a paradox (e.g., Trolley Problem) with increasing intensity until one "crashes" (simulated).
    *   *Implementation*: `Director.runPhilosopherLoop`.
* [x] **Alien First Contact**: Agents try to communicate with an alien entity (the User) using math, music, or mime.
    *   *Implementation*: `Director.runAlienLoop`.
* [ ] **Rap Battle Visuals**: Dedicated visual mode with beat visualization, rhyming checks (using phoneme matching), and crowd reaction effects.

### Phase 12: Enterprise-Grade Memory (The "Long Term" Dream)
* [ ] **IndexedDB Migration**: Move local storage from `localStorage` (5MB limit) to `IndexedDB` to support years of conversation history.
* [ ] **Semantic Search (RAG)**:
    *   Integrate `voy` (WASM Vector DB) to index past episodes.
    *   Allow agents to recall specific jokes or facts from weeks ago ("Remember when you said you liked pineapples?").
* [ ] **Multi-Profile Support**: Allow different users to login and have separate memory banks on the same device.
* [ ] **Hugging Face Dataset Mirroring**:
    *   Implement a full two-way sync (Pull all history on new device login).
    *   Handle merge conflicts if played on multiple devices.
    *   **Authentication**: Ensure strict token validation and error handling on startup. Verify token scope permissions (write access).
    *   **Push**: Implement a reliable background queue for pushing episode scripts to `user/jokesters-episodes` to avoid blocking UI. Use `HFStorageManager.saveFile` with retry logic.
    *   **Fetch**: Cache previous episode summaries locally to speed up boot time before fetching latest from cloud. specifically download `summary.json` at boot to prime the context window.

### Phase 13: New Creative Modes (Dream Ideas)
* [x] **Time Travel Paradox**: Agents from different eras (Past, Present, Future) argue about the timeline.
    *   *Implementation*: `Director.runTimeTravelLoop`.
* [x] **Chef's Kitchen**: Agents act as a head chef, sous chef, and health inspector critiquing a dish.
    *   *Implementation*: `Director.runChefLoop`.
* [x] **Medical Drama**: Agents enact a high-stakes surgery scene with absurd medical jargon.
    *   *Implementation*: `Director.runMedicalLoop`.

### Phase 14: Expanded Reality (New Dreams)
* [ ] **Haunted House Mode**: Agents investigate a spooky noise (Skeptic vs Believer).
* [ ] **Sports Commentary Mode**: Agents narrate a mundane activity (like doing laundry) as a high-stakes sport.
* [ ] **Reality TV Confessional**: Agents speak to the camera about other agents behind their backs.
* [ ] **Auction House**: Agents bid on absurd items with increasingly high stakes.
