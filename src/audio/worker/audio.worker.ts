
import * as ort from 'onnxruntime-web';

// Define message types
export type WorkerMessage =
    | { type: 'init'; modelPath: string }
    | { type: 'synthesize'; text: string; speakerId: string; requestId: string };

export type WorkerResponse =
    | { type: 'init-success' }
    | { type: 'init-error'; error: string }
    | { type: 'synthesis-success'; audioData: Float32Array; requestId: string }
    | { type: 'synthesis-error'; error: string; requestId: string };

let session: ort.InferenceSession | null = null;

// Initialize ONNX Runtime
// We might need to configure env for WASM paths, but usually it works if files are hosted correctly.
// For now, minimal configuration.
ort.env.wasm.numThreads = 1; // Prevent hogging CPU/GPU if multithreaded
// ort.env.wasm.wasmPaths = '/assets/'; // This might be needed if vite puts wasm in a subfolder

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data;

    switch (msg.type) {
        case 'init':
            try {
                console.log('Audio Worker: Initializing model from', msg.modelPath);
                // Using WebGPU provider if possible, fallback to wasm
                const options: ort.InferenceSession.SessionOptions = {
                    executionProviders: ['webgpu', 'wasm'],
                    graphOptimizationLevel: 'all',
                };
                session = await ort.InferenceSession.create(msg.modelPath, options);
                console.log('Audio Worker: Model initialized');
                self.postMessage({ type: 'init-success' } as WorkerResponse);
            } catch (err: any) {
                console.error('Audio Worker: Init failed', err);
                self.postMessage({ type: 'init-error', error: err.message } as WorkerResponse);
            }
            break;

        case 'synthesize':
            if (!session) {
                self.postMessage({
                    type: 'synthesis-error',
                    error: 'Model not initialized',
                    requestId: msg.requestId
                } as WorkerResponse);
                return;
            }

            try {
                const { text, speakerId: _speakerId, requestId } = msg;

                // TODO: Preprocessing text to input tensors
                // This part heavily depends on the specific Supertonic-TTS model input signature.
                // Assuming typical inputs like 'text' (int64 array) and 'speaker_id' (int64) or similar.
                // Since we don't have the tokenizer logic here, we'll assume the inputs are pre-tokenized or 
                // the model takes raw strings (unlikely for ONNX).

                // PLACEHOLDER: For scaffolding, we will simulate synthesis or assume a minimal interface.
                // In a real scenario, we need a Tokenizer here (e.g., from a JSON file).

                // For now, let's just return a dummy buffer to prove the pipeline works,
                // OR if the user provided context implies we have the logic, we'd use it.
                // The user said "We have the WebLLM logic. Now we need to add... Supertonic-TTS".
                // They didn't give me the tokenizer. I will put a TODO and return silence/noise.

                console.log('Audio Worker: Synthesizing', text);

                // Dummy inference call structure
                // const feeds = { ... }; 
                // const results = await session.run(feeds);
                // const output = results['output'].data;

                // Simulation delay
                await new Promise(r => setTimeout(r, 500));

                // Create dummy float32 audio (1 second of silence/sine)
                const sampleRate = 24000; // Typical TTS
                const duration = 2;
                const audioData = new Float32Array(sampleRate * duration);
                for (let i = 0; i < audioData.length; i++) {
                    audioData[i] = Math.sin(i * 0.05) * 0.1;
                }

                self.postMessage({
                    type: 'synthesis-success',
                    audioData,
                    requestId
                } as WorkerResponse);

            } catch (err: any) {
                console.error('Audio Worker: Synthesis failed', err);
                self.postMessage({
                    type: 'synthesis-error',
                    error: err.message,
                    requestId: msg.requestId
                } as WorkerResponse);
            }
            break;
    }
};
