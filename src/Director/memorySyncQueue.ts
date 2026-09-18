import type { SyncQueueItem, SyncState } from './memoryTypes';
import { MemoryIdbStore } from './memoryIdbStore';
import type { CloudCredentialsSource } from './memoryCredentials';

type SyncWorkerMessage =
    | { type: 'sync_success'; queueKey: string; itemId: string }
    | { type: 'sync_complete'; queueKey: string }
    | { type: 'sync_error'; error: string; item?: unknown }
    | { type: 'consolidation_complete'; episodeId: string };

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
                } else if (data.type === 'sync_error') {
                    console.error('Sync error from worker:', data.error);
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
        setTimeout(() => {
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
        this.processSyncQueue();
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

    consolidateEpisodeDeltas(episodeId: string): void {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId || !this.syncWorker) {
            console.error("Cloud credentials or sync worker not configured.");
            return;
        }

        this.syncWorker.postMessage({
            type: 'consolidate_deltas',
            episodeId,
            token,
            repoId
        });
    }

    startAutoSyncTask(): void {
        setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.processSyncQueue().catch(e => console.error("Error in auto-sync task:", e));
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    startPeriodicAutoSync(): void {
        setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.processSyncQueue().catch(e => console.error("Auto-sync failed:", e));
            }
        }, 60 * 1000); // Auto-sync every minute
    }

    startDeltaConsolidationTask(listEpisodes: () => Promise<string[]>): void {
        // Periodically run consolidation
        setInterval(async () => {
            try {
                const episodes = await listEpisodes();
                for (const episode of episodes) {
                    this.consolidateEpisodeDeltas(episode);
                }
            } catch (e) {
                console.error("Error running consolidation task:", e);
            }
        }, 60 * 60 * 1000); // Run every hour
    }
}
