# Live Digital Comedy Show — Vision

**Priority:** P3 — large addition. **Do not start audience/room work until foundation is solid.**

Foundation gates (work here first): [agent_plan.md](../agent_plan.md) · [MODE_QUALITY_BAR.md](./MODE_QUALITY_BAR.md)

---

## North star

Position **The Jokesters** as a **live digital comedy show**, not only a single-player toy.

| Pillar | Description |
|--------|-------------|
| **Audience mode** | Viewers vote mid-scene (topic, who speaks next, roast target) via share link or local second screen |
| **Multi-human** | One or more humans join as characters; AIs fill the rest; Director still orchestrates turns |
| **Crowd work** | Voice input + quality-gated AI responses to audience lines |
| **Laugh track / applause** | Driven by `QualityFilter` scores + audience votes |

**Architecture principle:** Keep core LLM inference on-device when possible; network only the social layer (votes, presence, room state).

---

## Technical building blocks (prerequisites)

| Block | Role | Status (repo) | Gap before live show |
|-------|------|---------------|----------------------|
| **Mode registry** | Stable mode IDs, metadata, `ModeContext` | ✅ `MODE_REGISTRY`, `validateRegistry` | Keep metadata complete; no orphan loops |
| **SceneState export** | Shareable / resumable session payload | 🟡 `EpisodeSceneState` + `.jokesters.json` export/replay | Live **session** export (in-progress scene, not just post-episode transcript); versioned schema for import across devices |
| **Reliable low-latency prerender** | No dead air between turns | ✅ `PrerenderCoordinator`, `adaptiveDepth` | Harden cancel/epoch edge cases; metrics-driven depth tuning under vote interrupts |
| **SFX** | Rimshot, applause, stings | ✅ `SfxManager`, `sfxTokens`, whitelisted catalog | Wire quality/vote signals → SFX triggers (see laugh track) |
| **Audience mesh reactions** | Visual crowd feedback | 🟡 `Stage.triggerAudienceReaction`, `audienceReaction` events | Tie to `QualityFilter` + votes, not keyword heuristics alone |
| **Signaling** | Multi-device rooms | ❌ Not started | Optional new dependency; **not required for MVP** |

Native compile / WASM policy unchanged: [ADR 0001](./adr/0001-native-cpp-boundary.md).

---

## MVP — no server (single machine / “party mode”)

One keyboard, one screen, or a second browser tab on the same LAN — **no hosted room codes yet**.

### Already partial

- **Pass the mic / human turn injection** — chat input → `GroupChatManager.chat()`; modes use `ctx.waitForInput()` (e.g. audience heckler loop in `PerformanceMode.ts`).
- **Director instructions** — `hiddenInstruction` on turns; Silent Coach critique path in improv.
- **Crowd work prototype** — heckler mode dispatches `audienceReaction` (cheer/groan) from simple keyword sentiment.
- **Episode capture** — export JSON/MD, TTS-only replay (`src/episode/`).

### MVP deliverables (when P3 opens)

1. **On-screen vote panel** — buttons inject Director instructions (topic, next speaker, roast target) without typing.
2. **Human slot in turn order** — explicit “your turn” state in Director; prerender pauses or drains safely when a human is queued.
3. **Local laugh/applause** — `rateJoke()` (or `ComedySession`) thresholds → `SfxManager` + `Stage.triggerAudienceReaction`.
4. **SceneState snapshot** — export/import in-progress scene (agents, mode, chaos, pending votes) as JSON alongside episode format.

**Out of scope for MVP:** room codes, WebRTC, Twitch, OBS layouts, cloud sync of live votes.

---

## Later (hosted / broadcast)

- Hosted room codes + lightweight signaling (WebSocket or WebRTC data channel)
- OBS browser source layout (vote overlay, lower thirds, speaker spotlight)
- Twitch extension or similar for remote audience votes
- Multi-human with distinct identities across devices

### Libraries to evaluate (social layer only)

| Option | Notes |
|--------|--------|
| [PartyKit](https://www.partykit.io/) | Durable rooms, good fit for vote fan-out |
| Cloudflare Durable Objects | Same class of problem; ops on CF stack |
| [LiveKit](https://livekit.io/) | Heavier; consider if voice/video humans matter |

Evaluate when MVP party mode proves the instruction/vote UX. Do not pull a signaling dependency until local vote injection is shippable.

---

## Relationship to existing roadmap

Older roadmap bullets (“audience simulation”, “audience voting”) are **superseded by this doc** for sequencing and scope. Implementation order:

1. Foundation (registry, comedy wiring, prerender, export, SFX) — **now**
2. MVP party mode (votes → Director, laugh track wiring) — **P3 entry**
3. Hosted rooms + broadcast overlays — **after MVP**

See also: [ROADMAP.md](./ROADMAP.md) (general backlog), [plan.md](./plan.md) (UI/mode ideas).

---

## Success criteria (MVP done)

- [ ] Two people at one machine: one runs scene, one taps votes; Director visibly steers within 1 turn.
- [ ] Human line via chat or mic appears in history and gets a quality-gated agent response in crowd-work modes.
- [ ] Strong joke (high `QualityFilter` score) triggers applause SFX + audience mesh cheer without manual keyword rules.
- [ ] Scene can be exported mid-show and resumed on replay import (session fields documented in schema).
