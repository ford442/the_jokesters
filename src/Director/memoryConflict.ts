import type { Message } from '../types/chat';
import type { StoredEpisode, VectorClock } from './memoryTypes';
import * as Y from 'yjs';

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
export function mergeHistories(
  cloudHistory: Message[],
  localHistory: Message[],
  cloudYjsState?: string,
  localYjsState?: string
): { history: Message[], yjsState: string } {
  // Use Yjs CRDT for advanced merging
  // Note: For now, we create an ephemeral Y.Doc per merge and persist the yjsState string.
  // In the future, MemoryManager could own live Y.Docs mapped by episodeId for multi-device live editing.
  const ydoc = new Y.Doc();
  const yarray = ydoc.getArray<Message>('history');

  if (cloudYjsState) {
      try {
          const uint8array = Uint8Array.from(atob(cloudYjsState), c => c.charCodeAt(0));
          Y.applyUpdate(ydoc, uint8array);
      } catch (e) {
          console.warn('Failed to parse cloudYjsState', e);
      }
  } else {
      // Fallback: Insert cloud history first if no yjs state
      yarray.insert(0, cloudHistory);
  }

  if (localYjsState) {
      try {
          const uint8array = Uint8Array.from(atob(localYjsState), c => c.charCodeAt(0));
          Y.applyUpdate(ydoc, uint8array);
      } catch (e) {
          console.warn('Failed to parse localYjsState', e);
      }
  }

  // Add any local history that isn't already in the yarray
  const currentHistory = yarray.toArray();
  const seen = new Set(currentHistory.map(m => `${m.role}:${m.content}`));
  for (const msg of localHistory) {
      const key = `${msg.role}:${msg.content}`;
      if (!seen.has(key)) {
          yarray.push([msg]);
          seen.add(key);
      }
  }

  const updateBytes = Y.encodeStateAsUpdate(ydoc);
  let base64 = '';
  for (let i = 0; i < updateBytes.byteLength; i++) {
      base64 += String.fromCharCode(updateBytes[i]);
  }

  return { history: yarray.toArray(), yjsState: btoa(base64) };
}

/**
 * Automatic conflict resolution driven by Yjs CRDT and vector clocks (used by
 * syncAllHistoryFromCloud's two-way sync). When the clocks are concurrent,
 * merges history using Yjs and bumps clientId's own counter, matching
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

  const { history, yjsState } = mergeHistories(cloudData.history, localData.history, cloudData.yjsState, localData.yjsState);

  const resolved: StoredEpisode = {
    ...localData,
    history: history,
    yjsState: yjsState,
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

  const { history, yjsState } = mergeHistories(cloudState.history, localState.history, cloudState.yjsState, localState.yjsState);

  return {
    ...localState,
    history: history,
    yjsState: yjsState,
    vectorClock: mergedVectorClock,
    updatedAt: Date.now(),
    timestamp: Date.now(),
  };
}