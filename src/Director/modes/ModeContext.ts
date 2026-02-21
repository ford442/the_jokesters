import type { GroupChatManager } from '../../GroupChatManager';
import type { DirectorCallbacks, Scenario, ScriptBeat } from '../Director';
import type { MemoryManager } from '../MemoryManager';

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
}

export type ModeLoop = (scenario: Scenario, ctx: ModeContext) => Promise<void>;
