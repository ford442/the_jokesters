# Configurable Context Depth

The Jokesters controls how much conversation history agents see via a **message-count soft limit** (4–30 messages), layered on top of the existing **token-budget** truncation in `DynamicContextManager`.

## Controls

| Control | Where | Behavior |
|---------|-------|----------|
| **Memory Depth slider** | In-app settings panel | User preference, persisted in `localStorage` (`jokesters-memory-depth`). Changes take effect on the **next turn** mid-session. |
| **Scene `contextDepth`** | `Scenario.config.contextDepth` | Overrides slider for Director-driven scenes. Falls back to per-category defaults when omitted. |
| **Director `memoryHint`** | `getDirectorCritique()` | One-turn override: `zoom_in`, `zoom_out`, or `recall:TOPIC`. |

## Default depth by mode category

| Category | Default messages | Rationale |
|----------|------------------|-----------|
| `improv` | 15 | Balanced back-and-forth |
| `performance` | 18 | Longer arcs, callbacks (roast, story, debate) |
| `interactive` | 12 | Focused exchanges (trial, trivia, tech support) |
| `media` | 10 | Immediate reaction to video/vision |
| `reporter` | 14 | Segment context without bloat |
| `creative` | 16 | Mystery/pitch/procedural threads |
| `dream` | 12 | Surreal beats, less continuity needed |

Director critique uses ~40% of the effective depth (minimum 4 messages).

## Memory hints

- **`zoom_in`** — halves effective depth (min 4) for tight focus on the latest exchange.
- **`zoom_out`** — multiplies depth by 1.5× (max 30) for broader context.
- **`recall:TOPIC`** — zooms out and pulls up to two older messages whose text matches `TOPIC`.

Hints are parsed from an optional `MEMORY:` line in the Director critique response and apply to **one agent turn only**.

## Implementation

- `src/config/contextDepth.ts` — constants, category defaults, localStorage, hint parsing.
- `GroupChatManager.prepareHistoryForContext()` — message-depth slice before token truncation.
- `GroupChatManager.getDirectorCritique()` — returns `{ instruction, status, memoryHint }`.
- Status bar — `Depth: used/limit msgs` plus token usage from `ContextWindowInfo`.

## Example scene config

```typescript
const scenario: Scenario = {
  type: 'roast',
  title: 'Tech Roast',
  description: 'Agents destroy a startup pitch.',
  config: {
    contextDepth: 10, // short, punchy sketch
    roastTarget: 'NFT lunchbox',
  },
};
```
