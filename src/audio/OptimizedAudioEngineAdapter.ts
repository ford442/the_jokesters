import { OptimizedAudioEngine } from './OptimizedAudioEngine';
import type { SynthesisOptions, SynthesizedAudio, TtsEngine } from './AudioEngine';

/**
 * Adapts OptimizedAudioEngine's rich SynthesisResult (worker-based synthesis,
 * phoneme cache, viseme lookahead) to the plain `Promise<Float32Array>`
 * TtsEngine contract that SpeechQueue / PrerenderCoordinator already depend on,
 * so the optimized engine can back the existing prerender-aware playback
 * pipeline without touching its call sites.
 */
export class OptimizedAudioEngineAdapter implements TtsEngine {
    constructor(private readonly engine: OptimizedAudioEngine = new OptimizedAudioEngine()) {}

    /** Live rate from the wrapped engine (updated on each worker synthesis-success). */
    get sampleRate(): number {
        return this.engine.sampleRate;
    }

    public async init(modelPath?: string): Promise<void> {
        await this.engine.init(modelPath);
    }

    public async synthesize(
        text: string,
        speakerId: string = 'comedian',
        options: SynthesisOptions = {},
    ): Promise<SynthesizedAudio> {
        const result = await this.engine.synthesize(text, speakerId, options);
        // Engine.sampleRate is set at init from tts.json and refreshed on each
        // synthesis-success; SpeechQueue captures it at add(), not at play time.
        // Worker phoneme timing rides along so the stage can drive visemes from it.
        return { audioData: result.audioData, sampleRate: result.sampleRate, visemes: result.visemes };
    }

    /** Escape hatch for callers that want the richer engine (viseme lookahead, stats, etc). */
    public getEngine(): OptimizedAudioEngine {
        return this.engine;
    }
}
