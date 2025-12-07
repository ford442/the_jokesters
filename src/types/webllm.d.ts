declare module '@mlc-ai/web-llm' {
    export class MLCEngine {
        constructor();
        reload(modelId: string, chatOpts?: any): Promise<void>;
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

    export const prebuiltAppConfig: {
        model_list: Array<{ model_id: string;[key: string]: any }>;
    };

    export function CreateMLCEngine(modelId: string, config?: any): Promise<MLCEngine>;
}
