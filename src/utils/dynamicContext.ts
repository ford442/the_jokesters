import * as webllm from '@mlc-ai/web-llm';

export interface ContextConfig {
  context_window_size: number;
  prefill_chunk_size: number;
  vram_estimate_mb: number;
  label: string;
}

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
function getModelSize(modelId: string): '3b' | '7b' | '8b' {
  if (modelId.includes('3B') || modelId.includes('3b')) return '3b';
  if (modelId.includes('8B') || modelId.includes('8b')) return '8b';
  if (modelId.includes('7B') || modelId.includes('7b')) return '7b';
  return '7b'; // default
}

/**
 * Main function: Load model with dynamic context
 */
export async function loadModelWithDynamicContext(
  modelConfig: any, // Using any for ModelRecord as it might not be exported directly
  preferredContext: number | 'auto' = 'auto',
  onProgress?: (report: webllm.InitProgressReport) => void
): Promise<webllm.MLCEngine> {
  
  // Determine context size
  let contextSize: number;

  if (preferredContext === 'auto') {
    const vramMB = await estimateAvailableVRAM();
    const modelSize = getModelSize(modelConfig.model_id);
    const ctxConfig = getContextConfigForVRAM(vramMB, modelSize);
    contextSize = ctxConfig.context_window_size;
    console.log(`[DynamicContext] Auto-selected ${contextSize} context for ${modelConfig.model_id}`);
  } else {
    contextSize = preferredContext as number;
    console.log(`[DynamicContext] User-selected ${contextSize} context`);
  }

  // Build dynamic config
  const dynamicAppConfig: any = { // Using any for AppConfig as it might not be exported directly
    model_list: [{
      ...modelConfig,
      overrides: {
        ...modelConfig.overrides,
        context_window_size: contextSize,
        prefill_chunk_size: Math.min(contextSize, 1024),
      },
    }],
  };

  const chatOpts = {
    context_window_size: contextSize,
    prefill_chunk_size: Math.min(contextSize, 1024),
  };

  // Try to load
  try {
    const engine = await webllm.CreateMLCEngine(
      modelConfig.model_id,
      {
        initProgressCallback: onProgress,
        appConfig: dynamicAppConfig,
      },
      chatOpts
    );
    return engine;

  } catch (error: any) {
    const errorMsg = error?.message || String(error);

    // On OOM, retry with smaller context
    if (errorMsg.includes('memory') || errorMsg.includes('OOM') || errorMsg.includes('createBuffer')) {
      if (contextSize > 128) {
        const smallerContext = contextSize > 512 ? 512 : contextSize > 256 ? 256 : 128;
        console.warn(`[DynamicContext] OOM with ${contextSize}, retrying with ${smallerContext}`);
        
        // Force GC if available
        await new Promise(r => setTimeout(r, 500));
        // @ts-ignore
        if (typeof gc !== 'undefined') gc();

        return loadModelWithDynamicContext(
          modelConfig,
          smallerContext,
          onProgress
        );
      }
    }
    throw error;
  }
}
