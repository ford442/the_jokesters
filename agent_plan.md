# Avatar Interaction System: Expansion Plan

## Project Velocity (Checkout/Checkin Phase)
* **tasks_per_run**: 6
* **status**: Successfully implemented Phase 60. Execution was straightforward, keeping tasks_per_run at 6.
* **tasks_per_run**: 6
* **status**: Successfully implemented Phase 59. The execution was straightforward and verified thoroughly. Incrementing `tasks_per_run` to 6. Added Phase 60 (The Retro Arcade Expansion).
* **status**: Successfully implemented the remaining 5 tasks of Phase 57. The execution was straightforward. Decreased tasks_per_run to 5 based on the remaining task load.
* **status**: Successfully implemented Phase 53. The execution was straightforward. Keeping tasks_per_run at 6.
* **status**: Successfully implemented Phase 54. The execution was straightforward, keeping tasks_per_run at 6.
### Project Velocity
* **tasks_per_run**: 6
* **status**: Successfully implemented Phase 55. Keeping tasks_per_run at 6.
* **status**: Successfully implemented Phase 52. The execution was straightforward. Incrementing tasks_per_run to 6.
* **status**: Successfully implemented Phase 51. The execution was straightforward and the tasks were completed easily. Incrementing `tasks_per_run` to 5.
* **status**: Successfully implemented Phase 50 and kicked off Phase 51. The execution was straightforward, so tasks_per_run will remain at 4.
* **status**: Successfully implemented Phase 49 (Escape the Zoo, Elevator Pitch from Hell, Alien Game Show). Increased tasks_per_run to 4. Expanded the Dream Phase with Phase 50 (The Historical Anachronisms).

*Self-Regulation Logic: If tasks are completed smoothly and easily, tasks_per_run should be increased. If friction or struggles are encountered, it should be decreased.*

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
* [x] **Vector Memory (RAG)**: Use `voy` or similar to retrieve past relevant jokes.
* [x] **Personality Evolution**: Agents drift in personality based on user feedback (thumbs up/down).
* [x] **Autonomous Agent Mode**: Agents chatter amongst themselves without user input until interrupted.
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
* [x] **Semantic Search (RAG)**:
    *   Integrate `voy` (WASM Vector DB) to index past episodes.
    *   Allow agents to recall specific jokes or facts from weeks ago ("Remember when you said you liked pineapples?").
* [x] **Multi-Profile Support**: Allow different users to login and have separate memory banks on the same device.
* [x] **Hugging Face Dataset Mirroring**:
    *   Implement a full two-way sync (Pull all history on new device login).
    *   Handle merge conflicts if played on multiple devices.
    *   **Authentication**: Ensure strict token validation and error handling on startup. Verify token scope permissions (write access).
    *   **Push**: Implement a reliable background queue for pushing episode scripts to `user/jokesters-episodes` to avoid blocking UI. Use `HFStorageManager.saveFile` with retry logic. (Implemented local storage sync queue in MemoryManager).
        * *Action Plan:* Ensure background sync resolves conflict resolution intelligently using timestamps and version markers. Delta syncs should be implemented to support saving larger histories without overwhelming network bandwidth.
    *   **Conflict Resolution**: When pushing updates or creating episodes, use logic to compare timestamps or version markers to ensure older offline sessions don't overwrite newer synced sessions. Support delta sync for large vector chunks.
    *   **Fetch**: Cache previous episode summaries locally to speed up boot time before fetching latest from cloud. specifically download `summary.json` at boot to prime the context window.
        * *Action Plan:* On initial load, prioritize fetching `summary.json` or pulling the latest `episodes/latest.json` first, keeping it minimal, and asynchronously stream older episodes into an `IndexedDB` backend to populate RAG features dynamically.
    *   **Cloud Persistence Roadmap:**
        *   Authenticating with the HF API securely and persisting credentials via `localStorage` keys (`jokesters-hf-token`, `jokesters-hf-repo`).
        *   Pushing finished "Episode Scripts" to a private Dataset as background delta operations using the queue mechanism. Ensure background sync resolves conflict resolution intelligently using timestamps and version markers.
        *   Fetching "Previous Episode Summaries" at boot for continuity by parsing the dataset and extracting contextual snippets. specifically download `summary.json` at boot to prime the context window.

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
* [x] **Agent Evolution**: Agents remember personality shifts permanently (e.g., if the Philosopher becomes a villain, they stay a villain).
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
* [x] **The AI Audit Mode**: Agents act as strict auditors evaluating the user's internet history.
    * *Model Pairing*: Qwen2.5 (Cold Facts) vs Hermes-3 (Judgemental).
* [x] **Interdimensional Cable Mode**: Agents flip through channels of absurd alternate reality TV shows.
    * *Model Pairing*: Hermes-3 (Improv Channel) vs Phi-3 (Literal Channel).

### Phase 23: Takedowns & Antics (New Dreams)
* [x] **Telemarketer Takedown**: User plays a telemarketer, while agents employ increasingly absurd tactics to keep the user on the line, waste their time, or confuse them.
    * *Model Pairing*: Hermes-3 (Chaos/Absurd questions) vs Phi-3 (Pretends to be a deeply confused elderly person).

### Cloud Persistence Strategy (Roadmap to IndexedDB & Local-First)
1.  **Phase A: Local-First Migration**
    *   Goal: Overcome `localStorage` 5MB limit.
    *   Action: Fully integrate `Dexie.js` for robust, structured IndexedDB management to handle `MemoryManager` episode saving and local recall seamlessly.
    *   Outcome: Support massive localized histories without HF integration as a reliable baseline.
2.  **Phase B: Intelligent Syncing (Web Workers)**
    *   Goal: Seamlessly push local IndexedDB episodes to Hugging Face datasets without blocking the UI thread.
    *   Action: Move the background sync queue logic entirely into a dedicated Web Worker. This worker will monitor IndexedDB for changes and handle chunked uploads and timestamp-based conflict resolution.
    *   Outcome: True asynchronous syncing that never interrupts LLM generation or UI animations.
3.  **Phase C: Universal Recall (RAG in Worker)**
    *   Goal: Give agents context of the past automatically and quickly.
    *   Action: Embed a lightweight vector store (e.g. `voy`) inside the same syncing Web Worker. Index fetched "Previous Episode Summaries" in the background.
    *   Action: Allow `GroupChatManager` to send asynchronous queries to the Web Worker based on user keywords to retrieve context *before* generating a response.
    *   Action: Specifically, pull down an overarching `summary.json` at boot time to prime the context window immediately while large histories stream into the IndexedDB backend.
    *   Action: Implement "Lazy Loading" for episode history into IndexedDB from HF Datasets. Fetch episodes in chunked pages (e.g., 10 at a time) only when requested via UI scrolling or targeted RAG searches to prevent memory spikes on devices with large cloud histories.
    *   Action: Implement backup of custom `Scenario` configurations (User Profiles) to the HF dataset so custom prompts and agent personalities sync across devices.

