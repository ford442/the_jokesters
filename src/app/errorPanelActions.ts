import type { ErrorCategory } from '../types/chat'
import { isVicunaFamilyModelId } from '../config/loadFailover'
import { getSmallerFallbackFor } from './modelGuide'

export type ErrorPanelAction = 'retry' | 'try_smaller' | 'clear_cache' | 'retry_hf' | 'retry_mirror'

export interface ErrorPanelActionPlan {
  actions: ErrorPanelAction[]
  smallerPresetId: string
  smallerShortName: string
}

const DOWNLOAD_CATEGORIES: readonly ErrorCategory[] = ['network', 'config', 'wasm_missing']

/**
 * Pure: which recovery buttons to show for a failed init, given category + model.
 * Keep this free of DOM so unit tests do not need jsdom.
 */
export function selectErrorPanelActions(input: {
  category: ErrorCategory
  modelId: string
}): ErrorPanelActionPlan {
  const { category, modelId } = input
  const smaller = getSmallerFallbackFor(modelId)
  const actions: ErrorPanelAction[] = ['retry']
  const downloadFail = DOWNLOAD_CATEGORIES.includes(category)

  if (category === 'oom' || category === 'webgpu' || downloadFail) {
    actions.push('try_smaller')
  }
  if (downloadFail) {
    actions.push('clear_cache')
    if (isVicunaFamilyModelId(modelId)) {
      actions.push('retry_hf')
    }
    actions.push('retry_mirror')
  }

  return {
    actions,
    smallerPresetId: smaller.id,
    smallerShortName: smaller.shortName,
  }
}
