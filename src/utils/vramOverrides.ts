/**
 * VRAM / compiled-context policy.
 *
 * Split out of the former `utils/dynamicContext.ts` god-file (#345). Everything
 * here is pure policy over the three *engine-side* context layers described in
 * `docs/WASM_CONTEXT_GUIDE.md`:
 *
 *   1. baked `model_lib` max  — `parseCompiledMaxContextFromModelLib`
 *   2. JS overrides           — `clampContextToCompiledMax` + `alignPrefillChunkSize`
 *   3. sliding window / KV    — `buildVRAMOverrides` (never on custom ctx512/1024 libs)
 *
 * Message-count depth (`memoryDepth` / `memoryHint`) lives in `contextBudget.ts`.
 */
import * as webllm from '@mlc-ai/web-llm';

export interface ContextConfig {
  context_window_size: number;
  prefill_chunk_size: number;
  vram_estimate_mb: number;
  label: string;
}

/** User-configurable VRAM optimization settings */
export interface VRAMOptimizationConfig {
  /** Fraction of GPU memory to use (0.0-1.0). Default: 0.85 */
  gpu_memory_utilization: number;
  /** Prefill chunk size override. 0 = auto (derived from context window) */
  prefill_chunk_size: number;
  /** KV cache quantization mode. 'none' disables, 'auto' detects support */
  kv_cache_quantization: 'none' | 'fp8' | 'int8' | 'auto';
  /** Sliding window size for attention. 0 = disabled, -1 = auto, >0 = specific size */
  sliding_window_size: number;
  /** Number of attention sink tokens to keep from the beginning. Default: 4 */
  attention_sink_size: number;
}

/** Default VRAM optimization settings — safe for non-expert users */
export const DEFAULT_VRAM_CONFIG: VRAMOptimizationConfig = {
  gpu_memory_utilization: 0.85,
  prefill_chunk_size: 0,
  kv_cache_quantization: 'auto',
  sliding_window_size: 0,  // Disabled by default (use full context)
  attention_sink_size: 4,  // Keep 4 initial tokens if sliding window enabled
};

// ============================================================================
// VRAM Estimation
// ============================================================================

/**
 * Static memory overhead to subtract from the raw probe result.
 * Accounts for Three.js stage (InstancedMesh + shadows), ONNX TTS runtime,
 * AudioContext, and WebGPU driver overhead — empirically ~900 MB on a
 * typical load before the LLM is allocated.
 */
export const APP_OVERHEAD_MB = 900;

/** Last successful VRAM estimate; cached so multiple callers don't re-probe. */
let _cachedVRAMEstimate: number | null = null;

/**
 * Estimate available VRAM after accounting for app overhead.
 * Uses test-allocations to probe GPU memory, then subtracts APP_OVERHEAD_MB.
 * Result is cached — subsequent calls return the same value instantly.
 */
export async function estimateAvailableVRAM(): Promise<number> {
  if (_cachedVRAMEstimate !== null) return _cachedVRAMEstimate;

  const nav = navigator as any;
  if (!nav.gpu) {
    _cachedVRAMEstimate = 2048;
    return _cachedVRAMEstimate;
  }

  try {
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) {
      _cachedVRAMEstimate = 2048;
      return _cachedVRAMEstimate;
    }

    // Try test allocations from largest to smallest
    const device = await adapter.requestDevice();
    const testSizes = [8, 6, 4, 3, 2, 1.5, 1];

    let probedMB = 1024;
    for (const sizeGB of testSizes) {
      try {
        const testBuffer = device.createBuffer({
          size: sizeGB * 1024 * 1024 * 1024,
          usage: 32 // GPUBufferUsage.STORAGE
        });
        testBuffer.destroy();
        probedMB = sizeGB * 1024;
        break;
      } catch { /* try smaller */ }
    }

    // Subtract static app overhead so callers don't over-commit
    _cachedVRAMEstimate = Math.max(512, probedMB - APP_OVERHEAD_MB);
    console.log(`[VRAM] Probed: ${probedMB} MB, after ${APP_OVERHEAD_MB} MB overhead → ${_cachedVRAMEstimate} MB available for model`);
    return _cachedVRAMEstimate;
  } catch {
    _cachedVRAMEstimate = 2048;
    return _cachedVRAMEstimate;
  }
}

