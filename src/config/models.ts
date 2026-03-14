import * as webllm from '@mlc-ai/web-llm'

/**
 * Model Configuration with 4-bit Quantization (q4f16_1)
 * 
 * q4f16_1 = 4-bit quantized weights with fp16 compute
 * Benefits:
 * - ~4x memory reduction vs fp16
 * - Faster inference on WebGPU
 * - Minimal quality loss for 8B models
 * 
 * Target performance: 50 tok/sec on mid-tier GPU (GTX 1060 / RTX 3060 / M1)
 */

// Legacy model configs (kept for backward compatibility)
export const hermesModelConfig = {
  model_id: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
  model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
  overrides: {
    context_window_size: 4096,
  },
};

/**
 * OPTIMIZED 4-bit Quantized Models (Recommended)
 * 
 * These models use q4f16_1 quantization:
 * - 4-bit weights for storage
 * - fp16 activations for computation
 * - Optimal for WebGPU inference
 */
export const OPTIMIZED_MODELS = {
  /**
   * Llama-3.1-8B Instruct with 4-bit quantization
   * Best quality/performance tradeoff for mid-tier GPUs
   * VRAM: ~5.2GB
   * Expected speed: 40-60 tok/sec on RTX 3060 / M1 Pro
   */
  LLAMA_3_1_8B_Q4F16: {
    model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 5200,
    recommended_for: ["high_quality", "balanced"],
  },
  
  /**
   * Llama-3.1-8B with reduced 1K context window
   * For lower VRAM systems
   * VRAM: ~4.2GB
   * Expected speed: 50-70 tok/sec on RTX 3060 / M1 Pro
   */
  LLAMA_3_1_8B_Q4F16_1K: {
    model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k",
    model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 1024,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 4200,
    recommended_for: ["speed", "low_vram"],
  },
  
  /**
   * Hermes-3 8B with 4-bit quantization
   * Fine-tuned for instruction following
   * VRAM: ~5.2GB
   * Expected speed: 40-60 tok/sec on RTX 3060 / M1 Pro
   */
  HERMES_3_8B_Q4F16: {
    model_id: "Hermes-3-Llama-3.1-8B-q4f16_1-MLC",
    model: "https://huggingface.co/mlc-ai/Hermes-3-Llama-3.1-8B-q4f16_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 5200,
    recommended_for: ["instruction_following", "balanced"],
  },
  
  /**
   * Llama-3.2-3B with 4-bit quantization
   * Smaller model for faster inference
   * VRAM: ~2.5GB
   * Expected speed: 80-120 tok/sec on RTX 3060 / M1 Pro
   */
  LLAMA_3_2_3B_Q4F16: {
    model_id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    model: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 2500,
    recommended_for: ["speed", "low_vram"],
  },
  
  /**
   * Hermes-3 3B with 4-bit quantization
   * Fine-tuned smaller model
   * VRAM: ~2.0GB
   * Expected speed: 90-130 tok/sec on RTX 3060 / M1 Pro
   */
  HERMES_3_3B_Q4F16: {
    model_id: "Hermes-3-Llama-3.2-3B-q4f16_1-MLC",
    model: "https://huggingface.co/mlc-ai/Hermes-3-Llama-3.2-3B-q4f16_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 2000,
    recommended_for: ["speed", "low_vram", "balanced"],
  },

  /**
   * Llama-2-7B-chat with 4-bit quantization, fp32 compute
   * Official mlc-ai build — complete mlc-chat-config, no f16 required
   * q4f32_1 = universally compatible
   * VRAM: ~4GB
   */
  LLAMA_2_7B_Q4F32: {
    model_id: "Llama-2-7b-chat-hf-q4f32_1-MLC",
    model: "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f32_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 4000,
    recommended_for: ["all_gpus", "mid_size"],
  },

  /**
   * Vicuna 7B — ford442's custom WebLLM build
   * mlc-chat-config.json is missing tokenizer_files; supplied via overrides below.
   */
  VICUNA_7B_Q4F32: {
    model_id: "ford442/vicuna-7b-q4f32-webllm",
    model: "https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
      // mlc-chat-config.json in ford442's repo is missing tokenizer_files;
      // WebLLM crashes with .includes() on undefined without this override.
      tokenizer_files: ["tokenizer.model", "tokenizer_config.json"],
    },
    vram_required_MB: 4000,
    recommended_for: ["all_gpus", "mid_size"],
  },
};

/**
 * Default model configuration for the application
 * Uses optimized 4-bit quantization
 */
export const defaultModelId = OPTIMIZED_MODELS.HERMES_3_3B_Q4F16.model_id;

/**
 * App configuration with all available models
 */
