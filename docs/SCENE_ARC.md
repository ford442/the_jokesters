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

## Production card (dramatic layer)

`src/Director/productionCard.ts` sits on top of the arc: one `ProductionCard` per scene holds the
episode beat (`cold_open` → `main` → `tag`), pre-defined relationships, secret objectives and an
optional guest NPC. Director owns it next to `SceneArcState`, advances it in `recordSceneBeat`, and
modes reach it via `ModeContext.production` (`setTurnBudget`, `ensureRelationships`, `getBeat`).

- Timing comes from the turn budget: open-ended → no beats; < 10 turns → 1-turn tag only;
  ≥ 10 → 1-turn cold open + 1-turn tag. Beat changes post a Director message.
- Entering the tag beat forces the arc into `close`, so `getArcPromptInjection()` returns the
  close-act callback instruction and the tag's hidden note includes it too.
- All card text is compiled per agent by `compileProductionInstruction` (`productionPrompt.ts`) and
  sent as `hiddenInstruction` (system prompt only) — never appended to the visible prompt/history, so
  subtext relationships and secrets stay out of the transcript and episode turns.
- Exported as `sceneState.production` (`PRODUCTION_SCHEMA_VERSION`, additive like `sceneArc`);
  `parseProductionSnapshot` validates it on import. v2 adds statuses, arcs, genre shift and the guest
  persona/voice/exit fields; v1 snapshots still load with those fields empty.

### Status, emotional arc, genre shift

All three compile into `hiddenInstruction` lines in `compileProductionInstruction`; none has a second prompt path.

- **Status** (`statuses`): `high` is told to grant permission and interrupt, `low` to hedge and appeal,
  `peer` to trade evenly. An optional target names who it is relative to; that agent reads the mirror
  image unless they have their own entry. Public vs subtext reuses the relationship flag.
- **Emotional arc** (`arcs`): `start` / `mid` / `end` map to the scene act `open` / `middle` / `close`
  from `sceneArc.ts` — a lookup, never an LLM judge. When the label is a clip the actors already play
  (`angry`, or a synonym such as `confused` → `think`), a `[clip]` tag goes through `onReactToText` on the
  first spoken sentence; a tag the line carries itself wins.
- **Genre shift** (`genreShift`: `genre` + `atTurn`): one adaptation line from that turn on, and one
  `act_break` show cue when it flips (a cold-open / tag cue on the same turn wins; arc memory is never
  reset). Modes call `ctx.production.setGenreShift(genre, atTurn)`; a future audience vote writes the same field.

### Guest as a sixth speaker

A `guestNpc` with a `persona` is a real speaker; without one it is the original costume (`voiceAgentId`
lends voice and turns, unchanged). A persona guest has an optional Supertonic `voiceStyle`
(M1/M2/F1/F2 — no new voice model) and `exitsAfterTurn`.

- While on stage the guest takes the floor on their entrance and every third turn after
  (`GUEST_TURN_INTERVAL`) in `Director.processTurn`, via `GroupChatManager.chatForAgent('guest')`. The
  guest lives in `ConversationStore` beside, never inside, the five-agent array: the rotation index does
  not move for their turns and nothing is left behind on exit or scene stop.
- The persona travels in the per-turn production note (the writers'-room shared prefix must not change
  mid-scene), so it reaches the model under both prompt layouts.
- The stage seats a capsule actor (`Stage.addGuestActor`) only while the guest is on stage, and the voice
  override is set / cleared with it (`DirectorCallbacks.onGuestEnter` / `onGuestExit`).
- Guest lines are tagged `Message.guestId` so episode export attributes them explicitly; every other
  line is attributed by rotation exactly as before. Replay re-applies the recorded voice and seat.
- Modes that pick speakers themselves (`chatForAgentWithComedy`) never give the guest a turn; the regulars
  still react to them while on stage.

## Out of scope (for now)

`GroupChatManager.getDirectorCritique()` ("Silent Coach") remains scoped to the legacy classic
improv quick-start path (`src/app/improvController.ts`) and is not wired into Director-mediated
modes here — that would be a separate, larger scope expansion. `applyArcMemoryHint` is the seam
a future critique mechanism can use to drive act transitions without further Director changes.
