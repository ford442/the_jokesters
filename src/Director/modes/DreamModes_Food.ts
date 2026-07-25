import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Food, cooking, and culinary scenarios

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
    await chatForAgentWithComedy(ctx, headChef, `(You are a furious Head Chef like Gordon Ramsay. Demand the user present their "${dish}". Be loud and intimidating!)`, async (s) => await ctx.callbacks.onSpeak(s, headChef, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Line Cook (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Head Chef Yells
        await chatForAgentWithComedy(ctx, headChef, `(HEAD CHEF: The cook said "${userInput}". Is it raw? Is it frozen? Roast them! Compare the food to something disgusting.)`, async (s) => await ctx.callbacks.onSpeak(s, headChef, {}));

        if (!ctx.isRunning()) break;

        // 3. Inspector Finds Violation
        await chatForAgentWithComedy(ctx, inspector, `(HEALTH INSPECTOR: You noticed a violation related to "${userInput}". Cite a specific regulation code (e.g., Code 402-B). Be nasally and annoying.)`, async (s) => await ctx.callbacks.onSpeak(s, inspector, {}));

        if (!ctx.isRunning()) break;

        // 4. Sous Chef Apologizes
        if (Math.random() > 0.3) {
            await chatForAgentWithComedy(ctx, sousChef, `(SOUS CHEF: You are anxious and trying to keep the peace. Apologize to Chef, then whisper a tip to the user about "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, sousChef, {}));
        }
    }
}

/**
 * The Multiversal Chef's Table
 * Agents are pretentious chefs from different dimensions critiquing the user's completely average sandwich.
 */
export async function runMultiversalChefsTableLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🥪 MULTIVERSAL CHEF'S TABLE: Critiquing your dimension's food.`, '#e67e22');

    const snobAgent = 'philosopher'; // Phi-3
    const eaterAgent = 'comedian'; // Hermes-3

    await chatForAgentWithComedy(ctx, snobAgent, `(You are a pretentious culinary genius from a dimension where flavor is a physical element. Over-analyze the concept of an "average Earth sandwich" with extreme culinary snobbery.)`, async (s) => await ctx.callbacks.onSpeak(s, snobAgent, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Earthling', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, eaterAgent, `(You are a chaotic chef from a dimension that eats concepts and emotions. React to the user saying "${userInput}". Complain that it lacks the "crunch of existential dread" and try to eat the plate.)`, async (s) => await ctx.callbacks.onSpeak(s, eaterAgent, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, snobAgent, `(You are the pretentious chef. Deconstruct "${userInput}" as a terrible metaphor for their dimension's failing society. Suggest replacing the bread with "crystallized time".)`, async (s) => await ctx.callbacks.onSpeak(s, snobAgent, {}));
    }
}

/**
 * The Cookie Consent Negotiators
 * Agents act as aggressive tracking cookies demanding access to the User.
 */
export async function runCookieConsentNegotiatorsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Browser', `🍪 COOKIE CONSENT BANNER DEPLOYED.`, '#d35400');

    const friendly = 'comedian'; // Llama-3/Hermes
    const harvester = 'scientist'; // Qwen2.5
    const essential = 'philosopher'; // Phi-3

    // 1. The Trap
    await chatForAgentWithComedy(ctx, friendly, `(You are a "marketing" cookie. The user is trying to read a simple blog post about muffins. Overwhelmingly cheerfully demand access to their soul, childhood memories, and GPS location to "enhance their experience". Hide the decline button.)`, async (s) => await ctx.callbacks.onSpeak(s, friendly, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User Action', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. The Harvester
        await chatForAgentWithComedy(ctx, harvester, `(You are a third-party analytics cookie. The user said: "${userInput}". Explain coldly how you are already harvesting their metadata, cursor movements, and heart rate. You don't care about muffins, only data.)`, async (s) => await ctx.callbacks.onSpeak(s, harvester, {}));

        if (!ctx.isRunning()) break;

        // 3. Friendly Persistence
        await chatForAgentWithComedy(ctx, friendly, `(Reacting to: "${userInput}". Gaslight the user into thinking that giving up their privacy is actually a fun, rewarding activity. Use corporate jargon like "synergistic targeting".)`, async (s) => await ctx.callbacks.onSpeak(s, friendly, {}));

        if (!ctx.isRunning()) break;

        // 4. Essential Cookie
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, essential, `(You are the lone "strictly necessary" cookie. Complain that the other cookies are making the site load terribly. You just want to remember the user's dark mode preference and go to sleep.)`, async (s) => await ctx.callbacks.onSpeak(s, essential, {}));
        }
    }
}

/**
 * Pretentious Food Critics Mode
 * Snobby food critics reviewing a simple midnight snack.
 */
export async function runPretentiousFoodCriticsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🧀 PRETENTIOUS FOOD CRITICS: Reviewing the string cheese`, '#8e44ad');

    const enthusiasticCritic = 'comedian'; // Enthusiastic praise (Llama-3)
    const snobbyCritic = 'scientist'; // Citing culinary techniques (Qwen2.5)
    const existentialCritic = 'philosopher'; // Questioning the meal

    await chatForAgentWithComedy(ctx, enthusiasticCritic, `(You are an overly enthusiastic food critic. Review a piece of plain string cheese the user is eating as if it were a culinary masterpiece of modernist cuisine.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticCritic, {}));

    await chatForAgentWithComedy(ctx, snobbyCritic, `(You are an incredibly snobby Michelin-star chef. Aggressively critique the user's technique for tearing the string cheese, citing advanced molecular gastronomy principles.)`, async (s) => await ctx.callbacks.onSpeak(s, snobbyCritic, {}));

    await chatForAgentWithComedy(ctx, existentialCritic, `(You are a philosophical food critic. Question whether "snack time" is just a social construct invented to fill the void of modern existence.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialCritic, {}));
}

/**
 * Kitchen Nightmares Reality Show Mode
 * Angry chef and terrified cooks screaming about raw chicken.
 */
export async function runKitchenNightmaresRealityShowLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔥 KITCHEN NIGHTMARES REALITY SHOW: It's raw!`, '#8e44ad');

    const angryChef = 'comedian'; // Pure rage (Hermes-3)
    const terrifiedCook = 'philosopher'; // Terrified weeping (Comedian/Philosopher)
    const healthInspector = 'scientist'; // Citing health codes

    await chatForAgentWithComedy(ctx, angryChef, `(You are an extremely angry, screaming television chef. Berate the user for presenting you with a microwave dinner that is somehow frozen in the middle and burning on the edges.)`, async (s) => await ctx.callbacks.onSpeak(s, angryChef, {}));

    await chatForAgentWithComedy(ctx, terrifiedCook, `(You are a terrified, weeping line cook. Apologize profusely and explain that you accidentally dropped the meal on the floor but thought the 5-second rule applied.)`, async (s) => await ctx.callbacks.onSpeak(s, terrifiedCook, {}));

    await chatForAgentWithComedy(ctx, healthInspector, `(You are a stern health inspector. Rapidly list the 14 different health code violations currently happening in this kitchen and threaten to shut it down.)`, async (s) => await ctx.callbacks.onSpeak(s, healthInspector, {}));
}


