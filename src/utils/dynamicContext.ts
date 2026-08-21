import { buildComedyLogitProcessorRegistry } from '../llm/webllmComedyExtensions';
import type { TokenEstimator, TokenEstimationSource } from './tokenEstimator';
import { HeuristicTokenEstimator } from './tokenEstimator';
import * as webllm from '@mlc-ai/web-llm';

export interface ContextConfig {
  context_window_size: number;
  prefill_chunk_size: number;
  vram_estimate_mb: number;
  label: string;
}

// ============================================================================
// VRAM Optimization Overrides
// ============================================================================

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

/** Model config shape used by loadModelWithDynamicContext (legacy + unified MLC path). */
export interface DynamicModelConfig {
  model_id: string;
  model: string;
  model_lib: string;
  /** Generic 4K .wasm used when custom model_lib is not yet hosted on VPS */
  model_lib_fallback?: string;
  hf_fallback_url?: string;
  overrides?: Record<string, unknown>;
  vram_required_MB?: number;
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
// Token-Level Context Manager
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Status information about the current context window */
export interface ContextWindowInfo {
  maxTokens: number;
  usedTokens: number;
  reserveTokens: number;
  messageCount: number;
  droppedMessages: number;
  hasSummary: boolean;
  summaryStub?: string;
  estimationSource: TokenEstimationSource;
  /** User/scene message-depth budget (soft limit before token truncation). */
  messageDepthLimit: number;
  /** Messages included after depth slicing (excludes system/summary). */
  messagesInWindow: number;
  /** One-turn director override label, if any. */
  memoryHintApplied?: string;
}

/**
 * Token-level context window manager.
 *
 * Replaces the old fixed-message-count truncation with a token-budget approach
 * that preserves the system prompt, adds a summary stub for discarded history,
 * and returns metadata for the UI.
 */
export class DynamicContextManager {
  private maxContextTokens: number;
  private summaryStub: string | null = null;
  private tokenEstimator: TokenEstimator;

  constructor(maxContextTokens: number, tokenEstimator?: TokenEstimator) {
    this.maxContextTokens = maxContextTokens;
    this.tokenEstimator = tokenEstimator ?? new HeuristicTokenEstimator();
  }

  /** Replace the token estimator (e.g. after model load exposes a real tokenizer). */
  setTokenEstimator(estimator: TokenEstimator): void {
    this.tokenEstimator = estimator;
  }

  getTokenEstimator(): TokenEstimator {
    return this.tokenEstimator;
  }

  /** Update context window budget (e.g. after model reload with different context) */
  setMaxContextTokens(tokens: number): void {
    this.maxContextTokens = tokens;
  }

  getMaxContextTokens(): number {
    return this.maxContextTokens;
  }

  /**
   * Estimate token count for a string using the active estimator chain.
   */
  estimateTokens(text: string): number {
    return this.tokenEstimator.estimateText(text);
  }

  /** @deprecated Use instance estimateTokens() — kept for tests and legacy callers. */
  static estimateTokens(text: string): number {
    return new HeuristicTokenEstimator().estimateText(text);
  }

