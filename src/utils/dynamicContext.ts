import * as webllm from '@mlc-ai/web-llm';

/**
 * VRAM Detection & Dynamic Context Scaling
 * 
 * Automatically reduces context window based on available GPU memory.
 * Same model files, different memory allocation at runtime.
 */

export interface ContextConfig {
  context_window_size: number;
  prefill_chunk_size: number;
  vram_estimate_mb: number;
  label: string;
}

/**
 * Estimate available VRAM using WebGPU adapter info
 */
export async function estimateAvailableVRAM(): Promise<number> {
  if (!navigator.gpu) {
    console.warn('[VRAM] WebGPU not available');
    return 2048; // Conservative fallback
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.warn('[VRAM] No GPU adapter found');
      return 2048;
    }

    // Try to get adapter info (may not be available in all browsers)
    const info = await adapter.requestAdapterInfo?.();
    
    // Parse device name for rough VRAM estimation
    const deviceName = (info?.description || info?.device || '').toLowerCase();
    
    // Rough heuristics based on common GPUs
    if (deviceName.includes('rtx 4090') || deviceName.includes('rtx 3090')) return 24000;
    if (deviceName.includes('rtx 4080') || deviceName.includes('rtx 3080')) return 16000;
    if (deviceName.includes('rtx 4070') || deviceName.includes('rtx 3070')) return 12000;
    if (deviceName.includes('rtx 4060') || deviceName.includes('rtx 3060')) return 8000;
    if (deviceName.includes('rtx 3050')) return 4000;
    if (deviceName.includes('gtx 1660') || deviceName.includes('gtx 1060')) return 6000;
    if (deviceName.includes('m1 pro') || deviceName.includes('m2 pro')) return 16000;
    if (deviceName.includes('m1') || deviceName.includes('m2')) return 8000;
    if (deviceName.includes('integrated') || deviceName.includes('intel')) return 4096;
    
    // If we can't detect, try a test allocation
    const device = await adapter.requestDevice();
    
    // Test progressive buffer allocations
    const testSizes = [4, 3, 2, 1.5, 1]; // GB
    for (const sizeGB of testSizes) {
      try {
        const testBuffer = device.createBuffer({
          size: sizeGB * 1024 * 1024 * 1024,
          usage: GPUBufferUsage.STORAGE
        });
        testBuffer.destroy();
        console.log(`[VRAM] Test allocation passed: ${sizeGB}GB`);
        return sizeGB * 1024;
      } catch {
        console.log(`[VRAM] Test allocation failed: ${sizeGB}GB`);
      }
    }
    
    return 1024; // Very conservative
  } catch (e) {
    console.error('[VRAM] Detection error:', e);
    return 2048;
  }
}

/**
 * Get optimal context configuration based on available VRAM
 */
export function getContextConfigForVRAM(
  vramMB: number,
  modelType: 'vicuna-7b' | 'llama-8b' | 'llama-3b' = 'vicuna-7b'
): ContextConfig {
  const configs: Record<string, ContextConfig[]> = {
    'vicuna-7b': [
      { context_window_size: 128, prefill_chunk_size: 128, vram_estimate_mb: 2800, label: 'minimal' },
      { context_window_size: 256, prefill_chunk_size: 256, vram_estimate_mb: 3100, label: 'compact' },
      { context_window_size: 512, prefill_chunk_size: 512, vram_estimate_mb: 3500, label: 'balanced' },
      { context_window_size: 1024, prefill_chunk_size: 1024, vram_estimate_mb: 4000, label: 'standard' },
      { context_window_size: 2048, prefill_chunk_size: 1024, vram_estimate_mb: 5500, label: 'extended' },
      { context_window_size: 4096, prefill_chunk_size: 1024, vram_estimate_mb: 8000, label: 'full' },
    ],
    'llama-8b': [
      { context_window_size: 512, prefill_chunk_size: 512, vram_estimate_mb: 5200, label: 'balanced' },
      { context_window_size: 1024, prefill_chunk_size: 1024, vram_estimate_mb: 6000, label: 'standard' },
    ],
    'llama-3b': [
      { context_window_size: 2048, prefill_chunk_size: 1024, vram_estimate_mb: 2500, label: 'standard' },
      { context_window_size: 4096, prefill_chunk_size: 1024, vram_estimate_mb: 3000, label: 'full' },
    ],
  };

  const modelConfigs = configs[modelType] || configs['vicuna-7b'];
  
  // Find the best config that fits in available VRAM
  // Use 80% of reported VRAM to leave headroom
  const safeVRAM = vramMB * 0.8;
  
  for (const config of modelConfigs) {
    if (config.vram_estimate_mb <= safeVRAM) {
      return config;
    }
  }
  
  // Fallback to smallest
  return modelConfigs[0];
}

/**
 * Model configs with dynamic context scaling
 */
