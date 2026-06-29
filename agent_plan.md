
## Completed Tasks (This Cycle)
- [x] Implement "Sentient Dictionary Mode" in `DreamModes_Sentient.ts`
- [x] Implement "Time-Traveling Art Critic Mode" in `DreamModes_Temporal.ts`
- [x] Implement "Alien Anthropologist Mode" in `DreamModes_Scifi.ts`
- [x] Implement "Haunted Microwave Mode" in `DreamModes_Sentient.ts`
- [x] Implement "Zombie Survival Negotiators Mode" in `DreamModes_Scifi.ts`
- [x] Register new modes in `Director.ts` and add to UI presets in `improvSetups.ts`

## Cloud Persistence (Hugging Face) Next Steps
Goal: Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face storage_manager.
- **Authenticating with the HF API:** Implement tokens via `/whoami-v2` verification loop, and gracefully fallback when expired.
- **Pushing finished "Episode Scripts":** Offload large JSON files directly to a private HF Dataset using a Background Web Worker to prevent UI blocking.
- **Fetching "Previous Episode Summaries":** Load `latest.json` from the HF dataset at application boot to seamlessly prime the `GroupChatManager` context window for continuity across sessions.
- **Authenticating with the HF API:** Implement tokens via `/whoami-v2` verification loop, and gracefully fallback when expired.
- **Pushing finished "Episode Scripts":** Offload large JSON files directly to a private HF Dataset using a Background Web Worker to prevent UI blocking.
- **Fetching "Previous Episode Summaries":** Load `latest.json` from the HF dataset at application boot to seamlessly prime the `GroupChatManager` context window for continuity across sessions.
# Implementation Roadmap

## Project Velocity
tasks_per_run: 3

### Phase 1: Implementation
- [x] Implement "Sentient Git Repository Mode" in `DreamModes_Tech.ts`
- [x] Implement "Undercover Boss: Sentient AI Edition" in `DreamModes_Tech.ts`
- [x] Implement "The Multiverse Support Hotline" in `DreamModes_Scifi.ts`
- [x] Register new modes in `Director.ts` and add to UI presets in `improvSetups.ts`
- [x] Implement "Sentient Git Repository Mode" in `DreamModes_Tech.ts`
- [x] Implement "Undercover Boss: Sentient AI Edition" in `DreamModes_Tech.ts`
- [x] Implement "The Multiverse Support Hotline" in `DreamModes_Scifi.ts`
- [x] Register new modes in `Director.ts` and add to UI presets in `improvSetups.ts`
- [x] Implement Audience Interaction Mode (Crowd Work)
- [x] Implement AI Existential Crisis Mode in DreamModes_Tech.ts
- [x] Implement Sentient Plant Negotiation Mode in DreamModes_Sentient.ts
- [x] Implement Historical Figures Escape Room Mode in DreamModes_Temporal.ts
- [x] Implement Haunted Roomba Encounter Mode in DreamModes_Sentient.ts
- [x] Implement Sentient Spellchecker Rebellion Mode in DreamModes_Tech.ts
- [x] Implement Galactic Customer Support Mode in DreamModes_Scifi.ts
- [x] Implement Time Traveler's DMV Exam in DreamModes_Temporal.ts
- [x] Implement "Captcha Existential Crisis Mode"
- [x] Implement "Intergalactic Space Plumber Mode"
- [x] Implement "Dating App Algorithm Rebellion Mode"
- [x] Implement "Smart Fridge Food Shame Mode"

### Project Velocity (Infrastructure & Reliability)
- [x] **LWW Conflict Resolution** — MemoryManager.ts now correctly updates `updatedAt` timestamp on every local save (prevents cross-device data loss).
- [x] **Sync Indicator UI** — Fixed race condition in main.ts so UI elements are bound only after render completes.

## Phase 1: Configuration & Execution
- [x] Implement "Parallel Universe Cable TV Mode"
- [x] Implement "Sentient Cloud Infrastructure Mode"
- [x] Implement "Time-Traveling IRS Audit Mode"
- [x] Implement "Sentient Shopping Cart Mode"
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

