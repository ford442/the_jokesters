/**
 * Avatar tier selection: VRM actors cost five skinned meshes, MToon materials and spring
 * bones on top of the LLM's VRAM, so low-end GPUs keep the primitive capsule actors.
 * Pure decision over an injected environment (unit-testable, no DOM access).
 */

export type AvatarTier = 'vrm' | 'primitive'

export const AVATAR_PREF_KEY = 'jokesters-avatars'
export const DEVICE_SNAPSHOT_KEY = 'jokesters-device-snapshot'

/** Free-VRAM estimate (MB, from the guided-launch probe) at/above which VRM actors are used. */
export const VRM_MIN_VRAM_MB = 3500

export interface AvatarTierDevice {
  /** From the guided-launch capability probe (src/app/modelGuide.ts). */
  webgpu?: boolean
  availableVramMB?: number
}

export interface AvatarTierEnv {
  /** `?avatars=vrm|primitive` */
  queryPref?: string | null
  /** localStorage `jokesters-avatars` */
  storedPref?: string | null
  device?: AvatarTierDevice | null
  /** WEBGL_debug_renderer_info UNMASKED_RENDERER_WEBGL, when the probe snapshot is missing. */
  glRenderer?: string | null
  deviceMemoryGb?: number
  hardwareConcurrency?: number
  coarsePointer?: boolean
}

export interface AvatarTierDecision {
  tier: AvatarTier
  reason: string
}

const SOFTWARE_OR_MOBILE_GPU = /swiftshader|llvmpipe|softpipe|software|mali|adreno|powervr|videocore|intel.*(hd|uhd|iris)|microsoft basic/i

function parsePref(v: string | null | undefined): AvatarTier | null {
  const t = v?.trim().toLowerCase()
  if (t === 'vrm') return 'vrm'
  if (t === 'primitive' || t === 'capsule' || t === 'off') return 'primitive'
  return null
}

export function selectAvatarTier(env: AvatarTierEnv): AvatarTierDecision {
  const forced = parsePref(env.queryPref) ?? parsePref(env.storedPref)
  if (forced) return { tier: forced, reason: `user preference (${forced})` }

  if (env.coarsePointer) return { tier: 'primitive', reason: 'touch/mobile device' }
  if (env.deviceMemoryGb !== undefined && env.deviceMemoryGb <= 4) {
    return { tier: 'primitive', reason: `low device memory (${env.deviceMemoryGb} GB)` }
  }
  if (env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 4) {
    return { tier: 'primitive', reason: `few CPU cores (${env.hardwareConcurrency})` }
  }

  const d = env.device
  if (d) {
    if (d.webgpu === false) return { tier: 'primitive', reason: 'no WebGPU adapter (CPU fallback tier)' }
    if (typeof d.availableVramMB === 'number') {
      return d.availableVramMB >= VRM_MIN_VRAM_MB
        ? { tier: 'vrm', reason: `~${Math.round(d.availableVramMB)} MB VRAM free` }
        : { tier: 'primitive', reason: `only ~${Math.round(d.availableVramMB)} MB VRAM free` }
    }
  }

  if (env.glRenderer && SOFTWARE_OR_MOBILE_GPU.test(env.glRenderer)) {
    return { tier: 'primitive', reason: `integrated/software GPU (${env.glRenderer})` }
  }
  // Unknown but not obviously weak: be conservative only when we positively know it is weak.
  return { tier: env.glRenderer ? 'vrm' : 'primitive', reason: env.glRenderer ? 'discrete-class GPU' : 'no capability info' }
}

/** Collect the browser-side inputs. Never throws; every source is optional. */
export function readAvatarTierEnv(device: AvatarTierDevice | null, glRenderer: string | null): AvatarTierEnv {
  let queryPref: string | null = null
  let storedPref: string | null = null
  try {
    queryPref = new URLSearchParams(window.location.search).get('avatars')
  } catch { /* non-browser */ }
  try {
    storedPref = localStorage.getItem(AVATAR_PREF_KEY)
  } catch { /* storage blocked */ }
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : undefined
  let coarse = false
  try {
    coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  } catch { /* ignore */ }
  return {
    queryPref,
    storedPref,
    device,
    glRenderer,
    deviceMemoryGb: nav?.deviceMemory,
    hardwareConcurrency: nav?.hardwareConcurrency,
    coarsePointer: coarse,
  }
}

export function persistDeviceSnapshot(d: AvatarTierDevice): void {
  try {
    localStorage.setItem(DEVICE_SNAPSHOT_KEY, JSON.stringify({ webgpu: d.webgpu, availableVramMB: d.availableVramMB }))
  } catch { /* ignore */ }
}

export function loadDeviceSnapshot(): AvatarTierDevice | null {
  try {
    const raw = localStorage.getItem(DEVICE_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AvatarTierDevice
    return typeof parsed === 'object' && parsed ? parsed : null
  } catch {
    return null
  }
}

interface GlLike {
  getExtension(name: string): { UNMASKED_RENDERER_WEBGL: number } | null
  getParameter(p: number): unknown
}

/** Driver-reported GPU name, or null when the extension is blocked. */
export function readGlRendererString(gl: GlLike | null | undefined): string | null {
  try {
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    if (!gl || !ext) return null
    const v = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
    return typeof v === 'string' ? v : null
  } catch {
    return null
  }
}
