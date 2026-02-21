import * as webllm from '@mlc-ai/web-llm'

// Model Configuration - Using main's newer 3.2 models with better config structure
export const hermesModelConfig = {
  model_id: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
  model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
  overrides: {
    context_window_size: 4096,
  },
};

export const appConfig = {
  model_list: [
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

export const defaultModelId = hermesModelConfig.model_id;

export function applyModelConfigsToEngine(engine: typeof webllm) {
  const engineAny = engine as any;
  if (engineAny && engineAny.prebuiltAppConfig) {
    const existing = engineAny.prebuiltAppConfig.model_list || [];
    engineAny.prebuiltAppConfig.model_list = [...appConfig.model_list, ...existing];
  }
}

export function getAvailableModels(engine: typeof webllm): string[] {
  const engineAny = engine as any;
  if (!engineAny || !engineAny.prebuiltAppConfig || !engineAny.prebuiltAppConfig.model_list) return [];
  return engineAny.prebuiltAppConfig.model_list.map((m: any) => m.model_id);
}

export function populateModelSelect(engine: typeof webllm) {
  const select = document.getElementById('model-select') as HTMLSelectElement;
  const mainSelect = document.getElementById('model-select-main') as HTMLSelectElement;

  if (!select) return;

  const models = getAvailableModels(engine);
  const optionsHTML = models.map((m: string) => `<option value="${m}">${m}</option>`).join('');

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
}
