export interface MemorySnippet {
    episodeId: string;
    summary: string;
    score: number;
}

export class SemanticSearch {
    /**
     * Tokenizes text into lowercase words.
     */
    private static tokenize(text: string): string[] {
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    }

    /**
     * Calculates the Term Frequency (TF) for a given document (array of tokens).
     */
    private static calculateTF(tokens: string[]): Map<string, number> {
        const tf = new Map<string, number>();
        const total = tokens.length;
        if (total === 0) return tf;

        for (const token of tokens) {
            tf.set(token, (tf.get(token) || 0) + 1);
        }

        for (const [token, count] of tf.entries()) {
            tf.set(token, count / total);
        }

        return tf;
    }

    /**
     * Calculates the Inverse Document Frequency (IDF) across a set of documents.
     */
    private static calculateIDF(corpusTokens: string[][]): Map<string, number> {
        const idf = new Map<string, number>();
        const N = corpusTokens.length;
        if (N === 0) return idf;

        const df = new Map<string, number>();

        for (const tokens of corpusTokens) {
            const uniqueTokens = new Set(tokens);
            for (const token of uniqueTokens) {
                df.set(token, (df.get(token) || 0) + 1);
            }
        }

        for (const [token, count] of df.entries()) {
            idf.set(token, Math.log((N + 1) / (count + 1)) + 1); // Smoothing
        }

        return idf;
    }

    /**
     * Computes the cosine similarity between two TF-IDF vectors.
     */
    private static cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (const [token, val1] of vec1.entries()) {
            const val2 = vec2.get(token) || 0;
            dotProduct += val1 * val2;
            norm1 += val1 * val1;
        }

        for (const val2 of vec2.values()) {
            norm2 += val2 * val2;
        }

        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Searches through a list of episode summaries for a query and returns the most relevant ones.
     * @param query The search query string.
     * @param summaries An array of objects containing episodeId and summary text.
     * @param topK Number of top results to return.
     * @returns Array of MemorySnippet sorted by relevance score.
     */
    public static searchMemories(query: string, summaries: { episodeId: string; summary: string }[], topK: number = 3): MemorySnippet[] {
        if (!query.trim() || summaries.length === 0) {
            return [];
        }

        const queryTokens = this.tokenize(query);
        const corpusTokens = summaries.map(s => this.tokenize(s.summary));

        const idf = this.calculateIDF(corpusTokens);
        const queryTF = this.calculateTF(queryTokens);

        const queryVec = new Map<string, number>();
        for (const [token, tfVal] of queryTF.entries()) {
            queryVec.set(token, tfVal * (idf.get(token) || 1));
        }

        const results: MemorySnippet[] = [];

        for (let i = 0; i < summaries.length; i++) {
            const docTokens = corpusTokens[i];
            const docTF = this.calculateTF(docTokens);

            const docVec = new Map<string, number>();
            for (const [token, tfVal] of docTF.entries()) {
                docVec.set(token, tfVal * (idf.get(token) || 1));
            }

            const score = this.cosineSimilarity(queryVec, docVec);

            if (score > 0) {
                results.push({
                    episodeId: summaries[i].episodeId,
                    summary: summaries[i].summary,
                    score: score
                });
            }
        }

        return results.sort((a, b) => b.score - a.score).slice(0, topK);
    }
}
