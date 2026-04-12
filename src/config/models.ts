import * as webllm from '@mlc-ai/web-llm'

/**
 * Model Configuration with VPS-hosted models
 * 
 * Priorities:
 * 1. FP32 models (q4f32_1) - Universally compatible with WebGPU
 * 2. FP16 models (q4f16_1) - Faster but requires shader-f16 support
 * 3. VPS-hosted at storage.noahcohn.com - Reliable range header support
 * 4. Hugging Face fallback - Redundancy
 * 
 * WebLLM Note: q4f16_1 requires 'shader-f16' GPU feature which is not
 * universally supported. q4f32_1 works on all WebGPU implementations.
 */

// VPS Storage Configuration
export const VPS_STORAGE_URL = 'https://storage.noahcohn.com/models';

/**
 * VPS-Hosted FP32 Models (Primary - Recommended)
 * These models are hosted on our VPS with full range header support
 */
export const VPS_FP32_MODELS = {
  /**
   * Llama-2-7B-chat with q4f32_1 quantization
   * - 4-bit weights, fp32 compute
   * - Universally compatible (no shader-f16 required)
   * - VRAM: ~4GB
   * - Hosted on VPS for reliable range requests
   */
  VPS_LLAMA_2_7B_Q4F32: {
    model_id: "Llama-2-7b-chat-hf-q4f32_1-MLC",
    model: `${VPS_STORAGE_URL}/Llama-2-7b-chat-hf-q4f32_1-MLC/`,
    model_lib: `${VPS_STORAGE_URL}/Llama-2-7b-chat-hf-q4f32_1-MLC/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 4000,
    recommended_for: ["all_gpus", "reliable", "fp32"],
    source: "vps",
  },

  /**
   * Hermes-3-Llama-3.2-3B with q4f32_1 quantization
   * - Smaller, faster model with fp32 compute
   * - VRAM: ~2.5GB
   * - Hosted on VPS
   */
  VPS_HERMES_3_3B_Q4F32: {
    model_id: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
    model: `${VPS_STORAGE_URL}/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/`,
    model_lib: `${VPS_STORAGE_URL}/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 2500,
    recommended_for: ["all_gpus", "speed", "fp32"],
    source: "vps",
  },

  /**
   * ford442's Custom Vicuna-7B with q4f32_1 quantization
   * - Custom modified Vicuna model
   * - fp32 compute for universal compatibility
   * - VRAM: ~4GB
   * - Hosted on VPS
   */
  VPS_VICUNA_7B_Q4F32: {
    model_id: "vicuna-7b-q4f32-webllm-vps",
    model: `${VPS_STORAGE_URL}/vicuna-7b-q4f32-webllm/`,
    model_lib: `${VPS_STORAGE_URL}/vicuna-7b-q4f32-webllm/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
      tokenizer_files: ["tokenizer.model", "tokenizer_config.json"],
    },
    vram_required_MB: 4000,
    recommended_for: ["all_gpus", "custom", "vicuna", "fp32"],
    source: "vps",
    notes: "Custom ford442 Vicuna build",
  },

  /**
   * Llama-3.2-3B-Instruct with q4f32_1 quantization
   * - Latest Llama 3.2 with fp32 compute
   * - VRAM: ~2.5GB
   * - Hosted on VPS
   */
  VPS_LLAMA_3_2_3B_Q4F32: {
    model_id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    model: `${VPS_STORAGE_URL}/Llama-3.2-3B-Instruct-q4f32_1-MLC/`,
    model_lib: `${VPS_STORAGE_URL}/Llama-3.2-3B-Instruct-q4f32_1-MLC/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 2500,
    recommended_for: ["all_gpus", "modern", "fp32"],
    source: "vps",
  },
};

/**
 * FP16 Models (Secondary - Requires shader-f16 support)
 * These models require the 'shader-f16' GPU feature
 */
