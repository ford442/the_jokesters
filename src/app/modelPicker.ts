import { EngineFactory, type EngineType } from '../llm/EngineFactory'
import { getRequestedRendererMode, setRendererModePreference, isWebGPUAvailable } from '../visuals/rendererMode'
import type { RendererMode } from '../visuals/rendererMode'
import type { VRAMOptimizationConfig } from '../utils/dynamicContext'
import type { LaunchConfig } from './types'
import {
  BLESSED_PRESETS,
  downloadBlurb,
  getBlessedPreset,
  loadLastSuccessfulLaunch,
  probeDeviceCapabilities,
  recommendModels,
  consumeOomFallback,
  type ModelRecommendation,
} from './modelGuide'

function updateEngineInfo(engineType: string): void {
  const infoMap: Record<string, { speed: string; models: string; vram: string }> = {
    mlc: { speed: '⭐⭐⭐⭐⭐', models: 'MLC-optimized', vram: 'Low–Med' },
    transformers: { speed: '⭐⭐⭐⭐', models: 'HuggingFace ONNX', vram: 'Low–Med' },
    llamacpp: { speed: '⭐⭐', models: 'Any GGUF', vram: 'CPU RAM' },
    api: { speed: '⭐⭐⭐⭐', models: 'Remote API', vram: 'None (server)' },
    auto: { speed: 'Auto', models: 'Best available', vram: 'Auto' },
  }

  const info = infoMap[engineType] || infoMap.auto
  const el = document.getElementById('engine-info')
  if (el) {
    el.innerHTML = `Speed: ${info.speed} | Models: ${info.models} | VRAM: ${info.vram}`
  }
}

function updateCapabilityDisplay(extra?: string): void {
  const caps = EngineFactory.detectCapabilities()
  const el = document.getElementById('engine-capabilities')
  if (el) {
    el.innerHTML = `
      ${caps.webgpu ? '✅' : '❌'} WebGPU
      ${caps.wasm ? '✅' : '❌'} WASM
      ${caps.simd ? '✅' : '❌'} SIMD
      ${caps.threads ? '✅' : '❌'} Threads
      ${extra ? `<br><span style="color:#aaa">${extra}</span>` : ''}
    `
  }
}

function updateDownloadEstimate(modelId: string): void {
  const el = document.getElementById('model-download-estimate')
  if (!el) return
  const preset = getBlessedPreset(modelId)
  if (preset) {
    el.textContent = `📦 ${downloadBlurb(preset)}`
  } else {
    el.textContent = '📦 Model weights download on first load and are cached in this browser.'
  }
}

function updateModelHint(modelId: string): void {
  const modelHint = document.getElementById('model-launch-hint')
  if (!modelHint) return
  const preset = getBlessedPreset(modelId)
  modelHint.textContent = preset?.blurb ?? ''
}

function selectModel(modelId: string, engine?: EngineType): void {
  const modelSelect = document.getElementById('model-select-launch') as HTMLSelectElement | null
  const engineSelect = document.getElementById('engine-select') as HTMLSelectElement | null
  if (modelSelect) {
    const exists = Array.from(modelSelect.options).some((o) => o.value === modelId)
    if (exists) modelSelect.value = modelId
  }
  if (engine && engineSelect) {
    engineSelect.value = engine
    updateEngineInfo(engine)
  }
  updateModelHint(modelId)
  updateDownloadEstimate(modelId)
}

function applyVramConfigToUi(cfg: VRAMOptimizationConfig, maxTokens: number, context: number | 'auto'): void {
  const prefill = document.getElementById('prefill-chunk-select') as HTMLSelectElement | null
  const kv = document.getElementById('kv-cache-select') as HTMLSelectElement | null
  const sliding = document.getElementById('sliding-window-select') as HTMLSelectElement | null
  const sink = document.getElementById('attention-sink-slider') as HTMLInputElement | null
  const sinkVal = document.getElementById('attention-sink-val')
  const gpu = document.getElementById('gpu-mem-slider') as HTMLInputElement | null
  const gpuVal = document.getElementById('gpu-mem-val')
  const maxTok = document.getElementById('max-tokens-slider') as HTMLInputElement | null
  const maxTokVal = document.getElementById('max-tokens-val')
  const ctx = document.getElementById('context-size-select') as HTMLSelectElement | null

  if (prefill) prefill.value = String(cfg.prefill_chunk_size)
  if (kv) kv.value = cfg.kv_cache_quantization
  if (sliding) sliding.value = String(cfg.sliding_window_size)
  if (sink) {
    sink.value = String(cfg.attention_sink_size)
    if (sinkVal) sinkVal.textContent = sink.value
  }
  if (gpu) {
    gpu.value = String(Math.round(cfg.gpu_memory_utilization * 100))
    if (gpuVal) gpuVal.textContent = gpu.value + '%'
  }
  if (maxTok) {
    maxTok.value = String(maxTokens)
    if (maxTokVal) maxTokVal.textContent = maxTok.value
  }
  if (ctx) ctx.value = context === 'auto' ? 'auto' : String(context)
}

