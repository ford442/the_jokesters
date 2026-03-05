import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runCookingShowLoop(scenario: Scenario, ctx: ModeContext) {
    const dish = scenario.config?.cookingDish || 'A Mystery Box Challenge';
    ctx.callbacks.onMessage('Director', `🍳 COOKING SHOW MODE: The ${dish} Challenge`, '#e67e22');

    const molecular = 'scientist';
    const conceptual = 'philosopher';
    const chaos = 'comedian';

    // 1. Host Intro
    ctx.callbacks.onTurnStart(chaos);
    await ctx.manager.chatForAgent(chaos, `(You are the loud, dramatic host of a chaotic cooking competition. Welcome the User, who is the head judge. Announce that the challenge is to make "${dish}". Ask the judge for their expectations.)`, async (s) => await ctx.callbacks.onSpeak(s, chaos, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Judge (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Molecular Chef Attempts
        ctx.callbacks.onTurnStart(molecular);
        await ctx.manager.chatForAgent(molecular, `(MOLECULAR GASTRONOMIST: You are competing chef 1. The judge requested: "${userInput}". Describe the absurd, overly scientific way you are preparing your version of the dish. Mention centrifuges, liquid nitrogen, or deconstruction. Something is going wrong.)`, async (s) => await ctx.callbacks.onSpeak(s, molecular, {}));
        ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Conceptual Chef Sabotage
        ctx.callbacks.onTurnStart(conceptual);
        await ctx.manager.chatForAgent(conceptual, `(CONCEPTUAL CHEF: You are competing chef 2. Your dish is purely metaphorical and you are ignoring the rules. Describe how you are sabotaging Chef 1's scientific dish with abstract concepts or terrible ingredients while explaining the deeper meaning of hunger.)`, async (s) => await ctx.callbacks.onSpeak(s, conceptual, {}));
        ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Host Reaction
        if (Math.random() > 0.5) {
            ctx.callbacks.onTurnStart(chaos);
            await ctx.manager.chatForAgent(chaos, `(HOST: Panic! Describe a fire or an explosion on set caused by the chefs. Demand that the Judge (User) intervene or declare a winner immediately before the studio burns down.)`, async (s) => await ctx.callbacks.onSpeak(s, chaos, {}));
            ctx.callbacks.onTurnEnd();
        }
    }
}