export const FP16_MODELS = {
  /**
   * Llama-3.1-8B Instruct with 4-bit quantization (fp16 compute)
   * Benefits:
   * - ~4x memory reduction vs fp16
   * - Faster inference on WebGPU with shader-f16
   * - Minimal quality loss for 8B models
   * 
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
    requires_f16: true,
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
    requires_f16: true,
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
    requires_f16: true,
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
    requires_f16: true,
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
    requires_f16: true,
  },
};

/**
 * Hugging Face Fallback FP32 Models
 * Used when VPS models are unavailable
 */
export const HF_FP32_MODELS = {
  /**
   * Llama-2-7B-chat with q4f32_1 quantization
   * Official mlc-ai build — fp32 compute, universally compatible
   * VRAM: ~4GB
   */
  HF_LLAMA_2_7B_Q4F32: {
    model_id: "Llama-2-7b-chat-hf-q4f32_1-MLC",
    model: "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f32_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 4000,
    recommended_for: ["all_gpus", "mid_size", "fallback"],
  },

  /**
   * Hermes-3-Llama-3.2-3B with q4f32_1 quantization
   * Fallback fp32 model from HF
   * VRAM: ~2.5GB
   */
  HF_HERMES_3_3B_Q4F32: {
    model_id: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
    model: "https://huggingface.co/mlc-ai/Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 2500,
    recommended_for: ["all_gpus", "speed", "fallback"],
  },

  /**
   * Llama-3.2-3B-Instruct with q4f32_1 quantization
   * Latest fp32 model from HF
   * VRAM: ~2.5GB
   */
  HF_LLAMA_3_2_3B_Q4F32: {
    model_id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    model: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f32_1-MLC",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    },
    vram_required_MB: 2500,
    recommended_for: ["all_gpus", "modern", "fallback"],
  },

  /**
   * Vicuna 7B — ford442's custom WebLLM build (HF source)
   * mlc-chat-config.json is missing tokenizer_files; supplied via overrides below.
   */
  HF_VICUNA_7B_Q4F32: {
    model_id: "ford442/vicuna-7b-q4f32-webllm",
    model: "https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/",
    model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    overrides: {
      context_window_size: 4096,
      prefill_chunk_size: 1024,
      tokenizer_files: ["tokenizer.model", "tokenizer_config.json"],
    },
    vram_required_MB: 4000,
    recommended_for: ["all_gpus", "mid_size", "custom"],
  },
};

/**
 * Legacy model configs (kept for backward compatibility)
 */
export const hermesModelConfig = {
  model_id: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
  model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
  overrides: {
    context_window_size: 4096,
  },
};

/**
 * Combined OPTIMIZED_MODELS export
 * Prioritizes VPS-hosted FP32 models for reliability
 */
export const OPTIMIZED_MODELS = {
  // VPS FP32 Models (Primary - Recommended)
  ...VPS_FP32_MODELS,
  
  // HF FP32 Models (Fallback)
  ...HF_FP32_MODELS,
  
  // FP16 Models (Requires shader-f16)
  ...FP16_MODELS,
};

/**
 * Default model configuration for the application
 * Uses VPS-hosted Hermes-3-3B-q4f32 for universal compatibility
 */
export const defaultModelId = VPS_FP32_MODELS.VPS_HERMES_3_3B_Q4F32.model_id;

/**
 * Build model list for WebLLM
 * Ordered by priority: VPS FP32 -> HF FP32 -> FP16
 */
function buildModelList(): any[] {
  const models: any[] = [];
  
  // Add all VPS FP32 models first (highest priority)
  Object.values(VPS_FP32_MODELS).forEach((config: any) => {
    models.push({
      model: config.model,
      model_id: config.model_id,
      model_lib: config.model_lib,
      overrides: config.overrides,
      vram_required_MB: config.vram_required_MB,
      source: config.source,
    });
  });
  
  // Add HF FP32 models
  Object.values(HF_FP32_MODELS).forEach((config: any) => {
    // Skip if same ID as VPS model (VPS takes precedence)
    if (!models.find(m => m.model_id === config.model_id)) {
      models.push({
        model: config.model,
        model_id: config.model_id,
        model_lib: config.model_lib,
        overrides: config.overrides,
        vram_required_MB: config.vram_required_MB,
        source: "huggingface",
      });
    }
  });
  
  // Add FP16 models last (lowest priority due to compatibility issues)
  Object.values(FP16_MODELS).forEach((config: any) => {
    models.push({
      model: config.model,
      model_id: config.model_id,
      model_lib: config.model_lib,
      overrides: config.overrides,
      vram_required_MB: config.vram_required_MB,
      requires_f16: true,
      source: "huggingface",
    });
  });
  
  return models;
}

/**
 * App configuration with all available models
 */
export const appConfig = {
  model_list: buildModelList(),
  useIndexedDBCache: true,
};

/**
 * Check if GPU supports shader-f16
 */
export async function checkF16Support(): Promise<boolean> {
  try {
    const nav = navigator as unknown as { gpu: { requestAdapter(): Promise<{ features: Set<string> } | null> } };
    const adapter = await nav.gpu.requestAdapter();
    return adapter?.features.has('shader-f16') ?? false;
  } catch {
    return false;
  }
}

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
    
    console.log(`[ModelConfig] Registered ${newModels.length} optimized models`);
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
export async function getRecommendedModel(): Promise<string> {
  // Check for GPU memory (rough estimate)
  const gpu = (navigator as any).gpu;
  if (!gpu) {
    // No WebGPU support, return smallest model
    return VPS_FP32_MODELS.VPS_HERMES_3_3B_Q4F32.model_id;
  }
  
  // Check for f16 support
  const supportsF16 = await checkF16Support();
  
  if (!supportsF16) {
    console.log('[ModelConfig] GPU does not support shader-f16, using FP32 models');
    return VPS_FP32_MODELS.VPS_HERMES_3_3B_Q4F32.model_id;
  }
  
  // Default to VPS-hosted FP32 model for reliability
  return defaultModelId;
}

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): any {
  return appConfig.model_list.find(m => m.model_id === modelId);
}

