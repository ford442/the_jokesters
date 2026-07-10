import type { EngineType } from '../llm/EngineFactory'
import type { VRAMOptimizationConfig } from '../utils/dynamicContext'

export interface LaunchConfig {
  selectedModelId: string
  preferredContext: number | 'auto'
  vramConfig: VRAMOptimizationConfig
  chosenMaxTokens: number
  enginePreference: EngineType
}

export const PRERENDER_INITIAL_TURNS = 3
export const PRERENDER_MIN_QUEUE = 2
export const PRERENDER_BATCH_SIZE = 2
export const MAX_PRERENDER_SENTENCES = 3
