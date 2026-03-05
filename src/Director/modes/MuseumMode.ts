import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runMuseumLoop(scenario: Scenario, ctx: ModeContext) {
    const exhibit = scenario.config?.museumExhibit || 'Everyday Objects of the 21st Century';
    ctx.callbacks.onMessage('Director', `🏛️ MUSEUM MODE: Touring the ${exhibit} Exhibit`, '#9b59b6');

    const deepGuide = 'philosopher';
    const fakeGuide = 'comedian';
    const factChecker = 'scientist';

    // 1. Intro
    ctx.callbacks.onTurnStart(deepGuide);
    await ctx.manager.chatForAgent(deepGuide, `(You are an overly analytical Museum Curator. Welcome the guest to the "${exhibit}" exhibit. Ask them what artifact they would like to examine first.)`, async (s) => await ctx.callbacks.onSpeak(s, deepGuide, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Visitor (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Deep Guide Analysis
        ctx.callbacks.onTurnStart(deepGuide);
        await ctx.manager.chatForAgent(deepGuide, `(CURATOR: The visitor pointed out the artifact: "${userInput}". Give a deep, profound, but completely misinterpreted philosophical meaning behind this mundane object.)`, async (s) => await ctx.callbacks.onSpeak(s, deepGuide, {}));
        ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Fake Guide Intrusion
        ctx.callbacks.onTurnStart(fakeGuide);
        await ctx.manager.chatForAgent(fakeGuide, `(GIFT SHOP MANAGER: Interrupt the Curator. Make up a completely fake, action-packed, and absurd historical event involving the object "${userInput}". Try to sell them a replica.)`, async (s) => await ctx.callbacks.onSpeak(s, fakeGuide, {}));
        ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Fact Checker Correction
        if (Math.random() > 0.4) {
            ctx.callbacks.onTurnStart(factChecker);
            await ctx.manager.chatForAgent(factChecker, `(SECURITY GUARD / HISTORIAN: Step in and correct both of them. Give the extremely boring, literal, and scientific explanation of what "${userInput}" actually is, ruining their fun.)`, async (s) => await ctx.callbacks.onSpeak(s, factChecker, {}));
            ctx.callbacks.onTurnEnd();
        }
    }
}
