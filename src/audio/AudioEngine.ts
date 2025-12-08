import { SupertonicPipeline, Style } from './SupertonicPipeline';

export interface SpeechOptions {
    speed?: number;  // Speech rate multiplier (default: 1.3)
    steps?: number;  // Diffusion steps for quality (default: 10)
}

export class AudioEngine {
    private pipeline: SupertonicPipeline;
    private styles: Map<string, Style> = new Map();
    private isReady = false;
    private defaultVoice = 'M1';

    // Define the mapping: Agent ID -> Filename (without .json)
    private voiceMap: Record<string, string> = {
        'comedian': 'F2',    // Female voice 2
        'philosopher': 'M2', // Male voice 2
        'scientist': 'F1',   // Female voice 1
        'default': 'M1'      // Default male voice
    };

    constructor() {
        this.pipeline = new SupertonicPipeline();
    }

    public async init(modelPath: string = './assets/onnx'): Promise<void> {
        try {
            console.log(`AudioEngine: Initializing pipeline from ${modelPath}...`);

            await this.pipeline.init(modelPath);
            this.isReady = true;

            // Pre-load all voices we need
            const voicesToLoad = ['M1', 'M2', 'F1', 'F2']; // All available voice files

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
     * Assumes voices are in ./assets/voice_styles/{speakerId}.json
     */
    private async getStyle(voiceId: string): Promise<Style> {
        // 1. Check Cache
        if (this.styles.has(voiceId)) {
            return this.styles.get(voiceId)!;
        }

        // 2. Load from file
        const stylePath = `./assets/voice_styles/${voiceId}.json`;

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
        speakerId: string = 'F2',
        options: SpeechOptions = {}
    ): Promise<Float32Array> {
        if (!this.isReady) {
            throw new Error('AudioEngine not ready');
        }

        // 1. Look up the real voice filename from agent ID
        const realVoiceId = this.voiceMap[speakerId] || this.voiceMap['default'];
        console.log(`AudioEngine: Synthesizing for '${speakerId}' using voice '${realVoiceId}'`);

        // 2. Resolve Options
        const speed = options.speed ?? 1.30;
        const steps = options.steps ?? 10;

        // 3. Get Voice Style (Cached or New)
        const style = await this.getStyle(realVoiceId);

        // 4. Run Inference
        const { wav } = await this.pipeline.generate(
            text,
            style,
            steps,
            speed
        );

        return wav;
    }
}