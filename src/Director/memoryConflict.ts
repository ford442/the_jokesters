import type { Message } from '../types/chat';
import type { StoredEpisode, VectorClock } from './memoryTypes';

export type VectorClockComparison = 'cloud' | 'local' | 'concurrent' | 'equal';

/**
 * Compares two vector clocks and decides which side (if either) causally
 * dominates. 'concurrent' means both sides advanced independently since the
 * last common ancestor — callers should merge rather than pick a winner.
 */
export function compareVectorClocks(cloudClock: VectorClock, localClock: VectorClock): VectorClockComparison {
  let cloudDominates = false;
  let localDominates = false;

  const allKeys = new Set([...Object.keys(cloudClock), ...Object.keys(localClock)]);
  for (const key of allKeys) {
    const c = cloudClock[key] || 0;
    const l = localClock[key] || 0;
    if (c > l) cloudDominates = true;
    if (l > c) localDominates = true;
  }

  if (cloudDominates && localDominates) return 'concurrent';
  if (cloudDominates) return 'cloud';
  if (localDominates) return 'local';
  return 'equal';
}

/** Merges two vector clocks by taking the max counter per client id. */
export function mergeVectorClocks(cloudClock: VectorClock, localClock: VectorClock): VectorClock {
  const merged: VectorClock = {};
  const allKeys = new Set([...Object.keys(cloudClock), ...Object.keys(localClock)]);
  for (const key of allKeys) {
    merged[key] = Math.max(cloudClock[key] || 0, localClock[key] || 0);
  }
  return merged;
}

/** Concatenates cloud + local history, deduping by exact role+content match. */
export function mergeHistories(cloudHistory: Message[], localHistory: Message[]): Message[] {
  const merged = [...cloudHistory, ...localHistory];
  const seen = new Set<string>();
  const unique: Message[] = [];
  for (const msg of merged) {
    const key = `${msg.role}:${msg.content}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(msg);
    }
  }
  return unique;
}

/**
 * Automatic conflict resolution driven by vector clocks (used by
 * syncAllHistoryFromCloud's two-way sync). When the clocks are concurrent,
 * merges history + vector clocks and bumps clientId's own counter, matching
 * the "yes-and" behavior this app has always had for concurrent edits.
 */
export function resolveEpisodeConflict(
  cloudData: StoredEpisode,
  localData: StoredEpisode,
  clientId: string,
): { strategy: VectorClockComparison; resolved: StoredEpisode } {
  const cloudClock = cloudData.vectorClock ?? {};
  const localClock = localData.vectorClock ?? {};
  const strategy = compareVectorClocks(cloudClock, localClock);

  if (strategy === 'cloud') return { strategy, resolved: cloudData };
  if (strategy === 'local' || strategy === 'equal') return { strategy, resolved: localData };

  const mergedVectorClock = mergeVectorClocks(cloudClock, localClock);
  mergedVectorClock[clientId] = (mergedVectorClock[clientId] || 0) + 1;

  const resolved: StoredEpisode = {
    ...localData,
    history: mergeHistories(cloudData.history, localData.history),
    vectorClock: mergedVectorClock,
    updatedAt: Date.now(),
    timestamp: Date.now(),
  };
  return { strategy, resolved };
}

/**
 * Manual conflict resolution — the dashboard's Accept Local / Accept Cloud /
 * Merge choice, independent of what the vector clocks would have decided
 * automatically.
 */
export function applyManualResolution(
  localState: StoredEpisode,
  cloudState: StoredEpisode,
  resolution: 'local' | 'cloud' | 'merge',
  clientId: string,
): StoredEpisode {
  if (resolution === 'local') return localState;
  if (resolution === 'cloud') return cloudState;

  const mergedVectorClock = mergeVectorClocks(cloudState.vectorClock ?? {}, localState.vectorClock ?? {});
  mergedVectorClock[clientId] = (mergedVectorClock[clientId] || 0) + 1;

  return {
    ...localState,
    history: mergeHistories(cloudState.history, localState.history),
    vectorClock: mergedVectorClock,
    updatedAt: Date.now(),
    timestamp: Date.now(),
  };
}
