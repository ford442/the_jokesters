import { OptimizedAudioEngine } from './OptimizedAudioEngine';
import type { SynthesisOptions, TtsEngine } from './AudioEngine';

/**
 * Adapts OptimizedAudioEngine's rich SynthesisResult (worker-based synthesis,
 * phoneme cache, viseme lookahead) to the plain `Promise<Float32Array>`
 * TtsEngine contract that SpeechQueue / PrerenderCoordinator already depend on,
 * so the optimized engine can back the existing prerender-aware playback
 * pipeline without touching its call sites.
 */
export class OptimizedAudioEngineAdapter implements TtsEngine {
    readonly sampleRate: number;

    constructor(private readonly engine: OptimizedAudioEngine = new OptimizedAudioEngine()) {
        this.sampleRate = engine.sampleRate;
    }

    public async init(modelPath?: string): Promise<void> {
        await this.engine.init(modelPath);
    }

    public async synthesize(
        text: string,
        speakerId: string = 'comedian',
        options: SynthesisOptions = {},
    ): Promise<Float32Array> {
        const result = await this.engine.synthesize(text, speakerId, options);
        return result.audioData;
    }

    /** Escape hatch for callers that want the richer engine (viseme lookahead, stats, etc). */
    public getEngine(): OptimizedAudioEngine {
        return this.engine;
    }
}