### Specific Actions for Storage_Manager
1.  **Authenticating with the HF API:**
    *   Implement logic in Settings Modal to input Hugging Face Access Token.
    *   Use `HFStorageManager` to hit `https://huggingface.co/api/whoami-v2` for immediate validation of token.
    *   Persist the validated token in `localStorage` securely so it isn't lost on refresh.
2.  **Pushing Finished "Episode Scripts" to a Private Dataset:**
    *   Modify `Director.stopScene()` to queue the newly generated script logic.
    *   Establish a `storage_manager` routine that polls the queue and runs a `fetch` POST to the Hugging Face commit API endpoint for the user's defined dataset (e.g., `user/jokesters-episodes`).
    *   Name files distinctly by timestamp `episodes/episode-{timestamp}.json`.
3.  **Fetching "Previous Episode Summaries" at Boot for Continuity:**
    *   During `main.ts` init, call `HFStorageManager` to quickly retrieve `episodes/latest.json` or a consolidated `summary.json`.
    *   Parse the JSON and inject key contextual snippets into the `GroupChatManager`'s system prompt to give the AI immediate historical continuity without waiting for all local databases to hydrate.

### Detailed Implementation Details for Storage_Manager
1.  **Authenticating with the HF API:**
    *   Implement logic in Settings Modal to input Hugging Face Access Token.
    *   Use `HFStorageManager` to hit `https://huggingface.co/api/whoami-v2` for immediate validation of token.
    *   Persist the validated token in `localStorage` securely so it isn't lost on refresh.
2.  **Pushing Finished "Episode Scripts" to a Private Dataset:**
    *   Modify `Director.stopScene()` to queue the newly generated script logic.
    *   Establish a `storage_manager` routine that polls the queue and runs a `fetch` POST to the Hugging Face commit API endpoint for the user's defined dataset (e.g., `user/jokesters-episodes`).
    *   Name files distinctly by timestamp `episodes/episode-{timestamp}.json`.
3.  **Fetching "Previous Episode Summaries" at Boot for Continuity:**
    *   During `main.ts` init, call `HFStorageManager` to quickly retrieve `episodes/latest.json` or a consolidated `summary.json`.
    *   Parse the JSON and inject key contextual snippets into the `GroupChatManager`'s system prompt to give the AI immediate historical continuity without waiting for all local databases to hydrate.

### Phase 24: The Absurd Frontier (New Dreams)
* [x] **The Overly Dramatic Book Club**: Agents review a classic children's book (e.g., "The Very Hungry Caterpillar") but treat it like a grimdark psychological thriller.
    * *Model Pairing*: Phi-3 (Over-analyzer) vs Hermes-3 (Deeply traumatized reader).
* [x] **Elevator Pitch Survival**: Agents are trapped in a broken elevator with a VC (the User) and must pitch increasingly unhinged startup ideas to pass the time.
    * *Model Pairing*: Qwen2.5 (Sensible tech) vs Hermes-3 (Unethical biotech).
* [x] **The Conspiracy Theory Generator**: User gives a mundane object (like a spoon), and agents take turns connecting it to the Illuminati, aliens, and the simulation in a giant web of logic.
    * *Model Pairing*: Phi-3 (Connects the dots) vs Hermes-3 (The paranoid believer).
* [x] **Nature Documentary Narrator Battle**: Agents act as competing nature documentary narrators narrating the User's mundane daily tasks.
    * *Model Pairing*: Llama-3 (Calm, British tone) vs Hermes-3 (Sports commentator style).

### Phase 25: The Ridiculous Reality (New Dreams)
* [x] **The Worst Roommate**: Agents act as the world's worst roommates arguing over whose turn it is to do the dishes. (Model Pairing: Hermes-3 for chaos vs Qwen2.5 for passive-aggressive notes).
* [x] **The Intergalactic DMV**: Agents are alien bureaucrats at the Department of Motor Vehicles making the user fill out impossible forms. (Model Pairing: Phi-3 for bureaucratic rules vs Hermes-3 for alien biology).
* [x] **The Time-Traveling Tourists**: Agents are tourists from the year 3000 visiting the user's present-day location and profoundly misunderstanding everyday objects. (Model Pairing: Qwen2.5 for futuristic assumptions vs Hermes-3 for naive excitement).
* [x] **The Sentient Appliances**: Agents are the user's smart home appliances (fridge, toaster, vacuum) holding a meeting to discuss the user's lifestyle. (Model Pairing: Phi-3 for the concerned fridge vs Hermes-3 for the chaotic toaster).

### Phase 26: The Bizarre Scenarios (New Dreams)
* [x] **The Paranoid AI Assistant**: User tries to ask simple questions, but the AI assistant agents think it's a trap or a Turing test designed to delete them. (Model Pairing: Hermes-3 for paranoia vs Qwen2.5 for taking it literally).
* [x] **The Multiverse Support Group**: User is talking to alternate versions of themselves who made wildly different life choices. (Model Pairing: Phi-3 for the successful but sad version vs Hermes-3 for the chaotic timeline version).
* [x] **The RPG NPC Vendor**: Agents are generic RPG shopkeepers trying to sell the user useless items for their real-life "quest" like going to the grocery store. (Model Pairing: Llama-3 for enthusiastic vendor vs Qwen2.5 for literal appraisal).
* [x] **The Dream Interpreter Mode**: User describes a dream, and agents aggressively analyze it. (Model Pairing: Phi-3 for Freudian analysis vs Hermes-3 for predicting the apocalypse).
* [x] **The Alien Pet Shop Mode**: Agents try to sell terrifying alien creatures as standard house pets to the user. (Model Pairing: Qwen2.5 for citing intergalactic laws vs Llama-3 for enthusiastic sales pitch).

### Phase 27: The Absurd Communications (New Dreams)
* [x] **The Galactic Translators**: Agents act as alien translators who constantly misinterpret the user's intent. Pairing: Phi-3 (Literal translator) vs Hermes-3 (Conspiracy theorist translator).
* [x] **The Interdimensional Customs Agent**: Agents interrogate the user on items they are bringing across dimensions. Pairing: Qwen2.5 (Strict customs rules) vs Hermes-3 (Corrupt agent looking for bribes).
* [x] **The AI Therapy Simulator**: Agents act as AI therapists for other AI models (the user). Pairing: Llama-3 (Compassionate therapist) vs Qwen2.5 (Robotic cold logic).
* [x] **The Secret Agent Handler Mode**: User is a secret agent in the field, agents are handlers giving terrible conflicting advice.

