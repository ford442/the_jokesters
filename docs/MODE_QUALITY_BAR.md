# Mode quality bar

**Status:** Enforced process (P0)  
**Purpose:** Stop low-effort “sentient X / multiverse Y” PR floods while foundation work lands.

Maintainers may **close** mode PRs that fail this checklist with a link to this file.

---

## When new modes are allowed

Prefer **improving one existing mode’s humor** over adding three new ones.

New modes are welcome only if they clear **all** of the following:

| # | Requirement | How to prove |
|---|-------------|--------------|
| 1 | **Registered via Mode Registry** | Entry in `MODE_REGISTRY` / `registryEntries` (use `scripts/generate-mode-registry.mjs` if that is the workflow). Id matches `Scenario.type`. |
| 2 | **Uses shared `ModeContext`** | Loop signature `(scenario, ctx: ModeContext) => …`. Prefer comedy helpers when jokes matter: `withComedyPrompt`, `processTurnWithComedy`, `chatForAgentWithComedy` (`src/comedy/comedyModeHelpers.ts`). Callbacks optional but **supported** (do not hardcode around a null `ctx.comedy` forever without reason). |
| 3 | **UI metadata** | Registry `title`, short `description`, `tags[]`, and **estimated turn length** (`estimatedTurns`: `'short' \| 'medium' \| 'long'` or a number). `showInPresets` only if it belongs in the preset dropdown. |
| 4 | **No premise clone** | PR documents how this differs from freeform improv **and** from nearest existing modes (search `MODE_REGISTRY` / mode files for similar titles). |
| 5 | **Humor over volume** | PR answers: why this is funnier than freeform improv; lists callback opportunities; notes token budget (short/long). |

### Explicit non-goals for mode PRs

- Drive-by dream modes with no registry entry  
- Copy-paste of an existing loop with only the premise string changed  
- Modes that bypass `ModeContext` / Director  
- Expanding god-files without splitting when the file is already huge  

### Foundation work takes priority

Until foundation milestones are healthy, mode spam is **out of scope**. See [agent_plan.md](../agent_plan.md) and:

| Area | Why it blocks more modes |
|------|---------------------------|
| Mode registry hygiene | Discovery, presets, validation (`validateRegistry`) |
| Comedy wiring | Callbacks / quality gate underused by modes |
| Main / app split | Onboarding, export, prerender, SFX — product core |
| Tests | Registry integrity, comedy units, no silent tsc debt |
| Context accuracy | VRAM / memory depth / guided load — show must start |

Related guardrails: [ADR 0001 native C++](./adr/0001-native-cpp-boundary.md), [ROADMAP.md](./ROADMAP.md).

---

## PR template (copy into the PR body)

```markdown
### Mode proposal

- **Premise (one-liner):**
- **Agent roles:**
- **Why funnier than freeform improv:**
- **Nearest existing modes / twist (not a duplicate):**
- **Callback opportunities:**
- **Token budget:** short / medium / long — notes:
- **Registry:** id=`…` category=`…` tags=`…` estimatedTurns=`…` showInPresets=`yes/no`
- **Comedy hooks:** uses ModeContext comedy helpers? yes/no — if no, why:
- **Test plan:** how you exercised the mode (or unit coverage)
```

---

## Maintainer close comment (copy-paste)

```text
Thanks for the idea. We're holding a quality bar on new Director modes while foundation work lands:
https://github.com/<org>/<repo>/blob/main/docs/MODE_QUALITY_BAR.md

Please either:
1) Improve an existing mode’s humor with the PR template filled in, or
2) Resubmit a new mode that meets the full checklist (registry, ModeContext/comedy, metadata, non-duplicate premise).

Closing for now — happy to reopen when the checklist is green.
```

(Replace the URL path with this repo’s actual blob URL.)
