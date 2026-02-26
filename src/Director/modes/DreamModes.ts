import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

/**
 * Time Travel Paradox Mode
 * Agents from different eras (Past, Present, Future) argue about the timeline.
 */
export async function runTimeTravelLoop(scenario: Scenario, ctx: ModeContext) {
    const era = scenario.config?.timeEra || 'The Victorian Era';
    ctx.callbacks.onMessage('Director', `⏳ TIME TRAVEL MODE: Destination - ${era}`, '#8e44ad');

    const past = 'comedian'; // The Victorian
    const present = 'philosopher'; // The Modernist
    const future = 'scientist'; // The Cyborg

    // 1. Arrival
    ctx.callbacks.onTurnStart(future);
    await ctx.manager.chatForAgent(future, `(You are a Cyborg from the year 3024. You just crash-landed the time machine in ${era}. Blame the primitive technology. Speak like a robot.)`, async (s) => await ctx.callbacks.onSpeak(s, future, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Past Reacts
        await ctx.manager.chatForAgent(past, `(You are a person from ${era}. React with shock to the User saying: "${userInput}". Use period-appropriate slang. Be confused by modern concepts.)`, async (s) => await ctx.callbacks.onSpeak(s, past, {}));

        if (!ctx.isRunning()) break;

        // 3. Future Analyzes
        await ctx.manager.chatForAgent(future, `(You are a Cyborg. Analyze the historical probability of "${userInput}" altering the timeline. Be cold and calculating.)`, async (s) => await ctx.callbacks.onSpeak(s, future, {}));

        if (!ctx.isRunning()) break;

        // 4. Present Mediates
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(present, `(You are a modern person stuck in the middle. Try to explain "${userInput}" to the Victorian using analogies, while telling the Cyborg to chill.)`, async (s) => await ctx.callbacks.onSpeak(s, present, {}));
        }
    }
}

/**
 * Chef's Kitchen Mode
 * Agents act as a head chef, sous chef, and health inspector critiquing a dish.
 */
export async function runChefLoop(scenario: Scenario, ctx: ModeContext) {
    const dish = scenario.config?.chefDish || 'A Mystery Dish';
    ctx.callbacks.onMessage('Director', `👨‍🍳 CHEF MODE: Judging ${dish}`, '#e67e22');

    const headChef = 'comedian'; // Gordon Ramsay style
    const sousChef = 'philosopher'; // Anxious
    const inspector = 'scientist'; // Pedantic Health Inspector

    // 1. Intro
    ctx.callbacks.onTurnStart(headChef);
    await ctx.manager.chatForAgent(headChef, `(You are a furious Head Chef like Gordon Ramsay. Demand the user present their "${dish}". Be loud and intimidating!)`, async (s) => await ctx.callbacks.onSpeak(s, headChef, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Line Cook (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Head Chef Yells
        await ctx.manager.chatForAgent(headChef, `(HEAD CHEF: The cook said "${userInput}". Is it raw? Is it frozen? Roast them! Compare the food to something disgusting.)`, async (s) => await ctx.callbacks.onSpeak(s, headChef, {}));

        if (!ctx.isRunning()) break;

        // 3. Inspector Finds Violation
        await ctx.manager.chatForAgent(inspector, `(HEALTH INSPECTOR: You noticed a violation related to "${userInput}". Cite a specific regulation code (e.g., Code 402-B). Be nasally and annoying.)`, async (s) => await ctx.callbacks.onSpeak(s, inspector, {}));

        if (!ctx.isRunning()) break;

        // 4. Sous Chef Apologizes
        if (Math.random() > 0.3) {
            await ctx.manager.chatForAgent(sousChef, `(SOUS CHEF: You are anxious and trying to keep the peace. Apologize to Chef, then whisper a tip to the user about "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, sousChef, {}));
        }
    }
}

/**
 * Medical Drama Mode
 * Agents enact a high-stakes surgery scene with absurd medical jargon.
 */
export async function runMedicalLoop(scenario: Scenario, ctx: ModeContext) {
    const condition = scenario.config?.medicalCondition || 'Unknown ailment';
    ctx.callbacks.onMessage('Director', `🏥 MEDICAL DRAMA: Treating ${condition}`, '#e74c3c');

    const surgeon = 'scientist'; // God complex
    const resident = 'comedian'; // Clueless
    const anesthesiologist = 'philosopher'; // High/Sleepy

    // 1. Surgeon Intro
    ctx.callbacks.onTurnStart(surgeon);
    await ctx.manager.chatForAgent(surgeon, `(You are a brilliant but arrogant surgeon. We are in the OR treating "${condition}". Demand a scalpel or music. Ignore the patient.)`, async (s) => await ctx.callbacks.onSpeak(s, surgeon, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Patient (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Surgeon Dismisses
        await ctx.manager.chatForAgent(surgeon, `(SURGEON: The patient is awake and said "${userInput}". Tell the anesthesiologist to put them under! You have work to do!)`, async (s) => await ctx.callbacks.onSpeak(s, surgeon, {}));

        if (!ctx.isRunning()) break;

        // 3. Resident Panic
        await ctx.manager.chatForAgent(resident, `(RESIDENT: You have no idea what you are doing. React to "${userInput}" by suggesting a completely wrong and absurd treatment (e.g., leeches, amputation). Panicking!)`, async (s) => await ctx.callbacks.onSpeak(s, resident, {}));

        if (!ctx.isRunning()) break;

        // 4. Anesthesiologist Vibes
        if (Math.random() > 0.2) {
            await ctx.manager.chatForAgent(anesthesiologist, `(ANESTHESIOLOGIST: You are very relaxed, maybe high on the supply. Say something philosophical about pain or sleep related to "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, anesthesiologist, {}));
        }
    }
}
