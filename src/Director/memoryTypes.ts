import type { Message } from '../types/chat';
import type { Scenario } from './Director';

/**
 * Internal local/cloud sync record shape used by MemoryManager's IndexedDB /
 * localStorage / HuggingFace persistence. NOT the same as the portable
 * `.jokesters.json` export format (see `src/episode/types.ts` — that format
 * stores rendered `turns`, this one stores raw chat `history` plus vector
 * clock metadata used for multi-device conflict resolution).
 */
export interface StoredEpisode {
  history: Message[];
  scenario?: Scenario | null;
  vectorClock?: VectorClock;
  updatedAt?: number;
  timestamp?: number;
  yjsState?: string; // base64 encoded Y.Doc state
}

/** Per-client logical clock: clientId -> monotonically increasing counter. */
export type VectorClock = Record<string, number>;

export interface SyncQueueItem {
  id: string;
  /** Destination repo override (e.g. community script publish); default repo used when unset. */
  repoId?: string;
  filename: string;
  content: string;
}

export interface EpisodeSearchResult {
  episodeId: string;
  snippet: string;
}

export interface EpisodeAnalytics {
  totalEpisodes: number;
  totalTokensProxy: number;
  avgEpisodeLength: number;
  commonModes: Record<string, number>;
}

export interface SyncState {
  isSyncing: boolean;
  queueLength: number;
  lastSyncTime: number | null;
  syncError: string | null;
}

export interface CloudCredentials {
  token: string | null;
  repoId: string | null;
}

/** Manual resolution the user picks in the conflict dashboard (distinct from the
 *  automatic vector-clock strategy `resolveEpisodeConflict` computes). */
export type ConflictResolution = 'local' | 'cloud' | 'merge';

/**
 * Free-form user preference bag. No canonical shape exists elsewhere in the
 * codebase yet — kept intentionally open so callers can add fields without a
 * type-file churn; still strictly better than `any` at the storage boundary.
 */
export type UserProfile = Record<string, unknown>;

/**
 * A file entry from HFStorageManager.getDatasetHistory(). The HF dataset API
 * can answer with either a `paths-info` file listing or (fallback) a `tree`
 * listing; dashboard UI code has always duck-typed between the two rather
 * than the API guaranteeing one shape, so this type reflects both possible
 * fields as optional instead of asserting a contract HF doesn't document.
 */
export interface HFHistoryEntry {
  path?: string;
  size?: number;
  oid?: string;
  type?: string;
  commit?: unknown;
  date?: string;
  createdAt?: string;
  message?: string;
  commitMessage?: string;
  title?: string;
  author?: { name?: string } | string;
}

export interface PendingDelta {
  id: string;
  path: string;
  action: 'delta_merge';
  /** Placeholder until the delta content is actually downloaded for preview. */
  cloudState: { fileInfo: string; size?: number };
  localState: Record<string, never>;
}
