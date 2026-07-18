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
}
