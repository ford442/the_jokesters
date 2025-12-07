import { pipeline, env } from '@huggingface/transformers';

// Configure to load models locally from your /public/models/ folder
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/'; // Root path for local models

export class AudioEngine {
    private synthesizer: any = null;
    private speakerEmbeddings: any = null;
    private isReady = false;

    public async init(modelId: string = 'supertonic'): Promise<void> {
        try {
            console.log(`AudioEngine: Initializing pipeline for ${modelId}...`);

            // This will look for /models/supertonic/config.json, model.onnx (or split files), etc.
            this.synthesizer = await pipeline('text-to-speech', modelId, {
                device: 'webgpu', // Use WebGPU for performance
                dtype: 'fp32',    // Supertonic quantization is handled internally
            });

            // Load the speaker embedding (Voice ID)
            // We fetch this manually since it's a raw binary file, not part of the standard pipeline config
            const response = await fetch('/models/supertonic/voices/F1.bin');
            if (!response.ok) throw new Error('Failed to load speaker embedding F1.bin');
            const buffer = await response.arrayBuffer();
            this.speakerEmbeddings = new Float32Array(buffer);

            this.isReady = true;
            console.log('AudioEngine: Ready');
        } catch (e) {
            console.error('AudioEngine Init Failed:', e);
            throw e;
        }
    }

    public async synthesize(text: string, _speakerId: string): Promise<Float32Array> {
        if (!this.isReady || !this.synthesizer) {
            throw new Error('AudioEngine not ready');
        }

        // Run inference
        // The pipeline handles tokenization -> encoder -> denoiser -> decoder automatically
        const output = await this.synthesizer(text, {
            speaker_embeddings: this.speakerEmbeddings,
        });

        // output.audio is the Float32Array we need
        return output.audio;
    }

    public dispose() {
        // Transformers.js manages its own cleanup mostly, 
        // but you can nullify references
        this.synthesizer = null;
    }
}