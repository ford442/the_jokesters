# Show production: avatars, music, clips, cast

How the stage looks and sounds, and how to share it. Four layers, each independent:

| Layer | Entry point | Notes |
|-------|-------------|-------|
| VRM avatars + lip-sync | `visuals/Stage.ts` → `VrmActor` | Capsule `Actor` stays as the low-tier fallback |
| Show music | `audio/ShowMusic.ts` | Settings → 🎵 Show music |
| Clip recorder | `recording/ClipRecorder.ts` | 🎬 Clip last 30 s |
| Cast editor | `cast/castEditor.ts` | Settings → 🎭 Cast editor |

## Avatars

### Hosting

Five bundled avatars are loaded from `${VPS_STORAGE_URL}/avatars/<agentId>.vrm`
(`comedian`, `philosopher`, `scientist`, `techBro`, `robot`). They are **not in this repo** —
upload them next to the TTS/model assets. `.vrm` is striped and cached by the service worker like other
model binaries (`service-worker.ts`, `dualDomainStripe.ts`). A missing file is not an error: that agent
keeps its capsule.

Recommended model spec: VRM 1.0 (VRM 0 is rotated automatically), CC0 or licensed for redistribution,
Meshopt-compressed geometry and/or KTX2 textures, ≲ 8 MB. Models are scaled to 1.7 m and stood on the
floor at load. Basis transcoder files for KTX2 are in `public/basis/` (from three's examples).

### Tier selection

`visuals/avatarTier.ts` decides VRM vs capsule: touch devices, ≤ 4 GB RAM, ≤ 4 cores, no WebGPU adapter,
or < 3.5 GB free VRAM (the guided-launch probe, cached in localStorage) keep capsules; without a probe it
falls back to the GL renderer string. Override with `?avatars=vrm|primitive` or
`localStorage['jokesters-avatars']`.

### Lip-sync pipeline

```
TTS worker (visemes, exact audio length) ┐
                                          ├→ SpeechQueue.onUtteranceStart → Stage.beginUtterance
legacy engine: text → visemeTiming.ts ───┘                                   │
                                                                      MouthDriver (mouth.ts)
loudness (LipSync analyser) ── fallback + silence gate ──────────────────────┘
                                                              │
                     VrmActor: aa/ih/ou/ee/oh   ·   Actor: mouth line width/height
```

Coarticulation: during the last 40 % of each viseme the mouth eases toward the next one. Bilabials
(m/b/p) close the lips; the loudness gate closes the mouth in pauses.
`visemeTiming.ts` is an orthographic approximation, not a forced aligner — durations are proportional
to phoneme weight and sum exactly to the audio length.

## Show music

`MusicEngine` → `DynamicsCompressor` → duck gain → level → master bus. The duck is a sidechain-style
envelope (`audio/ducking.ts`) driven by TTS loudness and utterance start/end; the user volume is scaled to a
0.4 ceiling, so music cannot sit above speech.

Cues (`audio/showCues.ts`): `cold_open` (production-card cold open), `act_break` (scene-arc act
changes), `tag` (production-card tag), `bit_died` (audience boo path → sad trombone). Director emits
`onShowCue`; structural cues within 4 s of each other are dropped.

Palettes are per **stage kit** (`visuals/stageKitIds.ts` → `KIT_MUSIC_PALETTE`, definitions in
`audio/musicPalettes.ts`): talk show = swung brass, court = organ + timpani, news = urgent synth,
void = house band. Adding a kit forces you to pick a palette (it is a `Record`).

## Clip recorder

The stage canvas, burned-in captions and the show title are composited into a 1280×720 canvas
(`ClipCompositor`, drawn right after Stage renders). Audio is the master bus (`ShowAudioBus.getRecordingStream()`),
so clips contain TTS + SFX + music exactly as heard.

- **WebM (default):** two staggered `MediaRecorder`s (45 s lifetime, offset by half). A clip is a snapshot of the
  older one: 22–45 s of standalone, playable media. MediaRecorder output cannot be trimmed from the head, hence the pair.
  WebM from MediaRecorder carries no duration metadata (plays fine in browsers/VLC; some editors want a remux).
- **MP4 (optional):** WebCodecs `VideoEncoder`/`AudioEncoder` (H.264+AAC preferred, VP9+Opus fallback), a
  GOP-aligned rolling buffer (`rollingBuffer.ts`, 2 s keyframes → 30–32 s), and `mp4-muxer` at export time.
  Shown in the format picker only when the browser can encode it.
- Recording starts at the first utterance and pauses after 2 minutes of silence; the buffer stays clip-able.

## Cast editor and cast cards

Five slots: name, persona, voice (Supertonic has four styles: M1 M2 F1 F2), avatar (default / uploaded `.vrm` in IndexedDB /
https URL), sampling. Chad and Unit-734 are opt-in extras that join the chat rotation; the classic trio
is required (Director modes hard-code them).

A **cast card** (`*.jokesters-cast.json`) is validated with zod (`cast/castCard.ts`). Export can embed uploaded
avatars (base64, ≤ 24 MB each; they are checked for GLB magic bytes on import) or downgrade them to the default.

Guard rails:
- persona ≤ 600 characters (the shared writers'-room prompt carries all five inside ~30 % of the context);
- the `"###"` protocol suffix is always appended (`compilePersona`);
- custom personas are masked per the live profanity slider at prompt-compile time (`cast/profanity.ts`);
- cards cannot carry `http:`/`javascript:` avatar URLs.