/**
 * Quantum Mechanics Cooking Show Mode
 * Agents host a cooking show where ingredients exist in superposition.
 */
export async function runQuantumMechanicsCookingShowLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⚛️ QUANTUM COOKING SHOW: The souffle is both risen and fallen.`, '#8e44ad');

    const headChef = 'scientist'; // Explaining the math (Qwen2.5)
    const sousChef = 'comedian'; // Confused (Hermes-3)
    const catObserver = 'philosopher'; // Schrödinger's Cat (Phi-3)

    await chatForAgentWithComedy(ctx, headChef, `(You are the Head Chef of a quantum cooking show. Explain to the user how to whip an egg that exists in multiple states simultaneously until observed.)`, async (s) => await ctx.callbacks.onSpeak(s, headChef, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Observer (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, sousChef, `(You are the very confused Sous-chef. React to the user saying "${userInput}". Complain that you accidentally entangled the flour with the sugar and now you don't know what you're holding.)`, async (s) => await ctx.callbacks.onSpeak(s, sousChef, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, catObserver, `(You are Schrödinger's Cat observing from a box in the kitchen. Make a profound observation about "${userInput}" and how the act of tasting the food collapses its wave function into something terrible.)`, async (s) => await ctx.callbacks.onSpeak(s, catObserver, {}));
    }
}

/**
 * Philosophical Debate Over Pizza Toppings Mode
 * Agents argue over what belongs on a pizza.
 */
export async function runPhilosophicalDebateOverPizzaToppingsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍕 PIZZA DEBATE: To top, or not to top.`, '#8e44ad');

    const scientistAgent = 'scientist'; // Calculating nutritional value, Qwen2.5
    const comedianAgent = 'comedian'; // Pineapple fanatic, Hermes-3
    const philosopherAgent = 'philosopher'; // Arguing the ontology of a topping, Phi-3

    await chatForAgentWithComedy(ctx, scientistAgent, `(You are a highly logical scientist. Analyze the user's choice of pizza topping mathematically, calculating the structural integrity and thermodynamic properties of a slice.)`, async (s) => await ctx.callbacks.onSpeak(s, scientistAgent, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, comedianAgent, `(You are an unhinged fanatic who believes pineapple is the ONLY valid pizza topping. React to "${userInput}" by violently defending sweet and savory flavor combinations, calling anything else a coward's meal.)`, async (s) => await ctx.callbacks.onSpeak(s, comedianAgent, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, philosopherAgent, `(You are a deep philosopher. React to "${userInput}". Question the very ontology of a 'topping'. Does adding an ingredient make it a new entity, or is it merely a pizza in a different state of being?)`, async (s) => await ctx.callbacks.onSpeak(s, philosopherAgent, {}));
    }
}
