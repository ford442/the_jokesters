import type { SyncQueueItem, SyncState } from './memoryTypes';
import type { MemoryIdbStore } from './memoryIdbStore';
import type { CloudCredentialsSource } from './memoryCredentials';
import { Scope } from '../utils/lifecycle';

type SyncWorkerMessage =
    | { type: 'sync_success'; queueKey: string; itemId: string }
    | { type: 'sync_complete'; queueKey: string }
    | { type: 'sync_error'; error: string; item?: unknown }
    | { type: 'consolidation_complete'; episodeId: string };

interface PendingConsolidation {
    promise: Promise<void>;
    resolve: () => void;
    reject: (err: Error) => void;
}

/**
 * Background HF sync: the persisted queue (in `MemoryIdbStore`), the dedicated
 * worker that flushes it, and the periodic tasks that keep it moving.
 * `onSyncComplete` lets the owning MemoryManager react (cache invalidation)
 * without this module depending on the episode store.
 */
export class MemorySyncQueue {
    private syncWorker: Worker | null = null;
    private isSyncing = false;
    private syncStatusCallback: ((status: string) => void) | null = null;
    /** Owns the scheduler intervals; replaced on dispose so a disposed queue stays inert. */
    private scheduler: Scope | null = null;
    private disposed = false;
    private statusClearTimer: ReturnType<typeof setTimeout> | null = null;
    /** Consolidations awaiting a `consolidation_complete` / `sync_error` reply, by episode. */
    private pendingConsolidations = new Map<string, PendingConsolidation>();

    constructor(
        private idb: MemoryIdbStore,
        private creds: CloudCredentialsSource,
        private prefix: string,
        private getProfile: () => string,
        private onSyncComplete: () => void,
    ) {
        if (typeof Worker !== 'undefined') {
            this.syncWorker = new Worker(new URL('../workers/hfSync.worker.ts', import.meta.url), { type: 'module' });
            this.syncWorker.onmessage = async (e: MessageEvent<SyncWorkerMessage>) => {
                const data = e.data;
                if (data.type === 'sync_success') {
                    const queueRaw = await this.idb.getQueue<SyncQueueItem[]>(data.queueKey);
                    if (queueRaw) {
                        const queue = queueRaw.filter(q => q.id !== data.itemId);
                        await this.idb.setQueue(data.queueKey, queue);
                    }
                    if (this.syncStatusCallback) this.syncStatusCallback('Synced item successfully.');
                } else if (data.type === 'sync_complete') {
                    this.isSyncing = false;
                    localStorage.setItem(`${this.prefix}${this.getProfile()}-last-sync-time`, Date.now().toString());
                    localStorage.removeItem(`${this.prefix}${this.getProfile()}-sync-error`);
                    window.dispatchEvent(new CustomEvent('syncStatusUpdated'));

                    // Invalidate local cache if we just fully synced
                    this.onSyncComplete();
                } else if (data.type === 'consolidation_complete') {
                    this.settleConsolidation(data.episodeId, null);
                } else if (data.type === 'sync_error') {
                    console.error('Sync error from worker:', data.error);
                    // Consolidation errors carry no item; fail whichever consolidation is in flight.
                    if (!data.item) this.settleConsolidation(null, new Error(data.error));
                    localStorage.setItem(`${this.prefix}${this.getProfile()}-sync-error`, data.error);
                    window.dispatchEvent(new CustomEvent('syncStatusUpdated'));

                    this.notifySyncIssue(`Sync error: ${data.error}`);
                }
            };
        }
    }

    setSyncStatusCallback(callback: (status: string) => void) {
        this.syncStatusCallback = callback;
    }

    /** Surfaces a transient cloud-sync problem via the status callback (in addition to console logging). */
    notifySyncIssue(message: string): void {
        if (!this.syncStatusCallback) return;
        this.syncStatusCallback(message);
        if (this.statusClearTimer) clearTimeout(this.statusClearTimer);
        this.statusClearTimer = setTimeout(() => {
            this.statusClearTimer = null;
            if (this.syncStatusCallback && !this.isSyncing) {
                this.syncStatusCallback('');
            }
        }, 4000);
    }

    async getSyncState(): Promise<SyncState> {
        const queueKey = 'sync-queue';
        const queueRaw = await this.idb.getQueue<SyncQueueItem[]>(queueKey);
        const queue = queueRaw || [];
        const lastSyncTimeStr = localStorage.getItem(`${this.prefix}${this.getProfile()}-last-sync-time`);
        const lastSyncTime = lastSyncTimeStr ? parseInt(lastSyncTimeStr, 10) : null;
        const syncError = localStorage.getItem(`${this.prefix}${this.getProfile()}-sync-error`);

        return {
            isSyncing: this.isSyncing,
            queueLength: queue.length,
            lastSyncTime,
            syncError
        };
    }

