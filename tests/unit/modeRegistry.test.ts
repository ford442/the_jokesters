import { describe, expect, it } from 'vitest';
import {
  MODE_REGISTRY,
  getMode,
  getUiPresets,
  validateRegistry,
} from '../../src/Director/modes/registry';

describe('MODE_REGISTRY', () => {
  it('passes validateRegistry()', () => {
    const { ok, errors } = validateRegistry();
    expect(ok, errors.join('\n')).toBe(true);
    expect(MODE_REGISTRY.length).toBeGreaterThan(0);
  });

  it('has unique mode ids', () => {
    const ids = MODE_REGISTRY.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('assigns a lazy loader to every mode', () => {
    const { ok, errors } = validateRegistry();
    expect(ok, errors.join('\n')).toBe(true);
  });

  it('resolves core mode ids via getMode()', () => {
    const core = ['improv', 'autonomous', 'roast', 'reporter', 'therapy', 'code_review'];
    for (const id of core) {
      expect(getMode(id)?.id).toBe(id);
    }
  });

  it('maps UI presets to registry entries', () => {
    const presets = getUiPresets();
    expect(presets.length).toBeGreaterThan(0);

    for (const preset of presets) {
      const mode = getMode(preset.id);
      expect(mode, `preset '${preset.id}' missing from registry`).toBeDefined();
      if (mode) {
        expect(mode.title).toBe(preset.title);
        expect(mode.description).toBe(preset.description);
      }
    }
  });
});
