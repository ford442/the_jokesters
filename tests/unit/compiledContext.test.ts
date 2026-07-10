/**
 * Unit tests for compiled WASM context parsing and chatOpts clamping.
 * Run: npx tsx tests/unit/compiledContext.test.ts
 */

import {
  alignPrefillChunkSize,
  clampContextToCompiledMax,
  parseCompiledMaxContextFromModelLib,
} from '../../src/utils/dynamicContext';

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

console.log('parseCompiledMaxContextFromModelLib');
assert(
  parseCompiledMaxContextFromModelLib(
    'https://storage.1ink.us/models/wasm-libs/vicuna-7b-q4f32_1-ctx512_cs1k-webgpu.wasm'
  ) === 512,
  'ctx512 → 512'
);
assert(
  parseCompiledMaxContextFromModelLib(
    'https://storage.1ink.us/models/wasm-libs/vicuna-7b-q4f32_1-ctx1024_cs1k-webgpu.wasm'
  ) === 1024,
  'ctx1024 → 1024'
);
assert(
  parseCompiledMaxContextFromModelLib(
    'https://storage.1ink.us/models/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm'
  ) === 4096,
  'ctx4k → 4096'
);
assert(parseCompiledMaxContextFromModelLib('') === null, 'empty → null');

console.log('clampContextToCompiledMax');
assert(clampContextToCompiledMax(2048, 512) === 512, '2048 clamped to 512');
assert(clampContextToCompiledMax(512, 512) === 512, '512 unchanged at boundary');
assert(clampContextToCompiledMax(1024, null) === 1024, 'null compiled max passes through');

console.log('alignPrefillChunkSize');
assert(alignPrefillChunkSize(512, 1024) === 512, 'prefill capped to context');
assert(alignPrefillChunkSize(1024, 768) === 512, '768 → power-of-two floor 512');
assert(alignPrefillChunkSize(256, 100) === 64, '100 → 64');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
