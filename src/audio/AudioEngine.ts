import { SupertonicPipeline, Style } from './SupertonicPipeline';

export interface SynthesisOptions {
    speed?: number;  // Speech rate multiplier (default: 1.3)
    steps?: number;  // Diffusion steps for quality (default: 10)
    seed?: number;   // Optional deterministic seed
}

export class AudioEngine {
    private pipeline: SupertonicPipeline;
    private styles: Map<string, Style> = new Map();
    private isReady = false;
    private defaultVoice = 'M1';

    // Define the mapping: Agent ID -> Filename (without .json)
    private voiceMap: Record<string, string> = {
        'comedian': 'F1',    // Female Voice for Comedian
        'philosopher': 'M2', // Deep/Slow Male Voice
        'scientist': 'M1',   // Standard Male Voice
        'default': 'F1'
    };

    constructor() {
        this.pipeline = new SupertonicPipeline();
    }

    public async init(modelPath: string = './tts/onnx'): Promise<void> {
        try {
            console.log(`AudioEngine: Initializing pipeline from ${modelPath}...`);

            await this.pipeline.init(modelPath);
            this.isReady = true;

            // Pre-load only the actual voice files (M1, M2, F1, F2)
            const voicesToLoad = ['M1', 'M2', 'F1', 'F2'];

            for (const voice of voicesToLoad) {
                try {
                    await this.getStyle(voice);
                    console.log(`AudioEngine: Loaded voice ${voice}`);
                } catch (err) {
                    console.warn(`AudioEngine: Failed to load voice ${voice}:`, err);
                }
            }

            console.log('AudioEngine: Ready');
        } catch (e) {
            console.error('AudioEngine Init Failed:', e);
            throw e;
        }
    }

    /**
     * Retrieves a loaded style or loads it from disk if missing.
     * ONLY accepts actual voice file IDs: M1, M2, F1, F2
     */
    private async getStyle(voiceId: string): Promise<Style> {
        // 1. Check Cache
        if (this.styles.has(voiceId)) {
            return this.styles.get(voiceId)!;
        }

        // 2. Load from file (only for M1, M2, F1, F2)
        const stylePath = `./tts/voice_styles/${voiceId}.json`;

        try {
            console.log(`AudioEngine: Loading voice style '${voiceId}'...`);
            const style = await this.pipeline.loadStyle(stylePath);
            this.styles.set(voiceId, style);
            return style;
        } catch (e) {
            console.warn(`AudioEngine: Failed to load voice '${voiceId}'. Falling back to default.`, e);

            // 3. Fallback to default if the requested voice fails
            if (voiceId !== this.defaultVoice) {
                return this.getStyle(this.defaultVoice);
            }
            throw new Error(`Critical: Could not load default voice ${this.defaultVoice}`);
        }
    }

    public async synthesize(
        text: string,
        speakerId: string = 'comedian',  // Agent ID
        options: SynthesisOptions = {}
    ): Promise<Float32Array> {
        if (!this.isReady) {
            throw new Error('AudioEngine not ready');
        }

        // 1. Map agent ID to actual voice file ID
        const validVoices = ['M1', 'M2', 'F1', 'F2'];
        let realVoiceId = this.voiceMap[speakerId] || speakerId;

        // Validate it's an actual voice file, not an unmapped agent ID
        if (!validVoices.includes(realVoiceId)) {
            console.warn(`AudioEngine: Invalid voice '${realVoiceId}' for agent '${speakerId}', using default`);
            realVoiceId = this.voiceMap['default'];
        }

        console.log(`AudioEngine: Synthesizing for '${speakerId}' using voice '${realVoiceId}'`);

        // 2. Resolve Options + safety clamping
        const safeSpeed = Math.max(0.5, Math.min(options.speed ?? 1.3, 2.0));
        const safeSteps = Math.max(1, Math.min(options.steps ?? 10, 50));
        const seed = options.seed;

        // 3. Get Voice Style (only valid voice IDs: M1, M2, F1, F2)
        const style = await this.getStyle(realVoiceId);

        // 4. Run Inference
        const { wav } = await this.pipeline.generate(
            text,
            style,
            safeSteps,
            safeSpeed,
            seed
        );

        return wav;
    }
}