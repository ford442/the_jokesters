/**
 * MLC engine creation: `CreateMLCEngine` + WebGPU `maxBufferSize` intercept +
 * GPU device-lost race + weight/wasm failover + OOM step-down.
 *
 * Split out of the former `utils/dynamicContext.ts` god-file (#345).
 * Context policy lives in `utils/vramOverrides.ts`; source failover and the
 * `model_lib` HEAD probe live in `config/loadFailover.ts`.
 */
import * as webllm from '@mlc-ai/web-llm';
import { buildComedyLogitProcessorRegistry } from './webllmComedyExtensions';
import { categorizeChatError } from '../chat/chatErrors';
import {
  DEFAULT_VRAM_CONFIG,
  buildVRAMOverrides,
  clampContextToCompiledMax,
  estimateAvailableVRAM,
  getContextConfigForVRAM,
  getModelSize,
  type VRAMOptimizationConfig,
} from '../utils/vramOverrides';
import {
  applyHfWeightFailover,
  applyVpsWeightRestore,
  decideWeightFailover,
  inferLoadSourceFromUrl,
  parseLastLoadSource,
  preferredStartSource,
  recordLoadTelemetry,
  resolveModelLibUrl,
  consumeForceHfSource,
  LAST_LOAD_SOURCE_KEY,
  type LoadSource,
} from '../config/loadFailover';

/** Model config shape used by loadModelWithDynamicContext (legacy + unified MLC path). */
export interface DynamicModelConfig {
  model_id: string;
  model: string;
  model_lib: string;
  hf_fallback_url?: string;
  requestedModelId?: string;
  loadSource?: LoadSource;
  skipSourceFailover?: boolean;
  triedSources?: LoadSource[];
  /** Snapshot of the VPS URLs so an HF-first attempt can reverse-failover. */
  vpsRestore?: {
    model_id: string;
    model: string;
    model_lib: string;
    overrides?: Record<string, unknown>;
  };
  overrides?: Record<string, unknown>;
  vram_required_MB?: number;
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
  const loadStarted = performance.now();
  const requestedId = modelConfig.requestedModelId ?? modelConfig.model_id;
  const originalVps = {
    model_id: modelConfig.model_id,
    model: modelConfig.model,
    model_lib: modelConfig.model_lib,
    overrides: modelConfig.overrides,
  };

  if (!modelConfig.skipSourceFailover) {
    let last = null as ReturnType<typeof parseLastLoadSource>;
    try {
      last = parseLastLoadSource(localStorage.getItem(LAST_LOAD_SOURCE_KEY));
    } catch {
      last = null;
    }
    const forceHf = consumeForceHfSource()
    const start = preferredStartSource(requestedId, last, { forceHf })
    if (start === 'hf' && inferLoadSourceFromUrl(modelConfig.model) !== 'hf') {
      onProgress?.({
        progress: 0,
        timeElapsed: 0,
        text: forceHf
          ? 'Retrying Vicuna from Hugging Face…'
          : 'Last successful Vicuna load was Hugging Face — starting there…',
      });
      return loadModelWithDynamicContext(
        {
          ...applyHfWeightFailover({ ...modelConfig, requestedModelId: requestedId }),
          skipSourceFailover: true,
          vpsRestore: originalVps,
        },
        preferredContext,
        onProgress,
        vramConfig,
      );
    }
  }

  const currentSource: LoadSource = modelConfig.loadSource ?? inferLoadSourceFromUrl(modelConfig.model);
  recordLoadTelemetry({
    modelId: requestedId,
    source: currentSource,
    phase: 'start',
    ms: 0,
  });

  if (currentSource === 'vps') {
    onProgress?.({
      progress: 0,
      timeElapsed: 0,
      text: 'Rewriting VPS model URLs…',
    });
  }

  onProgress?.({
    progress: 0,
    timeElapsed: 0,
    text: 'Probing model WASM library…',
  });
  recordLoadTelemetry({
    modelId: requestedId,
    source: currentSource,
    phase: 'wasm_probe',
    ms: Math.round(performance.now() - loadStarted),
  });

