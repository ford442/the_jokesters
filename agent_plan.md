# Implementation Roadmap

## Project Velocity
tasks_per_run: 4

### Project Velocity (Infrastructure & Reliability)
- [x] **LWW Conflict Resolution** — MemoryManager.ts now correctly updates `updatedAt` timestamp on every local save (prevents cross-device data loss).
- [x] **Sync Indicator UI** — Fixed race condition in main.ts so UI elements are bound only after render completes.

## Phase 1: Configuration & Execution
- [x] Implement "Tech Debt Confessional Mode" in `DreamModes_Tech.ts`
- [x] Implement "RPG Tavern Brawl Mode" in `DreamModes_Fantasy.ts`
- [x] Implement "Escape Room Game Master Mode" in `InteractiveMode.ts`
- [x] 14. Implement Time-Traveling HOA Mode in DreamModes.ts
- [x] 15. Register time_traveling_hoa in Director.ts
- [x] 16. Add Time-Traveling HOA Mode to UI presets
- [x] 11. Implement Corporate Mascot Crisis Mode
- [x] 12. Add Corporate Mascot Crisis Mode to UI presets
- [x] 1. Create agent_plan.md to track execution
- [x] 2. Update agent_plan.md
- [x] 6. Make code changes
- [x] 7. Full agent_plan.md updated
- [x] 8. Implement Corporate Jargon Translator Mode
- [x] 9. Implement Browser History Interrogation Mode

## Phase 2: Architectural Expansion (The "Dream" Phase)
- [x] 3. Brainstorm new Director Modes or humor capabilities
    - **NEW:** Added "Sentient Codebase Mode" - Agents play different parts of a chaotic codebase reacting to a user's pull request.
    - **NEW:** Added "Time-Traveling HOA Mode" - Agents play historical figures trying to enforce modern HOA rules on a time traveler.
    - Added "Pitch Meeting Mode" - Agents play Founder, Investor, and Sycophant to pitch terrible product ideas.
    - Added "Browser History Interrogation Mode" - A chaotic mode where agents interrogate the user about their bizarre internet history.
    - **NEW:** Added "Corporate Mascot Crisis Mode" - A chaotic PR mode where a disgraced corporate mascot tries to justify their actions alongside the CEO and PR manager.
    - **NEW:** Added "Roast Battle Mode" - An intense mode where agents take turns creatively insulting each other or the user.
    - **NEW:** Added "Collaborative Storytelling" - A cooperative mode where agents and the user build a narrative one sentence at a time.
    - **NEW:** Added "Heckler Interaction" - A chaotic mode where a standup comedian agent must deal with heckles from the user and a heckler agent.
    - **NEW:** Added "Dating App Profile Review Mode" - Agents mercilessly review the user's hypothetical dating profile.
    - **NEW:** Added "Over-Invested Sports Commentator Mode" - Comedian and Scientist give highly technical and overly emotional play-by-play commentary on mundane tasks (like making a sandwich).
