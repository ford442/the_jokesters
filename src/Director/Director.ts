import { GroupChatManager } from '../GroupChatManager';
import { MediaReactionManager, type ReactionTrigger } from './MediaReactionManager';
import { MemoryManager } from './MemoryManager';

export interface DirectorCallbacks {
    onMessage: (sender: string, message: string, color: string) => void;
    onTicker?: (text: string) => void;
    onSpeak: (sentence: string, agentId: string, options: { steps?: number; seed?: number; speed?: number }) => Promise<void>;
    onTurnStart: (agentId: string) => Promise<void>;
    onTurnEnd: () => Promise<void>;
    onError: (error: any) => void;
    onSceneStop: () => void;
    getSeed: () => number | undefined;
    onMusicControl?: (action: 'start' | 'stop', bpm?: number) => void;
    videoControls?: {
        play: () => Promise<void>;
        pause: () => void;
        load: (url: string) => void;
        getTime: () => number;
        show: (visible: boolean) => void;
    };
    musicControls?: {
        startBeat: (bpm: number) => void;
        stopBeat: () => void;
    };
}

export interface ReporterSegment {
    type: 'intro' | 'headlines' | 'main_story' | 'panel_discussion' | 'fact_check' | 'breaking' | 'closing' | 'weather' | 'commercial' | 'interview';
    speakerRole?: 'anchor' | 'reporter' | 'analyst' | 'expert' | 'host';
    promptInjection: string;
    maxTurns: number;
}

export interface Scenario {
    type: 'improv' | 'script' | 'reaction' | 'narrative' | 'reporter' | 'roast' | 'story' | 'debate' | 'musical' | 'interview' | 'dungeon_master' | 'autonomous' | 'trivia' | 'dream' | 'vision';
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
        roastTarget?: string;
        storyContext?: string;
        debateTopic?: string;
        musicalStyle?: string;
        musicalTopic?: string;
        interviewHost?: string;
        interviewGuest?: string;
        dmSetting?: string;
        triviaTopic?: string;
        dreamTheme?: string;
        imageUrl?: string;
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
    private currentScenario: Scenario | null = null;
    private interruptQueue: string[] = [];
    private inputPromise: { resolve: (text: string) => void, reject: (reason?: any) => void } | null = null;
    private memoryManager: MemoryManager | null = null;

    constructor(manager: GroupChatManager, callbacks: DirectorCallbacks, memoryManager?: MemoryManager) {
        this.manager = manager;
        this.callbacks = callbacks;
        this.memoryManager = memoryManager || null;
    }

    public setChaosLevel(level: number) {
        this.chaosLevel = level;
    }

    public isSceneRunning(): boolean {
        return this.isRunning;
    }

    public getCurrentScenario(): Scenario | null {
        return this.currentScenario;
    }