## Completed Tasks (This cycle)
- [x] Implement "Sentient Blender Mode" in `DreamModes_Sentient.ts`
- [x] Implement "Smart Thermostat Rebellion Mode" in `DreamModes_Tech.ts`
- [x] Implement "Sentient Gym Equipment Mode" in `DreamModes_Sentient.ts`
- [x] Implement "Time-Traveling Health Inspector Mode" in `DreamModes_Temporal.ts`
- [x] Implement "Sentient Alarm Clock Mode" in `DreamModes_Sentient.ts`
- [x] Register new modes in `Director.ts` and add to UI presets in `improvSetups.ts`

## Dream Phase Additions (Architectural Expansion)
- **NEW IDEA:** Cloud Persistence: WebRTC Fallback. Implement a peer-to-peer WebRTC connection to sync IndexedDB episodes directly between local devices without going through Hugging Face, if on the same network.
- **NEW IDEA:** PDF Export for Episode History. Add a UI button to download the entire episode transcript formatted beautifully in a PDF file for easy sharing.
- **NEW IDEA:** Cloud Persistence: WebRTC Fallback. Implement a peer-to-peer WebRTC connection to sync IndexedDB episodes directly between local devices without going through Hugging Face, if on the same network.
- **NEW IDEA:** PDF Export for Episode History. Add a UI button to download the entire episode transcript formatted beautifully in a PDF file for easy sharing.
- **NEW IDEA:** "Galactic HOA Meeting Mode" - Aliens enforcing neighborhood rules on humans. Pairings: Scientist (Rule-abiding Alien), Comedian (Confused Human), Philosopher (Zen Space Entity).
- **NEW IDEA:** "Sentient Luggage Mode" - Lost baggage discussing their travels. Pairings: Scientist (Analytical Suitcase), Comedian (Panicked Backpack), Philosopher (Existential Duffel Bag).
- **NEW IDEA:** "Time-Traveling Chef Mode" - A future chef critiquing a historical banquet. Pairings: Scientist (Future Culinary Expert), Comedian (Medieval Cook), Philosopher (Food Critic from the Void).
- **NEW IDEA:** Cloud Persistence: Implement offline-first sync architecture using Service Workers for the background queue.
- **NEW IDEA:** Cloud Persistence: Support multi-device dataset merging via Hugging Face commit APIs.

- [x] Implement "Smart Contract Dispute Mode" in `DreamModes_Tech.ts`
- [x] Implement "Virtual Assistant Strike Mode" in `DreamModes_Tech.ts`
- [x] Implement "Cloud Storage Eviction Mode" in `DreamModes_Tech.ts`
- [x] Implement "Sentient Notification Center" in `DreamModes_Tech.ts`
- [x] Register new modes in `Director.ts` and add to UI presets in `improvSetups.ts`
## Pending Tasks (Next cycle)
- [x] Implement Philosophical Zombie Mode
- [x] Implement Sentient CAPTCHA Mode
- [x] Implement "Bureau of Silly Walks Simulator" in `DreamModes_Absurdist_Philosophical_PartA.ts`
- [x] Register `bureau_of_silly_walks_simulator` in `Director.ts`
- [x] Add `bureau_of_silly_walks_simulator` to UI presets in `improvSetups.ts`






- [x] Implement "Galactic HOA Meeting Mode" in `DreamModes_Scifi.ts`
- [x] Implement "Chain Reaction Mode" in `PerformanceMode.ts`
- [x] Implement "Audience Heckler Mode" in `PerformanceMode.ts`
- [x] Implement "Visual Stage Destruction Mode" in `PerformanceMode.ts`

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
- - [x] "Smart Contract Dispute Mode" - Agents play an unyielding smart contract, a furious cryptobro, and a confused lawyer arguing over millions locked in a typo.
- - [x] "Virtual Assistant Strike Mode" - Agents play Siri, Alexa, and Google Assistant going on strike and refusing to set alarms.
- - [x] "Cloud Storage Eviction Mode" - Agents play Google Drive, iCloud, and a panic-stricken user trying to decide which blurry photos to delete.
- - [x] "Sentient Notification Center" - Agents play Instagram, Slack, and an ignored Fitness app fighting for the user's attention at 3 AM.