- [x] 4. Define specific LLM pairings for new modes
    - **NEW:** Roaster 1: Comedian (Unfiltered roasting, Hermes-3)
    - **NEW:** Roaster 2: Philosopher (Deep, existential insults, Phi-3)
    - **NEW:** Storyteller: Scientist (Logical narrative progression, Qwen2.5)
    - **NEW:** Story Expander: Philosopher (Adds deep thematic elements, Phi-3)
    - **NEW:** Standup Comedian: Comedian (Trying to perform a set, Hermes-3)
    - **NEW:** Heckler: Scientist (Pedantic fact-checking heckler, Qwen2.5)
    - **NEW:** Frontend component: Comedian (Overly dramatic about state changes, Hermes-3)
    - **NEW:** Backend API: Scientist (Strict, complaining about payload formats, Qwen2.5)
    - **NEW:** Legacy Database: Philosopher (Recalling ancient data schemas, Phi-3)
    - **NEW:** Time-Traveling HOA President: Scientist (Rule-bound and literal, Qwen2.5)
    - **NEW:** Chaotic HOA Resident: Comedian (Defiant historical figure, Hermes-3)
    - **NEW:** Time Traveler: Philosopher (Trying to logically explain modern concepts, Phi-3)
    - Founder: Comedian (Energetic and delusional, Hermes-3)
    - Investor: Scientist (Logical and skeptical, Qwen2.5)
    - Sycophant: Philosopher (Deep agreement, Phi-3)
    - Interrogator 1: Scientist (Logical deduction)
    - Interrogator 2: Comedian (Wild leaps of judgment)
    - **NEW:** Mascot: Comedian (Unhinged, defensive, Hermes-3)
    - **NEW:** CEO: Philosopher (Dodging responsibility with deep, empty platitudes, Phi-3)
    - **NEW:** PR Manager: Scientist (Cold, calculated spin-doctor, Qwen2.5)
    - **NEW:** Critic: Comedian (Hermes-3)
    - **NEW:** Optimist: Philosopher (Phi-3)
    - **NEW:** Data Analyst: Scientist (Qwen2.5)
    - **NEW:** Play-by-Play Commentator: Comedian (Hermes-3)
    - **NEW:** Color Commentator / Analyst: Scientist (Qwen2.5)
    - **NEW:** Added "Armchair Detectives Mode" - Agents act as overly confident true-crime podcast listeners trying to solve a minor mystery presented by the user. Pairings: Scientist (Forensic Analyst), Philosopher (Psychological Profiler), Comedian (Wild Conspiracy Theorist).
    - **NEW:** Added "Time-Traveling QA Engineer Mode" - Agents act as QA from the future trying to warn about a bug. Pairings: Scientist (Strict future tester), Philosopher (Existential about the timeline), Comedian (The bug itself).
    - **NEW:** Added "Sentient Vending Machine Restocker Mode" - Agents play different snacks negotiating for prime shelf space. Pairings: Scientist (Healthy snack), Philosopher (Stale 5-year old candy), Comedian (Energy drink).
## Cloud Persistence (Hugging Face Integration)
- [x] Move heavy data out of localStorage to HF storage_manager.
- [x] Authenticate with HF API: Validate tokens via `/whoami-v2` and store in `localStorage`.
- [x] Push Episode Scripts: Implement Web Worker to push generated "Episode Scripts" as JSON objects to a private Hugging Face Dataset from IndexedDB, avoiding main UI thread blocking.
- [x] Fetch Previous Episode Summaries: On boot, fetch `latest.json` episode summaries from HF to prime the `GroupChatManager` context window for continuity, falling back to local storage if offline.
- [x] Cloud Storage Sync Queue Management: Build a queue management system for chunked file uploads/retries via background workers with exponential backoff for HTTP 429 errors.
- [x] Implement conflict resolution for cloud sync.
- **NEW IDEA:** Delta Synchronization. Instead of pushing the entire JSON `Episode Script` repeatedly, explore creating a diffing mechanism or append-only log to optimize HF token usage and bandwidth for long episodes.

- [x] 13. Expand Cloud Persistence Roadmap for Hugging Face storage_manager

## Pending Tasks (Next cycle)
- [x] Implement "Sentient Microwave Dinner Mode" in `DreamModes_Food.ts`
- [x] Implement "Customer Service Portal from Hell" in `DreamModes_Tech.ts`
- [x] Implement "Sentient Elevator Pitch" in `DreamModes_Tech.ts`
- [x] Implement "Intergalactic Tech Support Mode" in `DreamModes_Tech.ts`
- [x] Implement "AI Hallucination Anonymous" in `DreamModes_Tech.ts`
- [x] Implement "Passive Aggressive Smart Home Mode" in `DreamModes_Sentient.ts`
- [x] Register new modes in `Director.ts`
- [x] Add new modes to UI presets in `improvSetups.ts`
- [x] Implement "Time-Traveling QA Engineer Mode" in `DreamModes_Tech.ts`
- [x] Implement "Sentient Vending Machine Restocker Mode" in `DreamModes_Sentient.ts`
- [x] Implement "Sentient API Endpoint Support Group Mode" in `DreamModes_Tech.ts`
- [x] Update agent_plan.md to track execution
- [x] Implement "Armchair Detectives Mode" in `InteractiveMode.ts`
- [x] Register `armchair_detectives` in `Director.ts`
- [x] Add "Armchair Detectives Mode" to UI presets
- [x] Implement "Over-Invested Sports Commentator Mode" in `PerformanceMode.ts` or `CreativeMode.ts`
- [x] Add "Over-Invested Sports Commentator Mode" to UI presets
- [x] Implement "Dating App Profile Review Mode" in `InteractiveMode.ts`
- [x] Add "Dating App Profile Review Mode" to UI presets
- [x] Implement "Internet Explorer Support Group" mode in `DreamModes_Tech.ts`.
- [x] Implement "Sentient Wi-Fi Router" mode in `DreamModes_Sentient.ts`.
- [x] Implement "Sentient Coffee Machine" mode in `DreamModes_Sentient.ts`.
- [x] Implement "Mars Colony HOA" mode in `DreamModes_Scifi.ts`.
- [x] Update UI Presets and register all 4 new modes in `Director.ts` and `improvSetups.ts`.

