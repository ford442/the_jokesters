
import type { SynthesisOptions, SynthesizedAudio, TtsEngine } from './AudioEngine';
import { VisemePredictor, type Viseme } from './VisemePredictor';
import { SUPERTONIC_NATIVE_SAMPLE_RATE } from './ttsNativeSampleRate';

/** Who is speaking what, so playback can drive the stage (visemes), captions and music ducking. */
export interface UtteranceMeta {
    agentId: string;
    text: string;
    /** Phoneme timing from the TTS worker, when the engine has it. */
    visemes?: Viseme[];
}

export interface UtteranceEvent {
    agentId: string;
    text: string;
    /** AudioContext.currentTime at which this utterance's first sample plays. */
    audioStartTime: number;
    durationSec: number;
    /** null → no usable timing; consumers fall back to loudness. */
    visemes: Viseme[] | null;
    /** Where `visemes` came from. */
    timing: 'tts' | 'estimated' | 'none';
}

interface QueuedPcm {
    pcm: Float32Array;
    sampleRate: number;
    meta?: UtteranceMeta;
}

/** Only `predictVisemes` is used (pure per call); one shared instance is fine. */
const textVisemePredictor = new VisemePredictor();

function cacheKey(text: string, agentId: string, options: SynthesisOptions): string {
    const steps = options.steps ?? 10;
    const seed = options.seed ?? 'r';
    const speed = options.speed ?? 1.3;
    return `${agentId}|${steps}|${seed}|${speed}|${text}`;
}

export class SpeechQueue {
    private queue: QueuedPcm[] = [];
    private isPlaying = false;
    private audioContext: AudioContext;
    private currentSource: AudioBufferSourceNode | null = null;
    /** Gain inserted between TTS sources and the external destination (for SFX ducking). */
    private ttsGain: GainNode;
    private destinationNode: AudioNode;
    private audioEngine: TtsEngine;
    /** Keyed TTS cache so prerendered sentences are reused (no double synth). */
    private audioCache = new Map<string, Promise<SynthesizedAudio>>();
    /** Epoch bumped on clearPrerendered — stale promises are not re-cached. */
    private cacheEpoch = 0;
    /** One-shot diagnostic for TTS buffer tagging (issue #332). */
    private loggedBufferRate = false;
    private utteranceStartListeners = new Set<(e: UtteranceEvent) => void>();
    private utteranceEndListeners = new Set<(e: UtteranceEvent) => void>();

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

    /** Fires when an utterance's audio actually starts playing. Returns an unsubscribe fn. */
    public onUtteranceStart(listener: (e: UtteranceEvent) => void): () => void {
        this.utteranceStartListeners.add(listener);
        return () => this.utteranceStartListeners.delete(listener);
    }

    /** Fires when an utterance finishes (or is cut off by stop()). */
    public onUtteranceEnd(listener: (e: UtteranceEvent) => void): () => void {
        this.utteranceEndListeners.add(listener);
        return () => this.utteranceEndListeners.delete(listener);
    }

    public add(audioData: Float32Array, optionalSampleRate?: number, meta?: UtteranceMeta) {
        // Capture the engine rate at enqueue — playNext is async (AudioContext resume)
        // and must not re-read a later synth's rate or the 24 kHz placeholder.
        const sampleRate = optionalSampleRate || this.audioEngine.sampleRate || SUPERTONIC_NATIVE_SAMPLE_RATE;
        this.queue.push({ pcm: audioData, sampleRate, meta });
        void this.playNext();
    }

    private async playNext() {
        if (this.isPlaying || this.queue.length === 0) return;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isPlaying = true;
        const { pcm: audioData, sampleRate, meta } = this.queue.shift()!;

        // Stamp the rate captured at enqueue (tts.json / worker), never audioContext.sampleRate
        // and never a hardcoded 24000. Hosted Supertonic is 44100.
        if (!this.loggedBufferRate) {
            this.loggedBufferRate = true;
            console.log('[TTS buffer]', {
                samples: audioData.length,
                taggedHz: sampleRate,
                ctxHz: this.audioContext.sampleRate,
                secondsIfTagged: +(audioData.length / sampleRate).toFixed(2),
            });
        }
        const buffer = this.audioContext.createBuffer(1, audioData.length, sampleRate);
        buffer.copyToChannel(audioData as any, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ttsGain);

        const event = meta ? this.buildUtteranceEvent(meta, audioData.length / sampleRate) : null;

        source.onended = () => {
            if (event) this.emitUtterance(this.utteranceEndListeners, event);
            this.activeEvent = null;
            this.isPlaying = false;
            void this.playNext();
        };

        this.currentSource = source;
        source.start();
        if (event) {
            this.activeEvent = event;
            this.emitUtterance(this.utteranceStartListeners, event);
        }
    }

    private activeEvent: UtteranceEvent | null = null;

    private buildUtteranceEvent(meta: UtteranceMeta, durationSec: number): UtteranceEvent {
        let visemes: Viseme[] | null = null;
        let timing: UtteranceEvent['timing'] = 'none';
        if (meta.visemes && meta.visemes.length > 0) {
            visemes = meta.visemes;
            timing = 'tts';
        } else if (meta.text.trim() && durationSec > 0) {
            // Legacy engine: no worker timing, so spread text-derived visemes over the exact audio length.
            const seq = textVisemePredictor.predictVisemes(meta.text, durationSec);
            if (seq.visemes.length > 0) {
                visemes = seq.visemes;
                timing = 'estimated';
            }
        }
        return {
            agentId: meta.agentId,
            text: meta.text,
            audioStartTime: this.audioContext.currentTime,
            durationSec,
            visemes,
            timing,
        };
    }

    private emitUtterance(listeners: Set<(e: UtteranceEvent) => void>, event: UtteranceEvent): void {
        for (const listener of listeners) {
            try {
                listener(event);
            } catch (err) {
                console.warn('[SpeechQueue] utterance listener threw:', err);
            }
        }
    }

    public stop() {
        if (this.activeEvent) {
            this.emitUtterance(this.utteranceEndListeners, this.activeEvent);
            this.activeEvent = null;
        }
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
    ): Promise<SynthesizedAudio> {
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
    ): Promise<SynthesizedAudio> {
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
