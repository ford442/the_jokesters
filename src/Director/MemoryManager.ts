import { MemorySnippet } from '../utils/SemanticSearch';
import { HFStorageManager } from './HFStorageManager';
import type { Message } from '../types/chat';
import type { ScriptBeat } from './Director';
import type {
    StoredEpisode,
    EpisodeSearchResult,
    EpisodeAnalytics,
    SyncState,
    CloudCredentials,
    ConflictResolution,
    UserProfile,
    HFHistoryEntry,
    PendingDelta,
} from './memoryTypes';
import { MemoryIdbStore } from './memoryIdbStore';
import { MemorySyncQueue } from './memorySyncQueue';
import { MemoryEpisodeStore } from './memoryEpisodeStore';
import { MemorySummaryCache } from './memorySummaryCache';
import type { CloudCredentialsSource } from './memoryCredentials';

/**
 * Facade over the split-out memory subsystems (kept as one class since the
 * whole app already depends on this public API):
 *  - `MemoryIdbStore`     — profile-namespaced IndexedDB access
 *  - `MemorySyncQueue`    — background HF sync worker + queue + periodic tasks
 *  - `MemoryEpisodeStore` — episode/asset/script CRUD, cloud sync, conflict resolution
 *  - `MemorySummaryCache` — cloud summary cache + semantic/keyword search + analytics
 * This class itself keeps only profile/credential state and the generic
 * localStorage save/load/remove used across all of the above plus user profiles.
 */
export class MemoryManager {
    private prefix: string = 'jokesters-';
    private hfStorage: HFStorageManager;
    private hfToken: string | null = null;
    private hfRepoId: string | null = null;
    private currentProfile: string = 'default';
    private clientId: string;

    private idb: MemoryIdbStore;
    private syncQueue: MemorySyncQueue;
    private episodes: MemoryEpisodeStore;
    private summaries: MemorySummaryCache;

    constructor() {
        this.hfStorage = new HFStorageManager();
        let storedId = localStorage.getItem(this.prefix + 'client-id');
        if (!storedId) {
            storedId = Math.random().toString(36).substring(2, 15);
            localStorage.setItem(this.prefix + 'client-id', storedId);
        }
        this.clientId = storedId;
        this.loadProfileFromStorage();

        const creds: CloudCredentialsSource = {
            getToken: () => this.hfToken,
            getRepoId: () => this.hfRepoId,
        };

        this.idb = new MemoryIdbStore(() => this.currentProfile);
        this.syncQueue = new MemorySyncQueue(
            this.idb,
            creds,
            this.prefix,
            () => this.currentProfile,
            () => this.episodes.invalidateSyncedLocalEpisodes().catch(e => console.error("Error invalidating cache:", e)),
        );
        this.episodes = new MemoryEpisodeStore(
            this.idb,
            this.syncQueue,
            this.hfStorage,
            creds,
            this.prefix,
            () => this.currentProfile,
            this.clientId,
        );
        this.summaries = new MemorySummaryCache(this.idb, this.hfStorage, creds);

        this.loadCloudCredentials();
        this.syncQueue.processSyncQueue();
        this.summaries.ensureCloudSummaryCache();
        this.syncQueue.startDeltaConsolidationTask(() => this.episodes.listEpisodes());
        this.syncQueue.startAutoSyncTask();
        this.syncQueue.startPeriodicAutoSync();
    }

    public setSyncStatusCallback(callback: (status: string) => void) {
        this.syncQueue.setSyncStatusCallback(callback);
    }

    private loadProfileFromStorage(): void {
        const savedProfile = localStorage.getItem(this.prefix + 'current-profile');
        if (savedProfile) {
            this.currentProfile = savedProfile;
        }
    }

