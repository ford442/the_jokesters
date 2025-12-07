declare module 'onnxruntime-web' {
    export namespace env {
        export namespace wasm {
            export let numThreads: number;
            export let proxy: boolean;
        }
    }

    export class Tensor {
        constructor(type: string, data: any, dims: number[]);
        data: Float32Array | BigInt64Array | Uint8Array | Int32Array;
        dims: number[];
        type: string;
    }

    export namespace InferenceSession {
        export interface SessionOptions {
            executionProviders?: string[];
            graphOptimizationLevel?: string;
        }

        export function create(path: string, options?: SessionOptions): Promise<InferenceSession>;
    }

    export class InferenceSession {
        run(feeds: Record<string, Tensor>, options?: any): Promise<Record<string, Tensor>>;
    }
}