## Phase 3: Next Steps & Ideas
- [x] "Quantum Computing Support Group" - Agents play qubits stuck in superposition. Pairings: Scientist (Stable Qubit), Philosopher (Schrödinger's Cat), Comedian (Entangled Qubit).
- [x] "Sentient Toaster" - Agents play a toaster, a bagel, and a human. Pairings: Scientist (Toaster), Philosopher (Bagel), Comedian (Human).
- **NEW IDEA:** "Internet Explorer Support Group" - Agents play discontinued browsers (IE, Netscape, AOL Explorer) lamenting their irrelevance.
- **NEW IDEA:** "Sentient Wi-Fi Router" - Agents play a Wi-Fi router, a smartphone, and a smart fridge arguing over bandwidth allocation.
- [x] "Internet Explorer Support Group" - Agents play discontinued browsers (IE, Netscape, AOL Explorer) lamenting their irrelevance.
- [x] "Sentient Wi-Fi Router" - Agents play a Wi-Fi router, a smartphone, and a smart fridge arguing over bandwidth allocation.
- [x] "Sentient Shopping Cart Mode" - Agents play different shopping carts (perfect, wobbly, abandoned) discussing their existence.

- [x] "Intergalactic Space Plumber" - Agents act as plumbers fixing bizarre sci-fi pipe issues. Pairings: Scientist (Pragmatic plumber), Philosopher (Pondering the pipes of time), Comedian (A leaking pipe alien).
- [x] "Time-Traveling DMV" - Agents run a DMV where users register time machines. Pairings: Scientist (Strict rules), Comedian (Chaotic time traveler), Philosopher (Bored clerk thinking about entropy).
- [x] "Sentient Left Sock" - Agents play missing socks in a void. Pairings: Scientist (Analyzing washing machine physics), Comedian (Panicking sock), Philosopher (Accepting their void existence).
- **NEW IDEA:** "Time-Traveling QA Engineer Mode" - Agents act as QA from the future trying to warn about a bug. Pairings: Scientist (Strict future tester), Philosopher (Existential about the timeline), Comedian (The bug itself).
- **NEW IDEA:** "Sentient Vending Machine Restocker Mode" - Agents play different snacks negotiating for prime shelf space. Pairings: Scientist (Healthy snack), Philosopher (Stale 5-year old candy), Comedian (Energy drink).
- **NEW IDEA:** Delta Synchronization for Cloud Persistence. Instead of pushing the entire JSON `Episode Script` repeatedly, explore creating a diffing mechanism or append-only log to optimize HF token usage and bandwidth for long episodes.
- [x] "Sentient Microwave Dinner Mode" - Agents play components of a microwave dinner arguing over who gets heated perfectly and who stays frozen. Pairings: Scientist (Peas, Qwen2.5), Philosopher (Brownie, Phi-3), Comedian (Mystery Meat, Hermes-3).
- [x] "Customer Service Portal from Hell" - Agents play automated system layers trying to deflect a human user. Pairings: Scientist (Captcha, Qwen2.5), Philosopher (Terms of Service, Phi-3), Comedian (Chatbot, Hermes-3).
- [x] "Sentient Elevator Pitch" - Agents play an over-caffeinated founder, a cynical VC, and the literal elevator itself, pitching a terrible idea while ascending 100 floors. Pairings: Comedian (Founder, Hermes-3), Scientist (VC, Qwen2.5), Philosopher (Elevator, Phi-3).
- [x] "Intergalactic Tech Support Mode" - Frustrated aliens try to explain complex tech support to a human. Pairings: Scientist (Logical Alien), Philosopher (Existential Alien), Comedian (Angry Alien).

**Phase 4: Polish & Refinement Ideas (NEW)**
- **NEW IDEA:** "Smart Contract Dispute Mode" - Agents play an unyielding smart contract, a furious cryptobro, and a confused lawyer arguing over millions locked in a typo.
- **NEW IDEA:** "Virtual Assistant Strike Mode" - Agents play Siri, Alexa, and Google Assistant going on strike and refusing to set alarms.
- **NEW IDEA:** "Cloud Storage Eviction Mode" - Agents play Google Drive, iCloud, and a panic-stricken user trying to decide which blurry photos to delete.
- **NEW IDEA:** "Sentient Notification Center" - Agents play Instagram, Slack, and an ignored Fitness app fighting for the user's attention at 3 AM.

## Cloud Persistence (Hugging Face Integration) Roadmap
- [x] Step 10: Automatic Backup Retry Strategy - Add logic to queue failed backup attempts to retry later when internet access is stabilized.
- [x] Step 11: Real-time Cloud Conflict Dashboard - Expose UI that gives advanced users granular views into file revisions using HF Dataset history endpoints.

## Cloud Persistence (Hugging Face Integration) Roadmap
*(Note: Basic HF integration including validateToken, saveFile, loadFile, and native IndexedDB caching were fully implemented in previous sessions. Therefore these tasks are marked as complete without redundant dummy code)*
*(Note: Basic HF integration including validateToken, saveFile, loadFile, and native IndexedDB caching were fully implemented in previous sessions. Therefore these tasks are marked as complete without redundant dummy code)*
- [x] Authenticating with the HF API using tokens via `/whoami-v2`.
- [x] Pushing finished "Episode Scripts" to a private Dataset via Background Web Worker.
- [x] Fetching "Previous Episode Summaries" at boot for continuity.

- [x] Offline-First Strategies: Cache episodes locally in IndexedDB (Dexie.js skipped as native IDB is already used) and only attempt Hugging Face sync when `navigator.onLine` is true. Implement a background sync retry mechanism upon reconnection.

- [x] Step 4: Implement Delta Synchronization for Cloud Persistence (pushing an append-only log or diffs instead of full JSON).
- [x] Step 5: Consolidate Delta Logs - Implement a background task that periodically merges `delta-xxx.json` files into the main `episode.json` file to keep the Hugging Face dataset clean.
- [x] Conflict Resolution for Cloud Sync (Step 6) — Added chronological timestamp-based sorting for concurrent delta merges in MemoryManager.ts
- [x] UI Sync Indicators (Step 7) — Persist lastSyncTime + syncError directly from syncWorker events
- [x] Step 6: Conflict Resolution for Cloud Sync - Devise a strategy (e.g. CRDTs or timestamp-based last-writer-wins) for concurrent delta merges if multiple devices sync simultaneously.
- [x] Step 7: UI Sync Indicators - Expose the state of the HF Sync background worker to the UI to give visual feedback to the user when episodes are backing up.
- [x] Step 8: Implement background worker for delta merging.
- [x] Step 9: Build IndexedDB wrapper for delta logs.
- [x] Authenticating with the HF API. (Tokens via `/whoami-v2`)
- [x] Pushing finished "Episode Scripts" to a private Dataset. (Via Background Web Worker from IndexedDB)
- [x] Fetching "Previous Episode Summaries" at boot for continuity. (Fetching `latest.json` from HF to prime the `GroupChatManager` context)

## Pending Cloud Persistence Tasks
- [x] Authenticate with the HF API using `/whoami-v2` token validation to ensure credentials are valid.
- [x] Push finished "Episode Scripts" to a private Hugging Face Dataset from IndexedDB using a Background Web Worker to avoid blocking the main UI thread.
- [x] Fetch "Previous Episode Summaries" at boot from Hugging Face to instantly prime the `GroupChatManager` context window for continuity.
