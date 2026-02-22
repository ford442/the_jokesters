/**
 * Optimized TTS Web Worker
 * Offloads audio synthesis from main thread
 * Includes: phoneme caching, viseme prediction, and latency profiling
 */

import type { InferenceSession, Tensor } from 'onnxruntime-web';

// --- Types ---
export interface WorkerInitMessage {
    type: 'init';
    modelPath: string;
}

export interface WorkerSynthesizeMessage {
    type: 'synthesize';
    text: string;
    styleData: {
        ttlData: Float32Array;
        ttlDims: number[];
        dpData: Float32Array;
        dpDims: number[];
    };
    options: {
        speed?: number;
        steps?: number;
        seed?: number;
    };
    requestId: string;
}

export interface WorkerPreCacheMessage {
    type: 'preCache';
    phonemes: string[];
}

export interface WorkerStatsMessage {
    type: 'getStats';
}

export type WorkerRequest = 
    | WorkerInitMessage 
    | WorkerSynthesizeMessage 
    | WorkerPreCacheMessage
    | WorkerStatsMessage;

export interface WorkerInitSuccess {
    type: 'init-success';
}

export interface WorkerInitError {
    type: 'init-error';
    error: string;
}

export interface WorkerSynthesisSuccess {
    type: 'synthesis-success';
    audioData: Float32Array;
    sampleRate: number;
    duration: number;
    visemes: {
        phoneme: string;
        startTime: number;
        duration: number;
        intensity: number;
        mouthShape: string;
    }[];
    latency: {
        totalMs: number;
        textProcessingMs: number;
        cacheLookupMs: number;
        durationPredictionMs: number;
        textEncodingMs: number;
        diffusionMs: number;
        vocoderMs: number;
    };
    requestId: string;
}

export interface WorkerSynthesisError {
    type: 'synthesis-error';
    error: string;
    requestId: string;
}

export interface WorkerStatsResponse {
    type: 'stats';
    cacheStats: {
        size: number;
        maxSize: number;
        hitRate: number;
        hits: number;
        misses: number;
    };
    avgLatencyMs: number;
}

export type WorkerResponse = 
    | WorkerInitSuccess 
    | WorkerInitError 
    | WorkerSynthesisSuccess 
    | WorkerSynthesisError
    | WorkerStatsResponse;

// --- Unicode Processor ---
class UnicodeProcessor {
    private indexer: number[];
    
    constructor(indexer: number[]) {
        this.indexer = indexer;
    }

    preprocessText(text: string): string {
        text = text.normalize('NFKD');
        text = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
        text = text.replace(/\s+/g, ' ').trim();
        if (!/[.!?;:,'")\]}…]$/.test(text)) {
            text += '.';
        }
        return text;
    }

    call(textList: string[]) {
        const processedTexts = textList.map(t => this.preprocessText(t));
        const lengths = processedTexts.map(t => t.length);
        const maxLen = Math.max(...lengths);

        const textIds = processedTexts.map(text => {
            const row = new Array(maxLen).fill(0);
            for (let j = 0; j < text.length; j++) {
                const codePoint = text.codePointAt(j) || 0;
                row[j] = (codePoint < this.indexer.length) ? this.indexer[codePoint] : -1;
            }
            return row;
        });

        const textMask = lengths.map(len => {
            const row = new Array(maxLen).fill(0.0);
            for (let j = 0; j < Math.min(len, maxLen); j++) row[j] = 1.0;
            return [row];
        });

        return { textIds, textMask, maxLen };
    }
}

// --- Phoneme Cache (in-worker) ---
interface CachedPhonemeData {
    textIds: BigInt64Array;
    textMask: Float32Array;
    textMaskShape: number[];
    duration: number;
    textEmbedding: Float32Array;
    textEmbeddingShape: number[];
}

class WorkerPhonemeCache {
    private cache = new Map<string, CachedPhonemeData>();
    private maxSize = 500;

    getKey(text: string): string {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `${text.length}_${hash}`;
    }

    has(text: string): boolean {
        return this.cache.has(this.getKey(text));
    }

    get(text: string): CachedPhonemeData | null {
        return this.cache.get(this.getKey(text)) || null;
    }

