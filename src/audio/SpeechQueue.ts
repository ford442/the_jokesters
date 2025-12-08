
import { AudioEngine } from './AudioEngine';

export class SpeechQueue {
    private queue: Float32Array[] = [];
    private isPlaying = false;
    private audioContext: AudioContext;
    private currentSource: AudioBufferSourceNode | null = null;
    private destinationNode: AudioNode;

    constructor(_audioEngine: AudioEngine) {
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
}
