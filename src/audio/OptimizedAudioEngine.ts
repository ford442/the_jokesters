/**
 * Optimized AudioEngine
 * 
 * Features:
 * 1. Phoneme pre-cache for common sounds
 * 2. Viseme prediction lookahead (predict next 3 phonemes while speaking current)
 * 3. Web Worker for audio synthesis (off main thread)
 * 
 * Target latency: <50ms text-to-audio-buffer
 */

import type { 
    WorkerRequest, 
    WorkerResponse, 
    WorkerSynthesizeMessage,
    WorkerSynthesisSuccess 
} from './worker/tts.worker';
import { VisemePredictor, type Viseme } from './VisemePredictor';
import { TTSLatencyProfiler, ttsProfiler } from './TTSLatencyProfiler';

export interface SynthesisOptions {
    speed?: number;  // Speech rate multiplier (default: 1.3)
    steps?: number;  // Diffusion steps for quality (default: 10)
    seed?: number;   // Optional deterministic seed
}

export interface SynthesisResult {
    audioData: Float32Array;
    sampleRate: number;
    duration: number;
    visemes: Viseme[];
    latencyMs: number;
}

export type SynthesisCallback = (result: SynthesisResult) => void;
export type VisemeCallback = (current: Viseme, lookahead: Viseme[]) => void;
export type ErrorCallback = (error: Error) => void;

export class OptimizedAudioEngine {
    private worker: Worker | null = null;
    private isReady = false;

    private pendingRequests = new Map<string, {
        resolve: (result: SynthesisResult) => void;
        reject: (error: Error) => void;
        startTime: number;
    }>();

    // Voice styles cache (loaded on main thread, passed to worker)
    private styles = new Map<string, {
        ttlData: Float32Array;
        ttlDims: number[];
        dpData: Float32Array;
        dpDims: number[];
    }>();

    // Voice mapping
    private voiceMap: Record<string, string> = {
        'comedian': 'F1',
        'philosopher': 'M2',
        'scientist': 'M1',
        'default': 'F1'
    };

    // Viseme predictor
    private visemePredictor = new VisemePredictor();

    // Latency profiler
    private profiler: TTSLatencyProfiler = ttsProfiler;

    // Callbacks
    private onVisemeCallbacks: VisemeCallback[] = [];
    private onErrorCallbacks: ErrorCallback[] = [];

    // Sample rate
    public sampleRate = 24000;

    constructor() {}

