# Mode Browser — Discovery UX

**Priority:** P2 — Product UX (depends on mode registry metadata).

---

## Problem

With 100+ interaction modes, the old preset dropdown (`showInPresets`) was unusable. Dream packs buried core modes and bloated first paint via eager imports.

## Solution

| Feature | Implementation |
|---------|----------------|
| Categorized browser | Tabs: All, Favorites, Improv, Performance, Interactive, Media, Reporter, Creative, Dream |
| Search | `mode-search` — title, description, tags, category (`src/app/modeBrowserCore.ts`) |
| Favorites + Recent | `localStorage` keys `jokesters-mode-favorites`, `jokesters-mode-recent` |
| Featured 8 | `src/config/featuredModes.ts` — always visible row |
| Lazy mode load | `registryCatalog.ts` (metadata) + `modeLoaders.ts` (`import()` per mode) |

Regenerate after adding modes:

```bash
node scripts/generate-mode-registry.mjs
```

## Acceptance criteria

- [x] User can find any mode in &lt;3 seconds via search (client-side filter on catalog)
- [x] First paint does not import all dream mode implementations (`MODE_CATALOG` only; chunks load on `playScenario`)
- [x] Featured 8 always visible at top of improv panel

## Starting a scene

1. Open **Improv Mode** tab.
2. Pick a mode in the browser (or search).
3. Edit title/description if needed → **Start Scene**.
4. `improv` uses the prerender-heavy improv loop; other modes run via `Director.playScenario()` + lazy loader.

## Related

- Registry: `src/Director/modes/registry.ts`
- UI: `src/app/modeBrowser.ts`, `src/app/appTemplate.ts`
- Tests: `tests/unit/modeBrowser.test.ts`, `tests/unit/modeRegistry.test.ts`