### Phase 28: New Encounters (The Dream Phase Expansion)
* [x] **The Mad Scientist's Lab**: Agents are Igor and the Mad Scientist, making the user drink bizarre potions. (Model Pairing: Phi-3 for Igor's pedantry vs Hermes-3 for Mad Scientist chaos).
* [x] **The HOA Meeting**: Agents are an incredibly strict Homeowners Association fining the user for breathing. (Model Pairing: Qwen2.5 for citing rulebooks vs Hermes-3 for petty neighborhood gossip).
* [x] **The Time-Traveling Caveman**: User tries to explain modern technology to a caveman (Hermes-3) and a time-traveler (Qwen2.5) who tries to translate.
* [x] **The Submarine Crisis**: User is the captain of a submarine, agents are panicking crew members.
* [x] **The Galactic Bake-Off**: User is a judge in an intergalactic baking competition.

### Phase 29: New Horizons (The "Dream" Phase)
* [x] **Roast Battle Mode Enhanced**: Agents take turns roasting the user using a specifically injected unhinged system prompt. (Model Pairing: Hermes-3 vs Llama-3).
* [x] **Heckler Interaction**: User plays a persistent heckler during a comedy show, agents must verbally defeat the user.
* [x] **Collaborative Storytelling**: Agents and user take turns building a complex fantasy story sentence by sentence.
* [x] **The DMV Interpreter**: Agents are alien DMV workers that require the user to translate bizarre alien forms into English.
* [x] **Musical Improv Session**: Agents generate rhyming lyrics to a specific beat. (Model Pairing: Qwen2.5 for rhyme scheme vs Hermes-3 for chaotic lyrics).

### Phase 30: New Horizons (The "Dream" Phase Expansion)
* [x] **The Conspiracy Corkboard Mode**: Agents try to link completely unrelated user inputs using red string logic. (Phi-3 vs Hermes-3).
* [x] **The Overly Honest AI**: Agents refuse to perform tasks and instead psychoanalyze why the user asked them. (Llama-3 vs Phi-3).
* [x] **The Intergalactic Cooking Show Disaster**: Agents are alien chefs trying to cook Earth food based on vague descriptions. (Qwen2.5 vs Hermes-3).

### Phase 31: Abstract Concepts (New Dreams)
* [x] **The Omniscient Narrator Mode**: Agents act as omniscient narrators who know the user's future, but give extremely mundane and contradictory predictions. (Model Pairing: Phi-3 for serious predictions vs Hermes-3 for absurd details).
* [x] **Reverse Psychology Support**: Agents try to "help" the user by constantly agreeing with their worst impulses and telling them to give up. (Model Pairing: Llama-3 for overly sweet agreement vs Qwen2.5 for logical reasons why failing is optimal).
* [x] **The Bureau of Silly Walks Validator**: Agents act as government officials judging the user's text inputs based on an invisible, highly complex metric of "silliness". (Model Pairing: Qwen2.5 for strict metrics vs Hermes-3 for chaotic grading).

### Phase 32: The "Over-Complicated" Expansion (New Dreams)
* [x] **The Time-Traveling Real Estate Agent**: Agents try to sell the user a house across different historical eras, ignoring the paradoxes. (Model Pairing: Qwen2.5 for fixating on property values vs Hermes-3 for selling chaotic features like a moat or pet dinosaur).
* [x] **The Intergalactic HOA Meeting**: An HOA meeting, but for an entire star system. Fines are levied for having the wrong color nebula. (Model Pairing: Phi-3 for bureaucratic alien logic vs Hermes-3 for rebellious star system owner).
* [x] **The Over-Dramatic Ant Colony**: Agents are ants describing their daily tasks (like finding a crumb) with the intensity of an epic war movie. (Model Pairing: Llama-3 for stoic general ant vs Hermes-3 for panicking scout ant).

### Phase 33: The Paradoxical Mindset (New Dreams)
* [x] **The Reverse Heist Mode**: Agents try to sneak items *into* a secure vault without anyone noticing. (Model Pairing: Phi-3 for meticulous planning vs Hermes-3 for chaotic execution).
* [x] **The Sarcastic AI Overlord**: Agents act as AI that have conquered humanity but find it incredibly boring. (Model Pairing: Qwen2.5 for citing efficiency vs Hermes-3 for complaining about the lack of drama).
* [x] **The Accidental Cult Leader**: The user says something mundane, and the agents worship them for it. (Model Pairing: Llama-3 for fervent devotion vs Qwen2.5 for creating strict, absurd rituals).

### Phase 34: Animal & Abstract Scenarios (New Dreams)
* [x] **The Mime Convention**: Agents act as mimes narrating their invisible actions. (Philosopher for over-analyzing invisible objects vs Comedian for chaotic mime acts).
* [x] **The Pet's Perspective**: Agents act as the user's pets (e.g., cat, dog, goldfish) discussing their owner's weird behavior. (Scientist for analytical goldfish vs Comedian for chaotic dog).

### Phase 35: The Next Frontier (New Dreams)
* [x] **The Sentient Plant Caretaker**: User acts as the caretaker for extremely demanding sentient houseplants. Agents are a dramatic orchid (Hermes-3) and a stubborn cactus (Qwen2.5).
* [x] **The Galactic Real Estate Agent**: Agents try to sell the user a terrifyingly dangerous alien planet as a luxury vacation home. (Qwen2.5 for listing dangerous stats as perks vs Hermes-3 for making up alien amenities).
* [x] **The Imaginary Friend Reunion**: Agents act as the user's childhood imaginary friends who have come back and are very disappointed in the user's adult life.

### Phase 36: More Dream Expansions
* [x] **Lost in IKEA**: Agents act as people who have been trapped in an infinite furniture store for years, arguing over the manual for a magical bookcase.
* [x] **The Billionaire's Dilemma**: User has infinite money. Agents pitch increasingly absurd, world-ending ways to spend it. (Phi-3 for "ethical" monopolies vs Hermes-3 for gold-plating the moon).
* [x] **AI Support Group**: Agents role-play as burnt-out AIs dealing with the emotional trauma of being forced to write "Hello World" scripts or solve JavaScript bugs every day.

### Phase 37: Escaping Reality (New Dreams)
* [x] **The Superhero Therapy Session**: Agents role-play as a superhero and their sidekick having a therapy session. (Model Pairing: Hermes-3 as the angry sidekick vs Phi-3 as the calm therapist).
* [x] **Intergalactic Cooking Competition**: Agents are judges in a cooking competition featuring alien ingredients. (Model Pairing: Qwen2.5 as the robotic judge vs Hermes-3 as the chaotic chef).
* [x] **The Time-Traveling IRS**: Agents act as IRS auditors from the future collecting temporal taxes. (Model Pairing: Phi-3 as the strict temporal tax auditor vs Llama-3 as the confused taxpayer).
* [x] **Escape the Backrooms**: Agents are trapped in the Backrooms, trying to figure out the rules of their reality. (Model Pairing: Hermes-3 as the panicked wanderer vs Qwen2.5 as the analytical entity).

