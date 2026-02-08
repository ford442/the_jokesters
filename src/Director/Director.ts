import { GroupChatManager } from '../GroupChatManager';
import { MediaReactionManager, type ReactionTrigger } from './MediaReactionManager';

export interface DirectorCallbacks {
    onMessage: (sender: string, message: string, color: string) => void;
    onSpeak: (sentence: string, agentId: string, options: { steps?: number; seed?: number; speed?: number }) => Promise<void>;
    onTurnStart: (agentId: string) => Promise<void>;
    onTurnEnd: () => Promise<void>;
    onError: (error: any) => void;
    onSceneStop: () => void;
    getSeed: () => number | undefined;
    videoControls?: {
        play: () => Promise<void>;
        pause: () => void;
        load: (url: string) => void;
        getTime: () => number;
        show: (visible: boolean) => void;
    };
}

export interface ReporterSegment {
    type: 'intro' | 'headlines' | 'main_story' | 'panel_discussion' | 'fact_check' | 'breaking' | 'closing';
    speakerRole?: 'anchor' | 'reporter' | 'analyst' | 'expert' | 'host';
    promptInjection: string;
    maxTurns: number;
}

export interface Scenario {
    type: 'improv' | 'script' | 'reaction' | 'narrative' | 'reporter';
    title: string;
    description: string;
    config?: {
        chaosLevel?: number;
        initialPrompt?: string;
        videoUrl?: string;
        triggers?: ReactionTrigger[];
        reporterTopic?: string;
        reporterCategory?: 'science' | 'news' | 'technology' | 'sports';
        reporterContext?: string;
        reporterSegments?: ReporterSegment[];
        enableBreakingNews?: boolean;
        sources?: string[];
        scripted?: boolean;
        generatedScript?: ScriptBeat[];
    };
}

