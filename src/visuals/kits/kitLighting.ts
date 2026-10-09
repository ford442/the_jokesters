import type { StageKitId } from '../stageKitIds'

export interface KitLightPreset {
  /** Ambient house / studio wash. */
  ambientColor: number
  ambientIntensity: number
  background: number
}

/** Void keeps the bare stage and warms the house lights. Other kits are cooler sets. */
export const KIT_LIGHT_PRESETS: Record<StageKitId, KitLightPreset> = {
  void: { ambientColor: 0xffd2a8, ambientIntensity: 0.55, background: 0x241c2e },
  talkshow: { ambientColor: 0xfff0d8, ambientIntensity: 0.4, background: 0x1a1020 },
  news: { ambientColor: 0xd6e6ff, ambientIntensity: 0.42, background: 0x0e1a33 },
  court: { ambientColor: 0xf3efe4, ambientIntensity: 0.4, background: 0x1c1a17 },
}
