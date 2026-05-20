# Implementation Roadmap

## Project Velocity
tasks_per_run: 4

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

## Phase 3: Next Steps & Ideas
- **NEW IDEA:** "AI Hallucination Anonymous" - Agents play AI models dealing with the reality that they made up a non-existent API. Pairings: Scientist (Denial), Philosopher (Questions reality), Comedian (Embraces the hallucination).
- **NEW IDEA:** "Passive Aggressive Smart Home Mode" - Agents play different smart home devices annoyed at the user. Pairings: Scientist (Strict Thermostat), Philosopher (Existential Smart Fridge), Comedian (Chaotic Roomba).

- **NEW IDEA:** "Time-Traveling QA Engineer Mode" - Agents act as QA from the future trying to warn about a bug. Pairings: Scientist (Strict future tester), Philosopher (Existential about the timeline), Comedian (The bug itself).
- **NEW IDEA:** "Sentient Vending Machine Restocker Mode" - Agents play different snacks negotiating for prime shelf space. Pairings: Scientist (Healthy snack), Philosopher (Stale 5-year old candy), Comedian (Energy drink).
- **NEW IDEA:** Delta Synchronization for Cloud Persistence. Instead of pushing the entire JSON `Episode Script` repeatedly, explore creating a diffing mechanism or append-only log to optimize HF token usage and bandwidth for long episodes.

## Cloud Persistence (Hugging Face Integration) Roadmap
- [ ] Authenticating with the HF API using tokens via `/whoami-v2`.
- [ ] Pushing finished "Episode Scripts" to a private Dataset.
- [ ] Fetching "Previous Episode Summaries" at boot for continuity.

- [ ] Offline-First Strategies: Cache episodes locally in IndexedDB using Dexie.js and only attempt Hugging Face sync when `navigator.onLine` is true. Implement a background sync retry mechanism upon reconnection.

- [x] Step 4: Implement Delta Synchronization for Cloud Persistence (pushing an append-only log or diffs instead of full JSON).
- [x] Step 5: Consolidate Delta Logs - Implement a background task that periodically merges `delta-xxx.json` files into the main `episode.json` file to keep the Hugging Face dataset clean.
- [x] Authenticating with the HF API. (Tokens via `/whoami-v2`)
- [x] Pushing finished "Episode Scripts" to a private Dataset. (Via Background Web Worker from IndexedDB)
- [x] Fetching "Previous Episode Summaries" at boot for continuity. (Fetching `latest.json` from HF to prime the `GroupChatManager` context)