/** Invalidate the VRAM cache (call before re-probing after page state change). */
export function invalidateVRAMCache(): void {
  _cachedVRAMEstimate = null;
}

/**
 * Get context config based on VRAM and model size
 */
export function getContextConfigForVRAM(
  vramMB: number,
  modelParams: '3b' | '7b' | '8b' = '7b'
): ContextConfig {
  // Ordered LARGEST-first so the loop returns the biggest context that fits within budget.
  // Fallback (last entry) is always the smallest / most conservative choice.
  const configs: Record<string, ContextConfig[]> = {
    '3b': [
      { context_window_size: 4096, prefill_chunk_size: 1024, vram_estimate_mb: 3000, label: 'full' },
      { context_window_size: 2048, prefill_chunk_size: 1024, vram_estimate_mb: 2500, label: 'balanced' },
      { context_window_size: 1024, prefill_chunk_size: 512,  vram_estimate_mb: 2000, label: 'compact' },
      { context_window_size: 512,  prefill_chunk_size: 256,  vram_estimate_mb: 1800, label: 'minimal' },
    ],
    '7b': [
      { context_window_size: 4096, prefill_chunk_size: 1024, vram_estimate_mb: 7500, label: 'full' },
      { context_window_size: 2048, prefill_chunk_size: 1024, vram_estimate_mb: 5200, label: 'extended' },
      { context_window_size: 1024, prefill_chunk_size: 1024, vram_estimate_mb: 3900, label: 'balanced' },
      { context_window_size: 512,  prefill_chunk_size: 512,  vram_estimate_mb: 3400, label: 'compact' },
      { context_window_size: 256,  prefill_chunk_size: 256,  vram_estimate_mb: 3000, label: 'minimal' },
      { context_window_size: 128,  prefill_chunk_size: 128,  vram_estimate_mb: 2800, label: 'ultra-minimal' },
    ],
    '8b': [
      { context_window_size: 2048, prefill_chunk_size: 1024, vram_estimate_mb: 7200, label: 'extended' },
      { context_window_size: 1024, prefill_chunk_size: 1024, vram_estimate_mb: 5800, label: 'balanced' },
      { context_window_size: 512,  prefill_chunk_size: 512,  vram_estimate_mb: 4800, label: 'compact' },
      { context_window_size: 256,  prefill_chunk_size: 256,  vram_estimate_mb: 3800, label: 'minimal' },
    ],
  };

  const modelConfigs = configs[modelParams];
  const safeVRAM = vramMB * 0.85; // 85% safety margin (generous — overhead already subtracted by estimateAvailableVRAM)

  // Return the largest context window that fits within the VRAM budget
  for (const config of modelConfigs) {
    if (config.vram_estimate_mb <= safeVRAM) {
      return config;
    }
  }
  // All configs exceed budget — fall back to the smallest (last entry)
  return modelConfigs[modelConfigs.length - 1];
}

/**
 * Parse the baked-in max context from a model_lib filename.
 * Examples: `…-ctx512_cs1k-…` → 512, `…-ctx4k_cs1k-…` → 4096.
 */
