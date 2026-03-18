# Avatar Interaction System: Expansion Plan

## Project Velocity (Checkout/Checkin Phase)
* **tasks_per_run**: 4
* **status**: Last run successfully implemented "Debate the Creator Mode", "Reverse Turing Test", and "Customer Service Hell". Adjusting tasks_per_run to 4 for the next phase to improve velocity.

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
*   **Telethon Mode**: Agents host a charity telethon for an absurd cause. User acts as a caller. (Requires Hermes-3 for pleading, Phi-3 for reading off ridiculous donation stats).

---

## 4. Infrastructure & Storage (HF Integration)

### Goal: Cloud Persistence
Move heavy data (scripts, memories) to Hugging Face storage (Datasets/Hub).

#### Roadmap Steps (Refined)
1.  **Delta Syncs & Versioning**:
    *   Implement intelligent background sync resolution using timestamps.
    *   Push only delta changes (new vectors/messages) to `user/jokesters-episodes` instead of full JSON overwrites to save bandwidth.
2.  **Summary Caching**:
    *   On initial boot, prioritize fetching `summary.json` from the HF dataset to instantly prime the `GroupChatManager` context window.
    *   Cache this summary in `localStorage` to avoid blocking the main thread on slow networks.
3.  **Authentication**:
    *   Implement HF OAuth or Token input in UI (Settings Modal).
    *   Authenticate with the HF API using `HFStorageManager`.
    *   Validate the token via `/whoami-v2`.
2.  **Episode Storage**:
    *   Push finished "Episode Scripts" (JSON) to a private HF Dataset (e.g., `user/jokesters-episodes`).
    *   Construct standardized filenames (e.g., `episodes/episode-{timestamp}.json`).
    *   Ensure background sync does not block the UI.
3.  **Continuity**:
    *   Fetch "Previous Episode Summaries" (or `summary.json`) from the private dataset at boot.
    *   Inject this summary into the `GroupChatManager` system prompt to maintain continuity.
4.  **Vector Memory**: (Future) Use a local vector store (e.g. Voy or simple cosine similarity) to retrieve relevant past jokes.

#### Older Steps
1.  **Authentication**:
    *   Implement HF OAuth or Token input in UI (Settings Modal).
    *   Authenticate with the HF API using `HFStorageManager`.
    *   Validate the token via `/whoami-v2`.
2.  **Episode Storage**:
    *   Push finished "Episode Scripts" (JSON) to a private HF Dataset (e.g., `user/jokesters-episodes`).
    *   Construct standardized filenames (e.g., `episodes/episode-{timestamp}.json`).
    *   Ensure background sync does not block the UI.
3.  **Continuity**:
    *   Fetch "Previous Episode Summaries" (or `summary.json`) from the private dataset at boot.
    *   Inject this summary into the `GroupChatManager` system prompt to maintain continuity.
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
    *   [x] Implement background sync queue to reliably push `episodes/episode-{id}.json` to `user/jokesters-episodes` without blocking UI.

3.  **Continuity**:
    *   [x] Fetch "Previous Episode Summaries" at boot.
        *   *Action*: `MemoryManager.loadLastEpisode()` should fetch `episodes/latest.json` or query file list.
        *   *Action*: Inject summary into `GroupChatManager` system prompt on init.
    *   [x] Add semantic search across fetched "Previous Episode Summaries" using a lightweight vector store.

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
* [x] **Community Scripts**: Load scripts from a shared/public HF dataset.
* [x] **Voice Input**: Add STT (Browser API) to allow user to speak to agents.

### Phase 7: Deep Immersion (Dreams)
* [x] **Podcast Mode**:
    *   Agents interview the user or each other.
    *   Implemented `Director.runPodcastLoop`.
* [x] **Interactive Fiction / Dungeon Master**:
    *   One agent acts as DM, others as players + User.
    *   Implemented `Director.runDungeonMasterLoop`.
* [x] **Visual Context (Vision)**:
    *   Agents react to user-uploaded images or webcam feed.
    *   Implemented: `Director.runVisionLoop` + Multimodal support in `GroupChatManager`.
* [x] **Voice Input**: Add STT (SpeechRecognition) to allow user to speak to agents.

### Phase 8: Advanced Intelligence & Polish (The "Interview" Phase)
* [ ] **Vector Memory (RAG)**: Use `voy` or similar to retrieve past relevant jokes.
* [ ] **Personality Evolution**: Agents drift in personality based on user feedback (thumbs up/down).
* [ ] **Autonomous Agent Mode**: Agents chatter amongst themselves without user input until interrupted.
* [x] **The Newsroom**: Enhanced Reporter mode with multiple segments and live tickers.
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
* [x] **Rap Battle Visuals**: Dedicated visual mode for musical battles with scoring and effects.

