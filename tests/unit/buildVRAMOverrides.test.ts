import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildVRAMOverrides,
  DEFAULT_VRAM_CONFIG,
  type VRAMOptimizationConfig,
} from '../../src/utils/dynamicContext';

describe('buildVRAMOverrides', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aligns prefill chunk to context and clamps compiled max', () => {
    const overrides = buildVRAMOverrides(
      {},
      2048,
      { ...DEFAULT_VRAM_CONFIG, prefill_chunk_size: 0 },
      'Hermes-3-Llama-3.2-3B-MLC',
      512,
    );

    expect(overrides.context_window_size).toBe(512);
    expect(overrides.prefill_chunk_size).toBe(512);
  });

  it('enables sliding window when size > 0 and not custom low-ctx wasm', () => {
    const config: VRAMOptimizationConfig = {
      ...DEFAULT_VRAM_CONFIG,
      sliding_window_size: 1024,
      attention_sink_size: 6,
    };

    const overrides = buildVRAMOverrides({}, 4096, config, 'Llama-2-7b-chat-MLC', null);

    expect(overrides.sliding_window_size).toBe(1024);
    expect(overrides.attention_sink_size).toBe(6);
  });

  it('auto sliding window uses half the effective context', () => {
    const config: VRAMOptimizationConfig = {
      ...DEFAULT_VRAM_CONFIG,
      sliding_window_size: -1,
    };

    const overrides = buildVRAMOverrides({}, 2048, config, 'Llama-2-7b-chat-MLC', null);

    expect(overrides.sliding_window_size).toBe(1024);
  });

  it('skips sliding window for custom low-ctx compiled wasm', () => {
    const config: VRAMOptimizationConfig = {
      ...DEFAULT_VRAM_CONFIG,
      sliding_window_size: 512,
    };

    const overrides = buildVRAMOverrides(
      {},
      512,
      config,
      'vicuna-7b-ctx512',
      512,
    );

    expect(overrides.sliding_window_size).toBeUndefined();
  });

  it('applies KV cache quantization for 7B models when mode is auto', () => {
    const overrides = buildVRAMOverrides(
      {},
      4096,
      { ...DEFAULT_VRAM_CONFIG, kv_cache_quantization: 'auto' },
      'Llama-2-7b-chat-MLC',
      null,
    );

    expect(overrides.kv_cache_quantization).toBe('int8');
  });

  it('respects explicit KV cache mode and skips for 3B when auto', () => {
    const small = buildVRAMOverrides(
      {},
      2048,
      { ...DEFAULT_VRAM_CONFIG, kv_cache_quantization: 'auto' },
      'Hermes-3-Llama-3.2-3B-MLC',
      null,
    );
    expect(small.kv_cache_quantization).toBeUndefined();

    const fp8 = buildVRAMOverrides(
      {},
      2048,
      { ...DEFAULT_VRAM_CONFIG, kv_cache_quantization: 'fp8' },
      'Hermes-3-Llama-3.2-3B-MLC',
      null,
    );
    expect(fp8.kv_cache_quantization).toBe('fp8');
  });
});
