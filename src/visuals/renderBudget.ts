/** Frame caps that keep the 3D loop from starving the main thread on weak renderers. */

/** Cap while the LLM / TTS load (the stage is hidden behind the picker anyway). */
export const LOADING_RENDER_FPS = 4

/** Steady-state cap on software WebGL (SwiftShader, llvmpipe, CI runners). */
export const SOFTWARE_RENDER_FPS = 12

const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i

/** True for CPU rasterizers, from the UNMASKED_RENDERER_WEBGL string. */
export function isSoftwareGlRenderer(glRenderer: string | null | undefined): boolean {
  return !!glRenderer && SOFTWARE_GL.test(glRenderer)
}
