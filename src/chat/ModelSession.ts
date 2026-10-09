import * as webllm from '@mlc-ai/web-llm'
import type { LLMEngine } from '../llm/LLMEngine'
import type { EngineType } from '../llm/EngineFactory'
import { EngineFactory, getEngineFallbackOrder } from '../llm/EngineFactory'
import {
  EngineStartError,
  NO_WEBGPU_ADAPTER_MESSAGE,
  listViableEngines,
  planEngineSelection,
  type ConcreteEngine,
  type EngineCapabilities,
} from '../llm/engineSelection'
import { MlcEngineAdapter } from '../llm/MlcEngineAdapter'
import { isWllamaRuntimeMismatch } from '../llm/wllamaRuntime'
import { getMlcEngineContextWindow, loadModelWithDynamicContext } from '../llm/mlcEngineCreate'
import { DynamicContextManager } from '../utils/contextBudget'
import { type VRAMOptimizationConfig, DEFAULT_VRAM_CONFIG } from '../utils/vramOverrides'
import {
  createTokenEstimatorForEngine,
  calibrateTokenEstimator,
} from '../utils/tokenEstimator'
import {
  appConfig,
  checkF16Support,
  getModelFallbackChain,
  getModelInfo,
  getUnifiedModelById,
  UNIFIED_MODELS,
} from '../config/models'

/**
 * Owns LLM engine lifecycle, context window budget, and interrupt semantics.
 */
export class ModelSession {
  private engine: LLMEngine | null = null
  private engineType: EngineType = 'mlc'
  private loadedModelId: string | null = null
  private isInitialized = false
  private readonly contextManager = new DynamicContextManager(4096)
  private vramConfig: VRAMOptimizationConfig = { ...DEFAULT_VRAM_CONFIG }
  private activeContextTokens = 4096

  getEngine(): LLMEngine | null {
    return this.engine
  }

  getEngineType(): EngineType {
    return this.engineType
  }

  getLoadedModelId(): string | null {
    return this.loadedModelId ?? this.engine?.getLoadedModelId() ?? null
  }

  getContextWindowSize(): number {
    return this.engine?.getContextWindowSize() ?? this.activeContextTokens
  }

  getContextManager(): DynamicContextManager {
    return this.contextManager
  }

  isReady(): boolean {
    return this.isInitialized && this.engine !== null
  }

  setVRAMConfig(config: Partial<VRAMOptimizationConfig>): void {
    this.vramConfig = { ...this.vramConfig, ...config }
    if (this.engine instanceof MlcEngineAdapter) {
      this.engine.setVRAMConfig(this.vramConfig)
    }
  }

  getVRAMConfig(): VRAMOptimizationConfig {
    return { ...this.vramConfig }
  }

  async initialize(
    onProgress?: (progress: webllm.InitProgressReport) => void,
    preferredModelId?: string,
    preferredContext?: number | 'auto',
    enginePreference: EngineType = 'auto',
  ): Promise<void> {
    if (this.isInitialized) return

    this.engineType = enginePreference
    const unifiedModel = preferredModelId ? getUnifiedModelById(preferredModelId) : null

    if (unifiedModel) {
      if (unifiedModel.api) {
        await this.initializeUnified(unifiedModel, onProgress, preferredContext, enginePreference)
        return
      }

      const gpuLimits = await EngineFactory.detectWebGPULimits()
      const lowBufferLimit = gpuLimits.maxBufferSize > 0 && gpuLimits.maxBufferSize < 512_000_000
      if (lowBufferLimit) {
        const caps = await EngineFactory.detectCapabilitiesWithAdapter()
        const support = EngineFactory.getModelEngineSupport(unifiedModel, caps)
        if (support.recommended === 'mlc' && (support.llamacpp || support.transformers)) {
          const forcedEngine: EngineType = support.llamacpp ? 'llamacpp' : 'transformers'
          await this.initializeUnified(unifiedModel, onProgress, preferredContext, forcedEngine)
          return
        }
        if (support.recommended === 'mlc') {
          const fallbackModel = UNIFIED_MODELS.find((m) => m.id === 'TinyLlama-1.1B-Chat-GGUF')
          if (fallbackModel) {
            await this.initializeUnified(fallbackModel, onProgress, preferredContext, 'llamacpp')
            return
          }
        }
      }
      await this.initializeUnified(unifiedModel, onProgress, preferredContext, enginePreference)
    } else {
      const gpuLimits = await EngineFactory.detectWebGPULimits()
      const lowBufferLimit = gpuLimits.maxBufferSize > 0 && gpuLimits.maxBufferSize < 512_000_000
      if (lowBufferLimit) {
        const fallbackModel = UNIFIED_MODELS.find((m) => m.id === 'TinyLlama-1.1B-Chat-GGUF')
        if (fallbackModel) {
          await this.initializeUnified(fallbackModel, onProgress, preferredContext, 'llamacpp')
          return
        }
      }
      await this.initializeLegacy(onProgress, preferredModelId, preferredContext)
    }
  }