export interface ScriptBeat {
    speaker: string;
    line: string;
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
            } else if (scenario.type === 'reaction') {
                await this.runReactionLoop(scenario);
            } else if (scenario.type === 'reporter') {
                await this.runReporterLoop(scenario);
            } else if (scenario.type === 'script') {
                await this.runScriptLoop(scenario);
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

    private async runReactionLoop(scenario: Scenario) {
        if (!this.callbacks.videoControls) {
            this.callbacks.onError('Reaction mode requires video controls');
            this.stopScene();
            return;
        }

        const videoUrl = scenario.config?.videoUrl;
        const triggers = scenario.config?.triggers;

        if (!videoUrl || !triggers) {
            this.callbacks.onError('Reaction mode requires videoUrl and triggers in config');
            this.stopScene();
            return;
        }

        const reactionManager = new MediaReactionManager(triggers);

        // Setup video
        this.callbacks.videoControls.show(true);
        this.callbacks.videoControls.load(videoUrl);

        try {
            await this.callbacks.videoControls.play();
        } catch (e) {
            console.warn('Auto-play might be blocked or failed:', e);
            this.callbacks.onMessage('System', 'Please click play on the video if it does not start automatically.', '#ff6b6b');
        }

        this.callbacks.onMessage('Director', 'Starting reaction loop...', '#888');

        while (this.isRunning) {
            // Poll video time
            const time = this.callbacks.videoControls.getTime();
            const trigger = reactionManager.checkTriggers(time);

            if (trigger) {
                // Pause and React
                this.callbacks.videoControls.pause();
                this.callbacks.onMessage('Director', `Reaction triggered: ${trigger.prompt}`, '#888');

                await this.processTurn(trigger.prompt);

                // Resume
                if (this.isRunning) {
                    try {
                        await this.callbacks.videoControls.play();
                    } catch (e) {
                        console.error('Failed to resume video:', e);
                    }
                }
            }

            await new Promise(r => setTimeout(r, 200));
        }

        // Cleanup
        this.callbacks.videoControls.pause();
        this.callbacks.videoControls.show(false);
    }

    private async runScriptLoop(scenario: Scenario) {
        const script = scenario.config?.generatedScript;
        if (!script || script.length === 0) {
            this.callbacks.onError('Script mode requires a script in config.generatedScript');
            this.stopScene();
            return;
        }

        this.callbacks.onMessage('Director', `🎭 Performing ${script.length} scripted beats...`, '#888');

        for (let i = 0; i < script.length && this.isRunning; i++) {
            const beat = script[i];
            await this.processScriptBeat(beat);
            // Natural pause between beats
            await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
        }

        if (this.isRunning) {
            this.callbacks.onMessage('Director', '🎭 Scene Fin.', '#888');
            this.stopScene();
        }
    }

    private async runReporterLoop(scenario: Scenario) {
        const topic = scenario.config?.reporterTopic || scenario.title;
        const context = scenario.config?.reporterContext;
        const segments = scenario.config?.reporterSegments || this.getDefaultReporterSegments();
        const enableBreakingNews = scenario.config?.enableBreakingNews ?? true;

        if (!context) {
            this.callbacks.onError('Reporter mode requires context data in config.reporterContext');
            this.stopScene();
            return;
        }

        // Show topic and sources
        this.callbacks.onMessage('Director', `📰 Now Reporting: ${topic}`, '#888');
        if (scenario.config?.sources && scenario.config.sources.length > 0) {
            this.callbacks.onMessage('Director', `📡 Sources: ${scenario.config.sources.join(', ')}`, '#666');
        }

        // Execute each segment
        for (const segment of segments) {
            if (!this.isRunning) break;
            await this.executeReporterSegment(segment, context, topic, enableBreakingNews);
        }

        // Natural end of show
        if (this.isRunning) {
            this.callbacks.onMessage('Director', '📰 End of broadcast', '#888');
        }
    }

    private getDefaultReporterSegments(): ReporterSegment[] {
        return [
            {
                type: 'intro',
                speakerRole: 'host',
                promptInjection: '(You are the HOST introducing today\'s topic. Welcome viewers and set the stage with a mix of professionalism and wit.)',
                maxTurns: 1
            },
            {
                type: 'headlines',
                speakerRole: 'anchor',
                promptInjection: '(You are the ANCHOR presenting the headline story. Be serious and informative, like a professional newsreader.)',
                maxTurns: 1
            },
            {
                type: 'main_story',
                speakerRole: 'expert',
                promptInjection: '(You are the EXPERT analyst. Present the key facts and provide analysis. Reference specific details from the context.)',
                maxTurns: 2
            },
            {
                type: 'panel_discussion',
                speakerRole: 'analyst',
                promptInjection: '(Join the PANEL DISCUSSION. React to what others have said, offer your perspective, and engage in friendly debate.)',
                maxTurns: 4
            },
            {
                type: 'closing',
                speakerRole: 'host',
                promptInjection: '(You are the HOST wrapping up the segment. Summarize key takeaways and sign off with style.)',
                maxTurns: 1
            }
        ];
    }

    private async executeReporterSegment(
        segment: ReporterSegment, 
        context: string, 
        _topic: string,
        enableBreakingNews: boolean
    ): Promise<void> {
        // Notify about segment change
        const segmentEmojis: Record<string, string> = {
            intro: '🎬',
            headlines: '📰',
            main_story: '📊',
            panel_discussion: '💬',
            fact_check: '✅',
            breaking: '🚨',
            closing: '👋'
        };

        const segmentNames: Record<string, string> = {
            intro: 'Show Intro',
            headlines: 'Headlines',
            main_story: 'Main Story',
            panel_discussion: 'Panel Discussion',
            fact_check: 'Fact Check',
            breaking: 'Breaking News',
            closing: 'Closing'
        };

        // Optional: Random breaking news interruption (controlled by chaos level)
        if (enableBreakingNews && segment.type !== 'breaking' && Math.random() * 100 < this.chaosLevel / 3) {
            this.callbacks.onMessage('Director', `${segmentEmojis['breaking']} BREAKING NEWS interruption!`, '#ff6b6b');
            const breakingPrompt = `(BREAKING NEWS INTERRUPTION! A surprising development just came in. React with appropriate urgency and surprise!)`;
            await this.processTurn(context + ' ' + breakingPrompt);
        }

        // Execute segment turns
        for (let turn = 0; turn < segment.maxTurns && this.isRunning; turn++) {
            if (turn === 0) {
                this.callbacks.onMessage('Director', 
                    `${segmentEmojis[segment.type] || '📰'} ${segmentNames[segment.type] || segment.type}`, 
                    '#4ecdc4'
                );
            }

            // Build prompt based on segment type
            let prompt = segment.promptInjection;

            // Add context for the first turn of each segment
            if (turn === 0 && (segment.type === 'headlines' || segment.type === 'main_story')) {
                prompt = context + ' ' + prompt;
            }

            // For panel discussion, add variety
            if (segment.type === 'panel_discussion') {
                const panelPrompts = [
                    '(Agree with the previous speaker but add a twist.)',
                    '(Play devil\'s advocate and challenge the previous point.)',
                    '(Share a surprising fact or connection others missed.)',
                    '(Make a bold prediction about where this is heading.)'
                ];
                if (turn > 0) {
                    prompt = segment.promptInjection + ' ' + panelPrompts[turn % panelPrompts.length];
                }
            }

            await this.processTurn(prompt);

            // Brief pause between turns for natural pacing
            if (turn < segment.maxTurns - 1) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        // Pause between segments
        await new Promise(r => setTimeout(r, 800));
    }

    private async processScriptBeat(beat: ScriptBeat): Promise<void> {
        try {
            await this.callbacks.onTurnStart(beat.speaker);

            const prompt = `(SCRIPT PERFORMANCE: Deliver this scripted line authentically in your character's voice and style: "${beat.line.replace(/"/g, '\\"')}" \\
Make it natural, add flair if fits, but stay true to the line. 1-2 breaths max. ###)`;

            await this.manager.chatForAgent(beat.speaker, prompt, async (sentence: string) => {
                await this.callbacks.onSpeak(sentence, beat.speaker, {});
            });

            await this.callbacks.onTurnEnd();
        } catch (error) {
            console.error('Script beat error:', error);
            this.callbacks.onError(error);
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
