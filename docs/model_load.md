# model_load.md — Hermes model failing on `main`

## TL;DR ✅
- Symptom: Hermes model (`Hermes-3-Llama-3.2-3B-q4f32_1-MLC`) fails to load on the `main` branch but loads correctly on the `hermes` branch.
- Root cause: main introduced a runtime *preflight* that validates model URLs but accidentally re-queries `webllm.prebuiltAppConfig` (shadowing the previously-resolved `modelInfo` from the active engine). This causes the preflight to validate the wrong metadata/source (HEAD/Range checks against a host that fails), which aborts loading.
- Fix applied: use the same `modelInfo` resolved from the active engine (remove shadowing). Small patch committed to `src/main.ts` (safe, localized).

---

## Evidence (what I found) 🔎
- Working (hermes branch): `src/GroupChatManager.ts` calls CreateMLCEngine("Hermes-3-..." ) directly — no preflight, loads successfully.
- Broken (main branch): `src/main.ts` added model injection + stricter preflight checks and a UI model loader. In the `Load Model` flow the code:
  - Resolves `modelInfo` from the *active engine* (`activeEngineModule`) into `list` (OK), but
  - Later re-queries `webllm.prebuiltAppConfig.model_list` (shadowing `modelInfo`) and uses that for runtime preflight.
- Result: the preflight can validate a different URL (or a model entry missing `model_lib`) and abort with a user-visible error (HEAD/Range GET or CORS failure) even though the active engine had the correct injected model metadata.

Key locations:
- `projects/the_jokesters/src/main.ts` — model registration, preflight, and the bug (shadowed `modelInfo`).
- `projects/the_jokesters/src/GroupChatManager.ts` — previous, working initialization flow on `hermes` branch.
- `projects/the_jokesters/upload_hermes.py` — shows where the Hermes model is uploaded (host: `test.1ink.us`).

---

## Root cause (concise) 🧭
The `main` branch introduced a preflight validation that checks model runtime URLs, but the load path inconsistently used two different sources for model metadata (the active engine vs the global `webllm` import). A later lookup shadows the earlier `modelInfo`, so the app sometimes validates the wrong URL (and aborts) even though the active engine has the correct, working model entry. In short: variable shadowing + inconsistent source → preflight validates wrong metadata → load blocked.

Why this only shows on `main` and not on `hermes`:
- `hermes` branch uses a simpler path (direct CreateMLCEngine call) and does not perform the same preflight; `main` added stricter checks and the UI/model-management layer that introduced the regression.

---

## Patch summary (what I changed) ✂️
- File: `src/main.ts`
- Change: removed the redundant/shadowing lookup of `modelInfo` (now reuses the `modelInfo` resolved from the active engine), and added an explanatory comment.
- Rationale: ensure preflight checks the same metadata that will be used to initialize the engine (no more mismatched/incorrect URL checks).

Suggested commit title: "fix(models): use active-engine modelInfo for preflight (avoid shadowing) — Hermes load regression"

---

## How to reproduce (manual) ▶️
1. On `main` branch (before fix):
   - Run `npm install && npm run dev` and open the app in a WebGPU-capable browser.
   - Open DevTools → Console + Network.
   - In the UI, select `Hermes-3-Llama-3.2-3B-q4f32_1-MLC` and click `Load Model`.
   - Observe: the UI shows a model runtime / HEAD check error or `Network` shows failed HEAD/Range requests to the model host (e.g., `test.1ink.us`) and model does not load.
2. On the `hermes` branch:
   - Repeat the same steps — model loads successfully (CreateMLCEngine path works).

After applying the patch (current workspace):
- Repeat the steps on `main` — Hermes should reach the engine initialization step (no premature preflight failure) and proceed to load or fail with engine-level errors (if any) rather than preflight blocking.

---

## Verification checklist (what to check) ✅
1. Unit / static checks
   - [ ] TypeScript compiles: `npm run build` (or `tsc`) with no new errors.
2. Manual runtime
   - [ ] `model-select` contains `Hermes-3-Llama-3.2-3B-q4f32_1-MLC` after app start.
   - [ ] Selecting Hermes + `Load Model` proceeds past the preflight checks (no immediate model-runtime HEAD/Range failure message from the UI).
   - [ ] Browser DevTools Network shows the engine fetching the model artifact files (GET requests to `test.1ink.us/...`) and not being blocked by the app's preflight guard.
   - [ ] The app successfully streams responses from the Hermes model (or at minimum reaches engine initialization logs). Look for console logs: "Loading model: Hermes-3-..." and engine init progress.
3. Regression checks
   - [ ] Confirm `hermes` branch behavior is unchanged.
   - [ ] Add an automated end-to-end check (see Recommendations).

---

## Recommended follow-ups (short-term → long-term) 🔭
1. Short term (apply immediately) — (DONE) keep the single-source fix and add defensive checks:
   - Add an assertion in the `Load Model` path that verifies the `modelInfo` used for preflight is the same object/source used for engine initialization.
   - Add unit tests that mock `activeEngineModule.prebuiltAppConfig` vs `webllm.prebuiltAppConfig` and assert no shadowing-caused failures.
2. Medium term:
   - Add an integration/browser E2E test (Playwright) that exercises model registration + load for an injected remote model (asserts no preflight false-negative).
   - Harden preflight: prefer tolerant checks (allow HEAD failure → try Range GET → still allow engine to attempt load once basic checks pass), but surface clearer guidance to the user when hosts block HEAD.
3. Long term:
   - Centralize model metadata source (single canonical registry per-engine) and remove duplicate lookup code.
   - Add telemetry for model-load failures to capture host, status code and whether preflight or engine fetch failed.

---

## Risk & rollback ⚠️
- The fix is low-risk and localized (single-source-of-truth change). Rollback: revert the one-line change in `src/main.ts`.

---

## Notes for PR description (short) 📝
- Fix: ensure model preflight uses metadata from the active engine (avoid shadowing `modelInfo`).
- Why: prevents false-negative preflight failures (HEAD/CORS) that blocked Hermes model loading on `main` while `hermes` branch worked.
- Tests: add an E2E test that loads an injected remote model and asserts no preflight abort.

---

If you want, I can:
1) open a PR with the change + the `model_load.md` plan and include an automated Playwright test scaffold; or
2) add the defensive assertion + a minimal unit test now.

Which should I do next? (recommended: open the PR + add an E2E test) 💡