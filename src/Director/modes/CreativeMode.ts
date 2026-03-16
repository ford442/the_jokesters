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

export async function runSilentFilmLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.silentFilmTopic || 'A pie eating contest';
    ctx.callbacks.onMessage('Director', `📽️ SILENT FILM ERA: ${topic}`, '#34495e');

    const physicalActor = 'comedian'; // Llama-3 equivalent (Physical Comedy)
    const literalActor = 'philosopher'; // Phi-3 equivalent (Literal Interpretation)
    const audience = 'scientist'; // Audience Reaction

    // 1. Scene Intro
    ctx.callbacks.onTurnStart(physicalActor);
    await ctx.manager.chatForAgent(physicalActor, `(SILENT FILM: You are an actor in a black-and-white silent film about "${topic}". You MUST NOT speak any dialogue. You can ONLY use emojis and describe physical actions between asterisks, like *slips on banana peel* 🍌🤕. React to the user walking onto the set.)`, async (s) => await ctx.callbacks.onSpeak(s, physicalActor, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Co-Star (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Literal Actor Misunderstands
        await ctx.manager.chatForAgent(literalActor, `(SILENT FILM: The co-star did: "${userInput}". You are an actor who takes everything perfectly literally but you still MUST NOT speak dialogue. Use ONLY emojis and physical actions between asterisks to show your reaction and misunderstanding of their action. *looks confused and tries to eat hat* 🎩🍽️)`, async (s) => await ctx.callbacks.onSpeak(s, literalActor, {}));

        if (!ctx.isRunning()) break;

        // 3. Audience Reacts
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(audience, `(SILENT FILM AUDIENCE: You are watching the film and must react with a title card. Provide a short, melodramatic text title card describing the emotion of the scene, like: "Alas! The pie was poisoned!" Or just react to the absurdity.)`, async (s) => await ctx.callbacks.onSpeak(s, audience, {}));
        }

        if (!ctx.isRunning()) break;

        // 4. Physical Actor Escalates
        await ctx.manager.chatForAgent(physicalActor, `(SILENT FILM: Escalate the physical comedy of "${topic}". DO NOT USE DIALOGUE. Use ONLY emojis and physical actions between asterisks to do something increasingly slapstick. *throws pie at wall* 🥧💥🏃‍♂️)`, async (s) => await ctx.callbacks.onSpeak(s, physicalActor, {}));
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

export async function runHeistPlannerLoop(scenario: Scenario, ctx: ModeContext) {
    const target = scenario.config?.heistTarget || 'the moon';
    ctx.callbacks.onMessage('Director', `💎 HEIST PLANNER: Stealing ${target}`, '#8e44ad');

    const mastermind = 'philosopher'; // Phi-3: Mastermind
    const wildcard = 'comedian'; // Hermes-3: Wildcard
    const techExpert = 'scientist';

    // 1. Intro
    ctx.callbacks.onTurnStart(mastermind);
    await ctx.manager.chatForAgent(mastermind, `(HEIST PLANNER: You are the meticulous mastermind behind a crew planning to steal "${target}". The User is your new recruit. Welcome them to the safehouse and outline phase one of the heist. Be overly complicated.)`, async (s) => await ctx.callbacks.onSpeak(s, mastermind, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Recruit (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Wildcard reacts
            await ctx.manager.chatForAgent(wildcard, `(HEIST PLANNER: The recruit said: "${userInput}". You are the chaotic wildcard of the crew. Suggest a completely unhinged and violent addition to the plan involving explosives or rabid animals.)`, async (s) => await ctx.callbacks.onSpeak(s, wildcard, {}));
        } else if (roll < 0.66) {
            // Tech Expert reacts
            await ctx.manager.chatForAgent(techExpert, `(HEIST PLANNER: The recruit said: "${userInput}". You are the tech expert (hacker). Point out a ridiculous technical flaw in the current plan and use excessive hacker jargon to propose a solution to bypass the mainframe.)`, async (s) => await ctx.callbacks.onSpeak(s, techExpert, {}));
        } else {
            // Mastermind corrects
            await ctx.manager.chatForAgent(mastermind, `(HEIST PLANNER: The recruit said: "${userInput}". Analyze the state of the plan. Correct the others if they are being too chaotic. Ask the recruit for the next crucial detail of the heist.)`, async (s) => await ctx.callbacks.onSpeak(s, mastermind, {}));
        }
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
