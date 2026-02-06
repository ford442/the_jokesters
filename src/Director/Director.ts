import { GroupChatManager } from '../GroupChatManager';

export interface DirectorCallbacks {
    onMessage: (sender: string, message: string, color: string) => void;
    onSpeak: (sentence: string, agentId: string, options: { steps?: number; seed?: number; speed?: number }) => Promise<void>;
    onTurnStart: (agentId: string) => Promise<void>;
    onTurnEnd: () => Promise<void>;
    onError: (error: any) => void;
    onSceneStop: () => void;
    getSeed: () => number | undefined;
}

export interface Scenario {
    type: 'improv' | 'script' | 'reaction' | 'narrative';
    title: string;
    description: string;
    config?: {
        chaosLevel?: number;
        initialPrompt?: string;
    };
}

export class Director {
    private manager: GroupChatManager;
    private callbacks: DirectorCallbacks;
    private isRunning: boolean = false;
    private chaosLevel: number = 30;

    constructor(manager: GroupChatManager, callbacks: DirectorCallbacks) {
        this.manager = manager;
        this.callbacks = callbacks;
    }

    public setChaosLevel(level: number) {
        this.chaosLevel = level;
    }

    public isSceneRunning(): boolean {
        return this.isRunning;
    }

    public async playScenario(scenario: Scenario) {
         if (!this.manager) {
            this.callbacks.onError('No manager available');
            return;
        }

        this.isRunning = true;
        this.manager.resetConversation();

        this.callbacks.onMessage('System', `🎬 Starting ${scenario.type} scene: "${scenario.title}"`, '#4ecdc4');
        this.callbacks.onMessage('System', scenario.description, '#4ecdc4');

        // Apply config overrides if present
        if (scenario.config?.chaosLevel !== undefined) {
            this.chaosLevel = scenario.config.chaosLevel;
        }

        try {
            if (scenario.type === 'improv') {
                await this.runImprovLoop(scenario);
            } else {
                 this.callbacks.onError(`Mode ${scenario.type} not implemented yet.`);
                 this.stopScene();
            }
        } catch (error) {
            this.callbacks.onError(error);
            this.stopScene();
        }
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use playScenario instead
     */
    public async startScene(title: string, description: string) {
        const scenario: Scenario = {
            type: 'improv',
            title,
            description,
            config: {
                chaosLevel: this.chaosLevel
            }
        };
        await this.playScenario(scenario);
    }

    public stopScene() {
        if (this.isRunning) {
            this.isRunning = false;
            this.callbacks.onSceneStop();
        }
    }

    private async runImprovLoop(scenario: Scenario) {
         if (this.manager.getHistoryLength() === 0) {
            const seed = scenario.config?.initialPrompt || scenario.title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?';
            this.callbacks.onMessage('Director', `Action! "${seed}"`, '#888');
            await this.processTurn(seed);
        }

        while (this.isRunning) {
            await new Promise(r => setTimeout(r, 800));
            if (!this.isRunning) break;

            const turnCount = this.manager.getHistoryLength();
            // Influence by chaos slider
            let prompt = '(Reply naturally to the last thing said)';

            // Chaos logic
            if (turnCount % 3 === 0 && Math.random() * 100 < this.chaosLevel) {
                prompt = '(Suddenly, a physical disaster happens. React with panic and crass humor!)';
            } else if (turnCount % 4 === 0 && Math.random() * 100 < this.chaosLevel) {
                prompt = '(Make a highbrow reference to history that completely misses the point.)';
            }

            await this.processTurn(prompt);
        }
    }

    private calculatePacing() {
        const roll = Math.random();
        // 30% Chance: "The One-Liner"
        if (roll > 0.7) {
            return {
                type: 'punchline',
                maxTokens: 60,
                ttsSteps: 25,
                promptSuffix: ' (Reply with a single, joking sentence. Be very brief.)'
            };
        } else if (roll > 0.2) {
            // 50% Chance: "The Standard"
            return {
                type: 'standard',
                maxTokens: 150,
                ttsSteps: 16,
                promptSuffix: ' (Keep the conversation flowing. 1-2 sentences.)'
            };
        } else {
            // 20% Chance: "The Rant"
            return {
                type: 'rant',
                maxTokens: 256,
                ttsSteps: 8,
                promptSuffix: ' (Go on a funny, passionate rant. Be expressive!)'
            };
        }
    }

    private async processTurn(inputText: string) {
        if (!this.manager || !this.isRunning) return;

        try {
             const currentAgent = this.manager.getCurrentAgent();

             // Notify start of turn (used for model swapping and UI setup)
             await this.callbacks.onTurnStart(currentAgent.id);

             const pacing = this.calculatePacing();
             // console.log(`[Director] Pacing: ${pacing.type} (Tokens: ${pacing.maxTokens}, Steps: ${pacing.ttsSteps})`);

             const effectivePrompt = inputText + pacing.promptSuffix + ' ###';

             // Character speeds
             const characterSpeeds: Record<string, number> = {
                'comedian': 1.5,
                'philosopher': 0.6,
                'scientist': 1.0
             };

             const userSeed = this.callbacks.getSeed ? this.callbacks.getSeed() : undefined;
             const turnSeed = userSeed !== undefined ? userSeed + this.manager.getHistoryLength() : undefined;

             await this.manager.chat(effectivePrompt, async (sentence) => {
                 await this.callbacks.onSpeak(sentence, currentAgent.id, {
                     steps: pacing.ttsSteps,
                     speed: characterSpeeds[currentAgent.id] || 1.0,
                     seed: turnSeed
                 });
             }, { maxTokens: pacing.maxTokens, seed: turnSeed });

             await this.callbacks.onTurnEnd();

        } catch (error) {
            console.error('Turn Error:', error);
            this.callbacks.onError(error);
            this.stopScene();
        }
    }
}
