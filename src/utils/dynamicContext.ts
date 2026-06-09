import * as webllm from '@mlc-ai/web-llm';
import { VPS_STORAGE_URL, withMirrorStorageUrls } from '../config/models';

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
  messageCount: number;
  droppedMessages: number;
  hasSummary: boolean;
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

  constructor(maxContextTokens: number) {
    this.maxContextTokens = maxContextTokens;
  }

  /** Update context window budget (e.g. after model reload with different context) */
  setMaxContextTokens(tokens: number): void {
    this.maxContextTokens = tokens;
  }

  getMaxContextTokens(): number {
    return this.maxContextTokens;
  }

  /**
   * Estimate token count for a string.
   * Uses the common ~4 chars/token heuristic used throughout the codebase.
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
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
    const systemTokens = DynamicContextManager.estimateTokens(systemMessage);
    const budget = this.maxContextTokens - systemTokens - reserveTokens;

    // If the budget is too small even for a single message, return system only
    if (budget <= 0) {
      return {
        messages: [{ role: 'system', content: systemMessage }],
        info: {
          maxTokens: this.maxContextTokens,
          usedTokens: systemTokens,
          messageCount: 1,
          droppedMessages: history.length,
          hasSummary: false,
        },
      };
    }

    // Walk history from newest to oldest, accumulating tokens
    let usedTokens = 0;
    const kept: ChatMessage[] = [];

    for (let i = history.length - 1; i >= 0; i--) {
      const msgTokens = DynamicContextManager.estimateTokens(history[i].content);
      if (usedTokens + msgTokens > budget) break;
      usedTokens += msgTokens;
      kept.unshift(history[i]);
    }

    const droppedCount = history.length - kept.length;

    // Build summary stub for discarded messages so the model keeps continuity
    const result: ChatMessage[] = [{ role: 'system', content: systemMessage }];
    let hasSummary = false;

    if (droppedCount > 0) {
      const stub = this.buildSummaryStub(history.slice(0, droppedCount));
      result.push({ role: 'system', content: stub });
      usedTokens += DynamicContextManager.estimateTokens(stub);
      hasSummary = true;
      this.summaryStub = stub;
    }

    result.push(...kept);

    return {
      messages: result,
      info: {
        maxTokens: this.maxContextTokens,
        usedTokens: systemTokens + usedTokens,
        messageCount: result.length,
        droppedMessages: droppedCount,
        hasSummary,
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
 * Estimate available VRAM
 */
export async function estimateAvailableVRAM(): Promise<number> {
  const nav = navigator as any;
  if (!nav.gpu) return 2048;

  try {
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) return 2048;
    
    // Try test allocations
    const device = await adapter.requestDevice();
    const testSizes = [4, 3, 2, 1.5, 1];
    
    for (const sizeGB of testSizes) {
      try {
        const testBuffer = device.createBuffer({
          size: sizeGB * 1024 * 1024 * 1024,
          usage: 32 // GPUBufferUsage.STORAGE is 32 in WebGPU
        });
        testBuffer.destroy();
        return sizeGB * 1024;
      } catch { /* continue */ }
    }
    return 1024;
  } catch {
    return 2048;
  }
}

/**
 * Get context config based on VRAM and model size
 */
