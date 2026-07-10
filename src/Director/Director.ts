import { GroupChatManager } from '../GroupChatManager';
import type { ReactionTrigger } from './MediaReactionManager';
import { MemoryManager } from './MemoryManager';
import type { ModeContext } from './modes/ModeContext';
import { ComedySession } from '../comedy/ComedySession';
import { isComedyEnabled } from './modeConfig';
import { getModeLoop, getMode } from './modes/registry';
import type { RegisteredModeId } from './modes/registry';
import { getDefaultContextDepthForCategory } from '../config/contextDepth';

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
    /** Called when a callback/running gag is recorded for visual feedback */
    onCallbackRecorded?: (agentId: string, jokeId: string, count: number, status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead') => void;
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
    /** Mode id — must match an entry in MODE_REGISTRY. */
    type: RegisteredModeId | string;

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
        standupTopic?: string;
        meltdownTopic?: string;
        newsroomTopic?: string;
        podcastConfig?: {
            host: string;
            guest: string;
            topic: string;
        };
        dungeonMasterConfig?: {
            dmName: string;
            campaignSetting: string;
        };
        interviewHost?: string;
        interviewGuest?: string;
        dmSetting?: string;
        triviaTopic?: string;
        dreamTheme?: string;
        imageUrl?: string;
        trialTopic?: string;
        techIssue?: string;
        historicalFigures?: { agentId: string, figureName: string }[];
        historicalTopic?: string;
        commentaryTarget?: string;
        mysterySetting?: string;
        pitchGenre?: string;
        codeLanguage?: string;
        therapyTopic?: string;
        philosopherTopic?: string;
        timeEra?: string;
        chefDish?: string;
        medicalCondition?: string;
        hauntedSetting?: string;
        sportsActivity?: string;
        realityShowName?: string;
        auctionItem?: string;
        escapeRoomSetting?: string;
        interrogationCrime?: string;
        museumItem?: string;
        jobTitle?: string;
        cookingIngredient?: string;
        proceduralVibe?: string;
        timeLoopTopic?: string;
        superheroName?: string;
        conspiracyTopic?: string;
        silentFilmTopic?: string;
        timeTravelersEvent?: string;
        interventionTopic?: string;
        hauntedLocation?: string;
        heistTarget?: string;
        creatorTopic?: string;
        turingTopic?: string;
        serviceIssue?: string;
        auditHistory?: string;
        cableChannel?: string;
        telemarketerProduct?: string;
        stationCrisis?: string;
        bookTitle?: string;
        elevatorVC?: string;
        conspiracyObject?: string;
        natureTask?: string;
        roommateChore?: string;
        dmvPermit?: string;
        touristObject?: string;
        applianceHabit?: string;
        historicalLawsuit?: string;
        paranoidTopic?: string;
        browserHistoryTopic?: string;
        // Rapid-fire modes
        rapidFireTopic?: string;
        questionCount?: number;
        roundCount?: number;
        turnCount?: number;
        startWord?: string;
        lightningRoundTopic?: string;
        lightningRoundRounds?: number;
        potionType?: string;
        hoaViolation?: string;
        modernTech?: string;
        subDepth?: string;
        galacticPastry?: string;
        reverseHeistItem?: string;
        sarcasticOverlordTopic?: string;
        cultTopic?: string;
        noirCrime?: string;
        bollywoodTopic?: string;
        soapOperaSecret?: string;
        disasterEvent?: string;
        startupIdea?: string;
        shipCoreTopic?: string;
        stowawayAction?: string;
        tradeItem?: string;
        spellTopic?: string;
        infractionTopic?: string;
        chapterTopic?: string;
        era?: string;
        /** When set, overrides mode-family default for CallbackEngine / quality hooks. */
        comedyEnabled?: boolean;
        /** Message-count memory depth for this scene (4–30). Overrides slider default. */
        contextDepth?: number;
    };
}

export interface ScriptBeat {
    speaker: string;
    line: string;
}

/**
 * Maps scenario types to their mode loop functions.
 */

export class Director {
    private manager: GroupChatManager;
    private callbacks: DirectorCallbacks;
    private isRunning: boolean = false;
    private chaosLevel: number = 30;
    private currentScenario: Scenario | null = null;
    private interruptQueue: string[] = [];
    private inputPromise: { resolve: (text: string) => void, reject: (reason?: any) => void } | null = null;
    private memoryManager: MemoryManager | null = null;
    private broadcastChannel: BroadcastChannel | null = null;
    private comedySession: ComedySession | null = null;

