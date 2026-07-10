import { describe, expect, it } from 'vitest';
import {
  applyMemoryHint,
  clampMemoryDepth,
  getDefaultContextDepthForCategory,
  getDirectorCritiqueDepth,
  parseMemoryHint,
  CATEGORY_CONTEXT_DEPTH_DEFAULTS,
  MIN_MEMORY_DEPTH,
  MAX_MEMORY_DEPTH,
} from '../../src/config/contextDepth';

describe('clampMemoryDepth', () => {
  it('clamps below minimum and above maximum', () => {
    expect(clampMemoryDepth(2)).toBe(MIN_MEMORY_DEPTH);
    expect(clampMemoryDepth(99)).toBe(MAX_MEMORY_DEPTH);
    expect(clampMemoryDepth(15)).toBe(15);
  });
});

describe('applyMemoryHint', () => {
  it('adjusts depth for zoom and recall hints', () => {
    expect(applyMemoryHint(16, 'zoom_in')).toBe(8);
    expect(applyMemoryHint(10, 'zoom_out')).toBe(15);
    expect(applyMemoryHint(20, 'recall:pickles')).toBe(30);
  });
});

describe('parseMemoryHint', () => {
  it('parses known hints and rejects unknown ones', () => {
    expect(parseMemoryHint('zoom_in')).toBe('zoom_in');
    expect(parseMemoryHint('recall:hotdogs')).toBe('recall:hotdogs');
    expect(parseMemoryHint('nonsense')).toBeNull();
  });
});

describe('category defaults', () => {
  it('keeps every category default within allowed range', () => {
    for (const category of Object.keys(CATEGORY_CONTEXT_DEPTH_DEFAULTS) as Array<
      keyof typeof CATEGORY_CONTEXT_DEPTH_DEFAULTS
    >) {
      const depth = getDefaultContextDepthForCategory(category);
      expect(depth).toBeGreaterThanOrEqual(MIN_MEMORY_DEPTH);
      expect(depth).toBeLessThanOrEqual(MAX_MEMORY_DEPTH);
    }
  });
});

describe('getDirectorCritiqueDepth', () => {
  it('scales critique depth with memory depth', () => {
    expect(getDirectorCritiqueDepth(15)).toBe(6);
    expect(getDirectorCritiqueDepth(4)).toBe(4);
  });
});
