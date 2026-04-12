/**
 * LLM Engine Module
 * 
 * Exports all LLM engine implementations and utilities.
 * 
 * Usage:
 * ```typescript
 * import { EngineFactory, type LLMEngine, type UnifiedModelConfig } from './llm'
 * 
 * // Create an engine
 * const engine = await EngineFactory.selectEngine(modelConfig, 'auto')
 * 
 * // Initialize with a model
 * await engine.initialize(modelConfig, (progress) => {
 *   console.log(`${progress.text}: ${(progress.progress * 100).toFixed(1)}%`)
 * })
 * 
 * // Generate a response
 * for await (const chunk of engine.chat(messages, options)) {
 *   process.stdout.write(chunk)
 * }
 * ```
 */

// Core interfaces
export type {
  LLMEngine,
  ChatMessage,
  GenerationOptions,
  InitProgressReport,
  UnifiedModelConfig,
  MlcEngineConfig,
  LlamaCppEngineConfig,
} from './LLMEngine'

// Engine implementations
export { MlcEngineAdapter } from './MlcEngineAdapter'
export { LlamaCppEngineAdapter } from './LlamaCppEngineAdapter'

// Factory and utilities
export {
  EngineFactory,
  selectEngine,
  detectCapabilities,
  detectShaderF16Support,
  getCompatibleEngines,
  getModelEngineSupport,
  type EngineType,
  type EngineCapabilities,
  type ModelEngineSupport,
} from './EngineFactory'
