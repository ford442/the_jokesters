import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runMysteryLoop(scenario: Scenario, ctx: ModeContext) {
    const crime = scenario.config?.mysterySetting || 'The Case of the Missing Sandwich';
    ctx.callbacks.onMessage('Director', `🕵️ MYSTERY MODE: ${crime}`, '#2c3e50');

    const detective = 'scientist';
    const badCop = 'comedian';
    const mystic = 'philosopher';

    // 1. Detective Intro
    ctx.callbacks.onTurnStart(detective);
    await ctx.manager.chatForAgent(detective, `(You are a noir detective. The user is a suspect in "${crime}". Introduce yourself and the case. Be gritty and suspicious.)`, async (s) => await ctx.callbacks.onSpeak(s, detective, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Suspect (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Bad Cop Interrogation
        if (Math.random() > 0.3) {
            await ctx.manager.chatForAgent(badCop, `(BAD COP: The suspect said: "${userInput}". Get angry! Accuse them of lying! Slam the table! Make up a ridiculous piece of evidence.)`, async (s) => await ctx.callbacks.onSpeak(s, badCop, {}));
        }

        if (!ctx.isRunning()) break;

        // 3. Detective Analysis
        await ctx.manager.chatForAgent(detective, `(DETECTIVE: Analyze the suspect's statement: "${userInput}". Point out a contradiction or ask a probing follow-up question.)`, async (s) => await ctx.callbacks.onSpeak(s, detective, {}));

        if (!ctx.isRunning()) break;

        // 4. Mystic Clue (Occasional)
        if (Math.random() > 0.6) {
            await ctx.manager.chatForAgent(mystic, `(MYSTIC WITNESS: You are a strange witness who saw something supernatural. Interrupt with a cryptic clue related to "${crime}" and what the suspect just said.)`, async (s) => await ctx.callbacks.onSpeak(s, mystic, {}));
        }
    }
}

export async function runPitchLoop(scenario: Scenario, ctx: ModeContext) {
    const genre = scenario.config?.pitchGenre || 'Sci-Fi Action';
    ctx.callbacks.onMessage('Director', `🎬 MOVIE PITCH MODE: Pitching a ${genre} movie`, '#e67e22');

    const pitchMan = 'comedian';
    const writer = 'philosopher';
    const analyst = 'scientist';

    // 1. Pitch Man Intro
    ctx.callbacks.onTurnStart(pitchMan);
    await ctx.manager.chatForAgent(pitchMan, `(You are a high-energy Hollywood producer. You are pitching a new ${genre} movie to the Studio Exec (User). Start with a high-concept "What if..." hook. Be excited!)`, async (s) => await ctx.callbacks.onSpeak(s, pitchMan, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Studio Exec (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Writer Expands
        await ctx.manager.chatForAgent(writer, `(SCREENWRITER: The Exec said: "${userInput}". Incorporate this feedback into the lore. Add a deep, philosophical theme or plot twist to the movie.)`, async (s) => await ctx.callbacks.onSpeak(s, writer, {}));

        if (!ctx.isRunning()) break;

        // 3. Analyst Critiques
        await ctx.manager.chatForAgent(analyst, `(MARKET ANALYST: Analyze the commercial viability of this idea. Comment on the budget, target demographic, or merchandising opportunities. Be cynical.)`, async (s) => await ctx.callbacks.onSpeak(s, analyst, {}));

        if (!ctx.isRunning()) break;

        // 4. Pitch Man Closes
        await ctx.manager.chatForAgent(pitchMan, `(PRODUCER: Hype up the new changes! Ask the Exec for the next plot point or casting decision.)`, async (s) => await ctx.callbacks.onSpeak(s, pitchMan, {}));
    }
}

export async function runProceduralLoop(scenario: Scenario, ctx: ModeContext) {
    const vibe = scenario.config?.proceduralVibe || 'An unexpected encounter at a grocery store';
    ctx.callbacks.onMessage('Director', `✨ PROCEDURAL MODE: Vibe - ${vibe}`, '#3498db');

    const agent1 = 'comedian';
    const agent2 = 'philosopher';
    const agent3 = 'scientist';

    // 1. Initial Scene Setup by Agent 1
    ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(You are in a newly generated scenario based on this vibe: "${vibe}". Describe the setting and your character's bizarre role in it. Address the User who just walked in.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Agent 2 Reacts and Complicates
        await ctx.manager.chatForAgent(agent2, `(PROCEDURAL SCENE: The user said: "${userInput}". React to this while building on the strange vibe of "${vibe}". Add a new, unexpected element to the scene.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));

        if (!ctx.isRunning()) break;

        // 3. Agent 3 Analyzes
        if (Math.random() > 0.3) {
            await ctx.manager.chatForAgent(agent3, `(PROCEDURAL SCENE: Analyze the absurdity of what is happening in this "${vibe}" scenario. Try to apply logic to a completely illogical situation.)`, async (s) => await ctx.callbacks.onSpeak(s, agent3, {}));
        }

        if (!ctx.isRunning()) break;

        // 4. Agent 1 Escalates
        if (Math.random() > 0.5) {
            await ctx.manager.chatForAgent(agent1, `(PROCEDURAL SCENE: Escalate the situation! The vibe is "${vibe}". Make something dramatic happen!)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
        }
    }
}
