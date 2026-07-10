import { describe, expect, it } from 'vitest';
import {
  alignPrefillChunkSize,
  clampContextToCompiledMax,
  parseCompiledMaxContextFromModelLib,
} from '../../src/utils/dynamicContext';

describe('parseCompiledMaxContextFromModelLib', () => {
  it('parses ctx suffixes from wasm model_lib URLs', () => {
    expect(
      parseCompiledMaxContextFromModelLib(
        'https://storage.1ink.us/models/wasm-libs/vicuna-7b-q4f32_1-ctx512_cs1k-webgpu.wasm',
      ),
    ).toBe(512);
    expect(
      parseCompiledMaxContextFromModelLib(
        'https://storage.1ink.us/models/wasm-libs/vicuna-7b-q4f32_1-ctx1024_cs1k-webgpu.wasm',
      ),
    ).toBe(1024);
    expect(
      parseCompiledMaxContextFromModelLib(
        'https://storage.1ink.us/models/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm',
      ),
    ).toBe(4096);
    expect(parseCompiledMaxContextFromModelLib('')).toBeNull();
  });
});

describe('clampContextToCompiledMax', () => {
  it('clamps to compiled max or passes through when unknown', () => {
    expect(clampContextToCompiledMax(2048, 512)).toBe(512);
    expect(clampContextToCompiledMax(512, 512)).toBe(512);
    expect(clampContextToCompiledMax(1024, null)).toBe(1024);
  });
});

describe('alignPrefillChunkSize', () => {
  it('caps and floors prefill to valid power-of-two chunks', () => {
    expect(alignPrefillChunkSize(512, 1024)).toBe(512);
    expect(alignPrefillChunkSize(1024, 768)).toBe(512);
    expect(alignPrefillChunkSize(256, 100)).toBe(64);
  });
});
