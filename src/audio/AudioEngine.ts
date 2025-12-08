import { SupertonicPipeline, Style } from './SupertonicPipeline';

export interface SpeechOptions {
    speed?: number;  // Speech rate multiplier (default: 1.0)
    steps?: number;  // Diffusion steps for quality (default: 10)
}

export class AudioEngine {
    private pipeline: SupertonicPipeline;
    private styles: Map<string, Style> = new Map();
    private isReady = false;
    private defaultVoice = 'M1';

    constructor() {
        this.pipeline = new SupertonicPipeline();
    }

    public async init(modelPath: string = './assets/onnx'): Promise<void> {
        try {
            console.log(`AudioEngine: Initializing pipeline from ${modelPath}...`);

            await this.pipeline.init(modelPath);
            this.isReady = true;

            // Pre-load the default voice so the first speech is fast
            await this.getStyle(this.defaultVoice);

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
    private async getStyle(speakerId: string): Promise<Style> {
        // 1. Check Cache
        if (this.styles.has(speakerId)) {
            return this.styles.get(speakerId)!;
        }

        // 2. Load from file
        // We assume your voice files are named exactly like the speakerId (e.g., "M1", "F1")
        const stylePath = `./assets/voice_styles/${speakerId}.json`;

        try {
            console.log(`AudioEngine: Loading voice style '${speakerId}'...`);
            const style = await this.pipeline.loadStyle(stylePath);
            this.styles.set(speakerId, style);
            return style;
        } catch (e) {
            console.warn(`AudioEngine: Failed to load voice '${speakerId}'. Falling back to default.`, e);

            // 3. Fallback to default if the requested voice fails
            if (speakerId !== this.defaultVoice) {
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

        // 1. Resolve Options
        const speed = options.speed ?? 1.30;
        const steps = options.steps ?? 10;

        // 2. Get Voice Style (Cached or New)
        const style = await this.getStyle(speakerId);

        // 3. Run Inference
        const { wav } = await this.pipeline.generate(
            text,
            style,
            steps,
            speed
        );

        return wav;
    }
}