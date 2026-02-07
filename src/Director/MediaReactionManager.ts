
export interface ReactionTrigger {
    timestamp: number;
    prompt: string;
    agentId?: string;
    executed: boolean;
}

export class MediaReactionManager {
    private triggers: ReactionTrigger[] = [];

    constructor(triggers: ReactionTrigger[] = []) {
        this.loadTriggers(triggers);
    }

    public loadTriggers(triggers: ReactionTrigger[]) {
        // Deep copy to reset state if needed
        this.triggers = triggers.map(t => ({ ...t, executed: false }));
        // Sort by timestamp for efficiency
        this.triggers.sort((a, b) => a.timestamp - b.timestamp);
    }

    public checkTriggers(currentTime: number): ReactionTrigger | null {
        // Find the first unexecuted trigger that is due
        const trigger = this.triggers.find(t => !t.executed && currentTime >= t.timestamp);

        if (trigger) {
            trigger.executed = true;
            return trigger;
        }

        return null;
    }

    public getPendingTriggers(): ReactionTrigger[] {
        return this.triggers.filter(t => !t.executed);
    }
}