  private async initializeUnified(
    modelConfig: import('../llm/LLMEngine').UnifiedModelConfig,
    onProgress?: (progress: webllm.InitProgressReport) => void,
    preferredContext?: number | 'auto',
    enginePreference: EngineType = 'auto',
  ): Promise<void> {
    const caps = await EngineFactory.detectCapabilitiesWithAdapter()
    let attempts: ConcreteEngine[]
    try {
      attempts = enginesToAttempt(modelConfig, enginePreference, caps)
    } catch (error) {
      console.error('[ModelSession] Engine cannot start:', error)
      throw error
    }

    const autoPlan = enginePreference === 'auto'
      ? planEngineSelection(modelConfig, 'auto', caps)
      : null

    let lastError: unknown = null
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i]
      let plan
      try {
        plan = i === 0 && autoPlan ? autoPlan : planEngineSelection(modelConfig, attempt, caps)
      } catch (error) {
        console.error('[ModelSession] Engine cannot start:', error)
        lastError = error
        if (enginePreference !== 'auto') break
        continue
      }

      console.log(plan.announcement)
      onProgress?.({
        progress: 0,
        timeElapsed: 0,
        text: i === 0 ? plan.statusText : `Previous engine failed. ${plan.statusText}`,
      })

      try {
        this.engine = EngineFactory.createEngine(plan.engine, {
          transformersDevice: plan.transformersDevice,
        })
        if (this.engine instanceof MlcEngineAdapter) {
          this.engine.setVRAMConfig(this.vramConfig)
        }
        this.engineType = plan.engine

        await this.engine.initialize(modelConfig, (report) => {
          onProgress?.({
            progress: report.progress,
            timeElapsed: report.timeElapsed,
            text: report.text,
          })
        })

        this.isInitialized = true
        this.loadedModelId = modelConfig.id

        let contextSize: number
        if (preferredContext && preferredContext !== 'auto') {
          contextSize = preferredContext
        } else {
          contextSize = this.engine.getContextWindowSize()
        }
        this.applyContextSize(contextSize)
        await this.attachTokenEstimator()
        console.log(`[ModelSession] Loaded ${modelConfig.id} (${this.engineType}) ctx=${contextSize}`)
        return
      } catch (error) {
        console.error(`[ModelSession] ${plan.engine} failed to start:`, error)
        lastError = error
        try {
          await this.engine?.terminate()
        } catch (terminateError) {
          console.warn('[ModelSession] terminate after failed start:', terminateError)
        }
        this.engine = null
        this.isInitialized = false
        this.loadedModelId = null

        if (enginePreference !== 'auto' && isWllamaRuntimeMismatch(error)) {
          const fallbacks = getEngineFallbackOrder(modelConfig, caps, ['llamacpp'])
          for (const nextEngine of fallbacks) {
            try {
              await this.initializeUnified(modelConfig, onProgress, preferredContext, nextEngine)
              return
            } catch (fallbackError) {
              console.error(`[ModelSession] Fallback to ${nextEngine} failed:`, fallbackError)
              lastError = fallbackError
            }
          }
        }

        if (enginePreference !== 'auto') break
      }
    }

    if (lastError instanceof Error) throw lastError
    throw new EngineStartError(NO_WEBGPU_ADAPTER_MESSAGE)
  }

  private async initializeLegacy(
    onProgress?: (progress: webllm.InitProgressReport) => void,
    preferredModelId?: string,
    preferredContext?: number | 'auto',
  ): Promise<void> {
    const limits = await EngineFactory.detectWebGPULimits()
    if (!limits.adapterAvailable) {
      const error = new EngineStartError(NO_WEBGPU_ADAPTER_MESSAGE)
      console.error('[ModelSession] Engine cannot start:', error)
      throw error
    }

    const supportsF16 = await checkF16Support()
    const autoFallbacks = getModelFallbackChain(preferredModelId)
    const compatibleFallbacks = supportsF16
      ? autoFallbacks
      : autoFallbacks.filter((id) => {
          const info = getModelInfo(id)
          return !info?.requires_f16 && !id.includes('q4f16')
        })

    const modelFallbacks =
      preferredModelId && compatibleFallbacks.includes(preferredModelId)
        ? [preferredModelId, ...compatibleFallbacks.filter((id) => id !== preferredModelId)]
        : compatibleFallbacks

    let lastError: unknown = null

    for (let i = 0; i < modelFallbacks.length; i++) {
      const modelId = modelFallbacks[i]
      if (i > 0 && modelId === modelFallbacks[i - 1]) continue

      try {
        const modelConfig = appConfig.model_list.find((m) => m.model_id === modelId)
        if (!modelConfig) throw new Error(`Model ${modelId} not found in config`)

        const mlcEngine = await loadModelWithDynamicContext(
          modelConfig,
          preferredContext,
          onProgress,
          this.vramConfig,
        )

        const adapter = new MlcEngineAdapter()
        adapter.setVRAMConfig(this.vramConfig)
        ;(adapter as unknown as { engine: unknown }).engine = mlcEngine
        ;(adapter as unknown as { initialized: boolean }).initialized = true
        ;(adapter as unknown as { config: unknown }).config = {
          id: modelId,
          name: modelId,
          context_window_size:
            getMlcEngineContextWindow(mlcEngine) ??
            modelConfig.overrides?.context_window_size ??
            4096,
          vram_required_MB: modelConfig.vram_required_MB || 4000,
          mlc: {
            model_url: modelConfig.model,
            model_lib_url: modelConfig.model_lib,
            overrides: modelConfig.overrides || {},
          },
        }

        this.engine = adapter
        this.isInitialized = true
        this.loadedModelId = modelId
        this.engineType = 'mlc'

        const actualContext = adapter.getContextWindowSize()
        this.applyContextSize(actualContext)
        await this.attachTokenEstimator()
        return
      } catch (error) {
        lastError = error
        if (i < modelFallbacks.length - 1) {
          const nextModel = modelFallbacks[i + 1]
          if (nextModel !== modelId) {
            onProgress?.({
              progress: 0,
              timeElapsed: 0,
              text: `Model load failed, trying fallback: ${nextModel}…`,
            })
          }
        }
      }
    }

    const lastMsg = lastError instanceof Error ? lastError.message : String(lastError)
    const isOOM =
      lastMsg.toLowerCase().includes('oom') ||
      lastMsg.toLowerCase().includes('memory') ||
      lastMsg.toLowerCase().includes('createbuffer')
    if (isOOM) {
      const fallbackModel = UNIFIED_MODELS.find((m) => m.id === 'TinyLlama-1.1B-Chat-GGUF')
      if (fallbackModel) {
        await this.initializeUnified(fallbackModel, onProgress, preferredContext, 'llamacpp')
        return
      }
    }
    throw lastError
  }

  private applyContextSize(contextSize: number): void {
    this.activeContextTokens = contextSize
    this.contextManager.setMaxContextTokens(contextSize)
  }

  private async attachTokenEstimator(): Promise<void> {
    if (!this.engine) return
    const estimator = createTokenEstimatorForEngine(this.engine, this.loadedModelId ?? undefined)
    this.contextManager.setTokenEstimator(estimator)
    await calibrateTokenEstimator(this.engine, estimator)
  }

  /** Re-sync context budget after hot-swap (may differ from prior engine). */
  syncContextFromEngine(): void {
    if (!this.engine) return
    this.applyContextSize(this.engine.getContextWindowSize())
  }

  async interrupt(): Promise<void> {
    try {
      await this.engine?.interrupt()
    } catch (error) {
      console.warn('[ModelSession] interrupt (non-fatal):', error)
    }
  }

  async terminate(): Promise<void> {
    if (this.engine) {
      await this.engine.terminate()
    }
    this.engine = null
    this.isInitialized = false
    this.loadedModelId = null
  }

  /** Inject a test / mock engine without full initialize path. */
  attachEngine(engine: LLMEngine, modelId: string, engineType: EngineType = 'api'): void {
    this.engine = engine
    this.loadedModelId = modelId
    this.engineType = engineType
    this.isInitialized = true
    this.applyContextSize(engine.getContextWindowSize())
  }
}

function enginesToAttempt(
  modelConfig: import('../llm/LLMEngine').UnifiedModelConfig,
  preference: EngineType,
  caps: EngineCapabilities,
): ConcreteEngine[] {
  if (preference === 'auto') {
    const viable = listViableEngines(modelConfig, caps)
    if (viable.length === 0) {
      throw new EngineStartError(NO_WEBGPU_ADAPTER_MESSAGE)
    }
    return viable
  }
  return [preference]
}
