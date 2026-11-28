# Real-GPU manual checklist

CI and the smoke harness run on software WebGL with no WebGPU adapter, so the primary
**WebGPU / MLC** path needs a human on real hardware before each release. Paste the filled
table into the release's "State of the App" report.

| Field | Value |
|---|---|
| Date | |
| Device / OS | |
| GPU (and driver) | |
| Browser + version | |
| URL + `version.json` SHA | |
| Preset | Hermes-3 3B (q4f16 or q4f32 — note which) |

| # | Step | Pass? | Notes / timings |
|---|---|---|---|
| 1 | Cold-load the URL; launch picker shows WebGPU, recommends a preset, no console errors | | |
| 2 | Select **Hermes-3 3B**, click **Load Model & Start** with the mouse | | load time: |
| 3 | Show screen at full opacity; Cast editor, Dashboard, SFX, music toggles respond to clicks | | |
| 4 | Send a chat message; a reply arrives | | first-reply time: |
| 5 | Voice is heard and mouths move (no "Voice offline" banner) | | voice-ready time: |
| 6 | Start a Director mode (Start Scene); at least three turns play | | mode: |
| 7 | Stop the scene; audio and turns stop within ~2 s | | |
| 8 | Start a scene again (restart after stop) — runs normally | | |
| 9 | Frame rate stays smooth during inference (no multi-second freezes) | | |
| 10 | DevTools console: zero errors (list any warnings) | | |