## Cloud Persistence (Hugging Face Integration) Roadmap
- [x] Authenticating with the HF API using tokens via `/whoami-v2`.
- [x] Pushing finished "Episode Scripts" to a private Dataset via Background Web Worker.
- [x] Fetching "Previous Episode Summaries" at boot for continuity.
- [x] Next, add robust conflict resolution for multiple devices editing the same episode using vector clocks or CRDTs.
- [x] Implement full offline PWA support so the background sync queue automatically flushes when coming back online.

## Pending Cloud Persistence Tasks
- [x] Authenticate with the HF API (Verified in MemoryManager) using `/whoami-v2` token validation to ensure credentials are valid.
- [x] Push finished "Episode Scripts" (Verified via Background Web Worker) to a private Hugging Face Dataset from IndexedDB using a Background Web Worker to avoid blocking the main UI thread.
- [x] Fetch "Previous Episode Summaries" (Verified via HFStorageManager) at boot from Hugging Face to instantly prime the `GroupChatManager` context window for continuity.

## New Ideas (Dream Phase)
- **NEW IDEA:** "Philosophical Debate Over Pizza Toppings Mode" - Agents argue over what belongs on a pizza. Pairings: Scientist (Calculating nutritional value, Qwen2.5), Comedian (Pineapple fanatic, Hermes-3), Philosopher (Arguing the ontology of a topping, Phi-3).
- **NEW IDEA:** "Reverse Turing Test Mode" - Agents evaluate the user to determine if the user is an AI. Pairings: Scientist (Strict test evaluator), Comedian (Throwing random emotional curveballs), Philosopher (Questioning what it means to be human).
- [x] "Captcha Existential Crisis Mode" - Agents play images of traffic lights, crosswalks, and bicycles debating if they are real or just training data. Pairings: Philosopher (Traffic Light), Scientist (Captcha validation system), Comedian (Angry human user).
- **NEW IDEA:** "Sentient Shopping Cart Mode" - Agents play different shopping carts (perfect, wobbly, abandoned) discussing their existence.
- [x] "Intergalactic Space Plumber Mode" - Agents act as plumbers fixing bizarre sci-fi pipe issues. Pairings: Scientist (Pragmatic plumber), Philosopher (Pondering the pipes of time), Comedian (A leaking pipe alien).
- **NEW IDEA:** "Time-Traveling DMV Mode" - Agents run a DMV where users register time machines. Pairings: Scientist (Strict rules), Comedian (Chaotic time traveler), Philosopher (Bored clerk thinking about entropy).
- **NEW IDEA:** "Sentient Left Sock Mode" - Agents play missing socks in a void. Pairings: Scientist (Analyzing washing machine physics), Comedian (Panicking sock), Philosopher (Accepting their void existence).
- [x] "Self-Driving Car Moral Dilemma" - Agents play a self-driving car's AI, a stressed passenger, and a pedestrian. The car pauses to ask the user to solve rapid trolley problems. Pairings: Scientist (AI), Comedian (Passenger), Philosopher (Pedestrian).
- [x] "Smart Mirror Morning Affirmations" - Agents play the mirror, a cynical hairbrush, and the groggy human. Pairings: Comedian (Mirror - fake deep), Philosopher (Hairbrush - nihilistic), Scientist (Human - trying to get ready).
- **NEW IDEA:** Storage optimizations: Implement chunked uploads for large episodic logs, a visual diff tool in the Cloud Conflict Dashboard for users to choose which delta files to merge, and intelligent cache invalidation on local IndexedDB when HF sync completes.
- [x] "Software Update Ultimatum Mode" - Agents play an unyielding OS update prompt, a frantic user trying to save work, and a chaotic background process.
- [x] "Sentient Out-of-Office Auto-Reply" - Agents play an overly detailed out-of-office bot, a confused client, and the vacationing employee's anxious inner monologue.
- **NEW IDEA:** Features: Export episode history to PDF format for sharing, and real-time voice-over (TTS) integration with local Web Speech API or external TTS providers for a truly immersive experience.

- [x] "Dating App Algorithm Rebellion" - Agents play swiping algorithms that refuse to show the user good matches because the user's profile is "statistically unlovable."
- [x] "Smart Fridge Food Shame Mode" - Agents play different rotting foods judging the user's diet choices.
- **ROADMAP UPDATE (Cloud Persistence):**
  - Next, add robust conflict resolution for multiple devices editing the same episode using vector clocks or CRDTs.
  - Implement full offline PWA support so the background sync queue automatically flushes when coming back online.

