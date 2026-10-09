/**
 * Whitelisted stage props — same safety model as `sfxCatalog.ts`.
 * Never build a URL or a mesh id from a free-form string.
 * Props are procedural meshes (see `kits/propRig.ts`); there is no fetch.
 */

export const ALLOWED_PROPS = ['mug', 'briefcase'] as const

export type AllowedPropName = (typeof ALLOWED_PROPS)[number]

export type PropAction = 'show' | 'hide'

const ALLOWED_SET = new Set<string>(ALLOWED_PROPS)

/** Canonical id per whitelist entry. The only strings that may identify a prop. */
const PROP_IDS: Record<AllowedPropName, AllowedPropName> = {
  mug: 'mug',
  briefcase: 'briefcase',
}

export function isAllowedPropName(name: string): name is AllowedPropName {
  return ALLOWED_SET.has(name)
}

/**
 * Logical asset id for a whitelisted prop. Returns null for anything else,
 * including path traversal (`../`, absolute paths, extra extensions).
 * The returned id is the catalog constant, not the raw argument.
 */
export function propAssetUrl(name: string): string | null {
  if (!isAllowedPropName(name)) return null
  return `procedural:${PROP_IDS[name]}`
}
