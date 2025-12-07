import { loadSupertonic, loadVoice, SupertonicTTS, Style } from './Supertonic';

export class AudioEngine {
    private tts: SupertonicTTS | null = null;
    private style: Style | null = null;
    private isReady = false;

    public async init(assetsPath: string): Promise<void> {
        try {
            console.log('AudioEngine: Loading Supertonic components...');

            // Load the 4 models + config
            this.tts = await loadSupertonic(assetsPath);

            // Load a default voice (M1.json or F1.json)
            // User specified paths: ./assets/voice_styles
            this.style = await loadVoice(`/assets/voice_styles/M1.json`);

            this.isReady = true;
            console.log('AudioEngine: Ready');
        } catch (e) {
            console.error('AudioEngine Init Failed:', e);
        }
    }

    public async synthesize(text: string, speakerId: string): Promise<Float32Array> {
        if (!this.tts || !this.style) throw new Error("TTS not ready");

        // TODO: Map speakerId to different JSON voice files if you have them
        return await this.tts.generate(text, this.style, 10, 1.0); // 10 steps, 1.0 speed
    }
}