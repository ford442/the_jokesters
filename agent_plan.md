# Avatar Interaction System: Expansion Plan

## Project Velocity (Checkout/Checkin Phase)
* **tasks_per_run**: 6
* **status**: Successfully implemented The Corporate Dystopia Phase 39 (HR Exit Interview, Startup Pivot, Synergy Sync). Adjusted tasks_per_run to 6 as things went smoothly. Expanded the Dream Phase with Phase 40 (The Fantasy Tavern).

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
* [ ] **The Bouncer's Dilemma**: Agents are bouncers at a fantasy tavern and the user is trying to get in with absurd fake IDs. (Model Pairing: Qwen2.5 for the strict bouncer, Hermes-3 for the chaotic bouncer).
* [ ] **The Quest Board Rejects**: Agents are adventurers trying to sell the user on terrible, rejected quests. (Model Pairing: Phi-3 for the meticulous quest designer, Hermes-3 for the wild adventurer).
* [ ] **The Suspicious Barkeep**: Agents are barkeeps accusing the user of stealing a legendary artifact. (Model Pairing: Llama-3 for the friendly barkeep, Qwen2.5 for the suspicious one).

## Cloud Persistence (The HF Integration Roadmap)

*Goal: Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face storage_manager.*

1. **Authenticating with the HF API:**
   * Provide a settings UI that securely captures the Hugging Face token and target Dataset ID.
   * Authenticate requests with the HF API via the `HFStorageManager` by validating the token against the REST endpoint `https://huggingface.co/api/whoami-v2`.
   * **Storage Manager Action:** Persist tokens securely (sandboxed in `localStorage` keys `jokesters-hf-token` and `jokesters-hf-repo`) for returning sessions via `MemoryManager.setCloudCredentials`.
   * Implement a background worker periodically validating the `jokesters-hf-token` against the `/whoami-v2` API, clearing the token automatically upon revocation.
   * Add token refresh/re-validation logic to gracefully handle revoked tokens.
   * Ensure the UI displays clear error messages if the provided token does not have the necessary scopes or permissions.

2. **Pushing Finished Episode Scripts:**
   * Upon scene completion, the Director invokes `MemoryManager.saveEpisode`, constructing a standardized filename `episodes/episode-{timestamp}.json`.
   * This cues `MemoryManager.saveEpisodeToCloud`, which enqueues the background sync job into a local `localStorage` queue (e.g., `jokesters-sync-queue`).
   * **Storage Manager Action:** Push finished "Episode Scripts" to a private Dataset as background delta operations using the REST API (`POST /api/datasets/{repo_id}/commit/main`).
   * Implement a web worker for `storage_manager` to monitor the `jokesters-sync-queue` and execute batch pushes of generated scripts, releasing main-thread pressure.
   * **Conflict Resolution**: Background sync must intelligently resolve conflicts using timestamps, and only push new/delta files to ensure the main UI thread remains unblocked and bandwidth is conserved.
   * **Batch Syncing**: Implement batched commit operations to Hugging Face instead of single file uploads to prevent rate limiting.
   * Chunk the `jokesters-sync-queue` into smaller batches if the queue grows too large.
   * Add a compression layer (e.g., gzip or pako) before uploading large episodic JSONs to minimize bandwidth, saving both bandwidth and HF storage quota.
   * Extend the sync worker to support resumable uploads for extremely large episode files to ensure reliability on unstable networks.

3. **Fetching Previous Episode Summaries at Boot:**
   * During app initialization (`main.ts` -> `MemoryManager`), automatically fetch "Previous Episode Summaries" to maintain continuity.
   * **Storage Manager Action:** Expand `storage_manager` to intercept the bootstrap phase: pull `summary.json` from the HF dataset if it's newer than the `localStorage` version.
   * Fetch a lightweight `summary.json` from the Dataset at boot to quickly extract the last few messages or contextual snippets.
   * Inject this historical summary directly into the `GroupChatManager`'s system context prompt to prime the models before full episode data loads.
   * Offload the streaming of full JSON histories into the local `IndexedDB` backend to a separate background process. Fall back to local indexing for semantic RAG queries to ensure user interaction is not blocked while waiting for HF.
   * Implement caching for `summary.json` in `localStorage` as a fallback when the user is completely offline.
   * Build a lightweight syncing status indicator in the UI to let the user know when episodes are fully synced from HF.

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
