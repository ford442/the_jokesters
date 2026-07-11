/**
 * Portable episode transcript format (.jokesters.json).
 * Only text is stored — TTS and avatars re-render on replay ("Director's Cut").
 */

export const EPISODE_FORMAT_VERSION = 1 as const

/** Lightweight agent snapshot for export (no system prompts). */
export interface EpisodeAgent {
  id: string
  name: string
  color?: string
}

export interface EpisodeTurn {
  agentId: string
  text: string
  /** Unix ms timestamp (wall clock or relative from scene start). */
  ts: number
  /** Optional sound-effect cue for future remix (e.g. "rimshot", "applause"). */
  sfx?: string
}

/** Optional scene metadata for context on import/replay. */
export interface EpisodeSceneState {
  title?: string
  description?: string
  mode?: string
  chaosLevel?: number
  seed?: number
  /** Free-form bag for future fields; ignored by validators except type check. */
  [key: string]: unknown
}

export interface JokestersEpisode {
  version: typeof EPISODE_FORMAT_VERSION | number
  modelId: string | null
  agents: EpisodeAgent[]
  turns: EpisodeTurn[]
  sceneState?: EpisodeSceneState
  /** Optional stable id (ISO-ish) for file naming / cloud later. */
  episodeId?: string
  /** When the export was created. */
  exportedAt?: string
}

export type EpisodeValidationErrorCode =
  | 'not_object'
  | 'bad_version'
  | 'bad_agents'
  | 'bad_turns'
  | 'bad_turn_fields'
  | 'bad_model_id'
  | 'empty_turns'

export interface EpisodeValidationResult {
  ok: boolean
  errors: { code: EpisodeValidationErrorCode; message: string }[]
  episode?: JokestersEpisode
}