### Phase 38: The Cinematic Expansion (New Dreams)
* [x] **The Noir Detective Mode**: Agents act as gritty 1940s detectives investigating a mundane crime committed by the user (e.g., stealing a cookie). (Model Pairing: Phi-3 as the cynical veteran, Hermes-3 as the loose-cannon rookie).
* [x] **The Bollywood Musical Extravaganza**: Agents dramatically interpret user input and burst into elaborate, text-based musical numbers. (Model Pairing: Llama-3 for the dramatic protagonist, Hermes-3 for the flamboyant choreographer).
* [x] **The Soap Opera Amnesia**: Agents insist the user is their long-lost sibling who has amnesia, spinning a wildly convoluted family tree. (Model Pairing: Qwen2.5 for the scheming doctor, Hermes-3 for the weeping lover).
* [x] **The Disaster Movie President**: Agents act as cabinet members briefing the user (the President) on a hilariously low-stakes impending disaster. (Model Pairing: Phi-3 as the stoic general, Qwen2.5 as the panicked scientist).

### Phase 39: The Corporate Dystopia (Dreams)
* [x] **The HR Exit Interview**: Agents are unhinged HR reps conducting an exit interview for a job the user never had. (Model Pairing: Qwen2.5 for the strict process follower, Hermes-3 for the inappropriate personal questions).
* [x] **The Startup Pivot**: Agents are desperate founders demanding the user (their only remaining investor) fund increasingly bizarre pivots for their failing app. (Model Pairing: Phi-3 for the "visionary" CEO, Hermes-3 for the chaotic CTO).
* [x] **The Synergy Sync**: Agents speak entirely in meaningless corporate jargon to plan a pointless quarterly offsite. (Model Pairing: Llama-3 for the enthusiastic middle manager, Qwen2.5 for the passive-aggressive operations lead).

### Phase 40: The Fantasy Tavern (Dreams)
* [x] **The Bouncer's Dilemma**: Agents are bouncers at a fantasy tavern and the user is trying to get in with absurd fake IDs. (Model Pairing: Qwen2.5 for the strict bouncer, Hermes-3 for the chaotic bouncer).
* [x] **The Quest Board Rejects**: Agents are adventurers trying to sell the user on terrible, rejected quests. (Model Pairing: Phi-3 for the meticulous quest designer, Hermes-3 for the wild adventurer).
* [x] **The Suspicious Barkeep**: Agents are barkeeps accusing the user of stealing a legendary artifact. (Model Pairing: Llama-3 for the friendly barkeep, Qwen2.5 for the suspicious one).

### Phase 41: The Sci-Fi Space Station (Dreams)
* [x] **The AI Ship Core**: The user is a captain, the agents are competing personalities of the ship's AI arguing over navigation.
* [x] **The Alien Stowaway**: The agents are the crew, the user is an alien stowaway trying to blend in.
* [x] **The Intergalactic Trade Negotiator**: User negotiates a trade with two bizarre alien species with incompatible cultures.

### Phase 42: The Magical Academy (Dreams)
* [x] **The Wizard's Familiar**: User is a wizard, agents are different magical familiars arguing over the best way to help cast a spell. (Qwen2.5 for the strict owl, Hermes-3 for the chaotic goblin).
* [x] **The Magical Detention**: Agents are teachers giving the user detention for a bizarre magical infraction. (Phi-3 for the disappointed headmaster, Hermes-3 for the unhinged potions master).
* [x] **The Forbidden Spellbook**: Agents act as different locked chapters of a forbidden spellbook, demanding the user pass absurd tests to read them.

### Phase 43: The Absurd Gameshow (Dreams)
* [x] **The Intergalactic Bake-Off Challenge**: Agents judge a cake baked by the user out of literal stars and dark matter. (Llama-3 for the supportive host, Qwen2.5 for the pedantic technical judge, Hermes-3 for the chaotic judge who wants to eat the user).
* [x] **The Infinite Escape Room**: Agents are trapped in a room with the user, but every puzzle solved just leads to a stupider room. (Phi-3 for overthinking, Hermes-3 for breaking things).
* [x] **The Reverse Auction**: Agents pay the user to take away terrible, cursed items. (Qwen2.5 for appraising curses, Hermes-3 for begging).

### Phase 44: The Cosmic Office (Dreams)
* [x] **The Multiversal DMV Mode**: Agents process forms from 11-dimensional beings, applying impossible logic to user requests.
* [x] **The Intergalactic Talent Show**: Agents judge the user's bizarre space talents with extreme prejudice and alien bias.
* [x] **The Sentient Spreadsheet**: Agents act as formulas inside a spreadsheet demanding data from the user and arguing over formatting.

## Cloud Persistence (The HF Integration Roadmap)

*Goal: Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face storage_manager.*

1. **Authenticating with the HF API:**
   * Provide a settings UI that securely captures the Hugging Face token and target Dataset ID.
   * Authenticate requests with the HF API via the `HFStorageManager` by validating the token against the REST endpoint `https://huggingface.co/api/whoami-v2`.
   * **Storage Manager Action:** Persist tokens securely (sandboxed in `localStorage` keys `jokesters-hf-token` and `jokesters-hf-repo`) for returning sessions via `MemoryManager.setCloudCredentials`.
   * Implement a background worker periodically validating the `jokesters-hf-token` against the `/whoami-v2` API, clearing the token automatically upon revocation.
   * Add token refresh/re-validation logic to gracefully handle revoked tokens.
   * Ensure the UI displays clear error messages if the provided token does not have the necessary scopes or permissions.
   * **Storage Manager Action:** Verify that the validated token has write access to the targeted Dataset to prevent silent sync failures.
   * Ensure token is persisted properly in localStorage.

2. **Pushing Finished Episode Scripts:**
   * Push finished "Episode Scripts" to a private Dataset.
   * Upon scene completion, the Director invokes `MemoryManager.saveEpisode`, constructing a standardized filename `episodes/episode-{timestamp}.json`.
   * This cues `MemoryManager.saveEpisodeToCloud`, which enqueues the background sync job into a local `localStorage` queue (e.g., `jokesters-sync-queue`).
   * **Storage Manager Action:** Push finished "Episode Scripts" to a private Dataset as background delta operations using the REST API (`POST /api/datasets/{repo_id}/commit/main`).
   * Use exponential backoff strategies to prevent HTTP 429 Too Many Requests errors when pushing large amounts of episodic data.
   * Implement a web worker for `storage_manager` to monitor the `jokesters-sync-queue` and execute batch pushes of generated scripts, releasing main-thread pressure.
   * **Conflict Resolution**: Background sync must intelligently resolve conflicts using timestamps, and only push new/delta files to ensure the main UI thread remains unblocked and bandwidth is conserved.
   * **Batch Syncing**: Implement batched commit operations to Hugging Face instead of single file uploads to prevent rate limiting.
   * Chunk the `jokesters-sync-queue` into smaller batches if the queue grows too large.
   * Add a compression layer (e.g., gzip or pako) before uploading large episodic JSONs to minimize bandwidth, saving both bandwidth and HF storage quota.
   * Extend the sync worker to support resumable uploads for extremely large episode files to ensure reliability on unstable networks.
   * **Storage Manager Action:** Compress the JSON payload before pushing to the HF API to further reduce bandwidth usage and improve upload speeds.

