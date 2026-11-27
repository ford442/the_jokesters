# Release build notes

## Build invariants

- Node.js is pinned in `.nvmrc`; `package.json` requires Node `>=22.12.0`.
- `VITE_APP_BASE_PATH` defaults to `/the-jokesters/` and sets Vite asset URLs, manifest start URL/scope, and the service-worker scope. Staging builds use `/the-jokesters-staging/`.
- VitePWA `injectManifest` is the only service-worker build. `npm run build` finalization requires exactly one stable `service-worker.js`, removes development-only public files and any precompressed `.br`/`.gz` files, then writes `dist/version.json`.
- The host is expected to compress responses dynamically. Precompressed twins are intentionally not shipped.
- The canonical deployment is SFTP through `scripts/deploy_dist.py`: it uploads all files, checks every remote SHA-256, then removes stale files. `deploy.py` only forwards to that script. The workflow is staging-only.

## Current audit and build warning disposition

`npm audit --omit=dev` reports five production-graph advisories: high findings through
`@huggingface/transformers@4.2.0`'s `onnxruntime-node@1.24.3` → `adm-zip@0.5.17` and `sharp@0.34.5`,
plus moderate `protobufjs@7.6.4` through `onnxruntime-web@1.26.0`. These Node-side package names
were checked against emitted `dist/assets/*.js`; none of their package code is included (the lone
`sharp` text match is in a comedy prompt). No dependency override is applied because the affected
Node packages are not used by the browser runtime. Recheck the audit and bundle on dependency
updates.

Vite's remaining build notices are upstream Zod v4 `@__PURE__` comment-position annotations; Rollup
strips the comments and continues. The remaining `>600 kB` chunk notice covers the lazily loaded
WebLLM/MLC worker and Three.js renderer chunks; the gzip and total-dist budgets remain the enforced
size guard. The optional `ComedyLogitProcessor` export warning is avoided by reflective lookup,
which preserves the runtime guard for the custom fork without a static missing-export reference.

`npm ci` currently also reports upstream deprecations for `mp4-muxer`, `boolean`, `source-map`,
`glob`, and ESLint; these do not prevent installation or the release build and should be handled in
dependency-maintenance work.
