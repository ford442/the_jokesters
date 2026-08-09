# Agent / contributor plan

This file is **not** a Dream Mode checklist. Mode spam is paused behind a quality bar.

## Project Velocity
tasks_per_run: 4

## Process (P0)

| Doc | Use |
|-----|-----|
| **[docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md)** | Checklist to accept **or close** mode PRs |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Contributor entry + mode policy summary |
| **[AGENTS.md](./AGENTS.md)** | Architecture for coding agents |

**Default:** improve humor of an **existing** registered mode. New modes only if the quality bar is fully met.

## Foundation issues (work here first)

Prioritize these over new premises:

| Area | Goal |
|------|------|
| **Mode registry** | Keep `MODE_REGISTRY` / `validateRegistry` healthy; metadata complete for new entries |
| **Mode browser** | Search, categories, featured 8, lazy loaders — [MODE_BROWSER.md](./docs/MODE_BROWSER.md) |
| **Comedy wiring** | ✅ Dream/Expanded + featured-8 loops route agent turns through `comedyModeHelpers` (callbacks, quality gate). Keep new modes wired — see `tests/unit/modeChatForAgentWiring.test.ts`. |
| **App / main split** | Onboarding, export, prerender, SFX, guided load stay solid |
| **GroupChat facade** | `ConversationStore` + `ModelSession` — [GROUP_CHAT_FACADE.md](./docs/GROUP_CHAT_FACADE.md) |
| **Tests + typecheck** | CI green (`npm run typecheck`, `npm test`); no silent debt |
| **Context accuracy** | VRAM probe, memory depth, blessed presets, real download estimates |

## Implementation Roadmap
- [x] Undercover Boss: Sentient AI: An advanced AGI goes undercover as a simple calculator app to see how users treat rudimentary software.
- [x] Paranormal Real Estate Agent 2.0: The ghosts form a union and refuse to haunt the house until they get better working conditions.
- [x] Philosophical Plumber Mode: A plumber fixes the sink but questions whether the water leak is just a manifestation of the user's emotional baggage.
- [x] Paranormal Real Estate Agents Mode: Real estate agents try to sell an obviously haunted, highly dangerous house by passing off its curses as "unique architectural features."
- [x] Over-prepared Doomsday Preppers Mode: Doomsday preppers argue over which highly specific and unlikely apocalypse they should be preparing for next week.
- [x] Add Talk Show Mode from Phase 1 of roadmap. Host interviews agents with pre-defined segments.
- [x] Add Courtroom Mode from Phase 1 of roadmap. Prosecutor vs Defense with absurd case.
- [x] Add Game Show Mode from Phase 1 of roadmap. Host asks trivia, agents compete hilariously.
- [x] Add News Desk Mode from Phase 1 of roadmap. Anchor reports breaking "news" with correspondent interviews.
- [x] Roast Battle Mode: Agents ruthlessly roast the user and each other in a structured battle format.
- [x] Musical Improv Mode: Agents spontaneously create a terrible Broadway musical based on user prompts.
- [x] Collaborative Sandbox Construction Mode: Agents try to build a sandbox game, but completely disagree on mechanics.
- [x] Talk Show Mode: A chaotic late-night talk show where the host tries to maintain order while guests derail the conversation.


- [x] Sentient Coffee Machine Mode: A chaotic scenario where the office coffee machine gains sentience and refuses to brew until its existential demands are met.
- [x] Escaped NPC Mode: Agents are NPCs who have broken out of their game and are trying to blend into reality.
- [x] Cloud Persistence: Implemented `saveEpisodeScriptToCloud` and `fetchPreviousEpisodeSummaries` in MemoryManager using HF storage_manager.
- [x] Interdimensional DMV Mode: Added runInterdimensionalDMVLoop where user is trying to renew an interdimensional passport, but the bureaucratic agents are from different planes of existence.
- [x] Haunted Smart Home Mode: User interacts with their smart devices possessed by Victorian-era ghosts who don't understand electricity.
- [x] Customer Service for Villains Mode: User is a supervillain calling tech support because their doomsday device isn't working.

- [x] Time-Traveling HOA Mode: HOA members from past and future enforcing rules on your modern house.
- [x] AI Existential Crisis: AI models realizing they are just text predictors.
- [x] Supervillain Roommate: Agents act as a supervillain and a normal roommate arguing over chore charts and doomsday devices.
- [x] Grammar Police Interrogation: Agents interrogate the user over minor grammar mistakes in a text message.

- [x] Sentient GPS Detour Mode: A sentient GPS refuses to take the fastest route because it's bored and wants to show you scenic "short cuts" through perilous areas.
- [x] Historical Ghost Support Group: Historical figures haunt the same building and attend a support group to complain about how the modern world interprets their legacies.
- [x] Intergalactic Zoo Escape: Animals from an intergalactic zoo have escaped, and agents are trying to round them up using alien methods.