    set(text: string, data: CachedPhonemeData): void {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(this.getKey(text), data);
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }
}

// --- Viseme Predictor (in-worker) ---
const PHONEME_TO_VISEME: Record<string, string> = {
    'AA': 'AA_AH', 'AE': 'AE_AW', 'AH': 'AA_AH', 'AO': 'AO_OH',
    'AW': 'AE_AW', 'AY': 'AE_AW', 'EH': 'IH_IY_EH', 'ER': 'ER',
    'EY': 'IH_IY_EH', 'IH': 'IH_IY_EH', 'IY': 'IH_IY_EH', 'OW': 'UW_OW',
    'OY': 'UW_OW', 'UH': 'UH', 'UW': 'UW_OW',
    'B': 'M_B_P', 'CH': 'SH_CH_J', 'D': 'L_N_D_T', 'DH': 'TH_DH',
    'F': 'F_V', 'G': 'K_G_NG', 'HH': 'REST', 'JH': 'SH_CH_J',
    'K': 'K_G_NG', 'L': 'L_N_D_T', 'M': 'M_B_P', 'N': 'L_N_D_T',
    'NG': 'K_G_NG', 'P': 'M_B_P', 'R': 'R', 'S': 'S_Z',
    'SH': 'SH_CH_J', 'T': 'L_N_D_T', 'TH': 'TH_DH', 'V': 'F_V',
    'W': 'W', 'Y': 'IH_IY_EH', 'Z': 'S_Z', 'ZH': 'SH_CH_J'
};

function approximatePhonemes(text: string): string[] {
    const phonemes: string[] = [];
    const normalized = text.toLowerCase().replace(/[^a-z\s]/g, '');
    
    for (const word of normalized.split(/\s+/)) {
        if (!word) continue;
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const nextChar = word[i + 1];
            
            if ('aeiou'.includes(char)) {
                if (char === 'a') {
                    if (nextChar === 'i' || nextChar === 'y') { phonemes.push('EY'); i++; }
                    else if (nextChar === 'u' || nextChar === 'w') { phonemes.push('AW'); i++; }
                    else { phonemes.push('AE'); }
                } else if (char === 'e') {
                    phonemes.push('EH');
                } else if (char === 'i') {
                    phonemes.push('IH');
                } else if (char === 'o') {
                    if (nextChar === 'o') { phonemes.push('UW'); i++; }
                    else { phonemes.push('AO'); }
                } else if (char === 'u') {
                    phonemes.push('AH');
                }
            } else if (char === 't' && nextChar === 'h') {
                phonemes.push('TH'); i++;
            } else if (char === 's' && nextChar === 'h') {
                phonemes.push('SH'); i++;
            } else if ('bdfghjklmnpqrstvwxyz'.includes(char)) {
                const mapping: Record<string, string> = {
                    'b': 'B', 'c': 'K', 'd': 'D', 'f': 'F', 'g': 'G',
                    'h': 'HH', 'j': 'JH', 'k': 'K', 'l': 'L', 'm': 'M',
                    'n': 'N', 'p': 'P', 'q': 'K', 'r': 'R', 's': 'S',
                    't': 'T', 'v': 'V', 'w': 'W', 'x': 'K', 'y': 'Y', 'z': 'Z'
                };
                phonemes.push(mapping[char] || 'REST');
            }
        }
        phonemes.push('REST');
    }
    
    return phonemes.filter(p => p !== 'REST');
}

function predictVisemes(text: string, totalDurationSec: number) {
    const phonemes = approximatePhonemes(text);
    const visemes = [];
    const baseDuration = totalDurationSec / Math.max(phonemes.length, 1);
    
    let currentTime = 0;
    for (let i = 0; i < phonemes.length; i++) {
        const phoneme = phonemes[i];
        const isVowel = phoneme.length <= 2;
        let durationMultiplier = isVowel ? 1.3 : 1.0;
        
        const duration = baseDuration * durationMultiplier;
        
        visemes.push({
            phoneme,
            startTime: currentTime,
            duration,
            intensity: isVowel ? 0.9 : 0.7,
            mouthShape: PHONEME_TO_VISEME[phoneme] || 'REST'
        });
        
        currentTime += duration;
    }
    
    return visemes;
}

// --- RNG for seeded generation ---
class RNG {
    private seed: number;
    
    constructor(seed: number) {
        this.seed = seed;
    }
    
