/**
 * Unit tests for configurable memory depth and director hints.
 * Run: npx tsx tests/unit/contextDepth.test.ts
 */

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

console.log('\n=== clampMemoryDepth ===');
assert(clampMemoryDepth(2) === MIN_MEMORY_DEPTH, 'clamps below minimum');
assert(clampMemoryDepth(99) === MAX_MEMORY_DEPTH, 'clamps above maximum');
assert(clampMemoryDepth(15) === 15, 'preserves in-range value');

console.log('\n=== applyMemoryHint ===');
assert(applyMemoryHint(16, 'zoom_in') === 8, 'zoom_in halves depth');
assert(applyMemoryHint(10, 'zoom_out') === 15, 'zoom_out expands depth');
assert(applyMemoryHint(20, 'recall:pickles') === 30, 'recall zooms out (capped)');

console.log('\n=== parseMemoryHint ===');
assert(parseMemoryHint('zoom_in') === 'zoom_in', 'parses zoom_in');
assert(parseMemoryHint('recall:hotdogs') === 'recall:hotdogs', 'parses recall theme');
assert(parseMemoryHint('nonsense') === null, 'rejects unknown hint');

console.log('\n=== category defaults documented ===');
for (const category of Object.keys(CATEGORY_CONTEXT_DEPTH_DEFAULTS) as Array<keyof typeof CATEGORY_CONTEXT_DEPTH_DEFAULTS>) {
  const depth = getDefaultContextDepthForCategory(category);
  assert(depth >= MIN_MEMORY_DEPTH && depth <= MAX_MEMORY_DEPTH, `${category} default in range (${depth})`);
}

console.log('\n=== director critique depth scales ===');
assert(getDirectorCritiqueDepth(15) === 6, '15 -> 6 critique messages');
assert(getDirectorCritiqueDepth(4) === 4, 'minimum critique depth is 4');

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