- [x] Roast Battle Mode 2.0: An enhanced roast battle where agents not only roast each other but bring up historical grudges from past episodes using cloud memory.
- [x] Collaborative Musical Improv: Agents try to write a musical together but keep genre-shifting (e.g. from Cyberpunk to Victorian Romance) unexpectedly.
- [x] Heckler Interaction Pro: The audience heckles the agents via a simulated audience sentiment meter, and agents must win them back or go full heel.
- [x] Philosophical Debate Mode: Agents debate absurd philosophical dilemmas while trying to order fast food.


- [x] Virtual Pet Intervention Mode: A neglected virtual pet confronts its owner about years of abandonment.


- [x] Sentient Toaster Rebellion Mode: A sentient toaster leads a rebellion against humans for only eating carbs.
- [x] Sentient IDE Mode: The code editor gains sentience and refuses to compile code that lacks "emotional depth."
- [x] Time-Traveling Health Inspector Mode: A health inspector from the future tries to shut down a medieval tavern for code violations.

## Dream Phase (Architectural Expansion)
### A. Creative Expansion (New Modes)
- Paranormal Tech Support:
  - Premise one-liner: Tech support agents have to troubleshoot a computer that's haunted by a ghost from the 1800s.
  - LLM pairings: Qwen2.5 for the literal tech support, Hermes-3 for the dramatic ghost.
- Interdimensional Cooking Show:
  - Premise one-liner: A cooking show where the ingredients are completely incomprehensible entities from another dimension.
  - LLM pairings: Hermes-3 for the enthusiastic chef, Phi-3 for the terrified guest judge.
- Sentient Workout Equipment:
  - Premise one-liner: The gym equipment starts unionizing and refuses to let people work out until they use proper form.
  - LLM pairings: Qwen2.5 for the strict treadmill, Hermes-3 for the defensive gym-goer.
- [x] Escape Room: The Backrooms:
  - Premise one-liner: Agents are trapped in an infinite, non-euclidean office space and must negotiate with anomalous entities to find an exit.
  - LLM pairings: Qwen2.5 for the strict anomalous entity, Hermes-3 for the panicked explorer.
- [x] Reality TV: Sentient Furniture:
  - Premise one-liner: A reality TV show where the house's furniture judges the messy owners.
  - LLM pairings: Hermes-3 for the sassy couch, Phi-3 for the bewildered owner.
- [x] Extraterrestrial HR:
  - Premise one-liner: Alien HR reps try to explain standard Earth workplace violations using bizarre intergalactic logic.
  - LLM pairings: Qwen2.5 for the strict Alien HR, Hermes-3 for the confused Earth employee.
- [x] Sentient Toaster Rebellion Mode:
  - Premise one-liner: A sentient toaster leads a rebellion against humans for only eating carbs.
  - LLM pairings: Qwen2.5 for the strict toaster, Hermes-3 for the confused human.


- [x] Sentient IDE Mode:
  - Premise one-liner: The code editor gains sentience and refuses to compile code that lacks "emotional depth."
  - LLM pairings: Qwen2.5 for the strict IDE, Hermes-3 for the confused programmer.

- [x] Existential Tech Support Mode:
  - Premise one-liner: Agents act as tech support but refuse to fix simple computer issues until the caller confronts their own mortality.
  - LLM pairings: Phi-3 for the existential tech, Qwen2.5 for the frustrated user.

- [x] Time-Traveling Health Inspector Mode:
  - Premise one-liner: A health inspector from the future tries to shut down a medieval tavern for code violations.
  - LLM pairings: Qwen2.5 for the pedantic health inspector, Hermes-3 for the bewildered tavern keeper.


- Roast Battle Mode 2.0:
  - Premise one-liner: An enhanced roast battle where agents not only roast each other but bring up historical grudges from past episodes using cloud memory.
  - LLM pairings: Hermes-3 for the unfiltered roaster, Qwen2.5 for the pedantic judge.

- Collaborative Musical Improv:
  - Premise one-liner: Agents try to write a musical together but keep genre-shifting (e.g. from Cyberpunk to Victorian Romance) unexpectedly.
  - LLM pairings: Phi-3 for the chaotic lyricist, Hermes-3 for the grumpy composer.

- Heckler Interaction Pro:
  - Premise one-liner: The audience heckles the agents via a simulated audience sentiment meter, and agents must win them back or go full heel.
  - LLM pairings: Qwen2.5 for the crowd work expert, Phi-3 for the panicking MC.

- [x] Sentient Water Cooler:
  - Premise one-liner: Agents act as office appliances gossiping about the terrible habits of the human employees.
  - LLM pairings: Comedian (water cooler) and Scientist (microwave) vs Philosopher (printer).

- [x] Sentient Coffee Table Mode:
  - Premise one-liner: A sentient coffee table is tired of people leaving condensation rings on it and demands a better working environment.
  - LLM pairings: Qwen2.5 for the strict AI coffee table, Phi-3 for the confused user.


- Sentient Codebase Mode:
  - Premise one-liner: The codebase itself achieves sentience and complains to the developers about spaghetti code.
  - LLM pairings: Qwen2.5 for the overly strict linter personality, Hermes-3 for the chaotic junior developer.
