import { EngineFactory, type EngineType } from '../llm/EngineFactory'
import { getRecommendedModel } from '../config/models'
import { estimateAvailableVRAM } from '../utils/dynamicContext'
import { getRequestedRendererMode, setRendererModePreference, isWebGPUAvailable } from '../visuals/rendererMode'
import type { RendererMode } from '../visuals/rendererMode'
import type { VRAMOptimizationConfig } from '../utils/dynamicContext'
import type { LaunchConfig } from './types'

const MODEL_HINTS: Record<string, string> = {
  'Hermes-3-Llama-3.2-3B-q4f16_1-MLC': 'Fine-tuned for instruction following. Best default choice on modern GPUs.',
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': 'Standard Meta 3B model. Good speed/quality on any f16-capable GPU.',
  'Hermes-3-Llama-3.2-3B-q4f32_1-MLC': 'Same Hermes-3 3B in universal f32 mode — works on GPUs without f16 shader support.',
  'Llama-3.2-3B-Instruct-q4f32_1-MLC': 'Standard 3B in f32 mode. Compatible with older or integrated GPUs.',
  'Llama-2-7b-chat-hf-q4f32_1-MLC': 'Llama-2 7B Chat (Meta). Mid-size model, richer responses than 3B. ~4 GB VRAM, works on any WebGPU GPU — no f16 required.',
  'vicuna-7b-q4f32-webllm-vps': 'Default choice. Vicuna 7B q4f32 from storage.1ink.us (~4 GB). Universal fp32 WebGPU — no f16 shader required.',
  'Hermes-3-Llama-3.1-8B-q4f16_1-MLC': 'Best quality available. Requires RTX 30xx / RX 6000 / M1 Pro or better with f16 shader support.',
  'Llama-3.1-8B-Instruct-q4f16_1-MLC': 'Meta 8B flagship. Excellent reasoning. Requires f16-capable GPU with 5+ GB VRAM.',
}

function updateEngineInfo(engineType: string): void {
  const infoMap: Record<string, { speed: string; models: string; vram: string }> = {
    mlc: { speed: '⭐⭐⭐⭐⭐', models: 'MLC-optimized', vram: 'Low' },
    transformers: { speed: '⭐⭐⭐⭐', models: 'HuggingFace Hub', vram: 'Medium' },
    llamacpp: { speed: '⭐⭐', models: 'Any GGUF', vram: 'CPU-only' },
    auto: { speed: 'Auto', models: 'Best available', vram: 'Auto' },
  }

  const info = infoMap[engineType] || infoMap.auto
  const el = document.getElementById('engine-info')
  if (el) {
    el.innerHTML = `Speed: ${info.speed} | Models: ${info.models} | VRAM: ${info.vram}`
  }
}

function updateCapabilityDisplay(): void {
  const caps = EngineFactory.detectCapabilities()
  const el = document.getElementById('engine-capabilities')
  if (el) {
    el.innerHTML = `
      ${caps.webgpu ? '✅' : '❌'} WebGPU 
      ${caps.wasm ? '✅' : '❌'} WASM 
      ${caps.simd ? '✅' : '❌'} SIMD 
      ${caps.threads ? '✅' : '❌'} Threads
    `
  }
}

async function checkStorage(
  storageInfoEl: HTMLElement,
  clearCacheBtn: HTMLButtonElement,
): Promise<void> {
  try {
    if (!navigator.storage?.estimate) {
      storageInfoEl.textContent = 'Storage estimation not supported in this browser.'
      return
    }
    const estimate = await navigator.storage.estimate()
    const usedGB = ((estimate.usage ?? 0) / 1024 / 1024 / 1024).toFixed(2)
    const totalGB = ((estimate.quota ?? 0) / 1024 / 1024 / 1024).toFixed(2)
    const percent = estimate.quota ? Math.round((estimate.usage ?? 0) / estimate.quota * 100) : 0
    storageInfoEl.textContent = `Browser storage: ${usedGB} GB used / ${totalGB} GB total (${percent}%)`
    if (percent > 80) {
      storageInfoEl.style.color = '#ff6b6b'
      clearCacheBtn.style.display = 'block'
    } else {
      storageInfoEl.style.color = '#888'
      clearCacheBtn.style.display = 'none'
    }
  } catch (e) {
    console.warn('[Storage] Could not estimate storage:', e)
  }
}

