/**
 * Unit tests for MODE_REGISTRY integrity.
 * Run: npx tsx tests/unit/modeRegistry.test.ts
 */

import {
  MODE_REGISTRY,
  getMode,
  getUiPresets,
  validateRegistry,
} from '../../src/Director/modes/registry';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

console.log('\n=== Registry validation ===');
{
  const { ok, errors } = validateRegistry();
  assert(ok, `validateRegistry() passes (${MODE_REGISTRY.length} modes)`);
  if (!ok) {
    for (const err of errors) console.error(`    ${err}`);
  }
}

console.log('\n=== Unique mode ids ===');
{
  const ids = MODE_REGISTRY.map((m) => m.id);
  const unique = new Set(ids);
  assert(unique.size === ids.length, `all ${ids.length} mode ids are unique`);
}

console.log('\n=== Every mode has a run handler ===');
{
  const missing = MODE_REGISTRY.filter((m) => typeof m.run !== 'function');
  assert(missing.length === 0, `all modes have run handlers (missing: ${missing.length})`);
}

console.log('\n=== getMode resolves registered ids ===');
{
  const sampleIds = ['improv', 'roast', 'reporter', 'therapy', 'code_review', 'sentient_linting_tool'];
  for (const id of sampleIds) {
    const mode = getMode(id);
    assert(mode !== undefined && mode.id === id, `getMode('${id}') resolves`);
  }
}

console.log('\n=== UI presets resolve to registry entries ===');
{
  const presets = getUiPresets();
  assert(presets.length > 0, `getUiPresets() returns ${presets.length} presets`);

  let unresolved = 0;
  for (const preset of presets) {
    const mode = getMode(preset.id);
    if (!mode) {
      unresolved += 1;
      console.error(`    unresolved preset id: ${preset.id}`);
    }
    if (mode && (mode.title !== preset.title || mode.description !== preset.description)) {
      // Title/description should match registry (single source of truth)
      assert(
        mode.title === preset.title,
        `preset '${preset.id}' title matches registry`,
      );
    }
  }
  assert(unresolved === 0, `every UI preset id exists in MODE_REGISTRY (${presets.length} checked)`);
}

console.log('\n=== Core modes registered ===');
{
  const core = ['improv', 'autonomous', 'roast', 'reporter', 'therapy', 'code_review'];
  for (const id of core) {
    assert(getMode(id) !== undefined, `core mode '${id}' is registered`);
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