export const appConfig = {
  model_list: [
    // 4-bit quantized models (optimized)
    {
      model: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16.model,
      model_id: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16.model_id,
      model_lib: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16.model_lib,
      overrides: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16.overrides,
      vram_required_MB: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16.vram_required_MB,
    },
    {
      model: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16_1K.model,
      model_id: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16_1K.model_id,
      model_lib: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16_1K.model_lib,
      overrides: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16_1K.overrides,
      vram_required_MB: OPTIMIZED_MODELS.LLAMA_3_1_8B_Q4F16_1K.vram_required_MB,
    },
    {
      model: OPTIMIZED_MODELS.HERMES_3_8B_Q4F16.model,
      model_id: OPTIMIZED_MODELS.HERMES_3_8B_Q4F16.model_id,
      model_lib: OPTIMIZED_MODELS.HERMES_3_8B_Q4F16.model_lib,
      overrides: OPTIMIZED_MODELS.HERMES_3_8B_Q4F16.overrides,
      vram_required_MB: OPTIMIZED_MODELS.HERMES_3_8B_Q4F16.vram_required_MB,
    },
    {
      model: OPTIMIZED_MODELS.LLAMA_3_2_3B_Q4F16.model,
      model_id: OPTIMIZED_MODELS.LLAMA_3_2_3B_Q4F16.model_id,
      model_lib: OPTIMIZED_MODELS.LLAMA_3_2_3B_Q4F16.model_lib,
      overrides: OPTIMIZED_MODELS.LLAMA_3_2_3B_Q4F16.overrides,
      vram_required_MB: OPTIMIZED_MODELS.LLAMA_3_2_3B_Q4F16.vram_required_MB,
    },
    {
      model: OPTIMIZED_MODELS.HERMES_3_3B_Q4F16.model,
      model_id: OPTIMIZED_MODELS.HERMES_3_3B_Q4F16.model_id,
      model_lib: OPTIMIZED_MODELS.HERMES_3_3B_Q4F16.model_lib,
      overrides: OPTIMIZED_MODELS.HERMES_3_3B_Q4F16.overrides,
      vram_required_MB: OPTIMIZED_MODELS.HERMES_3_3B_Q4F16.vram_required_MB,
    },
    {
      model: OPTIMIZED_MODELS.LLAMA_2_7B_Q4F32.model,
      model_id: OPTIMIZED_MODELS.LLAMA_2_7B_Q4F32.model_id,
      model_lib: OPTIMIZED_MODELS.LLAMA_2_7B_Q4F32.model_lib,
      overrides: OPTIMIZED_MODELS.LLAMA_2_7B_Q4F32.overrides,
      vram_required_MB: OPTIMIZED_MODELS.LLAMA_2_7B_Q4F32.vram_required_MB,
    },
    {
      model: OPTIMIZED_MODELS.VICUNA_7B_Q4F32.model,
      model_id: OPTIMIZED_MODELS.VICUNA_7B_Q4F32.model_id,
      model_lib: OPTIMIZED_MODELS.VICUNA_7B_Q4F32.model_lib,
      overrides: OPTIMIZED_MODELS.VICUNA_7B_Q4F32.overrides,
      vram_required_MB: OPTIMIZED_MODELS.VICUNA_7B_Q4F32.vram_required_MB,
    },
    // Legacy models (for backward compatibility)
    {
      model: "https://huggingface.co/mlc-ai/Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
      model_id: hermesModelConfig.model_id,
      model_lib: hermesModelConfig.model_lib,
      overrides: hermesModelConfig.overrides,
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f32_1-MLC",
      model_id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
      model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    }
  ],
  useIndexedDBCache: true,
};

/**
 * Apply optimized model configurations to the WebLLM engine
 */
export function applyModelConfigsToEngine(engine: typeof webllm) {
  const engineAny = engine as any;
  if (engineAny && engineAny.prebuiltAppConfig) {
    const existing = engineAny.prebuiltAppConfig.model_list || [];
    
    // Filter out models that are already registered
    const newModels = appConfig.model_list.filter(newModel => {
      return !existing.some((existingModel: any) => existingModel.model_id === newModel.model_id);
    });
    
    engineAny.prebuiltAppConfig.model_list = [...newModels, ...existing];
    
    console.log(`[ModelConfig] Registered ${newModels.length} optimized 4-bit models`);
  }
}

/**
 * Get list of available models from the engine
 */
export function getAvailableModels(engine: typeof webllm): string[] {
  const engineAny = engine as any;
  if (!engineAny || !engineAny.prebuiltAppConfig || !engineAny.prebuiltAppConfig.model_list) return [];
  return engineAny.prebuiltAppConfig.model_list.map((m: any) => m.model_id);
}

/**
 * Get recommended model based on device capabilities
 */
export function getRecommendedModel(): string {
  // Check for GPU memory (rough estimate)
  const gpu = (navigator as any).gpu;
  if (!gpu) {
    // No WebGPU support, return smallest model
    return OPTIMIZED_MODELS.HERMES_3_3B_Q4F16.model_id;
  }
  
  // Default to balanced option
  return defaultModelId;
}

/**
 * Populate model selector dropdowns
 */
export function populateModelSelect(engine: typeof webllm) {
  const select = document.getElementById('model-select') as HTMLSelectElement;
  const mainSelect = document.getElementById('model-select-main') as HTMLSelectElement;

  if (!select) return;

  const models = getAvailableModels(engine);
  
  // Sort models: 4-bit first, then by size
  const sortedModels = models.sort((a: string, b: string) => {
    const aIs4Bit = a.includes('q4f16');
    const bIs4Bit = b.includes('q4f16');
    if (aIs4Bit && !bIs4Bit) return -1;
    if (!aIs4Bit && bIs4Bit) return 1;
    return a.localeCompare(b);
  });
  
  const optionsHTML = sortedModels.map((m: string) => {
    const is4Bit = m.includes('q4f16');
    const vram = appConfig.model_list.find(model => model.model_id === m)?.vram_required_MB;
    const label = is4Bit ? `${m} (4-bit, ~${vram}MB VRAM)` : m;
    return `<option value="${m}">${label}</option>`;
  }).join('');

  select.innerHTML = optionsHTML;
  select.value = defaultModelId;

  if (mainSelect) {
    mainSelect.innerHTML = optionsHTML;
    mainSelect.value = defaultModelId;

    mainSelect.addEventListener('change', () => {
      select.value = mainSelect.value;
    });
    select.addEventListener('change', () => {
      if (mainSelect) mainSelect.value = select.value;
    });
  }
  
  console.log(`[ModelConfig] Populated ${models.length} models in selector`);
}
