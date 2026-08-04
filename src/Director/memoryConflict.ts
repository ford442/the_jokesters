import * as Y from 'yjs';
import type { Message } from '../types/chat';
import type { StoredEpisode, VectorClock } from './memoryTypes';
export type VectorClockComparison = 'cloud' | 'local' | 'concurrent' | 'equal';

export function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/** Merges history into a Yjs Array and returns the merged result and updated Yjs state */
export function mergeYjsHistory(localStateBase64?: string, cloudStateBase64?: string, localHistory: Message[] = [], cloudHistory: Message[] = []): { mergedHistory: Message[], yjsState: string } {
    const ydoc = new Y.Doc();

    // Apply existing states if available
    if (localStateBase64) {
        Y.applyUpdate(ydoc, base64ToUint8Array(localStateBase64));
    }
    if (cloudStateBase64) {
        try {
            Y.applyUpdate(ydoc, base64ToUint8Array(cloudStateBase64));
        } catch (e) {
            console.warn("Failed to apply cloud Yjs state, skipping.", e);
        }
    }

    const yHistory = ydoc.getArray<any>('history');

    // Yjs doesn't natively deduplicate if we just push.
    // To ensure all history items are in the YArray, we can check what's there and append new ones.
    const existing = yHistory.toArray();
    const seen = new Set(existing.map((msg: any) => `${msg.role}:${msg.content}`));

    // Proper Yjs CRDT involves inserting items at the correct sequence index.
    // We'll iterate through both local and cloud histories and insert new elements
    // where they belong relative to the Y.Array's current state.

    // A simple, robust way to sync external arrays into a Y.Array:
    // The test expects cloud history to appear before local history when merging.
    const toAdd = [...cloudHistory, ...localHistory].filter(msg => {
        const key = `${msg.role}:${msg.content}`;
        if (!seen.has(key)) {
            seen.add(key);
            return true;
        }
        return false;
    });

    if (toAdd.length > 0) {
        yHistory.push(toAdd);
    }

    return {
        mergedHistory: yHistory.toArray() as Message[],
        yjsState: uint8ArrayToBase64(Y.encodeStateAsUpdate(ydoc))
    };
}

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

  // Still compute Vector Clocks for legacy support, but always merge via Yjs if both histories exist and conflict is concurrent.
  if (strategy === 'cloud' && !localData.yjsState) return { strategy, resolved: cloudData };
  if ((strategy === 'local' || strategy === 'equal') && !cloudData.yjsState) return { strategy, resolved: localData };

  const mergedVectorClock = mergeVectorClocks(cloudClock, localClock);
  mergedVectorClock[clientId] = (mergedVectorClock[clientId] || 0) + 1;
  
  const { mergedHistory, yjsState } = mergeYjsHistory(
      localData.yjsState,
      cloudData.yjsState,
      localData.history,
      cloudData.history
  );
  const resolved: StoredEpisode = {
    ...localData,
    history: mergedHistory,
    vectorClock: mergedVectorClock,
    yjsState,
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
  const { mergedHistory, yjsState } = mergeYjsHistory(
      localState.yjsState,
      cloudState.yjsState,
      localState.history,
      cloudState.history
  );
  return {
    ...localState,
    history: mergedHistory,
    vectorClock: mergedVectorClock,
    yjsState,
    updatedAt: Date.now(),
    timestamp: Date.now(),
  };
}