
import { AudioEngine } from './AudioEngine';
import type { SynthesisOptions } from './AudioEngine';

export class SpeechQueue {
    private queue: Float32Array[] = [];
    private isPlaying = false;
    private audioContext: AudioContext;
    private currentSource: AudioBufferSourceNode | null = null;
    private destinationNode: AudioNode;
    private audioEngine: AudioEngine;
    private prerenderQueue: Promise<Float32Array>[] = [];

    constructor(audioEngine: AudioEngine) {
        this.audioEngine = audioEngine;
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.destinationNode = this.audioContext.destination;
    }

    public getAudioContext(): AudioContext {
        return this.audioContext;
    }

    public setDestination(node: AudioNode) {
        this.destinationNode = node;
    }

    public add(audioData: Float32Array) {
        this.queue.push(audioData);
        this.playNext();
    }

    private async playNext() {
        if (this.isPlaying || this.queue.length === 0) return;

        // Resume context if suspended (browser policy)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isPlaying = true;
        const audioData = this.queue.shift()!;

        const buffer = this.audioContext.createBuffer(1, audioData.length, 44100); // Supertonic often 24khz
        buffer.copyToChannel(audioData as any, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.destinationNode);

        source.onended = () => {
            this.isPlaying = false;
            this.playNext();
        };

        this.currentSource = source;
        source.start();
    }

    public stop() {
        if (this.currentSource) {
            this.currentSource.stop();
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
     * Prerender audio for upcoming sentences to avoid gaps during performance.
     * This starts synthesis in the background before the audio is needed.
     * @param texts Array of text strings to prerender
     * @param agentId Agent ID for voice selection
     * @param options Synthesis options (steps, seed, speed)
     */
    public prerenderSentences(texts: string[], agentId: string, options: SynthesisOptions = {}) {
        console.log(`[SpeechQueue] Prerendering ${texts.length} sentences for ${agentId}`);
        
        // Start synthesis for each text asynchronously
        for (const text of texts) {
            const promise = this.audioEngine.synthesize(text, agentId, options);
            this.prerenderQueue.push(promise);
        }
    }

    /**
     * Add prerendered audio to the playback queue.
     * This should be called when you want to actually play the prerendered audio.
     */
    public async addPrerendered() {
        if (this.prerenderQueue.length === 0) return;

        try {
            // Wait for the next prerendered audio and add it to queue
            const audioData = await this.prerenderQueue.shift()!;
            this.queue.push(audioData);
            this.playNext();
        } catch (e) {
            console.error('[SpeechQueue] Failed to add prerendered audio:', e);
        }
    }

    /**
     * Clear all prerendered audio promises
     */
    public clearPrerendered() {
        this.prerenderQueue = [];
    }

    /**
     * Get count of prerendered items waiting
     */
    public getPrerenderCount(): number {
        return this.prerenderQueue.length;
    }
}
