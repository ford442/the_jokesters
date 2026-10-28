import type { Message } from '../types/chat';
import { stampLegacyMessageIds } from '../chat/messageId';
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

function clockTotal(clock: VectorClock): number {
  let total = 0
  for (const key of Object.keys(clock)) total += clock[key] || 0
  return total
}

/** Canonical text form of a clock; breaks ties between equal totals the same way on every device. */
function clockKey(clock: VectorClock): string {
  return Object.keys(clock).sort().map((k) => `${k}=${clock[k] || 0}`).join(',')
}

/**
 * Ordered union of two histories keyed by message id: everything from `first` in its order,
 * then whatever of `second` it has not already seen. Messages that share text but not an id
 * are different messages and both survive.
 */
function unionById(first: Message[], second: Message[]): Message[] {
  const seen = new Set<string>()
  const merged: Message[] = []
  for (const msg of [...stampLegacyMessageIds(first), ...stampLegacyMessageIds(second)]) {
    if (seen.has(msg.id!)) continue
    seen.add(msg.id!)
    merged.push(msg)
  }
  return merged
}

export interface MergedHistory {
  strategy: VectorClockComparison
  history: Message[]
  vectorClock: VectorClock
}

/**
 * The one history merge. The vector clocks decide: when one side dominates (or they are equal)
 * that side's history and clock are returned as-is and nothing from the other side is mixed in.
 * Only for 'concurrent' clocks are the histories merged — by message id, keeping the order of
 * the side with the larger clock total and appending the other side's unseen ids — and the
 * clocks max-merged with `clientId` bumped. `force` merges even when a clock is decisive (the
 * dashboard's explicit Merge choice).
 */
export function mergeHistories(
  cloud: StoredEpisode,
  local: StoredEpisode,
  clientId: string,
  { force = false }: { force?: boolean } = {},
): MergedHistory {
  const cloudClock = cloud.vectorClock ?? {};
  const localClock = local.vectorClock ?? {};
  const strategy = compareVectorClocks(cloudClock, localClock);

  if (!force) {
    if (strategy === 'cloud') return { strategy, history: cloud.history, vectorClock: cloudClock };
    if (strategy === 'local' || strategy === 'equal') return { strategy, history: local.history, vectorClock: localClock };
  }

  const cloudTotal = clockTotal(cloudClock);
  const localTotal = clockTotal(localClock);
  const cloudLeads = cloudTotal !== localTotal
    ? cloudTotal > localTotal
    : clockKey(cloudClock) >= clockKey(localClock);

  const vectorClock = mergeVectorClocks(cloudClock, localClock);
  vectorClock[clientId] = (vectorClock[clientId] || 0) + 1;
  const history = cloudLeads
    ? unionById(cloud.history, local.history)
    : unionById(local.history, cloud.history);
  return { strategy, history, vectorClock };
}

/**
 * Automatic conflict resolution (used by syncAllHistoryFromCloud's two-way sync). A decisive
 * clock returns the winning episode untouched; concurrent clocks return `localData` with the
 * merged history and clock.
 */
export function resolveEpisodeConflict(
  cloudData: StoredEpisode,
  localData: StoredEpisode,
  clientId: string,
): { strategy: VectorClockComparison; resolved: StoredEpisode } {
  const { strategy, history, vectorClock } = mergeHistories(cloudData, localData, clientId);
  if (strategy === 'cloud') return { strategy, resolved: cloudData };
  if (strategy === 'local' || strategy === 'equal') return { strategy, resolved: localData };
  return { strategy, resolved: mergedEpisode(localData, history, vectorClock) };
}

function mergedEpisode(base: StoredEpisode, history: Message[], vectorClock: VectorClock): StoredEpisode {
  // yjsState is a legacy field from the abandoned Y.Doc path; drop it rather than carry a stale copy forward.
  const { yjsState: _legacy, ...rest } = base;
  return { ...rest, history, vectorClock, updatedAt: Date.now(), timestamp: Date.now() };
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

  const { history, vectorClock } = mergeHistories(cloudState, localState, clientId, { force: true });
  return mergedEpisode(localState, history, vectorClock);
}
