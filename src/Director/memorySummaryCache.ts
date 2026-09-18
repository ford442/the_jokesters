import { SemanticSearch, MemorySnippet } from '../utils/SemanticSearch';
import { HFStorageManager } from './HFStorageManager';
import type { EpisodeAnalytics, EpisodeSearchResult, StoredEpisode } from './memoryTypes';
import { MemoryIdbStore } from './memoryIdbStore';
import type { CloudCredentialsSource } from './memoryCredentials';

/**
 * Caches the cloud "latest episode" snapshot and answers relevance queries
 * against it (semantic search + a lightweight TF-IDF-style fallback), plus
 * cross-episode analytics over local + cached-cloud history.
 */
export class MemorySummaryCache {
    private cloudSummaryCache: StoredEpisode | null = null;

    constructor(
        private idb: MemoryIdbStore,
        private hfStorage: HFStorageManager,
        private creds: CloudCredentialsSource,
    ) {}

    public getCloudSummary(): StoredEpisode | null {
        return this.cloudSummaryCache;
    }

    public async ensureCloudSummaryCache(): Promise<void> {
        if (this.cloudSummaryCache) return;
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) return;

        try {
            const content = await this.hfStorage.loadFile(token, repoId, 'episodes/latest.json');
            if (content) {
                this.cloudSummaryCache = JSON.parse(content) as StoredEpisode;
            }
        } catch (e) {
            console.warn('Failed to fetch summary cache:', e);
        }
    }

    public async fetchPreviousEpisodeSummaries(currentTopic?: string): Promise<void> {
        const token = this.creds.getToken();
        const repoId = this.creds.getRepoId();
        if (!token || !repoId) return;
        try {
            const content = await this.hfStorage.loadFile(token, repoId, 'episodes/latest.json');
            if (content) {
                const parsed = JSON.parse(content) as StoredEpisode;
                if (!this.cloudSummaryCache) {
                    this.cloudSummaryCache = { history: [] };
                }
                if (parsed.history && Array.isArray(parsed.history)) {
                    if (currentTopic) {
                        // Prefer system messages as the searchable "memory" summaries
                        const summariesToSearch: { episodeId: string; summary: string }[] = [];
                        parsed.history.forEach((msg, index) => {
                            if (msg.role === 'system' && msg.content && typeof msg.content === 'string') {
                                summariesToSearch.push({
                                    episodeId: index.toString(),
                                    summary: msg.content
                                });
                            }
                        });

                        const relevantSnippets = SemanticSearch.searchMemories(currentTopic, summariesToSearch, 10);
                        const relevantIndices = new Set(relevantSnippets.map(s => parseInt(s.episodeId, 10)));

                        // Keep relevant system context + all non-system messages
                        this.cloudSummaryCache.history = parsed.history.filter((msg, index) =>
                            msg.role !== 'system' || relevantIndices.has(index)
                        );
                    } else {
                        // No topic filter — inject the full previous history
                        this.cloudSummaryCache.history = parsed.history;
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to fetch previous episode summaries:', e);
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

    /**
     * Utilizes SemanticSearch (TF-IDF vector cosine similarity) to find relevant cloud memories mid-conversation.
     * Extracts summaries from cloudSummaryCache and uses the new algorithm.
     */
    public async searchCloudMemories(query: string, topK: number = 3): Promise<MemorySnippet[]> {
        await this.ensureCloudSummaryCache();
        if (!this.cloudSummaryCache || !this.cloudSummaryCache.history) {
            return [];
        }

        const summariesToSearch: { episodeId: string; summary: string }[] = [];

        // Convert history messages into summaries we can search over
        for (const msg of this.cloudSummaryCache.history) {
            if (msg.content && typeof msg.content === 'string') {
                // Here episodeId might not strictly be an episode ID for every message,
                // but we map it as a context slice.
                summariesToSearch.push({
                    episodeId: 'latest-cloud',
                    summary: `[${msg.role}]: ${msg.content}`
                });
            }
        }

        return SemanticSearch.searchMemories(query, summariesToSearch, topK);
    }

    public async searchFetchedSummaries(query: string): Promise<EpisodeSearchResult[]> {
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

    public async getEpisodeAnalytics(): Promise<EpisodeAnalytics> {
        await this.ensureCloudSummaryCache();

        let totalEpisodes = 0;
        let totalTokensProxy = 0;
        let avgEpisodeLength = 0;
        const commonModes: Record<string, number> = {};

        // Let's actually count local episodes from IndexedDB as well to get better metrics.
        const allKeys = await this.idb.keys();
        totalEpisodes = allKeys.length;

        for (const key of allKeys) {
            const episode = await this.idb.get<StoredEpisode>(key);
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
}
