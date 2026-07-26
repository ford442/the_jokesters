import type { ModeCatalogEntry, ModeCategory } from '../Director/modes/registry';

/** Minimum / maximum message-count window for conversation history. */
export const MIN_MEMORY_DEPTH = 4;
export const MAX_MEMORY_DEPTH = 30;
export const DEFAULT_MEMORY_DEPTH = 15;

export const MEMORY_DEPTH_STORAGE_KEY = 'jokesters-memory-depth';

/**
 * Default memory depth (message count) per mode category.
 * Short-form modes use tighter windows; long-form / callback-heavy modes zoom out.
 */
export const CATEGORY_CONTEXT_DEPTH_DEFAULTS: Record<ModeCategory, number> = {
  improv: 15,
  performance: 18,
  interactive: 12,
  media: 10,
  reporter: 14,
  creative: 16,
  dream: 12,
};

export type MemoryHint = 'zoom_in' | 'zoom_out' | 'advance_act' | `recall:${string}`;

export function clampMemoryDepth(depth: number): number {
  return Math.max(MIN_MEMORY_DEPTH, Math.min(MAX_MEMORY_DEPTH, Math.round(depth)));
}

export function loadMemoryDepthPreference(): number {
  try {
    const stored = localStorage.getItem(MEMORY_DEPTH_STORAGE_KEY);
    if (stored != null) {
      const parsed = parseInt(stored, 10);
      if (!Number.isNaN(parsed)) {
        return clampMemoryDepth(parsed);
      }
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_MEMORY_DEPTH;
}

export function saveMemoryDepthPreference(depth: number): void {
  try {
    localStorage.setItem(MEMORY_DEPTH_STORAGE_KEY, String(clampMemoryDepth(depth)));
  } catch {
    // ignore quota / privacy mode
  }
}

export function getDefaultContextDepthForCategory(category: ModeCategory): number {
  return CATEGORY_CONTEXT_DEPTH_DEFAULTS[category] ?? DEFAULT_MEMORY_DEPTH;
}

/**
 * Resolve scene memory depth from mode metadata when `config.contextDepth` is omitted.
 * Numeric `estimatedTurns` is treated as an explicit message budget; short/medium/long
 * nudge relative to the category default.
 */
export function getContextDepthForMode(mode: ModeCatalogEntry): number {
  const base = getDefaultContextDepthForCategory(mode.category);
  const turns = mode.estimatedTurns;
  if (typeof turns === 'number') {
    return clampMemoryDepth(turns);
  }
  switch (turns) {
    case 'short':
      return clampMemoryDepth(base - 4);
    case 'long':
      return clampMemoryDepth(base + 4);
    default:
      return base;
  }
}

/** Director analysis window scales with memory depth (~40%, min 4). */
export function getDirectorCritiqueDepth(memoryDepth: number): number {
  return clampMemoryDepth(Math.max(4, Math.round(memoryDepth * 0.4)));
}

export function applyMemoryHint(baseDepth: number, hint: MemoryHint): number {
  switch (hint) {
    case 'zoom_in':
      return clampMemoryDepth(Math.round(baseDepth * 0.5));
    case 'zoom_out':
      return clampMemoryDepth(Math.round(baseDepth * 1.5));
    default: {
      if (hint.startsWith('recall:')) {
        return clampMemoryDepth(Math.round(baseDepth * 1.5));
      }
      return baseDepth;
    }
  }
}

export function parseMemoryHint(raw: string): MemoryHint | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === 'zoom_in' || trimmed === 'zoom-in') return 'zoom_in';
  if (trimmed === 'zoom_out' || trimmed === 'zoom-out') return 'zoom_out';
  if (trimmed === 'advance_act' || trimmed === 'advance-act') return 'advance_act';
  if (trimmed.startsWith('recall:')) {
    const theme = raw.trim().slice('recall:'.length).trim();
    if (theme) return `recall:${theme}` as MemoryHint;
  }
  return null;
}
