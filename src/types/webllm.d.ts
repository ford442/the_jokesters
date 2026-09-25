declare module '@mlc-ai/web-llm' {
    export class MLCEngine {
        constructor();
        setInitProgressCallback(callback: (report: InitProgressReport) => void): void;
        unload(): Promise<void>;
        reload(modelId: string, chatOpts?: any): Promise<void>;
        interruptGenerate?(): Promise<void>;
        chat: {
            completions: {
                create(options: any): Promise<any>;
            };
        };
    }

    export interface InitProgressReport {
        progress: number;
        timeElapsed: number;
        text: string;
    }

    export interface ChatCompletionMessageParam {
        role: string;
        content: string;
    }

    export class WebLLMInitError extends Error {
        readonly category: 'webgpu' | 'oom' | 'network' | 'unknown';
    }

    export function classifyInitError(error: unknown): 'webgpu' | 'oom' | 'network' | 'unknown';
    export function getInitErrorHint(category: string): string;
    export function toInitError(error: unknown): WebLLMInitError;
    export function isSentenceBoundaryDelta(delta: string): boolean;
    export function extractNewSentences(fullText: string, prevLength: number): {
        sentences: string[];
        newLength: number;
    };

    export class ComedyLogitProcessor {
        constructor(options?: {
            ngramSize?: number;
            ngramPenalty?: number;
            clichéTokenIds?: number[];
            clichéPenalty?: number;
        });
    }

    export const prebuiltAppConfig: {
        model_list: Array<{ model_id: string;[key: string]: any }>;
    };

    export function CreateMLCEngine(modelId: string, config?: any, chatOpts?: any): Promise<MLCEngine>;

    // --- Subset of the real web-llm config / worker API (lib/config.d.ts, lib/web_worker.d.ts) ---

    export interface LogitProcessor {
        processLogits: (logits: Float32Array) => Float32Array;
        processSampledToken: (token: number) => void;
        resetState: () => void;
    }

    export interface AppConfig {
        model_list: Array<{ model_id: string;[key: string]: any }>;
        [key: string]: any;
    }

    export interface ChatOptions {
        context_window_size?: number;
        prefill_chunk_size?: number;
        sliding_window_size?: number;
        [key: string]: any;
    }

    export interface MLCEngineConfig {
        appConfig?: AppConfig;
        initProgressCallback?: (report: InitProgressReport) => void;
        logitProcessorRegistry?: Map<string, LogitProcessor>;
        logLevel?: string;
    }

    export type WorkerRequest = { kind: string; uuid: string; content: any };

    export class WebWorkerMLCEngineHandler {
        modelId?: string[];
        chatOpts?: ChatOptions[];
        engine: MLCEngine;
        constructor();
        postMessage(msg: any): void;
        setLogitProcessorRegistry(logitProcessorRegistry?: Map<string, LogitProcessor>): void;
        handleTask<T>(uuid: string, task: () => Promise<T>): Promise<void>;
        onmessage(event: any, onComplete?: (value: any) => void, onError?: () => void): void;
    }

    export class WebWorkerMLCEngine {
        worker: { onmessage: any; postMessage: (message: any) => void };
        chat: MLCEngine['chat'];
        modelId?: string[];
        chatOpts?: ChatOptions[];
        constructor(worker: { onmessage: any; postMessage: (message: any) => void }, engineConfig?: MLCEngineConfig);
        setInitProgressCallback(initProgressCallback?: (report: InitProgressReport) => void): void;
        setAppConfig(appConfig: AppConfig): void;
        protected getPromise<T>(msg: WorkerRequest): Promise<T>;
        reload(modelId: string | string[], chatOpts?: ChatOptions | ChatOptions[]): Promise<void>;
        interruptGenerate(): void;
        unload(): Promise<void>;
        resetChat(keepStats?: boolean, modelId?: string): Promise<void>;
        onmessage(event: any): void;
    }

    export function CreateWebWorkerMLCEngine(
        worker: any,
        modelId: string | string[],
        engineConfig?: MLCEngineConfig,
        chatOpts?: ChatOptions | ChatOptions[],
    ): Promise<WebWorkerMLCEngine>;
}
