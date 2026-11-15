import type { GroupChatManager } from '../GroupChatManager';
import type { ReactionTrigger } from './MediaReactionManager';
import type { MemoryManager } from './MemoryManager';
import type { ModeContext } from './modes/ModeContext';
import { ComedySession } from '../comedy/ComedySession';
import { isComedyEnabled } from './modeConfig';
import { loadModeLoop, getMode } from './modes/registry';
import type { RegisteredModeId } from './modes/registry';
import { getContextDepthForMode } from '../config/contextDepth';
import type { MemoryHint } from '../config/contextDepth';
import { buildEpisodeFromHistory, setLastEpisode, SCENE_ARC_SCHEMA_VERSION } from '../episode';
import type { JokestersEpisode } from '../episode';
import type { AudienceFeedbackEvent } from '../comedy/audienceFeedback';
import type { ShowCue } from '../audio/showCues';
import {
    createSceneArc,
    updateSceneArc,
    advanceSceneAct,
    buildArcPromptInjection,
    estimateSceneTurnBudget,
} from './sceneArc';
import type { SceneArcState } from './sceneArc';
import { isVicunaModel } from '../chat/speakableText';
import {
    arcEmotionTag,
    consumeGenreFlip,
    createProductionCard,
    guestVoiceStyle,
    isGuestSpeaker,
    isGuestTurn,
    recordProductionTurn,
    setGenreShift,
    setProductionTurnBudget,
    withDefaultRelationships,
    snapshotProductionCard,
} from './productionCard';
import type { AgentRelationship, ProductionCard, ProductionCardInput } from './productionCard';
import { compileProductionInstruction, buildGuestAgent, BEAT_LABELS } from './productionPrompt';
import { extractDirectorTags } from '../visuals/actorAnimations';
import type { SupertonicStyleId } from '../audio/voiceMap';
import type { Agent } from '../types/chat';
import { resolveScenarioStageKit, type StageKitId } from '../visuals/stageKitIds';
import { takePropCues } from '../visuals/propTokens';
import type { PropAction } from '../visuals/propCatalog';

/** What the stage needs to seat the temporary sixth speaker. */
export interface GuestStageInfo {
    id: string;
    name: string;
    color: string;
    voiceStyle: SupertonicStyleId;
}

/**
 * A line's reaction text: the arc's `[clip]` tag first so it beats keyword guesses, unless the
 * line carries its own explicit director tag (the more specific signal wins).
 */
function withArcEmotion(text: string, arcTag: string | null): string {
    if (!arcTag || extractDirectorTags(text).clips.length > 0) return text;
    return `${arcTag} ${text}`;
}

