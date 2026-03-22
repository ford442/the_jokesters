import { HFStorageManager } from './HFStorageManager';

export class MemoryManager {
    private prefix: string = 'jokesters-';
    private hfStorage: HFStorageManager;
    private hfToken: string | null = null;
    private hfRepoId: string | null = null;
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
        this.loadCloudCredentials();
        this.processSyncQueue();
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
             this.saveEpisodeToCloud(episodeId, data)
                 .then(() => console.log(`Episode ${episodeId} synced to cloud.`))
                 .catch(err => console.error(`Failed to sync episode ${episodeId} to cloud:`, err));

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

    public async saveEpisodeToCloud(episodeId: string, data: any): Promise<void> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/episode-${episodeId}.json`;
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
        if (this.isSyncing || !this.hfToken) return;

        const queueKey = `${this.prefix}${this.currentProfile}-sync-queue`;
        const queueRaw = localStorage.getItem(queueKey);
        if (!queueRaw) return;

        let queue: { id: string, repoId?: string, filename: string, content: string }[] = JSON.parse(queueRaw);
        if (queue.length === 0) return;

        this.isSyncing = true;

        try {
            while (true) {
                const currentQueueRaw = localStorage.getItem(queueKey);
                if (!currentQueueRaw) break;

                let currentQueue: { id: string, repoId?: string, filename: string, content: string }[] = JSON.parse(currentQueueRaw);
                if (currentQueue.length === 0) break;

                const item = currentQueue[0];
                try {
                    const targetRepo = item.repoId || this.hfRepoId;
                    if (!targetRepo) throw new Error("No repository ID found for upload.");

                    await this.hfStorage.saveFile(this.hfToken, targetRepo, item.filename, item.content);
                    // Remove item on success, re-read queue to avoid race conditions
                    const freshQueueRaw = localStorage.getItem(queueKey);
                    if (freshQueueRaw) {
                        let freshQueue: { id: string, repoId?: string, filename: string, content: string }[] = JSON.parse(freshQueueRaw);
                        freshQueue = freshQueue.filter(q => q.id !== item.id);
                        localStorage.setItem(queueKey, JSON.stringify(freshQueue));
                    }
                    console.log(`Successfully synced ${item.filename} to cloud.`);
                } catch (error) {
                    console.error(`Failed to sync ${item.filename} to cloud. Will retry later.`, error);
                    break; // Stop processing on error, try again later
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }

    public async loadEpisode(episodeId: string): Promise<any | null> {
        try {
            const data = await this.idbGet(`episode-${episodeId}`);
            if (data) return data;
        } catch(e) {}
        return this.load(`episode-${episodeId}`);
    }

    public async loadEpisodeFromCloud(episodeId: string): Promise<any | null> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/episode-${episodeId}.json`;
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
                        const episodeId = filename.replace('episodes/episode-', '').replace('.json', '');
                        // Check if we already have it locally
                        const localData = await this.loadEpisode(episodeId);
                        if (!localData) {
                            console.log(`Downloading ${filename} from cloud...`);
                            const cloudData = await this.loadEpisodeFromCloud(episodeId);
                            if (cloudData) {
                                this.save(`episode-${episodeId}`, cloudData);
                                await this.idbSet(`episode-${episodeId}`, cloudData).catch(e => console.error(e));
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