function renderGuideCard(rec: ModelRecommendation, rememberedLabel?: string): void {
  const probe = document.getElementById('model-guide-probe')
  const body = document.getElementById('model-guide-body')
  const deviceEl = document.getElementById('model-guide-device')
  const pName = document.getElementById('model-guide-primary-name')
  const pReason = document.getElementById('model-guide-primary-reason')
  const fName = document.getElementById('model-guide-fallback-name')
  const fReason = document.getElementById('model-guide-fallback-reason')
  const remembered = document.getElementById('model-guide-remembered')

  if (probe) probe.style.display = 'none'
  if (body) body.style.display = 'block'
  if (deviceEl) {
    deviceEl.textContent = `Your setup: ${rec.device.summary}`
  }
  if (pName) pName.textContent = rec.primary.shortName
  if (pReason) pReason.textContent = rec.primaryReason
  if (fName) fName.textContent = rec.safeFallback.shortName
  if (fReason) fReason.textContent = rec.fallbackReason

  if (remembered && rememberedLabel) {
    remembered.style.display = 'block'
    remembered.textContent = rememberedLabel
  }

  document.getElementById('use-primary-btn')?.addEventListener('click', () => {
    selectModel(rec.primary.id, rec.enginePreference)
  })
  document.getElementById('use-fallback-btn')?.addEventListener('click', () => {
    selectModel(rec.safeFallback.id, rec.safeFallback.engine)
  })
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
    const percent = estimate.quota ? Math.round(((estimate.usage ?? 0) / estimate.quota) * 100) : 0
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

  // Ensure select only lists blessed presets (rebuild if template drifts)
  if (modelSelectLaunch && modelSelectLaunch.options.length !== BLESSED_PRESETS.length) {
    modelSelectLaunch.innerHTML = ''
    for (const p of BLESSED_PRESETS) {
      const opt = document.createElement('option')
      opt.value = p.id
      opt.textContent = p.label
      modelSelectLaunch.appendChild(opt)
    }
  }

  modelSelectLaunch.addEventListener('change', () => {
    updateModelHint(modelSelectLaunch.value)
    updateDownloadEstimate(modelSelectLaunch.value)
    // Align engine when user picks a transformers/llamacpp-only preset
    const preset = getBlessedPreset(modelSelectLaunch.value)
    if (preset && (preset.engine === 'transformers' || preset.engine === 'llamacpp')) {
      const eng = document.getElementById('engine-select') as HTMLSelectElement | null
      if (eng) {
        eng.value = preset.engine
        updateEngineInfo(preset.engine)
      }
    }
  })

  const maxTokensSlider = document.getElementById('max-tokens-slider') as HTMLInputElement
  const maxTokensVal = document.getElementById('max-tokens-val')!
  const gpuMemSlider = document.getElementById('gpu-mem-slider') as HTMLInputElement
  const gpuMemVal = document.getElementById('gpu-mem-val')!
  const attentionSinkSlider = document.getElementById('attention-sink-slider') as HTMLInputElement
  const attentionSinkVal = document.getElementById('attention-sink-val')!

  if (maxTokensSlider) {
    maxTokensSlider.oninput = () => {
      maxTokensVal.textContent = maxTokensSlider.value
    }
  }
  if (gpuMemSlider) {
    gpuMemSlider.oninput = () => {
      gpuMemVal.textContent = gpuMemSlider.value + '%'
    }
  }
  if (attentionSinkSlider && attentionSinkVal) {
    attentionSinkSlider.oninput = () => {
      attentionSinkVal.textContent = attentionSinkSlider.value
    }
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
      const dbs = (await (window as any).indexedDB?.databases?.()) ?? []
      for (const db of dbs) {
        if (db.name && (db.name.includes('webllm') || db.name.includes('cache'))) {
          ;(window as any).indexedDB.deleteDatabase(db.name)
          console.log('[Storage] Deleted IndexedDB:', db.name)
        }
      }
      const cacheNames = await caches.keys()
      for (const name of cacheNames) {
        await caches.delete(name)
        console.log('[Storage] Deleted Cache:', name)
      }
      const regs = (await navigator.serviceWorker?.getRegistrations()) ?? []
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

  // Capability probe + recommendation (cold start path)
  void (async () => {
    try {
      const oom = consumeOomFallback()
      const last = loadLastSuccessfulLaunch()
      const device = await probeDeviceCapabilities()
      const rec = recommendModels(device)

      updateCapabilityDisplay(
        `${device.supportsF16 ? '✅' : '❌'} f16 · ~${Math.round(device.availableVramMB)} MB free`,
      )

      let rememberedLabel: string | undefined
      if (oom) {
        selectModel(oom.modelId, oom.engine)
        rememberedLabel = `⬇️ OOM recovery: switched to a smaller model (${getBlessedPreset(oom.modelId)?.shortName ?? oom.modelId}).`
        renderGuideCard(rec, rememberedLabel)
      } else if (last && getBlessedPreset(last.selectedModelId)) {
        selectModel(last.selectedModelId, last.enginePreference)
        applyVramConfigToUi(last.vramConfig, last.chosenMaxTokens, last.preferredContext)
        rememberedLabel = `✅ Last successful setup restored (${getBlessedPreset(last.selectedModelId)?.shortName ?? last.selectedModelId}).`
        renderGuideCard(rec, rememberedLabel)
      } else {
        // Cold start: apply primary recommendation before any download
        selectModel(rec.primary.id, rec.enginePreference)
        renderGuideCard(rec)
      }

      // Sync storage line with VRAM
      if (storageInfoEl && !storageInfoEl.textContent?.includes('GB used')) {
        storageInfoEl.textContent = `GPU: ${device.summary}`
      }
    } catch (e) {
      console.warn('[modelPicker] Guide probe failed:', e)
      const probe = document.getElementById('model-guide-probe')
      if (probe) {
        probe.textContent = 'Could not probe GPU — pick a Safe (3B q4f32) or CPU model below.'
      }
      selectModel('Hermes-3-Llama-3.2-3B-q4f32_1-MLC', 'mlc')
    }
  })()

  // Initial estimate for default option
  updateModelHint(modelSelectLaunch.value)
  updateDownloadEstimate(modelSelectLaunch.value)

  return new Promise<LaunchConfig>((resolve) => {
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
        gpu_memory_utilization: parseInt(gpuMemSliderEl?.value ?? '85', 10) / 100,
      }

      const chosenMaxTokens = parseInt(maxTokensSliderEl?.value ?? '96', 10)
      const selectedModel = modelSelectLaunch.value
      const preset = getBlessedPreset(selectedModel)

      // Storage warning for large downloads
      if (preset && preset.downloadMB >= 3000) {
        try {
          const estimate = await navigator.storage?.estimate?.()
          const quota = estimate?.quota ?? 0
          const usage = estimate?.usage ?? 0
          const freeGB = (quota - usage) / 1024 / 1024 / 1024
          const needGB = preset.downloadMB / 1000
          if (quota > 0 && freeGB < needGB) {
            const proceed = confirm(
              `⚠️ Storage Warning\n\n` +
                `This model downloads about ${needGB.toFixed(1)} GB.\n` +
                `You appear to have ~${freeGB.toFixed(1)} GB free.\n\n` +
                `Proceed anyway?`,
            )
            if (!proceed) return
          }
        } catch {
          /* ignore */
        }
      }

      // Ultra-low VRAM defaults when picking Qwen 0.5B
      if (preset?.tier === 'ultra') {
        vramConfig.prefill_chunk_size = Math.min(vramConfig.prefill_chunk_size || 256, 256)
        vramConfig.gpu_memory_utilization = Math.min(vramConfig.gpu_memory_utilization, 0.75)
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
