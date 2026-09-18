import { HFStorageManager } from './HFStorageManager';
import type { Message } from '../types/chat';
import type { ScriptBeat } from './Director';
import { resolveEpisodeConflict, applyManualResolution } from './memoryConflict';
import type {
    StoredEpisode,
    EpisodeSearchResult,
    ConflictResolution,
    HFHistoryEntry,
    PendingDelta,
} from './memoryTypes';
import { MemoryIdbStore } from './memoryIdbStore';
import { MemorySyncQueue } from './memorySyncQueue';
import type { CloudCredentialsSource } from './memoryCredentials';

/**
 * Episode CRUD (local + cloud), assets/scripts/community-script publishing, and
 * conflict resolution. Cloud writes go through `MemorySyncQueue`; this class
 * owns "what to persist", the queue owns "how/when it actually leaves the device".
 */
export class MemoryEpisodeStore {
    constructor(
        private idb: MemoryIdbStore,
        private syncQueue: MemorySyncQueue,
        private hfStorage: HFStorageManager,
        private creds: CloudCredentialsSource,
        private prefix: string,
        private getProfile: () => string,
        private clientId: string,
    ) {}

    private localSave(key: string, data: unknown): void {
        try {
            localStorage.setItem(`${this.prefix}${this.getProfile()}-${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('MemoryManager save error:', error);
        }
    }

    private localLoad<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(`${this.prefix}${this.getProfile()}-${key}`);
            if (!item) return null;
            return JSON.parse(item) as T;
        } catch (error) {
            console.error('MemoryManager load error:', error);
            return null;
        }
    }

    public saveEpisode(episodeId: string, data: StoredEpisode): void {
        // Update vector clock and timestamp
        const vectorClock = data.vectorClock ?? {};
        vectorClock[this.clientId] = (vectorClock[this.clientId] || 0) + 1;
        data.vectorClock = vectorClock;
        data.updatedAt = Date.now();
        data.timestamp = Date.now();
        this.localSave(`episode-${episodeId}`, data);
        this.idb.set(`episode-${episodeId}`, data).catch(e => console.error(e));

        // Save summary locally
        if (data.history && Array.isArray(data.history)) {
             const lastFew = data.history.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n');
             localStorage.setItem(`${this.prefix}${this.getProfile()}-last-episode-summary`, lastFew);
        }

        // Background cloud sync
        if (this.creds.getToken() && this.creds.getRepoId()) {
             if (data.history && data.history.length > 0) {
                 this.saveEpisodeDeltaToCloud(episodeId, data.history[data.history.length - 1])
                     .then(() => console.log(`Episode delta ${episodeId} synced to cloud.`))
                     .catch(err => {
                         console.error(`Failed to sync episode delta ${episodeId} to cloud:`, err);
                         this.syncQueue.notifySyncIssue('⚠️ Cloud sync failed — will retry in background');
                     });
             } else {
                 this.saveEpisodeToCloud(episodeId, data)
                     .then(() => console.log(`Episode ${episodeId} synced to cloud.`))
                     .catch(err => {
                         console.error(`Failed to sync episode ${episodeId} to cloud:`, err);
                         this.syncQueue.notifySyncIssue('⚠️ Cloud sync failed — will retry in background');
                     });
             }

             // Also update latest.json
             const token = this.creds.getToken()!;
             const repoId = this.creds.getRepoId()!;
             const content = JSON.stringify(data, null, 2);
             this.hfStorage.saveFile(token, repoId, 'episodes/latest.json', content)
                 .catch(err => {
                     console.error(`Failed to update latest.json:`, err);
                     this.syncQueue.notifySyncIssue('⚠️ Cloud sync failed to update latest episode summary');
                 });
        }
    }

    public async loadLastEpisode(): Promise<string | null> {
        // 1. Try to fetch from cloud if configured
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (token && repoId) {
            try {
                const content = await this.hfStorage.loadFile(token, repoId, 'episodes/latest.json');
                if (content) {
                    const data = JSON.parse(content) as StoredEpisode;
                    // Generate a simple summary from the last few messages
                    if (data.history && Array.isArray(data.history)) {
                         const lastFew = data.history.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n');
                         return `PREVIOUSLY ON THE JOKESTERS:\n${lastFew}`;
                    }
                }
            } catch (e) {
                console.warn('Failed to load last episode from cloud:', e);
            }
        }

        // 2. Fallback to local storage
        const localSummary = localStorage.getItem(`${this.prefix}${this.getProfile()}-last-episode-summary`);
        if (localSummary) return `PREVIOUSLY ON THE JOKESTERS (Local):\n${localSummary}`;

        return null;
    }

    public async saveEpisodeAssetToCloud(episodeId: string, assetType: 'song' | 'pattern' | 'shader', assetName: string, assetContent: string): Promise<void> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) {
            console.warn("Skipping cloud asset save: HF credentials not configured.");
            return;
        }

        try {
            const filename = `episodes/${episodeId}/assets/${assetType}s/${assetName}`;
            await this.hfStorage.saveFile(token, repoId, filename, assetContent);
            console.log(`Successfully saved ${assetType} asset to cloud: ${filename}`);
        } catch (e) {
            console.error(`Failed to save episode asset to cloud (${assetType}/${assetName}):`, e);
            this.syncQueue.notifySyncIssue(`⚠️ Failed to save ${assetType} "${assetName}" to cloud`);
        }
    }

    public async loadEpisodeAssetFromCloud(episodeId: string, assetType: 'song' | 'pattern' | 'shader', assetName: string): Promise<string | null> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) {
            return null;
        }

        try {
            const filename = `episodes/${episodeId}/assets/${assetType}s/${assetName}`;
            const content = await this.hfStorage.loadFile(token, repoId, filename);
            return content;
        } catch (e) {
            console.error(`Failed to load episode asset from cloud (${assetType}/${assetName}):`, e);
            return null;
        }
    }

    public async saveEpisodeScriptToCloud(script: ScriptBeat[], episodeId: string): Promise<void> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/${episodeId}/script.json`;
        const content = JSON.stringify(script, null, 2);

        try {
            await this.hfStorage.saveFile(token, repoId, filename, content);
        } catch (e) {
            console.error("Failed to save episode script to cloud:", e);
            throw e;
        }
    }

    public async saveEpisodeDeltaToCloud(episodeId: string, newMessage: Message): Promise<void> {
        if (!this.creds.getToken() || !this.creds.getRepoId()) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/${episodeId}/delta-${Date.now()}-${Math.random().toString(36).substring(7)}.json`;
        const content = JSON.stringify(newMessage, null, 2);
        await this.syncQueue.enqueue({ filename, content });
    }

    public async saveEpisodeToCloud(episodeId: string, data: StoredEpisode): Promise<void> {
        if (!this.creds.getToken() || !this.creds.getRepoId()) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/${episodeId}/episode.json`;
        const content = JSON.stringify(data, null, 2);
        // Remove existing item if updating same file
        await this.syncQueue.enqueue({ filename, content }, true);
    }

    public async loadEpisode(episodeId: string): Promise<StoredEpisode | null> {
        try {
            const data = await this.idb.get<StoredEpisode>(`episode-${episodeId}`);
            if (data) return data;
        } catch(e) {}
        return this.localLoad<StoredEpisode>(`episode-${episodeId}`);
    }

    public async loadEpisodeFromCloud(episodeId: string): Promise<StoredEpisode | null> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) throw new Error("Cloud credentials not configured.");
        const filename = `episodes/${episodeId}/episode.json`;
        const content = await this.hfStorage.loadFile(token, repoId, filename);
        if (!content) return null;
        return JSON.parse(content) as StoredEpisode;
    }

