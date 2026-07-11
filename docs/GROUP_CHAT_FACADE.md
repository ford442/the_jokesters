# GroupChatManager facade

**Priority:** P1 — Foundation (pairs with app bootstrap split).

`GroupChatManager` is the **Director-facing facade** for LLM chat. Implementation is split into focused modules; the facade keeps the stable public API.

---

## Module map

| Module | Responsibility |
|--------|----------------|
| `src/chat/ConversationStore.ts` | History, agent rotation, memory depth, depth slice + token truncate prep |
| `src/chat/ModelSession.ts` | Engine init/terminate, loaded model id, context budget, interrupt |
| `src/chat/PersonalityStore.ts` | Structured evolution adjustments (bounded list, not unbounded string append) |
| `src/chat/chatErrors.ts` | `categorizeChatError()` — GPU/network/OOM classification |
| `src/llm/LLMEngine.ts` | Contract: `interrupt()`, `getContextWindowSize()`, `getLoadedModelId()` |

---

## Director / ModeContext API (stable)

These methods are safe for `Director`, `ModeContext`, and UI controllers:

| Method | Purpose |
|--------|---------|
| `initialize(onProgress?, modelId?, context?, engine?)` | Load model; reconciles history to new context budget |
| `terminate()` | Unload engine (used by `AgentModelManager` hot-swap) |
| `chat(userMessage, onSentence?, opts?)` | Round-robin agent turn + streaming sentences |
| `chatForAgent(agentId, prompt, onSentence?, opts?)` | Pin speaker without advancing rotation permanently |
| `interrupt()` | Abort in-flight generation (all engines) |
| `getLoadedModelId()` | Current weights id |
| `getContextManager()` / `getContextWindowInfo()` | Token budget + last truncation stats |
| `setMemoryDepth` / `setSceneMemoryDepth` / `applyMemoryHint` | Message-depth controls |
| `resetConversation()` / `getHistory()` / `addToHistory()` | Episode + prerender sync |
| `prerenderTurns(...)` | Background LLM batch (restores history after) |
| `getDirectorCritique()` | Silent coach |
| `evolvePersonality(agentId, feedback)` | Thumbs up/down adjustments |
| `getErrorCategory(error)` | Static alias → `categorizeChatError` |

---

## Hot-swap (`AgentModelManager`)

1. `terminate()` clears the session.
2. `initialize(...)` loads the new model.
3. `ConversationStore.reconcileHistoryAfterContextChange()` trims stored messages to fit the **new** `getContextWindowSize()`.

This keeps message-depth and token budget aligned after swap.

---

## LLM engine contract

All adapters implement:

- **`interrupt()`** — idempotent, must not throw; in-flight `chat()` streams end cleanly.
- **`getContextWindowSize()`** — tokens available after load (user override applied in `ModelSession`).

Tests: `tests/unit/groupChatFacade.test.ts`, `tests/unit/errorCategory.test.ts`.

---

## Related

- Multi-engine: `src/llm/EngineFactory.ts`
- Token truncation: `src/utils/dynamicContext.ts` (`DynamicContextManager`)
- Roadmap: [docs/ROADMAP.md](./ROADMAP.md) · Foundation: [agent_plan.md](../agent_plan.md)