    /** Appends a job to the sync queue and kicks off processing. `dedupeByFilename` drops any
     *  existing queued job for the same file first (used when a newer save supersedes it). */
    async enqueue(item: Omit<SyncQueueItem, 'id'>, dedupeByFilename = false): Promise<void> {
        const queueKey = `sync-queue`;
        const queueRaw = await this.idb.getQueue<SyncQueueItem[]>(queueKey);
        let queue: SyncQueueItem[] = queueRaw || [];
        if (dedupeByFilename) {
            queue = queue.filter(q => q.filename !== item.filename);
        }
        const jobId = Math.random().toString(36).substring(2, 15);
        queue.push({ id: jobId, ...item });

        await this.idb.setQueue(queueKey, queue);
        void this.processSyncQueue();
    }

    async processSyncQueue(): Promise<void> {
        if (!navigator.onLine) {
            console.log("Currently offline. Sync queued until connection is restored.");
            if (this.syncStatusCallback) this.syncStatusCallback('Offline - sync paused');
            return;
        }

        const token = this.creds.getToken();
        if (this.isSyncing || !token || !this.syncWorker) return;

        const queueKey = `sync-queue`;
        const queueRaw = await this.idb.getQueue<SyncQueueItem[]>(queueKey);
        if (!queueRaw) return;

        const queue: SyncQueueItem[] = queueRaw;
        if (queue.length === 0) return;

        if (this.syncStatusCallback) this.syncStatusCallback(`Syncing ${queue.length} item(s)...`);

        this.isSyncing = true;

        this.syncWorker.postMessage({
            type: 'sync',
            queueKey,
            token,
            repoId: this.creds.getRepoId(),
            items: queue
        });
    }

    /**
     * Asks the worker to merge an episode's deltas. Resolves when the worker
     * reports `consolidation_complete`, rejects on a worker error or missing
     * credentials (callers' try/catch now sees failures). One consolidation per
     * episode is in flight at a time; repeated calls share it.
     */
    consolidateEpisodeDeltas(episodeId: string, timeoutMs = 5 * 60 * 1000): Promise<void> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId || !this.syncWorker) {
            return Promise.reject(new Error('Cloud credentials or sync worker not configured.'));
        }
        const existing = this.pendingConsolidations.get(episodeId);
        if (existing) return existing.promise;

        let settle!: Pick<PendingConsolidation, 'resolve' | 'reject'>;
        const promise = new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.settleConsolidation(episodeId, new Error(`Consolidation of ${episodeId} timed out`));
            }, timeoutMs);
            settle = {
                resolve: () => { clearTimeout(timer); resolve(); },
                reject: (err) => { clearTimeout(timer); reject(err); },
            };
        });
        this.pendingConsolidations.set(episodeId, { ...settle, promise });

        this.syncWorker.postMessage({
            type: 'consolidate_deltas',
            episodeId,
            token,
            repoId
        });
        return promise;
    }

    /** `episodeId: null` settles the oldest pending consolidation (worker errors carry no id). */
    private settleConsolidation(episodeId: string | null, error: Error | null): void {
        const key = episodeId ?? this.pendingConsolidations.keys().next().value;
        if (key === undefined) return;
        const entry = this.pendingConsolidations.get(key);
        if (!entry) return;
        this.pendingConsolidations.delete(key);
        if (error) {
            this.notifySyncIssue(`Consolidation failed: ${error.message}`);
            entry.reject(error);
        } else {
            entry.resolve();
        }
    }

    /**
     * Single background scheduler (idempotent): flushes the queue every minute
     * and consolidates deltas every hour. A private Scope owns the timers so `dispose()` can
     * stop them. Previously three un-stoppable intervals, two of them duplicates.
     */
    startScheduler(listEpisodes: () => Promise<string[]>): void {
        if (this.scheduler || this.disposed) return;
        const scheduler = (this.scheduler = new Scope());
        scheduler.interval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.processSyncQueue().catch(e => {
                    console.error("Auto-sync failed:", e);
                    this.notifySyncIssue(`Auto-sync failed: ${(e as Error)?.message ?? e}`);
                });
            }
        }, 60 * 1000);
        scheduler.interval(() => {
            void (async () => {
                try {
                    const episodes = await listEpisodes();
                    for (const episode of episodes) {
                        await this.consolidateEpisodeDeltas(episode);
                    }
                } catch (e) {
                    console.error("Error running consolidation task:", e);
                }
            })();
        }, 60 * 60 * 1000);
    }

    /** Stops the scheduler, rejects pending consolidations and terminates the worker. Idempotent. */
    dispose(): void {
        this.disposed = true;
        void this.scheduler?.dispose();
        this.scheduler = null;
        if (this.statusClearTimer) clearTimeout(this.statusClearTimer);
        this.statusClearTimer = null;
        for (const entry of this.pendingConsolidations.values()) {
            entry.promise.catch(() => { /* caller may be gone; avoid unhandled rejection */ });
            entry.reject(new Error("Sync queue disposed"));
        }
        this.pendingConsolidations.clear();
        this.syncWorker?.terminate();
        this.syncWorker = null;
        this.syncStatusCallback = null;
    }
}
