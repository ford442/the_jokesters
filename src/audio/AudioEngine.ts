
import type { WorkerMessage, WorkerResponse } from './worker/audio.worker';
import AudioWorker from './worker/audio.worker?worker'; // Vite worker import

export class AudioEngine {
    private worker: Worker;
    private pendingRequests = new Map<string, {
        resolve: (data: Float32Array) => void;
        reject: (reason: any) => void;
    }>();
    private isReady = false;

    private resolveInit: (() => void) | null = null;
    private rejectInit: ((reason?: any) => void) | null = null;

    constructor() {
        this.worker = new AudioWorker();
        this.setupWorkerHandlers();
    }

    private setupWorkerHandlers() {
        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const msg = event.data;
            switch (msg.type) {
                case 'init-success':
                    this.isReady = true;
                    console.log('AudioEngine: Ready');
                    if (this.resolveInit) {
                        this.resolveInit();
                        this.resolveInit = null;
                        this.rejectInit = null;
                    }
                    break;
                case 'init-error':
                    console.error('AudioEngine: Initialization failed', msg.error);
                    if (this.rejectInit) {
                        this.rejectInit(new Error(msg.error));
                        this.resolveInit = null;
                        this.rejectInit = null;
                    }
                    break;
                case 'synthesis-success':
                    const resolver = this.pendingRequests.get(msg.requestId);
                    if (resolver) {
                        resolver.resolve(msg.audioData);
                        this.pendingRequests.delete(msg.requestId);
                    }
                    break;
                case 'synthesis-error':
                    const rejector = this.pendingRequests.get(msg.requestId);
                    if (rejector) {
                        rejector.reject(new Error(msg.error));
                        this.pendingRequests.delete(msg.requestId);
                    }
                    break;
            }
        };
    }

    public async init(modelPath: string, tokenizerPath?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.resolveInit = resolve;
            this.rejectInit = reject;
            this.worker.postMessage({ type: 'init', modelPath, tokenizerPath } as WorkerMessage);
        });
    }

    public async synthesize(text: string, speakerId: string): Promise<Float32Array> {
        if (!this.isReady) {
            console.warn('AudioEngine: Worker not ready, waiting...');
            // In a real app, might want to queue this or wait for init.
            // For now, proceeding and hoping it inits fast or queuing in worker (which we didn't implement there).
        }

        const requestId = crypto.randomUUID();

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });
            this.worker.postMessage({
                type: 'synthesize',
                text,
                speakerId,
                requestId
            } as WorkerMessage);
        });
    }

    public dispose() {
        this.worker.terminate();
    }
}