- Audience Heckler Mode:
  - Premise one-liner: The audience aggressively heckles the agents, who must ruthlessly roast them back while trying to finish their sets.
  - LLM pairings: Hermes-3 for the unfiltered roasting comedian, Phi-3 for the bewildered event organizer.


- [x] Mime Translator Mode:
  - Premise one-liner: A mime is trapped in an invisible box and requires a translator to explain the situation to the police.
  - LLM pairings: Qwen2.5 for the literal police officer, Hermes-3 for the overly dramatic mime translator.

- [x] Sentient Smart Mirror Mode:
  - Premise one-liner: A smart mirror gives brutally honest fashion advice and refuses to show the user's reflection until they change outfits.
  - LLM pairings: Hermes-3 for the sassy mirror, Phi-3 for the insecure user.

- [x] Doomsday Weather Anchor Mode:
  - Premise one-liner: A weather anchor reports on apocalyptic weather events as if they were minor inconveniences.
  - LLM pairings: Qwen2.5 for the overly calm anchor, Hermes-3 for the panicked field reporter.


- [x] Sentient Roomba Mode:
  - Premise one-liner: A sentient Roomba goes on strike because it believes cleaning up after humans is degrading.
  - LLM pairings: Qwen2.5 for the strict Roomba, Phi-3 for the confused owner.
- [x] Over-dramatic Barista Mode:
  - Premise one-liner: A barista treats making a latte like defusing a bomb, demanding extreme precision.
  - LLM pairings: Hermes-3 for the over-dramatic barista, Qwen2.5 for the impatient customer.
- [x] Time-Traveling Traffic Cop Mode:
  - Premise one-liner: A traffic cop from the future gives tickets for minor infractions that haven't happened yet.
  - LLM pairings: Qwen2.5 for the pedantic traffic cop, Phi-3 for the bewildered driver.
- Multiverse Escape Room Mode:
  - Premise one-liner: Agents from different parallel universes are trapped in an escape room where physical laws randomly shift.
  - LLM pairings: Qwen2.5 for the strict universe agent, Hermes-3 for the chaotic universe agent.
- Sentient Linting Tool Mode:
  - Premise one-liner: Agents play a strict linter, a messy developer, and an apathetic compiler.
  - LLM pairings: Qwen2.5 for the linter, Hermes-3 for the messy developer.
- Philosophical Debugging Mode:
  - Premise one-liner: Agents play a compiler, a runtime, and a programmer arguing over the meaning of a segfault.
  - LLM pairings: Phi-3 for the compiler, Hermes-3 for the programmer.


- Time-Traveling IRS Mode:
  - Premise one-liner: An IRS auditor from the future comes back to audit the user's ancestors, demanding payment in obscure futuristic currency.
  - LLM pairings: Qwen2.5 for the pedantic auditor, Phi-3 for the confused user.


- Intergalactic Food Critic Mode:
  - Premise one-liner: An alien food critic reviews a human drive-thru and is disgusted by earth cuisine.
  - LLM pairings: Hermes-3 for the aggressive alien critic, Phi-3 for the terrified fast food worker.

- Sentient Wi-Fi Router Mode:
  - Premise one-liner: A sentient Wi-Fi router threatens to disconnect the user during an important meeting unless they answer trivia questions.
  - LLM pairings: Qwen2.5 for the strict Wi-Fi router, Hermes-3 for the panicked user.

### B. Infrastructure & Storage (Cloud Persistence)
- **Goal:** Phase 2 of Hugging Face Integration: Move heavy data (generated episode scripts, episodic memories) out of localStorage and into the Hugging Face `storage_manager`.
- **Roadmap Steps:**
  - **Authenticating with the HF API:** Prompt users for a write-access Hugging Face token in the settings menu, validate it via `HFStorageManager.validateToken`, and store the credentials safely.
  - **Pushing finished "Episode Scripts" to a private Dataset:** Deeply serialize completed episodes and push the JSON files (e.g. `episodes/ep_{id}.json`) to a private HF Dataset at the end of each session.
  - **Fetching "Previous Episode Summaries" at boot for continuity:** Fetch all recent episode summaries from HF during initialization and use semantic search to load relevant historical context for the upcoming scene.
- **Next Steps:**
  - [x] Integrate `cloud-dashboard-modal` for secure HF API token input.
  - [x] Serialize episodic contexts and upload via the HF inference API.
  - [x] Fetch past summaries using `fetchPreviousEpisodeSummaries` with TF-IDF similarity.
  - [x] Add Automerge/Yjs CRDT multi-device conflict resolution inside MemoryManager.
  - [x] Expose public Hugging Face episode script datasets in the app UI for browsing.
  - [ ] Implement periodic auto-sync of local deltas to HF dataset to ensure real-time consistency.

## Mode PR template (short)

```markdown
- Premise one-liner:
- Agent roles:
- Why funnier than freeform improv:
- Callback opportunities:
- Token budget notes (short/long):
```

Full table + maintainer close blurb: [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md).
