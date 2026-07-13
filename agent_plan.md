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
- [x] Add Talk Show Mode from Phase 1 of roadmap. Host interviews agents with pre-defined segments.
- [x] Add Courtroom Mode from Phase 1 of roadmap. Prosecutor vs Defense with absurd case.
- [x] Add Game Show Mode from Phase 1 of roadmap. Host asks trivia, agents compete hilariously.
- [x] Add News Desk Mode from Phase 1 of roadmap. Anchor reports breaking "news" with correspondent interviews.

## Dream Phase (Architectural Expansion)
### A. Creative Expansion (New Modes)

- Roast Battle Mode:
  - Premise one-liner: Agents ruthlessly roast the user and each other in a structured battle format.
  - Agent roles: Comedian as the primary roaster (use Hermes-3 for unfiltered roasting), Scientist as the literal joke analyzer, Philosopher as the existential despair bringer.
  - Why funnier than freeform improv: Structured back-and-forth raises the stakes and forces punchlines.
  - Callback opportunities: Referencing previous burns to create running jokes.
  - Token budget notes (short/long): Short, punchy punchlines.
- Musical Improv Mode:
  - Premise one-liner: Agents spontaneously create a terrible Broadway musical based on user prompts.
  - Agent roles: Scientist as the lyricist obsessed with rhyme schemes, Comedian as the diva lead singer, Philosopher as the depressed chorus.
  - Why funnier than freeform improv: Forces rhyming and musical structures onto absurd topics.
  - Callback opportunities: Recurring motifs and choruses.
  - Token budget notes (short/long): Medium, rhyming lyrics require careful generation.

- Collaborative Sandbox Construction Mode:
  - Premise one-liner: Agents try to build a sandbox game, but completely disagree on mechanics.
  - Agent roles: Scientist (optimization focused), Comedian (chaos focused), Philosopher (meaning focused). Pair with DeepSeek Coder for coding abilities.
  - Why funnier than freeform improv: Structured around actually writing pseudo-code snippets that clash.
  - Callback opportunities: Referencing bugs from previous turns.
  - Token budget notes (short/long): Long, due to code generation.
- Talk Show Mode:
  - Premise one-liner: A chaotic late-night talk show where the host tries to maintain order while guests derail the conversation.
  - Agent roles: Scientist as the logical host, Comedian and Philosopher as unhinged celebrity guests.
  - Why funnier than freeform improv: The strict segment structure (monologue, interview, musical guest) forces agents to adapt their chaotic behavior to formal constraints.
  - Callback opportunities: The host can reference terrible things that happened in previous segments.
  - Token budget notes (short/long): Short, punchy segments.

### B. Infrastructure & Storage (Cloud Persistence)
- **Goal:** Move heavy data (generated scripts, episodic memories) out of localStorage and into Hugging Face `storage_manager`.
- **Steps:**
  1. Authenticate with the HF API using `hfToken` from `MemoryManager`.
  2. Implement `saveEpisodeScriptToCloud(script, episodeId)` to push full dialogue transcripts to a private HF Dataset (e.g., `episodes/`).
  3. Implement `fetchPreviousEpisodeSummaries()` at boot in `MemoryManager` to retrieve past summaries from HF and prime the `GroupChatManager` context, bypassing localStorage limits.

## Mode PR template (short)

```markdown
- Premise one-liner:
- Agent roles:
- Why funnier than freeform improv:
- Callback opportunities:
- Token budget notes (short/long):
```

Full table + maintainer close blurb: [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md).
