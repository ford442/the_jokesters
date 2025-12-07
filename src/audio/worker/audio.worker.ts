import * as ort from 'onnxruntime-web';

// Define message types
export type WorkerMessage =
    | { type: 'init'; modelPath: string; tokenizerPath?: string }
    | { type: 'synthesize'; text: string; speakerId: string; requestId: string };

export type WorkerResponse =
    | { type: 'init-success' }
    | { type: 'init-error'; error: string }
    | { type: 'synthesis-success'; audioData: Float32Array; requestId: string }
    | { type: 'synthesis-error'; error: string; requestId: string };

let session: ort.InferenceSession | null = null;
let tokenizerMap: Record<string, number> | null = null;

async function loadTokenizer(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load tokenizer: ${response.statusText}`);
        tokenizerMap = await response.json();
        console.log('Audio Worker: Tokenizer loaded');
    } catch (e) {
        console.warn('Audio Worker: Could not load tokenizer, using fallback/dummy', e);
    }
}

export function tokenize(text: string): BigInt64Array {
    if (!tokenizerMap) {
        // Fallback: simple ascii or zeros
        return new BigInt64Array(text.length).fill(0n);
    }
    const ids: bigint[] = [];
    for (const char of text) {
        // loose matching
        const id = tokenizerMap[char] || tokenizerMap[char.toLowerCase()] || 0;
        ids.push(BigInt(id));
    }
    return new BigInt64Array(ids);
}

// Initialize ONNX Runtime
ort.env.wasm.numThreads = 1;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data;

    switch (msg.type) {
        case 'init':
            try {
                console.log('Audio Worker: Initializing model from', msg.modelPath);

                if (msg.tokenizerPath) {
                    await loadTokenizer(msg.tokenizerPath);
                }

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

                console.log('Audio Worker: Synthesizing', text);

                // MOCK / PLACEHOLDER for real inference
                // In real app: const inputIds = tokenize(text); ... session.run(...)

                // Simulation delay
                await new Promise(r => setTimeout(r, 500 + text.length * 10));

                // Create dummy float32 audio
                const sampleRate = 24000;
                // Generate enough audio for the text duration
                const duration = 1.0 + text.length * 0.05;
                const audioData = new Float32Array(Math.floor(sampleRate * duration));
                for (let i = 0; i < audioData.length; i++) {
                    audioData[i] = Math.sin(i * 0.1) * 0.1;
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
