import type { ModeLoop } from './ModeContext';
import { REGISTRY_ENTRIES } from './registryEntries';

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
 * Central definition for a playable interaction mode.
 * Add new modes by exporting a run function from a mode file and appending
 * one entry to REGISTRY_ENTRIES (via scripts/generate-mode-registry.mjs).
 */
export interface ModeDefinition {
  id: string;
  title: string;
  category: ModeCategory;
  description: string;
  run: ModeLoop;
  agents?: string[];
  tags?: string[];
  /** When true, appears in the improv preset dropdown. */
  showInPresets?: boolean;
}

export const MODE_REGISTRY: ModeDefinition[] = REGISTRY_ENTRIES;

const modeById = new Map<string, ModeDefinition>(
  MODE_REGISTRY.map((mode) => [mode.id, mode]),
);

export type RegisteredModeId = (typeof MODE_REGISTRY)[number]['id'];

export function getMode(id: string): ModeDefinition | undefined {
  return modeById.get(id);
}

export function getModeLoop(id: string): ModeLoop | undefined {
  return modeById.get(id)?.run;
}

export function listModesByCategory(category: ModeCategory): ModeDefinition[] {
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

/** UI preset dropdown entries — modes flagged showInPresets or with explicit preset metadata. */
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

    if (typeof mode.run !== 'function') {
      errors.push(`Mode "${mode.id}" has no run handler`);
    }
  }

  return { ok: errors.length === 0, errors };
}
