import { HFStorageManager } from './HFStorageManager';

export class MemoryManager {
    private prefix: string = 'jokesters-';
    private hfStorage: HFStorageManager;
    private hfToken: string | null = null;
    private hfRepoId: string | null = null;

    constructor() {
        this.hfStorage = new HFStorageManager();
        this.loadCloudCredentials();
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
        await this.hfStorage.saveFile(this.hfToken, this.hfRepoId, filename, content);
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
}
