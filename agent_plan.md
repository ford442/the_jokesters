# Agent / contributor plan

This file is **not** a Dream Mode checklist. Mode spam is paused behind a quality bar.

## Project Velocity
tasks_per_run: 3

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
| **Comedy wiring** | More modes use `ModeContext.comedy` + `comedyModeHelpers` (callbacks, quality gate) |
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

## Dream Phase (Architectural Expansion)
### A. Creative Expansion (New Modes)

- Undercover Boss: Alien Invasion Edition:
  - Premise one-liner: An alien commander goes undercover as a low-level earthling to see how the invasion preparations are going.
  - LLM pairings: Qwen2.5 for the strict boss, Phi-3 for the oblivious human coworker.
- Time-Traveling Tour Guide:
  - Premise one-liner: A tour guide from the year 3000 shows tourists around the "primitive" year 2024.
  - LLM pairings: Hermes-3 for the smug tour guide, Qwen2.5 for the confused tourist.



- Sentient Codebase Mode:
  - Premise one-liner: The codebase itself achieves sentience and complains to the developers about spaghetti code.
  - LLM pairings: Qwen2.5 for the overly strict linter personality, Hermes-3 for the chaotic junior developer.
- Audience Heckler Mode:
  - Premise one-liner: The audience aggressively heckles the agents, who must ruthlessly roast them back while trying to finish their sets.
  - LLM pairings: Hermes-3 for the unfiltered roasting comedian, Phi-3 for the bewildered event organizer.

### B. Infrastructure & Storage (Cloud Persistence)
- **Goal:** Move heavy data (generated scripts, episodic memories) out of localStorage and into Hugging Face `storage_manager`.
- **Roadmap Steps:**
  - [x] Authenticating with the HF API via `hfToken`.
  - [x] Pushing finished Episode Scripts to a private Dataset (e.g., `episodes/`) utilizing the dataset API via `fetch`, with exponential backoff for 429s.
  - [x] Fetching Previous Episode Summaries at boot for continuity, caching them locally, and lazily loading full history to prime the `GroupChatManager` context.
  - [ ] Implement conflict resolution UI for local vs cloud versions of episode assets like songs/patterns/shaders.
- **Next Steps:**
  - [x] Implement a "Review Sync" button in the Director panel (`src/app/appTemplate.ts`). This button should trigger the `cloud-dashboard-modal` connecting to the Visual Diff Dashboard for basic conflict resolution.
  - [x] Expand the `storage_manager` backend to include episode assets like songs, patterns, and shaders for complete episode persistence.

## Mode PR template (short)

```markdown
- Premise one-liner:
- Agent roles:
- Why funnier than freeform improv:
- Callback opportunities:
- Token budget notes (short/long):
```

Full table + maintainer close blurb: [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md).