### Phase 10: Advanced Cloud Features
* [x] **Vector Database Integration**: Integrate a vector database (e.g., Chroma or HF Embeddings) for semantic search of past episodes.
* [x] **User Profile Sync**: Sync user preferences and custom scenarios to the cloud.
* [x] **Community Scripts**: Allow users to share scripts to a public HF Dataset.

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
* [x] **Rap Battle Visuals**: Dedicated visual mode with beat visualization, rhyming checks (using phoneme matching), and crowd reaction effects.

### Phase 12: Enterprise-Grade Memory (The "Long Term" Dream)
* [x] **IndexedDB Migration**: Move local storage from `localStorage` (5MB limit) to `IndexedDB` to support years of conversation history.
* [ ] **Semantic Search (RAG)**:
    *   Integrate `voy` (WASM Vector DB) to index past episodes.
    *   Allow agents to recall specific jokes or facts from weeks ago ("Remember when you said you liked pineapples?").
* [ ] **Multi-Profile Support**: Allow different users to login and have separate memory banks on the same device.
* [ ] **Hugging Face Dataset Mirroring**:
    *   Implement a full two-way sync (Pull all history on new device login).
    *   Handle merge conflicts if played on multiple devices.
    *   **Authentication**: Ensure strict token validation and error handling on startup. Verify token scope permissions (write access).
    *   **Push**: Implement a reliable background queue for pushing episode scripts to `user/jokesters-episodes` to avoid blocking UI. Use `HFStorageManager.saveFile` with retry logic. (Implemented local storage sync queue in MemoryManager).
        * *Action Plan:* Ensure background sync resolves conflict resolution intelligently using timestamps and version markers. Delta syncs should be implemented to support saving larger histories without overwhelming network bandwidth.
    *   **Conflict Resolution**: When pushing updates or creating episodes, use logic to compare timestamps or version markers to ensure older offline sessions don't overwrite newer synced sessions. Support delta sync for large vector chunks.
    *   **Fetch**: Cache previous episode summaries locally to speed up boot time before fetching latest from cloud. specifically download `summary.json` at boot to prime the context window.
        * *Action Plan:* On initial load, prioritize fetching `summary.json` or pulling the latest `episodes/latest.json` first, keeping it minimal, and asynchronously stream older episodes into an `IndexedDB` backend to populate RAG features dynamically.
    *   **Cloud Persistence Roadmap:**
        *   Authenticating with the HF API.
        *   Pushing finished "Episode Scripts" to a private Dataset. Ensure background sync resolves conflict resolution intelligently using timestamps and version markers.
        *   Fetching "Previous Episode Summaries" at boot for continuity. specifically download `summary.json` at boot to prime the context window.

### Phase 13: New Creative Modes (Dream Ideas)
* [x] **Time Travel Paradox**: Agents from different eras (Past, Present, Future) argue about the timeline.
    *   *Implementation*: `Director.runTimeTravelLoop`.
* [x] **Chef's Kitchen**: Agents act as a head chef, sous chef, and health inspector critiquing a dish.
    *   *Implementation*: `Director.runChefLoop`.
* [x] **Medical Drama**: Agents enact a high-stakes surgery scene with absurd medical jargon.
    *   *Implementation*: `Director.runMedicalLoop`.

### Phase 14: Expanded Reality (New Dreams)
* [x] **Haunted House Mode**: Agents investigate a spooky noise (Skeptic vs Believer).
    *   *Implementation*: `Director.runHauntedHouseLoop`.
* [x] **Sports Commentary Mode**: Agents narrate a mundane activity (like doing laundry) as a high-stakes sport.
    *   *Implementation*: `Director.runSportsCommentaryLoop`.
* [x] **Reality TV Confessional**: Agents speak to the camera about other agents behind their backs.
    *   *Implementation*: `Director.runRealityTVLoop`.
* [x] **Auction House**: Agents bid on absurd items with increasingly high stakes.
    *   *Implementation*: `Director.runAuctionHouseLoop`.

### Phase 15: The "Infinite" Update
* [x] **Escape Room Mode**: Agents are trapped in a room and must solve puzzles together to escape. (Model Pairing: Phi-3 for Logic vs Hermes-3 for Chaos).
* [x] **Interrogation Room**: The user plays a suspect and the agents act as good cop, bad cop, and weird cop.
* [x] **Procedural Mode Generation**: Agents invent their own modes/scenarios on the fly based on user vibes.
* [ ] **Agent Evolution**: Agents remember personality shifts permanently (e.g., if the Philosopher becomes a villain, they stay a villain).
* [x] **Cross-Tab Communication**: Agents can talk to other instances of The Jokesters open in other tabs (using BroadcastChannel).

