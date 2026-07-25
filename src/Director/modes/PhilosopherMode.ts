import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

export async function runPhilosopherLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.philosopherTopic || 'The Trolley Problem';
    ctx.callbacks.onMessage('Director', `🧙 PHILOSOPHER'S STONE: Debating "${topic}"`, '#9b59b6');

    // Cast:
    const logician = 'philosopher';
    const skeptic = 'scientist';
    const absurdist = 'comedian';

    let intensity = 1;
    const maxIntensity = 5;

    // 1. Introduction (Logician)
    await chatForAgentWithComedy(ctx, logician, `(You are a logician starting a debate on the paradox: "${topic}". State the core contradiction clearly and soberly. Do not be funny yet.)`, async (s) => await ctx.callbacks.onSpeak(s, logician, {}));

    while (ctx.isRunning()) {
        // Check for user interruption (Heckle/Comment)
        let userInterjection = '';
        if (ctx.interruptQueue.length > 0) {
            userInterjection = ctx.interruptQueue.shift() || '';
            ctx.callbacks.onMessage('You (Interrupt)', userInterjection, '#ffffff');
        }

        // 2. The Skeptic Attacks
        if (ctx.isRunning()) {
            await ctx.callbacks.onTurnStart(skeptic);
            const skepticPrompt = `(You are a skeptic. Attack the previous point about "${topic}" with cold logic. Point out a flaw. Intensity Level: ${intensity}/${maxIntensity}. ${userInterjection ? `Address the user's comment: "${userInterjection}".` : ''})`;
            await chatForAgentWithComedy(ctx, skeptic, skepticPrompt, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
        }

        if (!ctx.isRunning()) break;

        // Check interrupt again
        if (ctx.interruptQueue.length > 0) {
            userInterjection = ctx.interruptQueue.shift() || '';
             ctx.callbacks.onMessage('You (Interrupt)', userInterjection, '#ffffff');
        } else {
            userInterjection = '';
        }

        // 3. The Absurdist Escalates
        if (ctx.isRunning()) {
            await ctx.callbacks.onTurnStart(absurdist);
            const absurdistPrompt = `(You are an absurdist philosopher. Take the debate to a weird, surreal place. Use a metaphor involving food or animals. Intensity Level: ${intensity}/${maxIntensity}. ${userInterjection ? `Respond to "${userInterjection}" with nonsense.` : ''})`;
            await chatForAgentWithComedy(ctx, absurdist, absurdistPrompt, async (s) => await ctx.callbacks.onSpeak(s, absurdist, {}));
        }

        if (!ctx.isRunning()) break;

        // 4. The Logician Rebuttals (High Intensity)
        intensity = Math.min(intensity + 1, maxIntensity);
        if (ctx.isRunning()) {
            await ctx.callbacks.onTurnStart(logician);
            const logicianPrompt = `(You are a logician losing your patience. Rebut the absurdist with a complex, abstract counter-argument. Use big words. Intensity Level: ${intensity}/${maxIntensity}. Scream if necessary (use CAPS). ${userInterjection ? `Dismiss the user's comment: "${userInterjection}".` : ''})`;
            await chatForAgentWithComedy(ctx, logician, logicianPrompt, async (s) => await ctx.callbacks.onSpeak(s, logician, {}));
        }

        if (intensity >= maxIntensity) {
             ctx.callbacks.onMessage('System', '⚠️ PARADOX CRITICAL MASS REACHED', '#ff0000');
             // Reset intensity to avoid infinite screaming loop feeling stale
             intensity = 3;
        }
    }
}
