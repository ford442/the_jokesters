/**
 * Phoneme Cache System
 * Pre-caches phoneme embeddings and durations for common sounds
 * Reduces redundant ONNX inference for repeated phonemes
 */

import type { InferenceSession } from 'onnxruntime-web';

export interface CachedPhoneme {
    textHash: string;
    textIds: BigInt64Array;
    textMask: Float32Array;
    textMaskShape: number[];
    duration: number;
    textEmbedding: Float32Array;
    textEmbeddingShape: number[];
    timestamp: number;
    accessCount: number;
}

export interface PhonemeCacheConfig {
    maxSize: number;
    ttlMs: number;
    preCacheCommon: boolean;
}

export class PhonemeCache {
    private cache: Map<string, CachedPhoneme> = new Map();
    private config: PhonemeCacheConfig;
    private hitCount = 0;
    private missCount = 0;

    // Common English phonemes and words to pre-cache
    private commonPhonemes = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
        'I', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
        'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
        'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
        'one', 'all', 'would', 'there', 'their', 'what', 'so',
        'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
        'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
        'him', 'know', 'take', 'people', 'into', 'year', 'your',
        'good', 'some', 'could', 'them', 'see', 'other', 'than',
        'then', 'now', 'look', 'only', 'come', 'its', 'over',
        'think', 'also', 'back', 'after', 'use', 'two', 'how',
        'our', 'work', 'first', 'well', 'way', 'even', 'new',
        'want', 'because', 'any', 'these', 'give', 'day', 'most',
        'us', 'is', 'was', 'are', 'were', 'been', 'has', 'had',
        'did', 'does', 'doing', 'done', 'am', 'are', 'being',
        'hello', 'hi', 'yes', 'no', 'okay', 'ok', 'yeah', 'uh',
        'um', 'oh', 'ah', 'ha', 'heh', 'hmm', 'eh', 'wow'
    ];

    constructor(config: Partial<PhonemeCacheConfig> = {}) {
        this.config = {
            maxSize: config.maxSize || 500,
            ttlMs: config.ttlMs || 5 * 60 * 1000, // 5 minutes default
            preCacheCommon: config.preCacheCommon !== false
        };
    }

    /**
     * Generate cache key from text
     */
    private getCacheKey(text: string): string {
        // Simple hash for fast lookup
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `${text.length}_${hash}`;
    }

    /**
     * Check if phoneme data is cached
     */
    has(text: string): boolean {
        const key = this.getCacheKey(text);
        const cached = this.cache.get(key);
        
        if (!cached) return false;
        
        // Check TTL
        if (Date.now() - cached.timestamp > this.config.ttlMs) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * Get cached phoneme data
     */
    get(text: string): CachedPhoneme | null {
        const key = this.getCacheKey(text);
        const cached = this.cache.get(key);
        
        if (!cached) {
            this.missCount++;
            return null;
        }
        
        // Check TTL
        if (Date.now() - cached.timestamp > this.config.ttlMs) {
            this.cache.delete(key);
            this.missCount++;
            return null;
        }
        
        cached.accessCount++;
        this.hitCount++;
        return cached;
    }

    /**
     * Store phoneme data in cache
     */
    set(
        text: string,
        textIds: BigInt64Array,
        textMask: Float32Array,
        textMaskShape: number[],
        duration: number,
        textEmbedding: Float32Array,
        textEmbeddingShape: number[]
    ): void {
        // Evict oldest if at capacity
        if (this.cache.size >= this.config.maxSize) {
            this.evictLRU();
        }

        const key = this.getCacheKey(text);
        this.cache.set(key, {
            textHash: key,
            textIds: new BigInt64Array(textIds), // Copy to prevent external mutation
            textMask: new Float32Array(textMask),
            textMaskShape: [...textMaskShape],
            duration,
            textEmbedding: new Float32Array(textEmbedding),
            textEmbeddingShape: [...textEmbeddingShape],
            timestamp: Date.now(),
            accessCount: 1
        });
    }

    /**
     * Pre-cache common phonemes using the provided sessions
     */
    async preCacheCommonPhonemes(
        textProcessor: { call: (texts: string[]) => { textIds: number[][]; textMask: number[][][] } },
        dpSession: InferenceSession,
        textEncSession: InferenceSession,
        ort: any
    ): Promise<number> {
        if (!this.config.preCacheCommon) return 0;

        let cached = 0;
        const batchSize = 10;
        
        for (let i = 0; i < this.commonPhonemes.length; i += batchSize) {
            const batch = this.commonPhonemes.slice(i, i + batchSize);
            
            for (const phoneme of batch) {
                if (this.has(phoneme)) continue;
                
                try {
                    const { textIds, textMask } = textProcessor.call([phoneme]);
                    const maxLen = textIds[0].length;
                    
                    const textIdsFlat = new BigInt64Array(textIds.flat().map(x => BigInt(x)));
                    const textIdsTensor = new ort.Tensor('int64', textIdsFlat, [1, maxLen]);
                    
                    const textMaskFlat = new Float32Array(textMask.flat(2));
                    const textMaskTensor = new ort.Tensor('float32', textMaskFlat, [1, 1, maxLen]);

                    // Run duration predictor
                    const dpOut = await dpSession.run({
                        text_ids: textIdsTensor,
                        style_dp: null as any, // Will be filled at synthesis time
                        text_mask: textMaskTensor
                    });
                    const duration = (dpOut.duration.data as Float32Array)[0];

                    // Run text encoder
                    const encOut = await textEncSession.run({
                        text_ids: textIdsTensor,
                        style_ttl: null as any, // Will be filled at synthesis time
                        text_mask: textMaskTensor
                    });
                    const textEmb = encOut.text_emb.data as Float32Array;
                    const textEmbShape = encOut.text_emb.dims as number[];

                    this.set(
                        phoneme,
                        textIdsFlat,
                        textMaskFlat,
                        [1, 1, maxLen],
                        duration,
                        textEmb,
                        textEmbShape
                    );
                    cached++;
                } catch (e) {
                    console.warn(`[PhonemeCache] Failed to pre-cache "${phoneme}":`, e);
                }
            }
        }

        console.log(`[PhonemeCache] Pre-cached ${cached} common phonemes`);
        return cached;
    }

    /**
     * Evict least recently used entries
     */
    private evictLRU(): void {
        let minAccess = Infinity;
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, value] of this.cache.entries()) {
            // Prioritize by access count, then by timestamp
            if (value.accessCount < minAccess || 
                (value.accessCount === minAccess && value.timestamp < oldestTime)) {
                minAccess = value.accessCount;
                oldestTime = value.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.hitCount + this.missCount;
        return {
            size: this.cache.size,
            maxSize: this.config.maxSize,
            hitRate: total > 0 ? this.hitCount / total : 0,
            hits: this.hitCount,
            misses: this.missCount
        };
    }

    /**
     * Clear all cached entries
     */
    clear(): void {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }
}

// Global cache instance
export const phonemeCache = new PhonemeCache();
