import { HFStorageManager } from './HFStorageManager';

export class MemoryManager {
    private prefix: string = 'jokesters-';
    private hfStorage: HFStorageManager;
    private hfToken: string | null = null;
    private hfRepoId: string | null = null;
    private syncWorker: Worker | null = null;
    private isSyncing: boolean = false;
    private currentProfile: string = 'default';
    private clientId: string;
    private syncStatusCallback: ((status: string) => void) | null = null;

    // IndexedDB Helpers
    private dbName = 'jokestersDB';
    private storeName = 'episodes';
    private queueStoreName = 'syncQueue';

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
                if (!db.objectStoreNames.contains(this.queueStoreName)) {
                    db.createObjectStore(this.queueStoreName);
                }
            };
            request.onsuccess = (event: any) => resolve(event.target.result);
            request.onerror = (event: any) => reject(event.target.error);
        });
    }

    private async idbSetQueue(key: string, val: any): Promise<void> {
        const db = await this.openDB();
        const namespacedKey = `${this.currentProfile}-${key}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.queueStoreName, 'readwrite');
            const store = tx.objectStore(this.queueStoreName);
            const request = store.put(val, namespacedKey);
            request.onsuccess = () => resolve();
            request.onerror = (e: any) => reject(e.target.error);
        });
    }

    private async idbGetQueue(key: string): Promise<any> {
        const db = await this.openDB();
        const namespacedKey = `${this.currentProfile}-${key}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.queueStoreName, 'readonly');
            const store = tx.objectStore(this.queueStoreName);
            const request = store.get(namespacedKey);
            request.onsuccess = (e: any) => resolve(e.target.result);
            request.onerror = (e: any) => reject(e.target.error);
        });
    }

    private async idbSet(key: string, val: any): Promise<void> {
        const db = await this.openDB();
        const namespacedKey = `${this.currentProfile}-${key}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put(val, namespacedKey);
            request.onsuccess = () => resolve();
            request.onerror = (e: any) => reject(e.target.error);
        });
    }

    private async idbGet(key: string): Promise<any> {
        const db = await this.openDB();
        const namespacedKey = `${this.currentProfile}-${key}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(namespacedKey);
            request.onsuccess = (e: any) => resolve(e.target.result);
            request.onerror = (e: any) => reject(e.target.error);
        });
    }

    // private async idbRemove(key: string): Promise<void> {
    //     const db = await this.openDB();
    //     return new Promise((resolve, reject) => {
    //         const tx = db.transaction(this.storeName, 'readwrite');
    //         const store = tx.objectStore(this.storeName);
    //         const request = store.delete(key);
    //         request.onsuccess = () => resolve();
    //         request.onerror = (e: any) => reject(e.target.error);
    //     });
    // }

    private async idbKeys(): Promise<string[]> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.getAllKeys();
            request.onsuccess = (e: any) => {
                const keys = e.target.result as string[];
                const prefix = `${this.currentProfile}-`;
                resolve(keys.filter(k => k.startsWith(prefix)).map(k => k.substring(prefix.length)));
            };
            request.onerror = (e: any) => reject(e.target.error);
        });
    }

    constructor() {
        this.hfStorage = new HFStorageManager();
        let storedId = localStorage.getItem(this.prefix + 'client-id');
        if (!storedId) {
            storedId = Math.random().toString(36).substring(2, 15);
            localStorage.setItem(this.prefix + 'client-id', storedId);
        }
        this.clientId = storedId;
        this.loadProfileFromStorage();
        if (typeof Worker !== 'undefined') {
            this.syncWorker = new Worker(new URL('../workers/hfSync.worker.ts', import.meta.url), { type: 'module' });
            this.syncWorker.onmessage = async (e) => {
                const data = e.data;
                if (data.type === 'sync_success') {
                    const queueRaw = await this.idbGetQueue(data.queueKey);
                    if (queueRaw) {
                        let queue: any[] = queueRaw;
                        queue = queue.filter(q => q.id !== data.itemId);
                        await this.idbSetQueue(data.queueKey, queue);
                    }
                    if (this.syncStatusCallback) this.syncStatusCallback('Synced item successfully.');
                } else if (data.type === 'sync_complete') {
                    this.isSyncing = false;
                    localStorage.setItem(`${this.prefix}${this.currentProfile}-last-sync-time`, Date.now().toString());
                    localStorage.removeItem(`${this.prefix}${this.currentProfile}-sync-error`);
                    window.dispatchEvent(new CustomEvent('syncStatusUpdated'));

                    // Invalidate local cache if we just fully synced
                    this.invalidateSyncedLocalEpisodes().catch(e => console.error("Error invalidating cache:", e));
} else if (data.type === 'sync_error') {
        console.error('Sync error from worker:', data.error);
        localStorage.setItem(`${this.prefix}${this.currentProfile}-sync-error`, data.error);
        window.dispatchEvent(new CustomEvent('syncStatusUpdated'));
        
        if (this.syncStatusCallback) {
            this.syncStatusCallback(`Sync error: ${data.error}`);
        }
        
        setTimeout(() => {
            if (this.syncStatusCallback && !this.isSyncing) {
                this.syncStatusCallback('');
            }
        }, 4000);
                }
            };
        }
        this.loadCloudCredentials();
        this.processSyncQueue();
        this.ensureCloudSummaryCache();
        this.startDeltaConsolidationTask();
    }

    public setSyncStatusCallback(callback: (status: string) => void) {
        this.syncStatusCallback = callback;
    }

    private loadProfileFromStorage(): void {
        const savedProfile = localStorage.getItem(this.prefix + 'current-profile');
        if (savedProfile) {
            this.currentProfile = savedProfile;
        }
    }


    public async getSyncState(): Promise<{ isSyncing: boolean, queueLength: number, lastSyncTime: number | null, syncError: string | null }> {
        const queueKey = 'sync-queue';
        const queueRaw = await this.idbGetQueue(queueKey);
        const queue = queueRaw || [];
        const lastSyncTimeStr = localStorage.getItem(`${this.prefix}${this.currentProfile}-last-sync-time`);
        const lastSyncTime = lastSyncTimeStr ? parseInt(lastSyncTimeStr, 10) : null;
        const syncError = localStorage.getItem(`${this.prefix}${this.currentProfile}-sync-error`);

        return {
            isSyncing: this.isSyncing,
            queueLength: queue.length,
            lastSyncTime,
            syncError
        };
    }

    public switchProfile(profileName: string): void {
        this.currentProfile = profileName;
        localStorage.setItem(this.prefix + 'current-profile', profileName);
        this.loadCloudCredentials(); // Reload credentials for the new profile
    }

    public getCurrentProfile(): string {
        return this.currentProfile;
    }

    private loadCloudCredentials(): void {
        this.hfToken = localStorage.getItem(`${this.prefix}${this.currentProfile}-hf-token`);
        this.hfRepoId = localStorage.getItem(`${this.prefix}${this.currentProfile}-hf-repo`);
    }

    public setCloudCredentials(token: string, repoId: string): void {
        this.hfToken = token;
        this.hfRepoId = repoId;
        localStorage.setItem(`${this.prefix}${this.currentProfile}-hf-token`, token);
        localStorage.setItem(`${this.prefix}${this.currentProfile}-hf-repo`, repoId);
    }

    public getCloudCredentials(): { token: string | null, repoId: string | null } {
        return { token: this.hfToken, repoId: this.hfRepoId };
    }

    public async validateCloudCredentials(): Promise<boolean> {
        if (!this.hfToken) return false;
        return await this.hfStorage.validateToken(this.hfToken);
    }

    public save(key: string, data: any): void {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(`${this.prefix}${this.currentProfile}-${key}`, serialized);
        } catch (error) {
            console.error('MemoryManager save error:', error);
        }
    }

    public load<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(`${this.prefix}${this.currentProfile}-${key}`);
            if (!item) return null;
            return JSON.parse(item) as T;
        } catch (error) {
            console.error('MemoryManager load error:', error);
            return null;
        }
    }

    public remove(key: string): void {
        localStorage.removeItem(`${this.prefix}${this.currentProfile}-${key}`);
    }

    public saveEpisode(episodeId: string, data: any): void {
        // Update vector clock and timestamp
        if (!data.vectorClock) data.vectorClock = {};
        data.vectorClock[this.clientId] = (data.vectorClock[this.clientId] || 0) + 1;
        data.updatedAt = Date.now();
        data.timestamp = Date.now();
        this.save(`episode-${episodeId}`, data);
        this.idbSet(`episode-${episodeId}`, data).catch(e => console.error(e));

        // Save summary locally
        if (data.history && Array.isArray(data.history)) {
             const lastFew = data.history.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n');
             localStorage.setItem(`${this.prefix}${this.currentProfile}-last-episode-summary`, lastFew);
        }

        // Background cloud sync
        if (this.hfToken && this.hfRepoId) {
             if (data.history && data.history.length > 0) {
                 this.saveEpisodeDeltaToCloud(episodeId, data.history[data.history.length - 1])
                     .then(() => console.log(`Episode delta ${episodeId} synced to cloud.`))
                     .catch(err => console.error(`Failed to sync episode delta ${episodeId} to cloud:`, err));
             } else {
                 this.saveEpisodeToCloud(episodeId, data)
                     .then(() => console.log(`Episode ${episodeId} synced to cloud.`))
                     .catch(err => console.error(`Failed to sync episode ${episodeId} to cloud:`, err));
             }

             // Also update latest.json
             const content = JSON.stringify(data, null, 2);
             this.hfStorage.saveFile(this.hfToken, this.hfRepoId, 'episodes/latest.json', content)
                 .catch(err => console.error(`Failed to update latest.json:`, err));
        }
    }

    public async loadLastEpisode(): Promise<string | null> {
        // 1. Try to fetch from cloud if configured
        if (this.hfToken && this.hfRepoId) {
            try {
                const content = await this.hfStorage.loadFile(this.hfToken, this.hfRepoId, 'episodes/latest.json');
                if (content) {
                    const data = JSON.parse(content);
                    // Generate a simple summary from the last few messages
                    if (data.history && Array.isArray(data.history)) {
                         const lastFew = data.history.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n');
                         return `PREVIOUSLY ON THE JOKESTERS:\n${lastFew}`;
                    }
                }
            } catch (e) {
                console.warn('Failed to load last episode from cloud:', e);
            }
        }

        // 2. Fallback to local storage
        const localSummary = localStorage.getItem(`${this.prefix}${this.currentProfile}-last-episode-summary`);
        if (localSummary) return `PREVIOUSLY ON THE JOKESTERS (Local):\n${localSummary}`;

        return null;
    }

    public async saveEpisodeDeltaToCloud(episodeId: string, newMessage: any): Promise<void> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/${episodeId}/delta-${Date.now()}-${Math.random().toString(36).substring(7)}.json`;
        const content = JSON.stringify(newMessage, null, 2);

        // Push to local sync queue
        const queueKey = `sync-queue`;
        const queueRaw = await this.idbGetQueue(queueKey);
        let queue: { id: string, repoId?: string, filename: string, content: string }[] = queueRaw || [];

        // Generate a unique ID for this job to safely remove it later
        const jobId = Math.random().toString(36).substring(2, 15);
        queue.push({ id: jobId, filename, content });

        await this.idbSetQueue(queueKey, queue);

        // Trigger sync processing
        this.processSyncQueue();
    }

    public async saveEpisodeToCloud(episodeId: string, data: any): Promise<void> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/${episodeId}/episode.json`;
        const content = JSON.stringify(data, null, 2);
        // Push to local sync queue
        const queueKey = `sync-queue`;
        const queueRaw = await this.idbGetQueue(queueKey);
        let queue: { id: string, repoId?: string, filename: string, content: string }[] = queueRaw || [];

        // Remove existing item if updating same file
        queue = queue.filter(q => q.filename !== filename);
        // Generate a unique ID for this job to safely remove it later
        const jobId = Math.random().toString(36).substring(2, 15);
        queue.push({ id: jobId, filename, content });

        await this.idbSetQueue(queueKey, queue);

        // Trigger sync processing
        this.processSyncQueue();
    }


    public async processSyncQueue(): Promise<void> {
        if (!navigator.onLine) {
            console.log("Currently offline. Sync queued until connection is restored.");
            if (this.syncStatusCallback) this.syncStatusCallback('Offline - sync paused');
            return;
        }

        if (this.isSyncing || !this.hfToken || !this.syncWorker) return;

        const queueKey = `sync-queue`;
        const queueRaw = await this.idbGetQueue(queueKey);
        if (!queueRaw) return;

        let queue: { id: string, repoId?: string, filename: string, content: string }[] = queueRaw;
        if (queue.length === 0) return;

        if (this.syncStatusCallback) this.syncStatusCallback(`Syncing ${queue.length} item(s)...`);

        this.isSyncing = true;

        this.syncWorker.postMessage({
            type: 'sync',
            queueKey,
            token: this.hfToken,
            repoId: this.hfRepoId,
            items: queue
        });
    }

    public async loadEpisode(episodeId: string): Promise<any | null> {
        try {
            const data = await this.idbGet(`episode-${episodeId}`);
            if (data) return data;
        } catch(e) {}
        return this.load(`episode-${episodeId}`);
    }

    public async consolidateEpisodeDeltas(episodeId: string): Promise<void> {
        if (!this.hfToken || !this.hfRepoId || !this.syncWorker) {
            console.error("Cloud credentials or sync worker not configured.");
            return;
        }

        this.syncWorker.postMessage({
            type: 'consolidate_deltas',
            episodeId,
            token: this.hfToken,
            repoId: this.hfRepoId
        });
    }

    public startDeltaConsolidationTask(): void {
        // Periodically run consolidation
        setInterval(async () => {
            try {
                const episodes = await this.listEpisodes();
                for (const episode of episodes) {
                    await this.consolidateEpisodeDeltas(episode);
                }
            } catch (e) {
                console.error("Error running consolidation task:", e);
            }
        }, 60 * 60 * 1000); // Run every hour
    }

    public async loadEpisodeFromCloud(episodeId: string): Promise<any | null> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/${episodeId}/episode.json`;
        const content = await this.hfStorage.loadFile(this.hfToken, this.hfRepoId, filename);
        if (!content) return null;
        return JSON.parse(content);
    }

    public async syncAllHistoryFromCloud(): Promise<void> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        try {
            // First we need to get a list of files. Since there isn't a listFiles method,
            // we'll attempt to load the common ones if possible, or assume a future listFiles
            // method exists on HFStorageManager if the REST API was fully exposed.
            // For now, since HFStorageManager only has loadFile, we will just fetch
            // latest.json as a proxy for sync, or simulate downloading past episodes
            // if we had a full tree response.
            // To properly implement two-way sync as requested:
            const treeResponse = await fetch(`https://huggingface.co/api/datasets/${this.hfRepoId}/tree/main/episodes`, {
                headers: { 'Authorization': `Bearer ${this.hfToken}` }
            });
            if (treeResponse.ok) {
                const files = await treeResponse.json();
                for (const file of files) {
                    if (file.type === 'file' && file.path.endsWith('.json')) {
                        const filename = file.path;
                        // Extract episode ID from either format: episodes/episode-X.json or episodes/X/episode.json
                        let episodeId = "";
                        if (filename.includes("/")) {
                            const parts = filename.split("/");
                            if (parts.length === 3 && parts[2] === "episode.json") {
                                episodeId = parts[1];
                            } else if (parts.length === 2 && parts[1].startsWith("episode-")) {
                                episodeId = parts[1].replace("episode-", "").replace(".json", "");
                            }
                        }
                        if (!episodeId) continue;
                        // Check if we already have it locally
                        const localData = await this.loadEpisode(episodeId);
                        if (!localData) {
                            console.log(`Downloading ${filename} from cloud...`);
                            const cloudData = await this.loadEpisodeFromCloud(episodeId);
                            if (cloudData) {
                                this.save(`episode-${episodeId}`, cloudData);
                                await this.idbSet(`episode-${episodeId}`, cloudData).catch(e => console.error(e));
                            }
                        } else {
                            // Conflict resolution: Vector Clocks, fallback to Last-Writer-Wins (LWW)
                            const cloudData = await this.loadEpisodeFromCloud(episodeId);
                            if (cloudData && cloudData.history && localData.history) {
                                const cloudClock = cloudData.vectorClock || {};
                                const localClock = localData.vectorClock || {};

                                // Check if cloud dominates local
                                let cloudDominates = false;
                                let localDominates = false;

                                const allKeys = new Set([...Object.keys(cloudClock), ...Object.keys(localClock)]);
                                for (const key of allKeys) {
                                    const c = cloudClock[key] || 0;
                                    const l = localClock[key] || 0;
                                    if (c > l) cloudDominates = true;
                                    if (l > c) localDominates = true;
                                }

                                if (cloudDominates && !localDominates) {
                                    console.log(`Conflict resolved (Vector Clock): Cloud version of ${filename} is newer. Updating local data...`);
                                    this.save(`episode-${episodeId}`, cloudData);
                                    await this.idbSet(`episode-${episodeId}`, cloudData).catch(e => console.error(e));
                                } else if (localDominates && !cloudDominates) {
                                    console.log(`Conflict resolved (Vector Clock): Local version of ${filename} is newer. Queuing cloud update...`);
                                    this.saveEpisodeToCloud(episodeId, localData).catch(e => console.error(e));
                                } else if (cloudDominates && localDominates) {
                                    // Concurrent changes - Merge histories based on timestamps
                                    console.log(`Conflict resolved (Vector Clock): Concurrent changes detected for ${filename}. Merging...`);
                                    const mergedHistory = [...cloudData.history, ...localData.history];

                                    // Remove duplicates
                                    const uniqueHistory = [];
                                    const seen = new Set();
                                    for (const msg of mergedHistory) {
                                        const key = msg.role + ':' + msg.content;
                                        if (!seen.has(key)) {
                                            seen.add(key);
                                            uniqueHistory.push(msg);
                                        }
                                    }

                                    localData.history = uniqueHistory;

                                    // Merge vector clocks by taking max
                                    for (const key of allKeys) {
                                        localData.vectorClock[key] = Math.max(cloudClock[key] || 0, localClock[key] || 0);
                                    }
                                    localData.vectorClock[this.clientId] = (localData.vectorClock[this.clientId] || 0) + 1;
                                    localData.updatedAt = Date.now();
                                    localData.timestamp = Date.now();

                                    this.save(`episode-${episodeId}`, localData);
                                    await this.idbSet(`episode-${episodeId}`, localData).catch(e => console.error(e));
                                    this.saveEpisodeToCloud(episodeId, localData).catch(e => console.error(e));
                                } else {
                                    console.log(`${filename} is up to date.`);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to sync all history from cloud:', error);
        }
    }

    public async publishCommunityScript(communityRepoId: string, filename: string, scriptData: any): Promise<void> {
        if (!this.hfToken) throw new Error("Cloud credentials not configured.");
        const content = JSON.stringify(scriptData, null, 2);

        // Use a background queue similar to episodes
        const queueKey = `sync-queue`;
        const queueRaw = await this.idbGetQueue(queueKey);
        let queue: { id: string, repoId: string, filename: string, content: string }[] = queueRaw || [];

        // Modify sync queue items to specify repo ID if it's different
        const jobId = Math.random().toString(36).substring(2, 15);
        queue.push({ id: jobId, repoId: communityRepoId, filename, content });

        await this.idbSetQueue(queueKey, queue);
        this.processSyncQueue();
    }

    public async loadCommunityScript(repoId: string, filename: string): Promise<any | null> {
        const content = await this.hfStorage.loadCommunityScript(repoId, filename);
        if (!content) return null;
        return JSON.parse(content);
    }

    public async listEpisodes(): Promise<string[]> {
        const episodes: string[] = [];
        try {
            const keys = await this.idbKeys();
            for (const key of keys) {
                if (key.startsWith('episode-')) {
                    episodes.push(key.replace('episode-', ''));
                }
            }
        } catch(e) {}
        const localPrefix = `${this.prefix}${this.currentProfile}-episode-`;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(localPrefix)) {
                const id = key.replace(localPrefix, '');
                if (!episodes.includes(id)) episodes.push(id);
            }
        }
        return episodes;
    }

    public async searchLocalEpisodes(query: string): Promise<{ episodeId: string, snippet: string }[]> {
        const results: { episodeId: string, snippet: string }[] = [];
        const normalizedQuery = query.toLowerCase();

        try {
            const keys = await this.idbKeys();
            for (const key of keys) {
                if (key.startsWith('episode-')) {
                    const episodeId = key.replace('episode-', '');
                    const content = await this.idbGet(key);

                    if (content && content.history && Array.isArray(content.history)) {
                        for (const msg of content.history) {
                            if (msg.content && typeof msg.content === 'string' && msg.content.toLowerCase().includes(normalizedQuery)) {
                                const idx = msg.content.toLowerCase().indexOf(normalizedQuery);
                                const start = Math.max(0, idx - 50);
                                const end = Math.min(msg.content.length, idx + 50 + query.length);
                                const snippet = (start > 0 ? '...' : '') + msg.content.substring(start, end) + (end < msg.content.length ? '...' : '');

                                results.push({ episodeId, snippet: `[${msg.role}]: ${snippet}` });
                                break;
                            }
                        }
                    }
                }
            }
        } catch(e) {}

        const localPrefix = `${this.prefix}${this.currentProfile}-episode-`;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(localPrefix)) {
                const episodeId = key.replace(localPrefix, '');
                const content = this.load<any>(`episode-${episodeId}`);

                if (content && content.history && Array.isArray(content.history)) {
                    for (const msg of content.history) {
                        if (msg.content && typeof msg.content === 'string' && msg.content.toLowerCase().includes(normalizedQuery)) {
                            const idx = msg.content.toLowerCase().indexOf(normalizedQuery);
                            const start = Math.max(0, idx - 50);
                            const end = Math.min(msg.content.length, idx + 50 + query.length);
                            const snippet = (start > 0 ? '...' : '') + msg.content.substring(start, end) + (end < msg.content.length ? '...' : '');

                            if (!results.find(r => r.episodeId === episodeId)) {
                                results.push({ episodeId, snippet: `[${msg.role}]: ${snippet}` });
                            }
                            break;
                        }
                    }
                }
            }
        }
        return results.slice(0, 3);
    }

    public async saveUserProfile(profile: any): Promise<void> {
        this.save('user_preferences', profile);
        if (this.hfToken && this.hfRepoId) {
            const filename = `profile/user_preferences.json`;
            const content = JSON.stringify(profile, null, 2);

            const queueKey = `sync-queue`;
            const queueRaw = await this.idbGetQueue(queueKey);
            let queue: { id: string, filename: string, content: string }[] = queueRaw || [];

            queue = queue.filter(q => q.filename !== filename);
            const jobId = Math.random().toString(36).substring(2, 15);
            queue.push({ id: jobId, filename, content });

            await this.idbSetQueue(queueKey, queue);
            this.processSyncQueue();
        }
    }

    public async loadUserProfile(): Promise<any> {
        let localProfile = this.load<any>('user_preferences');
        if (this.hfToken && this.hfRepoId) {
            try {
                const content = await this.hfStorage.loadFile(this.hfToken, this.hfRepoId, 'profile/user_preferences.json');
                if (content) {
                    localProfile = JSON.parse(content);
                    this.save('user_preferences', localProfile);
                }
            } catch (e) {
                console.warn('Failed to load user profile from cloud:', e);
            }
        }
        return localProfile;
    }

    private cloudSummaryCache: any = null;

    public getCloudSummary(): any {
        return this.cloudSummaryCache;
    }


    private async ensureCloudSummaryCache(): Promise<void> {
        if (this.cloudSummaryCache) return;
        if (!this.hfToken || !this.hfRepoId) return;

        try {
            const content = await this.hfStorage.loadFile(this.hfToken, this.hfRepoId, 'episodes/latest.json');
            if (content) {
                this.cloudSummaryCache = JSON.parse(content);
            }
        } catch (e) {
            console.warn('Failed to fetch summary cache:', e);
        }
    }

    private calculateSimilarityScore(query: string, text: string): number {
        // Lightweight tf-idf / keyword overlap simulation (Vector RAG Approximation)
        const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const textWords = text.toLowerCase().split(/\W+/);

        // Calculate term frequencies to act as a lightweight local "vector" store equivalent
        const textTermFrequencies: Record<string, number> = {};
        for (const word of textWords) {
            if (word.length > 3) {
                textTermFrequencies[word] = (textTermFrequencies[word] || 0) + 1;
            }
        }

        let score = 0;
        const totalWords = textWords.length || 1;

        for (const word of queryWords) {
            // BM25 / TF-IDF approximation based on term frequency within the document chunk
            if (textTermFrequencies[word]) {
                const termFrequency = textTermFrequencies[word];
                // Simple weighting: occurrences relative to chunk size, scaled
                score += (termFrequency / totalWords) * 100 + 1;
            }
        }
        return score;
    }

    public async searchFetchedSummaries(query: string): Promise<{ episodeId: string, snippet: string }[]> {
        await this.ensureCloudSummaryCache();

        const results: { episodeId: string, snippet: string, score: number }[] = [];

        if (this.cloudSummaryCache && this.cloudSummaryCache.history && Array.isArray(this.cloudSummaryCache.history)) {
            for (const msg of this.cloudSummaryCache.history) {
                if (msg.content && typeof msg.content === 'string') {
                    const score = this.calculateSimilarityScore(query, msg.content);
                    if (score > 0) {
                        // Extract a snippet centered around the first matched word
                        const normalizedContent = msg.content.toLowerCase();
                        const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3);
                        let firstMatchIdx = -1;

                        for (const word of queryWords) {
                            const idx = normalizedContent.indexOf(word);
                            if (idx !== -1) {
                                firstMatchIdx = idx;
                                break;
                            }
                        }

                        let snippet = msg.content;
                        if (firstMatchIdx !== -1) {
                            const start = Math.max(0, firstMatchIdx - 50);
                            const end = Math.min(msg.content.length, firstMatchIdx + 50 + query.length);
                            snippet = (start > 0 ? '...' : '') + msg.content.substring(start, end) + (end < msg.content.length ? '...' : '');
                        }

                        results.push({ episodeId: 'latest-cloud', snippet: `[${msg.role}]: ${snippet}`, score });
                    }
                }
            }
        }

        // Sort by score descending and return top matches
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, 3).map(r => ({ episodeId: r.episodeId, snippet: r.snippet }));
    }


    public async getEpisodeAnalytics(): Promise<{ totalEpisodes: number, totalTokensProxy: number, avgEpisodeLength: number, commonModes: { [key: string]: number } }> {
        await this.ensureCloudSummaryCache();

        let totalEpisodes = 0;
        let totalTokensProxy = 0;
        let avgEpisodeLength = 0;
        const commonModes: { [key: string]: number } = {};

        // Let's actually count local episodes from IndexedDB as well to get better metrics.
        const allKeys = await this.idbKeys();
        totalEpisodes = allKeys.length;

        for (const key of allKeys) {
            const episode = await this.idbGet(key);
            if (episode && episode.history && Array.isArray(episode.history)) {
                totalTokensProxy += JSON.stringify(episode.history).length;
            }
            if (episode && episode.scenario && episode.scenario.type) {
                commonModes[episode.scenario.type] = (commonModes[episode.scenario.type] || 0) + 1;
            }
        }

        if (totalEpisodes > 0) {
            avgEpisodeLength = Math.round(totalTokensProxy / totalEpisodes);
        } else if (this.cloudSummaryCache && this.cloudSummaryCache.history && Array.isArray(this.cloudSummaryCache.history)) {
            // Fallback to cloud summary if local DB is empty
            totalEpisodes = 1;
            totalTokensProxy = JSON.stringify(this.cloudSummaryCache.history).length;
            avgEpisodeLength = totalTokensProxy;
            if (this.cloudSummaryCache.scenario && this.cloudSummaryCache.scenario.type) {
                commonModes[this.cloudSummaryCache.scenario.type] = 1;
            }
        }

        return { totalEpisodes, totalTokensProxy, avgEpisodeLength, commonModes };
    }

    public async getCloudHistory(): Promise<any[]> {
        if (!this.hfToken || !this.hfRepoId) {
            console.warn("Cannot fetch cloud history without credentials.");
            return [];
        }
        return await this.hfStorage.getDatasetHistory(this.hfToken, this.hfRepoId);
    }

    public async getPendingDeltas(): Promise<any[]> {
        if (!this.hfToken || !this.hfRepoId) {
            return [];
        }

        try {
            const history = await this.getCloudHistory();
            if (history && history.length > 0 && !history[0].commit && !history[0].oid) {
                // Return files that contain "delta-"
                return history.filter((item: any) => item.path && item.path.includes('delta-')).map((file: any) => {
                    return {
                        ...file,
                        id: file.path,
                        action: 'delta_merge',
                        cloudState: { fileInfo: file.path, size: file.size }, // Placeholder for now, real implementation would download it
                        localState: {} // Placeholder
                    };
                });
            }
            return [];
        } catch (e) {
            console.error("Failed to get pending deltas:", e);
            return [];
        }
    }

    public async invalidateSyncedLocalEpisodes(): Promise<void> {
        if (!this.hfToken || !this.hfRepoId) return;

        try {
            const history = await this.getCloudHistory();
            if (!history || history.length === 0 || history[0].commit || history[0].oid) {
                // Not the paths-info structure we expect or empty
                return;
            }

            const cloudEpisodes = history
                .filter((item: any) => item.path && item.path.startsWith('episodes/') && item.path.endsWith('/episode.json'))
                .map((item: any) => item.path.replace('episodes/', '').replace('/episode.json', ''));

            const localEpisodes = await this.listEpisodes();

            for (const localEpisode of localEpisodes) {
                if (cloudEpisodes.includes(localEpisode)) {
                    // Check if there are any pending deltas for this episode
                    const hasDeltas = history.some((item: any) => item.path && item.path.startsWith(`episodes/${localEpisode}/delta-`));
                    if (!hasDeltas) {
                        // Fully synced, we can safely remove the local copy to free up space
                        console.log(`Cache Invalidation: Removing fully synced local episode ${localEpisode}`);
                        localStorage.removeItem(`${this.prefix}${this.currentProfile}-episode-${localEpisode}`);
                        await this.idbSet(`episode-${localEpisode}`, null);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to invalidate local cache:", e);
        }
    }
}