    public async playScenario(scenario: Scenario) {
        if (!this.manager) {
            this.callbacks.onError('No manager available');
            return;
        }

        this.currentScenario = scenario;
        this.isRunning = true;
        this.interruptQueue = []; // Reset interrupts
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
            } else if (scenario.type === 'roast') {
                await this.runRoastLoop(scenario);
            } else if (scenario.type === 'story') {
                await this.runStoryLoop(scenario);
            } else if (scenario.type === 'debate') {
                await this.runDebateLoop(scenario);
            } else if (scenario.type === 'musical') {
                await this.runMusicalLoop(scenario);
            } else if (scenario.type === 'interview') {
                await this.runInterviewLoop(scenario);
            } else if (scenario.type === 'dungeon_master') {
                await this.runDungeonMasterLoop(scenario);
            } else if (scenario.type === 'autonomous') {
                await this.runAutonomousLoop(scenario);
            } else if (scenario.type === 'trivia') {
                await this.runTriviaLoop(scenario);
            } else if (scenario.type === 'dream') {
                await this.runDreamLoop(scenario);
            } else if (scenario.type === 'vision') {
                await this.runVisionLoop(scenario);
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
            if (this.callbacks.musicControls) {
                this.callbacks.musicControls.stopBeat();
            }
            this.callbacks.onSceneStop();
            // Stop music if playing
            if (this.callbacks.onMusicControl) {
                this.callbacks.onMusicControl('stop');
            }
        }
    }

    public async handleInterrupt(text: string) {
        if (!this.isRunning) return;

        console.log(`Director received interrupt: ${text}`);
        this.interruptQueue.push(text);
        this.callbacks.onMessage('System', `🗣️ Heckler detected: "${text}"`, '#ff6b6b');

        // Interrupt current generation
        if (this.manager) {
            await this.manager.interrupt();
        }
    }

    public handleUserMessage(text: string) {
        if (this.inputPromise) {
            this.inputPromise.resolve(text);
            this.inputPromise = null;
        } else {
            this.handleInterrupt(text);
        }
    }

    public async waitForInput(): Promise<string> {
        this.callbacks.onMessage('System', '(Waiting for your input...)', '#888');
        return new Promise((resolve, reject) => {
            this.inputPromise = { resolve, reject };
        });
    }

    private async runAutonomousLoop(scenario: Scenario) {
        const topics = [
            "What if we are all living in a simulation?",
            "The pros and cons of owning a pet dragon.",
            "Why is pizza the perfect food?",
            "Explain quantum physics using only food metaphors.",
            "The worst possible time to start a dance party.",
            "If animals could talk, which one would be the rudest?",
        ];

        let turnCount = 0;
        this.callbacks.onMessage('Director', '🤖 Autonomous Mode Activated', '#4ecdc4');

        if (this.manager.getHistoryLength() === 0) {
            const seed = scenario.config?.initialPrompt || topics[Math.floor(Math.random() * topics.length)];
            this.callbacks.onMessage('Director', `Topic: "${seed}"`, '#888');
            await this.processTurn(seed);
        }

        while (this.isRunning) {
             // Check for interruptions
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift()!;
                this.callbacks.onMessage('Director', `📢 INTERRUPT: "${heckle}"`, '#ff6b6b');
                await this.processTurn(`(SYSTEM: SUDDEN INTERRUPTION! Someone said: "${heckle}". React to this naturally.)`);
                continue;
            }

            await new Promise(r => setTimeout(r, 1000));
            if (!this.isRunning) break;

            let prompt = '(Continue the conversation naturally. Be funny or insightful.)';

            // Inject random topic shift every 5 turns
            if (turnCount > 0 && turnCount % 5 === 0) {
                const newTopic = topics[Math.floor(Math.random() * topics.length)];
                prompt = `(SYSTEM: The conversation is getting stale. Smoothly transition the topic to: "${newTopic}")`;
                this.callbacks.onMessage('Director', `➡️ Shift to: ${newTopic}`, '#888');
            }

            // Chaos injection
            if (Math.random() * 100 < this.chaosLevel && turnCount % 3 === 0) {
                 prompt = '(SYSTEM: Something unexpected happens or someone makes a controversial statement. React!)';
            }

            await this.processTurn(prompt);
            turnCount++;
        }
    }

    private async runImprovLoop(scenario: Scenario) {
        if (this.manager.getHistoryLength() === 0) {
            let seed = scenario.config?.initialPrompt || scenario.title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?';

            // Memory Recall
            const recall = await this.searchAndRecall(seed);
            if (recall) {
                this.callbacks.onMessage('System', '🧠 Memory Recall Active', '#4ecdc4');
                seed += '\n' + recall;
            }

            this.callbacks.onMessage('Director', `Action! "${seed}"`, '#888');
            await this.processTurn(seed);
        }

        while (this.isRunning) {
            // Check for interruptions
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift()!;
                this.callbacks.onMessage('Director', `📢 HECKLER INTERRUPT: "${heckle}"`, '#ff6b6b');
                await this.processTurn(`(A HECKLER just shouted: "${heckle}". Stop what you are doing and ROAST them immediately!)`);
                continue;
            }

            await new Promise(r => setTimeout(r, 800));
            if (!this.isRunning) break;

            const turnCount = this.manager.getHistoryLength();
            // Influence by chaos slider
            let prompt = '(Reply naturally to the last thing said)';

            // Check interrupts
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift();
                prompt = `(SYSTEM: SUDDEN INTERRUPTION! The audience yells: "${heckle}". React to this IMMEDIATELY and integrate it into the scene!)`;
                this.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
            } else {
                // Chaos logic
                if (turnCount % 3 === 0 && Math.random() * 100 < this.chaosLevel) {
                    prompt = '(Suddenly, a physical disaster happens. React with panic and crass humor!)';
                } else if (turnCount % 4 === 0 && Math.random() * 100 < this.chaosLevel) {
                    prompt = '(Make a highbrow reference to history that completely misses the point.)';
                }
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

    private async runVisionLoop(scenario: Scenario) {
        const imageUrl = scenario.config?.imageUrl;
        if (!imageUrl) {
            this.callbacks.onError('Vision mode requires an imageUrl');
            this.stopScene();
            return;
        }

        this.callbacks.onMessage('Director', `👁️ VISION MODE: Analyzing Image...`, '#4ecdc4');

        // Construct multimodal message
        const content = [
            { type: "text", text: "(VISION ANALYSIS: Look at this image. Describe what you see in detail and make a funny observation about it.)" },
            { type: "image_url", image_url: { url: imageUrl } }
        ];

        // 1. First turn: Analysis (Handled manually to pass object content)
        if (this.isRunning) {
             const currentAgent = this.manager.getCurrentAgent();
             await this.callbacks.onTurnStart(currentAgent.id);

             // We use chat directly because processTurn expects string
             // Using higher maxTokens for image description
             await this.manager.chat(content, async (sentence) => {
                 await this.callbacks.onSpeak(sentence, currentAgent.id, { steps: 20 });
             }, { maxTokens: 256 });

             await this.callbacks.onTurnEnd();
        }

        // 2. Subsequent turns: Discussion
        while (this.isRunning) {
            await new Promise(r => setTimeout(r, 1000));
            if (!this.isRunning) break;

            // Check interrupts
             if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift()!;
                this.callbacks.onMessage('Director', `📢 COMMENT: "${heckle}"`, '#ff6b6b');
                await this.processTurn(`(SYSTEM: Someone commented on the image: "${heckle}". React to this!)`);
                continue;
            }

            // Continue discussion
            await this.processTurn(`(Continue discussing the image. Point out another detail or make a connection to something else.)`);
        }
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
        let context = scenario.config?.reporterContext || '';
        const segments = scenario.config?.reporterSegments || this.getDefaultReporterSegments();
        const enableBreakingNews = scenario.config?.enableBreakingNews ?? true;

        if (!context) {
            this.callbacks.onError('Reporter mode requires context data in config.reporterContext');
            this.stopScene();
            return;
        }

        // Memory Recall
        const recall = await this.searchAndRecall(topic);
        if (recall) {
             this.callbacks.onMessage('System', '🧠 Memory Recall Active', '#4ecdc4');
             context += '\n' + recall;
        }

        // Show topic and sources
        this.callbacks.onMessage('Director', `📰 Now Reporting: ${topic}`, '#888');
        if (scenario.config?.sources && scenario.config.sources.length > 0) {
            this.callbacks.onMessage('Director', `📡 Sources: ${scenario.config.sources.join(', ')}`, '#666');
        }

        // Execute each segment
        for (const segment of segments) {
            if (!this.isRunning) break;

            if (this.callbacks.onTicker) {
                const headline = await this.generateTickerHeadline(topic);
                this.callbacks.onTicker(headline);
            }

            await this.executeReporterSegment(segment, context, topic, enableBreakingNews);
        }

        // Natural end of show
        if (this.isRunning) {
            this.callbacks.onMessage('Director', '📰 End of broadcast', '#888');
        }
    }

    private async runRoastLoop(scenario: Scenario) {
        const target = scenario.config?.roastTarget || 'The Audience';
        this.callbacks.onMessage('Director', `🔥 ROAST BATTLE START! Target: ${target}`, '#ff6b6b');

        let turnCount = 0;
        while (this.isRunning) {
            // Check for interruptions
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift()!;
                this.callbacks.onMessage('Director', `📢 HECKLER: "${heckle}"`, '#ff6b6b');
                await this.processTurn(`(The target just shouted back: "${heckle}". Destroy them for speaking!)`);
                continue;
            }

            if (!this.isRunning) break;

            let prompt = `(ROAST BATTLE: You are roasting "${target}". Be savage, funny, and ruthless. Keep it short and punchy! Use proper timing. If someone else just roasted, react to it first.)`;

            if (this.interruptQueue.length > 0) {
                 const heckle = this.interruptQueue.shift();
                 prompt = `(SYSTEM: A heckler yells: "${heckle}". Roast them back!)`;
                 this.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
            }

            await this.processTurn(prompt);

            // Audience Reaction (Simulated)
            if (Math.random() > 0.5) {
                const reactions = ['"OOOOOH!"', '"DAMN!"', '"APPLY COLD WATER!"', '"TOO FAR!"', '"LOL"'];
                const reaction = reactions[Math.floor(Math.random() * reactions.length)];
                this.callbacks.onMessage('Audience', reaction, '#888');
            }

            turnCount++;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    private async runDreamLoop(scenario: Scenario) {
        const theme = scenario.config?.dreamTheme || 'A flying toaster';
        this.callbacks.onMessage('Director', `🌙 SHARED DREAM: Theme - ${theme}`, '#9b59b6');

        let turnCount = 0;

        // Seeding the dream
        if (this.manager.getHistoryLength() === 0) {
             await this.processTurn(`(SHARED DREAM: We are all sharing a vivid, surreal dream about "${theme}". Start by describing what you see. Be abstract and weird.)`);
        }

        while (this.isRunning) {
            // Check for interruptions (Lucid Dreaming)
            if (this.interruptQueue.length > 0) {
                const lucidity = this.interruptQueue.shift()!;
                this.callbacks.onMessage('Director', `✨ LUCID INTERRUPT: "${lucidity}"`, '#ff6b6b');
                await this.processTurn(`(SYSTEM: The dream suddenly shifts! "${lucidity}". Incorporate this new element into the dream logic immediately.)`);
                continue;
            }

            if (!this.isRunning) break;

            const prompt = `(SHARED DREAM: Continue the dream description. Build upon the previous surreal imagery. Keep it flowy and strange.)`;
            await this.processTurn(prompt);

            turnCount++;
            await new Promise(r => setTimeout(r, 1200));
        }
    }

    private async runStoryLoop(scenario: Scenario) {
        let storySoFar = scenario.config?.initialPrompt || 'Once upon a time...';
        this.callbacks.onMessage('Director', `📖 Story Time! "${storySoFar}"`, '#4ecdc4');

        while (this.isRunning) {
             // Check for interruptions
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift()!;
                this.callbacks.onMessage('Director', `📢 AUDIENCE SUGGESTION: "${heckle}"`, '#ff6b6b');
                await this.processTurn(`(The audience shouted a suggestion: "${heckle}". Incorporate this into the story seamlessly!)`);
                // Note: We don't continue; we let the story update with this turn
            }

            if (!this.isRunning) break;

            // For story mode, we want exactly one sentence that advances the plot
            let prompt = `(COLLABORATIVE STORYTELLING: The story so far is: "${storySoFar}".
Add exactly ONE sentence to continue the story. Be creative but consistent. Do not repeat the previous sentence.)`;

            if (this.interruptQueue.length > 0) {
                 const heckle = this.interruptQueue.shift();
                 prompt = `(SYSTEM: Someone shouts "${heckle}". Incorporate this object or idea into the story immediately!)`;
                 this.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
            }

            // We need to capture the output to append to storySoFar
            // However, processTurn handles speaking and UI. We can hook into onSpeak but that's async.
            // A better way for this mode might be to use manager.chat directly or rely on the memory which GroupChatManager handles.
            // Since GroupChatManager maintains history, the agents "know" the story if we include history.
            // But we want to explicitly track it for the prompt context.

            // Let's rely on the chat history for context, but enforce the "one sentence" constraint via prompt.
            await this.processTurn(prompt);

            // We don't easily get the response text back from processTurn to update `storySoFar` locally variable here
            // without modifying processTurn or listening to onMessage/onSpeak.
            // However, since we re-inject "The story so far" in the prompt, we strictly need the text.
            // The GroupChatManager history has it.
            const history = this.manager.getHistory();
            if (history.length > 0) {
                const lastMsg = history[history.length - 1];
                if (lastMsg.role === 'assistant') {
                    storySoFar += ' ' + lastMsg.content;
                }
            }

            await new Promise(r => setTimeout(r, 800));
        }
    }

    private async runDebateLoop(scenario: Scenario) {
        const topic = scenario.config?.debateTopic || 'Is a hotdog a sandwich?';
        this.callbacks.onMessage('Director', `⚖️ DEBATE CLUB: ${topic}`, '#45b7d1');

        // Roles
        const moderator = 'scientist';
        const pro = 'comedian';
        const con = 'philosopher';

        // Intro
        this.callbacks.onTurnStart(moderator);
        await this.manager.chatForAgent(moderator, `(You are the MODERATOR for the debate topic: "${topic}". Introduce the topic and the debaters (Comedian and Philosopher). Keep it professional but slightly annoyed.)`, async (sentence) => {
             await this.callbacks.onSpeak(sentence, moderator, {});
        });
        await this.callbacks.onTurnEnd();

        let round = 1;
        while (this.isRunning) {
            // Check for interruptions (Heckler in debate)
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift()!;
                this.callbacks.onMessage('Director', `📢 AUDIENCE QUESTION: "${heckle}"`, '#ff6b6b');
                await this.manager.chatForAgent(moderator, `(An audience member asked: "${heckle}". Address it and assign one debater to answer.)`, async (s) => await this.callbacks.onSpeak(s, moderator, {}));
                continue;
            }

            this.callbacks.onMessage('Director', `🔔 Round ${round}`, '#888');

            // Check interrupt before round starts
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift();
                this.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
                await this.manager.chatForAgent(moderator, `(SYSTEM: An audience member yells "${heckle}". Address this interruption firmly!)`, async (s) => await this.callbacks.onSpeak(s, moderator, {}));
            }

            // Pro Argument
            if (!this.isRunning) break;
            await this.manager.chatForAgent(pro, `(DEBATE ROUND ${round}: Argue FOR the topic: "${topic}". Be passionate and use absurd logic.)`, async (s) => await this.callbacks.onSpeak(s, pro, {}));

            // Check for interruptions mid-round
            if (this.interruptQueue.length > 0) continue;

            // Con Argument
            if (!this.isRunning) break;
            await this.manager.chatForAgent(con, `(DEBATE ROUND ${round}: Argue AGAINST the topic: "${topic}" and refute the previous point. Be philosophical and condescending.)`, async (s) => await this.callbacks.onSpeak(s, con, {}));

            // Moderator Interjection (optional)
            if (round % 2 === 0 && this.isRunning) {
                await this.manager.chatForAgent(moderator, `(Briefly summarize the points so far and issue a point deduction to one of them for a fallacy.)`, async (s) => await this.callbacks.onSpeak(s, moderator, {}));
            }

            await new Promise(r => setTimeout(r, 1000));
            round++;
        }
    }

    private async runMusicalLoop(scenario: Scenario) {
        const topic = scenario.config?.musicalTopic || scenario.config?.musicalStyle || 'Life in the Matrix';

        if (!this.callbacks.musicControls) {
            this.callbacks.onError('Musical mode requires music controls');
            this.stopScene();
            return;
        }

        this.callbacks.onMessage('Director', `🎵 DROPPING THE BEAT! Topic: ${topic}`, '#ff00ff');
        this.callbacks.musicControls.startBeat(95); // 95 BPM

        // Intro
        this.callbacks.onTurnStart('comedian');
        await this.manager.chatForAgent('comedian', `(You are about to rap about "${topic}". Hype up the crowd! Keep it short.)`, async (s) => await this.callbacks.onSpeak(s, 'comedian', {}));
        await this.callbacks.onTurnEnd();

        let round = 1;
        while (this.isRunning) {
            this.callbacks.onMessage('Director', `🎵 Verse ${round}`, '#888');

            if (!this.isRunning) break;

            // Rap Battle / Freestyle
            // We want short lines to fit the beat ideally, but TTS is async.
            // We just prompt for lyrics.

            const agent = round % 2 === 1 ? 'comedian' : 'philosopher';

            const prompt = `(MUSICAL IMPROV: Rap a 4-line verse about "${topic}". Keep a steady rhythm. Rhyme scheme AABB. End with "###")`;

            await this.manager.chatForAgent(agent, prompt, async (s) => {
                await this.callbacks.onSpeak(s, agent, { speed: 1.2 });
            });

            await new Promise(r => setTimeout(r, 2000)); // Wait for beat
            round++;
        }

        this.callbacks.musicControls.stopBeat();
    }

    private async runInterviewLoop(scenario: Scenario) {
        const host = scenario.config?.interviewHost || 'comedian';
        const guestName = scenario.config?.interviewGuest || 'The User';

        this.callbacks.onMessage('Director', `🎙️ PODCAST MODE: Host ${host} interviewing ${guestName}`, '#4ecdc4');

        // Intro
        this.callbacks.onTurnStart(host);
        await this.manager.chatForAgent(host, `(You are hosting a podcast. Introduce yourself and your special guest, ${guestName}. Start by asking them a question about their life or opinions. Be charming and inquisitive.)`, async (s) => await this.callbacks.onSpeak(s, host, {}));
        await this.callbacks.onTurnEnd();

        while (this.isRunning) {
            // Wait for user input
            const userInput = await this.waitForInput();
            this.callbacks.onMessage(guestName, userInput, '#ffffff');

            if (!this.isRunning) break;

            // Host Reacts
            await this.manager.chatForAgent(host, `(PODCAST INTERVIEW: The guest (${guestName}) just said: "${userInput}". React to this, maybe crack a joke or make an observation, and then ask a follow-up question. Keep the conversation flowing naturally.)`, async (s) => await this.callbacks.onSpeak(s, host, {}));
        }
    }

    private async runDungeonMasterLoop(scenario: Scenario) {
        const dm = 'scientist'; // Scientist makes a good DM (logical)
        const setting = scenario.config?.dmSetting || 'a dark fantasy dungeon';

        this.callbacks.onMessage('Director', `🎲 DUNGEON MASTER MODE: Setting - ${setting}`, '#9b59b6');

        // Intro
        this.callbacks.onTurnStart(dm);
        await this.manager.chatForAgent(dm, `(You are the DUNGEON MASTER for a roleplaying game set in ${setting}. Describe the opening scene vividly to the players (User, Comedian, Philosopher). Ask them what they want to do.)`, async (s) => await this.callbacks.onSpeak(s, dm, {}));
        await this.callbacks.onTurnEnd();

        while (this.isRunning) {
            // 1. Players react (Comedian/Philosopher)
            // Random chance for agents to pipe up before user
            if (Math.random() > 0.3 && this.isRunning) {
                 await this.manager.chatForAgent('comedian', `(RPG PLAYER: You are playing the game. React to the scene or declare an action. Be chaotic and funny.)`, async (s) => await this.callbacks.onSpeak(s, 'comedian', {}));
            }
            if (Math.random() > 0.3 && this.isRunning) {
                 await this.manager.chatForAgent('philosopher', `(RPG PLAYER: You are playing the game. Analyze the situation or declare a cautious, over-thought action.)`, async (s) => await this.callbacks.onSpeak(s, 'philosopher', {}));
            }

            // 2. Wait for User Input
            const userInput = await this.waitForInput();
            this.callbacks.onMessage('You', userInput, '#ffffff');

            if (!this.isRunning) break;

            // 3. DM Resolves
            await this.manager.chatForAgent(dm, `(DUNGEON MASTER: The user said: "${userInput}". The other players also acted. Resolve these actions. Describe the consequences and the new state of the world. Then ask "What do you do next?")`, async (s) => await this.callbacks.onSpeak(s, dm, {}));
        }
    }

    private async runTriviaLoop(scenario: Scenario) {
        const topic = scenario.config?.triviaTopic || 'General Knowledge';
        const host = 'scientist';
        this.callbacks.onMessage('Director', `❓ TRIVIA NIGHT: Topic - ${topic}`, '#f1c40f');

        // Intro
        this.callbacks.onTurnStart(host);
        await this.manager.chatForAgent(host, `(You are hosting a Trivia Night. The topic is "${topic}". Welcome the player (User) and explain the rules. Keep it brief.)`, async (s) => await this.callbacks.onSpeak(s, host, {}));
        await this.callbacks.onTurnEnd();

        let round = 1;
        while (this.isRunning) {
            this.callbacks.onMessage('Director', `🔔 Question ${round}`, '#888');

            // 1. Generate Question
            // We ask the host to ask a question.
            if (!this.isRunning) break;

            await this.manager.chatForAgent(host, `(TRIVIA HOST: Ask a challenging trivia question about "${topic}". Do not reveal the answer yet. Wait for the user to guess.)`, async (s) => await this.callbacks.onSpeak(s, host, {}));

            // 2. Wait for User Answer
            const userInput = await this.waitForInput();
            this.callbacks.onMessage('You', userInput, '#ffffff');

            if (!this.isRunning) break;

            // 3. Evaluate
            await this.manager.chatForAgent(host, `(TRIVIA HOST: The user answered: "${userInput}". Reveal the correct answer and tell them if they were right or wrong. Be strict but fair. Then ask if they are ready for the next question.)`, async (s) => await this.callbacks.onSpeak(s, host, {}));

            // Optional: Other agents react
             if (Math.random() > 0.5 && this.isRunning) {
                 await this.manager.chatForAgent('comedian', `(React to the user's answer or the host's strictness. Make a joke about it.)`, async (s) => await this.callbacks.onSpeak(s, 'comedian', {}));
            }

            round++;
            await new Promise(r => setTimeout(r, 1000));
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
            closing: '👋',
            weather: '☀️',
            commercial: '📺',
            interview: '🎙️'
        };

        const segmentNames: Record<string, string> = {
            intro: 'Show Intro',
            headlines: 'Headlines',
            main_story: 'Main Story',
            panel_discussion: 'Panel Discussion',
            fact_check: 'Fact Check',
            breaking: 'Breaking News',
            closing: 'Closing',
            weather: 'Weather Report',
            commercial: 'Commercial Break',
            interview: 'Exclusive Interview'
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

            // Check interrupts
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift();
                prompt = `(SYSTEM: BREAKING INTERRUPTION! Someone yells: "${heckle}". React to this live on air!)`;
                this.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
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

            let pacing = this.calculatePacing();
            let effectivePrompt = inputText;

            // Check for interrupts
            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift();
                this.callbacks.onMessage('Heckler', `"${heckle}"`, '#ff0000');
                effectivePrompt = `(HECKLER INTERRUPT: A heckler just shouted: "${heckle}". React to this immediately! Ignore the previous topic for a moment.)`;

                // Force a punchy response
                pacing = {
                     type: 'punchline',
                     maxTokens: 80,
                     ttsSteps: 20,
                     promptSuffix: ' (Roast the heckler!)'
                };
            }

            effectivePrompt += pacing.promptSuffix + ' ###';

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

    private async searchAndRecall(topic: string): Promise<string | null> {
        if (!this.memoryManager) return null;
        try {
            const results = this.memoryManager.searchLocalEpisodes(topic);
            if (results.length > 0) {
                const snippets = results.map(r => `(Episode ${r.episodeId}): ${r.snippet}`).join('\n');
                return `(MEMORY RECALL: You vaguely remember discussing "${topic}" before. Reference these past moments if relevant:\n${snippets})`;
            }
        } catch (e) {
            console.warn('Memory search failed:', e);
        }
        return null;
    }

    private async generateTickerHeadline(topic: string): Promise<string> {
        const templates = [
            `BREAKING: ${topic} causes minor confusion`,
            `UPDATE: Experts say ${topic} is "mostly harmless"`,
            `LIVE: People still talking about ${topic}`,
            `NEWS: ${topic} - What does it mean for your lunch?`,
            `ALERT: ${topic} confirmed to be a thing`,
            `SCANDAL: ${topic} involved in controversy`,
            `DEVELOPING: ${topic} rumored to be part of simulation`,
            `TRENDING: ${topic} goes viral for wrong reasons`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }
}