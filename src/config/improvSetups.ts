/**
 * Improv scene presets — derived from MODE_REGISTRY entries flagged showInPresets.
 * To add a preset: register the mode in registryEntries.ts with showInPresets: true
 * and title/description metadata.
 */
export type { ImprovSetup } from '../Director/modes/registry';
export { getUiPresets } from '../Director/modes/registry';

import { getUiPresets, type ImprovSetup } from '../Director/modes/registry';

/** Preset dropdown options (synced with MODE_REGISTRY). */
export const DEFAULT_IMPROV_SETUPS: ImprovSetup[] = getUiPresets();
