/**
 * Optimized Speech Queue
 * Integrates with OptimizedAudioEngine for low-latency playback
 * Supports viseme lookahead for smooth lip-sync
 */

import { OptimizedAudioEngine } from './OptimizedAudioEngine';
import { type Viseme } from './VisemePredictor';

export interface QueuedUtterance {
    text: string;
    speakerId: string;
    priority: number;
    visemes?: Viseme[];
}

export interface SpeechQueueOptions {
    preloadNext: boolean;  // Pre-synthesize next utterance while playing current
    visemeSmoothing: number;  // Blend factor for viseme transitions (0-1)
}

export class OptimizedSpeechQueue {
    private engine: OptimizedAudioEngine;
    private queue: QueuedUtterance[] = [];
    private isPlaying = false;
    private audioContext: AudioContext;
    private currentSource: AudioBufferSourceNode | null = null;
    private destinationNode: AudioNode;
    
    // Preloading
    private preloadedAudio: Map<string, { audioData: Float32Array, sampleRate: number }> = new Map();
    private isPreloading = false;
    
    // Viseme callbacks
    private onVisemeCallbacks: Array<(current: Viseme, lookahead: Viseme[]) => void> = [];
    private onCompleteCallbacks: Array<() => void> = [];
    
    // Options
    private options: SpeechQueueOptions;

    constructor(engine: OptimizedAudioEngine, options: Partial<SpeechQueueOptions> = {}) {
        this.engine = engine;
        this.options = {
            preloadNext: options.preloadNext ?? true,
            visemeSmoothing: options.visemeSmoothing ?? 0.3
        };
        
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.destinationNode = this.audioContext.destination;
    }

    public getAudioContext(): AudioContext {
        return this.audioContext;
    }

    public setDestination(node: AudioNode) {
        this.destinationNode = node;
    }

    /**
     * Add utterance to queue with optional preloading
     */
    public async enqueue(text: string, speakerId: string, priority: number = 0): Promise<void> {
        const utterance: QueuedUtterance = { text, speakerId, priority };
        
        // Insert by priority
        const insertIndex = this.queue.findIndex(u => u.priority < priority);
        if (insertIndex === -1) {
            this.queue.push(utterance);
        } else {
            this.queue.splice(insertIndex, 0, utterance);
        }

        // If not playing, start
        if (!this.isPlaying) {
            this.playNext();
        } else if (this.options.preloadNext && this.queue.length === 1) {
            // Preload the next utterance
            this.preload(utterance);
        }
    }

    /**
     * Add callback for viseme updates
     */
    public onViseme(callback: (current: Viseme, lookahead: Viseme[]) => void): () => void {
        this.onVisemeCallbacks.push(callback);
        return () => {
            const idx = this.onVisemeCallbacks.indexOf(callback);
            if (idx > -1) this.onVisemeCallbacks.splice(idx, 1);
        };
    }

    /**
     * Add callback for queue completion
     */
    public onComplete(callback: () => void): () => void {
        this.onCompleteCallbacks.push(callback);
        return () => {
            const idx = this.onCompleteCallbacks.indexOf(callback);
            if (idx > -1) this.onCompleteCallbacks.splice(idx, 1);
        };
    }

