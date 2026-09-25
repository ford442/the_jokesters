/**
 * MLC engine creation: `CreateMLCEngine` + WebGPU `maxBufferSize` intercept +
 * GPU device-lost race + weight/wasm failover + OOM step-down.
 *
 * Runtime: by default the engine lives in a Web Worker (`worker/mlc.worker.ts`) so
 * prefill/decode never block Three.js rAF; `?legacyLlm` (or no `Worker`) keeps the
 * in-process `CreateMLCEngine`. Context policy, failover and OOM retries are identical
 * for both — only the final create step differs (`createEngineForRuntime`).
 *
 * Split out of the former `utils/dynamicContext.ts` god-file (#345).
 * Context policy lives in `utils/vramOverrides.ts`; source failover and the
 * `model_lib` HEAD probe live in `config/loadFailover.ts`.
 */
import * as webllm from '@mlc-ai/web-llm';
import { buildComedyLogitProcessorRegistry } from './webllmComedyExtensions';
import { deviceLostErrorMessage, interceptWebGpuAdapterLimits } from './webgpuLimits';
import {
  MlcWorkerStartupError,
  createMlcWorkerEngine,
  resolveMlcRuntime,
  type JokestersWorkerMLCEngine,
  type MlcRuntime,
} from './worker/mlcWorkerEngine';
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

/** Either the in-process engine or the Web Worker client — same chat/interrupt/unload API. */
export type MlcEngineHandle = webllm.MLCEngine | JokestersWorkerMLCEngine;

export interface MlcCreateOptions {
  /** Defaults to `resolveMlcRuntime()` (worker unless `?legacyLlm` / no Worker). */
  runtime?: MlcRuntime;
}

/** Effective (post-clamp) context window per created engine, for either runtime. */
const effectiveContextByEngine = new WeakMap<object, number>();

/**
 * Context window the engine was actually created with. Works for the worker client,
 * whose `chatOpts` is an array rather than the object main-thread callers expect.
 */
export function getMlcEngineContextWindow(engine: unknown): number | undefined {
  if (!engine || typeof engine !== 'object') return undefined;
  const recorded = effectiveContextByEngine.get(engine);
  if (recorded) return recorded;
  const chatOpts = (engine as { chatOpts?: unknown }).chatOpts;
  const first = Array.isArray(chatOpts) ? chatOpts[0] : chatOpts;
  const fromOpts = (first as { context_window_size?: number } | undefined)?.context_window_size;
  return typeof fromOpts === 'number' && fromOpts > 0 ? fromOpts : undefined;
}

type EngineCreateConfig = Pick<webllm.MLCEngineConfig, 'appConfig' | 'initProgressCallback'>;

/**
 * Main-thread create: patch `navigator.gpu` for max buffer limits and race
 * `CreateMLCEngine` against GPU device loss so OOM during init hits the retry chain.
 */
async function createMainThreadEngine(
  modelId: string,
  engineConfig: EngineCreateConfig,
  chatOpts: webllm.ChatOptions,
): Promise<webllm.MLCEngine> {
  let deviceLostRejectFn: ((err: Error) => void) | null = null;
  const deviceLostRace = new Promise<never>((_, reject) => {
    deviceLostRejectFn = reject;
  });

  const nav = navigator as unknown as { gpu: Parameters<typeof interceptWebGpuAdapterLimits>[0] };
  const restoreRequestAdapter = interceptWebGpuAdapterLimits(nav.gpu, (info) => {
    deviceLostRejectFn?.(new Error(deviceLostErrorMessage(info)));
  });

  try {
    return await Promise.race([
      webllm.CreateMLCEngine(
        modelId,
        {
          ...engineConfig,
          logitProcessorRegistry: buildComedyLogitProcessorRegistry(modelId) as
            | Map<string, webllm.LogitProcessor>
            | undefined,
        },
        chatOpts,
      ),
      deviceLostRace,
    ]);
  } finally {
    restoreRequestAdapter();
    deviceLostRejectFn = null; // Prevent late device-lost events from propagating
  }
}

async function createEngineForRuntime(
  runtime: MlcRuntime,
  modelId: string,
  engineConfig: EngineCreateConfig,
  chatOpts: webllm.ChatOptions,
): Promise<MlcEngineHandle> {
  if (runtime === 'worker') {
    // The worker installs its own WebGPU intercept + comedy logit processors and
    // reports device loss back; a failed attempt terminates the worker (frees VRAM).
    return createMlcWorkerEngine(modelId, engineConfig, chatOpts);
  }
  return createMainThreadEngine(modelId, engineConfig, chatOpts);
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
  createOptions: MlcCreateOptions = {},
): Promise<MlcEngineHandle> {
  const loadStarted = performance.now();
  const runtime = createOptions.runtime ?? resolveMlcRuntime();
  const retryOptions: MlcCreateOptions = { ...createOptions, runtime };
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
        retryOptions,
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

  // WebGPU limits fix + device-lost race live in createEngineForRuntime (main thread)
  // or inside the MLC worker (worker runtime).
  try {
    const engine = await createEngineForRuntime(
      runtime,
      modelConfig.model_id,
      {
        initProgressCallback: onProgress,
        appConfig: dynamicAppConfig as unknown as webllm.AppConfig,
      },
      chatOpts as webllm.ChatOptions,
    );
    effectiveContextByEngine.set(engine, effectiveContext);

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
    if (runtime === 'worker' && error instanceof MlcWorkerStartupError) {
      // Worker bundle/CSP/404 problem, not a model problem — replay this exact attempt in-process.
      console.warn(
        `[DynamicContext] ${error.message}. Falling back to main-thread CreateMLCEngine (same as ?legacyLlm).`,
      );
      return loadModelWithDynamicContext(
        { ...modelConfig, skipSourceFailover: true },
        preferredContext,
        onProgress,
        vramConfig,
        { ...createOptions, runtime: 'main' },
      );
    }

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
        retryOptions,
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
        retryOptions,
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
          retryOptions,
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
          retryOptions,
        );
      }
    }

    throw error;
  }
}