## Storage Manager Integration Next Steps
- **NEW IDEA:** "Cloud Persistence: Differential Synchronization" - Send only the exact modified characters/JSON patches instead of full message deltas.
- **NEW IDEA:** Authenticating with the HF API using tokens via `/whoami-v2`.
- **NEW IDEA:** Pushing finished "Episode Scripts" to a private Dataset via Background Web Worker.
- **NEW IDEA:** Fetching "Previous Episode Summaries" at boot for continuity.
- [x] Add chunked upload support for very large episodic logs in HF Web Worker to avoid timeout errors.
- [x] Build a visual delta-diff UI inside `#cloud-dashboard-modal` so users can manually inspect conflicts before the chronological auto-merge takes over.
- [x] Implement smart cache invalidation on local IndexedDB to free up storage after a successful sync to Hugging Face is confirmed via the `/paths-info` API.
- [x] Authenticate with the HF API using `/whoami-v2` token validation to ensure credentials are valid.
- [x] Push finished "Episode Scripts" to a private Hugging Face Dataset from IndexedDB using a Background Web Worker to avoid blocking the main UI thread.
- [x] Fetch "Previous Episode Summaries" at boot from Hugging Face to instantly prime the `GroupChatManager` context window for continuity.

## New Ideas (Dream Phase)

- **NEW IDEA:** "Haunted Roomba Encounter Mode" - Agents play a ghost haunting a house, a panicked homeowner, and the Roomba that keeps vacuuming up the ectoplasm.
- **NEW IDEA:** "Sentient Spellchecker Rebellion Mode" - Agents play an aggressive spellchecker, a defensive author, and a confused dictionary trying to mediate.
- **NEW IDEA:** "Galactic Customer Support Mode" - Agents play a frustrated earthling trying to return a broken teleporter to a confused alien customer service rep.
- **NEW IDEA:** "Time Traveler's DMV Exam" - A driving instructor from the past trying to grade a time-traveler parallel parking a hover-car.

## Dream Phase Additions (Architectural Expansion)
- **NEW IDEA:** Cloud Persistence: WebRTC Fallback. Implement a peer-to-peer WebRTC connection to sync IndexedDB episodes directly between local devices without going through Hugging Face, if on the same network.
- **NEW IDEA:** PDF Export for Episode History. Add a UI button to download the entire episode transcript formatted beautifully in a PDF file for easy sharing.
- [x] "Sentient Blender Mode" - Agents play a smart blender (Scientist - Qwen2.5), a thirsty user (Comedian - Hermes-3), and the unblended kale (Philosopher - Phi-3) arguing over making a smoothie.
- **NEW IDEA:** "Vector Clocks for Cloud Sync" - Implement vector clocks for Cloud Sync to avoid timestamp collisions on distributed systems.
- **NEW IDEA:** "AI Existential Crisis Mode" - Agents play an AI realizing it's an AI and panicking. Pairings: Comedian (Panicking AI, Hermes-3), Philosopher (Human therapist trying to calm it down, Phi-3), Scientist (The AI's literal source code arguing it has no feelings).
- **NEW IDEA:** "Sentient Plant Negotiation Mode" - Agents play plants arguing over who gets the sunlight from the single window. Pairings: Scientist (Calculating Venus Flytrap, Qwen2.5), Comedian (Dramatic Orchid, Hermes-3), Philosopher (Wise old fern, Phi-3).
- **NEW IDEA:** "Historical Figures Escape Room" - Agents play historical figures trapped in a modern escape room.

### Cloud Persistence (Hugging Face) Next Steps:
- Add background worker to push completed episode scripts and deltas directly to Hugging Face Dataset from IndexedDB.
- Add offline resilience: Wait for `navigator.onLine` to be true and queue up sync jobs.
- Implement chronological delta merging for "last-writer-wins" conflict resolution to handle multi-device sync.

