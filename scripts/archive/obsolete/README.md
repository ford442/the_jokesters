# Obsolete one-off patch scripts — DO NOT RUN

These seven `patch_*.py` files are ad-hoc regex patchers that were written to
apply one specific edit, once, to one specific source file, at a point in the
repo's history that has long since passed. They were previously sitting loose at
the repo root.

**Do not run any of them.** They read and write source files by hardcoded path
and match on source text that no longer exists in the shapes they expect. Their
main target, `src/utils/dynamicContext.ts`, was split in #345 into
`src/utils/contextBudget.ts`, `src/utils/vramOverrides.ts`,
`src/llm/mlcEngineCreate.ts` and `src/config/loadFailover.ts`, so a regex that
still matches will now edit the wrong file or silently corrupt it.

They are kept here only as a record of past mechanical edits. Nothing in the
build, `package.json`, CI, or `scripts/` invokes them. If you need a similar
migration, write a new script under `scripts/` instead.