/**
 * Populate model selector dropdowns
 */
export function populateModelSelect(engine: typeof webllm) {
  const select = document.getElementById('model-select') as HTMLSelectElement;
  const mainSelect = document.getElementById('model-select-main') as HTMLSelectElement;

  if (!select) return;

  const models = getAvailableModels(engine);
  
  // Sort models: VPS first, then FP32, then by size
  const sortedModels = models.sort((a: string, b: string) => {
    const aInfo = getModelInfo(a);
    const bInfo = getModelInfo(b);
    
    // VPS models first
    if (aInfo?.source === 'vps' && bInfo?.source !== 'vps') return -1;
    if (bInfo?.source === 'vps' && aInfo?.source !== 'vps') return 1;
    
    // FP32 before FP16
    const aIsF32 = a.includes('q4f32');
    const bIsF32 = b.includes('q4f32');
    if (aIsF32 && !bIsF32) return -1;
    if (!aIsF32 && bIsF32) return 1;
    
    return a.localeCompare(b);
  });
  
  const optionsHTML = sortedModels.map((m: string) => {
    const info = getModelInfo(m);
    const isVps = info?.source === 'vps';
    const isF32 = m.includes('q4f32');
    const vram = info?.vram_required_MB;
    
    let label = m;
    if (isVps) {
      label = `${m} (VPS, ~${vram}MB VRAM)`;
    } else if (isF32) {
      label = `${m} (FP32, ~${vram}MB VRAM)`;
    } else if (vram) {
      label = `${m} (~${vram}MB VRAM)`;
    }
    
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

/**
 * Get fallback model chain for a given preferred model
 * Returns list of models to try in order
 */
export function getModelFallbackChain(preferredModelId?: string): string[] {
  const chain: string[] = [];
  
  // Add preferred model first
  if (preferredModelId) {
    chain.push(preferredModelId);
  }
  
  // Add VPS FP32 models (primary fallbacks)
  Object.values(VPS_FP32_MODELS).forEach((config: any) => {
    if (!chain.includes(config.model_id)) {
      chain.push(config.model_id);
    }
  });
  
  // Add HF FP32 models (secondary fallbacks)
  Object.values(HF_FP32_MODELS).forEach((config: any) => {
    if (!chain.includes(config.model_id)) {
      chain.push(config.model_id);
    }
  });
  
  return chain;
}

// =============================================================================
// UNIFIED MODEL CONFIGURATION - Dual-Engine Architecture
// =============================================================================

import type { UnifiedModelConfig } from '../llm/LLMEngine'

/**
 * Unified model configurations for the dual-engine architecture.
 * These models can be used with either MLC WebLLM or llama.cpp WASM engines.
 */
export const UNIFIED_MODELS: UnifiedModelConfig[] = [
  // MLC WebLLM Models
  {
    id: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
    name: 'Hermes 3 Llama 3.2 3B (MLC)',
    vram_required_MB: 2500,
    context_window_size: 4096,
    mlc: {
      model_url: 'https://storage.noahcohn.com/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/',
      model_lib_url: 'https://storage.noahcohn.com/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm',
      overrides: {
        context_window_size: 4096,
        prefill_chunk_size: 1024,
      },
    },
  },
  
  // llama.cpp WASM Models (GGUF format from HuggingFace)
  {
    id: 'Hermes-3-Llama-3.1-8B-GGUF',
    name: 'Hermes 3 Llama 3.1 8B (GGUF)',
    vram_required_MB: 5200,
    context_window_size: 4096,
    llamaCpp: {
      gguf_url: 'https://huggingface.co/NousResearch/Hermes-3-Llama-3.1-8B-GGUF/resolve/main/Hermes-3-Llama-3.1-8B.Q4_K_M.gguf',
      hf_repo: 'NousResearch/Hermes-3-Llama-3.1-8B-GGUF',
      hf_file: 'Hermes-3-Llama-3.1-8B.Q4_K_M.gguf',
      context_size: 4096,
    },
  },
  {
    id: 'vicuna-7b-v1.5-GGUF',
    name: 'Vicuna 7B v1.5 (GGUF)',
    vram_required_MB: 4500,
    context_window_size: 4096,
    llamaCpp: {
      gguf_url: 'https://huggingface.co/TheBloke/vicuna-7B-v1.5-GGUF/resolve/main/vicuna-7b-v1.5.Q4_K_M.gguf',
      hf_repo: 'TheBloke/vicuna-7B-v1.5-GGUF',
      hf_file: 'vicuna-7b-v1.5.Q4_K_M.gguf',
      context_size: 4096,
    },
  },
  {
    id: 'Hermes-3-Llama-3.2-3B-GGUF',
    name: 'Hermes 3 Llama 3.2 3B (GGUF)',
    vram_required_MB: 2500,
    context_window_size: 4096,
    llamaCpp: {
      gguf_url: 'https://huggingface.co/NousResearch/Hermes-3-Llama-3.2-3B-GGUF/resolve/main/Hermes-3-Llama-3.2-3B.Q4_K_M.gguf',
      hf_repo: 'NousResearch/Hermes-3-Llama-3.2-3B-GGUF',
      hf_file: 'Hermes-3-Llama-3.2-3B.Q4_K_M.gguf',
      context_size: 4096,
    },
  },
]



/**
 * Get a unified model config by ID
 */
export function getUnifiedModelById(id: string): UnifiedModelConfig | undefined {
  return UNIFIED_MODELS.find(m => m.id === id)
}

/**
 * Get all models compatible with a specific engine type
 */
export function getModelsForEngine(engineType: 'mlc' | 'llamaCpp'): UnifiedModelConfig[] {
  return UNIFIED_MODELS.filter(m => m[engineType] !== undefined)
}
