import type { Scenario } from '../Director/Director';

export type ModeFamily =
  | 'improv'
  | 'performance'
  | 'interactive'
  | 'media'
  | 'reporter'
  | 'creative'
  | 'absurd';

/**
 * Per-mode metadata. Comedy defaults on for improv/performance/interactive families.
 */
export interface ModeDefinition {
  family: ModeFamily;
  /** Explicit override — false opts out of CallbackEngine for absurd/surreal modes. */
  comedyEnabled?: boolean;
}

const IMPROV_TYPES = new Set(['improv', 'autonomous']);

const PERFORMANCE_TYPES = new Set([
  'roast',
  'enhanced_roast',
  'roast_battle',
  'heckler_interaction',
  'standup',
  'story',
  'collaborative_story',
  'debate',
  'musical',
  'musical_improv_session',
  'podcast',
  'script',
  'dream',
  'historical',
  'sports_commentator',
  'audience_interaction',
  'chain_reaction',
  'audience_heckler',
  'visual_stage_destruction',
  'meltdown',
  'lightning_round',
  'rapid_fire_trivia',
  'rapid_fire_roast',
  'rapid_fire_association',
  'rapid_fire_this_or_that',
  'rap_battle_visuals',
  'commentary',
]);

const INTERACTIVE_TYPES = new Set([
  'trial',
  'tech_support',
  'dungeon_master',
  'trivia',
  'interview',
  'superhero',
  'dating_show',
  'escape_room_game_master',
  'silent_treatment',
  'support_group',
  'intervention',
  'customer_service_hell',
  'browser_history_interrogation',
  'dating_profile_review',
  'armchair_detectives',
  'reverse_turing_test',
  'reverse_turing',
  'rpg_vendor',
  'galactic_translators',
  'interdimensional_customs',
  'interrogation',
  'code_review',
  'therapy',
  'ai_therapy',
  'superhero_therapy',
  'dating_app_algorithm_rebellion',
]);

/** Pure-absurd modes that stay off unless scenario.config.comedyEnabled = true. */
export const ABSURD_MODE_OVERRIDES: Partial<Record<string, ModeDefinition>> = {
  sentient_npcs: { family: 'absurd', comedyEnabled: false },
  mime_convention: { family: 'absurd', comedyEnabled: false },
  philosophical_zombie: { family: 'absurd', comedyEnabled: false },
  bureau_of_silly_walks_simulator: { family: 'absurd', comedyEnabled: false },
  silent_film: { family: 'absurd', comedyEnabled: false },
  dream: { family: 'performance', comedyEnabled: true },
};

export function getModeFamily(type: string): ModeFamily {
  if (IMPROV_TYPES.has(type)) return 'improv';
  if (PERFORMANCE_TYPES.has(type)) return 'performance';
  if (INTERACTIVE_TYPES.has(type)) return 'interactive';
  if (type === 'reaction' || type === 'vision' || type === 'watcher') return 'media';
  if (type === 'reporter' || type === 'newsroom' || type === 'meltdown') return 'reporter';
  if (
    type.includes('mystery') ||
    type.includes('pitch') ||
    type.includes('procedural') ||
    type.includes('creative')
  ) {
    return 'creative';
  }
  return 'absurd';
}

export function getModeDefinition(type: string): ModeDefinition {
  const override = ABSURD_MODE_OVERRIDES[type];
  if (override) return override;
  return { family: getModeFamily(type) };
}

/**
 * Returns true when CallbackEngine / quality hooks should run for this scenario.
 */
export function isComedyEnabled(
  type: string,
  config?: Scenario['config'],
): boolean {
  if (config?.comedyEnabled !== undefined) return config.comedyEnabled;

  const def = getModeDefinition(type);
  if (def.comedyEnabled !== undefined) return def.comedyEnabled;

  return def.family === 'improv' || def.family === 'performance' || def.family === 'interactive';
}