export interface DirectorCallbacks {
    onMessage: (sender: string, message: string, color: string) => void;
    onTicker?: (text: string) => void;
    onSpeak: (sentence: string, agentId: string, options: { steps?: number; seed?: number; speed?: number }) => Promise<void>;
    onTurnStart: (agentId: string) => Promise<void>;
    onTurnEnd: () => Promise<void>;
    onError: (error: any) => void;
    onSceneStop: () => void;
    /** A scene is starting (title card for recorded clips, etc.). */
    onSceneStart?: (info: { title: string; type: string }) => void;
    getSeed: () => number | undefined;
    onMusicControl?: (action: 'start' | 'stop', bpm?: number) => void;
    /** Show music stinger at a structural beat: cold open, act break, tag (see src/audio/showCues.ts). */
    onShowCue?: (cue: ShowCue) => void;
    /** A persona guest (sixth speaker) walked on: add their actor and voice. Not called for costume guests. */
    onGuestEnter?: (guest: GuestStageInfo) => void;
    /** The persona guest left (or the scene ended): drop their actor and voice. */
    onGuestExit?: (guestId: string) => void;
    /** Avatar thinking pose while LLM generates */
    onThinking?: (agentId: string, thinking: boolean) => void;
    /** Map utterance text to avatar reaction clips */
    onReactToText?: (agentId: string, text: string) => void;
    /** Play a director-injected SFX cue (e.g. "explosion" from SFX:explosion) without speaking it */
    onSfx?: (name: string, agentId?: string) => void;
    /** Mount a stage kit for this scene. `void` unloads the set and disposes it. */
    onStageKit?: (kitId: StageKitId) => void;
    /** Show or hide a whitelisted prop (PROP:mug / [prop:mug:hide]). Unknown names are not forwarded. */
    onProp?: (name: string, action: PropAction, agentId?: string) => void;
    /** Called when a callback/running gag is recorded for visual feedback */
    onCallbackRecorded?: (agentId: string, jokeId: string, count: number, status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead') => void;
    /** Quality-scored audience mesh + SFX reaction (see src/comedy/audienceFeedback.ts). Rate-limiting is the implementation's job, not the caller's. */
    onAudienceReaction?: (event: AudienceFeedbackEvent) => void;
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
    /**
     * Stage kit for this scene. Overrides registry `stageKit`.
     * Unknown ids resolve to `void` (bare stage) and do not fall through.
     */
    stageKit?: string;
    config?: {
        apocalypseType?: string;
        hauntedFeature?: string;
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
        weatherDisaster?: string;
        courtCase?: string;
        /** Set dressing override. Unknown ids resolve to void. */
        stageKit?: string;
        gameShowTopic?: string;
        breakingNews?: string;
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
        /** Production card content (relationships / secret objectives / guest NPC) — see productionCard.ts. */
        production?: ProductionCardInput;
    };
}

export interface ScriptBeat {
    speaker: string;
    line: string;
}


/** One `playScenario` invocation. */
interface SceneRun {
    id: number;
    /** Aborted when the run is stopped or superseded. Exposed to modes as `ctx.signal`. */
    controller: AbortController;
    /** Resolves when the run's `playScenario` call has fully returned. */
    settled: Promise<void>;
}

/** How long a restart waits for the previous mode loop to unwind before starting anyway. */
const PREVIOUS_RUN_SETTLE_MS = 3000;

function settleWithin(p: Promise<void>, ms: number): Promise<void> {
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, ms);
        void p.finally(() => { clearTimeout(timer); resolve(); });
    });
}

/**
 * Maps scenario types to their mode loop functions.
 */

export class Director {
    private manager: GroupChatManager;
    private callbacks: DirectorCallbacks;
    private isRunning: boolean = false;
    /**
     * The scene run that owns the stage right now. Every `playScenario` gets a
     * fresh run; a mode loop's `ModeContext` is bound to its run, so a loop
     * that outlives a stop → restart sees `isRunning() === false`, its
     * `stopScene()` is a no-op, and its turns are dropped instead of leaking
     * into (or killing) the new scene.
     */
    private activeRun: SceneRun | null = null;
    private runSeq = 0;
    private chaosLevel: number = 30;
    private currentScenario: Scenario | null = null;
    private interruptQueue: string[] = [];
    private inputPromise: { resolve: (text: string) => void, reject: (reason?: any) => void } | null = null;
    private memoryManager: MemoryManager | null = null;
    private broadcastChannel: BroadcastChannel | null = null;
    private comedySession: ComedySession | null = null;
    /** Short rolling scene-arc summary — see src/Director/sceneArc.ts. Null before/after a scene. */
    private sceneArc: SceneArcState | null = null;
    /** Dramatic layer (episode beat, relationships, secrets, guest) — see src/Director/productionCard.ts. */
    private productionCard: ProductionCard | null = null;
    /** Persona guest currently on stage (sixth speaker). Never part of the five-agent rotation. */
    private guestAgent: Agent | null = null;
    /** Persona guest that appeared this scene, kept after exit so the episode roster can name them. */
    private guestRoster: Agent | null = null;
    /** True while `processTurn` is generating / playing a line (the guest's exit waits for it). */
    private turnInFlight = false;
    private guestExitPending = false;
    /** Registered by whichever controller owns the prerender queue (see setPrerenderInvalidator). */
    private prerenderInvalidator: (() => void) | null = null;
    /** Registered by the episode export UI (see setEpisodeReadyHandler). */
    private episodeReadyHandler: ((episode: JokestersEpisode) => void) | null = null;

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

