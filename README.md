# The Jokesters

A **browser-based multi-agent comedy show**: five AI personas improvise in real time with WebGPU
(or WASM) LLMs, Supertonic TTS + lip-sync, and Three.js avatars.

**Live demo (if deployed):** see project hosting notes — models stream from `storage.1ink.us`.

## Features

- **5 agents** — Comedian, Philosopher, Scientist, Chad Vanderblock (Tech Bro), Unit-734 (Robot)
- **Multi-engine LLMs** — MLC WebLLM (WebGPU), llama.cpp WASM (GGUF), Transformers.js (ONNX), optional API
- **100+ Director modes** — improv, roast, debate, reporter, dream modes, and more
- **Guided model load** — GPU probe, blessed presets (3–5), download size estimate, remember last success
- **TTS + SFX** — Supertonic ONNX voices, whitelisted stage SFX (`[sfx:rimshot]`)
- **3D stage** — lip-sync, idle/think/reaction poses, audience reactions
- **Episode export** — `.jokesters.json` + Markdown; TTS-only replay
- **PWA** — service worker via `vite-plugin-pwa` + parallel model download chunks

## Prerequisites

- Node.js 18+
- Browser with WebGPU preferred (Chrome/Edge 113+); llama.cpp preset works without it
- ~2 GB+ free GPU memory for 3B models; ~4 GB for Vicuna 7B

## Quick start

```bash
npm ci
npm run dev
```

Open `http://localhost:5173/`. The launch screen probes your GPU and recommends a model **before** download.

```bash
npm run typecheck   # required before commit
npm test
npm run build
npm run preview
```

## Architecture (short)

| Piece | Role |
|-------|------|
| `GroupChatManager` | LLM turns, history, `prerenderTurns` |
| `Director` + `modes/registry` | Mode dispatch (Centralized Director / Stateless Actors) |
| `EngineFactory` | MLC → Transformers → llama.cpp → API |
| `PrerenderCoordinator` | Adaptive LLM+TTS prerender for show feel |
| `VPS_STORAGE_URL` | Canonical model CDN (`src/utils/vpsStorageUrl.ts`) |

Full agent docs: **[AGENTS.md](./AGENTS.md)**. Contributor quickstart: **[CLAUDE.md](./CLAUDE.md)**.

## Model hosting

Default CDN: **`https://storage.1ink.us/models`**.

Override at build time:

```bash
# .env.local
VITE_VPS_STORAGE_ORIGIN=https://storage.1ink.us
```

Mirror hostname `storage.noahcohn.com` may appear in ops scripts / SW failover — **app code should use `VPS_STORAGE_*` constants**, not hardcode either host in new code.

## Deployment

```bash
export DEPLOY_USER=...
export DEPLOY_KEY=~/.ssh/id_ed25519
npm run deploy:dry    # preview remote actions
npm run deploy        # build + SFTP upload
```

- **Never commit SFTP passwords or keys** (script rejects `CHANGEME` placeholders).
- Key auth preferred; password fallback optional. Optional CI: Actions **Deploy dist**.
- Static hosting: `base: './'` in Vite; ship `dist/` plus runtime model CDN access.
- Checklist: [docs/DEPLOY_CHECKLIST.md](./docs/DEPLOY_CHECKLIST.md)
- Scripts inventory: [scripts/README.md](./scripts/README.md)

## Roadmap

Product plans live in [docs/ROADMAP.md](./docs/ROADMAP.md) and [docs/plan.md](./docs/plan.md).  
`agent_plan.md` is intentionally a short pointer — not a mode checklist.

## License

MIT