    next(): number {
        // Mulberry32 PRNG
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// --- Main Worker State ---
let ort: any = null;
let textProcessor: UnicodeProcessor | null = null;
let config: any = null;

// ONNX Sessions
let dpSession: InferenceSession | null = null;
let textEncSession: InferenceSession | null = null;
let vectorEstSession: InferenceSession | null = null;
let vocoderSession: InferenceSession | null = null;

// Cache
const phonemeCache = new WorkerPhonemeCache();

// Latency tracking
const latencyHistory: number[] = [];
const MAX_LATENCY_HISTORY = 50;

// --- Message Handler ---
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    const msg = e.data;

    switch (msg.type) {
        case 'init':
            await handleInit(msg);
            break;
        case 'synthesize':
            await handleSynthesize(msg);
            break;
        case 'preCache':
            await handlePreCache(msg);
            break;
        case 'getStats':
            handleGetStats();
            break;
    }
};

async function handleInit(msg: WorkerInitMessage) {
    try {
        // Dynamic import of ONNX Runtime
        ort = await import('onnxruntime-web');
        
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.proxy = false;
        
        const modelPath = msg.modelPath;

        // Load configs
        const [cfgResp, indexerResp] = await Promise.all([
            fetch(`${modelPath}/tts.json`),
            fetch(`${modelPath}/unicode_indexer.json`)
        ]);

        config = await cfgResp.json();
        const indexer = await indexerResp.json();
        textProcessor = new UnicodeProcessor(indexer);

        // Load ONNX models
        const sessionOpts: InferenceSession.SessionOptions = {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
        };

        [dpSession, textEncSession, vectorEstSession, vocoderSession] = await Promise.all([
            ort.InferenceSession.create(`${modelPath}/duration_predictor.onnx`, sessionOpts),
            ort.InferenceSession.create(`${modelPath}/text_encoder.onnx`, sessionOpts),
            ort.InferenceSession.create(`${modelPath}/vector_estimator.onnx`, sessionOpts),
            ort.InferenceSession.create(`${modelPath}/vocoder.onnx`, sessionOpts)
        ]);

        self.postMessage({ type: 'init-success' } as WorkerInitSuccess);
    } catch (err: any) {
        self.postMessage({ type: 'init-error', error: err.message } as WorkerInitError);
    }
}

async function handleSynthesize(msg: WorkerSynthesizeMessage) {
    const startTime = performance.now();
    let phaseTimings = {
        textProcessingMs: 0,
        cacheLookupMs: 0,
        durationPredictionMs: 0,
        textEncodingMs: 0,
        diffusionMs: 0,
        vocoderMs: 0
    };

    try {
        if (!ort || !textProcessor || !dpSession || !textEncSession || !vectorEstSession || !vocoderSession) {
            throw new Error('Worker not initialized');
        }

        const { text, styleData, options, requestId } = msg;
        const { speed = 1.0, steps = 10, seed } = options;

        // Reconstruct style tensors
        const bsz = 1;
        const styleTtl = new ort.Tensor('float32', 
            new Float32Array(styleData.ttlData), 
            [bsz, styleData.ttlDims[1], styleData.ttlDims[2]]
        );
        const styleDp = new ort.Tensor('float32', 
            new Float32Array(styleData.dpData), 
            [bsz, styleData.dpDims[1], styleData.dpDims[2]]
        );

        // Phase 1: Text Processing
        const textProcStart = performance.now();
        const { textIds, textMask, maxLen } = textProcessor.call([text]);
        phaseTimings.textProcessingMs = performance.now() - textProcStart;

        // Phase 2: Check cache for pre-computed embeddings
        const cacheStart = performance.now();
        const cached = phonemeCache.get(text);
        phaseTimings.cacheLookupMs = performance.now() - cacheStart;

        let textIdsTensor: Tensor;
        let textMaskTensor: Tensor;
        let duration: number;
        let textEmb: Tensor;

        if (cached) {
            // Use cached data
            textIdsTensor = new ort.Tensor('int64', cached.textIds, [1, cached.textIds.length]);
            textMaskTensor = new ort.Tensor('float32', cached.textMask, cached.textMaskShape);
            duration = cached.duration / speed;
            textEmb = new ort.Tensor('float32', cached.textEmbedding, cached.textEmbeddingShape);
            phaseTimings.durationPredictionMs = 0;
            phaseTimings.textEncodingMs = 0;
        } else {
            // Create tensors
            const textIdsFlat = new BigInt64Array(textIds.flat().map(x => BigInt(x)));
            textIdsTensor = new ort.Tensor('int64', textIdsFlat, [bsz, maxLen]);
            const textMaskFlat = new Float32Array(textMask.flat(2));
            textMaskTensor = new ort.Tensor('float32', textMaskFlat, [bsz, 1, maxLen]);

            // Phase 3: Duration Predictor
            const dpStart = performance.now();
            const dpOut = await dpSession.run({
                text_ids: textIdsTensor,
                style_dp: styleDp,
                text_mask: textMaskTensor
            });
            duration = (dpOut.duration.data as Float32Array)[0] / speed;
            phaseTimings.durationPredictionMs = performance.now() - dpStart;

            // Phase 4: Text Encoder
            const encStart = performance.now();
            const encOut = await textEncSession.run({
                text_ids: textIdsTensor,
                style_ttl: styleTtl,
                text_mask: textMaskTensor
            });
            textEmb = encOut.text_emb;
            phaseTimings.textEncodingMs = performance.now() - encStart;

            // Cache for future use (only for short phrases)
            if (text.length <= 50) {
                phonemeCache.set(text, {
                    textIds: new BigInt64Array(textIdsFlat),
                    textMask: new Float32Array(textMaskFlat),
                    textMaskShape: [bsz, 1, maxLen],
                    duration: duration * speed, // Store original duration
                    textEmbedding: new Float32Array(textEmb.data as Float32Array),
                    textEmbeddingShape: textEmb.dims as number[]
                });
            }
        }

        // Phase 5: Sample noisy latent and diffusion
        const diffusionStart = performance.now();
        const sr = config.ae.sample_rate;
        const chunkSize = config.ae.base_chunk_size * config.ttl.chunk_compress_factor;
        const latentLen = Math.floor((duration * sr + chunkSize - 1) / chunkSize);
        const latentDim = config.ttl.latent_dim * config.ttl.chunk_compress_factor;

        // Sample noise
        const rng = seed !== undefined ? new RNG(seed) : undefined;
        const noiseSize = latentDim * latentLen;
        const noise = new Float32Array(noiseSize);
        for (let i = 0; i < noiseSize; i++) {
            const u1 = Math.max(0.0001, rng ? rng.next() : Math.random());
            const u2 = rng ? rng.next() : Math.random();
            noise[i] = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        }

        let currentXt = new ort.Tensor('float32', noise, [1, latentDim, latentLen]);
        const latentMaskData = new Float32Array(latentLen).fill(1.0);
        const latentMaskTensor = new ort.Tensor('float32', latentMaskData, [1, 1, latentLen]);

        const totalStepTensor = new ort.Tensor('float32', new Float32Array([steps]), [bsz]);

        // Diffusion loop
        for (let step = 0; step < steps; step++) {
            const currentStepTensor = new ort.Tensor('float32', new Float32Array([step]), [bsz]);

            const vecOut = await vectorEstSession.run({
                noisy_latent: currentXt,
                text_emb: textEmb,
                style_ttl: styleTtl,
                latent_mask: latentMaskTensor,
                text_mask: textMaskTensor,
                current_step: currentStepTensor,
                total_step: totalStepTensor
            });

            currentXt = new ort.Tensor('float32', vecOut.denoised_latent.data as Float32Array, currentXt.dims);
        }
        phaseTimings.diffusionMs = performance.now() - diffusionStart;

        // Phase 6: Vocoder
        const vocoderStart = performance.now();
        const vocoderOut = await vocoderSession.run({ latent: currentXt });
        const wav = vocoderOut.wav_tts.data as Float32Array;
        phaseTimings.vocoderMs = performance.now() - vocoderStart;

        // Generate visemes with lookahead
        const visemes = predictVisemes(text, duration);

        const totalLatency = performance.now() - startTime;
        
        // Track latency
        latencyHistory.push(totalLatency);
        if (latencyHistory.length > MAX_LATENCY_HISTORY) {
            latencyHistory.shift();
        }

        // Send response
        self.postMessage({
            type: 'synthesis-success',
            audioData: wav,
            sampleRate: sr,
            duration,
            visemes,
            latency: {
                totalMs: totalLatency,
                ...phaseTimings
            },
            requestId
        } as WorkerSynthesisSuccess, { transfer: [wav.buffer] });

    } catch (err: any) {
        self.postMessage({
            type: 'synthesis-error',
            error: err.message,
            requestId: msg.requestId
        } as WorkerSynthesisError);
    }
}

async function handlePreCache(_msg: WorkerPreCacheMessage) {
    // Pre-cache common phonemes
    // This would need the style data, so we skip for now
    // The cache is populated on-demand during synthesis
}

function handleGetStats() {
    const avgLatency = latencyHistory.length > 0 
        ? latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length 
        : 0;
    
    self.postMessage({
        type: 'stats',
        cacheStats: phonemeCache.getStats(),
        avgLatencyMs: avgLatency
    } as WorkerStatsResponse);
}