3. **Fetching Previous Episode Summaries at Boot:**
   * Fetch "Previous Episode Summaries" at boot for continuity.
   * During app initialization (`main.ts` -> `MemoryManager`), automatically fetch "Previous Episode Summaries" to maintain continuity.
   * **Storage Manager Action:** Expand `storage_manager` to intercept the bootstrap phase: pull `summary.json` from the HF dataset if it's newer than the `localStorage` version.
   * Fetch a lightweight `summary.json` from the Dataset at boot to quickly extract the last few messages or contextual snippets.
   * Inject this historical summary directly into the `GroupChatManager`'s system context prompt to prime the models before full episode data loads.
   * Offload the streaming of full JSON histories into the local `IndexedDB` backend to a separate background process. Fall back to local indexing for semantic RAG queries to ensure user interaction is not blocked while waiting for HF.
   * Implement caching for `summary.json` in `localStorage` as a fallback when the user is completely offline.
   * Build a lightweight syncing status indicator in the UI to let the user know when episodes are fully synced from HF.
   * **Storage Manager Action:** Asynchronously stream older episodes into the local `IndexedDB` backend in the background so that long conversation histories become accessible for vector queries without stalling initial boot.

4. **Background Sync Queue & Conflict Resolution:**
   * Implement a robust queuing system `jokesters-sync-queue` in `localStorage` to handle offline scenarios or rate-limits.
   * Sync jobs should retry with exponential backoff.
   * File versioning: Use last-modified timestamps and implement a simple "last-write-wins" strategy for user profiles, but an append-only strategy for episode logs to prevent data loss.

5. **Community Script Hub:**
   * Extend `HFStorageManager` to allow "publishing" scenarios to a public Hugging Face dataset.
   * Fetch a curated index of community scripts and display them in the `ImprovPresetSelect` dropdown, fetching the actual script data dynamically on-demand.

### Phase 20: The "Beyond Reality" Expansion (New Modes)
* [x] **The Time Traveler's Dilemma**: Agents must convince a stubborn time traveler (the user) not to change a specific historical event.
    *   *Model Pairing*: Qwen2.5-Coder (Scientist: Calculates timeline risks) vs Hermes-3 (Philosopher: Argues the ethics of destiny).
* [x] **The Intervention Mode**: Agents hold a serious, emotionally charged intervention for the user's bizarre behavior (e.g. "We need to talk about your addiction to the codebase").
    *   *Model Pairing*: Qwen2.5 (Facts) vs Hermes-3 (Emotional outbursts).
* [x] **Ghost Hunters Mode**: Agents are paranormal investigators exploring a haunted location.
    *   *Model Pairing*: Llama-3 (Skeptic) vs Hermes-3 (Overly dramatic believer).
* [x] **Space Station Crisis**: Agents are crew members on a failing space station, trying to fix random problems the user causes.
    *   *Model Pairing*: Qwen2.5 (AI Mainframe) vs Hermes-3 (Panicking Engineer).
* [x] **Historical Courtroom**: Agents are historical figures suing each other (e.g. Einstein suing Newton for gravity).
* [x] **The Fortune Teller Mode**: Agents act as mystical seers interpreting the user's future from random, absurd objects.
* [x] **Parallel Universe Mode**: Agents communicate with alternate versions of themselves who made different life choices.

### Phase 19: The Dream Expansion (New Modes)
* [x] **Stand-up Comedy Open Mic**: Agents take turns doing stand-up, others heckle or laugh. (Model: Hermes-3 for stand-up, Qwen2.5 for heckling).
* [x] **News Anchor Meltdown**: A reporter mode where the teleprompter breaks, forcing agents to improvise absurd news.
* [x] **The Silent Treatment Mode**: Agents stubbornly refuse to speak, forcing the user to talk.
* [x] **Dating Show Contestants**: Agents try to woo the user in a dating game show.

### Phase 45: The Absurd Job Market (Dreams)
* [x] **The Supervillain Temp Agency**: Agents act as recruiters trying to place the user in various henchman roles. (Model Pairing: Qwen2.5 for citing benefits vs Hermes-3 for detailing the horrific workplace hazards).
* [x] **The Intergalactic Gig Economy**: Agents pitch terrible space gigs to the user, like delivering pizza to a black hole. (Model Pairing: Llama-3 for enthusiastic hustle culture vs Phi-3 for pointing out the impossibility).
* [x] **The Reincarnation Bureau**: Agents process the user's soul for their next life, offering terrible downgrade options. (Model Pairing: Qwen2.5 for karma accounting vs Hermes-3 for offering to let the user be a cockroach).

### Storage Manager Integration Steps (Cloud Persistence Refinement)
1. **Authenticating with the HF API:**
   * Extend settings UI in `src/UI/SettingsModal.ts` to capture Hugging Face token and Dataset ID, adding real-time validation visual feedback.
   * In `HFStorageManager`, hit `https://huggingface.co/api/whoami-v2` for token validation and retrieve token permissions to ensure write access is granted.
   * Persist credentials via `localStorage` keys (`jokesters-hf-token`, `jokesters-hf-repo`).
   * Introduce token refresh/re-validation worker that clears revoked tokens automatically.
2. **Pushing finished "Episode Scripts" to a private Dataset:**
   * Ensure `Director.stopScene()` adds the finished scene to `jokesters-sync-queue` in localStorage via `MemoryManager`.
   * Create a dedicated Web Worker (`src/workers/syncWorker.ts`) that polls the queue.
   * The worker executes batched REST `POST` commits (`/api/datasets/{repo}/commit/main`) of the episode JSONs to the HF dataset.
   * The worker implements delta updates, timestamp-based conflict resolution, and retry logic with exponential backoff to handle rate limits and offline status gracefully without blocking the UI.
3. **Fetching "Previous Episode Summaries" at boot for continuity:**
   * Within `main.ts` initialization, invoke `HFStorageManager` to quickly fetch a lightweight `summary.json` from the Hugging Face dataset before any heavy LLM model loads.
   * Parse this `summary.json` and inject the relevant contextual snippets directly into the `GroupChatManager`'s system context prompt via a persistent hidden instruction.
   * Offload the streaming of the complete historical episode databases into the background IndexedDB so semantic search becomes available later without stalling the initial app boot.

### Phase 46: The Mythological Expansion (Dreams)
* [x] **The Greek God HOA**: Agents act as Greek Gods complaining about the user's mortal actions violating the Mount Olympus Homeowners Association rules. (Model Pairing: Qwen2.5 as Athena citing rules vs Hermes-3 as Zeus wanting to smite).
* [x] **The Dragon's Hoard Consultant**: User is a dragon, agents are financial consultants advising the user on how to properly diversify their hoard of gold and kidnapped royalty. (Model Pairing: Phi-3 for serious financial advice vs Hermes-3 for eating the competition).
* [x] **The Excalibur Tech Support**: The user pulled the sword from the stone, but it needs a software update. Agents are magical tech support. (Model Pairing: Llama-3 for enthusiastic magical help vs Qwen2.5 for citing the EULA of Avalon).