  const { url: resolvedModelLib, compiledMaxContext, usedFallback } =
    await resolveModelLibUrl(modelConfig.model_lib);

  recordLoadTelemetry({
    modelId: requestedId,
    source: currentSource,
    phase: 'engine',
    ms: Math.round(performance.now() - loadStarted),
  });

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
    recordLoadTelemetry({
      modelId: requestedId,
      source: currentSource,
      phase: 'success',
      ms: Math.round(performance.now() - loadStarted),
    });
    try {
      localStorage.setItem(
        LAST_LOAD_SOURCE_KEY,
        JSON.stringify({
          modelId: requestedId,
          source: currentSource,
          wasmFallback: usedFallback,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* ignore quota */
    }
    return engine;

  } catch (error: any) {
    cleanup();
    
    const errorMsg = error?.message || String(error);
    const category = categorizeChatError(error);
    const tried = [...(modelConfig.triedSources ?? []), currentSource];
    const action = decideWeightFailover({
      modelId: requestedId,
      currentSource,
      category,
      tried,
    });

    recordLoadTelemetry({
      modelId: requestedId,
      source: currentSource,
      phase: 'fail',
      ms: Math.round(performance.now() - loadStarted),
      errorCategory: category,
    });

    if (action === 'retry_hf') {
      console.warn(
        `[DynamicContext] ${category} on VPS Vicuna (${errorMsg}). Retrying once from Hugging Face Hub.`,
      );
      onProgress?.({
        progress: 0,
        timeElapsed: 0,
        text: 'Download failed on VPS. Retrying Vicuna from Hugging Face…',
      });
      recordLoadTelemetry({
        modelId: requestedId,
        source: 'hf',
        phase: 'hf_retry',
        ms: Math.round(performance.now() - loadStarted),
        errorCategory: category,
      });
      return loadModelWithDynamicContext(
        {
          ...applyHfWeightFailover({ ...modelConfig, requestedModelId: requestedId }),
          triedSources: tried,
          skipSourceFailover: true,
          vpsRestore: modelConfig.vpsRestore ?? originalVps,
        },
        contextSize,
        onProgress,
        vramConfig,
      );
    }

    if (action === 'retry_vps') {
      console.warn(
        `[DynamicContext] ${category} on Hugging Face Vicuna (${errorMsg}). Retrying VPS.`,
      );
      onProgress?.({
        progress: 0,
        timeElapsed: 0,
        text: 'Hugging Face download failed. Retrying Vicuna from storage.1ink.us…',
      });
      recordLoadTelemetry({
        modelId: requestedId,
        source: 'vps',
        phase: 'vps_retry',
        ms: Math.round(performance.now() - loadStarted),
        errorCategory: category,
      });
      return loadModelWithDynamicContext(
        {
          ...applyVpsWeightRestore(
            { ...modelConfig, requestedModelId: requestedId },
            modelConfig.vpsRestore ?? originalVps,
          ),
          triedSources: tried,
          skipSourceFailover: true,
        },
        contextSize,
        onProgress,
        vramConfig,
      );
    }

    // On OOM, retry with smaller context and optionally force KV cache quantization
    if (category === 'oom' || errorMsg.includes('memory') || errorMsg.includes('OOM') || errorMsg.includes('createBuffer')) {
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

        return loadModelWithDynamicContext(
          { ...modelConfig, skipSourceFailover: true },
          smallerContext,
          onProgress,
          vramConfig,
        );
      }

      // Already at floor — try forcing int8 KV quantization as the last resort
      if (vramConfig.kv_cache_quantization === 'none' || vramConfig.kv_cache_quantization === 'auto') {
        console.warn('[DynamicContext] OOM at minimum context — forcing int8 KV cache quantization and retrying');
        return loadModelWithDynamicContext(
          { ...modelConfig, skipSourceFailover: true },
          oomFloor,
          onProgress,
          { ...vramConfig, kv_cache_quantization: 'int8' },
        );
      }
    }

    throw error;
  }
}
