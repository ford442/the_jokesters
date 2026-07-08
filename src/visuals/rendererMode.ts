/**
 * Renderer mode selection for the Three.js avatar/stage rendering.
 *
 * IMPORTANT — this is ONLY about how the 3D scene is drawn. It is completely
 * independent of the LLM inference path, which always runs on WebGPU via
 * @mlc-ai/web-llm. The two never share a renderer:
 *
 *   - Avatar / stage rendering  → WebGL2 (default) or WebGPU (opt-in)
 *   - LLM inference             → WebGPU (always, unaffected by this setting)
 *
 * WebGL2 is the default because it is universally supported, easier to debug,
 * and does not compete with the LLM for the WebGPU device / VRAM. WebGPU
 * rendering is an opt-in path for debugging the renderer split or for users on
 * high-VRAM devices who want the newer backend. On ~4 GB GPUs it will fight the
 * 7B/8B model for memory, so it stays off unless explicitly requested.
 */

export type RendererMode = 'webgl' | 'webgpu';

/** Default renderer for the 3D scene. WebGL2 is the safe, universal fallback. */
export const DEFAULT_RENDERER_MODE: RendererMode = 'webgl';

const STORAGE_KEY = 'jokesters:rendererMode';

function isValidMode(value: unknown): value is RendererMode {
  return value === 'webgl' || value === 'webgpu';
}

/**
 * Resolve the *requested* renderer mode.
 *
 * Precedence (highest first):
 *   1. `?renderer=webgpu` / `?renderer=webgl` URL query param (agent/debug friendly)
 *   2. `localStorage['jokesters:rendererMode']` (the settings toggle)
 *   3. DEFAULT_RENDERER_MODE ('webgl')
 *
 * Note this returns what was *asked for* — availability is checked separately
 * (see isWebGPUAvailable) and Stage falls back to WebGL if WebGPU init fails.
 */
export function getRequestedRendererMode(): RendererMode {
  // URL param wins so an agent (or a bug report) can force a mode without
  // touching stored state: ?renderer=webgpu
  try {
    const q = new URLSearchParams(window.location.search).get('renderer');
    if (isValidMode(q)) return q;
  } catch {
    /* no window.location (non-browser context) — ignore */
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidMode(stored)) return stored;
  } catch {
    /* storage blocked (private mode / disabled) — ignore */
  }

  return DEFAULT_RENDERER_MODE;
}

/** Persist a renderer-mode preference (used by the settings toggle). */
export function setRendererModePreference(mode: RendererMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage blocked — the URL param path still works */
  }
}

/**
 * True if the platform exposes WebGPU, i.e. WebGPU rendering is at least
 * possible. This is the same capability the LLM path depends on; when it is
 * missing we always use WebGL2 for the scene.
 */
export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator as unknown as { gpu?: unknown }).gpu;
}
