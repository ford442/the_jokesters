# Contributing to The Jokesters

Thank you for contributing. This project is a **browser TypeScript** multi-agent comedy show. Product value is show feel (load, latency, comedy engines, avatars)—not an unbounded catalog of dream modes.

## Quick start for code

```bash
npm ci
npm run typecheck   # must be clean
npm test
npm run dev
```

See [CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md) for architecture.

## P0: New Director modes — quality bar

**Until foundation milestones land, new modes must meet a quality bar.**  
Low-effort “sentient X / multiverse Y” PRs may be closed with a link to:

### → [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md)

Summary:

1. **Mode Registry** — registered (`MODE_REGISTRY` / `registryEntries`), not a lone function in a god-file  
2. **`ModeContext` + comedy hooks** — support callbacks/quality via shared helpers when appropriate  
3. **Metadata** — title, short description, tags, **estimated turn length**  
4. **Documented twist** — not a duplicate premise without differentiation in the PR  
5. **Prefer quality over quantity** — improve one existing mode’s humor over adding three new ones  

### PR template for modes

Copy from [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md#pr-template-copy-into-the-pr-body):

- Premise one-liner  
- Agent roles  
- Why funnier than freeform improv  
- Callback opportunities  
- Token budget notes (short/long)  

## What to work on instead (foundation)

Prefer PRs that touch:

| Track | Examples |
|-------|----------|
| Onboarding / load | Guided model picker, OOM path, blessed presets |
| Show feel | Prerender coordinator, TTS/SFX, avatar acting |
| Comedy engines | Wire more modes through `ComedySession` / helpers |
| Registry / tests | `validateRegistry`, unit tests, typecheck CI |
| Docs drift | AGENTS/README accuracy (not mode checklists) |

Strategic backlog: [docs/ROADMAP.md](./docs/ROADMAP.md), [docs/plan.md](./docs/plan.md).  
Process / foundation focus: [agent_plan.md](./agent_plan.md).

## Native / C++

Do **not** thrash TVM/Emscripten/llama.cpp without metrics. See [docs/adr/0001-native-cpp-boundary.md](./docs/adr/0001-native-cpp-boundary.md).

## Code standards

- TypeScript `strict` on; keep `npm run typecheck` green  
- Prefer small PRs with a clear problem statement  
- No committed secrets (deploy via `scripts/deploy_dist.py` + env)  

## License

By contributing, you agree your contributions are under the project’s MIT license.
