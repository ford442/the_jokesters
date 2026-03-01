import { HFStorageManager } from './HFStorageManager';

export class MemoryManager {
    private prefix: string = 'jokesters-';
    private hfStorage: HFStorageManager;
    private hfToken: string | null = null;
    private hfRepoId: string | null = null;
    private isSyncing: boolean = false;

    constructor() {
        this.hfStorage = new HFStorageManager();
        this.loadCloudCredentials();
        this.processSyncQueue();
    }

    private loadCloudCredentials(): void {
        this.hfToken = localStorage.getItem(this.prefix + 'hf-token');
        this.hfRepoId = localStorage.getItem(this.prefix + 'hf-repo');
    }

    public setCloudCredentials(token: string, repoId: string): void {
        this.hfToken = token;
        this.hfRepoId = repoId;
        localStorage.setItem(this.prefix + 'hf-token', token);
        localStorage.setItem(this.prefix + 'hf-repo', repoId);
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
            localStorage.setItem(this.prefix + key, serialized);
        } catch (error) {
            console.error('MemoryManager save error:', error);
        }
    }

    public load<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;
            return JSON.parse(item) as T;
        } catch (error) {
            console.error('MemoryManager load error:', error);
            return null;
        }
    }

    public remove(key: string): void {
        localStorage.removeItem(this.prefix + key);
    }

    public saveEpisode(episodeId: string, data: any): void {
        this.save(`episode-${episodeId}`, data);

        // Save summary locally
        if (data.history && Array.isArray(data.history)) {
             const lastFew = data.history.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n');
             localStorage.setItem(this.prefix + 'last-episode-summary', lastFew);
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
        const localSummary = localStorage.getItem(this.prefix + 'last-episode-summary');
        if (localSummary) return `PREVIOUSLY ON THE JOKESTERS (Local):\n${localSummary}`;

        return null;
    }

    public async saveEpisodeToCloud(episodeId: string, data: any): Promise<void> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/episode-${episodeId}.json`;
        const content = JSON.stringify(data, null, 2);

        // Push to local sync queue
        const queueKey = this.prefix + 'sync-queue';
        const queueRaw = localStorage.getItem(queueKey);
        let queue: { id: string, filename: string, content: string }[] = queueRaw ? JSON.parse(queueRaw) : [];

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
        if (this.isSyncing || !this.hfToken || !this.hfRepoId) return;

        const queueKey = this.prefix + 'sync-queue';
        const queueRaw = localStorage.getItem(queueKey);
        if (!queueRaw) return;

        let queue: { id: string, filename: string, content: string }[] = JSON.parse(queueRaw);
        if (queue.length === 0) return;

        this.isSyncing = true;

        try {
            while (true) {
                const currentQueueRaw = localStorage.getItem(queueKey);
                if (!currentQueueRaw) break;

                let currentQueue: { id: string, filename: string, content: string }[] = JSON.parse(currentQueueRaw);
                if (currentQueue.length === 0) break;

                const item = currentQueue[0];
                try {
                    await this.hfStorage.saveFile(this.hfToken, this.hfRepoId, item.filename, item.content);
                    // Remove item on success, re-read queue to avoid race conditions
                    const freshQueueRaw = localStorage.getItem(queueKey);
                    if (freshQueueRaw) {
                        let freshQueue: { id: string, filename: string, content: string }[] = JSON.parse(freshQueueRaw);
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

    public loadEpisode(episodeId: string): any | null {
        return this.load(`episode-${episodeId}`);
    }

    public async loadEpisodeFromCloud(episodeId: string): Promise<any | null> {
        if (!this.hfToken || !this.hfRepoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/episode-${episodeId}.json`;
        const content = await this.hfStorage.loadFile(this.hfToken, this.hfRepoId, filename);
        if (!content) return null;
        return JSON.parse(content);
    }

    public listEpisodes(): string[] {
        const episodes: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix + 'episode-')) {
                episodes.push(key.replace(this.prefix + 'episode-', ''));
            }
        }
        return episodes;
    }

    public searchLocalEpisodes(query: string): { episodeId: string, snippet: string }[] {
        const results: { episodeId: string, snippet: string }[] = [];
        const normalizedQuery = query.toLowerCase();

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix + 'episode-')) {
                const episodeId = key.replace(this.prefix + 'episode-', '');
                const content = this.load<any>(`episode-${episodeId}`);

                if (content && content.history && Array.isArray(content.history)) {
                    // Check history for keyword
                    for (const msg of content.history) {
                        if (msg.content && typeof msg.content === 'string' && msg.content.toLowerCase().includes(normalizedQuery)) {
                            // Extract a snippet (max 100 chars around the match)
                            const idx = msg.content.toLowerCase().indexOf(normalizedQuery);
                            const start = Math.max(0, idx - 50);
                            const end = Math.min(msg.content.length, idx + 50 + query.length);
                            const snippet = (start > 0 ? '...' : '') + msg.content.substring(start, end) + (end < msg.content.length ? '...' : '');

                            results.push({ episodeId, snippet: `[${msg.role}]: ${snippet}` });
                            break; // One match per episode is enough
                        }
                    }
                }
            }
        }
        return results.slice(0, 3);
    }
}
