import type { LLMEngine } from './LLMEngine'
import type { MlcEngineAdapter } from './MlcEngineAdapter'

/**
 * Narrow to the MLC adapter without importing it at runtime, so callers do not drag the
 * web-llm chunk into the initial bundle (adapters are loaded on demand by EngineFactory).
 */
export function isMlcEngine(engine: LLMEngine | null | undefined): engine is MlcEngineAdapter {
  return engine?.id === 'mlc'
}
