import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runAlienLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.initialPrompt || 'A strange signal from space.';
    ctx.callbacks.onMessage('Director', `👽 ALIEN CONTACT MODE: ${topic}`, '#2ecc71');

    const xenolinguist = 'scientist';
    const diplomat = 'comedian';
    const exobiologist = 'philosopher';

    // 1. Initial Contact
    await ctx.callbacks.onTurnStart(xenolinguist);
    await ctx.manager.chatForAgent(xenolinguist, `(You are a Xenolinguist. You just received a signal from an alien entity (the User). Describe the signal in scientific terms (frequency, modulation). Ask the entity to identify itself using prime numbers.)`, async (s) => await ctx.callbacks.onSpeak(s, xenolinguist, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const alienSignal = await ctx.waitForInput();
        if (alienSignal) {
            ctx.callbacks.onMessage('Alien Entity (You)', alienSignal, '#8e44ad');
        }

        if (!ctx.isRunning()) break;

        // 2. The Diplomat Tries Peace
        await ctx.callbacks.onTurnStart(diplomat);
        const diplomatPrompt = `(You are an Intergalactic Diplomat. interpret the alien's message: "${alienSignal}" as a gesture of peace (or war, if it was aggressive). Try to offer them a cultural exchange (e.g., Earth music or snacks). Be friendly but slightly terrified.)`;
        await ctx.manager.chatForAgent(diplomat, diplomatPrompt, async (s) => await ctx.callbacks.onSpeak(s, diplomat, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // 3. The Exobiologist Analyzes Biology
        await ctx.callbacks.onTurnStart(exobiologist);
        const bioPrompt = `(You are an Exobiologist. Analyze the alien's message: "${alienSignal}" for clues about their biology. speculate on their number of tentacles or eyes. Ask a probing question about their home world's atmosphere.)`;
        await ctx.manager.chatForAgent(exobiologist, bioPrompt, async (s) => await ctx.callbacks.onSpeak(s, exobiologist, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // 4. The Xenolinguist Decodes Meaning
        await ctx.callbacks.onTurnStart(xenolinguist);
        const linguistPrompt = `(You are a Xenolinguist. Attempt to translate the alien's message: "${alienSignal}" into a mathematical concept. Conclude with a request for further data (e.g., "Send the sequence for Pi").)`;
        await ctx.manager.chatForAgent(xenolinguist, linguistPrompt, async (s) => await ctx.callbacks.onSpeak(s, xenolinguist, {}));
        await ctx.callbacks.onTurnEnd();
    }
}
