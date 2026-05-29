# Vendored / Aliased web-llm

This directory is a placeholder for future thin re-export shims or type-only
entry points if we decide to move away from direct `import * as webllm from '@mlc-ai/web-llm'`
style imports.

## Current Recommended Consumption (see docs/webllm-customization-plan.md)

While actively developing customizations in the fork:

**Pattern A (fastest iteration)** — alias the submodule *source* directly:

```ts
// vite.config.ts
resolve: {
  alias: {
    '@mlc-ai/web-llm': path.resolve(__dirname, '../../3rd_party/web-llm/src/index.ts'),
  },
}
```

```jsonc
// tsconfig.json
"paths": {
  "@mlc-ai/web-llm": ["./3rd_party/web-llm/src/index.ts"],
  "@mlc-ai/web-llm/*": ["./3rd_party/web-llm/src/*"]
}
```

For reproducible builds / CI:

**Pattern B** — run `scripts/build-webllm.sh` first, then alias the generated artifacts:

```ts
'@mlc-ai/web-llm': path.resolve(__dirname, '../../3rd_party/web-llm-dist/lib/index.js'),
```

The build script also produces `BUILD_INFO.txt` for provenance.

## Why not just change the import paths everywhere?

We keep the canonical import name `@mlc-ai/web-llm` so that:
- Switching between "official npm" and "our fork" is a one-line alias change.
- The multi-engine architecture (`src/llm/MlcEngineAdapter.ts` etc.) stays clean.
- Future tree-shaken or feature-flagged builds remain drop-in replacements.

## When to put code in this directory

Only for very thin adapter / re-export layers that belong to *the_jokesters* rather than
the web-llm fork itself. Heavy customization belongs in the submodule (or in our existing
`MlcEngineAdapter` + `dynamicContext` wrappers).

## Related

- Full plan: `docs/webllm-customization-plan.md`
- Build entry point: `scripts/build-webllm.sh`
- Submodule source: `3rd_party/web-llm/`
- Generated artifacts (gitignored): `3rd_party/web-llm-dist/`
