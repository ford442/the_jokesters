import { VPS_STORAGE_URL } from '../utils/vpsStorageUrl'

/** One bundled avatar per agent, hosted next to the TTS/model assets. */
export const BUNDLED_AVATAR_IDS = ['comedian', 'philosopher', 'scientist', 'techBro', 'robot'] as const

const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/

/**
 * `${VPS_STORAGE_URL}/avatars/<agentId>.vrm`. The filename is derived from a validated id,
 * never concatenated from arbitrary input. The service worker stripes + caches `.vrm` like
 * any other model-host binary.
 */
export function bundledAvatarUrl(agentId: string, base: string = VPS_STORAGE_URL): string | null {
  if (!SAFE_ID.test(agentId)) return null
  return `${base.replace(/\/+$/, '')}/avatars/${agentId}.vrm`
}