    public async syncAllHistoryFromCloud(): Promise<void> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) throw new Error("Cloud credentials not configured.");
        try {
            // First we need to get a list of files. Since there isn't a listFiles method,
            // we'll attempt to load the common ones if possible, or assume a future listFiles
            // method exists on HFStorageManager if the REST API was fully exposed.
            // For now, since HFStorageManager only has loadFile, we will just fetch
            // latest.json as a proxy for sync, or simulate downloading past episodes
            // if we had a full tree response.
            // To properly implement two-way sync as requested:
            const treeResponse = await fetch(`https://huggingface.co/api/datasets/${repoId}/tree/main/episodes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (treeResponse.ok) {
                const files = await treeResponse.json() as HFHistoryEntry[];
                for (const file of files) {
                    if (file.type === 'file' && file.path?.endsWith('.json')) {
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
                                this.localSave(`episode-${episodeId}`, cloudData);
                                await this.idb.set(`episode-${episodeId}`, cloudData).catch(e => console.error(e));
                            }
                        } else {
                            // Conflict resolution: CRDT via Yjs and Vector Clocks
                            const cloudData = await this.loadEpisodeFromCloud(episodeId);
                            if (cloudData && cloudData.history && localData.history) {
                                const { strategy, resolved } = resolveEpisodeConflict(cloudData, localData, this.clientId);

                                if (strategy === 'cloud') {
                                    console.log(`Conflict resolved (CRDT / Yjs): Cloud version of ${filename} is newer. Updating local data...`);
                                    this.localSave(`episode-${episodeId}`, resolved);
                                    await this.idb.set(`episode-${episodeId}`, resolved).catch(e => console.error(e));
                                } else if (strategy === 'local') {
                                    console.log(`Conflict resolved (CRDT / Yjs): Local version of ${filename} is newer. Queuing cloud update...`);
                                    this.saveEpisodeToCloud(episodeId, resolved).catch(e => console.error(e));
                                } else if (strategy === 'concurrent') {
                                    console.log(`Conflict resolved (CRDT / Yjs): Concurrent changes detected for ${filename}. Merging...`);
                                    this.localSave(`episode-${episodeId}`, resolved);
                                    await this.idb.set(`episode-${episodeId}`, resolved).catch(e => console.error(e));
                                    this.saveEpisodeToCloud(episodeId, resolved).catch(e => console.error(e));
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
            this.syncQueue.notifySyncIssue('⚠️ Cloud history sync failed — check your connection or credentials');
        }
    }

    public async publishCommunityScript(communityRepoId: string, filename: string, scriptData: ScriptBeat[]): Promise<void> {
        if (!this.creds.getToken()) throw new Error("Cloud credentials not configured.");
        const content = JSON.stringify(scriptData, null, 2);
        // Modify sync queue items to specify repo ID since it's different from the default repo
        await this.syncQueue.enqueue({ repoId: communityRepoId, filename, content });
    }

    public async loadCommunityScript(repoId: string, filename: string): Promise<ScriptBeat[] | null> {
        const content = await this.hfStorage.loadCommunityScript(repoId, filename);
        if (!content) return null;
        return JSON.parse(content) as ScriptBeat[];
    }

    public async listEpisodes(): Promise<string[]> {
        const episodes: string[] = [];
        try {
            const keys = await this.idb.keys();
            for (const key of keys) {
                if (key.startsWith('episode-')) {
                    episodes.push(key.replace('episode-', ''));
                }
            }
        } catch(e) {}
        const localPrefix = `${this.prefix}${this.getProfile()}-episode-`;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(localPrefix)) {
                const id = key.replace(localPrefix, '');
                if (!episodes.includes(id)) episodes.push(id);
            }
        }
        return episodes;
    }

    public async searchLocalEpisodes(query: string): Promise<EpisodeSearchResult[]> {
        const results: EpisodeSearchResult[] = [];
        const normalizedQuery = query.toLowerCase();

        try {
            const keys = await this.idb.keys();
            for (const key of keys) {
                if (key.startsWith('episode-')) {
                    const episodeId = key.replace('episode-', '');
                    const content = await this.idb.get<StoredEpisode>(key);

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

        const localPrefix = `${this.prefix}${this.getProfile()}-episode-`;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(localPrefix)) {
                const episodeId = key.replace(localPrefix, '');
                const content = this.localLoad<StoredEpisode>(`episode-${episodeId}`);

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

    public async getCloudHistory(): Promise<HFHistoryEntry[]> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) {
            console.warn("Cannot fetch cloud history without credentials.");
            return [];
        }
        return await this.hfStorage.getDatasetHistory(token, repoId);
    }

    public async getPendingDeltas(): Promise<PendingDelta[]> {
        if (!this.creds.getToken() || !this.creds.getRepoId()) {
            return [];
        }

        try {
            const history = await this.getCloudHistory();
            if (history && history.length > 0 && !history[0].commit && !history[0].oid) {
                // Return files that contain "delta-"
                return history
                    .filter((item): item is HFHistoryEntry & { path: string } => !!item.path?.includes('delta-'))
                    .map((file): PendingDelta => ({
                        id: file.path,
                        path: file.path,
                        action: 'delta_merge',
                        cloudState: { fileInfo: file.path, size: file.size }, // Placeholder for now, real implementation would download it
                        localState: {}, // Placeholder
                    }));
            }
            return [];
        } catch (e) {
            console.error("Failed to get pending deltas:", e);
            return [];
        }
    }

    public async invalidateSyncedLocalEpisodes(): Promise<void> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) return;

        try {
            const history = await this.getCloudHistory();
            if (!history || history.length === 0 || history[0].commit || history[0].oid) {
                // Not the paths-info structure we expect or empty
                return;
            }

            const cloudEpisodes = history
                .filter((item): item is HFHistoryEntry & { path: string } =>
                    !!item.path?.startsWith('episodes/') && item.path.endsWith('/episode.json'))
                .map((item) => item.path.replace('episodes/', '').replace('/episode.json', ''));

            const localEpisodes = await this.listEpisodes();

            for (const localEpisode of localEpisodes) {
                if (cloudEpisodes.includes(localEpisode)) {
                    // Check if there are any pending deltas for this episode
                    const hasDeltas = history.some((item) => item.path && item.path.startsWith(`episodes/${localEpisode}/delta-`));
                    if (!hasDeltas) {
                        // Fully synced, we can safely remove the local copy to free up space
                        console.log(`Cache Invalidation: Removing fully synced local episode ${localEpisode}`);
                        localStorage.removeItem(`${this.prefix}${this.getProfile()}-episode-${localEpisode}`);
                        await this.idb.set(`episode-${localEpisode}`, null);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to invalidate local cache:", e);
        }
    }

    // --- Cloud Persistence: Conflict Resolution UI ---
    // Hooked up to the #cloud-dashboard-modal Accept Local / Accept Cloud / Merge actions.
    public async resolveConflict(
        episodeId: string,
        localState: StoredEpisode,
        cloudState: StoredEpisode,
        resolution: ConflictResolution,
    ): Promise<StoredEpisode> {
        console.log(`[MemoryManager] Resolving conflict for ${episodeId} using strategy: ${resolution}`);
        const resolved = applyManualResolution(localState, cloudState, resolution, this.clientId);

        this.localSave(`episode-${episodeId}`, resolved);
        await this.idb.set(`episode-${episodeId}`, resolved).catch(e => console.error(e));
        if (resolution !== 'local') {
            this.saveEpisodeToCloud(episodeId, resolved).catch(e => console.error(e));
        }

        return resolved;
    }

    public async syncSFXToCloud(sfxName: string, base64Content: string): Promise<void> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (token && repoId) {
            await this.hfStorage.saveCustomSFX(token, repoId, sfxName, base64Content);
        }
    }

    public async saveHighscoreToCloud(modeId: string, score: number): Promise<void> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (token && repoId) {
            await this.hfStorage.saveHighscore(token, repoId, modeId, score);
        }
    }
}