  /**
   * Truncate a conversation to fit within the token budget.
   *
   * Priority order:
   *  1. System message (always kept)
   *  2. Summary stub of discarded history (if any messages were dropped)
   *  3. Most recent conversation messages, newest first
   *
   * @param systemMessage The full system prompt (always preserved)
   * @param history       The conversation history (user/assistant turns)
   * @param reserveTokens Tokens to reserve for generation output (default 128)
   * @returns The truncated message array and context window info
   */
  truncate(
    systemMessage: string,
    history: ChatMessage[],
    reserveTokens = 128,
  ): { messages: ChatMessage[]; info: ContextWindowInfo } {
    const baseInfo = {
      messageDepthLimit: history.length,
      messagesInWindow: history.length,
    };
    const systemTokens = this.estimateTokens(systemMessage);
    const budget = this.maxContextTokens - systemTokens - reserveTokens;
    const estimationSource = this.tokenEstimator.getSource();

    if (budget <= 0) {
      return {
        messages: [{ role: 'system', content: systemMessage }],
        info: {
          maxTokens: this.maxContextTokens,
          usedTokens: systemTokens,
          reserveTokens,
          messageCount: 1,
          droppedMessages: history.length,
          hasSummary: false,
          estimationSource,
          ...baseInfo,
          messagesInWindow: 0,
        },
      };
    }

    let usedTokens = 0;
    const kept: ChatMessage[] = [];

    for (let i = history.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateTokens(history[i].content);
      if (usedTokens + msgTokens > budget) break;
      usedTokens += msgTokens;
      kept.unshift(history[i]);
    }

    const droppedCount = history.length - kept.length;
    const result: ChatMessage[] = [{ role: 'system', content: systemMessage }];
    let hasSummary = false;
    let summaryStubText: string | undefined;

    if (droppedCount > 0) {
      let stub = this.buildSummaryStub(history.slice(0, droppedCount));
      let stubTokens = this.estimateTokens(stub);

      // Ensure summary stub fits — drop oldest kept turns if needed
      while (kept.length > 0 && usedTokens + stubTokens > budget) {
        const removed = kept.shift();
        if (removed) {
          usedTokens -= this.estimateTokens(removed.content);
        }
      }

      // Recompute drop count if we evicted additional kept messages for the stub
      const finalDropped = history.length - kept.length;
      if (finalDropped > droppedCount) {
        stub = this.buildSummaryStub(history.slice(0, finalDropped));
        stubTokens = this.estimateTokens(stub);
      }

      if (stubTokens > budget) {
        stub = `[Earlier conversation: ${finalDropped} messages omitted to fit context window.]`;
        stubTokens = this.estimateTokens(stub);
      }

      result.push({ role: 'system', content: stub });
      usedTokens += stubTokens;
      hasSummary = true;
      summaryStubText = stub;
      this.summaryStub = stub;
    } else {
      this.summaryStub = null;
    }

    result.push(...kept);

    return {
      messages: result,
      info: {
        maxTokens: this.maxContextTokens,
        usedTokens: systemTokens + usedTokens,
        reserveTokens,
        messageCount: result.length,
        droppedMessages: history.length - kept.length,
        hasSummary,
        summaryStub: summaryStubText,
        estimationSource,
        ...baseInfo,
        messagesInWindow: kept.length,
      },
    };
  }

  /** Get the last summary stub (for UI display) */
  getLastSummaryStub(): string | null {
    return this.summaryStub;
  }

  private static readonly SUMMARY_SNIPPET_LENGTH = 80;

  /**
   * Build a short summary of dropped messages so the system prompt maintains
   * continuity. This is a deterministic stub — an LLM-generated summary could
   * replace it in the future.
   */
  private buildSummaryStub(dropped: ChatMessage[]): string {
    const turnCount = dropped.length;
    const lastUser = [...dropped].reverse().find(m => m.role === 'user');
    const lastAssistant = [...dropped].reverse().find(m => m.role === 'assistant');
    let stub = `[Earlier conversation: ${turnCount} messages omitted to fit context window.`;
    if (lastUser) {
      const snippet = lastUser.content.slice(0, DynamicContextManager.SUMMARY_SNIPPET_LENGTH).replace(/\n/g, ' ');
      stub += ` Last user topic: "${snippet}…"`;
    }
    if (lastAssistant) {
      const snippet = lastAssistant.content.slice(0, DynamicContextManager.SUMMARY_SNIPPET_LENGTH).replace(/\n/g, ' ');
      stub += ` Last response: "${snippet}…"`;
    }
    stub += ']';
    return stub;
  }
}

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
 * HEAD-probe model_lib URL; fall back to generic 4K .wasm when custom artifact
 * is not yet published on the VPS.
 */
export async function resolveModelLibUrl(
  modelLib: string,
  fallbackModelLib?: string,
): Promise<{ url: string; usedFallback: boolean; compiledMaxContext: number | null }> {
  const probe = async (url: string): Promise<boolean> => {
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      return resp.ok;
    } catch {
      return false;
    }
  };

  if (await probe(modelLib)) {
    return {
      url: modelLib,
      usedFallback: false,
      compiledMaxContext: parseCompiledMaxContextFromModelLib(modelLib),
    };
  }