/** Wire model picker UI and wait for the user to click Launch. */
export function wireModelPicker(): Promise<LaunchConfig> {
  const modelSelectLaunch = document.getElementById('model-select-launch') as HTMLSelectElement
  const modelHint = document.getElementById('model-launch-hint')!
  const updateModelHint = () => { modelHint.textContent = MODEL_HINTS[modelSelectLaunch.value] ?? '' }
  modelSelectLaunch.addEventListener('change', updateModelHint)
  updateModelHint()

  const vramInfoEl = document.getElementById('storage-info')!
  ;(async () => {
    try {
      const [recommendedId, availableMB] = await Promise.all([
        getRecommendedModel(),
        estimateAvailableVRAM(),
      ])

      const vramLine = `GPU VRAM available (estimated): ~${availableMB} MB`
      vramInfoEl.textContent = vramLine

      const currentVal = modelSelectLaunch.value
      const defaultVal = 'vicuna-7b-q4f32-webllm-vps'
      if (currentVal === defaultVal && recommendedId !== defaultVal) {
        const optionExists = Array.from(modelSelectLaunch.options).some(o => o.value === recommendedId)
        if (optionExists) {
          modelSelectLaunch.value = recommendedId
          updateModelHint()
          const banner = document.createElement('p')
          banner.style.cssText = 'color:#ffd700;font-size:0.78em;margin:4px 0;'
          banner.textContent = `⚠️ Auto-selected based on available VRAM (~${availableMB} MB). Change above if needed.`
          modelHint.insertAdjacentElement('afterend', banner)
        }
      }
    } catch {
      // VRAM probe failed — non-critical
    }
  })()

  const maxTokensSlider = document.getElementById('max-tokens-slider') as HTMLInputElement
  const maxTokensVal = document.getElementById('max-tokens-val')!
  const gpuMemSlider = document.getElementById('gpu-mem-slider') as HTMLInputElement
  const gpuMemVal = document.getElementById('gpu-mem-val')!
  const attentionSinkSlider = document.getElementById('attention-sink-slider') as HTMLInputElement
  const attentionSinkVal = document.getElementById('attention-sink-val')!

  if (maxTokensSlider) {
    maxTokensSlider.oninput = () => { maxTokensVal.textContent = maxTokensSlider.value }
  }
  if (gpuMemSlider) {
    gpuMemSlider.oninput = () => { gpuMemVal.textContent = gpuMemSlider.value + '%' }
  }
  if (attentionSinkSlider && attentionSinkVal) {
    attentionSinkSlider.oninput = () => { attentionSinkVal.textContent = attentionSinkSlider.value }
  }

  const rendererModeSelect = document.getElementById('renderer-mode-select') as HTMLSelectElement | null
  if (rendererModeSelect) {
    rendererModeSelect.value = getRequestedRendererMode()
    const webgpuOption = rendererModeSelect.querySelector('option[value="webgpu"]') as HTMLOptionElement | null
    if (webgpuOption && !isWebGPUAvailable()) {
      webgpuOption.disabled = true
      webgpuOption.textContent = 'WebGPU (unavailable on this device)'
    }
    rendererModeSelect.addEventListener('change', () => {
      setRendererModePreference(rendererModeSelect.value as RendererMode)
    })
  }

  updateCapabilityDisplay()

  const engineSelectEl = document.getElementById('engine-select') as HTMLSelectElement
  engineSelectEl?.addEventListener('change', () => {
    updateEngineInfo(engineSelectEl.value)
  })
  updateEngineInfo(engineSelectEl?.value || 'auto')

  const storageInfoEl = document.getElementById('storage-info')!
  const clearCacheBtn = document.getElementById('clear-cache-btn') as HTMLButtonElement

  clearCacheBtn?.addEventListener('click', async () => {
    clearCacheBtn.textContent = 'Clearing...'
    try {
      const dbs = await (window as any).indexedDB?.databases?.() ?? []
      for (const db of dbs) {
        if (db.name && (db.name.includes('webllm') || db.name.includes('cache'))) {
          (window as any).indexedDB.deleteDatabase(db.name)
          console.log('[Storage] Deleted IndexedDB:', db.name)
        }
      }
      const cacheNames = await caches.keys()
      for (const name of cacheNames) {
        await caches.delete(name)
        console.log('[Storage] Deleted Cache:', name)
      }
      const regs = await navigator.serviceWorker?.getRegistrations() ?? []
      for (const reg of regs) {
        await reg.unregister()
        console.log('[Storage] Unregistered SW')
      }
      clearCacheBtn.textContent = 'Cache Cleared ✓'
      setTimeout(() => {
        clearCacheBtn.textContent = 'Clear Model Cache'
        void checkStorage(storageInfoEl, clearCacheBtn)
      }, 2000)
    } catch (e) {
      console.error('[Storage] Failed to clear cache:', e)
      clearCacheBtn.textContent = 'Clear Failed ✗'
    }
  })

  void checkStorage(storageInfoEl, clearCacheBtn)

  return new Promise<LaunchConfig>(resolve => {
    document.getElementById('launch-btn')!.addEventListener('click', async () => {
      const contextSelect = document.getElementById('context-size-select') as HTMLSelectElement
      const contextVal = contextSelect ? contextSelect.value : 'auto'
      const preferredContext = contextVal === 'auto' ? 'auto' : parseInt(contextVal, 10)

      const engineSelect = document.getElementById('engine-select') as HTMLSelectElement
      const enginePreference = (engineSelect?.value as EngineType) || 'auto'

      const prefillSelect = document.getElementById('prefill-chunk-select') as HTMLSelectElement
      const kvCacheSelect = document.getElementById('kv-cache-select') as HTMLSelectElement
      const slidingWindowSelect = document.getElementById('sliding-window-select') as HTMLSelectElement
      const attentionSinkSliderEl = document.getElementById('attention-sink-slider') as HTMLInputElement
      const gpuMemSliderEl = document.getElementById('gpu-mem-slider') as HTMLInputElement
      const maxTokensSliderEl = document.getElementById('max-tokens-slider') as HTMLInputElement

      const vramConfig: VRAMOptimizationConfig = {
        prefill_chunk_size: parseInt(prefillSelect?.value ?? '0', 10),
        kv_cache_quantization: (kvCacheSelect?.value ?? 'auto') as VRAMOptimizationConfig['kv_cache_quantization'],
        sliding_window_size: parseInt(slidingWindowSelect?.value ?? '0', 10),
        attention_sink_size: parseInt(attentionSinkSliderEl?.value ?? '4', 10),
        gpu_memory_utilization: (parseInt(gpuMemSliderEl?.value ?? '85', 10)) / 100,
      }

      const chosenMaxTokens = parseInt(maxTokensSliderEl?.value ?? '96', 10)

      const selectedModel = modelSelectLaunch.value
      const isLargeModel = selectedModel.includes('7b') || selectedModel.includes('8B') || selectedModel.includes('vicuna')
      if (isLargeModel) {
        try {
          const estimate = await navigator.storage?.estimate?.()
          const quota = estimate?.quota ?? 0
          const usage = estimate?.usage ?? 0
          const freeGB = ((quota - usage) / 1024 / 1024 / 1024)
          if (freeGB < 4) {
            const proceed = confirm(
              `⚠️ Storage Warning\n\n` +
              `This model needs ~4 GB of browser storage. ` +
              `You only have ~${freeGB.toFixed(1)} GB free.\n\n` +
              `The download may fail. Try clearing the cache first, ` +
              `or choose a smaller 3B model.\n\n` +
              `Proceed anyway?`,
            )
            if (!proceed) return
          }
        } catch {
          // Ignore estimation errors
        }
      }

      document.getElementById('model-picker')!.style.display = 'none'
      document.getElementById('progress-section')!.style.display = 'block'
      resolve({
        selectedModelId: selectedModel,
        preferredContext,
        vramConfig,
        chosenMaxTokens,
        enginePreference,
      })
    })
  })
}
