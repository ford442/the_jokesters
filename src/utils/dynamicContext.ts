/**
 * Compatibility barrel for the former `dynamicContext.ts` god-file.
 *
 * The implementation was split by responsibility (#345):
 *   - `utils/contextBudget.ts`   — token-budget message window (DynamicContextManager)
 *   - `utils/vramOverrides.ts`   — compiled-max clamp, prefill align, KV quant, sliding window
 *   - `llm/mlcEngineCreate.ts`   — CreateMLCEngine + device-lost race + OOM step-down
 *   - `config/loadFailover.ts`   — source failover + `model_lib` HEAD probe
 *
 * New code should import from those modules directly. This barrel only exists
 * so existing importers keep working.
 */
export type {
  ChatMessage,
  ContextWindowInfo,
} from './contextBudget';
export { DynamicContextManager } from './contextBudget';

export type {
  ContextConfig,
  VRAMOptimizationConfig,
} from './vramOverrides';
export {
  APP_OVERHEAD_MB,
  DEFAULT_VRAM_CONFIG,
  alignPrefillChunkSize,
  buildVRAMOverrides,
  clampContextToCompiledMax,
  detectKVCacheSupport,
  estimateAvailableVRAM,
  getContextConfigForVRAM,
  getModelSize,
  invalidateVRAMCache,
  parseCompiledMaxContextFromModelLib,
} from './vramOverrides';

export type { ResolvedModelLib } from '../config/loadFailover';
export { resolveModelLibUrl } from '../config/loadFailover';

export type { DynamicModelConfig } from '../llm/mlcEngineCreate';
export { loadModelWithDynamicContext } from '../llm/mlcEngineCreate';
