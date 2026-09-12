# Foundation next — audit snapshot (2026-08)

Strategic takeaway: **build load / VRAM / download foundation before more content.** Mode quality bar stays P0 process; Vicuna reliability is the product-blocking P0.

## JS / TS / C++

| Layer | Verdict |
|-------|---------|
| Comedy, Director, modes, UI | Stay TypeScript (`src/`) |
| MLC `model_lib`, wllama, ORT | Prebuilt WASM only |
| Custom Vicuna small-ctx compile | Allowed via `scripts/build-vicuna-wasm.sh` + CI — see [ADR 0001](./adr/0001-native-cpp-boundary.md) |
| Private llama.cpp / TVM forks | Not yet — metrics gate in ADR; start from [#119](https://github.com/ford442/the_jokesters/issues/119) only after `npm run verify:wllama` |

## Compile & context creation

- **JS overrides** (`dynamicContext.ts`): `context_window_size`, `prefill_chunk_size`, sliding window, KV quant, OOM halving — cannot shrink **peak** CreateMLCEngine allocation on a ctx4k `model_lib`.
- **Baked WASM**: ctx512/1024 Vicuna libs registered in `models.ts` but **not hosted** (HEAD 404 as of audit) → silent fallback to Llama-2 ctx4k lib.
- **Conversation depth**: `contextDepth.ts` / Memory Depth slider — orthogonal to KV plan; keep coupled via `clampContextToCompiledMax`.

## Org / debt (non-blocking but real)

- Oversized: `DreamModes_Sentient.ts` ([#290](https://github.com/ford442/the_jokesters/issues/290)) — `registryCatalog.ts` ([#289](https://github.com/ford442/the_jokesters/issues/289)) resolved by splitting into `registryCatalog.partN.ts` partitions behind a thin barrel
- `ParallelDownloadManager` mostly unused; SW owns parallel Range downloads
- Doc drift: `PARALLEL_DOWNLOADS.md`, blessed vs `getRecommendedModel` thresholds

## Filed issues (work order)

| # | Title | Priority |
|---|-------|----------|
| [#302](https://github.com/ford442/the_jokesters/issues/302) | Dual-domain striped chunk downloads | P0 load |
| [#303](https://github.com/ford442/the_jokesters/issues/303) | Paid CDN / object storage evaluation | P0 load |
| [#304](https://github.com/ford442/the_jokesters/issues/304) | HF-dedicated Vicuna + multi-source failover | P0 load |
| [#305](https://github.com/ford442/the_jokesters/issues/305) | Ship ctx512/1024 wasm; stop silent high-VRAM fallback | P1 VRAM |
| [#306](https://github.com/ford442/the_jokesters/issues/306) | Unify download stack + load diagnostics | P1 foundation |
| [#307](https://github.com/ford442/the_jokesters/issues/307) | Local party-mode live show MVP | P3 vision (gated) |

## Later vision (after gates)

Live digital comedy show: local votes + human slot → then PartyKit/Durable Objects/LiveKit for multi-device rooms, OBS overlays, Twitch — [LIVE_SHOW_VISION.md](./LIVE_SHOW_VISION.md).