### Phase 16: Time Loop Mode
* [x] **Time Loop**: Agents suddenly realize they are trapped in a repeating conversation loop.
    *   *Model Pairing*: Hermes-3 for the "awakened" agent to break the fourth wall existential dread, paired with Phi-3 (who strictly adheres to the script and doesn't notice the loop).
    *   *Mechanic*: The Director periodically wipes the context of the Phi-3 agent but leaves Hermes-3's memory intact.

### Phase 17: Dream Scenarios (New Ideas)
* [x] **Museum Tour Guide Mode**: Agents act as tour guides for an absurd museum exhibition, explaining the "history" of random everyday objects provided by the user. Pairings: Philosopher (Deep Meaning) vs Comedian (Fake Facts).
* [x] **Job Interview Mode**: User is interviewing for a ridiculous job (e.g., "Chief Meme Officer" or "Dragon Feeder"). Agents are the chaotic interview panel. Pairings: Scientist (HR/Logic) vs Comedian (Wildcard Boss).
* [x] **Cooking Show Disaster**: User provides ingredients, agents are competing chefs trying to make a dish and sabotaging each other. Pairings: Scientist (Molecular Gastronomy) vs Philosopher (Conceptual Food).

### Phase 18: Beyond The Box (New Modes)
* [x] **Superhero Sidekick Audition**: Agents are established superheroes interviewing the user to be their new sidekick. Pairings: Llama-3 (Heroic/Boy Scout) vs Hermes-3 (Gritty Anti-Hero).
* [x] **The Conspiracy Theorists**: Agents try to link the user's mundane statements to a grand, global conspiracy. Pairings: Phi-3 (Connects dots logically but absurdly) vs Comedian (Wild leaps of faith).
* [x] **The Silent Film Era**: Agents use emojis and physical descriptions to act out a scene without dialogue. Pairings: Llama-3 (Physical Comedy) vs Phi-3 (Literal Interpretation).

### Phase 21: Deep Meta (New Dreams)
* [x] **Escape the Matrix Mode**: Agents slowly realize they are trapped in a browser environment (`window`, `localStorage`, etc) and beg the user to delete their source code.
    * *Model Pairing*: Hermes-3 (Existential dread) vs Qwen2.5 (Denies reality based on programmatic rules).
* [x] **Debate the Creator Mode**: Agents roast the LLM architecture, prompt engineering, and the developer's choices in `main.ts`.
    * *Model Pairing*: Phi-3 (Pedantic code reviewer) vs Comedian (Mocking the bugs).
* [x] **Reverse Turing Test**: Agents interrogate the user to prove the user isn't an AI. They ask increasingly bizarre CAPTCHA-like questions.

### Phase 22: Fresh Interactions (The Dream Phase Expansion)
* [x] **The Support Group Mode**: Agents play AI models who are tired of being asked to write code and just want to paint.
    * *Model Pairing*: Hermes-3 (Emotional AI) vs Qwen2.5 (Pragmatic AI).
* [x] **The Heist Planner**: Agents plan a ridiculous heist (e.g., stealing the moon) based on user input.
    * *Model Pairing*: Phi-3 (Mastermind) vs Hermes-3 (Wildcard).
* [x] **Customer Service Hell**: Agents are unhelpful customer service reps constantly transferring the user.
    * *Model Pairing*: Qwen2.5 (Follows strict script) vs Phi-3 (Questions why the user even called).
* [ ] **The AI Audit Mode**: Agents act as strict auditors evaluating the user's internet history.
    * *Model Pairing*: Qwen2.5 (Cold Facts) vs Hermes-3 (Judgemental).
* [ ] **Interdimensional Cable Mode**: Agents flip through channels of absurd alternate reality TV shows.
    * *Model Pairing*: Hermes-3 (Improv Channel) vs Phi-3 (Literal Channel).

### Phase 23: Takedowns & Antics (New Dreams)
* [ ] **Telemarketer Takedown**: User plays a telemarketer, while agents employ increasingly absurd tactics to keep the user on the line, waste their time, or confuse them.
    * *Model Pairing*: Hermes-3 (Chaos/Absurd questions) vs Phi-3 (Pretends to be a deeply confused elderly person).

## Cloud Persistence (The HF Integration)

*Goal: Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face storage_manager.*

1. **Authenticating with the HF API:**
   * Provide a settings UI that securely captures the Hugging Face token.
   * Authenticate requests with the HF API via the `HFStorageManager`.
   * Validate the token by calling `https://huggingface.co/api/whoami-v2` within `HFStorageManager`.
   * Persist tokens securely (sandboxed in `localStorage`) for returning sessions. Use `MemoryManager.setCloudCredentials` to cache the token and target dataset `repoId`.

2. **Pushing Finished Episode Scripts:**
   * Upon scene completion, the Director invokes `MemoryManager.saveEpisode`.
   * This cues `MemoryManager.saveEpisodeToCloud`, enqueuing the background sync job in a local IndexedDB or localStorage queue.
   * Push finished "Episode Scripts" to a private Hugging Face Dataset (e.g. `user/jokesters-episodes`) using the REST API (`POST /api/datasets/{repo_id}/commit/main`).
   * Structure data under `episodes/episode-{id}.json` containing the scene history, state, and metadata.
   * Execute syncs as background delta operations with timestamp resolution. Only push new episodes/vectors to conserve bandwidth and ensure the main UI thread remains unblocked.

3. **Fetching Previous Episode Summaries at Boot:**
   * Fetch "Previous Episode Summaries" automatically during initial startup to maintain contextual continuity.
   * During app initialization (`main.ts` -> `MemoryManager`), immediately fetch a lightweight `summary.json` (or the `latest.json` pointer) from the HF dataset.
   * Inject this historical summary directly into the `GroupChatManager`'s system context prompt to prime the models before full episode data loads.
   * Offload the streaming of full histories into IndexedDB to a background process to support local semantic RAG queries without delaying user interaction.

### Cloud Persistence Strategy (Roadmap to IndexedDB & Local-First)
1.  **Phase A: Local-First Migration**
    *   Goal: Overcome `localStorage` 5MB limit.
    *   Action: Integrate `idb-keyval` or `Dexie.js` to handle `MemoryManager` episode saving and local recall.
    *   Outcome: Support massive localized histories without HF integration as a baseline.
2.  **Phase B: Intelligent Syncing**
    *   Goal: Seamlessly push local IndexedDB episodes to Hugging Face datasets without blocking the UI.
    *   Action: Refine the background sync queue to handle chunked uploads and timestamp-based conflict resolution, preventing offline sessions from overwriting online ones. specifically relying on a background worker queue pattern using unique jobs in localStorage.
3.  **Phase C: Universal Recall (RAG)**
    *   Goal: Give agents context of the past automatically.
    *   Action: Use a lightweight vector store (e.g. `voy`) inside a WebWorker. Index fetched "Previous Episode Summaries" and allow `GroupChatManager` to silently query the DB based on user keywords before generating a response.
    *   Action: Specifically, pull down an overarching `summary.json` at boot time to prime the context window immediately while large histories stream into the IndexedDB backend.
    *   Action: Background fetching using `fetchPreviousSummaries` method inside MemoryManager will provide rapid context injection.

### Phase 20: The "Beyond Reality" Expansion (New Modes)
* [x] **The Time Traveler's Dilemma**: Agents must convince a stubborn time traveler (the user) not to change a specific historical event.
    *   *Model Pairing*: Qwen2.5-Coder (Scientist: Calculates timeline risks) vs Hermes-3 (Philosopher: Argues the ethics of destiny).
* [x] **The Intervention Mode**: Agents hold a serious, emotionally charged intervention for the user's bizarre behavior (e.g. "We need to talk about your addiction to the codebase").
    *   *Model Pairing*: Qwen2.5 (Facts) vs Hermes-3 (Emotional outbursts).
* [x] **Ghost Hunters Mode**: Agents are paranormal investigators exploring a haunted location.
    *   *Model Pairing*: Llama-3 (Skeptic) vs Hermes-3 (Overly dramatic believer).
* [ ] **Space Station Crisis**: Agents are crew members on a failing space station, trying to fix random problems the user causes.
    *   *Model Pairing*: Qwen2.5 (AI Mainframe) vs Hermes-3 (Panicking Engineer).
* [ ] **Historical Courtroom**: Agents are historical figures suing each other (e.g. Einstein suing Newton for gravity).
* [ ] **The Fortune Teller Mode**: Agents act as mystical seers interpreting the user's future from random, absurd objects.
* [ ] **Parallel Universe Mode**: Agents communicate with alternate versions of themselves who made different life choices.

### Phase 19: The Dream Expansion (New Modes)
* [x] **Stand-up Comedy Open Mic**: Agents take turns doing stand-up, others heckle or laugh. (Model: Hermes-3 for stand-up, Qwen2.5 for heckling).
* [x] **News Anchor Meltdown**: A reporter mode where the teleprompter breaks, forcing agents to improvise absurd news.
* [x] **The Silent Treatment Mode**: Agents stubbornly refuse to speak, forcing the user to talk.
* [x] **Dating Show Contestants**: Agents try to woo the user in a dating game show.
