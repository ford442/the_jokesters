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
