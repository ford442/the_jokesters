/**
 * Curated featured modes — always visible at top of mode browser for new users.
 */
export const FEATURED_MODE_IDS = [
  'improv',
  'roast',
  'reporter',
  'tech_support',
  'debate',
  'audience_heckler',
  'lightning_round',
  'therapy',
] as const

export type FeaturedModeId = (typeof FEATURED_MODE_IDS)[number]
