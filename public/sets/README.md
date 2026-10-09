# Stage kits

Static glTF binary sets for the Three.js stage. They are served from `public/sets/`
(Vite copies `public/` as-is) and are **not** imported into the JS bundle.

| File | Kit id | Used by |
|------|--------|---------|
| *(none)* | `void` | Improv and any mode without `stageKit` |
| `talkshow.glb` | `talkshow` | Talk Show |
| `news.glb` | `news` | News Desk, Newsroom, Reporter |
| `court.glb` | `court` | Trial |

Regenerate:

```bash
node scripts/build-stage-kits.mjs
```

Urls are built only from the whitelist in `src/visuals/stageKitIds.ts`.
See `docs/RENDERING.md`.
