# Scene Arc Tracking

Long improv scenes can drift: agents forget early beats and endings feel abrupt. Director
addresses this with a lightweight, on-device rolling summary of the scene — no remote
summarization APIs, no extra LLM calls.

## Core module

`src/Director/sceneArc.ts` is a pure, dependency-free module (no GPU/LLM access) so it can be
unit-tested directly with fixtures (`tests/unit/sceneArc.test.ts`).

```ts
interface SceneArcState {
  premise: string;
  beats: SceneBeat[];       // rolling window, capped at MAX_TRACKED_BEATS (12)
  runningGags: string[];    // themes that recurred >= 2x within the current window
  act: 'open' | 'middle' | 'close';
  turnCount: number;
  estimatedTurns: number | null;
}
```

- **`updateSceneArc(state, { agentId, text })`** — called after each turn's text is finalized.
  Produces a short heuristic summary (`summarizeBeat`, first-sentence-or-truncated), extracts
  themes via the existing comedy `extractThemes` heuristic (reused from `ComedySession.ts`, no
  new pattern set), and recomputes `runningGags` from the rolling beat window only — themes from
  beats that have scrolled out of the window stop counting as running gags.
- **`act`** is derived from `turnCount / estimatedTurns` (open below 25%, close at/after 75%).
  When a mode has no `estimatedTurns` budget, a small fixed heuristic (`open` for the first two
  turns, `middle` after) is used instead.
- **`advanceSceneAct`** — monotonic `open → middle → close` transition, idempotent at `close`.
  Exposed so external signals (e.g. a future Silent-Coach-style critique) can force an early act
  change via the `advance_act` memory hint (see below).
- **`buildArcPromptInjection`** — returns the prompt fragment to append for the current act:
  a recall of the premise + running gags in `open`/`middle`, or a "wrap it up, callback to X"
  instruction once `close` is reached.

## Wiring

Director owns one `SceneArcState` per scene (`playScenario` creates it from the scenario title
and `estimateSceneTurnBudget(modeDef)`; `stopScene` clears it). Two `ModeContext` fields expose it
to mode loops without leaking the class internals:

- `ctx.recordSceneBeat(agentId, text)` — heuristic update after a turn's text is finalized.
- `ctx.getArcPromptInjection()` — current act's prompt fragment, or `null`.

Both of Director's turn-taking paths call these:

- `Director.processTurn()` (the bare path used by `ImprovMode.ts` and heckler interrupts) injects
  the arc prompt alongside the existing comedy-callback injection, and records the beat alongside
  the existing `comedySession.handleAgentResponse` call.
- `chatForAgentWithComedy` / `withComedyPrompt` in `src/comedy/comedyModeHelpers.ts` — the path
  used by the majority of Dream/Expanded catalog modes — fold the arc injection into
  `withComedyPrompt` and record the beat once a response is finalized.
  (`processTurnWithComedy` calls `ctx.processTurn` internally, so it inherits the wiring above
  without duplicating it.)

## Memory hint integration

`MemoryHint` (`src/config/contextDepth.ts`) gained a new `advance_act` variant alongside
`zoom_in` / `zoom_out` / `recall:TOPIC`. It intentionally does not affect context-depth math
(`applyMemoryHint` treats it as a no-op depth change) — it's a signal channel for
`Director.applyArcMemoryHint(hint)` to force an early act transition, e.g. from a future
critique/heuristic trigger.

## Episode export

`stopScene()` includes a versioned snapshot in the episode's `sceneState.sceneArc` field:

```ts
interface EpisodeSceneArcSnapshot {
  version: 1; // SCENE_ARC_SCHEMA_VERSION, independent of EPISODE_FORMAT_VERSION
  premise: string;
  act: 'open' | 'middle' | 'close';
  turnCount: number;
  estimatedTurns: number | null;
  runningGags: string[];
  beats: { turnIndex: number; agentId: string; summary: string; themes: string[] }[];
}
```

It's versioned independently of `EPISODE_FORMAT_VERSION` since it's an additive, optional field —
`EpisodeSceneState` already has a free-form `[key: string]: unknown` bag and loose validation, so
no other export/validation changes were required.

## Out of scope (for now)

`GroupChatManager.getDirectorCritique()` ("Silent Coach") remains scoped to the legacy classic
improv quick-start path (`src/app/improvController.ts`) and is not wired into Director-mediated
modes here — that would be a separate, larger scope expansion. `applyArcMemoryHint` is the seam
a future critique mechanism can use to drive act transitions without further Director changes.
