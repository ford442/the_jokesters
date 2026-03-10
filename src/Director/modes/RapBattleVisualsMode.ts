import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runRapBattleVisualsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '🎤 RAP BATTLE: Drop the beat!', '#ff00ff');

    // Start music loop
    if (ctx.callbacks.musicControls) {
        ctx.callbacks.musicControls.startBeat(100);
    }

    const battlers = ['comedian', 'philosopher', 'scientist'];

    while (ctx.isRunning()) {
        for (const agent of battlers) {
            if (!ctx.isRunning()) break;

            if (ctx.interruptQueue.length > 0) {
                const heckle = ctx.interruptQueue.shift()!;
                ctx.callbacks.onMessage('Crowd', heckle, '#ff6b6b');
                await ctx.processTurn(`(CROWD HECKLE: "${heckle}". Rap a comeback to the crowd before your verse!)`);
                continue;
            }

            ctx.callbacks.onTurnStart(agent);

            // Visual flair for the active rapper
            ctx.callbacks.onMessage('Director', `🔥 ${agent.toUpperCase()} IS ON THE MIC 🔥`, '#ff00ff');

            await ctx.manager.chatForAgent(agent, `(RAP BATTLE: You are in a freestyle rap battle against the other agents. Drop a sick, rhyming 4-line verse. Make it punchy, rhythmic, and perfectly in character. DO NOT use emojis. DO NOT output stage directions. Just the lyrics.)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));

            await ctx.callbacks.onTurnEnd();

            // Simulate crowd reaction based on a random roll
            const hype = Math.random();
            if (hype > 0.8) {
                ctx.callbacks.onMessage('Crowd', '🔥🔥 OOOOOOOOH! 🔥🔥', '#ff9900');
            } else if (hype < 0.2) {
                ctx.callbacks.onMessage('Crowd', '🥶 crickets... 🥶', '#00ffff');
            }
        }
    }

    if (ctx.callbacks.musicControls) {
        ctx.callbacks.musicControls.stopBeat();
    }
}
