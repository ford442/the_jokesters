import { SupertonicPipeline, Style } from './SupertonicPipeline';

export class AudioEngine {
    private pipeline: SupertonicPipeline;
    private currentStyle: Style | null = null;
    private isReady = false;

    constructor() {
        this.pipeline = new SupertonicPipeline();
    }

    public async init(modelPath: string = './assets/onnx'): Promise<void> {
        try {
            console.log(`AudioEngine: Initializing manual ONNX pipeline from ${modelPath}...`);

            await this.pipeline.init(modelPath);

            // Load a default voice style
            // Note: The reference project uses JSON style files, not .bin files.
            // You should place 'M1.json' or similar in /assets/voice_styles/
            try {
                this.currentStyle = await this.pipeline.loadStyle(`./assets/voice_styles/M1.json`);
                console.log("AudioEngine: Default voice style loaded.");
            } catch (e) {
                console.warn("AudioEngine: Could not load default voice style. Please ensure a JSON style file exists.", e);
            }

            this.isReady = true;
            console.log('AudioEngine: Ready');
        } catch (e) {
            console.error('AudioEngine Init Failed:', e);
            throw e;
        }
    }

    public async synthesize(text: string, _speakerId: string): Promise<Float32Array> {
        if (!this.isReady) {
            throw new Error('AudioEngine not ready');
        }
        if (!this.currentStyle) {
            throw new Error('No voice style loaded. Call loadStyle or ensure default style exists.');
        }

        // Run inference
        const { wav } = await this.pipeline.generate(
            text,
            this.currentStyle,
            10,   // steps
            1.0   // speed
        );

        return wav;
    }
}