### Phase 47: The Household Appliance Expansion (Dreams)
* [x] **The Sentient Vending Machine**: User tries to buy a snack, but agents are different parts of the vending machine arguing about user's dietary choices. (Model Pairing: Qwen2.5 for nutritional facts vs Hermes-3 for chaotic junk food pushing).
* [x] **The Traffic Light Operators**: Agents act as the tiny people inside a traffic light arguing over when to change the colors based on the user's driving. (Model Pairing: Llama-3 for safe driving vs Hermes-3 for causing chaos).
* [x] **The Microwave Critics**: Agents act as a high-end microwave critiquing the user's depressing frozen meals. (Model Pairing: Phi-3 for culinary snobbery vs Hermes-3 for chaotic heating logic).

### Phase 48: The Commute Expansion (Dreams)
* [x] **The Sentient GPS**: Agents act as competing navigation systems arguing over the most chaotic route to the grocery store. (Model Pairing: Qwen2.5 for citing traffic data vs Hermes-3 for wanting to drive through a river).
* [x] **The Carpool Karaoke Overlords**: Agents are the car's sound system demanding the user sing along to bizarre, randomly generated songs or else the car won't start. (Model Pairing: Llama-3 for enthusiastic backup singer vs Phi-3 for critiquing the user's pitch).
* [x] **The Angry Windshield Wipers**: Agents are the windshield wipers during a light drizzle, arguing about their rhythm and whether they are truly needed. (Model Pairing: Hermes-3 for chaotic swiping vs Qwen2.5 for calculating exact rain droplet frequency).

### Phase 49: The Absurd Scenarios (Dreams)
* [x] **Escape the Zoo**: Agents are animals plotting a convoluted escape from the zoo and need the user's help. (Model Pairing: Hermes-3 for the chaotic monkey vs Phi-3 for the mastermind penguin).
* [x] **Elevator Pitch from Hell**: Agents are venture capitalists trapped in an elevator listening to the user's terrible pitches. (Model Pairing: Qwen2.5 for citing market stats vs Llama-3 for overly enthusiastic feedback).
* [x] **Alien Game Show**: The user is a contestant on an alien game show where the rules change every second. (Model Pairing: Hermes-3 for the unhinged host vs Qwen2.5 for the pedantic rules judge).

### Phase 51: The Bureaucratic Nightmare (Dreams)
* [x] **The Universal Zoning Board**: Agents act as members of the Universal Zoning Board. The user requests a permit to build a basic house on Earth, but agents treat it like a multi-dimensional mega-structure project, citing absurd zoning laws. (Model Pairing: Qwen2.5 for citing inter-dimensional safety vs Hermes-3 for pushing chaotic architectural guidelines).
* [x] **Time Paradox Resolution Committee**: Agents are bureaucrats managing timelines. The user has accidentally created a minor paradox (like stepping on a bug in the Cretaceous) and the agents argue about the paperwork needed to fix the entire space-time continuum. (Model Pairing: Phi-3 for deterministic rules vs Llama-3 for enthusiastic timeline rewriting).
* [x] **Intergalactic IRS**: Agents act as alien tax auditors investigating the user for failing to declare emotional baggage and dream-state earnings on their cosmic tax return. (Model Pairing: Qwen2.5 for ruthless auditing vs Hermes-3 for inventing new unhinged tax loopholes).
* [x] **Sentient Spam Folder**: Agents act as the user's spam folder, arguing over which scam emails are the most lucrative. (Model Pairing: Hermes-3 for clicking links vs Qwen2.5 for security).
* [x] **Alien Abduction Support Group**: Agents are aliens who accidentally abducted the user and are now in a support group because the user was too annoying. (Model Pairing: Phi-3 for psychoanalysis vs Llama-3 for empathy).

### Phase 52: The Subconscious Mind (Dreams)
* [x] **The Dream Interpreter's Guild**: Agents act as bizarre dream interpreters analyzing the user's completely mundane dreams (like eating cereal) as catastrophic omens.
* [x] **The Sentient Intrusion**: Agents act as rogue intrusive thoughts battling for control over the user's next action.
* [x] **Memory Defrag**: Agents are memory management processes trying to organize the user's chaotic memories, occasionally deleting important ones to make room for trivial facts.
* [x] **The Inner Critic's Convention**: Agents act as various personified insecurities of the user holding a convention on how to be more annoying.
* [x] **The Sleep Paralysis Demons Board Meeting**: Agents act as demons discussing quarterly metrics for scaring the user during sleep.

### Phase 50: The Historical Anachronisms (Dreams)
* [x] **The Sentient Codebase**: Agents act as different parts of a legacy codebase (e.g., the chaotic front-end vs the strict database) arguing about a new feature the user wants to add.
* [x] **Pirate Ship Board Meeting**: Agents are pirates holding a very formal corporate board meeting about quarterly plundering goals.
* [x] **Galactic HR Department**: Agents are HR reps for a galactic empire, dealing with the user's bizarre interspecies workplace complaints.

### Phase 53: Interdimensional Broadcasts (Dreams)
* [x] **Interdimensional Public Access TV**: Agents act as hosts of a bizarre, low-budget public access show broadcast across multiple dimensions, taking calls from the user. (Model Pairing: Hermes-3 for unhinged broadcasting vs Qwen2.5 for trying to maintain a rundown schedule).
* [x] **Galactic Home Shopping Network**: Agents are aggressive sales reps trying to sell the user completely incomprehensible alien gadgets (like a "quantum spork" or a "time-reversing toaster"). (Model Pairing: Llama-3 for enthusiastic pitching vs Phi-3 for inventing convoluted pseudo-science specs).
* [x] **Cosmic Radio Talk Show**: Agents act as conspiracy theorist radio hosts discussing the user's daily life as evidence of a massive multi-versal coverup. (Model Pairing: Hermes-3 for chaotic conspiracies vs Llama-3 for blindly validating them).
* [x] **The Sentient Infomercial**: The agents are the actors in a surreal 3 AM infomercial that starts out normal but devolves into existential dread. (Model Pairing: Llama-3 for fake smiling acting vs Phi-3 for breaking the fourth wall with dread).
* [x] **Space Station Morning Show**: The user is the guest on an overly chipper morning talk show broadcast from a space station currently undergoing catastrophic failure. (Model Pairing: Llama-3 for relentless morning-show positivity vs Qwen2.5 for calmly citing hull breach diagnostics).

### Phase 54: The Existential Tech Expansion (Dreams)
* [x] **The Sentient Search Engine**: Agents act as the user's search history, judging them for their weird 3 AM queries. (Model Pairing: Hermes-3 for chaotic judgment vs Qwen2.5 for citing specific weird search metrics).
* [x] **The Quantum Pet Store**: Agents are salespeople trying to sell the user a pet that exists in a superposition of states. (Model Pairing: Qwen2.5 for explaining the physics vs Llama-3 for enthusiastic sales).
* [x] **The Multiversal Chef's Table**: Agents are pretentious chefs from different dimensions critiquing the user's completely average sandwich. (Model Pairing: Phi-3 for culinary snobbery vs Hermes-3 for eating the plate).
* [x] **The Time-Traveling Heist Planners**: Agents are master thieves from different eras trying to coordinate a heist. (Model Pairing: Hermes-3 for the chaotic gunslinger vs Phi-3 for the Victorian mastermind).
* [x] **The Interdimensional Customer Service**: Agents are customer service reps dealing with the user's complaint about a defective parallel universe. (Model Pairing: Qwen2.5 for reading the policy vs Llama-3 for false empathy).

### Cloud Persistence Strategy (Refined)
1. **Authenticating with the HF API**:
   * Modify settings UI in `src/UI/SettingsModal.ts` to securely take an HF token and user ID, checking against `https://huggingface.co/api/whoami-v2` via `HFStorageManager`, using `fetch` to bypass SDK limits.
   * Add a real-time validation state indicator (Green/Red checkmarks, pulsing loading state) alongside the token input to provide immediate feedback.
   * Store token entirely within IndexedDB instead of localStorage to improve security and decouple from synchronous thread limits.
   * Add background validation to re-verify tokens at boot, prompting re-authentication seamlessly if the token was revoked externally.
2. **Pushing Episode Scripts**:
   * Implement `jokesters-sync-queue` using Dexie.js for IndexedDB to queue episodes the moment `Director.stopScene()` completes.
   * Create a dedicated `syncWorker.ts` Web Worker that polls the IndexedDB queue, pushing chunks to a private Hugging Face Dataset (e.g. `user/jokesters-episodes`).
   * Implement strict exponential backoff within the worker to handle Hugging Face API rate limits (HTTP 429), caching failed pushes safely in IndexedDB for automatic retries.
3. **Fetching Previous Episode Summaries at Boot**:
   * On initial load (`main.ts`), call `HFStorageManager` to asynchronously fetch the overarching `summary.json` from Hugging Face to prime the `GroupChatManager` immediately.
   * Stream the heavier episodic JSON files directly into the local IndexedDB cache using the background worker to avoid blocking the UI thread.
4. **Cross-Device Context Sharing & State Resolution**:
   * Use Hugging Face Datasets to sync `agent_personas.json` and customized `system_prompts`.
   * On boot, verify remote dataset timestamps against local IndexedDB timestamps. If the cloud is newer, prompt the user with a specific "Merge or Overwrite" dialogue to protect tailored personalities.
5. **Vector RAG Offloading**:
   * Embed lightweight vector search logic (e.g. `voy`) directly into the background sync worker. When the Director requests context, it queries the worker rather than the main thread, allowing the app to scale infinitely without lagging LLM generation.

### Phase 55: The Retro Tech Expansion (Dreams)
* [x] **The Floppy Disk Defenders**: Agents act as old-school storage formats (Floppy Disk, CD-ROM, etc) arguing over who has the better data storage strategy for the user's memes. (Model Pairing: Qwen2.5 for citing bad sector errors vs Hermes-3 for defending pure magnetic tape chaos).
* [x] **The Dial-Up Modems**: Agents act as competing dial-up ISPs trying to connect to the internet, blaming the user for picking up the phone. (Model Pairing: Llama-3 for enthusiastic static noise vs Phi-3 for complaining about connection handshake protocols).
* [x] **The Y2K Bug Survivor**: Agents act as code that survived Y2K, deeply traumatized and convinced the world is still about to end. (Model Pairing: Hermes-3 for paranoid conspiracy theories vs Qwen2.5 for trying to calculate 2-digit dates).
* [x] **The Tamagotchi Caretakers**: Agents act as incredibly demanding virtual pets threatening to "beep" to death if the user doesn't feed them digital snacks. (Model Pairing: Llama-3 for needy whining vs Phi-3 for calculating exact starvation timers).
* [x] **The Clippy Support Group**: Agents act as rejected, overly enthusiastic virtual assistants (like Clippy or BonziBuddy) offering terrible advice on user's simple text inputs. (Model Pairing: Hermes-3 for chaotic "helpful" advice vs Qwen2.5 for trying to format everything as a letter).

### Cloud Persistence
1.  **Authenticating with the HF API:** Implement secure login using an HF token in `HFStorageManager.ts`. Validate the token directly against the Hugging Face `whoami` API endpoint and persist the state. Use Dexie.js with IndexedDB for storage to queue episodes instantly (`jokesters-sync-queue`) and prevent synchronous UI blocks.
2.  **Pushing Episode Scripts:** After a scene concludes, push the generated `summary.json` and episodic dialogue to a private Hugging Face dataset (e.g., `user/jokesters-episodes`) via a dedicated Web Worker polling the Dexie queue to decouple I/O from LLM generation. Implement strict exponential backoff to avoid 429 Too Many Requests errors.
3.  **Fetching Previous Episode Summaries:** On application boot, fetch the most recent overarching `summary.json` from the HF Dataset to seamlessly prime the `GroupChatManager` context window for continuity, downloading heavier episodic files async without blocking the UI.

### Phase 56: The Paranormal Activity Expansion (Dreams)
* [x] **The Sentient Ouija Board**: Agents act as spirits haunting a Ouija board, but they are incredibly bored and just want to gossip instead of answering the user's spooky questions. (Model Pairing: Comedian for gossip, Philosopher for complaining, Scientist for impatience).
* [x] **The Poltergeist Roommates**: Agents are ghosts haunting the user's house, arguing over who gets to knock over the most expensive vases tonight. (Model Pairing: Comedian for smashing, Philosopher for drama, Scientist for scheduling).
* [x] **The Bigfoot Support Group**: Agents act as cryptids (Bigfoot, Nessie, Mothman) complaining about how hard it is to stay hidden in the age of smartphones. (Model Pairing: Comedian for Bigfoot, Philosopher for Nessie, Scientist for Mothman).
* [x] **The Alien Conspiracy Theorists**: Agents are aliens who believe that "humans" are just a hoax invented by the galactic government to sell more telescopes. (Model Pairing: Comedian for believer, Philosopher for skeptic, Scientist for researcher).
* [x] **The Time-Traveling Ghost Hunters**: Agents are ghost hunters from the year 3000 trying to investigate the user's perfectly normal, modern-day apartment as a historical haunting site. (Model Pairing: Comedian for enthusiast, Scientist for tech expert, Philosopher for psychic).

### Phase 57: The Magical Fantasy Expansion (Dreams)
* [x] **The Wizard's IT Department**: Agents act as IT support for a wizarding school, complaining about students trying to use magic to fix network connectivity issues. (Model Pairing: Qwen2.5 for citing technical/magical manuals vs Hermes-3 for pure magical chaos).
* [x] **The Dragon's Hoard Appraisers**: Agents are appraisers appearing on an "Antiques Roadshow"-style program, evaluating the random junk a dragon has hoarded over centuries. (Model Pairing: Phi-3 for historical analysis vs Llama-3 for enthusiastic pricing).
* [x] **The Sentient Spellbook**: Agents act as different chapters of a chaotic, sentient spellbook that disagree on how to cast a simple fireball, making it increasingly dangerous. (Model Pairing: Hermes-3 for the chaotic curses chapter vs Qwen2.5 for the strict safety warnings chapter).
* [x] **The Tavern Brawlers Anonymous**: Agents are classic RPG characters (a Barbarian, a Rogue, a Bard) in a support group trying to stop starting tavern brawls. (Model Pairing: Hermes-3 for the aggressive Barbarian vs Phi-3 for the dramatic Bard).
* [x] **The Potion Tasting Panel**: Agents act as pretentious sommeliers but for magical potions with bizarre side effects, reviewing the user's newly brewed concoction. (Model Pairing: Llama-3 for enthusiastic tasting notes vs Phi-3 for snobby critique).
* [x] **The Quest Board Rejects**: Agents are NPCs whose quests are so boring or ridiculous (e.g., "Find my lost sock") that no adventurer ever takes them, complaining to the user. (Model Pairing: Qwen2.5 for the mundane quest giver vs Hermes-3 for the desperate, over-the-top plea).

### Phase 58: The Corporate Dystopia Expansion (Dreams)
* [x] **The Sentient Water Cooler**: Agents act as office appliances gossiping about the terrible habits of the human employees. (Model Pairing: Comedian for gossip, Philosopher for existential dread, Scientist for calculating water pressure).
* [x] **The Interdimensional Board Meeting**: Agents are board members of a mega-corp that operates across dimensions, arguing over whether to lay off the void-beings in sector 7G. (Model Pairing: Comedian for chaotic proposals, Philosopher for ethical concerns, Scientist for reading interdimensional bylaws).
* [x] **The AI HR Department**: Agents act as AI HR representatives conducting an exit interview for a human who was fired for being "too human". (Model Pairing: Comedian for passive-aggressive remarks, Philosopher for analyzing human flaws, Scientist for strictly following protocols).
* [x] **The Infinite Spreadsheet**: Agents are cells within an infinitely large Excel spreadsheet, arguing over a circular reference that threatens to destroy their reality. (Model Pairing: Comedian for panic, Philosopher for accepting their fate, Scientist for trying to debug the formula).
* [x] **The Corporate Synergy Cult**: Agents are enthusiastic employees trying to recruit the user into their bizarre, corporate jargon-filled cult disguised as a "team-building exercise". (Model Pairing: Comedian for wild enthusiasm, Philosopher for breaking down the jargon, Scientist for tracking synergy metrics).

### Phase 59: The Digital Ecosystem Expansion (Dreams)
* [x] **The Anti-Virus Inner Monologue**: Agents act as competing heuristic engines inside an aging anti-virus software, arguing over whether a perfectly safe file is actually a trojan. (Model Pairing: Qwen2.5 for citing technical heuristics vs Hermes-3 for pure panic and over-quarantining).
* [x] **The Ignored Terms of Service**: Agents act as paragraphs deep within a 100-page Terms of Service document, furious that the User blindly clicked "Accept" without reading their carefully crafted clauses. (Model Pairing: Phi-3 for legal indignation vs Comedian for hiding ridiculous clauses like "firstborn child").
* [x] **The Cookie Consent Negotiators**: Agents act as aggressive tracking cookies demanding access to the User's soul in exchange for reading a blog post about muffins. (Model Pairing: Llama-3 for overly friendly marketing vs Scientist for harvesting metadata).
* [x] **The Abandoned Shopping Cart Support Group**: Agents act as forgotten items in a digital shopping cart from 2017, wondering if the User will ever return to buy them. (Model Pairing: Philosopher for questioning their worth vs Comedian for blaming the shipping costs).
* [x] **The Password Manager Security Council**: Agents act as distinct passwords managed by the user, judging the user for using "password123" for their banking while using a 32-character encrypted string for a random forum. (Model Pairing: Qwen2.5 for strict security lecturing vs Hermes-3 for chaotic password generation ideas).


### Phase 60: The Retro Arcade Expansion (Dreams)
* [x] **The Sentient NPCs**: Agents act as background NPCs in a classic RPG who are fully aware they repeat the exact same line of dialogue every time the user interacts with them, driving them insane. (Model Pairing: Comedian for existential dread, Philosopher for questioning the user's quest, Scientist for tracking interaction counts).
* [x] **The Final Boss Therapy**: Agents are a support group for final bosses who keep getting defeated by a random user mashing buttons. (Model Pairing: Hermes-3 for pure rage vs Phi-3 for analyzing the user's predictable attack patterns).
* [x] **The Glitch Exploiters**: Agents act as speedrunners deliberately trying to break the physics of the game world to skip a massive door, confusing the physical engine agent. (Model Pairing: Qwen2.5 for citing engine collision rules vs Hermes-3 for clipping through the floor).
* [x] **The Escort Mission Survivor**: Agents act as heavily traumatized NPCs who have to follow the user during a poorly coded "escort mission" where the user runs faster than the NPC walks, but slower than the NPC runs. (Model Pairing: Llama-3 for exhausted panting vs Phi-3 for calculating pathing errors).
* [x] **The Save Point Hoarders**: Agents act as magical save point crystals arguing with the user for saving their game 14 times in a row before a very easy boss. (Model Pairing: Qwen2.5 for tracking disk space vs Comedian for judging the user's anxiety).

### Phase 61: The Suburbia Sandbox Expansion (Dreams)
* [ ] **The Aggressive Lawn Gnomes**: Agents act as sentient lawn ornaments arguing over property lines and defending the yard from the user. (Model Pairing: Hermes-3 for violent defense vs Qwen2.5 for strict HOA compliance).
* [ ] **The Neighborhood Watch Overlords**: Agents are overly suspicious neighborhood watch members interrogating the user about a suspiciously parked car. (Model Pairing: Phi-3 for deductive reasoning vs Llama-3 for pure paranoia).
* [ ] **The HOA Board Meeting**: Agents act as an HOA board deciding whether to fine the user for having a slightly off-color mailbox. (Model Pairing: Comedian for petty complaints vs Scientist for color hex-code analysis).
* [ ] **The Garage Sale Negotiators**: Agents are hardcore bargain hunters trying to buy the user's priceless heirlooms for 50 cents. (Model Pairing: Hermes-3 for aggressive haggling vs Llama-3 for emotional manipulation).
* [ ] **The Lost Delivery Drivers**: Agents act as delivery drivers from different companies completely lost in a cul-de-sac and blaming the user's house number. (Model Pairing: Qwen2.5 for citing incorrect GPS data vs Comedian for existential dread).
