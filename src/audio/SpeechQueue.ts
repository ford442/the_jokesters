
import type { SynthesisOptions, TtsEngine } from './AudioEngine';

function cacheKey(text: string, agentId: string, options: SynthesisOptions): string {
    const steps = options.steps ?? 10;
    const seed = options.seed ?? 'r';
    const speed = options.speed ?? 1.3;
    return `${agentId}|${steps}|${seed}|${speed}|${text}`;
}

export class SpeechQueue {
    private queue: Float32Array[] = [];
    private isPlaying = false;
    private audioContext: AudioContext;
    private currentSource: AudioBufferSourceNode | null = null;
    /** Gain inserted between TTS sources and the external destination (for SFX ducking). */
    private ttsGain: GainNode;
    private destinationNode: AudioNode;
    private audioEngine: TtsEngine;
    /** Keyed TTS cache so prerendered sentences are reused (no double synth). */
    private audioCache = new Map<string, Promise<Float32Array>>();
    /** Epoch bumped on clearPrerendered — stale promises are not re-cached. */
    private cacheEpoch = 0;

    constructor(audioEngine: TtsEngine) {
        this.audioEngine = audioEngine;
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.ttsGain = this.audioContext.createGain();
        this.ttsGain.gain.value = 1;
        this.destinationNode = this.audioContext.destination;
        this.ttsGain.connect(this.destinationNode);
    }

    public getAudioContext(): AudioContext {
        return this.audioContext;
    }

    public getTtsGainNode(): GainNode {
        return this.ttsGain;
    }

    public setDestination(node: AudioNode) {
        try {
            this.ttsGain.disconnect();
        } catch { /* not connected */ }
        this.destinationNode = node;
        this.ttsGain.connect(this.destinationNode);
    }

    public add(audioData: Float32Array) {
        this.queue.push(audioData);
        this.playNext();
    }

    private async playNext() {
        if (this.isPlaying || this.queue.length === 0) return;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isPlaying = true;
        const audioData = this.queue.shift()!;

        // Legacy AudioEngine doesn't expose sampleRate — keep its historical (44.1kHz) buffer
        // rate unchanged; engines that report a real rate (e.g. OptimizedAudioEngineAdapter) use it.
        const sampleRate = this.audioEngine.sampleRate ?? 44100;
        const buffer = this.audioContext.createBuffer(1, audioData.length, sampleRate);
        buffer.copyToChannel(audioData as any, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ttsGain);

        source.onended = () => {
            this.isPlaying = false;
            this.playNext();
        };

        this.currentSource = source;
        source.start();
    }

    public stop() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch { /* already stopped */ }
            this.currentSource = null;
        }
        this.queue = [];
        this.isPlaying = false;
    }

    public async waitUntilFinished(): Promise<void> {
        if (!this.isPlaying && this.queue.length === 0) return;

        return new Promise<void>((resolve) => {
            const check = () => {
                if (!this.isPlaying && this.queue.length === 0) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    /**
     * Start synthesizing one sentence into the cache (does not play).
     */
    public prerenderOne(
        text: string,
        agentId: string,
        options: SynthesisOptions = {},
    ): Promise<Float32Array> {
        const key = cacheKey(text, agentId, options);
        const existing = this.audioCache.get(key);
        if (existing) return existing;

        const epoch = this.cacheEpoch;
        const promise = this.audioEngine
            .synthesize(text, agentId, options)
            .then((data) => {
                if (epoch !== this.cacheEpoch) {
                    // Stale — still return data to caller of this promise, but don't keep
                }
                return data;
            })
            .catch((e) => {
                this.audioCache.delete(key);
                throw e;
            });

        this.audioCache.set(key, promise);
        return promise;
    }

    /**
     * Prerender multiple sentences into the keyed cache (background).
     */
    public prerenderSentences(texts: string[], agentId: string, options: SynthesisOptions = {}) {
        console.log(`[SpeechQueue] Prerendering ${texts.length} sentences for ${agentId}`);
        for (const text of texts) {
            if (!text.trim()) continue;
            void this.prerenderOne(text, agentId, options);
        }
    }

    /**
     * Take cached audio or synthesize live. Primary path for playback.
     */
    public async synthesizeOrTakeCached(
        text: string,
        agentId: string,
        options: SynthesisOptions = {},
    ): Promise<Float32Array> {
        return this.prerenderOne(text, agentId, options);
    }

    /**
     * @deprecated Prefer synthesizeOrTakeCached — kept for call sites that push queue FIFO.
     */
    public async addPrerendered() {
        // No-op FIFO path removed; keyed cache is used instead.
        console.warn('[SpeechQueue] addPrerendered is deprecated; use synthesizeOrTakeCached');
    }

    /**
     * Invalidate all prerendered / cached TTS (interrupt, mode change, OOM).
     */
    public clearPrerendered() {
        this.cacheEpoch++;
        this.audioCache.clear();
    }

    public getPrerenderCount(): number {
        return this.audioCache.size;
    }
}