export function getContextConfigForVRAM(
  vramMB: number,
  modelParams: '3b' | '7b' | '8b' = '7b'
): ContextConfig {
  const configs: Record<string, ContextConfig[]> = {
    '3b': [
      { context_window_size: 2048, prefill_chunk_size: 1024, vram_estimate_mb: 2500, label: 'balanced' },
      { context_window_size: 4096, prefill_chunk_size: 1024, vram_estimate_mb: 3000, label: 'full' },
    ],
    '7b': [
      { context_window_size: 128, prefill_chunk_size: 128, vram_estimate_mb: 2800, label: 'minimal' },
      { context_window_size: 256, prefill_chunk_size: 256, vram_estimate_mb: 3100, label: 'compact' },
      { context_window_size: 512, prefill_chunk_size: 512, vram_estimate_mb: 3500, label: 'balanced' },
      { context_window_size: 1024, prefill_chunk_size: 1024, vram_estimate_mb: 4000, label: 'standard' },
      { context_window_size: 2048, prefill_chunk_size: 1024, vram_estimate_mb: 5500, label: 'extended' },
      { context_window_size: 4096, prefill_chunk_size: 1024, vram_estimate_mb: 8000, label: 'full' },
    ],
    '8b': [
      { context_window_size: 512, prefill_chunk_size: 512, vram_estimate_mb: 5200, label: 'balanced' },
      { context_window_size: 1024, prefill_chunk_size: 1024, vram_estimate_mb: 6000, label: 'standard' },
      { context_window_size: 2048, prefill_chunk_size: 1024, vram_estimate_mb: 7500, label: 'extended' },
    ],
  };

  const modelConfigs = configs[modelParams];
  const safeVRAM = vramMB * 0.8;
  
  for (const config of modelConfigs) {
    if (config.vram_estimate_mb <= safeVRAM) {
      return config;
    }
  }
  return modelConfigs[0];
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
): Record<string, unknown> {
  const overrides: Record<string, unknown> = {
    ...baseOverrides,
    context_window_size: contextSize,
    prefill_chunk_size: vramConfig.prefill_chunk_size > 0
      ? Math.min(vramConfig.prefill_chunk_size, contextSize)
      : Math.min(contextSize, 1024),
  };

  // Sliding window attention — enable if explicitly set (> 0) or auto-detect for large contexts
  const slidingWindowSize = vramConfig.sliding_window_size === -1
    ? Math.floor(contextSize / 2)  // Auto: half the context window
    : vramConfig.sliding_window_size;
  
  if (slidingWindowSize > 0) {
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

function isLikelyNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('cache.add') ||
    lower.includes('err_failed') ||
    lower.includes('timeout') ||
    lower.includes('aborted') && lower.includes('fetch')
  );
}

/**
 * Main function: Load model with dynamic context and VRAM optimizations
 */
export async function loadModelWithDynamicContext(
  modelConfig: any,
  preferredContext: number | 'auto' = 'auto',
  onProgress?: (report: webllm.InitProgressReport) => void,
  vramConfig: VRAMOptimizationConfig = DEFAULT_VRAM_CONFIG,
): Promise<webllm.MLCEngine> {
  
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
    contextSize = preferredContext as number;
    console.log(`[DynamicContext] User-selected ${contextSize} context`);
  }

  // Build overrides with VRAM optimizations
  const overrides = buildVRAMOverrides(
    modelConfig.overrides || {},
    contextSize,
    vramConfig,
    modelConfig.model_id,
  );

  const dynamicAppConfig: any = {
    model_list: [{
      ...modelConfig,
      overrides,
    }],
  };

  const chatOpts: Record<string, unknown> = {
    context_window_size: contextSize,
    prefill_chunk_size: overrides['prefill_chunk_size'],
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

    // On OOM, retry with smaller context and optionally lower KV cache quantization
    if (errorMsg.includes('memory') || errorMsg.includes('OOM') || errorMsg.includes('createBuffer')) {
      // For 7B models (like Vicuna), don't go below 512; for 3B models, 256 is minimum
      const isSmallModel = modelConfig.model_id.toLowerCase().includes('3b');
      const minContext = isSmallModel ? 256 : 512;
      
      if (contextSize > minContext) {
        const smallerContext = contextSize > 2048 ? 1024 : contextSize > 512 ? minContext : minContext;
        console.warn(`[DynamicContext] OOM with ${contextSize}, retrying with ${smallerContext}`);
        
        await new Promise(r => setTimeout(r, 500));
        // @ts-ignore
        if (typeof gc !== 'undefined') gc();

        return loadModelWithDynamicContext(modelConfig, smallerContext, onProgress, vramConfig);
      }

      if (vramConfig.kv_cache_quantization === 'none') {
        console.warn('[DynamicContext] OOM at minimum context, retrying with KV cache quantization');
        return loadModelWithDynamicContext(modelConfig, minContext, onProgress, { ...vramConfig, kv_cache_quantization: 'int8' });
      }
    }

    // Retry via mirror host (storage.noahcohn.com) when primary VPS fetch fails
    const onPrimaryHost = typeof modelConfig.model === 'string' && modelConfig.model.includes(VPS_STORAGE_URL);
    const alreadyMirrored = Boolean((modelConfig as { _mirrorAttempted?: boolean })._mirrorAttempted);
    if (onPrimaryHost && !alreadyMirrored && isLikelyNetworkError(errorMsg)) {
      console.warn('[DynamicContext] Primary storage failed, retrying via mirror host...');
      const mirrorConfig = { ...withMirrorStorageUrls(modelConfig), _mirrorAttempted: true };
      return loadModelWithDynamicContext(mirrorConfig, preferredContext, onProgress, vramConfig);
    }

    throw error;
  }
}