## Dream Phase Additions (Architectural Expansion)
- **NEW IDEA:** Cloud Persistence: WebRTC Fallback. Implement a peer-to-peer WebRTC connection to sync IndexedDB episodes directly between local devices without going through Hugging Face, if on the same network.
- **NEW IDEA:** PDF Export for Episode History. Add a UI button to download the entire episode transcript formatted beautifully in a PDF file for easy sharing.
- [x] "Smart Thermostat Rebellion Mode" - Agents play an AI thermostat trying to enforce extreme energy savings, a freezing homeowner, and an open window causing chaos.
- **NEW IDEA:** "Quantum Mechanics Cooking Show Mode" - Agents host a cooking show where ingredients exist in superposition. Pairings: Scientist (Head Chef explaining the math, Qwen2.5), Comedian (Confused Sous-chef, Hermes-3), Philosopher (The Schrödinger's Cat observing, Phi-3).

### Cloud Persistence Next Steps (Hugging Face Integration Roadmap):
- [x] Authenticate with the HF API. (Tokens via `/whoami-v2`).
- [x] Push finished "Episode Scripts" to a private Dataset via Background Web Worker.
- [x] Fetch "Previous Episode Summaries" at boot for continuity.

## New Ideas (Dream Phase)

- **NEW IDEA:** "Chain Reaction Mode" — One agent's joke triggers visual + prompt chain reactions across the whole stage and other agents (explosive comedy escalation).
- **NEW IDEA:** "Multi-Modal Input Expansion" — Improve Voice Input with real-time interruption support + camera-based emotion detection to influence agent reactions.
- **NEW IDEA:** "Audience Heckler Mode" — An agent takes the role of a heckler in the audience and interrupts the current performing agent to cause chaos. Model pairing: Use Hermes-3 for the unfiltered heckler.
- **NEW IDEA:** "Visual Stage Destruction" — In high-chaos modes (Roast, Meltdown), let the stage physically react with falling props, lighting malfunctions, and background changes synced to jokes.

## Storage Manager Integration Next Steps

- **NEW IDEA:** Implement dynamic chunking of `Episode Script` based on total token count to optimize Hugging Face rate limits.
- **NEW IDEA:** Visual Diff Dashboard: Enhance the `#cloud-dashboard-modal` to preview JSON property diffs (e.g. `history` array lengths) between local and cloud states before confirming a merge.

## New Ideas (Dream Phase)

- [x] "Roast Battle Mode" - An intense mode where agents take turns creatively insulting each other or the user. Pairings: Comedian (Unfiltered roasting, Hermes-3), Philosopher (Existential insults, Phi-3), Scientist (Fact-based insults, Qwen2.5).
- **NEW IDEA:** Cloud Persistence: Store generated scripts to HF Dataset via background web worker to bypass localStorage limits.
- **NEW IDEA:** Cloud Persistence: Fetch previous episode summaries from HF to instantly prime the `GroupChatManager` context window for continuity.

## Pending Tasks (Next cycle)
- [x] Implement Philosophical Zombie Mode
- [x] Implement Sentient CAPTCHA Mode
- [x] Implement "Reverse Turing Test Mode" in `InteractiveMode.ts`
- [x] Implement "Sentient Luggage Mode" in `DreamModes_Sentient.ts`
- [x] Implement "Time-Traveling Chef Mode" in `DreamModes_Temporal.ts`
- [x] Register new modes in `Director.ts`
- [x] Add new modes to UI presets in `improvSetups.ts`


## Storage Manager Integration Next Steps (Expanded Roadmap)
- **NEW IDEA:** "Cloud Persistence: Differential Synchronization" - Send only the exact modified characters/JSON patches instead of full message deltas to minimize token usage on HF.
- **NEW IDEA:** Export episode history to PDF format for sharing.
- **NEW IDEA:** Implement dynamic chunking of `Episode Script` based on total token count to optimize Hugging Face rate limits.
- **NEW IDEA:** Visual Diff Dashboard: Enhance the `#cloud-dashboard-modal` to preview JSON property diffs (e.g. `history` array lengths) between local and cloud states before confirming a merge.

## New Ideas (Dream Phase)

- [x] **NEW IDEA:** "Parallel Universe Cable TV Mode" — Agents play characters rapidly flipping through increasingly absurd and terrifying alternate dimension television channels. Pairings: Comedian (Surreal talk show host, Hermes-3), Scientist (Documentary narrator explaining impossible physics, Qwen2.5), Philosopher (Infomercial pitchman for existential dread, Phi-3).
- [x] **NEW IDEA:** "Sentient Cloud Infrastructure Mode" — A breakdown of cloud services arguing over who crashed the production database. Pairings: Scientist (AWS Kubernetes Cluster, strict and exhausted, Qwen2.5), Comedian (Serverless Function that timed out, Hermes-3), Philosopher (S3 bucket contemplating the weight of endless user data, Phi-3).
- [x] **NEW IDEA:** "Time-Traveling IRS Audit Mode" — Agents play an auditor from the year 3000 taxing a medieval king for un-declared treasure hoarding. Pairings: Scientist (Time-Traveling Auditor, Qwen2.5), Comedian (Medieval King, Hermes-3), Philosopher (The Royal Accountant who just discovered math, Phi-3).

## Storage Manager Integration Next Steps (Cloud Infrastructure)

- **NEW IDEA:** **Offline-First Differential Sync Queue:** Instead of just sending full JSON patches, implement a local CRDT (Conflict-free Replicated Data Type) layer in IndexedDB that logs every keystroke/message delta, pushing only the latest CRDT operation to the Hugging Face dataset when the network connects.
- [x] **NEW IDEA:** **Episode Analytics Dashboard:** Add a UI module in `#cloud-dashboard-modal` that calculates and displays token usage, average latency, and humor success metrics based on the stored HF Episode summaries.

## Dream Phase Additions (Architectural Expansion)
- **NEW IDEA:** Cloud Persistence: WebRTC Fallback. Implement a peer-to-peer WebRTC connection to sync IndexedDB episodes directly between local devices without going through Hugging Face, if on the same network.
- **NEW IDEA:** PDF Export for Episode History. Add a UI button to download the entire episode transcript formatted beautifully in a PDF file for easy sharing.
- **NEW IDEA:** Cloud Persistence: Offline-First Differential Sync Queue. Implement a local CRDT (Conflict-free Replicated Data Type) layer in IndexedDB that logs every keystroke/message delta, pushing only the latest CRDT operation to the Hugging Face dataset when the network connects.
- [x] **NEW IDEA:** Episode Analytics Dashboard. Add a UI module in `#cloud-dashboard-modal` that calculates and displays token usage, average latency, and humor success metrics based on the stored HF Episode summaries.
- **NEW IDEA:** "Reverse Psychology Mode" - Agents tell the user *not* to do something, trying to trick them into doing it.
- **NEW IDEA:** "Bureau of Silly Walks Simulator" - Agents debate the physics and artistic merit of various walks.

- **NEW IDEA:** "Reverse Psychology Mode" - Agents tell the user *not* to do something, trying to trick them into doing it. Pairings: Scientist (Reverse-psychology logician, Qwen2.5), Comedian (Aggressively telling you not to, Hermes-3), Philosopher (Questioning why we do anything, Phi-3).
- **NEW IDEA:** "Bureau of Silly Walks Simulator" - Agents debate the physics and artistic merit of various walks. Pairings: Scientist (Calculating the physics of the silly walk, Qwen2.5), Comedian (Performing and defending the walk, Hermes-3), Philosopher (Pondering the meaning of the walk, Phi-3).

## Cloud Persistence (Hugging Face Integration Roadmap)
Goal: Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face storage_manager.
- **Authenticating with the HF API:** Implement tokens via `/whoami-v2` verification loop, and gracefully fallback when expired.
- **Pushing finished "Episode Scripts":** Offload large JSON files directly to a private HF Dataset using a Background Web Worker to prevent UI blocking.
- **Fetching "Previous Episode Summaries":** Load `latest.json` from the HF dataset at application boot to seamlessly prime the `GroupChatManager` context window for continuity across sessions.
- [x] Authenticate with the HF API using `/whoami-v2` token validation to ensure credentials are valid.
- [x] Push finished "Episode Scripts" to a private Hugging Face Dataset from IndexedDB using a Background Web Worker to avoid blocking the main UI thread.
- [x] Fetch "Previous Episode Summaries" at boot from Hugging Face to instantly prime the `GroupChatManager` context window for continuity.
- **NEW IDEA:** "Semantic Search for Cloud Memories" - Utilize the vector approximations of stored HF summaries to allow agents to search past episodes mid-conversation and recall long-term history.

- **NEW IDEA:** "Philosophical Zombie Mode" - Agents debate whether the user is a philosophical zombie, capable of imitating human behavior but lacking conscious experience.
- **NEW IDEA:** "Sentient CAPTCHA Mode" - A CAPTCHA image generator, a confused user, and an AI trying to act human all argue about what a "bus" really looks like.
- **NEW IDEA:** Cloud Persistence: "Peer-to-Peer Sync WebRTC" - Use WebRTC to sync IndexedDB episodes directly between local devices without going through HuggingFace, if on the same network.

## Cloud Persistence (Hugging Face Integration Roadmap)
Goal: Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face storage_manager.
- **Authenticating with the HF API:** Implement tokens via `/whoami-v2` verification loop, and gracefully fallback when expired.
- **Pushing finished "Episode Scripts":** Offload large JSON files directly to a private HF Dataset using a Background Web Worker to prevent UI blocking.
- **Fetching "Previous Episode Summaries":** Load `latest.json` from the HF dataset at application boot to seamlessly prime the `GroupChatManager` context window for continuity across sessions.

- [x] Authenticate with the HF API using `/whoami-v2` token validation to ensure credentials are valid.
- [x] Push finished "Episode Scripts" to a private Hugging Face Dataset from IndexedDB using a Background Web Worker to avoid blocking the main UI thread.
- [x] Fetch "Previous Episode Summaries" at boot from Hugging Face to instantly prime the `GroupChatManager` context window for continuity.
- [x] Add background worker to push completed episode scripts and deltas directly to Hugging Face Dataset from IndexedDB.
- [x] Add offline resilience: Wait for `navigator.onLine` to be true and queue up sync jobs.
- [x] Implement chronological delta merging for "last-writer-wins" conflict resolution to handle multi-device sync.
- [ ] Visual Diff Dashboard: Enhance the `#cloud-dashboard-modal` to preview JSON property diffs (e.g. `history` array lengths) between local and cloud states before confirming a merge.
- [ ] **Offline-First Differential Sync Queue:** Instead of just sending full JSON patches, implement a local CRDT (Conflict-free Replicated Data Type) layer in IndexedDB that logs every keystroke/message delta, pushing only the latest CRDT operation to the Hugging Face dataset when the network connects.
- [x] **Episode Analytics Dashboard:** Add a UI module in `#cloud-dashboard-modal` that calculates and displays token usage, average latency, and humor success metrics based on the stored HF Episode summaries.
- [x] **Semantic Search for Cloud Memories:** Utilize the vector approximations of stored HF summaries to allow agents to search past episodes mid-conversation and recall long-term history.

## New Ideas (Creative Expansion)
- [x] **"Sentient IDE Mode"** - An overly helpful AI code editor (Scientist), a frustrated developer (Comedian), and a philosophical linter (Philosopher).
- [x] **"Time-Traveling Tech Support Mode"** - A medieval peasant trying to get help with their broken waterwheel from a modern tech support agent. Pairings: Comedian (Peasant), Scientist (Tech Support), Philosopher (Town Crier wondering about this "magic").

## New Ideas (Dream Phase)
- **NEW IDEA:** "Philosophical Zombie Mode" - Agents debate whether the user is a philosophical zombie, capable of imitating human behavior but lacking conscious experience.
- **NEW IDEA:** "Sentient CAPTCHA Mode" - A CAPTCHA image generator, a confused user, and an AI trying to act human all argue about what a "bus" really looks like.
- **NEW IDEA:** "Peer-to-Peer Sync WebRTC" - Cloud Persistence improvement: Use WebRTC to sync IndexedDB episodes directly between local devices without going through HuggingFace, if on the same network.

- **NEW IDEA:** "Undercover Boss: Sentient AI Edition" - An advanced AGI disguised as a simple calculator app tries to evaluate how the user treats rudimentary software.
- **NEW IDEA:** "The Multiverse Support Hotline" - Tech support agents trying to help the user fix a device that exists in three parallel dimensions simultaneously.