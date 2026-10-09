# 3D Rendering: WebGL2 (default) vs. WebGPU (opt-in)

The Jokesters draws two very different kinds of work on the GPU, and they use
**separate, independent** graphics paths:

| Concern | Backend | Where | Configurable? |
|---------|---------|-------|---------------|
| **LLM inference** (the comedians "thinking") | **WebGPU** | `@mlc-ai/web-llm` in `GroupChatManager` | No — always WebGPU |
| **Avatar / stage rendering** (Three.js scene) | **WebGL2** (default) or **WebGPU** (opt-in) | `src/visuals/Stage.ts` | Yes — see below |

> **Key point:** the renderer toggle below only changes how the 3D scene is
> *drawn*. It never touches inference. The LLM requires WebGPU and always uses
> it, regardless of which renderer draws the avatars.

## Why WebGL2 is the default

- **Universal support.** `THREE.WebGLRenderer` (WebGL2 in three r170) works on
  effectively every browser/GPU that can run the app, including machines where
  WebGPU rendering is flaky or unavailable.
- **Easier debugging.** WebGL has mature devtools, predictable synchronous
  rendering, and far more community troubleshooting material — useful when
  debugging avatar animations, expressions, and stage lighting.
- **No VRAM contention.** WebGL2 rendering does not allocate a second WebGPU
  device. On ~4 GB GPUs that headroom matters: the 7B/8B model already pushes
  the VRAM budget (see `docs/VRAM_OPTIMIZATION_IMPLEMENTATION.md`).

## When to choose WebGPU rendering

WebGPU rendering is an **opt-in** path, intended for:

- Debugging the renderer split itself, or comparing backends.
- High-VRAM devices where you want the newer Three.js WebGPU backend.

Avoid it on low-VRAM (~4 GB) machines: the WebGPU renderer requests its **own**
`GPUDevice`, which competes with the LLM for memory and can trigger the OOM
paths in `src/utils/dynamicContext.ts`.

## How to toggle

Precedence (highest first), resolved by
`getRequestedRendererMode()` in `src/visuals/rendererMode.ts`:

1. **URL query param** — `?renderer=webgpu` or `?renderer=webgl`. Highest
   priority; ideal for agents, debugging, and bug reports because it needs no
   stored state.
2. **Settings toggle** — *Advanced VRAM Settings → 3D Renderer* on the loading
   screen. Persists to `localStorage['jokesters:rendererMode']` and applies on
   the next **Load Model & Start** (no page reload required, because the Stage
   is built at launch).
3. **Default** — `webgl`.

If WebGPU is requested but `navigator.gpu` is unavailable, the app logs a
warning and uses WebGL2. If the WebGPU renderer is requested and available but
fails to initialize, `Stage.initRenderer()` **falls back to WebGL2**
automatically.

## Implementation notes

- **Canvas can bind only one context type.** In WebGL mode, `main.ts` acquires a
  `webgl2` context up front and passes it into `Stage`. In WebGPU mode it does
  **not** acquire a context — the `WebGPURenderer` binds its own WebGPU context
  to the canvas. This is why the two paths are split in `initApp()`.
- **Async init.** `WebGPURenderer` requires `await renderer.init()` before the
  first frame, so renderer creation moved out of the `Stage` constructor into
  `async Stage.initRenderer()`. The scene graph (lights, ground, actors,
  audience) is still built eagerly in the constructor — it does not depend on
  the renderer.
- **Async frames.** `WebGPURenderer.renderAsync()` returns a Promise. The render
  loop skips a frame if the previous WebGPU submission is still in flight, so
  GPU submissions never overlap. WebGL rendering stays synchronous.
- **Shared scene state.** Both renderers draw the exact same `THREE.Scene`,
  camera, actors, lip-sync, and audience — nothing about avatar state,
  animations, or scene data is duplicated per backend.
- **Bundle cost.** `three/webgpu` is loaded via a dynamic `import()`, so it is
  code-split into its own chunk and only downloaded when WebGPU rendering is
  actually selected. WebGL-default users never pay for it.