    /**
     * Stop playback and clear queue
     */
    public stop(): void {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {}
            this.currentSource = null;
        }
        this.queue = [];
        this.preloadedAudio.clear();
        this.isPlaying = false;
        this.isPreloading = false;
    }

    /**
     * Get queue length
     */
    public getQueueLength(): number {
        return this.queue.length;
    }

    /**
     * Check if currently playing
     */
    public isCurrentlyPlaying(): boolean {
        return this.isPlaying;
    }

    /**
     * Wait for queue to complete
     */
    public async waitUntilFinished(): Promise<void> {
        if (!this.isPlaying && this.queue.length === 0) return;

        return new Promise((resolve) => {
            const check = () => {
                if (!this.isPlaying && this.queue.length === 0) {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    }

    // --- Private Methods ---

    private async playNext(): Promise<void> {
        if (this.isPlaying || this.queue.length === 0) {
            if (this.queue.length === 0 && !this.isPlaying) {
                // Queue finished
                for (const cb of this.onCompleteCallbacks) {
                    try { cb(); } catch (e) {}
                }
            }
            return;
        }

        // Resume context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isPlaying = true;
        const utterance = this.queue.shift()!;

        // Check if preloaded
        const cacheKey = `${utterance.speakerId}:${utterance.text}`;
        const preloaded = this.preloadedAudio.get(cacheKey);
        let audioData = preloaded?.audioData;
        let sampleRate = preloaded?.sampleRate;
        let visemes: Viseme[] | undefined;

        if (!audioData) {
            // Synthesize now
            try {
                const startTime = performance.now();
                const result = await this.engine.synthesize(
                    utterance.text,
                    utterance.speakerId,
                    { steps: 10 }
                );
                audioData = result.audioData;
                sampleRate = result.sampleRate;
                visemes = result.visemes;
                
                console.log(`[SpeechQueue] Synthesized "${utterance.text.substring(0, 30)}" in ${(performance.now() - startTime).toFixed(1)}ms`);
            } catch (e) {
                console.error('[SpeechQueue] Synthesis failed:', e);
                this.isPlaying = false;
                this.playNext();
                return;
            }
        } else {
            this.preloadedAudio.delete(cacheKey);
        }

        // Start preloading next if enabled
        if (this.options.preloadNext && this.queue.length > 0 && !this.isPreloading) {
            this.preload(this.queue[0]);
        }

        // Play audio
        await this.playAudio(audioData, sampleRate ?? this.engine.sampleRate, visemes);
    }

    private async playAudio(audioData: Float32Array, sampleRate: number, visemes?: Viseme[]): Promise<void> {
        const buffer = this.audioContext.createBuffer(1, audioData.length, sampleRate);
        buffer.getChannelData(0).set(audioData);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.destinationNode);

        // Start viseme playback if available
        if (visemes && visemes.length > 0) {
            this.startVisemePlayback(visemes);
        }

        source.onended = () => {
            this.isPlaying = false;
            this.currentSource = null;
            this.playNext();
        };

        this.currentSource = source;
        source.start();
    }

    private async preload(utterance: QueuedUtterance): Promise<void> {
        if (this.isPreloading) return;
        
        this.isPreloading = true;
        const cacheKey = `${utterance.speakerId}:${utterance.text}`;

        try {
            const result = await this.engine.synthesize(
                utterance.text,
                utterance.speakerId,
                { steps: 10 }
            );
            
            this.preloadedAudio.set(cacheKey, { audioData: result.audioData, sampleRate: result.sampleRate });
            utterance.visemes = result.visemes;
            
            console.log(`[SpeechQueue] Preloaded "${utterance.text.substring(0, 30)}"`);
        } catch (e) {
            console.warn('[SpeechQueue] Preload failed:', e);
        } finally {
            this.isPreloading = false;
        }
    }

    private startVisemePlayback(visemes: Viseme[]): void {
        if (visemes.length === 0) return;

        const startTime = performance.now();
        let currentIndex = 0;
        let lastViseme: Viseme | null = null;

        const scheduleNextViseme = () => {
            if (currentIndex >= visemes.length) return;

            const current = visemes[currentIndex];
            const lookahead = visemes.slice(currentIndex + 1, currentIndex + 4);

            // Calculate when this viseme should trigger
            const elapsed = (performance.now() - startTime) / 1000;
            const targetTime = current.startTime;
            const delayMs = Math.max(0, (targetTime - elapsed) * 1000);

            setTimeout(() => {
                // Apply smoothing if we have a previous viseme
                if (lastViseme && this.options.visemeSmoothing > 0) {
                    this.notifyVisemeWithBlend(lastViseme, current, this.options.visemeSmoothing);
                } else {
                    this.notifyViseme(current, lookahead);
                }
                
                lastViseme = current;
                currentIndex++;
                scheduleNextViseme();
            }, delayMs);
        };

        scheduleNextViseme();
    }

    private notifyViseme(current: Viseme, lookahead: Viseme[]): void {
        for (const cb of this.onVisemeCallbacks) {
            try {
                cb(current, lookahead);
            } catch (e) {
                console.warn('[SpeechQueue] Viseme callback error:', e);
            }
        }
    }

    private notifyVisemeWithBlend(from: Viseme, to: Viseme, blendFactor: number): void {
        // Create interpolated viseme
        const blended: Viseme = {
            phoneme: to.phoneme,
            startTime: to.startTime,
            duration: to.duration,
            intensity: from.intensity * (1 - blendFactor) + to.intensity * blendFactor,
            mouthShape: to.mouthShape
        };

        this.notifyViseme(blended, []);
    }
}