    constructor(manager: GroupChatManager, callbacks: DirectorCallbacks, memoryManager?: MemoryManager) {
        this.manager = manager;
        this.callbacks = callbacks;
        this.memoryManager = memoryManager || null;
        // Hook up sync status callback directly if possible
        if (this.memoryManager) {
            const statusEl = document.getElementById("settings-status");
            if (statusEl) {
                this.memoryManager.setSyncStatusCallback((status: string) => { statusEl.textContent = status; });
            }
        }


        // Expose globally for UI controls
        (window as any).getDirector = () => this;

        try {
            if (typeof BroadcastChannel !== 'undefined') {
                this.broadcastChannel = new BroadcastChannel('jokesters_crosstab');
                this.broadcastChannel.onmessage = (event) => {
                    if (event.data && event.data.type === 'heckle' && event.data.text && this.isRunning) {
                        this.interruptQueue.push(`[FROM ANOTHER TAB]: ${event.data.text}`);
                    }
                };
            }
        } catch (e) {
            console.warn('BroadcastChannel not supported or failed to initialize:', e);
        }
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

    /**
     * Creates the shared ModeContext passed to all mode loop functions.
     */
    private createModeContext(): ModeContext {
        return {
            manager: this.manager,
            callbacks: this.callbacks,
            chaosLevel: this.chaosLevel,
            interruptQueue: this.interruptQueue,
            isRunning: () => this.isRunning,
            processTurn: (inputText: string) => this.processTurn(inputText),
            processScriptBeat: (beat: ScriptBeat) => this.processScriptBeat(beat),
            stopScene: () => this.stopScene(),
            waitForInput: () => this.waitForInput(),
            searchAndRecall: (topic: string) => this.searchAndRecall(topic),
            memoryManager: this.memoryManager,
            comedy: this.comedySession,
            recordCallbackVisual: (agentId: string, jokeId: string, count: number, status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead') => {
                if (this.callbacks.onCallbackRecorded) {
                    this.callbacks.onCallbackRecorded(agentId, jokeId, count, status);
                }
            },
        };
    }

    private initComedySession(scenario: Scenario): void {
        if (!isComedyEnabled(scenario.type, scenario.config)) {
            this.comedySession = null;
            return;
        }

        this.comedySession = new ComedySession({
            onCallbackVisual: (agentId, jokeId, count, status) => {
                if (this.callbacks.onCallbackRecorded) {
                    this.callbacks.onCallbackRecorded(agentId, jokeId, count, status);
                }
            },
        });
        this.comedySession.reset();
    }

    public async playScenario(scenario: Scenario) {
        if (!this.manager) {
            this.callbacks.onError('No manager available');
            return;
        }

        this.currentScenario = scenario;
        this.isRunning = true;
        this.interruptQueue = [];
        this.manager.resetConversation();

        this.callbacks.onMessage('System', `🎬 Starting ${scenario.type} scene: "${scenario.title}"`, '#4ecdc4');
        this.callbacks.onMessage('System', scenario.description, '#4ecdc4');

        if (scenario.config?.chaosLevel !== undefined) {
            this.chaosLevel = scenario.config.chaosLevel;
        }

        const modeDef = getMode(scenario.type);
        const sceneDepth = scenario.config?.contextDepth
            ?? (modeDef ? getDefaultContextDepthForCategory(modeDef.category) : null);
        this.manager.setSceneMemoryDepth(sceneDepth);

        this.initComedySession(scenario);

        try {
            const modeLoop = getModeLoop(scenario.type);
            if (modeLoop) {
                await modeLoop(scenario, this.createModeContext());
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
            config: { chaosLevel: this.chaosLevel }
        };
        await this.playScenario(scenario);
    }

    public stopScene() {
        if (this.isRunning) {
            this.isRunning = false;
            this.manager.clearSceneMemoryDepth();

            // Cancel any pending input
            if (this.inputPromise) {
                this.inputPromise.resolve(''); // Resolve with empty string instead of rejecting to avoid unhandled rejections
                this.inputPromise = null;
            }

            if (this.callbacks.musicControls) {
                this.callbacks.musicControls.stopBeat();
            }

            // Auto-save episode if meaningful content exists
            if (this.memoryManager && this.manager.getHistoryLength() > 2) {
                try {
                    const id = new Date().toISOString().replace(/[:.]/g, '-');
                    const history = this.manager.getHistory();

                    this.memoryManager.saveEpisode(id, {
                        timestamp: new Date().toISOString(),
                        history: history,
                        scenario: this.currentScenario
                    });

                    this.callbacks.onMessage('System', `💾 Episode auto-saved (ID: ${id})`, '#4ecdc4');
                } catch (e) {
                    console.error('Failed to auto-save episode:', e);
                }
            }

            this.callbacks.onSceneStop();
            if (this.callbacks.onMusicControl) {
                this.callbacks.onMusicControl('stop');
            }

            this.comedySession?.reset();
            this.comedySession = null;
        }
    }

    public async handleInterrupt(text: string) {
        if (!this.isRunning) return;

        console.log(`Director received interrupt: ${text}`);
        this.interruptQueue.push(text);
        this.callbacks.onMessage('System', `🗣️ Heckler detected: "${text}"`, '#ff6b6b');

        try {
            this.broadcastChannel?.postMessage({ type: 'heckle', text });
        } catch (e) {
            console.warn('Failed to broadcast heckle:', e);
        }

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

    private async processScriptBeat(beat: ScriptBeat): Promise<void> {
        try {
            await this.callbacks.onTurnStart(beat.speaker);

            const escapedLine = beat.line.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const prompt = `(SCRIPT PERFORMANCE: Deliver this scripted line authentically in your character's voice and style: "${escapedLine}" Make it natural, add flair if fits, but stay true to the line. 1-2 breaths max. ###)`;

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
        if (roll > 0.7) {
            return {
                type: 'punchline',
                maxTokens: 60,
                ttsSteps: 25,
                promptSuffix: ' (Reply with a single, joking sentence. Be very brief. No emojis.)'
            };
        } else if (roll > 0.2) {
            return {
                type: 'standard',
                maxTokens: 150,
                ttsSteps: 16,
                promptSuffix: ' (Keep the conversation flowing. 1-2 sentences.)'
            };
        } else {
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

            await this.callbacks.onTurnStart(currentAgent.id);

            let pacing = this.calculatePacing();
            let effectivePrompt = inputText;

            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift();
                this.callbacks.onMessage('Heckler', `"${heckle}"`, '#ff0000');
                effectivePrompt = `(HECKLER INTERRUPT: A heckler just shouted: "${heckle}". React to this immediately! Ignore the previous topic for a moment.)`;

                pacing = {
                    type: 'punchline',
                    maxTokens: 80,
                    ttsSteps: 20,
                    promptSuffix: ' (Roast the heckler!)'
                };
            }

            effectivePrompt += pacing.promptSuffix + ' ###';

            if (this.comedySession) {
                const callbackPrompt = this.comedySession.maybeInjectCallbackPrompt(0.3);
                if (callbackPrompt) {
                    effectivePrompt += ` ${callbackPrompt}`;
                }
            }

            const characterSpeeds: Record<string, number> = {
                'comedian': 1.5,
                'philosopher': 0.6,
                'scientist': 1.0
            };

            const userSeed = this.callbacks.getSeed ? this.callbacks.getSeed() : undefined;
            const turnSeed = userSeed !== undefined ? userSeed + this.manager.getHistoryLength() : undefined;

            let responseText = '';
            await this.manager.chat(effectivePrompt, async (sentence) => {
                responseText += `${sentence} `;
                await this.callbacks.onSpeak(sentence, currentAgent.id, {
                    steps: pacing.ttsSteps,
                    speed: characterSpeeds[currentAgent.id] || 1.0,
                    seed: turnSeed
                });
            }, { maxTokens: pacing.maxTokens, seed: turnSeed });

            if (this.comedySession && responseText.trim()) {
                this.comedySession.handleAgentResponse(responseText.trim(), currentAgent.id);
            }

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
            const results = await this.memoryManager.searchLocalEpisodes(topic);
            const fetchedResults = await this.memoryManager.searchFetchedSummaries(topic);
            const allResults = [...results, ...fetchedResults].slice(0, 3);

            if (allResults.length > 0) {
                const snippets = allResults.map(r => `(Episode ${r.episodeId}): ${r.snippet}`).join('\n');
                return `(MEMORY RECALL: You vaguely remember discussing "${topic}" before. Reference these past moments if relevant:\n${snippets})`;
            }
        } catch (e) {
            console.warn('Memory search failed:', e);
        }
        return null;
    }
}