    public async getSyncState(): Promise<SyncState> {
        return this.syncQueue.getSyncState();
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

    public getCloudCredentials(): CloudCredentials {
        return { token: this.hfToken, repoId: this.hfRepoId };
    }

    public async validateCloudCredentials(): Promise<boolean> {
        if (!this.hfToken) return false;
        return await this.hfStorage.validateToken(this.hfToken);
    }

    public save(key: string, data: unknown): void {
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

    public saveEpisode(episodeId: string, data: StoredEpisode): void {
        this.episodes.saveEpisode(episodeId, data);
    }

    public async loadLastEpisode(): Promise<string | null> {
        return this.episodes.loadLastEpisode();
    }

    public async saveEpisodeAssetToCloud(episodeId: string, assetType: 'song' | 'pattern' | 'shader', assetName: string, assetContent: string): Promise<void> {
        return this.episodes.saveEpisodeAssetToCloud(episodeId, assetType, assetName, assetContent);
    }

    public async loadEpisodeAssetFromCloud(episodeId: string, assetType: 'song' | 'pattern' | 'shader', assetName: string): Promise<string | null> {
        return this.episodes.loadEpisodeAssetFromCloud(episodeId, assetType, assetName);
    }

    public async saveEpisodeScriptToCloud(script: ScriptBeat[], episodeId: string): Promise<void> {
        return this.episodes.saveEpisodeScriptToCloud(script, episodeId);
    }

    public async fetchPreviousEpisodeSummaries(currentTopic?: string): Promise<void> {
        return this.summaries.fetchPreviousEpisodeSummaries(currentTopic);
    }

    public async saveEpisodeDeltaToCloud(episodeId: string, newMessage: Message): Promise<void> {
        return this.episodes.saveEpisodeDeltaToCloud(episodeId, newMessage);
    }

    public async saveEpisodeToCloud(episodeId: string, data: StoredEpisode): Promise<void> {
        return this.episodes.saveEpisodeToCloud(episodeId, data);
    }

    public async processSyncQueue(): Promise<void> {
        return this.syncQueue.processSyncQueue();
    }

    public async loadEpisode(episodeId: string): Promise<StoredEpisode | null> {
        return this.episodes.loadEpisode(episodeId);
    }

    public async consolidateEpisodeDeltas(episodeId: string): Promise<void> {
        this.syncQueue.consolidateEpisodeDeltas(episodeId);
    }

    public startAutoSyncTask(): void {
        this.syncQueue.startAutoSyncTask();
    }

    public startPeriodicAutoSync(): void {
        this.syncQueue.startPeriodicAutoSync();
    }

    public startDeltaConsolidationTask(): void {
        this.syncQueue.startDeltaConsolidationTask(() => this.episodes.listEpisodes());
    }

    public async loadEpisodeFromCloud(episodeId: string): Promise<StoredEpisode | null> {
        return this.episodes.loadEpisodeFromCloud(episodeId);
    }

    public async syncAllHistoryFromCloud(): Promise<void> {
        return this.episodes.syncAllHistoryFromCloud();
    }

    public async publishCommunityScript(communityRepoId: string, filename: string, scriptData: ScriptBeat[]): Promise<void> {
        return this.episodes.publishCommunityScript(communityRepoId, filename, scriptData);
    }

    public async loadCommunityScript(repoId: string, filename: string): Promise<ScriptBeat[] | null> {
        return this.episodes.loadCommunityScript(repoId, filename);
    }

    public async listEpisodes(): Promise<string[]> {
        return this.episodes.listEpisodes();
    }

    public async searchLocalEpisodes(query: string): Promise<EpisodeSearchResult[]> {
        return this.episodes.searchLocalEpisodes(query);
    }

    public async saveUserProfile(profile: UserProfile): Promise<void> {
        this.save('user_preferences', profile);
        if (this.hfToken && this.hfRepoId) {
            const filename = `profile/user_preferences.json`;
            const content = JSON.stringify(profile, null, 2);
            await this.syncQueue.enqueue({ filename, content }, true);
        }
    }

    public async saveAvatarConfigToCloud(config: Record<string, unknown>): Promise<void> {
        let currentProfile = await this.loadUserProfile();
        if (!currentProfile) {
            currentProfile = {} as Record<string, unknown>;
        }
        currentProfile.avatar_tts_config = config;
        await this.saveUserProfile(currentProfile);
    }

    public async loadAvatarConfigFromCloud(): Promise<Record<string, unknown> | null> {
        const currentProfile = await this.loadUserProfile();
        if (currentProfile && currentProfile.avatar_tts_config) {
            return currentProfile.avatar_tts_config as Record<string, unknown>;
        }
        return null;
    }

    public async loadUserProfile(): Promise<UserProfile | null> {
        let localProfile = this.load<UserProfile>('user_preferences');
        if (this.hfToken && this.hfRepoId) {
            try {
                const content = await this.hfStorage.loadFile(this.hfToken, this.hfRepoId, 'profile/user_preferences.json');
                if (content) {
                    localProfile = JSON.parse(content) as UserProfile;
                    this.save('user_preferences', localProfile);
                }
            } catch (e) {
                console.warn('Failed to load user profile from cloud:', e);
            }
        }
        return localProfile;
    }

    public getCloudSummary(): StoredEpisode | null {
        return this.summaries.getCloudSummary();
    }

    /**
     * Utilizes SemanticSearch (TF-IDF vector cosine similarity) to find relevant cloud memories mid-conversation.
     */
    public async searchCloudMemories(query: string, topK: number = 3): Promise<MemorySnippet[]> {
        return this.summaries.searchCloudMemories(query, topK);
    }

    public async searchFetchedSummaries(query: string): Promise<EpisodeSearchResult[]> {
        return this.summaries.searchFetchedSummaries(query);
    }

    public async getEpisodeAnalytics(): Promise<EpisodeAnalytics> {
        return this.summaries.getEpisodeAnalytics();
    }

    public async getCloudHistory(): Promise<HFHistoryEntry[]> {
        return this.episodes.getCloudHistory();
    }

    public async getPendingDeltas(): Promise<PendingDelta[]> {
        return this.episodes.getPendingDeltas();
    }

    public async invalidateSyncedLocalEpisodes(): Promise<void> {
        return this.episodes.invalidateSyncedLocalEpisodes();
    }

    // --- Cloud Persistence: Conflict Resolution UI ---
    // Hooked up to the #cloud-dashboard-modal Accept Local / Accept Cloud / Merge actions.
    public async resolveConflict(
        episodeId: string,
        localState: StoredEpisode,
        cloudState: StoredEpisode,
        resolution: ConflictResolution,
    ): Promise<StoredEpisode> {
        return this.episodes.resolveConflict(episodeId, localState, cloudState, resolution);
    }

    public async syncSFXToCloud(sfxName: string, base64Content: string): Promise<void> {
        return this.episodes.syncSFXToCloud(sfxName, base64Content);
    }

    public async saveHighscoreToCloud(modeId: string, score: number): Promise<void> {
        return this.episodes.saveHighscoreToCloud(modeId, score);
    }
}

/**
 * Shared app instance (set during bootstrap). Used only by entry points that wire up
 * before the rest of the controller chain exists (dashboard.ts, statusBar.ts's sync
 * polling — both run from main.ts ahead of initApp() resolving) and so can't receive
 * MemoryManager via an ordinary constructor/parameter chain. Everything else should
 * take MemoryManager as an explicit parameter instead of reading this.
 */
let sharedMemoryManager: MemoryManager | null = null;

export function setSharedMemoryManager(mgr: MemoryManager | null): void {
    sharedMemoryManager = mgr;
}

export function getSharedMemoryManager(): MemoryManager | null {
    return sharedMemoryManager;
}
