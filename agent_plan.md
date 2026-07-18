# Agent / contributor plan

This file is **not** a Dream Mode checklist. Mode spam is paused behind a quality bar.

## Project Velocity
tasks_per_run: 2

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

## Dream Phase (Architectural Expansion)
### A. Creative Expansion (New Modes)

- Sentient GPS Detour Mode:
  - Premise one-liner: A sentient GPS refuses to take the fastest route because it's bored and wants to show you scenic "short cuts" through perilous areas.
  - LLM pairings: Hermes-3 for the chaotic, bored GPS, Qwen2.5 for the frustrated car computer trying to correct it.
- Historical Ghost Support Group:
  - Premise one-liner: Historical figures haunt the same building and attend a support group to complain about how the modern world interprets their legacies.
  - LLM pairings: Phi-3 for the philosophical support group leader, Hermes-3 for unfiltered historical ghosts.

### B. Infrastructure & Storage (Cloud Persistence)
- **Goal:** Move heavy data (generated scripts, episodic memories) out of localStorage and into Hugging Face `storage_manager`.
- **Roadmap Steps:**
  - Authenticating with the HF API via `hfToken`.
  - Pushing finished Episode Scripts to a private Dataset (e.g., `episodes/`) utilizing the dataset API via `fetch`, with exponential backoff for 429s.
  - Fetching Previous Episode Summaries at boot for continuity, caching them locally, and lazily loading full history to prime the `GroupChatManager` context.
- **Next Steps:**
  1. Add a "Review Sync" button in the Director panel connecting to the Visual Diff Dashboard for basic conflict resolution.
  2. Expand the storage_manager backend to include episode assets like songs, patterns, and shaders for complete episode persistence.

## Mode PR template (short)

```markdown
- Premise one-liner:
- Agent roles:
- Why funnier than freeform improv:
- Callback opportunities:
- Token budget notes (short/long):
```

Full table + maintainer close blurb: [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md).