export const DYNAMIC_MODELS = {
  VICUNA_7B_Q4F32_DYNAMIC: {
    model_id: 'ford442/vicuna-7b-q4f32-webllm',
    model: 'https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/',
    model_lib: 'https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/vicuna-7b-q4f32-webgpu.wasm',
    // Default/fallback values - will be overridden at runtime
    vram_required_MB: 3500,
    recommended_for: ['dynamic', 'custom'],
  },
};

/**
 * Create engine config with dynamic context based on VRAM
 */
export async function createDynamicEngineConfig(
  modelId: string = 'ford442/vicuna-7b-q4f32-webllm'
): Promise<{ appConfig: webllm.AppConfig; chatOpts: Record<string, any> }> {
  const vramMB = await estimateAvailableVRAM();
  const contextConfig = getContextConfigForVRAM(vramMB, 'vicuna-7b');
  
  console.log(`[DynamicContext] Detected ${vramMB}MB VRAM, using ${contextConfig.label} config:`, contextConfig);

  const appConfig: webllm.AppConfig = {
    model_list: [
      {
        model: DYNAMIC_MODELS.VICUNA_7B_Q4F32_DYNAMIC.model,
        model_id: modelId,
        model_lib: DYNAMIC_MODELS.VICUNA_7B_Q4F32_DYNAMIC.model_lib,
        overrides: {
          context_window_size: contextConfig.context_window_size,
          prefill_chunk_size: contextConfig.prefill_chunk_size,
        },
        vram_required_MB: contextConfig.vram_estimate_mb,
      },
    ],
  };

  const chatOpts = {
    context_window_size: contextConfig.context_window_size,
    prefill_chunk_size: contextConfig.prefill_chunk_size,
  };

  return { appConfig, chatOpts };
}

/**
 * Load model with automatic fallback on OOM
 */
export async function loadModelWithFallback(
  preferredModel: string = 'ford442/vicuna-7b-q4f32-webllm',
  onProgress?: (progress: webllm.InitProgressReport) => void
): Promise<webllm.MLCEngine> {
  const vramMB = await estimateAvailableVRAM();
  
  // Try progressively smaller contexts
  const contextOptions = vramMB > 6000 
    ? [1024, 512, 256] 
    : vramMB > 4000 
      ? [512, 256, 128] 
      : [256, 128];

  for (const ctxSize of contextOptions) {
    try {
      console.log(`[LoadModel] Trying ${preferredModel} with context ${ctxSize}...`);
      
      const engine = await webllm.CreateMLCEngine(
        preferredModel,
        {
          initProgressCallback: onProgress,
          appConfig: {
            model_list: [
              {
                model: DYNAMIC_MODELS.VICUNA_7B_Q4F32_DYNAMIC.model,
                model_id: preferredModel,
                model_lib: DYNAMIC_MODELS.VICUNA_7B_Q4F32_DYNAMIC.model_lib,
                overrides: {
                  context_window_size: ctxSize,
                  prefill_chunk_size: ctxSize,
                },
              },
            ],
          },
        },
        {
          context_window_size: ctxSize,
          prefill_chunk_size: ctxSize,
        }
      );

      console.log(`[LoadModel] Success! Context: ${ctxSize}`);
      return engine;
      
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      
      if (errorMsg.includes('out of memory') || 
          errorMsg.includes('OOM') || 
          errorMsg.includes('createBuffer') ||
          errorMsg.includes('allocation')) {
        console.warn(`[LoadModel] OOM with context ${ctxSize}, trying smaller...`);
        
        // Force GPU cleanup
        if (typeof gc !== 'undefined') gc();
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      
      // Non-OOM error, rethrow
      throw error;
    }
  }

  throw new Error('Failed to load model even with minimum context (128)');
}

/**
 * UI helper: Get human-readable context label
 */
export function getContextLabel(contextSize: number): string {
  const labels: Record<number, string> = {
    128: 'Minimal (128 tokens)',
    256: 'Compact (256 tokens)',
    512: 'Balanced (512 tokens)',
    1024: 'Standard (1K tokens)',
    2048: 'Extended (2K tokens)',
    4096: 'Full (4K tokens)',
  };
  return labels[contextSize] || `${contextSize} tokens`;
}

/**
 * Manual context override (for user settings)
 */
export function createManualContextConfig(
  contextSize: 128 | 256 | 512 | 1024 | 2048 | 4096
): { appConfig: webllm.AppConfig; chatOpts: Record<string, any> } {
  return {
    appConfig: {
      model_list: [
        {
          model: DYNAMIC_MODELS.VICUNA_7B_Q4F32_DYNAMIC.model,
          model_id: DYNAMIC_MODELS.VICUNA_7B_Q4F32_DYNAMIC.model_id,
          model_lib: DYNAMIC_MODELS.VICUNA_7B_Q4F32_DYNAMIC.model_lib,
          overrides: {
            context_window_size: contextSize,
            prefill_chunk_size: Math.min(contextSize, 1024),
          },
        },
      ],
    },
    chatOpts: {
      context_window_size: contextSize,
      prefill_chunk_size: Math.min(contextSize, 1024),
    },
  };
}
