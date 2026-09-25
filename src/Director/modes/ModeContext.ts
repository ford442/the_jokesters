import type { GroupChatManager } from '../../GroupChatManager';
import type { DirectorCallbacks, Scenario, ScriptBeat } from '../Director';
import type { MemoryManager } from '../MemoryManager';
import type { ComedySession } from '../../comedy/ComedySession';
import type { SceneAct } from '../sceneArc';
import type { AgentRelationship, EpisodeBeat } from '../productionCard';

/**
 * Shared context passed to all mode loop functions.
 */
export interface ModeContext {
    manager: GroupChatManager;
    callbacks: DirectorCallbacks;
    chaosLevel: number;
    interruptQueue: string[];
    isRunning: () => boolean;
    processTurn: (inputText: string) => Promise<void>;
    processScriptBeat: (beat: ScriptBeat) => Promise<void>;
    stopScene: () => void;
    waitForInput: () => Promise<string>;
    searchAndRecall: (topic: string) => Promise<string | null>;
    memoryManager: MemoryManager | null;
    /** Scene comedy memory — callbacks + quality gate. Null when mode opts out. */
    comedy: ComedySession | null;
    /** Record a callback for visual feedback - triggers Actor visual effects */
    recordCallbackVisual: (agentId: string, jokeId: string, count: number, status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead') => void;
    /** Heuristic scene-arc update after a turn's text is finalized (see src/Director/sceneArc.ts). No-op if the scene has no arc. */
    recordSceneBeat: (agentId: string, text: string) => void;
    /** Current act's prompt fragment (recall running gags, or close-act tag guidance) — null if nothing to inject yet. */
    getArcPromptInjection: () => string | null;
    /** Current scene act (drives per-turn comedy sampling). Optional so lightweight test contexts can omit it. */
    getSceneAct?: () => SceneAct | null;
    /**
     * Compiled production-card hiddenInstruction for this agent (beat, relationships, own secrets,
     * guest) — see src/Director/productionPrompt.ts. Optional so lightweight test contexts can omit it.
     */
    getProductionInstruction?: (agentId: string) => string | undefined;
    /** Scene production card controls (episode beats etc.). Optional for lightweight test contexts. */
    production?: ProductionControls;
}

export interface ProductionControls {
    /** Beat for the next turn, or null when the scene has no card. */
    getBeat: () => EpisodeBeat | null;
    /** Declare the loop's real turn budget (re-derives cold open / tag timing and the arc's budget). */
    setTurnBudget: (turns: number | null) => void;
    /** Seed mode-default relationships; ignored when the user already supplied some. */
    ensureRelationships: (defaults: AgentRelationship[]) => void;
}

export type ModeLoop = (scenario: Scenario, ctx: ModeContext) => Promise<void>;