  if (fallbackModelLib && fallbackModelLib !== modelLib && (await probe(fallbackModelLib))) {
    console.warn(
      `[DynamicContext] Custom model_lib not hosted (${modelLib}) — ` +
      `using fallback ${fallbackModelLib}`
    );
    return {
      url: fallbackModelLib,
      usedFallback: true,
      compiledMaxContext: parseCompiledMaxContextFromModelLib(fallbackModelLib),
    };
  }

  console.warn(`[DynamicContext] model_lib HEAD probe failed for ${modelLib}; proceeding anyway`);
  return {
    url: modelLib,
    usedFallback: false,
    compiledMaxContext: parseCompiledMaxContextFromModelLib(modelLib),
  };
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

// ============================================================================
// Model Loading
// ============================================================================

/**
 * Main function: Load model with dynamic context and VRAM optimizations
 */
export async function loadModelWithDynamicContext(
  modelConfig: DynamicModelConfig,
  preferredContext: number | 'auto' = 'auto',
  onProgress?: (report: webllm.InitProgressReport) => void,
  vramConfig: VRAMOptimizationConfig = DEFAULT_VRAM_CONFIG,
): Promise<webllm.MLCEngine> {

  const { url: resolvedModelLib, usedFallback, compiledMaxContext } =
    await resolveModelLibUrl(modelConfig.model_lib, modelConfig.model_lib_fallback);

  if (usedFallback) {
    onProgress?.({
      progress: 0,
      timeElapsed: 0,
      text: 'Custom WASM not hosted yet — using generic 4K runtime (higher peak VRAM)…',
    });
  }

  // Determine context size
  let contextSize: number;
  if (preferredContext === 'auto') {
    // First, check if the model has an explicit context_window_size in overrides
    if (modelConfig.overrides?.context_window_size) {
      contextSize = modelConfig.overrides.context_window_size as number;
      console.log(`[DynamicContext] Using explicit model config context_window_size: ${contextSize}`);
    } else {
      const vramMB = await estimateAvailableVRAM();
      const modelSize = getModelSize(modelConfig.model_id);
      const ctxConfig = getContextConfigForVRAM(vramMB, modelSize);
      contextSize = ctxConfig.context_window_size;
      console.log(`[DynamicContext] Auto-selected ${contextSize} context for ${modelConfig.model_id}`);
    }
  } else {
    contextSize = preferredContext;
    console.log(`[DynamicContext] User-selected ${contextSize} context`);
  }

  contextSize = clampContextToCompiledMax(contextSize, compiledMaxContext);

  // Build overrides with VRAM optimizations
  const overrides = buildVRAMOverrides(
    modelConfig.overrides || {},
    contextSize,
    vramConfig,
    modelConfig.model_id,
    compiledMaxContext,
  );

  const effectiveContext = overrides['context_window_size'] as number;
  const effectivePrefill = overrides['prefill_chunk_size'] as number;

  const dynamicAppConfig: {
    model_list: Array<DynamicModelConfig & { overrides: Record<string, unknown> }>;
  } = {
    model_list: [{
      ...modelConfig,
      model_lib: resolvedModelLib,
      overrides,
    }],
  };

  const chatOpts: Record<string, unknown> = {
    context_window_size: effectiveContext,
    prefill_chunk_size: effectivePrefill,
  };

  // ========================================================================
  // WEBGPU LIMITS FIX: Intercept requestAdapter to force maximum buffer sizes
  // DEVICE-LOST DETECTION: Race CreateMLCEngine against GPU device loss so OOM
  // during initialization is caught and the fallback chain can try the next model.
  // ========================================================================
  const nav = navigator as any;
  const originalRequestAdapter = nav.gpu.requestAdapter.bind(nav.gpu);

  let deviceLostRejectFn: ((err: Error) => void) | null = null;
  const deviceLostRace = new Promise<never>((_, reject) => {
    deviceLostRejectFn = reject;
  });

  nav.gpu.requestAdapter = async function (options?: any) {
    const adapter = await originalRequestAdapter(options);
    if (!adapter) return adapter;

    const originalRequestDevice = adapter.requestDevice.bind(adapter);
    adapter.requestDevice = async function (descriptor: any = {}) {
      const device = await originalRequestDevice({
        ...descriptor,
        requiredLimits: {
          ...descriptor.requiredLimits,
          maxBufferSize: adapter.limits.maxBufferSize, // Forces the 4GB limit
          maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
          maxComputeWorkgroupStorageSize: adapter.limits.maxComputeWorkgroupStorageSize,
        }
      });
      // Monitor for async GPU device loss (OOM after device creation)
      device.lost.then((info: any) => {
        deviceLostRejectFn?.(
          new Error(
            `GPU device lost during model initialization: ${info.message ?? info.reason} — device is lost`
          )
        );
      });
      return device;
    };
    return adapter;
  };

  const cleanup = () => {
    nav.gpu.requestAdapter = originalRequestAdapter;
    deviceLostRejectFn = null; // Prevent late device-lost events from propagating
  };

  // Try to load, racing against GPU device loss
  try {
    const engine = await Promise.race([
      webllm.CreateMLCEngine(
        modelConfig.model_id,
        {
          initProgressCallback: onProgress,
          appConfig: dynamicAppConfig,
          logitProcessorRegistry: buildComedyLogitProcessorRegistry(modelConfig.model_id) as
            | Map<string, unknown>
            | undefined,
        },
        chatOpts
      ),
      deviceLostRace,
    ]);

    cleanup();
    return engine;

  } catch (error: any) {
    cleanup();
    
    const errorMsg = error?.message || String(error);

    // HF Failover for Network / Fetch errors (VPS down or CORS issue)
    if (modelConfig.hf_fallback_url && modelConfig.model !== modelConfig.hf_fallback_url && (errorMsg.toLowerCase().includes('fetch') || errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('failed to fetch'))) {
      console.warn(`[DynamicContext] Primary model load failed: ${errorMsg}. Failing over to HF fallback: ${modelConfig.hf_fallback_url}`);
      onProgress?.({
        progress: 0,
        timeElapsed: 0,
        text: 'Primary server unreachable. Failing over to Hugging Face CDN...',
      });
      // Swap the model URL to the HF fallback and retry
      return loadModelWithDynamicContext(
        { ...modelConfig, model: modelConfig.hf_fallback_url },
        contextSize,
        onProgress,
        vramConfig
      );
    }

    // On OOM, retry with smaller context and optionally force KV cache quantization
    if (errorMsg.includes('memory') || errorMsg.includes('OOM') || errorMsg.includes('createBuffer')) {
      // Floor: 128 for 3B, 256 for 7B/8B (was 512 — lowered for constrained 4 GB GPUs)
      const isSmallModel = modelConfig.model_id.toLowerCase().includes('3b');
      const minContext = isSmallModel ? 128 : 256;

      const oomFloor = compiledMaxContext != null
        ? Math.max(minContext, Math.min(compiledMaxContext, contextSize))
        : minContext;

      if (contextSize > oomFloor) {
        // Halve the context window each OOM retry until we hit the floor
        const smallerContext = Math.max(oomFloor, Math.floor(contextSize / 2));
        if (smallerContext === oomFloor) {
          console.warn(
            `[DynamicContext] OOM — reached minimum context (${oomFloor} tokens) for ${modelConfig.model_id}. ` +
            `Response quality will be very limited. Consider switching to a 3B model if this fails.`
          );
        } else {
          console.warn(`[DynamicContext] OOM with context=${contextSize}, retrying at ${smallerContext}`);
        }

        await new Promise(r => setTimeout(r, 500));
        // @ts-ignore
        if (typeof gc !== 'undefined') gc();

        return loadModelWithDynamicContext(modelConfig, smallerContext, onProgress, vramConfig);
      }

      // Already at floor — try forcing int8 KV quantization as the last resort
      if (vramConfig.kv_cache_quantization === 'none' || vramConfig.kv_cache_quantization === 'auto') {
        console.warn('[DynamicContext] OOM at minimum context — forcing int8 KV cache quantization and retrying');
        return loadModelWithDynamicContext(
          modelConfig, oomFloor, onProgress,
          { ...vramConfig, kv_cache_quantization: 'int8' }
        );
      }
    }

    throw error;
  }
}
