import type { LoadPhase } from '../config/loadFailover'

/** User-facing load stepper (prefixed onto WebLLM's free-text progress). */
export type UiLoadPhase = 'rewrite' | 'wasm_probe' | 'download' | 'compile' | 'ready'

export const UI_LOAD_PHASE_ORDER: readonly UiLoadPhase[] = [
  'rewrite',
  'wasm_probe',
  'download',
  'compile',
  'ready',
]

const PHASE_LABEL: Record<UiLoadPhase, string> = {
  rewrite: '1/5 Rewrite',
  wasm_probe: '2/5 WASM',
  download: '3/5 Download',
  compile: '4/5 Compile',
  ready: '5/5 Ready',
}

/**
 * Map WebLLM InitProgressReport text + optional loadFailover telemetry onto a
 * stable UI phase. Heuristics are ordered most-specific first.
 */
export function classifyInitProgress(
  text: string,
  telemetryPhase?: LoadPhase | null,
): UiLoadPhase {
  if (telemetryPhase === 'wasm_probe') return 'wasm_probe'
  if (telemetryPhase === 'success') return 'ready'
  if (telemetryPhase === 'hf_retry' || telemetryPhase === 'vps_retry') return 'download'

  const t = text.toLowerCase()

  if (
    t.includes('finaliz') ||
    t.includes('ready') ||
    t.includes('setup complete')
  ) {
    return 'ready'
  }

  if (
    t.includes('probing model wasm') ||
    t.includes('wasm library') ||
    t.includes('model_lib') ||
    (t.includes('wasm') && (t.includes('head') || t.includes('probe')))
  ) {
    return 'wasm_probe'
  }

  if (t.includes('rewrit') || t.includes('/resolve/main/')) {
    return 'rewrite'
  }

  if (
    t.includes('shader') ||
    t.includes('compil') ||
    t.includes('loading gpu') ||
    t.includes('finish loading')
  ) {
    return 'compile'
  }

  return 'download'
}

export function formatLoadStatus(text: string, phase: UiLoadPhase): string {
  const trimmed = text.trim()
  return trimmed ? `[${PHASE_LABEL[phase]}] ${trimmed}` : `[${PHASE_LABEL[phase]}]`
}