export function parseCompiledMaxContextFromModelLib(modelLib: string): number | null {
  if (!modelLib) return null;
  const lower = modelLib.toLowerCase();
  if (/-ctx4k_/.test(lower)) return 4096;
  const match = lower.match(/-ctx(\d+)_/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Never request a runtime context larger than the compiled WASM memory plan.
 */
export function clampContextToCompiledMax(
  requestedContext: number,
  compiledMax: number | null,
): number {
  if (compiledMax == null || compiledMax <= 0) return requestedContext;
  if (requestedContext <= compiledMax) return requestedContext;
  console.warn(
    `[DynamicContext] Clamping context ${requestedContext} → ${compiledMax} ` +
    `(compiled model_lib max)`
  );
  return compiledMax;
}

/** Largest power-of-two ≤ n (minimum 1) — friendly for WebGPU prefill kernels. */
export function alignPrefillChunkSize(contextSize: number, prefillChunkSize: number): number {
  const capped = Math.min(prefillChunkSize, contextSize);
  let p2 = 1;
  while (p2 * 2 <= capped) p2 *= 2;
  return Math.max(1, p2);
}


/**
 * Detect model size from model_id
 */
export function getModelSize(modelId: string): '3b' | '7b' | '8b' {
  if (modelId.includes('3B') || modelId.includes('3b')) return '3b';
  if (modelId.includes('8B') || modelId.includes('8b')) return '8b';
  if (modelId.includes('7B') || modelId.includes('7b')) return '7b';
  return '7b'; // default
}

/**
 * Detect whether the runtime WebLLM build supports KV cache quantization.
 * The check is best-effort: we look for the key in ChatCompletionRequest types.
 */
export function detectKVCacheSupport(): boolean {
  try {
    // WebLLM exposes its config shape through prebuiltAppConfig.
    // If the library supports kv_cache_quantization it will appear in
    // the model_list override schema. Since we can't introspect types at
    // runtime we just check that the library is present and return true
    // as a signal to *try* passing the override (the engine will ignore
    // unknown keys gracefully).
    return typeof webllm.CreateMLCEngine === 'function';
  } catch {
    return false;
  }
}

/**
 * Build the overrides object for a model, incorporating VRAM optimization
 * settings like prefill chunk size and KV cache quantization.
 */
export function buildVRAMOverrides(
  baseOverrides: Record<string, unknown>,
  contextSize: number,
  vramConfig: VRAMOptimizationConfig,
  modelId: string,
  compiledMaxContext: number | null = null,
): Record<string, unknown> {
  const effectiveContext = clampContextToCompiledMax(contextSize, compiledMaxContext);
  const rawPrefill = vramConfig.prefill_chunk_size > 0
    ? vramConfig.prefill_chunk_size
    : Math.min(effectiveContext, 1024);
  const prefillChunk = alignPrefillChunkSize(effectiveContext, rawPrefill);

  const overrides: Record<string, unknown> = {
    ...baseOverrides,
    context_window_size: effectiveContext,
    prefill_chunk_size: prefillChunk,
  };

  // Sliding window attention — enable if explicitly set (> 0) or auto-detect for large contexts
  const slidingWindowSize = vramConfig.sliding_window_size === -1
    ? Math.floor(effectiveContext / 2)  // Auto: half the context window
    : vramConfig.sliding_window_size;

  // Sliding window only helps when generic 4K .wasm is paired with a small runtime ctx.
  // Custom low-ctx .wasm already bakes a tight KV plan — skip sliding window there.
  const isCustomLowCtxWasm =
    compiledMaxContext != null && compiledMaxContext <= 1024 && !baseOverrides.sliding_window_size;

  if (slidingWindowSize > 0 && !isCustomLowCtxWasm) {
    overrides['sliding_window_size'] = slidingWindowSize;
    overrides['attention_sink_size'] = vramConfig.attention_sink_size ?? 4;
    console.log(`[DynamicContext] Sliding window enabled: ${slidingWindowSize} tokens (+ ${vramConfig.attention_sink_size ?? 4} sink tokens)`);
  }

  // KV Cache quantization — enable for 7B/8B by default when set to 'auto'
  const modelSize = getModelSize(modelId);
  const kvMode = vramConfig.kv_cache_quantization;

  if (kvMode !== 'none') {
    const shouldEnable = kvMode === 'auto'
      ? (modelSize === '7b' || modelSize === '8b') && detectKVCacheSupport()
      : true;

    if (shouldEnable) {
      const quantType = kvMode === 'auto' ? 'int8' : kvMode;
      // Pass as override — WebLLM will use it if supported, ignore otherwise
      overrides['kv_cache_quantization'] = quantType;
      console.log(`[DynamicContext] KV cache quantization: ${quantType} for ${modelId}`);
    }
  }

  return overrides;
}
