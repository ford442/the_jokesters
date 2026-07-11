import type { ModeLoop } from './ModeContext';
import { MODE_CATALOG } from './registryCatalog';
import { MODE_LOADER_BY_ID } from './modeLoaders';

export type { ModeLoop } from './ModeContext';

export type ModeCategory =
  | 'improv'
  | 'performance'
  | 'interactive'
  | 'media'
  | 'reporter'
  | 'creative'
  | 'dream';

/**
 * Metadata for a playable interaction mode (no implementation import).
 * Handlers load lazily via loadModeLoop().
 */
export interface ModeCatalogEntry {
  id: string;
  title: string;
  category: ModeCategory;
  description: string;
  agents?: string[];
  tags?: string[];
  estimatedTurns?: 'short' | 'medium' | 'long' | number;
  /** Legacy: was used for giant preset dropdown; mode browser lists all modes. */
  showInPresets?: boolean;
}

/** @deprecated Use ModeCatalogEntry — kept for docs/PR templates. */
export type ModeDefinition = ModeCatalogEntry;

export const MODE_REGISTRY: ModeCatalogEntry[] = MODE_CATALOG;

const modeById = new Map<string, ModeCatalogEntry>(
  MODE_REGISTRY.map((mode) => [mode.id, mode]),
);

const loopCache = new Map<string, ModeLoop>();

export type RegisteredModeId = (typeof MODE_REGISTRY)[number]['id'];

export function getMode(id: string): ModeCatalogEntry | undefined {
  return modeById.get(id);
}

/** Returns cached loop only if already loaded. Prefer loadModeLoop(). */
export function getModeLoop(id: string): ModeLoop | undefined {
  return loopCache.get(id);
}

/** Lazy-load mode implementation (code-split chunk). */
export async function loadModeLoop(id: string): Promise<ModeLoop | undefined> {
  if (loopCache.has(id)) return loopCache.get(id);
  const loader = MODE_LOADER_BY_ID[id];
  if (!loader) return undefined;
  const fn = await loader();
  loopCache.set(id, fn);
  return fn;
}

export function listModesByCategory(category: ModeCategory): ModeCatalogEntry[] {
  return MODE_REGISTRY.filter((mode) => mode.category === category);
}

export function getAllModeIds(): string[] {
  return MODE_REGISTRY.map((mode) => mode.id);
}

export interface ImprovSetup {
  id: string;
  title: string;
  description: string;
}

/** @deprecated Use mode browser / getFeaturedModes. Legacy preset dropdown. */
export function getUiPresets(): ImprovSetup[] {
  return MODE_REGISTRY.filter((mode) => mode.showInPresets).map((mode) => ({
    id: mode.id,
    title: mode.title,
    description: mode.description,
  }));
}

export function validateRegistry(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const mode of MODE_REGISTRY) {
    if (seen.has(mode.id)) {
      errors.push(`Duplicate mode id: ${mode.id}`);
    }
    seen.add(mode.id);

    if (!MODE_LOADER_BY_ID[mode.id]) {
      errors.push(`Mode "${mode.id}" has no lazy loader`);
    }
  }

  return { ok: errors.length === 0, errors };
}
