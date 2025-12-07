
import { AudioEngine } from './AudioEngine';

export class SpeechQueue {
    private queue: Float32Array[] = [];
    private isPlaying = false;
    private audioContext: AudioContext;
    private currentSource: AudioBufferSourceNode | null = null;
    private analyser: AnalyserNode;

    // Event callbacks
    public onMouthMove?: (amplitude: number) => void;

    constructor(_audioEngine: AudioEngine) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.audioContext.destination);

        // Start animation loop for mouth movement
        this.monitorAmplitude();
    }

    private monitorAmplitude() {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const update = () => {
            if (this.isPlaying && this.onMouthMove) {
                this.analyser.getByteFrequencyData(dataArray);

                // Calculate average amplitude
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;

                // Normalize 0-255 to 0-1
                this.onMouthMove(average / 255);
            } else if (this.onMouthMove) {
                this.onMouthMove(0);
            }

            requestAnimationFrame(update);
        };
        update();
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

        const buffer = this.audioContext.createBuffer(1, audioData.length, 24000); // Supertonic often 24khz
        buffer.copyToChannel(audioData as any, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.analyser); // Connect to analyser instead of destination directly

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
}