    /**
     * Initialize the audio engine and worker
     */
    public async init(modelPath: string = './tts/onnx'): Promise<void> {
        if (this.isReady) return;

        try {
            console.log('[OptimizedAudioEngine] Initializing...');
            const initStart = performance.now();

            // Create worker
            const workerUrl = new URL('./worker/tts.worker.ts', import.meta.url);
            this.worker = new Worker(workerUrl, { type: 'module' });

            // Set up message handler
            this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                this.handleWorkerMessage(e.data);
            };

            // Initialize worker
            await this.sendToWorker({ type: 'init', modelPath });

            // Pre-load voice styles
            await this.loadVoiceStyles();

            this.isReady = true;
            console.log(`[OptimizedAudioEngine] Initialized in ${(performance.now() - initStart).toFixed(1)}ms`);

        } catch (e) {
            console.error('[OptimizedAudioEngine] Init failed:', e);
            throw e;
        }
    }

    /**
     * Synthesize speech with optimizations
     */
    public async synthesize(
        text: string,
        speakerId: string = 'comedian',
        options: SynthesisOptions = {}
    ): Promise<SynthesisResult> {
        if (!this.isReady) {
            throw new Error('AudioEngine not ready');
        }

        const startTime = performance.now();

        // Resolve voice
        const validVoices = ['M1', 'M2', 'F1', 'F2'];
        let realVoiceId = this.voiceMap[speakerId] || speakerId;
        if (!validVoices.includes(realVoiceId)) {
            realVoiceId = this.voiceMap['default'];
        }

        // Get style data
        const style = await this.getStyle(realVoiceId);
        if (!style) {
            throw new Error(`Voice style not found: ${realVoiceId}`);
        }

        // Pre-compute visemes with lookahead
        const estimatedDuration = this.estimateDuration(text, options.speed);
        // Pre-compute visemes with lookahead
        this.visemePredictor.predictVisemes(text, estimatedDuration);

        // Send to worker for synthesis
        const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const message: WorkerSynthesizeMessage = {
            type: 'synthesize',
            text,
            styleData: style,
            options: {
                speed: Math.max(0.5, Math.min(options.speed ?? 1.3, 2.0)),
                steps: Math.max(1, Math.min(options.steps ?? 10, 50)),
                seed: options.seed
            },
            requestId
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject, startTime });
            this.worker?.postMessage(message);
        });
    }

    /**
     * Synthesize with streaming callbacks for viseme updates
     */
    public async synthesizeWithCallbacks(
        text: string,
        speakerId: string = 'comedian',
        options: SynthesisOptions = {},
        callbacks: {
            onViseme?: VisemeCallback;
            onComplete?: SynthesisCallback;
            onError?: ErrorCallback;
        } = {}
    ): Promise<void> {
        if (callbacks.onViseme) {
            this.onVisemeCallbacks.push(callbacks.onViseme);
        }
        if (callbacks.onError) {
            this.onErrorCallbacks.push(callbacks.onError);
        }

        try {
            const result = await this.synthesize(text, speakerId, options);
            
            if (callbacks.onComplete) {
                callbacks.onComplete(result);
            }

            // Start viseme playback with lookahead
            this.startVisemePlayback(result.visemes);

        } catch (error) {
            if (callbacks.onError) {
                callbacks.onError(error as Error);
            }
            throw error;
        } finally {
            // Clean up callbacks
            if (callbacks.onViseme) {
                const idx = this.onVisemeCallbacks.indexOf(callbacks.onViseme);
                if (idx > -1) this.onVisemeCallbacks.splice(idx, 1);
            }
        }
    }

    /**
     * Get engine statistics
     */
    public async getStats(): Promise<{
        cacheSize: number;
        cacheHitRate: number;
        avgLatencyMs: number;
    }> {
        if (!this.worker) {
            return { cacheSize: 0, cacheHitRate: 0, avgLatencyMs: 0 };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ cacheSize: 0, cacheHitRate: 0, avgLatencyMs: 0 });
            }, 1000);

            const handler = (e: MessageEvent<WorkerResponse>) => {
                if (e.data.type === 'stats') {
                    clearTimeout(timeout);
                    this.worker?.removeEventListener('message', handler);
                    resolve({
                        cacheSize: e.data.cacheStats.size,
                        cacheHitRate: e.data.cacheStats.hitRate,
                        avgLatencyMs: e.data.avgLatencyMs
                    });
                }
            };

            this.worker?.addEventListener('message', handler);
            this.worker?.postMessage({ type: 'getStats' } as WorkerRequest);
        });
    }

    /**
     * Get latency profiler stats
     */
    public getLatencyStats() {
        return this.profiler.getStats();
    }

    /**
     * Enable/disable profiling
     */
    public setProfiling(enabled: boolean): void {
        if (enabled) {
            this.profiler.enable();
        } else {
            this.profiler.disable();
        }
    }

    /**
     * Terminate the engine
     */
    public terminate(): void {
        this.worker?.terminate();
        this.worker = null;
        this.isReady = false;
        this.pendingRequests.clear();
        this.styles.clear();
    }

    // --- Private Methods ---

    private async sendToWorker(msg: WorkerRequest): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Worker timeout'));
            }, 30000);

            const handler = (e: MessageEvent<WorkerResponse>) => {
                if (e.data.type === 'init-success') {
                    clearTimeout(timeout);
                    this.worker?.removeEventListener('message', handler);
                    resolve();
                } else if (e.data.type === 'init-error') {
                    clearTimeout(timeout);
                    this.worker?.removeEventListener('message', handler);
                    reject(new Error(e.data.error));
                }
            };

            this.worker?.addEventListener('message', handler);
            this.worker?.postMessage(msg);
        });
    }

    private handleWorkerMessage(msg: WorkerResponse): void {
        switch (msg.type) {
            case 'synthesis-success':
                this.handleSynthesisSuccess(msg);
                break;
            case 'synthesis-error':
                this.handleSynthesisError(msg);
                break;
        }
    }

    private handleSynthesisSuccess(msg: WorkerSynthesisSuccess): void {
        const request = this.pendingRequests.get(msg.requestId);
        if (!request) return;

        this.pendingRequests.delete(msg.requestId);

        const result: SynthesisResult = {
            audioData: msg.audioData,
            sampleRate: msg.sampleRate,
            duration: msg.duration,
            visemes: msg.visemes.map(v => ({
                ...v,
                mouthShape: v.mouthShape as any
            })),
            latencyMs: msg.latency.totalMs
        };

        // Log performance
        const mainThreadOverhead = performance.now() - request.startTime - msg.latency.totalMs;
        console.log(`[OptimizedAudioEngine] Synthesis complete:`, {
            workerLatency: `${msg.latency.totalMs.toFixed(1)}ms`,
            mainThreadOverhead: `${mainThreadOverhead.toFixed(1)}ms`,
            totalLatency: `${(performance.now() - request.startTime).toFixed(1)}ms`,
            cacheHit: msg.latency.cacheLookupMs < 1 // Approximate
        });

        request.resolve(result);
    }

    private handleSynthesisError(msg: { error: string; requestId: string }): void {
        const request = this.pendingRequests.get(msg.requestId);
        if (!request) return;

        this.pendingRequests.delete(msg.requestId);
        
        const error = new Error(msg.error);
        
        // Notify error callbacks
        for (const cb of this.onErrorCallbacks) {
            try { cb(error); } catch (e) {}
        }
        
        request.reject(error);
    }

    private async loadVoiceStyles(): Promise<void> {
        const voicesToLoad = ['M1', 'M2', 'F1', 'F2'];

        for (const voice of voicesToLoad) {
            try {
                const stylePath = `./tts/voice_styles/${voice}.json`;
                const resp = await fetch(stylePath);
                if (!resp.ok) continue;

                const json = await resp.json();
                
                this.styles.set(voice, {
                    ttlData: new Float32Array(json.style_ttl.data.flat(Infinity)),
                    ttlDims: json.style_ttl.dims,
                    dpData: new Float32Array(json.style_dp.data.flat(Infinity)),
                    dpDims: json.style_dp.dims
                });

                console.log(`[OptimizedAudioEngine] Loaded voice style: ${voice}`);
            } catch (err) {
                console.warn(`[OptimizedAudioEngine] Failed to load voice ${voice}:`, err);
            }
        }
    }

    private async getStyle(voiceId: string) {
        // Check cache first
        if (this.styles.has(voiceId)) {
            return this.styles.get(voiceId)!;
        }

        // Load from file
        try {
            const stylePath = `./tts/voice_styles/${voiceId}.json`;
            const resp = await fetch(stylePath);
            const json = await resp.json();
            
            const style = {
                ttlData: new Float32Array(json.style_ttl.data.flat(Infinity)),
                ttlDims: json.style_ttl.dims,
                dpData: new Float32Array(json.style_dp.data.flat(Infinity)),
                dpDims: json.style_dp.dims
            };

            this.styles.set(voiceId, style);
            return style;
        } catch (e) {
            console.warn(`[OptimizedAudioEngine] Failed to load style ${voiceId}:`, e);
            return null;
        }
    }

    private estimateDuration(text: string, speed: number = 1.0): number {
        // Rough estimate: ~0.1s per character at 1.0 speed
        const estimatedSeconds = (text.length * 0.1) / (speed || 1.0);
        return Math.max(0.5, Math.min(estimatedSeconds, 30)); // Clamp between 0.5-30s
    }

    private startVisemePlayback(visemes: Viseme[]): void {
        if (visemes.length === 0) return;

        let currentIndex = 0;

        const advanceViseme = () => {
            if (currentIndex >= visemes.length) return;

            const current = visemes[currentIndex];
            const lookahead = visemes.slice(currentIndex + 1, currentIndex + 4);

            // Notify callbacks
            for (const cb of this.onVisemeCallbacks) {
                try {
                    cb(current, lookahead);
                } catch (e) {
                    console.warn('[OptimizedAudioEngine] Viseme callback error:', e);
                }
            }

            currentIndex++;

            // Schedule next viseme
            if (currentIndex < visemes.length) {
                const nextViseme = visemes[currentIndex];
                const delayMs = (nextViseme.startTime - current.startTime) * 1000;
                setTimeout(advanceViseme, delayMs);
            }
        };

        // Start playback
        advanceViseme();
    }
}

// Singleton instance
export const optimizedAudioEngine = new OptimizedAudioEngine();
