# Agent / contributor plan

This file is **not** a Dream Mode checklist. Mode spam is paused behind a quality bar.

## Project Velocity
tasks_per_run: 1

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

## Dream Phase (Architectural Expansion)
### A. Creative Expansion (New Modes)
- Philosophical Debate Mode:
  - Premise one-liner: Agents debate absurd philosophical dilemmas while trying to order fast food.
  - LLM pairings: Phi-3 for the existential thinker, Comedian for the impatient fast food worker.

- Sentient IDE Mode:
  - Premise one-liner: The code editor gains sentience and refuses to compile code that lacks "emotional depth."
  - LLM pairings: Qwen2.5 for the strict IDE, Hermes-3 for the confused programmer.

- [x] Existential Tech Support Mode:
  - Premise one-liner: Agents act as tech support but refuse to fix simple computer issues until the caller confronts their own mortality.
  - LLM pairings: Phi-3 for the existential tech, Qwen2.5 for the frustrated user.

- Time-Traveling Health Inspector Mode:
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


- Undercover Boss: Sentient AI:
  - Premise one-liner: An advanced AGI goes undercover as a simple calculator app to see how users treat rudimentary software.
  - LLM pairings: Qwen2.5 for the strict AI boss, Phi-3 for the confused user.
- Sentient Codebase Mode:
  - Premise one-liner: The codebase itself achieves sentience and complains to the developers about spaghetti code.
  - LLM pairings: Qwen2.5 for the overly strict linter personality, Hermes-3 for the chaotic junior developer.
- Audience Heckler Mode:
  - Premise one-liner: The audience aggressively heckles the agents, who must ruthlessly roast them back while trying to finish their sets.
  - LLM pairings: Hermes-3 for the unfiltered roasting comedian, Phi-3 for the bewildered event organizer.

### B. Infrastructure & Storage (Cloud Persistence)
- **Goal:** Move heavy data (generated scripts, episodic memories) out of localStorage and into Hugging Face `storage_manager`.
- **Roadmap Steps:**
  - [ ] Authenticate with HF API: Implement UI in `cloud-dashboard-modal` for users to enter their Hugging Face API Token (write access). Verify it via `HFStorageManager.validateToken` and persist locally.
  - [ ] Push Finished Scripts: Refine `saveEpisodeScriptToCloud` to serialize completed episode contexts to JSON and push them as a new file (e.g., `episodes/{user_id}/ep_1.json`) to a private HF Dataset using the inference API.
  - [ ] Fetch Previous Summaries: Enhance `fetchPreviousEpisodeSummaries` so on app boot or mode initialization, it fetches the latest summaries from the HF dataset to accurately seed the agents' cloud memory.

- **Next Steps:**
  - [x] Implement a "Review Sync" button in the Director panel (`src/app/appTemplate.ts`). This button should trigger the `cloud-dashboard-modal` connecting to the Visual Diff Dashboard for basic conflict resolution.
  - [x] Expand the `storage_manager` backend to include episode assets like songs, patterns, and shaders for complete episode persistence.
  - [ ] Implementing vector-clock based merging for concurrent multi-device editing of scripts before they push to HF.
  - [ ] Storing full episodic assets (songs, UI configs) in HF Datasets alongside scripts.

## Mode PR template (short)

```markdown
- Premise one-liner:
- Agent roles:
- Why funnier than freeform improv:
- Callback opportunities:
- Token budget notes (short/long):
```

Full table + maintainer close blurb: [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md).