## Files

| File | Role |
|------|------|
| `src/visuals/rendererMode.ts` | Resolve/persist the renderer preference; capability check |
| `src/visuals/Stage.ts` | `initRenderer()` (mode selection + fallback), mode-aware render loop |
| `src/main.ts` | Split WebGL/WebGPU construction in `initApp()`; wire the settings toggle |
| `src/types/three.d.ts` | Ambient types for `three/webgpu` (three ships none) |
| `src/visuals/stageKitIds.ts` | Kit ids (`void`, `talkshow`, `court`, `news`) and safe GLB URLs |
| `src/visuals/kits/` | Load/dispose, camera director, prop meshes, shadow policy |
| `public/sets/*.glb` | Static set meshes (not in the JS bundle) |

## Stage kits

Capsules stay the actors. A kit is extra set dressing parented into the same
scene, loaded when a scenario starts and disposed when it stops.

| Kit | Where it is selected | What you see |
|-----|----------------------|--------------|
| `void` | Default, and `improv` | Bare stage already built in `Stage`. Warmer house lights. |
| `talkshow` | `talk_show` | Desk, front panel, curtain, screen |
| `news` | `news_desk`, `newsroom`, `reporter` | Anchor desk, backdrop, monitor |
| `court` | `trial` | Bench and two tables. Wider camera lens. |

Registry entries carry an optional `stageKit`. A `Scenario.stageKit` (or
`config.stageKit`) overrides that. Any other string, including a path, resolves
to `void` and does not fall through to the mode default.

### Assets stay out of the bundle

GLBs live in `public/sets/` and are fetched at runtime (`./sets/talkshow.glb`).
Nothing in `src/` imports a `.glb`. `GLTFLoader` is a dynamic `import()` inside
`loadStageKit.ts`, so the loader chunk is separate from the main graph.
Rebuild the files with `node scripts/build-stage-kits.mjs`. Each file is a few
kilobytes; keep them under 1 MB before considering KTX2/DRACO.

Kit loading does **not** call `CreateMLCEngine`. The stage renderer (WebGL2
default, optional WebGPU) is independent of LLM WebGPU, so a software-WebGL
page can still show a set.

On scene stop, `StageKitSession.unmount()` walks the graph and calls `dispose()`
on geometries, materials, and maps, then detaches the root. A newer request
bumps an epoch so a late GLB cannot attach after the scene has moved on.

The audience stays the existing crowd mesh. Kit GLBs are a handful of meshes
(4 or fewer) and do not add a draw per audience member. If a 20-frame window
averages under 30 FPS, directional shadows turn off for the rest of the
session.

### Camera

`cameraDirector.ts` is plain data: `idle` with no speaker, a short `twoShot`
on a handoff, then `speakerClose` (push-in). Court uses a wider fov than the
talk show. The render loop copies the pose onto `camera.position` / `lookAt` /
`fov` **after** `actor.update(volume)`, and it never writes actor scale, so
lip-sync squash is left alone.

A callback (`onCallbackRecorded`) calls `stage.whipCamera()` — a short lateral
offset that decays in under half a second. `CallbackVisualizer` still owns
badge/glow drawing; its mesh pulse writes `mesh.scale`, which fights the
procedural lip-sync update, so the whip does not go through that class.

### Props

`propCatalog.ts` mirrors `sfxCatalog.ts`. Only `mug` and `briefcase` may appear.
Tokens use the same shape as SFX:

```
[prop:mug]   [prop:mug:hide]   PROP:briefcase   PROP:briefcase:off
```

`takePropCues` strips every `[prop:…]` / `PROP:…` token from speech, including
`[prop:../../etc/passwd]` and `[prop:gun]`, and returns cues only for whitelist
hits. The mesh id is the catalog constant (`procedural:mug`), never the raw
string, and nothing is fetched. Props are disposed with the kit on scene stop.