    /** Stops any live scene and closes the cross-tab channel. Idempotent. */
    public dispose(): void {
        this.stopScene();
        this.activeRun?.controller.abort();
        this.broadcastChannel?.close();
        this.broadcastChannel = null;
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
     * Registered by whichever controller owns the LLM/TTS prerender queue (currently
     * improvController's PrerenderCoordinator). Called on stopScene() to invalidate
     * in-flight prerendered turns — Director never imports the prerender module directly.
     */
    public setPrerenderInvalidator(fn: (() => void) | null): void {
        this.prerenderInvalidator = fn;
    }

    /**
     * Registered by the episode export UI so Director can hand off a freshly
     * auto-saved episode without importing app-layer UI code.
     */
    public setEpisodeReadyHandler(fn: ((episode: JokestersEpisode) => void) | null): void {
        this.episodeReadyHandler = fn;
    }

    /** Current rolling scene-arc snapshot, or null before a scene starts / after it stops. */
    public getSceneArc(): SceneArcState | null {
        return this.sceneArc;
    }

    /**
     * Apply a memory-hint-compatible arc action (currently only 'advance_act' affects the
     * arc; depth hints like zoom_in/zoom_out/recall are handled by GroupChatManager instead).
     */
    public applyArcMemoryHint(hint: MemoryHint): void {
        if (hint === 'advance_act' && this.sceneArc) {
            const before = this.sceneArc.act;
            this.sceneArc = advanceSceneAct(this.sceneArc);
            if (this.sceneArc.act !== before && this.productionCard?.beat !== 'tag') this.callbacks.onShowCue?.('act_break');
        }
    }

    /** Current production card, or null before a scene starts / after it stops. */
    public getProductionCard(): ProductionCard | null {
        return this.productionCard;
    }

    /** Heuristic scene-arc + production update after a turn's text is finalized. No-op without an active arc. */
    private recordSceneBeat(agentId: string, text: string): void {
        if (!text.trim()) return;
        const actBefore = this.sceneArc?.act;
        let cued = false;
        if (this.sceneArc) {
            this.sceneArc = updateSceneArc(this.sceneArc, { agentId, text });
        }
        if (this.productionCard) {
            const result = recordProductionTurn(this.productionCard, agentId, text);
            this.productionCard = result.card;
            if (result.beatChanged) {
                this.onProductionBeatChanged();
                cued = true;
            } else if (this.productionCard.beat === 'tag') this.forceArcClose();
            if (result.guestEntered) this.onGuestEntered();
            if (result.guestExited) this.onGuestExited();
            if (result.genreFlipped) {
                this.announceGenreShift();
                // One sting per flip: a cold open / tag cue already fired this turn owns the moment.
                if (!cued) {
                    this.callbacks.onShowCue?.('act_break');
                    cued = true;
                }
            }
            for (const id of result.secretsAchieved) {
                // Deliberately never names the goal — the objective stays secret.
                this.callbacks.onMessage('Director', `🤫 ${this.agentName(id)} is up to something…`, '#888');
            }
        }
        // The arc moving into a new act is an act break, unless a production beat already got its own cue.
        if (!cued && this.sceneArc && actBefore && this.sceneArc.act !== actBefore && this.productionCard?.beat !== 'tag') {
            this.callbacks.onShowCue?.('act_break');
        }
    }

    private agentName(agentId: string): string {
        if (this.guestAgent?.id === agentId) return this.guestAgent.name;
        return this.manager.getAgents().find((a) => a.id === agentId)?.name ?? agentId;
    }

    private announceGenreShift(): void {
        const genre = this.productionCard?.genreShift?.genre;
        if (!genre) return;
        this.callbacks.onMessage('Director', `🎞️ GENRE SHIFT: ${genre}`, '#888');
        this.callbacks.onTicker?.(`🎞️ ${genre}`);
    }

    /** The guest walked on. Persona guests get a real seat (manager + stage actor); costumes just announce. */
    private onGuestEntered(): void {
        const guest = this.productionCard?.guestNpc;
        if (!guest) return;
        this.callbacks.onMessage('Director', `🚪 Guest enters: ${guest.name}`, '#888');
        if (!isGuestSpeaker(guest)) return;
        const agent = buildGuestAgent(guest);
        this.guestAgent = agent;
        this.guestRoster = agent;
        this.manager.setGuestAgent(agent);
        this.callbacks.onGuestEnter?.({ id: agent.id, name: agent.name, color: agent.color, voiceStyle: guestVoiceStyle(guest) });
    }

    /**
     * The guest is due to leave. Inside `processTurn` the beat is recorded *before* the line has
     * finished playing, so the walk-off waits for `flushGuestExit` — otherwise the actor would
     * vanish (and the mouth stop) mid-sentence when the exit lands on the guest's own turn.
     */
    private onGuestExited(): void {
        if (this.turnInFlight) {
            this.guestExitPending = true;
            return;
        }
        this.completeGuestExit();
    }

    private flushGuestExit(): void {
        if (!this.guestExitPending) return;
        this.guestExitPending = false;
        this.completeGuestExit();
    }

    private completeGuestExit(): void {
        const guest = this.productionCard?.guestNpc;
        if (guest) this.callbacks.onMessage('Director', `🚪 Guest exits: ${guest.name}`, '#888');
        this.dropGuest();
    }

    /** Remove the persona guest from the manager and the stage. Idempotent. */
    private dropGuest(): void {
        if (!this.guestAgent) return;
        const id = this.guestAgent.id;
        this.guestAgent = null;
        this.manager.setGuestAgent(null);
        this.callbacks.onGuestExit?.(id);
    }

    /** Tag beat rides the arc's close-act path so the button carries a callback. */
    private forceArcClose(): void {
        while (this.sceneArc && this.sceneArc.act !== 'close') {
            this.sceneArc = advanceSceneAct(this.sceneArc);
        }
    }

    private onProductionBeatChanged(): void {
        if (!this.productionCard) return;
        const beat = this.productionCard.beat;
        if (beat === 'tag') this.forceArcClose();
        this.callbacks.onMessage('Director', BEAT_LABELS[beat], '#888');
        this.callbacks.onTicker?.(BEAT_LABELS[beat]);
        // cold open → theme, tag → button. Entering the main sketch is not a cue of its own: the
        // theme just played, and the arc's open→middle act break (see recordSceneBeat) is the bumper.
        if (beat === 'cold_open') this.callbacks.onShowCue?.('cold_open');
        else if (beat === 'tag') this.callbacks.onShowCue?.('tag');
    }

    private setSceneTurnBudget(turns: number | null): void {
        if (!this.productionCard) return;
        const before = this.productionCard.beat;
        const wasFresh = this.productionCard.turnCount === 0;
        this.productionCard = setProductionTurnBudget(this.productionCard, turns);
        if (this.sceneArc) {
            this.sceneArc = { ...this.sceneArc, estimatedTurns: turns && turns > 0 ? turns : null };
        }
        // A scene that hadn't started yet only announces a newly-gained cold open, not "main".
        if (this.productionCard.beat !== before && (!wasFresh || this.productionCard.beat === 'cold_open')) {
            this.onProductionBeatChanged();
        }
    }

    /**
     * Set the scene's genre shift (mode hook; a later `#307` vote writes the same card field).
     * Only the card changes — scene-arc memory (beats, running gags, act) is left exactly as is.
     * If the shift is already due, it fires immediately; otherwise on the turn it begins.
     */
    private setSceneGenreShift(genre: string, atTurn: number): void {
        if (!this.productionCard) return;
        const { card, flipped } = consumeGenreFlip(setGenreShift(this.productionCard, genre, atTurn));
        this.productionCard = card;
        if (!flipped) return;
        this.announceGenreShift();
        if (card.beat !== 'tag') this.callbacks.onShowCue?.('act_break');
    }

    /** Compiled per-agent production hiddenInstruction (single compiler: productionPrompt.ts). */
    private getProductionInstruction(agentId: string): string | undefined {
        if (!this.productionCard) return undefined;
        const closeAct = this.sceneArc?.act === 'close' ? buildArcPromptInjection(this.sceneArc) : null;
        return compileProductionInstruction(this.productionCard, agentId, {
            nameOf: (id) => this.agentName(id),
            closeActInstruction: closeAct,
            act: this.sceneArc?.act ?? null,
        });
    }

    /**
     * Creates the shared ModeContext passed to all mode loop functions.
     */
    /** True while `run` is the live scene (not stopped, not superseded). */
    private isRunActive(run: SceneRun | null): boolean {
        return !!run && this.isRunning && this.activeRun === run && !run.controller.signal.aborted;
    }

    private createModeContext(run: SceneRun): ModeContext {
        return {
            manager: this.manager,
            callbacks: this.callbacks,
            chaosLevel: this.chaosLevel,
            interruptQueue: this.interruptQueue,
            isRunning: () => this.isRunActive(run),
            signal: run.controller.signal,
            processTurn: (inputText: string) => this.processTurn(inputText, run),
            processScriptBeat: (beat: ScriptBeat) =>
                (this.isRunActive(run) ? this.processScriptBeat(beat) : Promise.resolve()),
            stopScene: () => this.stopScene(run.id),
            waitForInput: () => (this.isRunActive(run) ? this.waitForInput() : Promise.resolve('')),
            searchAndRecall: (topic: string) => this.searchAndRecall(topic),
            memoryManager: this.memoryManager,
            comedy: this.comedySession,
            recordCallbackVisual: (agentId: string, jokeId: string, count: number, status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead') => {
                if (this.callbacks.onCallbackRecorded) {
                    this.callbacks.onCallbackRecorded(agentId, jokeId, count, status);
                }
            },
            recordSceneBeat: (agentId: string, text: string) => this.recordSceneBeat(agentId, text),
            getArcPromptInjection: () => (this.sceneArc ? buildArcPromptInjection(this.sceneArc) : null),
            getSceneAct: () => this.sceneArc?.act ?? null,
            getProductionInstruction: (agentId: string) => this.getProductionInstruction(agentId),
            getArcEmotionTag: (agentId: string) =>
                (this.productionCard ? arcEmotionTag(this.productionCard, agentId, this.sceneArc?.act) : null),
            production: {
                getBeat: () => this.productionCard?.beat ?? null,
                setTurnBudget: (turns: number | null) => this.setSceneTurnBudget(turns),
                ensureRelationships: (defaults: AgentRelationship[]) => {
                    if (this.productionCard) {
                        this.productionCard = withDefaultRelationships(this.productionCard, defaults);
                    }
                },
                setGenreShift: (genre: string, atTurn: number) => this.setSceneGenreShift(genre, atTurn),
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

        // Claim the stage first: any earlier run (or an earlier playScenario still
        // in its async preamble) is now stale.
        const previous = this.activeRun;
        let settle!: () => void;
        const run: SceneRun = {
            id: ++this.runSeq,
            controller: new AbortController(),
            settled: new Promise<void>((resolve) => { settle = resolve; }),
        };
        this.activeRun = run;
        try {
            await this.playRun(scenario, run, previous);
        } finally {
            settle();
        }
    }

    private async playRun(scenario: Scenario, run: SceneRun, previous: SceneRun | null): Promise<void> {
        if (previous) {
            // Stop the old scene (runs its save/teardown) and let its loop unwind
            // before the new scene resets shared conversation state.
            this.endScene(previous);
            await settleWithin(previous.settled, PREVIOUS_RUN_SETTLE_MS);
            if (this.activeRun !== run || run.controller.signal.aborted) return; // superseded/stopped while waiting
        }

        this.currentScenario = scenario;
        if (this.memoryManager) { await this.memoryManager.fetchPreviousEpisodeSummaries(scenario.title).catch(e => console.error("Failed to fetch previous summaries:", e)); }
        if (this.activeRun !== run || run.controller.signal.aborted) return; // superseded/stopped during the preamble
        this.isRunning = true;
        this.interruptQueue = [];
        this.manager.resetConversation();
        this.guestAgent = null;
        this.guestRoster = null;
        this.guestExitPending = false;

        this.callbacks.onMessage('System', `🎬 Starting ${scenario.type} scene: "${scenario.title}"`, '#4ecdc4');
        this.callbacks.onMessage('System', scenario.description, '#4ecdc4');

        if (scenario.config?.chaosLevel !== undefined) {
            this.chaosLevel = scenario.config.chaosLevel;
        }

        const modeDef = getMode(scenario.type);
        this.callbacks.onSceneStart?.({ title: scenario.title, type: String(scenario.type) });
        this.callbacks.onStageKit?.(resolveScenarioStageKit(scenario, modeDef ?? null));
        const sceneDepth = scenario.config?.contextDepth
            ?? (modeDef ? getContextDepthForMode(modeDef) : null);
        this.manager.setSceneMemoryDepth(sceneDepth);

        this.initComedySession(scenario);
        const turnBudget = estimateSceneTurnBudget(modeDef);
        this.sceneArc = createSceneArc(scenario.title || scenario.description || scenario.type, turnBudget);
        this.productionCard = createProductionCard(turnBudget, scenario.config?.production);
        if (this.productionCard.beat === 'cold_open') this.onProductionBeatChanged();
        if (this.productionCard.guestEntered) this.onGuestEntered();

        try {
            const modeLoop = await loadModeLoop(scenario.type);
            if (this.activeRun !== run) return;
            if (modeLoop) {
                await modeLoop(scenario, this.createModeContext(run));
                this.stopScene(run.id);
            } else {
                this.callbacks.onError(`Mode ${scenario.type} not implemented yet.`);
                this.stopScene(run.id);
            }
        } catch (error) {
            // A stale loop's failure belongs to a scene that is already over.
            if (this.activeRun !== run) return;
            this.callbacks.onError(error);
            this.stopScene(run.id);
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

    /**
     * Stops the live scene. With a `runId`, only stops if that run is still the
     * live one — a stale mode loop finishing late can no longer kill a newer
     * scene. Without one (UI stop button), stops whatever is running.
     */
    public stopScene(runId?: number) {
        const run = this.activeRun;
        if (runId !== undefined && run?.id !== runId) return;
        this.endScene(run);
    }

    /** Fences `run` off (aborts its signal) and, if a scene is live, tears it down (auto-save etc.). */
    private endScene(run: SceneRun | null) {
        run?.controller.abort();
        if (this.isRunning) {
            this.isRunning = false;
            this.manager.clearSceneMemoryDepth();

            // Cancel any pending input
            if (this.inputPromise) {
                this.inputPromise.resolve(''); // Resolve with empty string instead of rejecting to avoid unhandled rejections
                this.inputPromise = null;
            }

            // Invalidate dialog prerender + TTS cache on scene stop / mode change
            try {
                this.prerenderInvalidator?.();
            } catch { /* optional */ }

            if (this.callbacks.musicControls) {
                this.callbacks.musicControls.stopBeat();
            }

            // Auto-save episode if meaningful content exists
            if (this.memoryManager && this.manager.getHistoryLength() > 2) {
                try {
                    const id = new Date().toISOString().replace(/[:.]/g, '-');
                    const history = this.manager.getHistory();

                    // Legacy history blob (cloud / MemoryManager compatibility).
                    // saveEpisode stamps its own timestamp/updatedAt (Date.now()), so none is passed here.
                    this.memoryManager.saveEpisode(id, {
                        history: history,
                        scenario: this.currentScenario
                    });

                    // Portable transcript for export / Director's Cut replay
                    // The guest is not in the manager's roster; name them if they spoke so replay can too.
                    const agents = this.guestRoster && history.some((m) => m.guestId)
                        ? [...this.manager.getAgents(), this.guestRoster]
                        : this.manager.getAgents();
                    const episode = buildEpisodeFromHistory({
                        history,
                        agents,
                        modelId: this.manager.getLoadedModelId(),
                        episodeId: id,
                        sceneState: {
                            title: this.currentScenario?.title,
                            description: this.currentScenario?.description,
                            mode: this.currentScenario?.type,
                            chaosLevel: this.chaosLevel,
                            sceneArc: this.sceneArc ? {
                                version: SCENE_ARC_SCHEMA_VERSION,
                                premise: this.sceneArc.premise,
                                act: this.sceneArc.act,
                                turnCount: this.sceneArc.turnCount,
                                estimatedTurns: this.sceneArc.estimatedTurns,
                                runningGags: this.sceneArc.runningGags,
                                beats: this.sceneArc.beats,
                            } : undefined,
                            production: this.productionCard ? snapshotProductionCard(this.productionCard) : undefined,
                        },
                    });
                    setLastEpisode(episode);
                    if (this.memoryManager && history.length > 0) {
                        const scriptBeats = history.map(m => ({ speaker: m.role, line: m.content }));
                        this.memoryManager.saveEpisodeScriptToCloud(scriptBeats, id).catch(e => console.error('Failed to save episode script to cloud:', e));
                    }
                    this.episodeReadyHandler?.(episode);

                    this.callbacks.onMessage('System', `💾 Episode auto-saved (ID: ${id}) — export ready`, '#4ecdc4');
                } catch (e) {
                    console.error('Failed to auto-save episode:', e);
                }
            }

            // Persona guest and their stage actor do not outlive the scene.
            this.guestExitPending = false;
            this.dropGuest();
            this.guestRoster = null;

            this.callbacks.onStageKit?.('void');
            this.callbacks.onSceneStop();
            if (this.callbacks.onMusicControl) {
                this.callbacks.onMusicControl('stop');
            }

            this.comedySession?.reset();
            this.comedySession = null;
            this.sceneArc = null;
            this.productionCard = null;
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
            void this.handleInterrupt(text);
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
        const punchlineTokens = isVicunaModel(this.manager.getLoadedModelId()) ? 96 : 60;
        if (roll > 0.7) {
            return {
                type: 'punchline',
                maxTokens: punchlineTokens,
                ttsSteps: 25,
                promptSuffix: ' (Reply with a single, joking sentence. Be very brief. Reply with a full English sentence.)'
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

    private async processTurn(inputText: string, run: SceneRun | null = this.activeRun) {
        if (!this.manager || !this.isRunActive(run)) return;

        try {
            // A persona guest takes the floor on their entrance and every Nth turn after; the
            // five-agent rotation does not advance for those turns.
            this.turnInFlight = true;
            const guestTurn = !!this.guestAgent && !!this.productionCard && isGuestTurn(this.productionCard);
            const currentAgent = guestTurn && this.guestAgent ? this.guestAgent : this.manager.getCurrentAgent();
            const arcTag = this.productionCard ? arcEmotionTag(this.productionCard, currentAgent.id, this.sceneArc?.act) : null;

            await this.callbacks.onTurnStart(currentAgent.id);
            if (!this.isRunActive(run)) { this.turnInFlight = false; return; }
            this.callbacks.onThinking?.(currentAgent.id, true);

            let pacing = this.calculatePacing();
            let effectivePrompt = inputText;

            // Director-only prop cues (PROP:mug / [prop:mug:hide]) — not spoken, whitelist only.
            const propPass = takePropCues(effectivePrompt);
            if (propPass.cues.length && this.callbacks.onProp) {
                for (const cue of propPass.cues) {
                    this.callbacks.onProp(cue.name, cue.action, currentAgent.id);
                }
            }
            effectivePrompt = propPass.cleanText;

            // Director-only SFX cues embedded as "SFX:name" (not spoken)
            const directorSfx = effectivePrompt.match(/\bSFX:([a-zA-Z0-9_-]+)\b/gi);
            if (directorSfx && this.callbacks.onSfx) {
                for (const token of directorSfx) {
                    const name = token.replace(/^SFX:/i, '');
                    this.callbacks.onSfx(name, currentAgent.id);
                }
                effectivePrompt = effectivePrompt.replace(/\bSFX:[a-zA-Z0-9_-]+\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
            }

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

            if (this.sceneArc) {
                const arcPrompt = buildArcPromptInjection(this.sceneArc);
                if (arcPrompt) {
                    effectivePrompt += ` ${arcPrompt}`;
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
            let reacted = false;
            const onSentence = async (sentence: string) => {
                if (!this.isRunActive(run)) return; // never speak a stale scene's lines
                if (responseText.length === 0) {
                    this.callbacks.onThinking?.(currentAgent.id, false);
                }
                if (!reacted) {
                    this.callbacks.onReactToText?.(currentAgent.id, withArcEmotion(sentence, arcTag));
                    reacted = true;
                }
                responseText += `${sentence} `;
                await this.callbacks.onSpeak(sentence, currentAgent.id, {
                    steps: pacing.ttsSteps,
                    speed: characterSpeeds[currentAgent.id] || 1.0,
                    seed: turnSeed
                });
            };
            const chatOptions = {
                maxTokens: pacing.maxTokens,
                seed: turnSeed,
                hiddenInstruction: this.getProductionInstruction(currentAgent.id),
            };
            if (guestTurn) {
                await this.manager.chatForAgent(currentAgent.id, effectivePrompt, onSentence, chatOptions);
            } else {
                await this.manager.chat(effectivePrompt, onSentence, chatOptions);
            }
            // Stopped or superseded mid-generation: don't score/record into whatever runs now.
            if (!this.isRunActive(run)) { this.turnInFlight = false; return; }

            this.callbacks.onThinking?.(currentAgent.id, false);
            if (!reacted && responseText.trim()) {
                this.callbacks.onReactToText?.(currentAgent.id, withArcEmotion(responseText, arcTag));
            }

            if (this.comedySession && responseText.trim()) {
                this.comedySession.handleAgentResponse(responseText.trim(), currentAgent.id);
            }
            this.recordSceneBeat(currentAgent.id, responseText.trim());

            await this.callbacks.onTurnEnd();
            this.turnInFlight = false;
            this.flushGuestExit();

        } catch (error) {
            console.error('Turn Error:', error);
            this.turnInFlight = false;
            if (!this.isRunActive(run)) return; // stale turn: its scene is already over
            this.callbacks.onError(error);
            this.stopScene(run?.id);
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
