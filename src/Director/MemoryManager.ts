import { HFStorageManager } from './HFStorageManager';

export class MemoryManager {
    private prefix: string = 'jokesters-';
    private hfStorage: HFStorageManager;
    private hfToken: string | null = null;
    private hfRepoId: string | null = null;
    private syncWorker: Worker | null = null;
    private isSyncing: boolean = false;
    private currentProfile: string = 'default';

    // IndexedDB Helpers
    private dbName = 'jokestersDB';
    private storeName = 'episodes';

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (event: any) => resolve(event.target.result);
            request.onerror = (event: any) => reject(event.target.error);
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
        this.loadProfileFromStorage();
        if (typeof Worker !== 'undefined') {
            this.syncWorker = new Worker(new URL('../workers/hfSync.worker.ts', import.meta.url), { type: 'module' });
            this.syncWorker.onmessage = (e) => {
                const data = e.data;
                if (data.type === 'sync_success') {
                    const queueRaw = localStorage.getItem(data.queueKey);
                    if (queueRaw) {
                        let queue: any[] = JSON.parse(queueRaw);
                        queue = queue.filter(q => q.id !== data.itemId);
                        localStorage.setItem(data.queueKey, JSON.stringify(queue));
                    }
                } else if (data.type === 'sync_complete') {
                    this.isSyncing = false;
                } else if (data.type === 'sync_error') {
                    console.error('Sync error from worker:', data.error);
                }
            };
        }
        this.loadCloudCredentials();
        this.processSyncQueue();
        this.ensureCloudSummaryCache();
        this.startDeltaConsolidationTask();
    }

    private loadProfileFromStorage(): void {
        const savedProfile = localStorage.getItem(this.prefix + 'current-profile');
        if (savedProfile) {
            this.currentProfile = savedProfile;
        }
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
        const queueKey = `${this.prefix}${this.currentProfile}-sync-queue`;
        const queueRaw = localStorage.getItem(queueKey);
        let queue: { id: string, repoId?: string, filename: string, content: string }[] = queueRaw ? JSON.parse(queueRaw) : [];

        // Generate a unique ID for this job to safely remove it later
        const jobId = Math.random().toString(36).substring(2, 15);
        queue.push({ id: jobId, filename, content });

        localStorage.setItem(queueKey, JSON.stringify(queue));

        // Trigger sync processing
        this.processSyncQueue();
    }

    public async saveEpisodeToCloud(episodeId: string, data: any): Promise<void> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/${episodeId}/episode.json`;
        const content = JSON.stringify(data, null, 2);
        // Push to local sync queue
        const queueKey = `${this.prefix}${this.currentProfile}-sync-queue`;
        const queueRaw = localStorage.getItem(queueKey);
        let queue: { id: string, repoId?: string, filename: string, content: string }[] = queueRaw ? JSON.parse(queueRaw) : [];

        // Remove existing item if updating same file
        queue = queue.filter(q => q.filename !== filename);
        // Generate a unique ID for this job to safely remove it later
        const jobId = Math.random().toString(36).substring(2, 15);
        queue.push({ id: jobId, filename, content });

        localStorage.setItem(queueKey, JSON.stringify(queue));

        // Trigger sync processing
        this.processSyncQueue();
    }

    private async processSyncQueue(): Promise<void> {
        if (this.isSyncing || !this.hfToken || !this.syncWorker) return;

        const queueKey = `${this.prefix}${this.currentProfile}-sync-queue`;
        const queueRaw = localStorage.getItem(queueKey);
        if (!queueRaw) return;

        let queue: { id: string, repoId?: string, filename: string, content: string }[] = JSON.parse(queueRaw);
        if (queue.length === 0) return;

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
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        try {
            const treeResponse = await fetch(`https://huggingface.co/api/datasets/${this.hfRepoId}/tree/main/episodes/${episodeId}`, {
                headers: { 'Authorization': `Bearer ${this.hfToken}` }
            });
            if (!treeResponse.ok) return;
            const files = await treeResponse.json();
            const deltaFiles = files.filter((f: any) => f.type === 'file' && f.path.includes("delta-"));
            if (deltaFiles.length === 0) return;

            // Download main episode
            const episodeFilename = `episodes/${episodeId}/episode.json`;
            const episodeContent = await this.hfStorage.loadFile(this.hfToken, this.hfRepoId, episodeFilename);
            let mainEpisode = episodeContent ? JSON.parse(episodeContent) : { history: [] };

            // Download and merge all deltas
            for (const deltaFile of deltaFiles) {
                const deltaContent = await this.hfStorage.loadFile(this.hfToken, this.hfRepoId, deltaFile.path);
                if (deltaContent) {
                    const deltaMessage = JSON.parse(deltaContent);
                    mainEpisode.history.push(deltaMessage);
                }
            }

            // Now we have the merged episode, let's commit it and delete the deltas
            const operations: any[] = [{
                operation: "createOrUpdateFile",
                pathOrUrl: episodeFilename,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(mainEpisode, null, 2))))
            }];

            for (const deltaFile of deltaFiles) {
                operations.push({
                    operation: "deleteFile",
                    pathOrUrl: deltaFile.path
                });
            }

            // Queue the operation to the worker using the custom operations array
            const queueKey = `${this.prefix}${this.currentProfile}-sync-queue`;
            const queueRaw = localStorage.getItem(queueKey);
            let queue: any[] = queueRaw ? JSON.parse(queueRaw) : [];
            const jobId = Math.random().toString(36).substring(2, 15);
            queue.push({ id: jobId, filename: episodeFilename, operations });
            localStorage.setItem(queueKey, JSON.stringify(queue));
            this.processSyncQueue();
        } catch (e) {
            console.error("Failed to consolidate deltas for episode", episodeId, e);
        }
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
                            // Conflict resolution: compare length of history array to see which is more up-to-date
                            const cloudData = await this.loadEpisodeFromCloud(episodeId);
                            if (cloudData && cloudData.history && localData.history) {
                                if (cloudData.history.length > localData.history.length) {
                                    console.log(`Cloud version of ${filename} is newer. Updating local data...`);
                                    this.save(`episode-${episodeId}`, cloudData);
                                    await this.idbSet(`episode-${episodeId}`, cloudData).catch(e => console.error(e));
                                } else if (localData.history.length > cloudData.history.length) {
                                    console.log(`Local version of ${filename} is newer. Queuing cloud update...`);
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
        const queueKey = `${this.prefix}${this.currentProfile}-sync-queue`;
        const queueRaw = localStorage.getItem(queueKey);
        let queue: { id: string, repoId: string, filename: string, content: string }[] = queueRaw ? JSON.parse(queueRaw) : [];

        // Modify sync queue items to specify repo ID if it's different
        const jobId = Math.random().toString(36).substring(2, 15);
        queue.push({ id: jobId, repoId: communityRepoId, filename, content });

        localStorage.setItem(queueKey, JSON.stringify(queue));
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

            const queueKey = `${this.prefix}${this.currentProfile}-sync-queue`;
            const queueRaw = localStorage.getItem(queueKey);
            let queue: { id: string, filename: string, content: string }[] = queueRaw ? JSON.parse(queueRaw) : [];

            queue = queue.filter(q => q.filename !== filename);
            const jobId = Math.random().toString(36).substring(2, 15);
            queue.push({ id: jobId, filename, content });

            localStorage.setItem(queueKey, JSON.stringify(queue));
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
}
