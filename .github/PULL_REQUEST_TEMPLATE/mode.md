<!--
Use this template for PRs that add or heavily change a Director mode.
Delete this file's contents and use a normal PR description for non-mode work.
Full policy: docs/MODE_QUALITY_BAR.md
-->

## Mode proposal

- **Premise (one-liner):**
- **Agent roles:**
- **Why funnier than freeform improv:**
- **Nearest existing modes / twist (not a duplicate):**
- **Callback opportunities:**
- **Token budget:** short / medium / long — notes:

## Quality bar checklist

- [ ] Registered in `MODE_REGISTRY` / `registryEntries` (id matches `Scenario.type`)
- [ ] Loop uses `ModeContext`; comedy helpers supported if applicable
- [ ] Registry: `description`, `tags`, `estimatedTurns` set
- [ ] Documented why this is not a premise clone
- [ ] Prefer: improves an existing mode’s humor (link which) **or** justifies a new id

## Test plan

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] Manual: how you ran the mode (or N/A with reason)
