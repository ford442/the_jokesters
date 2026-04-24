import type { GroupChatManager } from './GroupChatManager'
import * as webllm from '@mlc-ai/web-llm'
import type { EngineType } from './llm/EngineFactory'
import { getUnifiedModelById } from './config/models'

export interface AgentModelMapping {
  agentId: string
  modelId: string
  enginePreference?: EngineType  // NEW: Per-agent engine preference
}

export interface ModelSwapProgress {
  text: string
  progress: number
}

/**
 * AgentModelManager handles assigning different LLM models to each agent
 * and hot-swapping models to stay within VRAM limits.
 * 
 * Only one model is loaded at a time. Before each agent speaks,
 * we ensure their assigned model is loaded, unloading the previous
 * model if necessary.
 */
export class AgentModelManager {
  private groupChatManager: GroupChatManager
  private agentModelMap: Map<string, string>
  private currentLoadedModel: string | null = null
  private onProgress?: (progress: ModelSwapProgress) => void

  constructor(
    groupChatManager: GroupChatManager,
    defaultMappings: AgentModelMapping[],
    onProgress?: (progress: ModelSwapProgress) => void
  ) {
    this.groupChatManager = groupChatManager
    this.onProgress = onProgress
    
    // Initialize agent-to-model mappings
    this.agentModelMap = new Map()
    defaultMappings.forEach(mapping => {
      this.agentModelMap.set(mapping.agentId, mapping.modelId)
    })
    
    console.log('AgentModelManager initialized with mappings:', 
      Array.from(this.agentModelMap.entries()))
  }

  /**
   * Ensure the correct model is loaded for the given agent.
   * If a different model is currently loaded, unload it and load the target model.
   * @param agentId The agent that needs to speak
   */
  async ensureModelForAgent(agentId: string): Promise<void> {
    const targetModel = this.agentModelMap.get(agentId)
    
    if (!targetModel) {
      console.warn(`No model assigned to agent: ${agentId}`)
      return
    }

    // Optimization: Skip if the correct model is already loaded
    if (this.currentLoadedModel === targetModel) {
      console.log(`Model ${targetModel} already loaded for ${agentId}, skipping swap`)
      return
    }

    // Look up model config to determine engine type
    const modelConfig = getUnifiedModelById(targetModel)
    const enginePreference: EngineType = modelConfig?.engine ?? 'auto'

    // Fast-path for API models: if current engine is also API and same endpoint, skip unload
    const currentConfig = this.currentLoadedModel ? getUnifiedModelById(this.currentLoadedModel) : null
    if (
      currentConfig?.api &&
      modelConfig?.api &&
      currentConfig.api.endpoint === modelConfig.api.endpoint &&
      currentConfig.api.model_id === modelConfig.api.model_id
    ) {
      console.log(`API model ${targetModel} shares endpoint with current model, skipping swap`)
      this.currentLoadedModel = targetModel
      return
    }

    console.log(`🔄 Swapping model for ${agentId}: ${this.currentLoadedModel} → ${targetModel}`)
    const startTime = performance.now()

    try {
      // Step 1: Unload current model to free VRAM
      if (this.currentLoadedModel) {
        this.reportProgress(`Unloading ${this.currentLoadedModel}...`, 0.1)
        await this.groupChatManager.terminate()
        console.log(`✓ Unloaded ${this.currentLoadedModel}`)
      }

      // Step 2: Load the target model
      this.reportProgress(`Loading ${targetModel}...`, 0.3)
      await this.groupChatManager.initialize(
        (progress: webllm.InitProgressReport) => {
          // Forward progress to UI with scaling (30% to 90% of total progress)
          const scaledProgress = 0.3 + (progress.progress * 0.6)
          this.reportProgress(progress.text, scaledProgress)
        },
        targetModel,
        'auto',
        enginePreference
      )

      this.currentLoadedModel = targetModel
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
      console.log(`✓ Model swap complete in ${elapsed}s`)
      this.reportProgress(`Model ${targetModel} loaded`, 1.0)

    } catch (error) {
      console.error(`Failed to swap model for ${agentId}:`, error)
      this.currentLoadedModel = null
      throw error
    }
  }

  /**
   * Get the currently loaded model ID
   */
  getCurrentModel(): string | null {
    return this.currentLoadedModel
  }

  /**
   * Set or update the model for a specific agent
   */
  setModelForAgent(agentId: string, modelId: string): void {
    console.log(`Setting model for ${agentId}: ${modelId}`)
    this.agentModelMap.set(agentId, modelId)
  }

  /**
   * Get the assigned model for an agent
   */
  getModelForAgent(agentId: string): string | undefined {
    return this.agentModelMap.get(agentId)
  }

  /**
   * Get all agent-model mappings
   */
  getAllMappings(): AgentModelMapping[] {
    return Array.from(this.agentModelMap.entries()).map(([agentId, modelId]) => ({
      agentId,
      modelId
    }))
  }

  /**
   * Helper to report progress to UI callback
   */
  private reportProgress(text: string, progress: number): void {
    if (this.onProgress) {
      this.onProgress({ text, progress })
    }
  }
}
