/**
 * Stage kit ids. Unknown values resolve to `void` (the existing bare stage).
 * Asset filenames come only from KIT_FILES — never from a caller-supplied string.
 */

export const STAGE_KIT_IDS = ['void', 'talkshow', 'court', 'news'] as const

export type StageKitId = (typeof STAGE_KIT_IDS)[number]

const STAGE_KIT_SET = new Set<string>(STAGE_KIT_IDS)

/** GLBs live in `public/sets/` and are fetched at runtime. Void has no file. */
const KIT_FILES: Record<Exclude<StageKitId, 'void'>, string> = {
  talkshow: 'talkshow.glb',
  court: 'court.glb',
  news: 'news.glb',
}

export function isStageKitId(id: string): id is StageKitId {
  return STAGE_KIT_SET.has(id)
}

/** Unknown, empty, or path-like ids become the bare stage. */
export function resolveStageKitId(id: string | null | undefined): StageKitId {
  if (id && isStageKitId(id)) return id
  return 'void'
}

/**
 * Safe URL for a kit GLB. Returns null for void and for anything not on the id list.
 * The filename is taken from KIT_FILES, not from `id` concatenation of raw input.
 */
export function kitAssetUrl(id: string, base = './sets'): string | null {
  if (!isStageKitId(id) || id === 'void') return null
  const file = KIT_FILES[id]
  return `${base.replace(/\/$/, '')}/${file}`
}

export interface StageKitSource {
  stageKit?: string | null
  config?: { stageKit?: string | null } | null
}

/**
 * Scenario override wins. An explicit unknown id is void (it does not fall
 * through to the mode default). Missing ids use registry metadata, then void.
 */
export function resolveScenarioStageKit(
  scenario: StageKitSource,
  mode?: { stageKit?: string | null } | null,
): StageKitId {
  const explicit = scenario.stageKit ?? scenario.config?.stageKit
  if (explicit != null && explicit !== '') return resolveStageKitId(explicit)
  return resolveStageKitId(mode?.stageKit)
}
